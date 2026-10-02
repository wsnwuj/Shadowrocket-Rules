// SPDX-License-Identifier: MIT
// Temporary, opt-in, three-minute local observer. Ordinary traffic is passed unchanged.
// Stores masked request paths locally for identification; never retains queries, headers, raw bodies or arbitrary JSON keys.
// No script-side HTTP client, notifications, external telemetry or console logging.
(function () {
  var VERSION = 'SR_T3_3_DIAGNOSTIC', KEY = 'tencent_t3_3_observer', WINDOW = 180000;
  var HOSTS = ['vv.video.qq.com', 'vv6.video.qq.com', 'v.qq.com'];
  var match = String($request.url || '').match(/^https?:\/\/([a-z0-9.-]+)(?::(?:80|443))?(\/[^?#]*)?(?:\?([^#]*))?$/i);
  if (!match) return $done({});
  var host = match[1].toLowerCase(), pathname = match[2] || '/', query = match[3] || '';
  var responsePhase = typeof $response !== 'undefined';
  var WORDS = ('pub|video_float_ad_config.config_list|v1|v2|v3|config|pull|batchpull|get|sdkconfig|statistic|report|commdatav2|x|api|cgi-bin|fcgi-bin|h5|html|index.html|index|home|page|pages|player|play|ad|ads|advert|advertisement|splash|startup|launch|start|loading|preload|realtime|creative|material|media|video|float|float_ad|open|config_list|ad_config|splash_config|json|data|list|adlist|ad_list|splashad|splash_ad|getad|getsplash|splashscreen').split('|');
  var FIELDS = ('cmd|command|service|method|protocol|req|rsp|duration|timeout|skip|skiptime|skip_time|countdown|display|show|template|adtype|ad_type|adparams|ad_params|ext|ret|code|msg|data|result|body|config|configs|list|items|ads|ad|adlist|ad_list|adinfo|ad_info|ad_data|ad_config|advert|advertisement|splash|splash_ad|splashad|splash_config|splash_list|startup|launch|loading|preload|creative|creatives|material|materials|content|cipher_text|isad|is_ad|ad_enabled|splash_enabled|show_splash|is_show_ad').split('|');
  function blank() { return {started: 0, expires: 0, rows: []}; }
  function read() {
    try {
      var saved = JSON.parse($persistentStore.read(KEY) || '{}');
      if (!saved || typeof saved.started !== 'number' || typeof saved.expires !== 'number' || !Array.isArray(saved.rows)) return blank();
      return saved;
    } catch (_) { return blank(); }
  }
  function write(state) { try { return $persistentStore.write(JSON.stringify(state), KEY) !== false; } catch (_) { return false; } }
  function local(type, body) {
    return $done({response: {status: 200, headers: {'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': String(($request.headers || {}).Origin || ($request.headers || {}).origin || '') === 'https://omex.tc.qq.com' ? 'https://omex.tc.qq.com' : 'http://omex.tc.qq.com'}, body: body}});
  }
  function report(state) {
    return {version: VERSION, active: state.expires > Date.now(), started: state.started ? new Date(state.started).toISOString() : null,
      expires: state.expires ? new Date(state.expires).toISOString() : null,
      note: 'Observer only. Field/keyword presence does not prove an ad. Only three hosts and fixed API routes are observed. JSON, JSONP, XML and form structures are recognized without evaluating code. Unavailable body means the script did not receive usable content, not that the server returned an empty body. Request/response body values, queries and headers are never retained. Markers and fields are cumulative; body sizes and format describe the latest sample; status_counts and format_counts aggregate every observed sample. UDP/QUIC and pinned TLS are not covered; application encryption may remain opaque.',
      entries: state.rows};
  }
  if (!responsePhase && HOSTS.indexOf(host) >= 0 && pathname === '/__sr_t3_probe') {
    return local('application/json', JSON.stringify({version: VERSION, local_probe: true, host: host}));
  }
  if (!responsePhase && host === 'omex.tc.qq.com' && /^\/__sr_t3_(check|status|reset|stop)$/.test(pathname)) {
    if (pathname === '/__sr_t3_reset') {
      var next = {started: Date.now(), expires: Date.now() + WINDOW, rows: []};
      var ok = write(next);
      return local('application/json', JSON.stringify({version: VERSION, recording_started: ok, duration_seconds: 180}));
    }
    if (pathname === '/__sr_t3_stop') { var stopped = read(); stopped.expires = 0; var stopOK = write(stopped); var stopReport = report(stopOK ? stopped : read()); stopReport.recording_stopped = stopOK; return local('application/json', JSON.stringify(stopReport, null, 2)); }
    if (pathname === '/__sr_t3_status') return local('application/json', JSON.stringify(report(read()), null, 2));
    var html = "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>腾讯视频 T3.3 临时诊断</title><style>body{font:16px/1.65 -apple-system,sans-serif;margin:22px;background:#f4f6f9;color:#17263a}main{max-width:680px;margin:auto}h1{font-size:24px}button{background:#176bc6;color:white;border:0;border-radius:8px;padding:11px;margin:4px;font-size:16px}button:disabled{opacity:.5}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:white;padding:15px;border-radius:10px;font-size:13px}a{color:#176bc6}</style></head><body><main><h1>腾讯视频 T3.3 临时诊断</h1><p>用于定位剩余的开屏控件。保留 R7 和 T2.2.1，先点击开始记录，再退出腾讯视频后台并打开一次，等控件消失后回本页。</p><p id=\"probe\">正在检查观察域名…</p><button id=\"start\">开始记录（3 分钟）</button><button id=\"stop\">停止并显示报告</button><button id=\"refresh\">刷新报告</button><p id=\"hint\">记录未开始。接口请求和响应保持原样。</p><p>只保存接口路径、内容类型、字段类型、标记和次数，不保存正文、参数值或请求头。报告保存在手机本地；字段或标记出现只是线索。</p><p>记录结束后请关闭此临时模块。UDP/QUIC、证书绑定或应用自身加密的内容可能仍无法识别。</p><p><a href=\"/__sr_t3_status\">打开 JSON 报告，长按复制全文</a></p><pre id=\"report\"></pre><script>\n(function(){\n  var version='SR_T3_3_DIAGNOSTIC',pre=document.getElementById('report'),hint=document.getElementById('hint');\n  var protocol=location.protocol==='https:'?'https:':'http:';\n  function read(path){return fetch(path+'?_='+Date.now(),{cache:'no-store'}).then(function(r){if(r.status!==200)throw Error('status');return r.json();}).then(function(b){if(!b||b.version!==version)throw Error('version');return b;});}\n  function show(){return read('/__sr_t3_status').then(function(b){pre.textContent=JSON.stringify(b,null,2);}).catch(function(){pre.textContent='报告读取失败，请保留当前页面。';});}\n  document.getElementById('refresh').onclick=show;\n  document.getElementById('start').onclick=function(){var button=this;button.disabled=true;read('/__sr_t3_reset').then(function(b){hint.textContent=b.recording_started?'记录已开始。现在退出腾讯视频后台再打开一次，控件消失后回来点击“停止并显示报告”。':'未能开始记录。';return show();}).catch(function(){hint.textContent='开始记录失败。';}).then(function(){button.disabled=false;});};\n  document.getElementById('stop').onclick=function(){read('/__sr_t3_stop').then(function(b){hint.textContent=b.recording_stopped?'记录已停止。复制下方报告后，请关闭 T3.3 临时模块。':'未能保存停止状态，请直接关闭 T3.3 临时模块。';pre.textContent=JSON.stringify(b,null,2);}).catch(function(){hint.textContent='停止请求失败，记录最迟在开始后三分钟自动到期。';});};\n  var hosts=['vv.video.qq.com','vv6.video.qq.com','v.qq.com'];\n  Promise.all(hosts.map(function(host){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},8000);return fetch(protocol+'//'+host+'/__sr_t3_probe?_='+Date.now(),{cache:'no-store',signal:controller.signal}).then(function(r){return r.json().then(function(b){return host+'：'+(r.status===200&&b.version===version&&b.local_probe===true&&b.host===host?'本地探测通过':'未通过');});}).catch(function(){return host+'：未通过';}).then(function(result){clearTimeout(timer);return result;});})).then(function(lines){document.getElementById('probe').textContent='页面协议 '+protocol.slice(0,-1).toUpperCase()+'。'+lines.join('；');});\n  show();\n})();\n\n</script></main></body></html>";
    return local('text/html', html);
  }
  var scoped = ((host === 'vv.video.qq.com' || host === 'vv6.video.qq.com') && /^\/(getvinfo|batchvinfo)$/.test(pathname)) || (host === 'v.qq.com' && pathname === '/cache/wuji_public/object');
  if (!scoped) return $done({});
  function inspectPayload(payload) {
    var LIMIT = 131072, text = '', bytes = null, length = 0, source = 'unavailable', compressed = false;
    var ct = '', encoding = '', headers = payload.headers || {};
    Object.keys(headers).forEach(function (k) {
      if (k.toLowerCase() === 'content-type') ct = String(headers[k]).toLowerCase();
      if (k.toLowerCase() === 'content-encoding') encoding = String(headers[k]).toLowerCase();
    });
    var result = {content_kind: /json/.test(ct) ? 'json' : /xml/.test(ct) ? 'xml' : /x-www-form-urlencoded/.test(ct) ? 'form' : /^text\//.test(ct) ? 'text' : /protobuf|octet-stream/.test(ct) ? 'binary' : ct ? 'other' : 'unknown', content_encoding: /^(gzip|br|deflate|identity)$/.test(encoding) ? encoding : encoding ? 'other' : 'unspecified', markers: [], field_shapes: []};
    if (typeof payload.body === 'string' && (payload.body.length > 0 || payload.bodyBytes === undefined)) { text = payload.body.slice(0, LIMIT); length = payload.body.length; source = 'body-text'; }
    else {
      var candidate = payload.bodyBytes !== undefined ? payload.bodyBytes : payload.body;
      var sourceName = payload.bodyBytes !== undefined ? 'bodyBytes' : 'body';
      try {
        if (Object.prototype.toString.call(candidate) === '[object ArrayBuffer]') { length = candidate.byteLength; bytes = new Uint8Array(candidate, 0, Math.min(length, LIMIT)); }
        else if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(candidate)) { length = candidate.byteLength; bytes = new Uint8Array(candidate.buffer, candidate.byteOffset, Math.min(length, LIMIT)); }
        else if (Array.isArray(candidate)) { length = candidate.length; bytes = new Uint8Array(candidate.slice(0, LIMIT)); }
        if (bytes) source = sourceName + '-bytes';
      } catch (_) {}
      if (bytes) {
        compressed = bytes.length >= 2 && bytes[0] === 31 && bytes[1] === 139;
        if (!compressed) {
          // Strict bounded UTF-8 decoding. No decompression or protobuf interpretation.
          try {
            var encoded = [];
            for (var j = 0; j < bytes.length; j++) encoded.push('%' + ('0' + bytes[j].toString(16)).slice(-2));
            text = decodeURIComponent(encoded.join(''));
          } catch (_) { text = ''; }
        }
      }
    }
    result.body_source = source; result.body_length = length; result.scan_truncated = length > LIMIT;
    result.body_format = source === 'unavailable' ? 'unavailable' : compressed ? 'gzip-bytes' : !text && bytes && length ? 'binary-unreadable' : !text ? 'empty' : 'text';
    var known = ('data|result|results|body|config|configs|items|list|ads|ad|adlist|ad_list|adinfo|ad_info|adparam|adparams|ad_param|ad_params|ad_data|ad_config|adtype|ad_type|adt|isad|is_ad|ad_enabled|advert|advertisement|splash|splash_ad|splashad|splash_config|splash_list|startup|launch|loading|preload|creative|creatives|material|materials|content|cipher_text|duration|timeout|skip|skiptime|skip_time|countdown|display|show|template|show_splash|is_show_ad|vinfo|vinfoad|vinfoparam|buid|reqs|requests|responses|req|rsp|response|code|ret|errcode|errmsg|vl|vi|ul|ui|cl|ci|fl|fi|td|fn|dltype|otype|vid|vids|cmd|command').split('|');
    var carriers = ('data|result|results|body|content|vinfo|vinfoad|vinfoparam|adparam|adparams|ad_param|ad_params|reqs|requests|responses|req|rsp|response').split('|');
    var markers = {confirmed_car_short: /0b53umccyaae6iaf3n46tzvnfi6dfsraik2a/, confirmed_car_long: /0b53bybvuaadxiahgz4wqfvnkdwdlihqgxka/, splash: /(?:\b|_)(?:splash|splashad|splash_ad)(?:\b|_)/i, cipher_text: /["']cipher_text["']\s*:/i, ad_list: /["'](?:adlist|ad_list|adinfo|ad_info|ad_data|ad_config|ads)["']\s*:/i, xml_ad_tag: /<(?:ad|ads|adinfo|ad_info|adlist|ad_list|splash|splash_ad)(?:\s|>)/i, cn_skip: /跳过/, cn_ad: /广告/};
    function scan(value) { Object.keys(markers).forEach(function (k) { if (markers[k].test(value) && result.markers.indexOf(k) < 0) result.markers.push(k); }); }
    function field(label) { if (result.field_shapes.length < 60 && result.field_shapes.indexOf(label) < 0) result.field_shapes.push(label); }
    function kind(v) { return v === null ? 'null' : Array.isArray(v) ? 'array(' + Math.min(v.length, 10000) + ')' : typeof v; }
    var nodes = 0, nestedChars = 0, nestedParses = 0;
    function walk(value, prefix, depth) {
      if (++nodes > 500 || depth > 8 || !value || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.slice(0, 3).forEach(function (v) { walk(v, prefix + '[]', depth + 1); }); return; }
      Object.keys(value).slice(0, 80).forEach(function (key) {
        var lower = key.toLowerCase(), allowed = known.indexOf(lower) >= 0, label = prefix + '.' + (allowed ? lower : '*'), child = value[key];
        if (allowed) field(label + ':' + kind(child));
        walk(child, label, depth + 1);
        if (typeof child === 'string' && carriers.indexOf(lower) >= 0 && nestedParses < 8 && depth < 6 && nestedChars + child.length <= LIMIT) {
          nestedParses++; nestedChars += child.length; scan(child); parse(child, label + '.{embedded}', depth + 1);
        }
      });
    }
    function parse(value, prefix, depth) {
      var trimmed = value.trim(), object;
      if (!trimmed) return 'empty';
      try { object = JSON.parse(trimmed); walk(object, prefix, depth); return 'json'; } catch (_) {}
      var wrapper = trimmed.match(/^(?:var\s+)?QZOutputJson\s*=\s*([\s\S]+?)\s*;?$/);
      if (!wrapper) wrapper = trimmed.match(/^[A-Za-z_$][\w.$]{0,63}\s*\(\s*([\s\S]*)\s*\)\s*;?$/);
      if (wrapper) { try { object = JSON.parse(wrapper[1].replace(/;\s*$/, '')); walk(object, prefix, depth); return 'jsonp'; } catch (_) {} }
      if (/^<\?xml\b|^<[A-Za-z_][\w:.-]*(?:\s|\/?>)/.test(trimmed)) {
        var safe = trimmed.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
        var tag = /<([A-Za-z_][\w:.-]*)(?:\s|\/?>)/g, match, count = 0;
        while ((match = tag.exec(safe)) && count++ < 2000) { var name = match[1].toLowerCase(); if (known.indexOf(name) >= 0) field(prefix + '.<'+ name + '>:xml-tag'); }
        return 'xml';
      }
      if (/^[^&=\s]{1,80}=/.test(trimmed)) {
        trimmed.split('&').slice(0, 80).forEach(function (part) {
          var pos = part.indexOf('='); if (pos < 0) return;
          try {
            var name = decodeURIComponent(part.slice(0, pos).replace(/\+/g, ' ')).toLowerCase();
            var val = decodeURIComponent(part.slice(pos + 1).replace(/\+/g, ' '));
            if (known.indexOf(name) >= 0) field(prefix + '.' + name + ':form-string');
            scan(val);
            if (carriers.indexOf(name) >= 0 && nestedParses < 8 && depth < 6 && nestedChars + val.length <= LIMIT) { nestedParses++; nestedChars += val.length; parse(val, prefix + '.' + name + '.{embedded}', depth + 1); }
          } catch (_) {}
        });
        return 'form';
      }
      return 'text';
    }
    if (text) {
      // XML comments and CDATA can contain examples, not actual response fields.
      var scanText = /^\s*<(?:\?xml\b|[A-Za-z_])/.test(text) ? text.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '') : text;
      scan(scanText); result.body_format = parse(text, '$', 0);
    }
    result.nested_parses = nestedParses;
    return result;
  }

  var state = read();
  if (state.expires <= Date.now()) return $done({});
  function shape(p) {
    return p.split('/').slice(0, 9).map(function (segment) {
      var lower = segment.toLowerCase();
      if (!segment || WORDS.indexOf(lower) >= 0) return lower;
      if (/^v[1-9]$/.test(lower)) return lower;
      var ext = lower.match(/\.(html?|json|js|css|config|config_list|txt|png|jpg|jpeg|webp|gif|mp4|m3u8|ts|woff2?)$/);
      return ext ? ':file.' + ext[1] : ':x';
    }).join('/');
  }
  var cmd = ''; // Parameter values are not retained.
  var phase = responsePhase ? 'response' : 'request';
  function routePath(p) {
    return p.split('/').slice(0, 12).map(function (segment) {
      if (!segment) return '';
      var ext = segment.match(/\.(html?|json|js|css|config|config_list|txt|png|jpg|jpeg|webp|gif|mp4|m3u8|ts|woff2?)$/i);
      var stem = ext ? segment.slice(0, -ext[0].length) : segment;
      var opaque = segment.length > 64 || /[%@;=]/.test(segment) || /^\d+$/.test(stem) || /\d{7,}/.test(stem) || /^(?:user|uid|uin|guid|token|sign|session)[_-]/i.test(stem) || /^[a-f0-9]{16,}$/i.test(stem) || /^[a-f0-9]{8}-[a-f0-9]{4}-/i.test(stem) || (stem.length > 32 && /[a-z]/.test(stem) && /[A-Z0-9]/.test(stem));
      return opaque ? ':opaque' + (ext ? ext[0].toLowerCase() : '') : segment;
    }).join('/');
  }
  var safePath = shape(pathname), route = routePath(pathname), key = host + '|' + route + '|' + cmd + '|' + phase;
  var entry = state.rows.filter(function (r) { return r.key === key; })[0];
  if (!entry) {
    if (state.rows.length >= 100) return $done({});
    entry = {key: key, host: host, path: route, path_shape: safePath, phase: phase, count: 0, first: new Date().toISOString()};
    if (cmd) entry.command_class = cmd;
    state.rows.push(entry);
  }
  entry.count += 1; entry.last = new Date().toISOString();
  {
    var payload = responsePhase ? $response : $request;
    var code = Number(payload.status || payload.statusCode);
    if (code >= 100 && code <= 599 && code === Math.floor(code)) { entry.status = code; entry.status_counts = entry.status_counts || {}; entry.status_counts[String(code)] = (entry.status_counts[String(code)] || 0) + 1; }
    var result = inspectPayload(payload);
    var savedMarkers = entry.markers || [], savedFields = entry.field_shapes || [];
    Object.keys(result).forEach(function (k) { entry[k] = result[k]; });
    entry.markers = savedMarkers.concat(result.markers).filter(function (v, i, a) { return a.indexOf(v) === i; });
    entry.field_shapes = savedFields.concat(result.field_shapes).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 60);
    entry.format_counts = entry.format_counts || {}; entry.format_counts[result.body_format] = (entry.format_counts[result.body_format] || 0) + 1;
  }
  write(state);
  return $done({});
})();
