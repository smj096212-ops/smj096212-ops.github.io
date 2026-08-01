// 한 줄(길이 4)을 왼쪽으로 밀고 병합하는 핵심 로직 + 4방향 이동. grid.js의 transpose에만 의존한다.
// 각 함수는 이동 결과 grid와 함께, 원래 좌표(from)에서 새 좌표(to)로 이동한 타일 목록(tileMoves)을 반환한다.
// tileMoves는 렌더링 레이어가 슬라이드/병합 애니메이션을 그리는 데 쓰인다. 좌표는 항상
// "자신이 반환하는 grid" 기준이며, 상위 함수(moveUp/moveDown)가 필요 시 좌표를 재매핑한다.

// 한 타일은 한 번의 이동에서 최대 1번만 병합된다: [2,2,2,2] -> [4,4,0,0] (o), [8,0,0,0] (x)
// 병합되는 두 타일은 같은 목적지(to)로 이동하며, 렌더링 레이어가 도착 후 실제 합쳐진 타일로 교체한다.
function slideAndMergeLine(line) {
  const nonZero = [];
  for (let i = 0; i < 4; i++) {
    if (line[i] !== 0) nonZero.push({ index: i, value: line[i] });
  }

  const result = [0, 0, 0, 0];
  const moves = [];
  let writeIndex = 0;
  let i = 0;
  while (i < nonZero.length) {
    const cur = nonZero[i];
    const next = nonZero[i + 1];
    if (next && cur.value === next.value) {
      result[writeIndex] = cur.value * 2;
      moves.push({ from: cur.index, to: writeIndex, value: cur.value, merged: true });
      moves.push({ from: next.index, to: writeIndex, value: next.value, merged: true });
      i += 2;
    } else {
      result[writeIndex] = cur.value;
      moves.push({ from: cur.index, to: writeIndex, value: cur.value, merged: false });
      i += 1;
    }
    writeIndex += 1;
  }

  return { line: result, moves };
}

function moveLeft(grid) {
  const tileMoves = [];
  const newGrid = grid.map((row, r) => {
    const { line, moves } = slideAndMergeLine(row);
    moves.forEach((m) => {
      tileMoves.push({ from: { row: r, col: m.from }, to: { row: r, col: m.to }, value: m.value, merged: m.merged });
    });
    return line;
  });
  return { grid: newGrid, tileMoves };
}

function moveRight(grid) {
  const tileMoves = [];
  const newGrid = grid.map((row, r) => {
    const reversed = row.slice().reverse();
    const { line, moves } = slideAndMergeLine(reversed);
    moves.forEach((m) => {
      tileMoves.push({
        from: { row: r, col: 3 - m.from },
        to: { row: r, col: 3 - m.to },
        value: m.value,
        merged: m.merged,
      });
    });
    return line.reverse();
  });
  return { grid: newGrid, tileMoves };
}

function moveUp(grid) {
  const { grid: movedGrid, tileMoves } = moveLeft(transpose(grid));
  return {
    grid: transpose(movedGrid),
    tileMoves: tileMoves.map((m) => ({
      from: { row: m.from.col, col: m.from.row },
      to: { row: m.to.col, col: m.to.row },
      value: m.value,
      merged: m.merged,
    })),
  };
}

function moveDown(grid) {
  const { grid: movedGrid, tileMoves } = moveRight(transpose(grid));
  return {
    grid: transpose(movedGrid),
    tileMoves: tileMoves.map((m) => ({
      from: { row: m.from.col, col: m.from.row },
      to: { row: m.to.col, col: m.to.row },
      value: m.value,
      merged: m.merged,
    })),
  };
}

const MOVE_FNS = {
  left: moveLeft,
  right: moveRight,
  up: moveUp,
  down: moveDown,
};
