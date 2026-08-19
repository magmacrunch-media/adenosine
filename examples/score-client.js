var client = new AdScore.ScoreClient();
EX.check('ScoreClient exposes auto/connect/load/save', function () {
  return ['auto','connect','load','save'].every(function (m) { return typeof client[m] === 'function'; });
});
// No server here on purpose: the offline queue is the interesting behaviour.
client.save('example-game', 'ABC', 1234).then(function (r) {
  EX.check('a save with no server queues offline rather than throwing', function () { return r.synced === false; });
  return client.load('example-game');
}).then(function (scores) {
  EX.check('load falls back to localStorage and returns the queued score', function () {
    return Array.isArray(scores) && scores.some(function (s) { return s.score === 1234; });
  });
  EX.done();
});
