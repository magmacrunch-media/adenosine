// Tiny reporter shared by the examples. Each page asserts what its README claims
// and prints pass/fail, so opening the page IS the test.
window.EX = (function () {
  var out = [];
  function line(ok, msg) {
    out.push((ok ? 'ok   ' : '###  ') + msg);
    var el = document.getElementById('log');
    if (el) el.innerHTML = out.map(function (l) {
      return '<span class="' + (l.indexOf('ok') === 0 ? 'ok' : 'bad') + '">' +
        l.replace(/[<>&]/g, function (c) { return ({'<':'&lt;','>':'&gt;','&':'&amp;'})[c]; }) +
        '</span>';
    }).join('\n');
  }
  return {
    check: function (msg, fn) {
      try { line(fn() !== false, msg); }
      catch (e) { line(false, msg + '  -> ' + e.message); }
    },
    done: function () {
      var bad = out.filter(function (l) { return l.indexOf('###') === 0; }).length;
      line(bad === 0, bad === 0 ? 'all checks passed' : bad + ' check(s) FAILED');
      document.title = (bad === 0 ? 'PASS' : 'FAIL') + ' — ' + document.title;
    },
  };
})();
