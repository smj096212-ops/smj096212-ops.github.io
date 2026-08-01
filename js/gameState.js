// 게임 상태 오케스트레이션: 최고 타일, 승패 판정, move() 진행. DOM 코드는 포함하지 않는다.
// 점수는 "이번 판에서 만든 최고 타일" 하나로 단순화하고, 승패와 무관하게 끝나면(finished) 더 이상 입력을 받지 않는다.
// 2048 달성 후 이어하기는 지원하지 않는다 — "얼마나 빠르게 2048을 만드는가"에 집중하기 위함.

function createGameState() {
  const grid = createEmptyGrid();
  spawnTile(grid);
  spawnTile(grid);

  return {
    grid,
    maxTile: maxTileValue(grid),
    won: false,
    over: false,
    finished: false,
  };
}

function hasWon(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 2048) return true;
    }
  }
  return false;
}

function isGameOver(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return false;
      if (c + 1 < 4 && grid[r][c] === grid[r][c + 1]) return false;
      if (r + 1 < 4 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

// state를 직접 갱신하고, 렌더링에 필요한 정보(이동 여부/타일별 이동 경로/새로 생긴 칸)를 반환한다.
function move(state, direction) {
  if (state.finished) return { moved: false, tileMoves: [], spawnedCell: null };

  const moveFn = MOVE_FNS[direction];
  const { grid: newGrid, tileMoves } = moveFn(state.grid);
  const moved = !gridsEqual(state.grid, newGrid);

  if (!moved) {
    return { moved: false, tileMoves: [], spawnedCell: null };
  }

  const spawnedCell = spawnTile(newGrid);
  state.grid = newGrid;
  state.maxTile = maxTileValue(newGrid);

  state.won = hasWon(state.grid);
  state.over = isGameOver(state.grid);
  state.finished = state.won || state.over;

  return { moved: true, tileMoves, spawnedCell };
}

function restartGame(state) {
  const fresh = createGameState();
  state.grid = fresh.grid;
  state.maxTile = fresh.maxTile;
  state.won = false;
  state.over = false;
  state.finished = false;
}
