---
title: Node.js stream module
description: Node.js stream module
---

## 前言

承接 [Node.js events module](./events.md)，接著來看看 stream

## Types of streams

stream 有分四種

- [Writable](https://nodejs.org/api/stream.html#class-streamwritable)：可寫
- [Readable](https://nodejs.org/api/stream.html#class-streamreadable)：可讀
- [Duplex](https://nodejs.org/api/stream.html#class-streamduplex)：可讀寫
- [Transform](https://nodejs.org/api/stream.html#class-streamtransform)：這次不會介紹到它

### HTTP Server 視角：Readable 與 Writable

```mermaid
sequenceDiagram
  participant HTTP Client
  participant HTTP Server

  HTTP Client ->> HTTP Server: http.IncomingMessage (stream.Readable)
  Note over HTTP Server: 我身為 Server，我要 "讀取" HTTP Request

  HTTP Server ->> HTTP Client: http.ServerResponse (stream.Writable)
  Note over HTTP Server: 我身為 Server，我要 "回傳"(寫入資料) HTTP Response
```

### HTTP Client 視角：Readable 與 Writable

```mermaid
sequenceDiagram
  participant HTTP Client
  participant HTTP Server

  HTTP Client ->> HTTP Server: http.ClientRequest (stream.Writable)
  Note over HTTP Client: 我身為 Client，我要 "構造"(寫入資料) HTTP Request

  HTTP Server ->> HTTP Client: http.IncomingMessage (stream.Readable)
  Note over HTTP Client: 我身為 Client，我要 "讀取" HTTP Response
```

:::info
從上述的例子，我們可以得知，所謂的 "Readable" 跟 "Writable"，是根據 "你目前的角色" 來看
:::

### Client 與 Server 的對稱結構：各自的 Socket (stream.Duplex)

```mermaid
graph TB
    direction TB
    subgraph Server["Server 端"]
        SSocket["Socket<br/>(stream.Duplex)"]
        SReq["IncomingMessage<br/>(stream.Readable)<br/>讀取 HTTP Request"]
        SRes["ServerResponse<br/>(stream.Writable)<br/>寫入 HTTP Response"]

        SReq -->|req.socket| SSocket
        SRes -->|res.socket| SSocket
    end

    subgraph Client["Client 端"]
        direction RL
        CSocket["Socket<br/>(stream.Duplex)"]
        CReq["ClientRequest<br/>(stream.Writable)<br/>寫入 HTTP Request"]
        CRes["IncomingMessage<br/>(stream.Readable)<br/>讀取 HTTP Response"]

        CReq -->|req.socket| CSocket
        CRes -->|res.socket| CSocket
    end

    style CSocket fill:#f9f9f9
    style CReq fill:#ffd4d4
    style CRes fill:#d4edff

    style SSocket fill:#f9f9f9
    style SReq fill:#d4edff
    style SRes fill:#ffd4d4
```

## 參考資料

- https://nodejs.org/api/stream.html
