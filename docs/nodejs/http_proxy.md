---
title: Built-in Proxy Support
description: "帶你了解 Node.js 在 v24.5.0 加入的 Built-in Proxy Support"
last_update:
  date: "2026-03-06T08:00:00+08:00"
---

## 前言

在開始介紹之前，先來比較一下 "Forward Proxy" 跟 "Reverse Proxy" 的差異

## Forward Proxy vs Reverse Proxy

Forward Proxy

```mermaid
flowchart LR
  A["Client 1:<br/>GET https://google.com"] --> B[Forward Proxy]
  C["Client 2:<br/>GET http://example.com"] --> B
  B --> D["GET /<br/>Host: google.com"]
  B --> E["GET /<br/>Host: example.com"]
```

Reverse Proxy

```mermaid
flowchart LR
  A["Client 1:<br/>GET https://example.com"] --> B[Reverse Proxy]
  C["Client 2:<br/>GET https://example.com"] --> B
  B --> D["Origin Server 1<br/>GET http://localhost:8000"]
  B --> E["Origin Server 2<br/>http://localhost:8001"]
```

|          | Forward Proxy                            | Reverse Proxy                           |
| -------- | ---------------------------------------- | --------------------------------------- |
| 隱私     | 保護 Client 的真實 IP                    | 保護 Server 的真實 IP                   |
| 部署位置 | 靠近 Client 端（通常在內網出口）         | 靠近 Server 端（通常在 CDN 邊緣）       |
| 代理對象 | 代理 Client，替 Client 發出請求          | 代理 Server，替 Server 接收請求         |
| 常見用途 | 翻牆、企業內網監控、匿名瀏覽             | Load Balancing、SSL Termination、WAF    |
| 快取方向 | 快取對外請求的 Response（減少出口流量）  | 快取 Origin 的 Response（減少後端壓力） |
| 設定方   | Client 需主動設定（或透過透明代理）      | Client 無感，由基礎設施決定             |
| 安全應用 | 內容過濾、存取控制（防員工訪問惡意網站） | WAF、DDoS 防護、隱藏後端架構            |
| 典型產品 | Burp Suite                               | Nginx、HAProxy、Cloudflare              |

## Node.js Built-in Proxy Support 的角色定位

簡單來說，如果你有先設定

```js
http.setGlobalProxyFromEnv({ http_proxy: "http://localhost:8080" });
```

當你想要在 Node.js 發起 HTTP Request

```js
http.get("http://example.com");
fetch("http://example.com");
```

這些 HTTP Request 就會

1. 先被 Node.js 導到 `http://localhost:8080`
2. 再從 `http://localhost:8080` 轉發到 `http://example.com`

```mermaid
flowchart LR
  A["Client 1:<br/>GET http://example.com"] --> B[Forward Proxy<br/>http://localhost:8080]
  C["Client 2:<br/>GET http://example.com"] --> B
  B --> D["https://example.com"]
  B --> E["http://example.com"]
```

Node.js Built-in Proxy Support 的角色定位是：

1. 幫 Client 重新構造 HTTP Request，詳細解說在 [HTTP_PROXY](#http_proxy)
2. 幫 Client 重新構造 HTTPS Request，詳細解說在 [HTTPS_PROXY](#https_proxy)
3. 根據 Client 設定的 [NO_PROXY](#no_proxy) 來決定要不要把請求發給 Forward Proxy，還是直接發到 Target Server

## HTTP_PROXY

由於我在 Node.js 生態系找不到一個適合的 "Forward Proxy"，所以我這邊用 [Burp Suite](https://portswigger.net/burp/communitydownload) 內建的 "Forward Proxy"

1. 首先，自己架一個 "Target Server" 來觀察 "Forward Proxy" 到 "Target Server" 的 HTTP Request

```ts
import http from "http";

const targetServer = http.createServer();
targetServer.listen(5000);
targetServer.on("request", function (req, res) {
  res.end();
});
```

2. 設定一個有 `proxyEnv` 的 `http.Agent`，並且用這個 `http.Agent` 發起 HTTP Request 到 "Target Server"

```ts
const agent = new http.Agent({
  proxyEnv: { http_proxy: "http://localhost:8080" },
  keepAlive: true,
});

const clientRequest = http.request({ host: "localhost", port: 5000, agent });
clientRequest.end();
```

3. 用 [Wireshark](https://www.wireshark.org/download.html) 抓 Loopback: lo0，查看 Raw HTTP Request / Response

```mermaid
sequenceDiagram
  participant C as Client<br/>(Node.js http.request)
  participant P as Forward Proxy<br/>(Burp Suite)
  participant S as Server<br/>(Node.js http.Server)

  C ->> P: GET http://localhost:5000/ HTTP/1.1<br/>Host: localhost:5000<br/>proxy-connection: keep-alive<br/>Connection: keep-alive
  P ->> S: GET / HTTP/1.1<br/>Host: localhost:5000<br/>Connection: keep-alive

  S ->> P: HTTP/1.1 200 OK<br/>Date: Wed, 04 Mar 2026 08:24:27 GMT<br/>Connection: keep-alive<br/>Keep-Alive: timeout=5<br/>Content-Length: 0
  P ->> C: HTTP/1.1 200 OK<br/>Date: Wed, 04 Mar 2026 08:24:27 GMT<br/>Connection: keep-alive<br/>Keep-Alive: timeout=5<br/>Content-Length: 0
```

觀察到幾個重點

1. Client => Forward Proxy 的 request target 是 [absolute-form](#absolute-form)
2. Forward Proxy => Server 的 request target 卻轉成了 [origin-form](#origin-form)
3. Client => Forward Proxy 加了 `proxy-connection: keep-alive`
4. Forward Proxy => Server 把 `proxy-connection: keep-alive` 移除

## origin-form

根據 [RFC 9112 Section 3.2.2. origin-form](https://datatracker.ietf.org/doc/html/rfc9112#name-origin-form) 的描述

```
When making a request directly to an origin server, other than a CONNECT or server-wide OPTIONS request (as detailed below), a client MUST send only the absolute path and query components of the target URI as the request-target.
```

:::info
我們平常看到的 request-target，大部分都是落在這個格式
:::

## absolute-form

根據 [RFC 9112 Section 3.2.2. absolute-form](https://datatracker.ietf.org/doc/html/rfc9112#name-absolute-form) 的描述

```
When making a request to a proxy, other than a CONNECT or server-wide OPTIONS request (as detailed below), a client MUST send the target URI in "absolute-form" as the request-target.
```

至於為何要在 request-target 跟 Host Header 重複宣告同樣的資訊呢？

```
GET http://localhost:5000/ HTTP/1.1
Host: localhost:5000
```

這部分我覺得 [RFC 9112 Section 3.2.2. absolute-form](https://datatracker.ietf.org/doc/html/rfc9112#name-absolute-form) 講得不夠明確

```
A client MUST send a Host header field in an HTTP/1.1 request even if the request-target is in the absolute-form, since this allows the Host information to be forwarded through ancient HTTP/1.0 proxies that might not have implemented Host.
```

不過 [RFC 9112 Section 3.2.2. absolute-form](https://datatracker.ietf.org/doc/html/rfc9112#name-absolute-form) 同時也有提到

```
A proxy that forwards such a request MUST generate a new Host field value based on the received request-target rather than forward the received Host field value.
```

再加上 [RFC 9112 Section 3.2. Request Target](https://datatracker.ietf.org/doc/html/rfc9112#name-request-target) 有說明

```
A server MUST respond with a 400 (Bad Request) status code to any HTTP/1.1 request message that lacks a Host header field
```

結合以上資訊，我 "推論" 出以下結論：

```mermaid
sequenceDiagram
  participant C as HTTP/1.1 Client
  participant P as HTTP/1.0 Forward Proxy
  participant S as HTTP/1.1 Server

  Note Over C, S: 假設 HTTP/1.1 Client 沒送 Host Header 的話
  C ->> P: GET http://localhost:5000/ HTTP/1.1
  Note Over P: 將 absolute-form 轉成 origin-form<br/>但沒有生成 Host Header
  P ->> S: GET / HTTP/1.0

  Note Over S: Host 資訊遺失<br/>雖然 HTTP/1.0 沒有強制要 Host Header<br/>但 Server 實作上還是<br/>根據 RFC 9112 Section 3.2. Request Target<br/>回應 400 Bad Request
  S ->> P: HTTP/1.0 400 Bad Request
  P ->> C: HTTP/1.0 400 Bad Request

  Note Over C, S: 假設 HTTP/1.1 Client 有送 Host Header 的話
  C ->> P: GET http://localhost:5000/ HTTP/1.1<br/>Host: localhost:5000
  Note Over P: 將 absolute-form 轉成 origin-form<br/>Host Header 不認識，直接轉發
  P ->> S: GET / HTTP/1.0<br/>Host: localhost:5000

  S ->> P: HTTP/1.0 200 OK
  P ->> C: HTTP/1.0 200 OK
```

## authority-form

用在 [CONNECT](../http/http-request-methods-1.md#connect) 請求

## asterisk-form

實務上我沒看過這用法，格式如下

```
OPTIONS * HTTP/1.1
Host: example.com
```

但正常的 Cors-Preflight Request 都是針對特定的 resource

```
OPTIONS /users HTTP/1.1
Host: example.com
```

## proxy-connection

這是一個非標準的 HTTP Header，主要是為了解決 ancient HTTP/1.0 proxies 不支援 `Connection: keep-alive` 並且無腦轉發，造成 Proxy 到 Server 中間維持了閒置的 TCP 連線

:::info
以下為時序圖為考古推論，我沒有實際用 "ancient HTTP/1.0 proxy" 測試過（我也找不到這種古老架構測試了）
:::

```mermaid
sequenceDiagram
  participant C as Client
  participant P as Forward Proxy
  participant S as Server

  C ->> P: GET http://example.com HTTP/1.1<br/>Connection: keep-alive<br/>Host: example.com
  Note Over P: 我不認識 Connection: keep-alive<br/>但我還是會轉發<br/>然後我也沒有把 1.1 改成 1.0
  P ->> S: GET / HTTP/1.1<br/>Connection: keep-alive<br/>Host: example.com
  Note Over S: 沒問題，這條連線我會維持 N 秒
  S ->> P: HTTP/1.1 200 OK<br/>Connection: keep-alive
  Note Over P: 我不認識 Connection: keep-alive<br/>所以我沒有把這條連線留在連線池
  Note Over P, S: Proxy 到 Server 中間<br/>維持了一條 idle TCP 連線
  P ->> C: HTTP/1.1 200 OK<br/>Connection: keep-alive
```

如果 Client 改送 `Proxy-Connection: keep-alive`，即便 Proxy 無腦轉發，也可以避免 Proxy ~ Server 中間維持了閒置的 TCP 連線

```mermaid
sequenceDiagram
  participant C as Client
  participant P as Forward Proxy
  participant S as Server

  C ->> P: GET http://example.com HTTP/1.1<br/>Proxy-Connection: keep-alive<br/>Host: example.com
  Note Over P: 我不認識 Proxy-Connection: keep-alive<br/>但我還是會轉發
  P ->> S: GET / HTTP/1.0<br/>Proxy-Connection: keep-alive<br/>Host: example.com
  Note Over S: 沒看到 Connection: keep-alive<br/>傳送完以後不保留連線
  S ->> P: HTTP/1.0 200 OK
  P ->> C: HTTP/1.0 200 OK
```

如果 Client 改送 `Proxy-Connection: keep-alive`，支援長連線的 Proxy 就會轉成 `Connection: keep-alive`

```mermaid
sequenceDiagram
  participant C as Client
  participant P as Forward Proxy
  participant S as Server

  Note Over C, S: Client 改送 "Proxy-Connection: keep-alive"<br/>並且 Proxy 有支援
  C ->> P: GET http://example.com HTTP/1.1<br/>Proxy-Connection: keep-alive<br/>Host: example.com
  Note Over P: 將 Proxy-Connection: keep-alive<br/>轉成 Connection: keep-alive
  P ->> S: GET / HTTP/1.1<br/>Connection: keep-alive<br/>Host: example.com
  S ->> P: HTTP/1.1 200 OK<br/>Connection: keep-alive
  Note Over P, S: TCP 連線可以複用
  P ->> C: HTTP/1.1 200 OK<br/>Connection: keep-alive
  Note Over C, P: TCP 連線可以複用
```

## NO_PROXY

如果某些 domain, IP 不想經過 proxy，可以在 `NO_PROXY` 指定

```ts
const fakeProxy = http.createServer();
fakeProxy.listen(5000);
fakeProxy.on("request", function (req, res) {
  console.log("fakeProxy receive request");
  res.end();
});

const agent = new http.Agent({
  proxyEnv: { http_proxy: "http://localhost:5000", no_proxy: "example.com" },
  keepAlive: true,
});
const options = { host: "example.com", port: 80 };

const clientRequest = http.request({ ...options, agent });
clientRequest.end();
```

上述的範例，HTTP Request 就不會經過 `fakeProxy`，而是直接打到 `example.com`

詳細的語法，可以參考 [NO_PROXY Format](https://nodejs.org/docs/latest-v24.x/api/http.html#no_proxy-format)

## 小結

HTTPS_PROXY 會在之後的文章提到
