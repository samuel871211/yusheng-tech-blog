---
title: HTTP caching (第二篇)
description: HTTP caching (第二篇)
last_update:
  date: "2025-07-16T08:00:00+08:00"
---

## Browser --> Origin Server 實作環節

我們使用 NodeJS HTTP Server 來實作

### Browser "Disable cache" 測試

1. index.ts

```ts
import send from "send";
import httpServer from "../httpServer";

httpServer.on("request", function requestListener(req, res) {
  const url = new URL(`http://localhost:5000${req.url}`);
  const qsCase = url.searchParams.get("case") || "1";
  if (url.pathname === "/favicon.ico") return faviconListener(req, res);
  if (url.pathname === "/image.jpg" || url.pathname === "/example.txt") {
    // 確保請求有抵達 Origin Server
    res.setHeader("Is-Origin-Server", "true");
    // 印出訊息
    console.log(req.url, req.headers);

    // Last-Modified + If-Modified-Since
    if (qsCase === "1") {
      const sendStream = send(req, url.pathname, {
        root: __dirname,
        etag: false,
        lastModified: true,
        cacheControl: true,
        maxAge: 5000,
        immutable: true,
      });
      sendStream.on("end", () => {
        console.log("Response headers:", JSON.stringify(res.getHeaders()));
        console.log("Status code:", res.statusCode);
      });
      sendStream.pipe(res);
      return;
    }
  }
  return notFoundListener(req, res);
});
```

2. 在 index.ts 同一層，準備一個 image.jpg 檔案跟 example.txt 檔案

瀏覽器打開 http://localhost:5000/image.jpg?case=1 ，在 Disable Cache 勾選/不勾選的情況，各重整五次

可以看到 304 Not Modified 的平均響應毫秒比較快，且資料傳輸量小很多，因為不需要傳送 response body
![200-vs-304](../../static/img/200-vs-304.jpg)

再來比較 200 跟 304 的 response headers，304 由於沒有 response body，所以也就沒有 `Content-*` 的 response headers
![200-has-content-headers](../../static/img/200-has-content-headers.jpg)
![304-no-content-headers](../../static/img/304-no-content-headers.jpg)

要注意！實際上這 10 個 HTTP Request 都有到達 Origin Server，因為我們現在還沒有中間層。如果要避免 HTTP Request 送到 Origin Server，直接使用 Browser Cache 的話，可以把 Disable Cache 不勾選，並且在 cache 還是 fresh 的期間（5 秒內），F12 > Console 輸入

```js
fetch("http://localhost:5000/image.jpg?case=1");
```

就會看到 200 OK (from disk cache)，原因是 [fetch 預設的 cache 模式](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#default) 會先從 Browser Cache 拿資料
![200-from-disk-cache](../../static/img/200-from-disk-cache.jpg)

### Browser "Disable cache" 測試 - 小結

分別把上面三種請求模式，整理成時序圖

```mermaid
sequenceDiagram
  participant Browser
  participant Origin Server

  Note Over Browser, Origin Server: Open Browser Tab With Disable Cache

  Browser ->> Origin Server: GET /image.jpg HTTP/1.1<br/>Cache-Control: no-cache
  Origin Server ->> Browser: HTTP/1.1 200 OK<br/>Cache-Control: public, max-age=5, immutable<br/>Content-Length: 1374458<br/>Content-Type: image/jpeg<br/><br/>binary data...

  Note Over Browser, Origin Server: Open Browser Tab With Enable Cache

  Browser ->> Origin Server: GET /image.jpg HTTP/1.1<br/>Cache-Control: max-age=0
  Origin Server ->> Browser: HTTP/1.1 304 Not Modified<br/>Cache-Control: public, max-age=5, immutable

  Note Over Browser, Origin Server: fetch /image.jpg?case=1 With Enable Cache

  Note Over Browser: Browser Cache is fresh, return directly
```

## Nginx Proxy Cache 設定

實務上，通常會有很多中間層，例如 Web Server, CDN 等等，這些中間層都扮演著重要的 Cache 角色，分擔 Origin Server 的流量，讓 HTTP Reqeust 在中間層就處理掉，所以我們接下來要把架構升級成 Browser --> Nginx --> Origin Server

在 nginx.conf 新增以下設定（以 Mac M系列晶片 + homebrew 為例）

```conf
http {
    ...
    # proxy_cache_path path keys_zone=name:size;
    # 在 /opt/homebrew/etc/nginx/ 底下建一個資料夾 my_5000_cache;
    # 1m = One megabyte zone can store about 8 thousand keys.
    proxy_cache_path /opt/homebrew/etc/nginx/my_5000_cache keys_zone=my_5000_cache:1m;

    server {
        ...
        location / {
            # proxy_cache zone
            # 這邊的 my_5000_cache 就是在 proxy_cache_path 定義的 keys_zone
            proxy_cache my_5000_cache;
            proxy_pass http://localhost:5000;
        }
    }
}
```

接下來的測試，一律都在 "Disable cache" 不勾選的情況下測試～

## Last-Modified + If-Modified-Since

沿用 [Browser "Disable cache" 測試](#browser-disable-cache-測試) 的 NodeJS HTTP Server，由於我們設定 `max-age: 5`，所以我們就來觀察 cache 超過 5 秒的情況，Browser 會不會發送 Conditional Request

瀏覽器打開 http://localhost:8080/image.jpg?case=1&v=2 ，並且重整 4 次，總共是 5 個請求
![5-request-2-origin-server](../../static/img/5-request-2-origin-server.jpg)

- 第 1 個請求，由於 Browser Cache 跟 Nginx Cache 都尚未建立，所以請求會到 Origin Server
- 第 2 ~ 4 個請求，Browser 會發送 `If-Modified-Since` Request Header，由於 cache 還是 fresh，Nginx 這層就會處理掉，所以請求不會到 Origin Server
- 第 5 個請求，Browser 會發送 `If-Modified-Since` Request Header，由於 cache 變成 stale，所以 Nginx 會跟 Origin Server 更新快取

### Last-Modified + If-Modified-Since 小結

我們將上面的 5 個請求畫成時序圖

```mermaid
sequenceDiagram
  participant Browser
  participant Nginx
  participant Origin Server

  Note over Browser, Origin Server: 1st HTTP Round Trip

  Browser ->> Nginx: GET /image.jpg?case=1&v=2 HTTP/1.1
  Note over Nginx: No Cache Found
  Nginx ->> Origin Server: GET /image.jpg?case=1&v=2 HTTP/1.1
  Origin Server ->> Nginx: HTTP/1.1 200 OK<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Mon, 14 Jul 2025 00:32:52 GMT<br/>Content-Length: 1374458<br/>Content-Type: image/jpeg<br/><br/>binary data...
  Note over  Nginx: Set Proxy Cache
  Nginx ->> Browser: HTTP/1.1 200 OK<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Mon, 14 Jul 2025 00:32:52 GMT<br/>Content-Length: 1374458<br/>Content-Type: image/jpeg<br/><br/>binary data...
  Note over Browser: Set Browser Cache

  Note over Browser, Origin Server: 2nd ~ 4nd HTTP Round Trip

  Browser ->> Nginx: GET /image.jpg?case=1&v=2 HTTP/1.1<br/>Cache-Control: max-age=0<br/>If-Modified-Since: Mon, 14 Jul 2025 00:32:52 GMT
  Note over  Nginx: Check Proxy Cache Is Still Fresh
  Nginx ->> Browser: HTTP/1.1 304 Not Modified<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Mon, 14 Jul 2025 00:32:52 GMT
  Note over Browser: Update Browser Cache

  Note over Browser, Origin Server: 5nd HTTP Round Trip

  Browser ->> Nginx: GET /image.jpg?case=1&v=2 HTTP/1.1<br/>Cache-Control: max-age=0<br/>If-Modified-Since: Mon, 14 Jul 2025 00:32:52 GMT
  Note over  Nginx: Check Proxy Cache Is Stale
  Nginx ->> Origin Server: GET /image.jpg?case=1&v=2 HTTP/1.1<br/>Cache-Control: max-age=0
  Origin Server ->> Nginx: HTTP/1.1 200 OK<br/>Cache-Control: public, max-age=5, immutable<br/>Content-Length: 1374458<br/>Content-Type: image/jpeg<br/><br/>binary data...
  Note over  Nginx: Update Proxy Cache
  Nginx ->> Browser: HTTP/1.1 304 Not Modified<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Mon, 14 Jul 2025 00:32:52 GMT
  Note over Browser: Update Browser Cache
```

眼尖的小夥伴應該有發現，第 5 個請求的 Nginx --> Origin Server 這段，`If-Modified-Since` 被拿掉了。這部分我查閱了官方文件的描述，確實有說到這個行為：

https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header

```
If caching is enabled, the header fields “If-Modified-Since”, “If-Unmodified-Since”, “If-None-Match”, “If-Match”, “Range”, and “If-Range” from the original request are not passed to the proxied server.
```

https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_revalidate

```
Enables revalidation of expired cache items using conditional requests with the “If-Modified-Since” and “If-None-Match” header fields.
```

等於說 Nginx 就是直接跟 Origin Server 請求新的 resource，拿到 200 以後，再拿 Nginx Proxy Cache 的 `Last-Modified` 跟 response 的 `Last-Modified` 去比對，如果一致，就回傳 304，非常聰明的策略，把 public cache 的優勢發揮得淋漓盡致

但其實第 5 個請求可以再優化，如果要讓第 5 個請求的 Nginx --> Origin Server 這段也走 Conditional Request，可以把 `proxy_cache_revalidate` 這個模組也打開，好處是如果 Origin Server 的 resource 沒變，Origin Server 可以直接回傳 304，就可以省下很多流量的傳輸

## proxy_cache_revalidate 設定

調整 nginx 的設定，並重啟

```conf
location / {
    proxy_cache my_5000_cache;
    proxy_cache_revalidate on;
    proxy_pass http://localhost:5000;
}
```

瀏覽器打開 http://localhost/image.jpg?case=1&v=10 ，5 秒後再重整一次
![200+304](../../static/img/200+304.jpg)

將這兩次的請求畫成時序圖，可以看到第二個請求的 Origin Server ->> Nginx 這一段從 200 變成 304，大幅減少傳輸的資料量

```mermaid
sequenceDiagram
  participant Browser
  participant Nginx
  participant Origin Server

  Note over Browser, Origin Server: 1st HTTP Round Trip

  Browser ->> Nginx: GET /image.jpg?case=1&v=10 HTTP/1.1
  Note over Nginx: No Cache Found
  Nginx ->> Origin Server: GET /image.jpg?case=1&v=10 HTTP/1.1
  Origin Server ->> Nginx: HTTP/1.1 200 OK<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Thu, 27 Feb 2025 14:07:46 GMT<br/>Content-Length: 1374458<br/>Content-Type: image/jpeg<br/><br/>binary data...
  Note over  Nginx: Set Proxy Cache
  Nginx ->> Browser: HTTP/1.1 200 OK<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Thu, 27 Feb 2025 14:07:46 GMT<br/>Content-Length: 1374458<br/>Content-Type: image/jpeg<br/><br/>binary data...
  Note over Browser: Set Browser Cache

  Note over Browser, Origin Server: 2nd HTTP Round Trip

  Browser ->> Nginx: GET /image.jpg?case=1&v=10 HTTP/1.1<br/>Cache-Control: max-age=0<br/>If-Modified-Since: Thu, 27 Feb 2025 14:07:46 GMT
  Note over  Nginx: Check Proxy Cache Is Stale
  Nginx ->> Origin Server: GET /image.jpg?case=1&v=10 HTTP/1.1<br/>Cache-Control: max-age=0<br/>If-Modified-Since: Thu, 27 Feb 2025 14:07:46 GMT
  Origin Server ->> Nginx: HTTP/1.1 304 Not Modified<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Thu, 27 Feb 2025 14:07:46 GMT
  Note over  Nginx: Update Proxy Cache
  Nginx ->> Browser: HTTP/1.1 304 Not Modified<br/>Cache-Control: public, max-age=5, immutable<br/>Last-Modified: Thu, 27 Feb 2025 14:07:46 GMT
  Note over Browser: Update Browser Cache
```

## 研究 Nginx Proxy Cache 存了什麼資料

先用瀏覽器請求 http://localhost:8080/example.txt ，再打開 nginx/my_5000_cache 資料夾，會看到以下資料
![nginx-cache](../../static/img/nginx-cache.jpg)

首先是檔名，根據 [Nginx 官方文件](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_key) 的描述

```
Sets the path and other parameters of a cache. Cache data are stored in files. The file name in a cache is a result of applying the MD5 function to the cache key.

Default: proxy_cache_key $scheme$proxy_host$request_uri;
```

若拿 `http://localhost:5000/example.txt` 去做 MD5 Hash，確實會得到 `0fb71471e2abd056431997d9a3034949`

再來是檔案內容，格式可被拆解成以下

```
第一行看不懂，可能是什麼 binary data
KEY: $scheme$proxy_host$request_uri
RAW HTTP Response
```

其實也沒什麼魔法，就是把整個 RAW HTTP Response 存起來，用完整的 URL 當作 KEY，就是這麼樸實無華且高效

## 小結

本篇文章，帶大家探索 Browser --> Nginx --> Origin Server 的架構，多了一層中間層，可以保護 Origin Server，讓請求在 Nginx 這層就被擋下，也學習了 Nginx 跟 proxy_cache 相關的 module 設定。接著，會帶大家實作 `ETag` 跟 `If-None-Match`～

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Expires
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Last-Modified
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Pragma
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Age
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304
- https://datatracker.ietf.org/doc/html/rfc9111
- https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_key
- https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_path
- https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache
- https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header
