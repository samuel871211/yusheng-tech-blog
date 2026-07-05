---
title: HTTP Link
description: HTTP Link
last_update:
  date: "2026-07-05T08:00:00+08:00"
---

## Browser compatibility

翻開 [MDN 文件](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Link#browser_compatibility) 的話，會發現其實各瀏覽器大約都在 2022 ~ 2023 年才開始支援在 HTTP response header 設定 `<Link>`，其實算是蠻新的功能。我自己也只有在 [hackerone](https://www.hackerone.com/) 看到有設定

![hackerone-link](../../static/img/hackerone-link.jpg)

## Basic Syntax

以上圖 hackerone 的網站為例

```
</assets/static/main_css-ClkKLtaZ.css>; rel=preload; as=style; nopush
```

前面三個區塊，我想應該沒什麼問題，等同於

```html
<link href="/assets/static/main_css-ClkKLtaZ.css" rel="preload" as="style" />
```

至於 nopush，這是 HTTP/2 的語法，本篇暫時不討論

<!-- 會在未來的 [HTTP/2](./http-2.md) 介紹到 -->

## Why use HTTP Link instead of HTML `<link>`?

簡單講，就是因為 HTTP Link 可以比較快載入。假設某網站的首頁回傳的 HTTP response 為

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Date: Tue, 18 Nov 2025 11:09:52 GMT
Transfer-Encoding: chunked
Link: </assets/static/main_css-ClkKLtaZ.css>; rel=preload; as=style


```

瀏覽器收到 response headers 的當下，就可以開始 preload 對應的資源，不用等 HTML 回傳！

## HTTP Link Use Cases

上一篇文章，談了很多 [`<link rel>`](./link-html.md) 的用法，但根據 [MDN 文件](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Link)，能用在 HTTP Link 的只有

- [`<link rel="preload">`](./link-html.md#link-relpreload)
- [`<link rel="preconnect">`](./link-html.md#link-relpreconnect)

簡單理解的話，因為 HTTP Link（response header）是在 HTML（response body）之前抵達

所以那些設定在 HTML 身上，例如 `<link rel="icon" href="favicon.ico">`，主流瀏覽器不一定有支援

## Syntax

```
Link: <https://example.com>; rel="preconnect"
Link: <https://example.com/%E5%B8%A5%E5%93%A5>; rel="preconnect" // 帥哥
Link: <https://one.example.com>; rel="preconnect", <https://two.example.com>; rel="preconnect"
Link: </style.css>; rel=preload; as=style; fetchpriority="high"
```

## preconnect via HTTP Link

<!-- todo-yus -->

使用 Node.js http 模組，測試是否真的有建立 TCP 連線

index.ts

```ts
if (url.pathname === "/preconnect") {
  res.setHeader("link", `<http://localhost:5001>; rel="preconnect"`);
  res.setHeader("content-type", "text/html");
  res.end(readFileSync(join(__dirname, "preconnect.html")));
  return;
}

http5001Server.on("connection", () => console.log("connection"));
```

preconnect.html

```html
<html>
  <head></head>
  <body></body>
</html>
```

瀏覽器訪問 http://localhost:5000/preconnect 的當下，就可以在 Node.js Log 看到

```
connection
```

如果立即重整頁面，會發現沒有觸發 connection，我們看看 Node.js http 模組的 [server.timeout](https://nodejs.org/api/http.html#servertimeout)

```
Type: <number> Timeout in milliseconds. Default: 0 (no timeout)
The number of milliseconds of inactivity before a socket is presumed to have timed out.
```

嘗試將 Node.js server.timeout 調成 5 秒

```ts
http5001Server.timeout = 5000;
http5001Server.on("connection", (socket) => {
  console.log("connection");
  console.time("connection");
  socket.on("error", console.log);
  socket.on("close", (hadError) => {
    console.timeEnd("connection");
    console.log({ event: "close", hadError });
  });
});
```

重整瀏覽器，5 秒後收到

```
connection
connection: 5.015s
{ event: 'close', hadError: false }
```

<!-- todo-yus -->
<!-- :::info
關於 Node.js http 模組的各種 timeout，我打算在未來專門寫一篇文章來探討 [Node.js HTTP/1.1 timeout](./nodejs-http-1.1-timeout.md)
::: -->

<!-- todo-yus timeout -->
<!-- Chrome v142.0.7444.177 實測後
```
connection
Error: Request timeout
  at onRequestTimeout (node:_http_server:871:30)
  at Server.checkConnections (node:_http_server:684:7)
  at listOnTimeout (node:internal/timers:608:17)
  at processTimers (node:internal/timers:543:7) {
  code: 'ERR_HTTP_REQUEST_TIMEOUT'
}
connection: 1:26.201 (m:ss.mmm)
{ event: 'close', hadError: true }
```

卡在一個神奇的 86 秒，且 `hasError: true`...

為了驗證 86 秒是瀏覽器主動斷開的，我們將 server 的 timeout 調低 -->

另外還有一個情境會關閉連線，那就是: 關閉所有瀏覽器視窗

## preload via HTTP Link

使用 Node.js http 模組測試

localhost:5000

```ts
if (url.pathname === "/preload") {
  res.setHeader(
    "link",
    `<http://localhost:5001/preload.js>; rel="preload"; as="script"`,
  );
  res.setHeader("content-type", "text/html");
  res.end(readFileSync(join(__dirname, "preload.html")));
  return;
}
```

為了驗證 HTTP Link 的執行時機早於 HTML Link，在 preload.html 也載入同樣資源，用 `?from=head` 來區分

```html
<html>
  <head>
    <script src="http://localhost:5001/preload.js?from=head"></script>
  </head>
  <body></body>
</html>
```

localhost:5001

```ts
if (url.pathname === "/preload.js") {
  console.log(url.searchParams);
  res.setHeader("content-type", "text/javascript");
  res.end(`const preload = true;`);
  return;
}
```

瀏覽器輸入 http://localhost:5000/preload ，可以看到 HTTP Link 確實更快載入
![http-link-earlier-than-html-link](../../static/img/http-link-earlier-than-html-link.jpg)

```
URLSearchParams {}
URLSearchParams { 'from' => 'head' }
```

### Edge Case 1: preload + Content-Type !== text/html

既然 HTTP Link 是 HTML `<link>` 的 alternative，那如果設定在 "Content-Type !== text/html" 還會生效嗎？

我在 Google Font 有看過這種設定
![google-font-css-http-link](../../static/img/google-font-css-http-link.jpg)

但還是寫個 PoC 來驗證

localhost:5000

```ts
if (url.pathname === "/js-with-link-preload") {
  res.setHeader(
    "link",
    `<http://localhost:5001/preload.js>; rel="preload"; as="script"`,
  );
  res.setHeader("content-type", "text/javascript");
  res.end(readFileSync(join(__dirname, "preload.html")));
  return;
}
```

瀏覽器訪問 http://localhost/js-with-link-preload ，有成功 preload，不過因為沒有用到這個資源，所以瀏覽器會跳 warning
![preload-not-use-in-few-seconds](../../static/img/preload-not-use-in-few-seconds.jpg)

<!-- todo-yus -->

<!-- ### Edge Case 2: preconnect + HTTP/1.1 Connection: closed

### Edge Case 3: link block HTML render

### Edge Case 4: maximum links

### Edge Case 5: HOL Blocking

## 103 early hints -->

<!-- https://developers.cloudflare.com/cache/advanced-configuration/early-hints/ -->
<!-- application layer 感覺難實作吧，SSR 框架誰有支援 -->

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Link
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/103
- https://nodejs.org/api/http.html#responsewriteearlyhintshints-callback
- https://developers.cloudflare.com/cache/advanced-configuration/early-hints/
- https://datatracker.ietf.org/doc/html/rfc8297
