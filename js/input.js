// 키보드 방향키 + 터치 스와이프 입력. 판정된 방향 문자열을 콜백으로 전달할 뿐,
// 게임 상태(gameState.js)를 직접 참조하지 않는다.

const ARROW_KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

function bindKeyboardInput(onDirection) {
  document.addEventListener("keydown", (event) => {
    const direction = ARROW_KEY_TO_DIRECTION[event.key];
    if (!direction) return;
    event.preventDefault();
    onDirection(direction);
  });
}

const SWIPE_THRESHOLD_PX = 30;

function bindSwipeInput(boardEl, onDirection) {
  let startX = 0;
  let startY = 0;

  boardEl.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    },
    { passive: true }
  );

  boardEl.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    { passive: false }
  );

  boardEl.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX && Math.abs(deltaY) < SWIPE_THRESHOLD_PX) {
      return;
    }

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      onDirection(deltaX > 0 ? "right" : "left");
    } else {
      onDirection(deltaY > 0 ? "down" : "up");
    }
  });
}
