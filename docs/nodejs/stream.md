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
  Note over HTTP Server: 我身為 Server，我要 "寫入" HTTP Response
```

### HTTP Client 視角：Readable 與 Writable

```mermaid
sequenceDiagram
  participant HTTP Client
  participant HTTP Server

  HTTP Client ->> HTTP Server: http.ClientRequest (stream.Writable)
  Note over HTTP Client: 我身為 Client，我要 "寫入" HTTP Request

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

### Types of streams 小結

從 HTTP 的視角來看，就會發現 Node.js 模組的底層就是 stream 跟 Socket

- stream 負責資料的讀寫
- Socket 則是管理 TCP 連線的抽象層，繼承了 stream.Duplex，可讀寫資料

## stream.Readable

https://nodejs.org/api/stream.html#class-streamreadable

### events

- [readable.on('close')](https://nodejs.org/api/stream.html#event-close_1)
- [readable.on('data')](https://nodejs.org/api/stream.html#event-data)
- [readable.on('end')](https://nodejs.org/api/stream.html#event-end)
- [readable.on('error')](https://nodejs.org/api/stream.html#event-error_1)
- [readable.on('pause')](https://nodejs.org/api/stream.html#event-pause)
- [readable.on('readable')](https://nodejs.org/api/stream.html#event-readable)
- [readable.on('resume')](https://nodejs.org/api/stream.html#event-resume)

### methods

- [readable.destroy](https://nodejs.org/api/stream.html#readabledestroyerror)
- [readable.isPaused](https://nodejs.org/api/stream.html#readableispaused)
- [readable.pause](https://nodejs.org/api/stream.html#readablepause)
- [readable.pipe](https://nodejs.org/api/stream.html#readablepipedestination-options)
- [readable.unpipe](https://nodejs.org/api/stream.html#readableunpipedestination)
- [readable.read](https://nodejs.org/api/stream.html#readablereadsize)
- [readable.resume](https://nodejs.org/api/stream.html#readableresume)
- [readable.setEncoding](https://nodejs.org/api/stream.html#readablesetencodingencoding)
- [readable.unshift](https://nodejs.org/api/stream.html#readableunshiftchunk-encoding)
- [readable.wrap](https://nodejs.org/api/stream.html#readablewrapstream)
- [readable.compose](https://nodejs.org/api/stream.html#readablecomposestream-options)
- [readable.iterator](https://nodejs.org/api/stream.html#readableiteratoroptions)

### Experimental methods

- [readable.map](https://nodejs.org/api/stream.html#readablemapfn-options)
- [readable.filter](https://nodejs.org/api/stream.html#readablefilterfn-options)
- [readable.forEach](https://nodejs.org/api/stream.html#readableforeachfn-options)
- [readable.toArray](https://nodejs.org/api/stream.html#readabletoarrayoptions)
- [readable.some](https://nodejs.org/api/stream.html#readablesomefn-options)
- [readable.find](https://nodejs.org/api/stream.html#readablefindfn-options)
- [readable.every](https://nodejs.org/api/stream.html#readableeveryfn-options)
- [readable.flatMap](https://nodejs.org/api/stream.html#readableflatmapfn-options)
- [readable.drop](https://nodejs.org/api/stream.html#readabledroplimit-options)
- [readable.take](https://nodejs.org/api/stream.html#readabletakelimit-options)
- [readable.reduce](https://nodejs.org/api/stream.html#readablereducefn-initial-options)

### properties

- [readable.closed](https://nodejs.org/api/stream.html#readableclosed)
- [readable.destroyed](https://nodejs.org/api/stream.html#readabledestroyed)
- [readable.readable](https://nodejs.org/api/stream.html#readablereadable)
- [readable.readableAborted](https://nodejs.org/api/stream.html#readablereadableaborted)
- [readable.readableDidRead](https://nodejs.org/api/stream.html#readablereadabledidread)
- [readable.readableEncoding](https://nodejs.org/api/stream.html#readablereadableencoding)
- [readable.readableEnded](https://nodejs.org/api/stream.html#readablereadableended)
- [readable.errored](https://nodejs.org/api/stream.html#readableerrored)
- [readable.readableFlowing](https://nodejs.org/api/stream.html#readablereadableflowing)
- [readable.readableHighWaterMark](https://nodejs.org/api/stream.html#readablereadablehighwatermark)
- [readable.readableLength](https://nodejs.org/api/stream.html#readablereadablelength)
- [readable.readableObjectMode](https://nodejs.org/api/stream.html#readablereadableobjectmode)

### internal methods

- [readable.\_destroy](https://nodejs.org/api/stream.html#readable_destroyerr-callback)

## stream.Writable

https://nodejs.org/api/stream.html#class-streamwritable

stream.Writable 是一個 Base Class + Template Class，它處理所有的 stream 邏輯（buffering、backpressure、events...），但把「實際寫入」的部分留給開發者實作；換句話說，若沒有實作 `_write` method 就直接呼叫 `write` 的話，會直接報錯

❌錯誤作法

```ts
import { Writable } from "stream";

const myStream = new Writable();
myStream.write("123"); // Error: The _write() method is not implemented
```

✅正確做法（實作　`_write` method）

```ts
class MyWritable extends Writable {
  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    console.log(chunk);
    callback();
  }
}
const myWritable = new MyWritable();
myWritable.write("123"); // <Buffer 31 32 33>
```

### backpressure

### highWaterMark

### events

- [writable.on('close')](https://nodejs.org/api/stream.html#event-close)
- [writable.on('drain')](https://nodejs.org/api/stream.html#event-drain)
- [writable.on('error')](https://nodejs.org/api/stream.html#event-error)
- [writable.on('finish')](https://nodejs.org/api/stream.html#event-finish)
- [writable.on('pipe')](https://nodejs.org/api/stream.html#event-pipe)
- [writable.on('unpipe')](https://nodejs.org/api/stream.html#event-unpipe)

### methods

- [writable.cork](https://nodejs.org/api/stream.html#writablecork)
- [writable.uncork](https://nodejs.org/api/stream.html#writableuncork)
- [writable.destroy](https://nodejs.org/api/stream.html#writabledestroyerror)
- [writable.write](https://nodejs.org/api/stream.html#writablewritechunk-encoding-callback)
- [writable.end](https://nodejs.org/api/stream.html#writableendchunk-encoding-callback)
- [writable.setDefaultEncoding](https://nodejs.org/api/stream.html#writablesetdefaultencodingencoding)

### properties

- [writable.closed](https://nodejs.org/api/stream.html#writableclosed)
- [writable.destroyed](https://nodejs.org/api/stream.html#writabledestroyed)
- [writable.writable](https://nodejs.org/api/stream.html#writablewritable)
- [writable.writableAborted](https://nodejs.org/api/stream.html#writablewritableaborted)
- [writable.writableEnded](https://nodejs.org/api/stream.html#writablewritableended)
- [writable.writableFinished](https://nodejs.org/api/stream.html#writablewritablefinished)
- [writable.writableCorked](https://nodejs.org/api/stream.html#writablewritablecorked)
- [writable.errored](https://nodejs.org/api/stream.html#writableerrored)
- [writable.writableHighWaterMark](https://nodejs.org/api/stream.html#writablewritablehighwatermark)
- [writable.writableLength](https://nodejs.org/api/stream.html#writablewritablelength)
- [writable.writableNeedDrain](https://nodejs.org/api/stream.html#writablewritableneeddrain)
- [writable.writableObjectMode](https://nodejs.org/api/stream.html#writablewritableobjectmode)

### internal methods

https://nodejs.org/api/stream.html#implementing-a-writable-stream

- [writable.\_write](https://nodejs.org/api/stream.html#writable_writechunk-encoding-callback)
- [writable.\_writev](https://nodejs.org/api/stream.html#writable_writevchunks-callback)
- [writable.\_destroy](https://nodejs.org/api/stream.html#writable_destroyerr-callback)
- [writable.\_final](https://nodejs.org/api/stream.html#writable_finalcallback)
- [writable.\_construct](https://nodejs.org/api/stream.html#writable_constructcallback)

<!-- https://nodejs.org/api/stream.html#errors-while-writing -->

## stream.Duplex

實作了 [stream.Readable](#streamreadable) 跟 [stream.Writable](#streamwritable)，另外多了 [duplex.allowHalfOpen](https://nodejs.org/api/stream.html#duplexallowhalfopen) 這個參數，它的意思是 "如果 readable end，那 writable 是否要繼續開著"。聽起來很繞口，我實際舉兩個例子，讓各位了解：

1. http Server 的 Socket 就是 allowHalfOpen = true，因為通常 Server 收到完整的 HTTP Request (Readable.end) 之後，才
   能決定 HTTP Response 是什麼，並且回傳給 Client，此時 Writable Side 就必須保持開啟。我們可以寫一個 PoC 來驗證

```ts
import httpServer from "../httpServer";

createServer()
  .listen(5000)
  .on("request", function httpRequestListener(req, res) {
    console.log(req.socket === res.socket); // true
    console.log(req.socket.allowHalfOpen); // true
    console.log(res.socket.allowHalfOpen); // true
    res.end();
  });
```

2.

### duplex.allowHalfOpen

這是 stream.Duplex

## 參考資料

- https://nodejs.org/api/stream.html
