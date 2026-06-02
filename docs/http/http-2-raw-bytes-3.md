---
title: 深入瞭解 HTTP/2 ORIGIN frame, ALTSVC frame, CONNECT protocol 跟 Padding
description: 深入瞭解 HTTP/2 ORIGIN frame, ALTSVC frame, CONNECT protocol 跟 Padding
last_update:
  date: "2026-06-02T08:00:00+08:00"
---

## ORIGIN frame

**概念**

- Subject Alternative Name (SAN) is an extension in digital TLS/SSL certificates that allows multiple hostnames, domain names, or IP addresses to be protected by a single certificate
- 搭配 HTTP/2 multiplexing 的機制，假設 a.com 跟 b.com 共用一個 certificate，只需要開一個 TCP/TLS 連線，就可以在多個 stream 分別請求 a.com 跟 b.com 的資源
- ORIGIN frame 扮演的角色是，讓 server 主動告知 client "我對哪些 origin 是權威性的，你可以在 request headers 帶上不同 `:authority` 來存取不同 origin 的資源"

**時序圖**

```mermaid
sequenceDiagram
  participant c as client
  participant s as server

  Note Over c, s: TLS handshake
  c ->> s: Client Hello (SNI = localhost)
  s ->> c: Server Hello (SAN = localhost, a.com, b.com)

  Note Over c, s: HTTP/2 Connection Preface<br/>(ORIGIN frame 最早的送出時機 = server 送完 SETTINGS frame 之後)
  c ->> s: Magic, SETTINGS[0]
  s ->> c: SETTINGS[0], SETTINGS[0] ACK, ORIGIN[0] localhost, a.com, b.com
  c ->> s: SETTINGS[0] ACK
```

**測試步驟**

- etc/hosts
  ```
  # http2 ORIGIN frame & TLS SAN test
  127.0.0.1	yus.http2.origin.test
  127.0.0.1	xn--tj3a.xn--tj3a.xn--tj3a.test
  ```
- mkcert
  ```
  mkcert -key-file private-key.pem -cert-file cert.pem localhost yus.http2.origin.test xn--tj3a.xn--tj3a.xn--tj3a.test
  ```
- server
  ```js
  const http2SecureServer = http2.createSecureServer({
    origins: [
      "https://localhost:5000",
      "https://yus.http2.origin.test:5000",
      "https://xn--tj3a.xn--tj3a.xn--tj3a.test:5000", // https://貓.貓.貓.test:5000
    ],
    key: readFileSync(join(import.meta.dirname, "private-key.pem")),
    cert: readFileSync(join(import.meta.dirname, "cert.pem")),
  });
  http2SecureServer.on("stream", (stream, headers) => {
    console.log(headers[":authority"]);
    stream.end();
  });
  http2SecureServer.listen(5000);
  ```
- client

  ```js
  const rootCA = readFileSync("/path-to-your/mkcert/rootCA.pem");

  const clientHttp2Session = http2.connect("https://localhost:5000", {
    ca: rootCA,
    keepAlive: false,
  });
  // 一個 TCP 連線（HTTP/2 長連線），可以透過不同 :authority 請求不同 domain 的資源
  clientHttp2Session.request({ ":authority": "localhost:5000" });
  clientHttp2Session.request({ ":authority": "yus.http2.origin.test:5000" });
  clientHttp2Session.request({
    ":authority": "xn--tj3a.xn--tj3a.xn--tj3a.test:5000",
  });
  clientHttp2Session.on("origin", (origins) => {
    console.log({ originSet: clientHttp2Session.originSet, origins });
  });
  ```

- output
  ```js
  localhost:5000
  yus.http2.origin.test:5000
  xn--tj3a.xn--tj3a.xn--tj3a.test:5000
  {
    originSet: [
      'https://localhost:5000',
      'https://yus.http2.origin.test:5000',
      'https://xn--tj3a.xn--tj3a.xn--tj3a.test:5000'
    ],
    origins: [
      'https://localhost:5000',
      'https://yus.http2.origin.test:5000',
      'https://xn--tj3a.xn--tj3a.xn--tj3a.test:5000'
    ]
  }
  ```
- Node.js 生成 tls keylog
  ```
  node --tls-keylog="./src/http2/node_tlskey.log" src/http2/index.ts
  ```
- wireshark 匯入 tls keylog（解密 TLS，才可以看到 HTTP/2 的 raw bytes）
  ![wireshark-tls-master-secret](../../static/img/wireshark-tls-master-secret.jpg)
- wireshark 抓 ORIGIN frame 封包
  ![wireshark-http2-origin-frame](../../static/img/wireshark-http2-origin-frame.png)
- wireshark 抓 Subject Alternative Name (SAN)
  ![wireshark-san](../../static/img/wireshark-san.png)

<!-- - https://nodejs.org/docs/latest-v24.x/api/http2.html#serverhttp2sessionoriginorigins -->

<!-- ### ALTSVC

- https://nodejs.org/docs/latest-v24.x/api/http2.html#serverhttp2sessionaltsvcalt-originorstream
- https://nodejs.org/docs/latest-v24.x/api/http2.html#event-altsvc -->

<!-- ## CONNECT

- https://datatracker.ietf.org/doc/html/rfc8441
- https://nodejs.org/docs/latest-v24.x/api/http2.html#the-extended-connect-protocol -->

<!-- paddingStrategy -->

## 參考資料

- https://nodejs.org/docs/latest-v24.x/api/http2.html
- https://datatracker.ietf.org/doc/html/rfc8336
