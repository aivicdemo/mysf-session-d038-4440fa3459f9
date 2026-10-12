(function () {
  var gatewayUrl = String(window.AIVIC_GATEWAY_URL || "").replace(/\/+$/, "");
  var appId = String(window.AIVIC_APP_ID || (window.AIVIC_AUTH && window.AIVIC_AUTH.appId) || "");

  function call(method, path, body) {
    if (!gatewayUrl) return Promise.reject(new Error("このアプリでは設定の受け口が用意されていません。"));
    return window.fetch(gatewayUrl + path + (path.indexOf("?") >= 0 ? "&" : "?") + "app=" + encodeURIComponent(appId), {
      method: method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (error) { data = {}; }
        if (!response.ok) {
          var failure = new Error(String(data.error || "処理に失敗しました（" + response.status + "）。"));
          failure.code = data.code || "";
          throw failure;
        }
        return data;
      });
    });
  }

  window.aivicSettings = {
    me: function () { return call("GET", "/me"); },
    listUsers: function () { return call("GET", "/users").then(function (data) { return data.users || []; }); },
    inviteUser: function (email, isAdmin) { return call("POST", "/users", { email: email, isAdmin: isAdmin === true }); },
    listConnections: function () { return call("GET", "/connections").then(function (data) { return data.connections || []; }); },
    saveConnectionSettings: function (connectionId, settings) {
      return call("PUT", "/connections/" + encodeURIComponent(connectionId) + "/settings", settings);
    },
    connect: function (connectionId) {
      var returnUrl = window.location.origin + window.location.pathname;
      return call("POST", "/connections/" + encodeURIComponent(connectionId) + "/begin", { returnUrl: returnUrl }).then(function (data) {
        if (data.authorizeUrl) {
          window.location.assign(data.authorizeUrl);
          return { status: "redirecting" };
        }
        return { status: "connected" };
      });
    },
    disconnect: function (connectionId) {
      return call("POST", "/connections/" + encodeURIComponent(connectionId) + "/disconnect", {});
    },
    connectionResult: function () {
      var params = new URLSearchParams(window.location.search);
      if (!params.get("connection")) return null;
      return {
        connectionId: params.get("connection"),
        result: params.get("result") || "",
        detail: params.get("detail") || "",
      };
    },
  };
})();
