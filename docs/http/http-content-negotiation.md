---
title: HTTP content negotiation
description: HTTP content negotiation
---

## Content Negotiation 概念

## Accept

### 語法

```
Accept: text/html
Accept: text/*
Accept: */*
Accept: text/html, application/xml;q=0.9, image/webp, */*;q=0.8
```

可參考我之前寫的 [content-type-and-mime-type](../http/content-type-and-mime-type.md)

### 簡介

- Request & Response Header
- 作為 Request Header 的情境，Client 會把其支援的 `Content-Type` 都列出來，讓 Server 選擇最適合的
- 承上，瀏覽器針對不同類型的檔案，會有不同的預設值（各家瀏覽器的預設值可能不一樣）

```
CSS => Accept: text/css,*/*;q=0.1
JS => Accept: */*
Img => Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8
```

- 作為 Response Header 的情境，Server 會把其支援的 `Content-Type` 都列出來，讓 Client 在之後的請求可以調整 `Accept` Request Header

### 作為 Response Header 的情境

為了測試瀏覽器有沒有 "在之後的請求調整 `Accept` Request Header"，我們寫個簡單的情境測試

```ts
// Accept as Response Header Test
if (req.url === "/image1.png") {
  console.log("image1.png", req.headers.accept);
  res.setHeader("Accept", "image/png");
  res.end(png);
  return;
}
if (req.url === "/image2.png") {
  console.log("image2.png", req.headers.accept);
  res.setHeader("Accept", "image/png");
  res.end(png);
  return;
}
```

瀏覽器打開 http://localhost:5000/ ，F12 > Console 輸入以下程式碼

```js
fet;
```

## Accept-Encoding

可參考先前寫過的 [content-and-accept-encoding](../http/content-and-accept-encoding.md)

## Vary

<!-- todo-yus 可稍微提到，但重點在 cache 的時候講 -->

##

##

##

## NodeJS HTTP Server + negotiator 實作

### 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Encoding
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Language
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Language
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Location
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/300
- https://www.rfc-editor.org/rfc/rfc9110.html#name-300-multiple-choices
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/406
- https://www.npmjs.com/package/negotiator
<!-- todo 不一定要讀 -->
- https://httpd.apache.org/docs/current/en/content-negotiation.html#algorithm
