// SPDX-License-Identifier: MIT
// Local structural diagnostics only. Does not modify app responses or send data.
(function () {
  var prefix = 'startup_diag_r5_';
  var labels = ['SMZDM_update', 'SMZDM_ab', 'Tencent_pull', 'Tencent_sdk', 'Tencent_batch', 'Tencent_vmind'];
  var url = String($request.url || '');
  function read(label) { try { return JSON.parse($persistentStore.read(prefix + label) || '[]'); } catch (_) { return []; } }
  if (/^https?:\/\/app-api\.smzdm\.com(?::443)?\/__sr_diag_r[45](?:\?[^#]*)?$/.test(url)) {
    var entries = [];
    labels.forEach(function (label) { entries = entries.concat(read(label)); });
    return $done({response: {status: 200, headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}, body: JSON.stringify({diagnostic: 'SR_DIAG_R5_READY', note: 'Local structure only; not proof of ad removal. Up to 12 distinct structures per endpoint.', entries: entries}, null, 2)}});
  }
  if (typeof $response === 'undefined') return $done({});
  var label = '';
  if (/^https?:\/\/app-api\.smzdm\.com(?::443)?\/util\/update\/?(?:\?|$)/.test(url)) label = 'SMZDM_update';
  if (/^https?:\/\/common-api\.smzdm\.com(?::443)?\/ab\/config\/?(?:\?|$)/.test(url)) label = 'SMZDM_ab';
  if (/^https?:\/\/rdelivery\.qq\.com(?::443)?\/v3\/config\/pull\/?(?:\?|$)/.test(url)) label = 'Tencent_pull';
  if (/^https?:\/\/rdelivery\.qq\.com(?::443)?\/v1\/sdkconfig\/get\/?(?:\?|$)/.test(url)) label = 'Tencent_sdk';
  if (/^https?:\/\/vv(?:6)?\.video\.qq\.com(?::443)?\/batchvinfo\/?(?:\?|$)/.test(url)) label = 'Tencent_batch';
  if (/^https?:\/\/vv(?:6)?\.video\.qq\.com(?::443)?\/(?:diff|get)vmind\/?(?:\?|$)/.test(url)) label = 'Tencent_vmind';
  if (!label) return $done({});
  try {
    var body = typeof $response.body === 'string' ? $response.body : '';
    var sample = {endpoint: label, at: new Date().toISOString(), bodyLength: body.length, format: 'empty-or-unavailable', fields: [], truncated: false, hits: 1};
    var status = Number($response.status || $response.statusCode);
    if (status >= 100 && status <= 599) sample.status = status;
    var sensitive = /token|sign|cookie|user|account|device|uid|imei|idfa|oaid|secret|password|phone|address/i;
    var seen = {}, visited = 0, parsedStrings = 0;
    function relevant(name) {
      var words = name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase().split('_');
      return words.some(function (w) { return /^(ads?|advert|advertise|advertisement|splash|startup|launch|xview|image|video|material|surface|float|duration|preload)$/.test(w); });
    }
    function field(path, value, kind) {
      if (seen[path]) return;
      if (sample.fields.length >= 100) { sample.truncated = true; return; }
      seen[path] = true;
      var f = {field: path, type: kind || (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value)};
      if (Array.isArray(value)) f.count = value.length;
      sample.fields.push(f);
    }
    function walk(value, path, depth) {
      if (++visited > 6000 || depth > 12) { sample.truncated = true; return; }
      if (typeof value === 'string' && value.length <= 262144 && parsedStrings < 24 && /^\s*[\[{]/.test(value)) {
        try { var decoded = JSON.parse(value); parsedStrings++; field(path, value, 'encoded-json'); walk(decoded, path + '{json}', depth + 1); } catch (_) {}
        return;
      }
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        if (value.length > 24) sample.truncated = true;
        for (var a = 0; a < Math.min(value.length, 24); a++) walk(value[a], path + '[]', depth + 1);
        return;
      }
      var keys = Object.keys(value);
      if (keys.length > 200) sample.truncated = true;
      for (var j = 0; j < Math.min(keys.length, 200); j++) {
        var name = keys[j];
        if (!/^[A-Za-z_][A-Za-z0-9_]{0,47}$/.test(name) || sensitive.test(name)) continue;
        var p = path ? path + '.' + name : name;
        if (depth <= 1 || relevant(name)) field(p, value[name]);
        walk(value[name], p, depth + 1);
      }
    }
    if (body.length > 1048576) sample.format = 'over-limit';
    else if (body) {
      try { var parsed = JSON.parse(body); sample.format = parsed === null ? 'json-null' : Array.isArray(parsed) ? 'json-array' : 'json-' + typeof parsed; walk(parsed, '', 0); }
      catch (_) { sample.format = 'non-json'; }
    }
    var history = read(label);
    var signature = JSON.stringify([sample.status, sample.format, sample.fields, sample.truncated]);
    var index = history.findIndex(function (old) { return JSON.stringify([old.status, old.format, old.fields, old.truncated]) === signature; });
    if (index >= 0) { sample.hits += history[index].hits || 1; history.splice(index, 1); }
    history.push(sample);
    if (history.length > 12) history.shift();
    $persistentStore.write(JSON.stringify(history), prefix + label);
  } catch (_) {}
  return $done({});
})();
