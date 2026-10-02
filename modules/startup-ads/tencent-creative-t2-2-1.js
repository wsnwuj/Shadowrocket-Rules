// SPDX-License-Identifier: MIT
// Blocks two confirmed automotive creative identities on two observed CDN hosts.
// Path prefixes and query values are neither retained nor published.
// No script-side HTTP client, telemetry, notifications or account access.
(function () {
  var url = String($request.url || ''), VERSION = 'SR_T2_2_1_READY';
  var ids = '(?:0b53umccyaae6iaf3n46tzvnfi6dfsraik2a|0b53bybvuaadxiahgz4wqfvnkdwdlihqgxka)';
  var media = new RegExp('^https?://(omex\\.tc\\.qq\\.com|ltsyz\\.gtimg\\.com)(?::(?:80|443))?/(?:[^/?#]+/)*(?:\\d+_)?gzc_1000127_' + ids + '\\.f\\d+(?:\\.\\d+)?\\.(?:mp4|ts)(?:\\?[^#]*)?$');
  var control = url.match(/^https?:\/\/omex\.tc\.qq\.com(?::(?:80|443))?\/__sr_t2_(check|status)(?:\?[^#]*)?$/);
  var key = 'tencent_creative_t2_2_counts';
  function empty() { return {omex: {non_selftest: 0, selftest: 0}, ltsyz: {non_selftest: 0, selftest: 0}}; }
  function read() {
    var result = empty();
    try {
      var saved = JSON.parse($persistentStore.read(key) || '{}');
      ['omex', 'ltsyz'].forEach(function (host) {
        ['non_selftest', 'selftest'].forEach(function (type) {
          var value = saved[host] && saved[host][type];
          if (typeof value === 'number' && isFinite(value) && value >= 0 && value <= 1e9) result[host][type] = Math.floor(value);
        });
      });
    } catch (_) {}
    return result;
  }
  function respond(status, type, body) {
    return $done({response: {status: status, headers: {'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Pragma': 'no-cache', 'Access-Control-Allow-Origin': '*'}, body: body}});
  }
  var matched = url.match(media);
  if (matched) {
    var host = matched[1], bucket = host === 'omex.tc.qq.com' ? 'omex' : 'ltsyz';
    var probe = /[?&]sr_t2_probe=1(?:&|$)/.test(url);
    try {
      var counts = read();
      counts[bucket][probe ? 'selftest' : 'non_selftest'] += 1;
      $persistentStore.write(JSON.stringify(counts), key);
    } catch (_) {}
    return respond(410, 'application/json', JSON.stringify({version: VERSION, local_block: true, test_request: probe, host: host}));
  }
  if (control && control[1] === 'status') {
    return respond(200, 'application/json', JSON.stringify({version: VERSION, counts: read(), note: 'Counts confirm local rule execution only. Non-selftest counts can include manual URL visits. Cached ads, other creative IDs/hosts and ad UI controls are not covered.'}, null, 2));
  }
  if (control && control[1] === 'check') {
    var html = "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>腾讯视频 T2.2.1 自检</title><style>body{font:16px/1.65 -apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:24px 18px;background:#f5f7fa;color:#17263a}main{max-width:600px;margin:auto}h1{font-size:24px}section{background:white;border-radius:14px;padding:18px;margin:18px 0}.result{font-size:18px;font-weight:600}.note{color:#536174}pre{font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere}button{font-size:16px;padding:11px 18px;color:white;background:#176bc6;border:0;border-radius:9px}button:disabled{opacity:.5}a{color:#176bc6}</style></head><body><main><h1>腾讯视频 T2.2.1 自检</h1><p id=\"protocol\" class=\"note\"></p><section><p id=\"omex\" class=\"result\">MP4 路径：正在检查…</p><p id=\"ltsyz\" class=\"result\">TS 分片路径：正在检查…</p><pre id=\"report\"></pre><button id=\"retry\">重新检查</button><p><a id=\"direct-omex\">直接验证 MP4 路径</a></p><p><a id=\"direct-ltsyz\">直接验证 TS 分片路径</a></p></section><p class=\"note\">两项通过只确认已知素材路径的本地拦截。开屏是否消失及正片播放仍需实际测试。</p><p class=\"note\">若自动检查失败，请点相应的“直接验证”链接。本地拦截应显示 JSON，包含当前版本、local_block: true 和 test_request: true；403、404 或播放器报错均不能作为通过依据。</p><p class=\"note\">次数只说明规则执行，非自检次数也可能包含手动访问。</p><script>\n(function () {\n  var expected = 'SR_T2_2_1_READY';\n  var protocol = location.protocol === 'https:' ? 'https:' : 'http:';\n  var routes = [\n    {host: 'omex.tc.qq.com', id: 'omex', label: 'MP4 路径', path: '/gzc_1000127_0b53umccyaae6iaf3n46tzvnfi6dfsraik2a.f10201.mp4'},\n    {host: 'ltsyz.gtimg.com', id: 'ltsyz', label: 'TS 分片路径', path: protocol + '//ltsyz.gtimg.com/__sr_t2_2_probe/00_gzc_1000127_0b53bybvuaadxiahgz4wqfvnkdwdlihqgxka.f322013.1.ts'}\n  ];\n  var report = document.getElementById('report'), retry = document.getElementById('retry');\n  document.getElementById('protocol').textContent = '本页使用 ' + protocol.slice(0, -1).toUpperCase() + '；探测使用相同协议。';\n  function run() {\n    var nonce = String(Date.now()) + '_' + String(Math.random()).slice(2), results = [];\n    retry.disabled = true;\n    report.textContent = '';\n    Promise.all(routes.map(function (route) {\n      var element = document.getElementById(route.id), controller = new AbortController();\n      var detail = {host: route.host, request_protocol: protocol, outcome: 'pending'};\n      var target = route.path + '?sr_t2_probe=1&_=' + nonce;\n      results.push(detail);\n      document.getElementById('direct-' + route.id).href = target;\n      var timer = setTimeout(function () { controller.abort(); }, 8000);\n      element.textContent = route.label + '：正在检查…';\n      element.style.color = '#17263a';\n      function fail(outcome, message) {\n        detail.outcome = outcome;\n        element.textContent = route.label + '：未通过，' + message;\n        element.style.color = '#b42318';\n      }\n      return fetch(target, {cache: 'no-store', signal: controller.signal}).then(function (response) {\n        detail.http_status = response.status;\n        return response.json().then(function (body) {\n          if (response.status !== 410) return fail('not-local-status', '返回 HTTP ' + response.status + '，请点直接验证');\n          if (!body || body.version !== expected || body.local_block !== true || body.test_request !== true || body.host !== route.host) {\n            return fail('not-local-response', '未收到当前版本的本地拦截标识，请点直接验证');\n          }\n          detail.outcome = 'local-block-confirmed';\n          element.textContent = route.label + '：本地拦截通过';\n          element.style.color = '#157347';\n        }).catch(function () { fail('not-json', '响应不是可验证的 JSON，请点直接验证'); });\n      }).catch(function (error) {\n        if (error && error.name === 'AbortError') return fail('timeout', '请求超时，请点直接验证');\n        fail('network-or-browser', '浏览器未取得响应，请点直接验证');\n      }).then(function () { clearTimeout(timer); });\n    })).then(function () {\n      return fetch('/__sr_t2_status?_=' + nonce, {cache: 'no-store'});\n    }).then(function (response) {\n      if (response.status !== 200) throw new Error('status');\n      return response.json();\n    }).then(function (body) {\n      if (!body || body.version !== expected) throw new Error('version');\n      body.page_protocol = protocol;\n      body.probe_results = results;\n      report.textContent = JSON.stringify(body, null, 2);\n    }).catch(function () {\n      report.textContent = JSON.stringify({expected_version: expected, status_read_ok: false, page_protocol: protocol, probe_results: results}, null, 2);\n    }).then(function () { retry.disabled = false; });\n  }\n  retry.onclick = run;\n  run();\n})();\n\n</script></main></body></html>";
    return respond(200, 'text/html', html);
  }
  return $done({});
})();
