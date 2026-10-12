(function () {
  var config = window.AIVIC_AUTH || null;
  var testMode = window.AIVIC_TEST_MODE === true;
  var storageKey = config ? "aivic-auth:" + config.clientId : "";
  var pendingKey = storageKey + ":pending";
  var inPanels = /\/panels\//.test(window.location.pathname);
  var rootPrefix = inPanels ? "../" : "./";
  var isLoginPage = /\/login\.html$/.test(window.location.pathname);
  var nativeFetch = window.fetch.bind(window);

  function readJson(key) {
    try { return JSON.parse(window.localStorage.getItem(key) || "null"); } catch (error) { return null; }
  }
  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
  function clearSession() {
    window.localStorage.removeItem(storageKey);
    window.localStorage.removeItem(pendingKey);
  }
  function claimsOf(token) {
    try {
      var payload = String(token || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      var binary = window.atob(payload);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
      return {};
    }
  }
  function messageFor(code, fallback) {
    if (code === "NotAuthorizedException" || code === "UserNotFoundException") return "メールアドレスまたはパスワードが正しくありません。";
    if (code === "InvalidPasswordException") return "パスワードは 8 文字以上で、英大文字・英小文字・数字を含めてください。";
    if (code === "PasswordResetRequiredException") return "パスワードの再設定が必要です。管理者に連絡してください。";
    if (code === "TooManyRequestsException" || code === "LimitExceededException") return "試行回数が多すぎます。しばらく待ってからもう一度お試しください。";
    return fallback || "ログインの処理に失敗しました。もう一度お試しください。";
  }
  function cognito(target, body) {
    return nativeFetch("https://cognito-idp." + config.region + ".amazonaws.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService." + target,
      },
      body: JSON.stringify(body),
    }).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          var code = String((data && data.__type) || "").split("#").pop();
          var error = new Error(messageFor(code, data && data.message));
          error.code = code;
          throw error;
        }
        return data;
      });
    });
  }
  function storeTokens(result, previousRefreshToken) {
    var idToken = result.IdToken;
    var session = {
      idToken: idToken,
      refreshToken: result.RefreshToken || previousRefreshToken || "",
      expiresAtEpochMs: Number(claimsOf(idToken).exp || 0) * 1000,
    };
    writeJson(storageKey, session);
    window.localStorage.removeItem(pendingKey);
    return session;
  }
  function requireConfig() {
    if (!config) throw new Error("このアプリではログインが有効になっていません。");
  }
  function loginUrl() {
    return rootPrefix + "login.html?return=" + encodeURIComponent(window.location.href);
  }
  function redirectToLogin() {
    if (isLoginPage) return;
    window.location.replace(loginUrl());
  }
  function refresh(session) {
    return cognito("InitiateAuth", {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: config.clientId,
      AuthParameters: { REFRESH_TOKEN: session.refreshToken },
    }).then(function (data) {
      return storeTokens(data.AuthenticationResult, session.refreshToken);
    });
  }
  function currentToken() {
    if (testMode) return Promise.resolve("test-mode");
    var session = readJson(storageKey);
    if (!session || !session.idToken) return Promise.reject(new Error("ログインが必要です。"));
    if (session.expiresAtEpochMs - Date.now() > 5 * 60 * 1000) return Promise.resolve(session.idToken);
    if (!session.refreshToken) return Promise.reject(new Error("ログインの有効期限が切れました。"));
    return refresh(session).then(function (renewed) { return renewed.idToken; });
  }
  function isProtected(url) {
    var targets = [window.AIVIC_API_URL, window.AIVIC_GATEWAY_URL];
    for (var i = 0; i < targets.length; i += 1) {
      var base = String(targets[i] || "").replace(/\/+$/, "");
      if (base && base !== "REPLACE_WITH_API_URL" && String(url).indexOf(base) === 0) return true;
    }
    return false;
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (!config || testMode || !isProtected(url)) return nativeFetch(input, init);
    return currentToken().then(function (token) {
      var headers = new Headers((init && init.headers) || (typeof input !== "string" && input.headers) || {});
      headers.set("Authorization", "Bearer " + token);
      return nativeFetch(input, Object.assign({}, init || {}, { headers: headers }));
    }, function (error) {
      clearSession();
      redirectToLogin();
      throw error;
    }).then(function (response) {
      if (response.status === 401) {
        clearSession();
        redirectToLogin();
      }
      return response;
    });
  };

  window.aivicAuth = {
    isEnabled: function () { return Boolean(config) && !testMode; },
    signIn: function (email, password) {
      if (testMode) return Promise.resolve({ status: "signed_in" });
      try { requireConfig(); } catch (error) { return Promise.reject(error); }
      var username = String(email || "").trim().toLowerCase();
      return cognito("InitiateAuth", {
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: config.clientId,
        AuthParameters: { USERNAME: username, PASSWORD: String(password || "") },
      }).then(function (data) {
        if (data.ChallengeName === "NEW_PASSWORD_REQUIRED") {
          writeJson(pendingKey, { session: data.Session, username: username });
          return { status: "new_password_required" };
        }
        if (data.ChallengeName) throw new Error("このログイン方法には対応していません。管理者に連絡してください。");
        storeTokens(data.AuthenticationResult, "");
        return { status: "signed_in" };
      });
    },
    completeNewPassword: function (newPassword) {
      if (testMode) return Promise.resolve({ status: "signed_in" });
      try { requireConfig(); } catch (error) { return Promise.reject(error); }
      var pending = readJson(pendingKey);
      if (!pending) return Promise.reject(new Error("もう一度メールアドレスと仮のパスワードでログインしてください。"));
      return cognito("RespondToAuthChallenge", {
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        ClientId: config.clientId,
        Session: pending.session,
        ChallengeResponses: { USERNAME: pending.username, NEW_PASSWORD: String(newPassword || "") },
      }).then(function (data) {
        storeTokens(data.AuthenticationResult, "");
        return { status: "signed_in" };
      });
    },
    afterLoginUrl: function () {
      var requested = new URLSearchParams(window.location.search).get("return") || "";
      try {
        if (requested && new URL(requested, window.location.href).origin === window.location.origin) return requested;
      } catch (error) {
        return rootPrefix + "index.html";
      }
      return rootPrefix + "index.html";
    },
    signOut: function () {
      clearSession();
      window.location.replace(rootPrefix + "login.html");
    },
    currentUser: function () {
      if (testMode) return { email: "test@example.com", isAdmin: true };
      var session = readJson(storageKey);
      if (!session || !session.idToken) return null;
      var claims = claimsOf(session.idToken);
      var groups = Array.isArray(claims["cognito:groups"]) ? claims["cognito:groups"] : [];
      return { email: String(claims.email || ""), isAdmin: groups.indexOf("admin") >= 0 };
    },
    settingsUrl: function () { return rootPrefix + "settings.html"; },
  };

  if (!config || testMode) return;
  var session = readJson(storageKey);
  if (!isLoginPage && (!session || !session.idToken)) {
    document.documentElement.style.visibility = "hidden";
    redirectToLogin();
    return;
  }
  if (isLoginPage) return;
  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector("[data-aivic-user-menu]")) return;
    var user = window.aivicAuth.currentUser();
    var menu = document.createElement("div");
    menu.setAttribute("data-aivic-user-menu", "");
    menu.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483000;display:flex;gap:8px;align-items:center;padding:6px 10px;border-radius:999px;background:rgba(20,24,32,.88);color:#fff;font:12px/1.4 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25)";
    var label = document.createElement("span");
    label.textContent = user ? user.email : "";
    var settings = document.createElement("a");
    settings.href = window.aivicAuth.settingsUrl();
    settings.textContent = "設定";
    settings.setAttribute("data-testid", "aivic-open-settings");
    settings.style.cssText = "color:#9cc4ff;text-decoration:none";
    var signOut = document.createElement("button");
    signOut.type = "button";
    signOut.textContent = "ログアウト";
    signOut.setAttribute("data-testid", "aivic-sign-out");
    signOut.style.cssText = "border:0;background:transparent;color:#9cc4ff;cursor:pointer;font:inherit;padding:0";
    signOut.addEventListener("click", function () { window.aivicAuth.signOut(); });
    menu.appendChild(label);
    menu.appendChild(settings);
    menu.appendChild(signOut);
    document.body.appendChild(menu);
  });
})();
