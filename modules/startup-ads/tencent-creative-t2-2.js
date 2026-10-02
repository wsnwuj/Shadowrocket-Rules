// SPDX-License-Identifier: MIT
// Blocks two confirmed automotive creative identities on two observed CDN hosts.
// Path prefixes and query values are neither retained nor published.
// No script-side HTTP client, telemetry, notifications or account access.
(function () {
  var url = String($request.url || ''), VERSION = 'SR_T2_2_READY';
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
    var html = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>腾讯视频 T2.2 自检</title><style>body{font:16px/1.65 -apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:24px 18px;background:#f5f7fa;color:#17263a}main{max-width:600px;margin:auto}h1{font-size:24px}section{background:white;border-radius:14px;padding:18px;margin:18px 0}.result{font-size:18px;font-weight:600}.note{color:#536174}pre{font-size:13px;white-space:pre-wrap}button{font-size:16px;padding:11px 18px;color:white;background:#176bc6;border:0;border-radius:9px}</style></head><body><main><h1>腾讯视频 T2.2 自检</h1><section><p id="omex" class="result">MP4 路径：正在检查…</p><p id="ltsyz" class="result">TS 分片路径：正在检查…</p><pre id="report"></pre><button id="retry">重新检查</button></section><p class="note">两项通过只确认这两个素材路径的本地拦截。已保存的广告、其他素材和广告展示层仍需实际观察。</p><p class="note">“非自检”次数也可能包含手动打开地址，不能单独证明来自腾讯视频。完成测试后，请同时检查开屏与正片播放。</p><script>\n' +
      '(function(){var routes=[{host:"omex.tc.qq.com",id:"omex",label:"MP4 路径",path:"http://omex.tc.qq.com/gzc_1000127_0b53umccyaae6iaf3n46tzvnfi6dfsraik2a.f10201.mp4"},{host:"ltsyz.gtimg.com",id:"ltsyz",label:"TS 分片路径",path:"http://ltsyz.gtimg.com/__sr_t2_2_probe/00_gzc_1000127_0b53bybvuaadxiahgz4wqfvnkdwdlihqgxka.f322013.1.ts"}];var report=document.getElementById("report");function run(){var nonce=String(Date.now())+"_"+String(Math.random()).slice(2);report.textContent="";Promise.all(routes.map(function(route){var element=document.getElementById(route.id),controller=new AbortController(),timer=setTimeout(function(){controller.abort();},8000);element.textContent=route.label+"：正在检查…";element.style.color="#17263a";return fetch(route.path+"?sr_t2_probe=1&_="+nonce,{cache:"no-store",signal:controller.signal}).then(function(r){return r.json().then(function(b){if(r.status!==410||b.version!=="SR_T2_2_READY"||b.local_block!==true||b.test_request!==true||b.host!==route.host)throw 0;element.textContent=route.label+"：本地拦截通过";element.style.color="#157347";});}).catch(function(){element.textContent=route.label+"：未通过，未收到明确的本地拦截响应";element.style.color="#b42318";}).then(function(){clearTimeout(timer);});})).then(function(){return fetch("/__sr_t2_status?_="+nonce,{cache:"no-store"});}).then(function(r){return r.json();}).then(function(b){if(b.version!=="SR_T2_2_READY")throw 0;report.textContent=JSON.stringify(b,null,2);}).catch(function(){report.textContent="状态读取失败，请保留本页结果。";});}document.getElementById("retry").onclick=run;run();})();\n' +
      '</script></main></body></html>';
    return respond(200, 'text/html', html);
  }
  return $done({});
})();
