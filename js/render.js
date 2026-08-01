// DOM 렌더링 전담. 게임 규칙이나 Firestore 통신은 모르고, 넘겨받은 state/결과만 그린다.
//
// 보드는 두 레이어로 구성된다:
//  - 배경 칸(.tile-slot) 16개: 항상 같은 자리에 고정, 값/색을 갖지 않는다.
//  - 타일 조각(.tile-piece): 절대좌표로 배치되어 원작 2048처럼 슬라이드하며 움직인다.
// 타일 조각의 정체성(같은 DOM 엘리먼트가 계속 이동)은 병합되지 않은 타일에 한해 유지되고,
// 병합된 두 타일은 도착 후 제거되고 그 자리에 새 타일이 생겨 팝 애니메이션을 재생한다.

// tile-piece의 CSS transition(transform) 시간과 반드시 같은 값을 유지해야 한다. (css/style.css)
const SLIDE_MS = 100;

function buildBoardCells(boardEl) {
  boardEl.innerHTML = "";
  const slots = [];
  for (let r = 0; r < 4; r++) {
    const row = [];
    for (let c = 0; c < 4; c++) {
      const slotEl = document.createElement("div");
      slotEl.className = "tile-slot";
      boardEl.appendChild(slotEl);
      row.push(slotEl);
    }
    slots.push(row);
  }
  return { boardEl, slots, pieces: new Map(), timeoutId: null };
}

function pieceKey(row, col) {
  return `${row},${col}`;
}

// 조각을 슬롯과 같은 크기/좌표로 배치한다. 이미 화면에 있는 조각이면 transform 변경이 CSS
// transition을 트리거해 슬라이드 애니메이션이 재생되고, 막 생성된 조각이면 첫 페인트부터
// 이 위치로 그려지므로 애니메이션 없이 제자리에 나타난다.
function positionPiece(pieceEl, slotEl) {
  pieceEl.style.width = `${slotEl.offsetWidth}px`;
  pieceEl.style.height = `${slotEl.offsetHeight}px`;
  pieceEl.style.transform = `translate(${slotEl.offsetLeft}px, ${slotEl.offsetTop}px)`;
}

// animClass가 있으면 등장과 동시에 팝/스폰 애니메이션을 재생한다(병합 결과 또는 새로 생긴 타일).
function createPiece(board, row, col, value, animClass = null) {
  const pieceEl = document.createElement("div");
  pieceEl.className = "tile-piece";

  const inner = document.createElement("div");
  inner.className = animClass ? `tile-piece-inner tile-${value} ${animClass}` : `tile-piece-inner tile-${value}`;
  inner.textContent = String(value);
  pieceEl.appendChild(inner);

  positionPiece(pieceEl, board.slots[row][col]);
  board.boardEl.appendChild(pieceEl);
  return pieceEl;
}

// tileMoves가 비어있으면(첫 렌더링, 재시작, 테스트용 강제승리) 애니메이션 없이 grid를 그대로 그린다.
// tileMoves가 있으면(실제 이동) 기존 조각을 목적지로 슬라이드시키고, 슬라이드가 끝난 뒤
// 병합된 타일을 새 타일로 교체하고 새로 생긴 타일을 등장시킨다.
// onDone은 이번 렌더(슬라이드+병합/스폰 포함)가 완전히 끝났을 때 호출된다 — 호출부(main.js)가
// 이걸로 다음 입력을 잠갔다 풀어서, 애니메이션 도중 다음 이동이 겹쳐 깨지는 것을 막는다.
function renderBoard(board, grid, tileMoves = [], spawnedCell = null, onDone = null) {
  const { boardEl, slots, pieces } = board;

  // 이전 이동의 병합/스폰 콜백이 아직 안 끝났는데 새로 렌더링하는 경우(재시작 등) 그 콜백이
  // 나중에 뒤늦게 실행되며 이미 지워진 조각을 참조해 유령 타일을 만드는 것을 막는다.
  if (board.timeoutId !== null) {
    clearTimeout(board.timeoutId);
    board.timeoutId = null;
  }

  if (tileMoves.length === 0) {
    pieces.forEach((pieceEl) => pieceEl.remove());
    pieces.clear();
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) continue;
        pieces.set(pieceKey(r, c), createPiece(board, r, c, grid[r][c]));
      }
    }
    if (onDone) onDone();
    return;
  }

  const nextPieces = new Map();
  const arrivingMerges = new Map(); // "row,col" -> { value, elements }

  tileMoves.forEach((m) => {
    const fromEl = pieces.get(pieceKey(m.from.row, m.from.col));
    if (!fromEl) return;
    positionPiece(fromEl, slots[m.to.row][m.to.col]);

    if (m.merged) {
      const key = pieceKey(m.to.row, m.to.col);
      const entry = arrivingMerges.get(key) || { value: m.value * 2, elements: [] };
      entry.elements.push(fromEl);
      arrivingMerges.set(key, entry);
    } else {
      nextPieces.set(pieceKey(m.to.row, m.to.col), fromEl);
    }
  });

  board.timeoutId = setTimeout(() => {
    board.timeoutId = null;

    arrivingMerges.forEach((entry, key) => {
      entry.elements.forEach((el) => el.remove());
      const [row, col] = key.split(",").map(Number);
      nextPieces.set(key, createPiece(board, row, col, entry.value, "tile-pop-anim"));
    });

    if (spawnedCell) {
      const { row, col } = spawnedCell;
      nextPieces.set(pieceKey(row, col), createPiece(board, row, col, grid[row][col], "tile-spawn-anim"));
    }

    pieces.clear();
    nextPieces.forEach((el, key) => pieces.set(key, el));

    if (onDone) onDone();
  }, SLIDE_MS);
}

function renderTimer(timerEl, elapsedMs) {
  timerEl.textContent = formatElapsed(elapsedMs);
}

function hideOverlay(overlayEls) {
  overlayEls.overlay.classList.add("hidden");
  overlayEls.nicknameForm.classList.add("hidden");
  overlayEls.nicknameInput.value = "";
  overlayEls.status.textContent = "";
  overlayEls.percentile.textContent = "";
}

// 게임이 막 끝났을 때(승리 또는 게임오버) 결과를 보여준다.
// 승리 시에는 닉네임 입력 폼을 노출하고(글로벌 랭킹에 이름을 올리기 위함), 서버 저장이 끝나기 전까지 "저장 중" 상태를 표시한다.
// 2048에 도달하지 못한 판은 애초에 저장되지 않으므로(랭킹은 2048 달성자만 대상), 그 사실을 바로 안내한다.
function renderGameEndOverlay(overlayEls, state, elapsedMs) {
  const { overlay, message, detail, nicknameForm, status, percentile } = overlayEls;

  overlay.classList.remove("hidden");
  message.textContent = state.won ? "You reached 2048!" : "Game Over!";

  detail.textContent = state.won
    ? `Max Tile: ${state.maxTile} · Time: ${formatElapsed(elapsedMs)}`
    : `Max Tile: ${state.maxTile}`;

  nicknameForm.classList.toggle("hidden", !state.won);
  status.textContent = state.won
    ? "Saving your result..."
    : "Not ranked — only 2048 finishes count. Try again!";
  percentile.textContent = "";
}

// Firestore 저장 + 집계 쿼리가 끝난 뒤, 2048 달성자 중 이번 판의 순위를 보여준다(퍼센트 아님).
function renderSubmitted(overlayEls, result) {
  overlayEls.nicknameForm.classList.add("hidden");
  overlayEls.status.textContent = "";
  overlayEls.percentile.textContent =
    result.total <= 1
      ? "You're the first finisher — rankings start next run!"
      : `Rank #${result.rank} of ${result.total} finishers worldwide`;
}

// 네트워크 문제 등으로 저장/집계에 실패했을 때 보여준다.
function renderSubmitError(overlayEls) {
  overlayEls.nicknameForm.classList.add("hidden");
  overlayEls.status.textContent = "";
  overlayEls.percentile.textContent = "Couldn't save — check your connection and retry.";
}

// 글로벌 랭킹(2048 달성 최고 기록) 테이블을 그린다.
function renderLeaderboard(tbodyEl, entries) {
  if (entries.length === 0) {
    tbodyEl.innerHTML = '<tr><td colspan="4" class="leaderboard-empty">No finishers yet — be the first!</td></tr>';
    return;
  }

  tbodyEl.innerHTML = "";
  entries.forEach((entry, index) => {
    const row = document.createElement("tr");
    if (index < 3) row.className = `rank-top rank-${index + 1}`;

    const rankCell = document.createElement("td");
    rankCell.textContent = String(index + 1);

    const nicknameCell = document.createElement("td");
    nicknameCell.textContent = entry.nickname;

    const countryCell = document.createElement("td");
    countryCell.textContent = entry.country ? `${countryFlagEmoji(entry.country)} ${entry.country}` : "—";

    const timeCell = document.createElement("td");
    timeCell.textContent = formatElapsed(entry.elapsedMs);

    row.append(rankCell, nicknameCell, countryCell, timeCell);
    tbodyEl.appendChild(row);
  });
}

function renderLeaderboardError(tbodyEl) {
  tbodyEl.innerHTML = '<tr><td colspan="4">Couldn\'t load the leaderboard.</td></tr>';
}
