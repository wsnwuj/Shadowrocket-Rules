// SPDX-License-Identifier: MIT
// SMZDM loading schedule approach: ddgksf2013/Scripts smzdm_json.js.
// Tencent vmind response approach: RuCu6 / iKeLee, as retained by
// QingRex/LoonKissSurge. Narrow endpoint trial; device effectiveness unverified.
// No outbound requests and no account, header, query or response values stored.
(function () {
  var url = String($request.url || '');
  var prefix = 'startup_targeted_r6_';
  function read(name) { try { return JSON.parse($persistentStore.read(prefix + name) || 'null'); } catch (_) { return null; } }
  function save(name, info) {
    try {
      var old = read(name);
      info.at = new Date().toISOString();
      info.hits = (old && typeof old.hits === 'number' ? old.hits : 0) + 1;
      $persistentStore.write(JSON.stringify(info), prefix + name);
    } catch (_) {}
  }
  if (/^https?:\/\/app-api\.smzdm\.com(?::443)?\/__sr_diag_r[456](?:\?[^#]*)?$/.test(url)) {
    var report = {version: 'SR_R6_READY', note: 'Rule execution only; check actual ads and normal video playback.', smzdm: read('smzdm'), tencent: read('tencent')};
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
    var changed = 0;
    body.data.forEach(function (entry) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
      // Preserve the original item and response envelope. These fields are
      // the loading-ad fields handled by the upstream SMZDM script.
      entry.start_date = '2030-12-24 00:00:00';
      entry.end_date = '2030-12-24 23:59:59';
      entry.unix_start_date = '1924272000';
      entry.unix_end_date = '1924358399';
      entry.is_show_ad = '0';
      changed++;
    });
    save('smzdm', {action: changed ? 'disabled-loading-items' : 'already-empty', count: changed});
    if (!changed) return $done({});
    return $done({body: JSON.stringify(body)});
  } catch (_) {
    save('smzdm', {action: 'unchanged', reason: 'invalid-json-or-processing-error'});
    return $done({});
  }
})();
