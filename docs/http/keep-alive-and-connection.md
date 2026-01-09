---
title: Keep-Alive 和 Connection
description: Keep-Alive and Connection
last_update:
  date: "2025-03-09T08:00:00+08:00"
---

在 HTTP/1.0 的世界，預設每個請求都會建立一個 TCP Connection，而到了 HTTP/1.1，預設行為變成會保留 TCP Connection，這樣下次再請求同一個 origin 時，就可以重複使用該 TCP Connection，節省三方交握的成本，但具體來說是怎麼實現的呢？

那就要來到我們今天的主題：Keep-Alive & Connection

## 使用瀏覽器觀察 Keep-Alive 和 Connection

我們用瀏覽器打開 F12 > Network

Request Headers 應該都會有

```
connection: keep-alive
```

Response Headers 則會有

```
connection: keep-alive
keep-alive: timeout=5; max=100
```

## NodeJS keepAliveTimeout 實作

當 Server 端收到 `connection: keep-alive` 的 header，會在這個請求結束後，把這個 TCP Connection 保留，具體保留時間多久，會根據每個 http server 有不同的實作

以 NodeJS http server 的原始碼為例

https://github.com/nodejs/node/blob/main/lib/_http_server.js#L478

```js
const keepAliveTimeout = options.keepAliveTimeout;
if (keepAliveTimeout !== undefined) {
  validateInteger(keepAliveTimeout, "keepAliveTimeout", 0);
  this.keepAliveTimeout = keepAliveTimeout;
} else {
  this.keepAliveTimeout = 5_000; // 5 seconds;
}
```

代表閒置的 TCP Connection "最少" 會保留 5 秒

為什麼我會強調 "最少" 呢?

首先，根據 MDN 文件的描述

https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive#timeout

```
A host may keep an idle connection open for longer than timeout seconds, but the host should attempt to retain a connection for at least timeout seconds.
```

再來，回到 NodeJS 的生態系，回想一下 event loop 的機制，應該會知道 `setTimeout(() => { // do something }, 1000)` 代表的是 do something 1 秒後會被丟到 task queue，但要等到 call stack 的任務都做完，才會接著執行 task queue 的任務，所以實際上，do something 只能說 "至少" 1 秒後會執行，不能保證剛好是 1 秒

我們接著考慮一個極端的 race condition 情境，如果 `keepAliveTimeout = 1000`，使用者在 999 的時候突然送了一個請求，這時候總不可能請求解析到一半就關閉吧？

所以說，為了避免 race condition 的情況，NodeJS 有實作了一個 buffer 的機制

https://github.com/nodejs/node/blob/main/lib/_http_server.js#L187
https://github.com/nodejs/node/blob/main/lib/_http_server.js#L1014

```js
const HTTP_SERVER_KEEP_ALIVE_TIMEOUT_BUFFER = 1000;
......
    if (server.keepAliveTimeout && typeof socket.setTimeout === 'function') {
      // Increase the internal timeout wrt the advertised value to reduce
      // the likelihood of ECONNRESET errors.
      socket.setTimeout(server.keepAliveTimeout + HTTP_SERVER_KEEP_ALIVE_TIMEOUT_BUFFER);
      state.keepAliveTimeoutSet = true;
    }
```

讓我們繼續深入看 `socket.setTimeout` 的 JSDOC

https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/net.d.ts#L183

````js
/**
 * Sets the socket to timeout after `timeout` milliseconds of inactivity on
 * the socket. By default `net.Socket` do not have a timeout.
 *
 * When an idle timeout is triggered the socket will receive a `'timeout'` event but the connection will not be severed. The user must manually call `socket.end()` or `socket.destroy()` to
 * end the connection.
 *
 * ```js
 * socket.setTimeout(3000);
 * socket.on('timeout', () => {
 *   console.log('socket timeout');
 *   socket.end();
 * });
 * ```
 *
 * If `timeout` is 0, then the existing idle timeout is disabled.
 *
 * The optional `callback` parameter will be added as a one-time listener for the `'timeout'` event.
 * @since v0.1.90
 * @return The socket itself.
 */
setTimeout(timeout: number, callback?: () => void): this;
````

其實就跟你平常所認知的 `setTimeout` 是一樣的東西，那具體來說 `socket.on('timeout', callback)` 到底執行了什麼呢？我們接著往下追

https://github.com/nodejs/node/blob/main/lib/_http_server.js#L678
https://github.com/nodejs/node/blob/main/lib/_http_server.js#L789

```js
if (server.timeout && typeof socket.setTimeout === 'function')
  socket.setTimeout(server.timeout);
socket.on('timeout', socketOnTimeout);
......
function socketOnTimeout() {
  const req = this.parser?.incoming;
  const reqTimeout = req && !req.complete && req.emit('timeout', this);
  const res = this._httpMessage;
  const resTimeout = res && res.emit('timeout', this);
  const serverTimeout = this.server.emit('timeout', this);

  if (!reqTimeout && !resTimeout && !serverTimeout)
    this.destroy();
}
```

看起來有點複雜，不過總之就是會先檢查，確定沒問題之後再呼叫 `socket.destroy()`

## NodeJS HTTP_SERVER_KEEP_ALIVE_TIMEOUT_BUFFER issue

至於為何 NodeJS 實作了 `HTTP_SERVER_KEEP_ALIVE_TIMEOUT_BUFFER`，有興趣的夥伴們，可以參考這些 issue

- https://github.com/nodejs/node/issues/52649
- https://github.com/nodejs/node/issues/54293

## How to change keepAliveTimeout in NodeJS

如果需要縮短 keepAliveTimeout:

```js
const httpServer = createServer().listen(5000);
httpServer.keepAliveTimeout = 1000;
```

## max

如果我們仔細查看 MDN 文件，可以看到 keepAlive 的 value 其實可以設定 timeout 跟 max

```
Keep-Alive: timeout=5, max=100
```

其中 timeout 前面已經講過，而 max 代表的是這個 TCP Connection 在關閉之前，可以接受多少個請求，不過在 [HTTP/1.1 的規範(RFC7230)](https://datatracker.ietf.org/doc/html/rfc7230#appendix-A.1.2)，似乎沒有提到 max 這個參數

## How to control maxRequestsPerSocket

以 NodeJS http module 為例，其實也可以控制這個參數:

```js
const httpServer = createServer().listen(5000);
httpServer.maxRequestsPerSocket = 10;
```

如果要直接讓每次請求完就直接關閉 TCP Connection:

```js
const httpServer = createServer().listen(5000);
httpServer.maxRequestsPerSocket = 1;
```

再深入一點了解的話，會發現主流的 web server 都有實作這個功能

nginx:

https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_requests

```
Syntax:	keepalive_requests number;
Default:
keepalive_requests 1000;
Context:	upstream
This directive appeared in version 1.15.3.

Sets the maximum number of requests that can be served through one keepalive connection. After the maximum number of requests is made, the connection is closed.

Closing connections periodically is necessary to free per-connection memory allocations. Therefore, using too high maximum number of requests could result in excessive memory usage and not recommended.


Prior to version 1.19.10, the default value was 100.
```

apache:

https://httpd.apache.org/docs/2.4/mod/core.html#maxkeepaliverequests

```
MaxKeepAliveRequests Directive
Description:	Number of requests allowed on a persistent connection
Syntax:	MaxKeepAliveRequests number
Default:	MaxKeepAliveRequests 100
Context:	server config, virtual host
Status:	Core
Module:	core
The MaxKeepAliveRequests directive limits the number of requests allowed per connection when KeepAlive is on. If it is set to 0, unlimited requests will be allowed. We recommend that this setting be kept to a high value for maximum server performance.

For example:

MaxKeepAliveRequests 500
```

<!-- tomcat:

https://tomcat.apache.org/tomcat-5.5-doc/config/http.html
```
maxKeepAliveRequests
The maximum number of HTTP requests which can be pipelined until the connection is closed by the server. Setting this attribute to 1 will disable HTTP/1.0 keep-alive, as well as HTTP/1.1 keep-alive and pipelining. Setting this to -1 will allow an unlimited amount of pipelined or keep-alive HTTP requests. If not specified, this attribute is set to 100.
``` -->

實務上來說，瀏覽器跟 application server（商業邏輯的實現通常會在這一層），中間至少都會墊一層 web server，讓開發者可以更專注在商業邏輯的實現，而不需要關注像是 `maxKeepAliveRequests` 跟 `keepAliveTimeout` 這種很細節的東西，但回頭來看，了解 http 的原理跟規範，再來看看 web server 怎麼實作這些，就可以更了解為何需要拆分 web server 跟 application server 了

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Keep-Alive
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Connection
- https://datatracker.ietf.org/doc/html/rfc7230#appendix-A.1.2

<!-- todo 可以用小學桶餐解釋概念 -->
<!-- todo 可以加上 closed 一些截圖 -->
