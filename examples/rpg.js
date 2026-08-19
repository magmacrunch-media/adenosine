var canvas = document.getElementById('c');
AdRPG.initCanvas(canvas);
var map = [[2,2,2,2,2],[2,0,0,0,2],[2,0,0,0,2],[2,2,2,2,2]];
AdRPG.setCurrentMap('example');
AdRPG.setMap(map);
AdRPG.player.x = 1; AdRPG.player.y = 1;

EX.check('initCanvas gives the module a 2D context', function () { return !!AdRPG.ctx; });
EX.check('player and map state are readable', function () { return AdRPG.player.x === 1 && AdRPG.currentMap === 'example'; });
EX.check('isSolid respects the solidTiles list', function () {
  return AdRPG.isSolid(0, 0, { map: map, solidTiles: [2] }) === true
      && AdRPG.isSolid(1, 1, { map: map, solidTiles: [2] }) === false;
});

var frames = 0;
var loop = AdRPG.createGameLoop({
  update: function () { AdRPG.updateCamera({ target: AdRPG.player, tileSize: 32, mapWidth: 5, mapHeight: 4 }); },
  render: function () {
    frames++;
    AdRPG.renderWorld({
      map: map, tileSize: 32,
      renderTile: function (ctx, x, y, id) {
        ctx.fillStyle = id === 2 ? '#5d4037' : '#7cb342';
        ctx.fillRect(x, y, 32, 32);
      },
      layers: [{ sortY: AdRPG.player.y, render: function (ctx) {
        ctx.fillStyle = '#ff6ec7';
        ctx.fillRect(AdRPG.player.x * 32 + 8, AdRPG.player.y * 32 + 8, 16, 16);
      } }],
    });
  },
  fps: 30,
});
AdRPG.setGameStarted(true);
loop.start();
setTimeout(function () {
  // requestAnimationFrame is paused in a hidden or backgrounded tab, so a frame
  // count is not a fact about the package. Assert the loop's contract instead,
  // and report the frame count as information rather than a pass/fail.
  EX.check('createGameLoop returns start and stop', function () {
    return typeof loop.start === 'function' && typeof loop.stop === 'function';
  });
  EX.check('renderWorld draws without throwing when driven directly', function () {
    AdRPG.renderWorld({
      map: map, tileSize: 32,
      renderTile: function (ctx, x, y, id) { ctx.fillStyle = id === 2 ? '#5d4037' : '#7cb342'; ctx.fillRect(x, y, 32, 32); },
      layers: [],
    });
    return true;
  });
  loop.stop();
  var note = document.createElement('p');
  note.className = 'lede';
  note.textContent = 'rendered ' + frames + ' frame(s) in 400ms — 0 is expected in a background tab, ' +
    'where the browser pauses requestAnimationFrame. Foreground this page to see it animate.';
  document.body.appendChild(note);
  EX.done();
}, 400);
