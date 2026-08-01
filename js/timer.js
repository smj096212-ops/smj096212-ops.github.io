// 게임 진행 시간 측정. 그리드/점수 로직을 모르는 독립 모듈.

function createTimer() {
  return { startedAt: null, elapsedMs: 0, intervalId: null };
}

function startTimer(timer, onTick) {
  stopTimer(timer);
  timer.startedAt = Date.now();
  timer.elapsedMs = 0;
  timer.intervalId = setInterval(() => {
    timer.elapsedMs = Date.now() - timer.startedAt;
    onTick(timer.elapsedMs);
  }, 100);
}

// 실행 중일 때만 경과 시간을 최종 계산하고 멈춘다. 이미 멈춰 있으면 마지막 값을 그대로 반환
// (재호출 시 startedAt 기준으로 다시 계산하면 정지 이후 흐른 시간이 더해지는 버그가 생기므로 주의).
function stopTimer(timer) {
  if (timer.intervalId !== null) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
    timer.elapsedMs = Date.now() - timer.startedAt;
  }
  return timer.elapsedMs;
}

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${tenths}`;
}
