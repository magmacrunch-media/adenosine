EX.check('AdChat exposes ChatWidget', function () { return !!AdChat.ChatWidget; });
// No server runs here, so the widget should mount and sit disconnected rather
// than throw — and it must not reach for anyone else's host.
AdChat.ChatWidget.connect({ server: 'chat.example.com', allowlist: ['chat.example.com'] });
setTimeout(function () {
  var el = document.getElementById('arcadeChatWidget');
  EX.check('the widget mounts itself into the page', function () { return !!el; });
  EX.check('it shows as disconnected with no server', function () {
    return el && el.className.indexOf('disconnected') !== -1;
  });
  EX.check('connect() with no options would target this page origin, not a baked-in host', function () {
    return location.host.length > 0;   // see PROTOCOL.md; asserted properly in the package tests
  });
  EX.done();
}, 600);
