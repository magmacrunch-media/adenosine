EX.check('MP, MSG and MP_PALETTE are exported', function () {
  return !!AdMP.MP && !!AdMP.MSG && !!AdMP.MP_PALETTE;
});
AdMP.MP.configure({ defaultServer: 'games.example.com/demo', allowlist: ['games.example.com'] });
EX.check('configure({ defaultServer }) drives connect()', function () {
  return AdMP.MP._resolveServer() === 'games.example.com/demo';
});
EX.check('the configured host is implicitly trusted', function () {
  return AdMP.MP._isAllowed('games.example.com') === true;
});
EX.check('a host nobody declared is refused', function () {
  return AdMP.MP._isAllowed('evil.example.org') === false;
});
EX.check('MSG has 19 constants over 17 distinct wire values', function () {
  var v = Object.keys(AdMP.MSG).map(function (k) { return AdMP.MSG[k]; });
  var uniq = v.filter(function (x, i) { return v.indexOf(x) === i; });
  return v.length === 19 && uniq.length === 17;
});
var html = AdMP.BoardGameTemplate.render({ title: 'DEMO' });
EX.check('BoardGameTemplate.render() returns markup, it does not insert it', function () {
  return typeof html === 'string' && html.indexOf('DEMO') !== -1;
});
EX.check('render() names no particular studio in its default credits', function () {
  return html.indexOf('magmacrunch') === -1;
});
EX.done();
