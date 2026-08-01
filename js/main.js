// 엔트리포인트: grid/merge/gameState/storage/timer/stats(Firestore)와 render/input(UI)를 조립한다.

(function () {
  const boardEl = document.getElementById("board");
  const timerEl = document.getElementById("timer");
  const restartBtn = document.getElementById("restart-btn");
  const leaderboardBody = document.getElementById("leaderboard-body");
  const overlayEls = {
    overlay: document.getElementById("overlay"),
    message: document.getElementById("overlay-message"),
    detail: document.getElementById("overlay-detail"),
    nicknameForm: document.getElementById("overlay-nickname-form"),
    nicknameInput: document.getElementById("overlay-nickname-input"),
    countrySelect: document.getElementById("overlay-country-select"),
    status: document.getElementById("overlay-status"),
    percentile: document.getElementById("overlay-percentile"),
  };
  const overlaySubmitBtn = document.getElementById("overlay-submit-btn");
  const overlayRetryBtn = document.getElementById("overlay-retry-btn");
  const startOverlay = document.getElementById("start-overlay");
  const startBtn = document.getElementById("start-btn");

  const NICKNAME_KEY = "wg2048-nickname";
  const COUNTRY_KEY = "wg2048-country";

  populateCountrySelect(overlayEls.countrySelect);

  const state = createGameState();
  const board = buildBoardCells(boardEl);
  const timer = createTimer();

  // 재시작 시 증가시켜, 이전 판에서 걸어둔 저장 요청의 응답이 새 판의 화면을 덮어쓰지 않도록 막는다.
  let runToken = 0;

  // 슬라이드+병합 애니메이션이 재생되는 동안(renderBoard의 onDone 호출 전) true — 이 사이에
  // 들어온 방향 입력은 무시해서, 애니메이션이 겹쳐 깨지는 것을 막는다(원작 2048과 동일한 동작).
  let animating = false;

  // "게임 시작" 버튼을 누르기 전까지 true — 페이지 로드와 동시에 타이머가 돌지 않도록,
  // 시작 전에는 방향키/스와이프 입력을 전부 무시한다.
  let started = false;

  function loadLeaderboard() {
    fetchTopScores().then(
      (entries) => renderLeaderboard(leaderboardBody, entries),
      (err) => {
        // 브라우저 콘솔에서 실패 원인(권한/색인/네트워크 등)을 확인할 수 있도록 로그를 남긴다.
        console.error("Failed to load leaderboard (랭킹 조회 실패):", err);
        renderLeaderboardError(leaderboardBody);
      }
    );
  }

  function submitAndShowResult(token, elapsedMs, nickname, country) {
    submitResult({
      elapsedMs,
      nickname,
      country,
    }).then(
      (result) => {
        if (token !== runToken) return;
        renderSubmitted(overlayEls, result);
        loadLeaderboard();
      },
      (err) => {
        if (token !== runToken) return;
        // 흔한 원인: Firebase 콘솔에서 익명 인증 미활성화(auth/operation-not-allowed),
        // firestore.rules 미게시(permission-denied), 네트워크 문제 등 — 콘솔에서 코드 확인.
        console.error("Failed to save result (기록 저장 실패):", err);
        renderSubmitError(overlayEls);
      }
    );
  }

  function finishGame() {
    const elapsedMs = stopTimer(timer);
    renderGameEndOverlay(overlayEls, state, elapsedMs);

    // 2048에 도달하지 못한 판은 애초에 Firestore에 기록하지 않는다 — 랭킹은 2048 달성자만 대상.
    if (!state.won) return;

    const token = runToken;
    overlayEls.nicknameInput.value = localStorage.getItem(NICKNAME_KEY) || "";
    overlayEls.countrySelect.value = localStorage.getItem(COUNTRY_KEY) || "";
    overlaySubmitBtn.onclick = () => {
      const nickname = overlayEls.nicknameInput.value.trim();
      const country = overlayEls.countrySelect.value;
      if (nickname) localStorage.setItem(NICKNAME_KEY, nickname);
      if (country) localStorage.setItem(COUNTRY_KEY, country);
      overlayEls.nicknameForm.classList.add("hidden");
      overlayEls.status.textContent = "Saving your result...";
      submitAndShowResult(token, elapsedMs, nickname, country);
    };
  }

  function handleDirection(direction) {
    if (!started || state.finished || animating) return;

    const { moved, tileMoves, spawnedCell } = move(state, direction);
    if (!moved) return;

    animating = true;
    renderBoard(board, state.grid, tileMoves, spawnedCell, () => {
      animating = false;
    });

    if (state.finished) {
      finishGame();
    }
  }

  function startNewRun() {
    runToken += 1;
    animating = false;
    started = true;
    startOverlay.classList.add("hidden");
    restartGame(state);
    hideOverlay(overlayEls);
    renderBoard(board, state.grid);
    startTimer(timer, (elapsedMs) => renderTimer(timerEl, elapsedMs));
  }

  bindKeyboardInput(handleDirection);
  bindSwipeInput(boardEl, handleDirection);

  restartBtn.addEventListener("click", startNewRun);
  overlayRetryBtn.addEventListener("click", startNewRun);
  startBtn.addEventListener("click", startNewRun);

  // 시작 버튼을 누르기 전에는 보드를 빈 칸(배경 슬롯)만 보여주고, 점수/타이머는 건드리지 않는다.
  loadLeaderboard();
})();
