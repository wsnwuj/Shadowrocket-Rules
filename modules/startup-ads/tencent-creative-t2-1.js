// SPDX-License-Identifier: MIT
// Local response for two verified public creatives. No account/header/query values stored.
// No script-side HTTP client, analytics, or external logging.
(function () {
  var url = String($request.url || '');
  var base = '^https?://omex\\.tc\\.qq\\.com(?::(?:80|443))?/';
  var media = new RegExp(base + 'gzc_1000127_(?:0b53umccyaae6iaf3n46tzvnfi6dfsraik2a|0b53bybvuaadxiahgz4wqfvnkdwdlihqgxka)\\.f\\d+\\.mp4(?:\\?[^#]*)?$');
  var check = new RegExp(base + '__sr_t2_check(?:\\?[^#]*)?$');
  var status = new RegExp(base + '__sr_t2_status(?:\\?[^#]*)?$');
  var key = 'tencent_creative_t2_1_counts';
  function read() {
    try {
      var value = JSON.parse($persistentStore.read(key) || '{}');
      return {
        app_media_blocks: typeof value.app_media_blocks === 'number' && value.app_media_blocks >= 0 ? value.app_media_blocks : 0,
        selftest_blocks: typeof value.selftest_blocks === 'number' && value.selftest_blocks >= 0 ? value.selftest_blocks : 0
      };
    } catch (_) { return {app_media_blocks: 0, selftest_blocks: 0}; }
  }
  function respond(code, type, body) {
    return $done({response: {status: code, headers: {'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Pragma': 'no-cache'}, body: body}});
  }
  if (media.test(url)) {
    var probe = /[?&]sr_t2_probe=1(?:&|$)/.test(url);
    try {
      var counts = read();
      counts[probe ? 'selftest_blocks' : 'app_media_blocks'] += 1;
      $persistentStore.write(JSON.stringify(counts), key);
    } catch (_) {}
    return respond(410, 'application/json', JSON.stringify({version: 'SR_T2_1_READY', local_block: true, test_request: probe}));
  }
  if (status.test(url)) {
    var report = read();
    report.version = 'SR_T2_1_READY';
    report.note = 'Counts confirm rule execution only; cached ads and other creatives are not covered.';
    return respond(200, 'application/json', JSON.stringify(report, null, 2));
  }
  if (check.test(url)) {
    var html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>腾讯视频 T2.1 自检</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:28px 20px;background:#f5f7fa;color:#15233a;line-height:1.65}main{max-width:560px;margin:auto}h1{font-size:24px}section{padding:18px;background:white;border-radius:14px;margin:18px 0}#result{font-size:19px;font-weight:600}.note{color:#526176;font-size:15px}pre{white-space:pre-wrap;font-size:14px}button{font-size:16px;padding:10px 18px;border:0;border-radius:10px;background:#176bc6;color:white}</style></head><body><main><h1>腾讯视频 T2.1 自检</h1><section><p id="result">正在检查素材请求拦截…</p><p id="counts">正在读取命中次数…</p><pre id="report"></pre><button id="retry" type="button">重新检查</button></section><p class="note">页面会测试一条已确认的汽车素材路径。通过只说明这条素材请求已被本地拦截；手机里已经保存的广告仍可能展示。</p><p class="note">“素材请求”统计除自检以外的已确认素材拦截次数，不包含其他广告。</p><script>\n' +
      '(function(){var result=document.getElementById("result"),counts=document.getElementById("counts"),report=document.getElementById("report");\n' +
      'function run(){result.textContent="正在检查素材请求拦截…";result.style.color="#15233a";report.textContent="";var nonce=String(Date.now())+"_"+String(Math.random()).slice(2);\n' +
      'fetch("/gzc_1000127_0b53umccyaae6iaf3n46tzvnfi6dfsraik2a.f10201.mp4?sr_t2_probe=1&_="+nonce,{cache:"no-store"}).then(function(r){return r.json().then(function(b){if(r.status!==410||b.version!=="SR_T2_1_READY"||b.local_block!==true||b.test_request!==true)throw new Error("未收到本地拦截标识");result.textContent="自检通过：素材请求已被本地拦截。";result.style.color="#157347";});}).catch(function(){result.textContent="自检未通过：没有收到明确的本地拦截响应。";result.style.color="#b42318";}).then(function(){return fetch("/__sr_t2_status?_="+nonce,{cache:"no-store"});}).then(function(r){return r.json();}).then(function(b){if(b.version!=="SR_T2_1_READY")throw new Error("状态标识不匹配");counts.textContent="素材请求："+b.app_media_blocks+" 次；自检请求："+b.selftest_blocks+" 次。";report.textContent=JSON.stringify(b,null,2);}).catch(function(){counts.textContent="命中次数读取失败，请保留本页截图。";});}\n' +
      'document.getElementById("retry").addEventListener("click",run);run();})();\n' +
      '</script></main></body></html>';
    return respond(200, 'text/html', html);
  }
  return $done({});
})();
