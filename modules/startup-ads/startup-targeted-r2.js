// SPDX-License-Identifier: GPL-3.0-or-later
// Shadowrocket startup response patch, 2026-10-02 R2.
// SMZDM loading-data removal follows fmz200 / Smzdm.js:
// https://github.com/fmz200/wool_scripts/blob/5d5f63fcf98bc69d5f8f1b1bae6f86a01ee4bb97/Scripts/smzdm/Smzdm.js
// Cainiao material 39017 exception follows the rule shared by 小白脸:
// https://t.me/s/nobyda/1017
// Diagnostics log only the handler and outcome; no query, headers or body.
(function () {
  var url = String($request.url || "");
  var smzdm = /^https?:\/\/app-api\.smzdm\.com(?::443)?\/util\/loading\/?(?:\?|$)/.test(url);
  var cainiao = /^https?:\/\/netflow-mtop\.cainiao\.com(?::443)?\/gw\/mtop\.cainiao\.guoguo\.nbnetflow\.ads\./.test(url);
  if (!smzdm && !cainiao) return $done({});
  var label = smzdm ? "SMZDM-loading" : "Cainiao-netflow-ads";
  if (!$response.body) {
    console.log("[StartupAds R2] " + label + " empty-body/pass");
    return $done({});
  }
  try {
    var body = JSON.parse($response.body);
    if (!body || typeof body !== "object" || Array.isArray(body) || !Object.prototype.hasOwnProperty.call(body, "data")) {
      console.log("[StartupAds R2] " + label + " unknown-shape/pass");
      return $done({});
    }
    if (smzdm) {
      // This exact endpoint supplies startup material; retain status metadata.
      delete body.data;
    } else {
      if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
        console.log("[StartupAds R2] " + label + " unknown-data/pass");
        return $done({});
      }
      var first = Array.isArray(body.data.result) ? body.data.result[0] : null;
      if (first && String(first.materialId) === "39017") {
        console.log("[StartupAds R2] " + label + " preserved-39017");
        return $done({});
      }
      body.data = {};
    }
    console.log("[StartupAds R2] " + label + " filtered");
    return $done({ body: JSON.stringify(body) });
  } catch (_) {
    console.log("[StartupAds R2] " + label + " invalid-json/pass");
    return $done({});
  }
})();
