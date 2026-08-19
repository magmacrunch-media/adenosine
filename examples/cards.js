var deck = new AdCards.Deck();
EX.check('new Deck() builds 52 cards', function () { return deck.cards.length === 52; });
deck.shuffle();

// Render one of every rank — the check that caught aces throwing at getHTML().
var hand = document.getElementById('hand');
['A','2','3','4','5','6','7','8','9','10','J','Q','K'].forEach(function (r) {
  var c = new AdCards.Card(r === 'A' ? 'hearts' : 'spades', r);
  c.faceUp = true;
  hand.appendChild(c.getHTML());
});
EX.check('every rank renders an element', function () { return hand.children.length === 13; });
EX.check('a face-up card carries a semantic colour class, not a hex', function () {
  var c = new AdCards.Card('hearts', 'A'); c.faceUp = true;
  return [].slice.call(c.getHTML().classList).indexOf('red') !== -1;
});

// Poker is ace-high and the caller must restamp — the contract in API.md.
var ev = new AdCards.HandEvaluator();
function poker(pairs) {
  return pairs.map(function (p) {
    var c = new AdCards.Card(p[0], p[1]);
    c.value = AdCards.POKER_RANK_VALUES[p[1]];
    return c;
  });
}
EX.check('royal flush grades as Royal Flush', function () {
  return ev.evaluate(poker([['hearts','A'],['hearts','K'],['hearts','Q'],['hearts','J'],['hearts','10']])).name === 'Royal Flush';
});
EX.check('A-K-Q-J-10 offsuit is a Straight', function () {
  return ev.evaluate(poker([['hearts','A'],['spades','K'],['hearts','Q'],['clubs','J'],['hearts','10']])).name === 'Straight';
});
EX.check('the wheel A-2-3-4-5 is still a Straight', function () {
  return ev.evaluate(poker([['hearts','A'],['spades','2'],['hearts','3'],['clubs','4'],['hearts','5']])).name === 'Straight';
});
EX.check('a pair of aces beats a pair of twos', function () {
  var a = ev.evaluate(poker([['hearts','A'],['spades','A'],['hearts','7'],['clubs','5'],['hearts','3']]));
  var t = ev.evaluate(poker([['hearts','2'],['spades','2'],['diamonds','7'],['clubs','5'],['diamonds','3']]));
  return a.tiebreakers[0] > t.tiebreakers[0];
});
EX.check('Card stays ace-low, so cribbage and solitaire are unaffected', function () {
  return new AdCards.Card('hearts','A').value === 1 && AdCards.POKER_RANK_VALUES.A === 14;
});
EX.done();
