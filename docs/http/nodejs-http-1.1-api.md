---
title: NodeJS HTTP/1.1 APIs
description: NodeJS HTTP/1.1 APIs
last_update:
  date: "2025-11-23T08:00:00+08:00"
---

## 前言

- 2025/03/09，我踏上了 "Learn HTTP With JS" 的旅程
- 2025/07/17，我寫完了 "Learn HTTP With JS" 30 篇文章
- 2025/08/08，我開啟了在 PortSwigger 的 Web Security 旅程
- 2025/11/08，我把 PortSwigger 的所有 30 個 Web Security 主題刷完一輪

大部分的情境，用 [Burp Suite](https://portswigger.net/burp/communitydownload) 來發 HTTP Request，是最快/最方便的選擇；但偶爾還是會需要寫點程式，雖說 [Burp Suite](https://portswigger.net/burp/communitydownload) 的 [Turbo Intruder Extension](https://portswigger.net/bappstore/9abaa233088242e8be252cd4ff534988) 可以支援寫 Python 腳本，但對於前端仔來說，離開 JS 生態系總是有點那麼不熟悉QQ

當遇到那些需要寫程式的情境，我的首選還是 NodeJS，但 NodeJS http, https, http2 模組提供的 API ，基本上都是 http 協議的封裝，並且會盡量遵守 RFC 規範，並不像 [Burp Suite](https://portswigger.net/burp/communitydownload) 可以直接撰寫 raw HTTP Request 那樣方便

### 範例1: Content-Length

當我們在 NodeJS http 模組撰寫以下程式碼的時候

```ts
import http from "http";

const httpServer = http.createServer().listen(5000);
httpServer.on("request", (req, res) => {
  req.on("data", console.log);
  req.on("end", console.log);
  console.log(req.headers);
  res.end(() => httpServer.close());
});

const clientRequest = http.request("http://localhost:5000/");
clientRequest.end("123");
```

實際上送出的 Request Header Key Value Pairs 是

```js
{ host: 'localhost:5000', connection: 'keep-alive' }
```

並且，Request Body 沒有送出，因為有些 HTTP Agent 的時候，不允許 GET Method 有 Body，參考 [RFC 9110 section-9.3.1](https://datatracker.ietf.org/doc/html/rfc9110#section-9.3.1)

```
A client SHOULD NOT generate content in a GET request unless it is made directly to an origin server that has previously indicated, in or out of band, that such a request has a purpose and will be adequately supported.
```

類似的情況還有很多，也讓我想要深入理解 NodeJS HTTP/1.1 的那些 APIs，背後到底做了什麼事情

<!-- 是由 PortSwigger 這間專門在 Web Security 的公司，研發的產品。它是一個 HTTP(s) Proxy，同時也是 Web Security 的滲透測試工具，功能非常強大 -->

<!-- 如果想要看 raw HTTP Request 跟 raw HTTP Response， -->
