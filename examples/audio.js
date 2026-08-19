EX.check('init / playMusic / playSfx / toggleMusicMute are exported', function () {
  return ['init','playMusic','playSfx','toggleMusicMute'].every(function (f) { return typeof AdAudio[f] === 'function'; });
});
EX.check('handleVisibility takes a boolean, not an options object', function () {
  return typeof AdAudio.handleVisibility === 'function' && AdAudio.handleVisibility.length === 1;
});
EX.check('mute state is readable before any track loads', function () {
  return typeof AdAudio.isMusicMuted() === 'boolean';
});
// Audio needs a gesture; browsers refuse to start a context without one.
document.getElementById('play').addEventListener('click', function () {
  var ctx = AdAudio.getCtx() || new (window.AudioContext || window.webkitAudioContext)();
  var o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = 440; g.gain.value = 0.05;
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 0.2);
});
EX.done();
