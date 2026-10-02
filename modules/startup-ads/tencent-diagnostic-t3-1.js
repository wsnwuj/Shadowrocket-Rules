// SPDX-License-Identifier: MIT
// Temporary, opt-in, three-minute local observer. Ordinary traffic is passed unchanged.
// Stores masked request paths locally for identification; never retains queries, headers, raw bodies or arbitrary JSON keys.
// No script-side HTTP client, notifications, external telemetry or console logging.
(function () {
  var VERSION = 'SR_T3_1_DIAGNOSTIC', KEY = 'tencent_t3_1_observer', WINDOW = 180000;
  var HOSTS = ['v.qq.com', 'm.v.qq.com', 'vfiles.gtimg.cn', 'mcgi.v.qq.com', 'rdelivery.qq.com'];
  var match = String($request.url || '').match(/^https?:\/\/([a-z0-9.-]+)(?::(?:80|443))?(\/[^?#]*)?(?:\?([^#]*))?$/i);
  if (!match) return $done({});
  var host = match[1].toLowerCase(), pathname = match[2] || '/', query = match[3] || '';
  var responsePhase = typeof $response !== 'undefined';
  var WORDS = ('pub|video_float_ad_config.config_list|v1|v2|v3|config|pull|batchpull|get|sdkconfig|statistic|report|commdatav2|x|api|cgi-bin|fcgi-bin|h5|html|index.html|index|home|page|pages|player|play|ad|ads|advert|advertisement|splash|startup|launch|start|loading|preload|realtime|creative|material|media|video|float|float_ad|open|config_list|ad_config|splash_config|json|data|list|adlist|ad_list|splashad|splash_ad|getad|getsplash|splashscreen').split('|');
  var FIELDS = ('data|result|body|config|configs|list|items|ads|ad|adlist|ad_list|adinfo|ad_info|ad_data|ad_config|advert|advertisement|splash|splash_ad|splashad|splash_config|splash_list|startup|launch|loading|preload|creative|creatives|material|materials|content|cipher_text|isad|is_ad|ad_enabled|splash_enabled|show_splash|is_show_ad').split('|');
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
    return $done({response: {status: 200, headers: {'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': 'http://omex.tc.qq.com'}, body: body}});
  }
  function report(state) {
    return {version: VERSION, active: state.expires > Date.now(), started: state.started ? new Date(state.started).toISOString() : null,
      expires: state.expires ? new Date(state.expires).toISOString() : null,
      note: 'Observer only. Field/keyword presence does not prove an ad. Static route names are retained; long, encoded and identifier-like path segments are masked. Path groups may combine endpoints; markers/fields are cumulative. Query/header/body values are never retained. UDP/QUIC and pinned TLS are not covered.',
      entries: state.rows};
  }
  if (!responsePhase && HOSTS.indexOf(host) >= 0 && pathname === '/__sr_t3_probe') {
    return local('application/json', JSON.stringify({version: VERSION, local_probe: true, host: host}));
  }
  if (!responsePhase && host === 'omex.tc.qq.com' && /^\/__sr_t3_(check|status|reset)$/.test(pathname)) {
    if (pathname === '/__sr_t3_reset') {
      var next = {started: Date.now(), expires: Date.now() + WINDOW, rows: []};
      var ok = write(next);
      return local('application/json', JSON.stringify({version: VERSION, recording_started: ok, duration_seconds: 180}));
    }
    if (pathname === '/__sr_t3_status') return local('application/json', JSON.stringify(report(read()), null, 2));
    var html = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>腾讯视频 T3.1 临时诊断</title><style>body{font:16px/1.6 -apple-system,sans-serif;margin:24px;background:#f4f6f9;color:#17263a}main{max-width:650px;margin:auto}h1{font-size:24px}button{background:#176bc6;color:white;border:0;border-radius:8px;padding:12px;margin:4px;font-size:16px}pre{white-space:pre-wrap;background:white;padding:15px;border-radius:10px;font-size:13px}a{color:#176bc6}</style><main><h1>腾讯视频 T3.1 临时诊断</h1><p>保留现有广告拦截，观察腾讯网页和配置接口。记录接口路径、广告字段和次数。查询参数、请求头和正文不保存；路径中的长串标识会遮盖。报告只保存在手机本地。</p><p id="probe">正在检查五个观察域名的 HTTPS 解密…</p><button id="start">开始本次记录（3 分钟）</button><button id="refresh">刷新报告</button><p id="hint">先点击开始，再退出腾讯视频后台并重新打开一次；见到广告后回到本页刷新。</p><p>不需要清缓存或重装。字段出现只是线索；空报告也不能证明没有广告。UDP/QUIC 请求及证书绑定的连接不在本次范围内。</p><p><a href="/__sr_t3_status">打开 JSON 报告，长按复制全文</a></p><pre id="report"></pre><script>\n' +
      '(function(){var pre=document.getElementById("report"),hint=document.getElementById("hint");function show(){fetch("/__sr_t3_status?_="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();}).then(function(b){if(b.version!=="SR_T3_1_DIAGNOSTIC")throw 0;pre.textContent=JSON.stringify(b,null,2);}).catch(function(){pre.textContent="报告读取失败";});}document.getElementById("refresh").onclick=show;document.getElementById("start").onclick=function(){fetch("/__sr_t3_reset?_="+Date.now(),{cache:"no-store"}).then(function(r){return r.json();}).then(function(b){hint.textContent=b.version==="SR_T3_1_DIAGNOSTIC"&&b.recording_started?"记录已开始。现在退出腾讯视频后台，重新打开一次，见到广告后回本页刷新。":"没有成功开始记录，请保留截图。";show();}).catch(function(){hint.textContent="开始记录失败";});};var hosts=' + JSON.stringify(HOSTS) + ';Promise.all(hosts.map(function(h){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},8000);return fetch("https://"+h+"/__sr_t3_probe?_="+Date.now(),{cache:"no-store",signal:controller.signal}).then(function(r){return r.json();}).then(function(b){return h+": "+(b.version==="SR_T3_1_DIAGNOSTIC"&&b.local_probe===true&&b.host===h?"本地探测通过":"未通过");}).catch(function(){return h+": 未通过";}).then(function(s){clearTimeout(timer);return s;});})).then(function(lines){document.getElementById("probe").textContent=lines.join("； ");});show();})();\n' +
      '</script></main></html>';
    return local('text/html', html);
  }
  if (HOSTS.indexOf(host) < 0 || pathname === '/__sr_t3_probe') return $done({});
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
  var cmd = host === 'mcgi.v.qq.com' && pathname === '/commdatav2' && /(?:^|&)cmd=29(?:&|$)/.test(query) ? 'cmd29' : '';
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
  if (responsePhase) {
    var code = Number($response.status || $response.statusCode);
    if (code >= 100 && code <= 599) entry.status = code;
    var ct = '', headers = $response.headers || {};
    Object.keys(headers).some(function (k) { if (k.toLowerCase() === 'content-type') {ct = String(headers[k]).toLowerCase(); return true;} return false; });
    entry.content_kind = /json/.test(ct) ? 'json' : /html/.test(ct) ? 'html' : /javascript/.test(ct) ? 'javascript' : /^text\//.test(ct) ? 'text' : ct ? 'other' : 'unknown';
    var body = typeof $response.body === 'string' ? $response.body : '';
    entry.body_chars = body.length;
    var scan = body.slice(0, 131072);
    entry.scan_truncated = body.length > scan.length;
    var markers = {
      splash: /(?:\b|_)(?:splash|splashad|splash_ad)(?:\b|_)/i,
      launch_ad: /(?:launch|startup|start|loading)[_ -]?(?:ad|advert)\b/i,
      ad_list: /["'](?:adlist|ad_list|adinfo|ad_info|ad_data|ad_config|ads)["']\s*:/i,
      cipher_text: /["']cipher_text["']\s*:/i,
      cn_splash: /开屏/, cn_skip: /跳过/, cn_ad: /广告/,
      flip_phone: /翻转手机/, ad_jump: /跳转详情页或第三方应用/
    };
    var foundMarkers = Object.keys(markers).filter(function (k) { return markers[k].test(scan); });
    entry.markers = (entry.markers || []).concat(foundMarkers).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var fields = [], nodes = 0;
    function walk(value, prefix, depth) {
      if (++nodes > 500 || depth > 8 || fields.length >= 24 || !value || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.slice(0, 3).forEach(function (v) { walk(v, prefix + '[]', depth + 1); }); return; }
      Object.keys(value).slice(0, 80).forEach(function (k) {
        var lower = k.toLowerCase(), known = FIELDS.indexOf(lower) >= 0, child = value[k], label = prefix + '.' + (known ? lower : '*');
        if (known && fields.length < 24) {
          var type = child === null ? 'null' : Array.isArray(child) ? 'array(' + Math.min(child.length, 10000) + ')' : typeof child;
          fields.push(label + ':' + type);
        }
        walk(child, label, depth + 1);
      });
    }
    if (body && body.length <= 131072) { try { walk(JSON.parse(body), '$', 0); } catch (_) {} }
    entry.field_shapes = (entry.field_shapes || []).concat(fields).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 40);
  }
  write(state);
  return $done({});
})();
