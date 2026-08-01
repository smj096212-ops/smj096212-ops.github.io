// 4x4 그리드 자료구조. 0은 빈 칸, 그 외는 타일 숫자.

function createEmptyGrid() {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function gridsEqual(a, b) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function transpose(grid) {
  const result = createEmptyGrid();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      result[c][r] = grid[r][c];
    }
  }
  return result;
}

// 빈 칸 중 하나에 90% 확률로 2, 10% 확률로 4를 채운다. 빈 칸이 없으면 null을 반환한다.
// 반환값은 새로 생성된 타일의 좌표({row, col})로, 렌더링 시 등장 애니메이션에 사용된다.
function spawnTile(grid) {
  const emptyCells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return null;

  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return { row: r, col: c };
}

function maxTileValue(grid) {
  let max = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] > max) max = grid[r][c];
    }
  }
  return max;
}
