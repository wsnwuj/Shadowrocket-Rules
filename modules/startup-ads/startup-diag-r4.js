// SPDX-License-Identifier: MIT
// Local-only diagnostic for selected startup endpoints. Does not change app responses.
// No network calls, request bodies, headers, query values, or response values are stored.
(function () {
  var labels = ['SMZDM_update', 'JD_xview', 'JD_surface', 'JD_predownload', 'JD_post', 'Tencent_vmind', 'Tencent_delivery'];
  var keyPrefix = 'startup_diag_r4_';
  var url = String($request.url || '');
  var reportRequest = /^https?:\/\/app-api\.smzdm\.com(?::443)?\/__sr_diag_r4(?:\?[^#]*)?$/.test(url);
  function read(label) {
    try { return JSON.parse($persistentStore.read(keyPrefix + label) || 'null'); } catch (_) { return null; }
  }
  if (reportRequest) {
    var results = [];
    for (var i = 0; i < labels.length; i++) {
      var item = read(labels[i]);
      if (item) results.push(item);
    }
    var report = { diagnostic: 'SR_DIAG_R4_READY', note: 'Local response structure only; not proof of ad removal.', entries: results };
    return $done({ response: { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(report, null, 2) } });
  }
  if (typeof $response === 'undefined') return $done({});
  var label = '';
  if (/^https?:\/\/app-api\.smzdm\.com(?::443)?\/util\/update\/?(?:\?|$)/.test(url)) label = 'SMZDM_update';
  if (/^https?:\/\/api\.m\.jd\.com(?::443)?\/client\.action(?:\?|$)/.test(url)) {
    var match = /[?&]functionId=([^&#]*)/.exec(url);
    var names = { xview2Config: 'JD_xview', readCustomSurfaceList: 'JD_surface', universalPreDownload: 'JD_predownload' };
    label = match ? (names[match[1]] || '') : 'JD_post';
  }
  if (/^https?:\/\/vv(?:6)?\.video\.qq\.com(?::443)?\/(?:diff|get)vmind(?:\?|$)/.test(url)) label = 'Tencent_vmind';
  if (/^https?:\/\/rdelivery\.qq\.com(?::443)?\//.test(url)) label = 'Tencent_delivery';
  if (!label) return $done({});
  try {
    var body = typeof $response.body === 'string' ? $response.body : '';
    var sample = { endpoint: label, at: new Date().toISOString(), bodyLength: body.length, format: 'empty-or-unavailable', fields: [] };
    var status = Number($response.status || $response.statusCode);
    if (status >= 100 && status <= 599) sample.status = status;
    var allowed = /ad|splash|startup|launch|xview|image|video|material|surface|float|showTimes|duration|preload/i;
    var sensitive = /token|sign|cookie|user|account|device|uid|imei|idfa|oaid|secret|password|phone|address/i;
    var visited = 0;
    function walk(value, path, depth) {
      if (++visited > 400 || depth > 5 || sample.fields.length >= 30 || value === null || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        for (var a = 0; a < Math.min(value.length, 2); a++) walk(value[a], path + '[]', depth + 1);
        return;
      }
      var keys = Object.keys(value).slice(0, 80);
      for (var j = 0; j < keys.length && sample.fields.length < 30; j++) {
        var name = keys[j];
        if (!/^[A-Za-z_][A-Za-z0-9_]{0,47}$/.test(name) || sensitive.test(name)) continue;
        var v = value[name];
        var fieldPath = path ? path + '.' + name : name;
        if (allowed.test(name)) {
          var entry = { field: fieldPath, type: v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v };
          if (Array.isArray(v)) entry.count = v.length;
          sample.fields.push(entry);
        }
        walk(v, fieldPath, depth + 1);
      }
    }
    if (body.length > 1048576) sample.format = 'over-limit';
    else if (body) {
      try {
        var parsed = JSON.parse(body);
        sample.format = parsed === null ? 'json-null' : Array.isArray(parsed) ? 'json-array' : 'json-' + typeof parsed;
        walk(parsed, '', 0);
      } catch (_) { sample.format = 'non-json'; }
    }
    $persistentStore.write(JSON.stringify(sample), keyPrefix + label);
  } catch (_) { /* An unsupported runtime or storage failure must not break the app. */ }
  return $done({});
})();
