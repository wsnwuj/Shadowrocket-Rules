// SPDX-License-Identifier: MIT
// SMZDM: clear only the exact loading endpoint data array; preserve its envelope.
// Tencent vmind response approach: RuCu6 / iKeLee, as retained by
// QingRex/LoonKissSurge. Narrow endpoint trial; device effectiveness unverified.
// No outbound requests and no account, header, query or response values stored.
(function () {
  var url = String($request.url || '');
  var prefix = 'startup_targeted_r7_';
  function read(name) { try { return JSON.parse($persistentStore.read(prefix + name) || 'null'); } catch (_) { return null; } }
  function save(name, info) {
    try {
      var old = read(name);
      info.at = new Date().toISOString();
      info.hits = (old && typeof old.hits === 'number' ? old.hits : 0) + 1;
      $persistentStore.write(JSON.stringify(info), prefix + name);
    } catch (_) {}
  }
  if (/^https?:\/\/app-api\.smzdm\.com(?::443)?\/__sr_diag_r[4567](?:\?[^#]*)?$/.test(url)) {
    var report = {version: 'SR_R7_READY', note: 'Rule execution only; check actual ads and normal video playback.', smzdm: read('smzdm'), tencent: read('tencent')};
    return $done({response: {status: 200, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}, body: JSON.stringify(report, null, 2)}});
  }
  if (/^https?:\/\/vv(?:6)?\.video\.qq\.com(?::443)?\/(?:diff|get)vmind\/?(?:\?[^#]*)?$/.test(url)) {
    save('tencent', {action: 'empty-vmind-response'});
    return $done({response: {status: 200, headers: {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}, body: '{}'}});
  }
  if (!/^https?:\/\/(?:app-api\.smzdm\.com(?::443)?\/util\/loading|api\.smzdm\.com(?::443)?\/v\d+\/util\/loading)\/?(?:\?[^#]*)?$/.test(url) || typeof $response === 'undefined') return $done({});
  try {
    var raw = $response.body;
    if (typeof raw !== 'string' || !raw) { save('smzdm', {action: 'unchanged', reason: 'empty-or-unavailable-body'}); return $done({}); }
    var body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || !Array.isArray(body.data)) { save('smzdm', {action: 'unchanged', reason: 'unrecognized-loading-schema'}); return $done({}); }
    var changed = body.data.length;
    body.data = [];
    save('smzdm', {action: changed ? 'cleared-loading-list' : 'already-empty', count: changed});
    if (!changed) return $done({});
    return $done({body: JSON.stringify(body)});
  } catch (_) {
    save('smzdm', {action: 'unchanged', reason: 'invalid-json-or-processing-error'});
    return $done({});
  }
})();
