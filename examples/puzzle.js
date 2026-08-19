var game = AdPuzzle.createGame({ size: 4, gameName: 'example', spawnTiles: false });
EX.check('grid is null until init() — the README ordering matters', function () { return game.grid === null; });
game.addRandomTile = function () {
  var empty = AdPuzzle.PuzzleGrid.getEmptyCells(game.grid);
  if (!empty.length) return;
  var c = empty[Math.floor(Math.random() * empty.length)];
  game.grid.board[c.row][c.col] = 2;
};
game.setOnRender(function () {
  document.getElementById('board').textContent =
    game.grid.board.map(function (r) {
      return r.map(function (v) { return String(v || '.').padStart(3); }).join('');
    }).join('\n');
});
game.init();
EX.check('init() builds a 4x4 board', function () { return game.grid.board.length === 4 && game.grid.board[0].length === 4; });
// init() calls addInitialTiles() -> addRandomTile() twice, and spawnTiles does
// NOT gate that; it only gates spawning after each successful move.
EX.check('init() seeds two tiles even with spawnTiles:false', function () {
  return AdPuzzle.PuzzleGrid.getEmptyCells(game.grid).length === 14;
});
game.addRandomTile();
EX.check('placing another leaves 13 empty', function () { return AdPuzzle.PuzzleGrid.getEmptyCells(game.grid).length === 13; });
EX.check('createRenderer / createInput / createScoring exist', function () {
  return ['createRenderer','createInput','createScoring'].every(function (f) { return typeof AdPuzzle[f] === 'function'; });
});
EX.done();
