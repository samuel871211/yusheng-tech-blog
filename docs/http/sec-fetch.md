---
title: Sec-Fetch
description: Sec-Fetch
last_update:
  date: "2025-07-17T08:00:00+08:00"
---

## Sec-Fetch 是什麼

- `Sec` 是指 `Security`
- `Sec-Fetch` 開頭的 HTTP Request Headers 總共有 4 個
  1. Sec-Fetch-Site
  2. Sec-Fetch-Mode
  3. Sec-Fetch-User
  4. Sec-Fetch-Dest
- 承上，這 4 個 Headers 無法透過 JavaScript 去修改，這是瀏覽器預設就會帶上的

## Sec-Fetch-Site

根據[MDN 官方文件](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site) 的描述

```
indicates the relationship between a request initiator's origin and the origin of the requested resource
```

總共有四種情況

1. cross-site

- 跨域，例如 `a.example.com` 載入 `other.domain.com` 的資源

2. same-origin

- 同源，例如 `a.example.com` 載入 `a.example.com` 的資源

3. same-site

- subdomain，例如 `a.example.com` 載入 `b.example.com` 的資源

4. none

- 直接從瀏覽器網址列輸入網址
- 從瀏覽器書籤進入網址

## Sec-Fetch-Mode

用來告訴 Server "這個請求是怎麼發起的"

總共有 5 種情況，前面 4 種都是 `fetch` 的第二個參數 `options.mode`

1. cors

- `fetch("URL")` 不指定第二個參數 `options.mode` 的情況，預設就是 `cors`

2. navigate

- 直接從瀏覽器網址列輸入網址
- 從瀏覽器書籤進入網址
- `<a>` 或 `location.assign` 等等網址轉導

3. no-cors

- 使用 `<img>` 載入圖片，因為圖片只是要顯示在畫面上，無法透過 JavaScript 讀取圖片的數據。
- `fetch("URL", { mode: "no-cors" })`

4. same-origin

- 在 `a.example.com` 的 F12 > Console 輸入 `fetch("a.example.com", { mode: "same-origin" })`

5. websocket

## Sec-Fetch-User

用來告訴 Server "這個請求是不是使用者主動發起的"

總共有 2 種情況

1. `Sec-Fetch-User: ?1`

- 使用者載入網頁
- 使用者點擊 `<a>`

2. 瀏覽器會 Omit 這個 Header

- 網頁載入的 `<img>`, `<script>`
- F12 > Console 輸入 `fetch("URL")`

## Sec-Fetch-Dest

根據[MDN 官方文件](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Dest) 的描述

```
where (and how) the fetched data will be used
```

有很多種情況，不過大致上就是，要載入哪種資源

1. image => 載入圖片
2. document => 載入 HTML
3. iframe => 載入 iframe

## 實務

實務上，因為這是 2023 Baseline 的功能，我目前只有看過 [webpack-dev-server](https://github.com/webpack/webpack-dev-server) 有加了這層防護

lib/Server.js

```js
if (
  headers["sec-fetch-mode"] === "no-cors" &&
  headers["sec-fetch-site"] === "cross-site"
) {
  res.statusCode = 403;
  res.end("Cross-Origin request blocked");
  return;
}
```

假設我做了一個網站放在 `https://my-site.com`，寫了一段 script 是

```js
fetch("https://your-site.com/user", {
  method: "PUT",
  mode: "no-cors",
  body: JSON.stringify({ name: "string", email: "string" }),
});
```

webpack-dev-server 這樣的防護，可以避免 "執行含有 side effect 的操作"，讀取 response 基本上很難成功，原因如下：

- `https://your-site.com` 需要設定 `Access-Control-Allow-Origin: https://my-site.com`，`fetch` 才能繼續讀取 response
- 假設是用 `<img src="https://your-site.com/user" />` 的方式，攻擊向量就更低，因為只能送出 GET Method（假設網站走 RESTFUL API 設計，GET 只用來讀取資源），用 `<img />` 還是沒辦法透過 JavaScript 讀取 response
- 假設是用 `<img src="https://your-site.com/image.jpg" />` 來載入跨站資源，那可以在 `https://your-site.com` 設定 CORP，詳細可參考我寫過的另一篇文章 [Cross-Origin-Resource-Policy (CORP)](../http/beyond-cors-1.md#cross-origin-resource-policy-corp)，最終的效果基本上是一樣的（保護 `https://your-site.com` 的資源不被跨域載入）

## 結論

我認為 `Sec-Fetch-*` 這些 Fetch Metadata 的使用情境比較小眾，假設要防止跨站偽造請求（CSRF），實務上用 CSRF Token 就好了，這也算是很成熟的 Solution，`Sec-Fetch-*` 只能算是 "多一層防護"，畢竟只要用舊一點的瀏覽器就有機會繞過這層檢查了

如果未來的我在實務上有遇到 `Sec-Fetch-*` 的使用情境的話，我會再回來更新這篇文章的，但目前的研究就先到這邊～

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Dest
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Mode
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-User
- https://developer.mozilla.org/en-US/docs/Glossary/Fetch_metadata_request_header
- https://web.dev/articles/fetch-metadata
- https://developer.mozilla.org/en-US/docs/Web/API/Request/destination
