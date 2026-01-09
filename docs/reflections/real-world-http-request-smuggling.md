---
title: 真實世界跟 Lab 環境的巨大鴻溝 - HTTP Request Smuggling
description: 真實世界跟 Lab 環境的巨大鴻溝 - HTTP Request Smuggling
last_update:
  date: "2025-11-28T08:00:00+08:00"
---

## 前言

在 2025/03，我開啟了 [Learn HTTP With JS](https://ithelp.ithome.com.tw/users/20155705/ironman/8162) 的挑戰，當時學到了 [CRLF Injection](../http/anatomy-of-an-http-message.md#crlf-injection) 這個漏洞，覺得 HTTP 的世界真有趣！

2025/11，我正式將 [portSwigger](https://portswigger.net/web-security) 的最後一個主題 [HTTP Request Smuggling](https://portswigger.net/web-security/request-smuggling) 刷完，我興高采烈的到真實世界嘗試那些學到的技巧，結果被打得滿頭包XD

## HTTP Request Smuggling or HTTP/1.1 pipelining ?

<!-- todo-yus --> 這是我第一個踩到的坑

## Frontend Prevent CL.0 By Closing the TCP Connection

我認為 [CL.0](../port-swigger/http-request-smuggling.md#lab-cl0-request-smuggling) 在 HTTP Request Smuggling 當中，是一個比較簡單的主題，原因是

- ✅ 純 HTTP/1.1
- ✅ 1 TCP Connection (Keep-Alive)
- ✅ 沒有像 [TE.CL](../port-swigger/http-request-smuggling.md#lab-confirming-a-tecl-vulnerability-via-differential-responses) 要計算 Bytes 長度的複雜場景

根據 [portSwigger](https://portswigger.net/web-security/request-smuggling/browser/cl-0#testing-for-cl-0-vulnerabilities) 的描述

- Endpoints that trigger server-level redirects and requests for static files are prime candidates.
- When a request's headers trigger a server error, some servers issue an error response without consuming the request body off the socket. If they don't close the connection afterwards, this can provide an alternative CL.0 desync vector.

實際上我在測試某電商網站的 img domain 時

Request

<div className="httpRawRequest">
  <div className="blue">GET /image.jpg HTTP/1.1</div>
  <div className="blue">Host: example.com</div>
  <div className="blue">Connection: keep-alive</div>
  <div className="blue">Cache-Control: no-cache</div>
  <div className="blue">Content-Length: 24</div>
  <div className="blue"></div>
  <div className="orange">GET /404 HTTP/1.1</div>
  <div className="orange">Foo: bar</div>
</div>

Response

<div className="httpRawRequest">
  <div className="green">HTTP/1.1 200 OK</div>
  <div className="green">Content-Type: image/jpeg</div>
  <div className="green">Content-Length: 150404</div>
  <div className="green">Connection: close</div>
  <div className="green">Other-Cache-Headers: ...</div>
  <div className="green"></div>
  <div className="green">image file content...</div>
</div>

Frontend 直接 `Connection: close`，把 TCP Connection 關閉，杜絕了 CL.0 desync 的可能性，只能說現代 Frontend 防護真強...

## Frontend Prevent CL.0 By Detecting Malicious Request

在測試某電商網站時

Request

<div className="httpRawRequest">
  <div className="blue">POST /region/123/123 HTTP/1.1</div>
  <div className="blue">Host: example.com</div>
  <div className="blue">Content-Length: 18</div>
  <div className="blue"></div>
  <div className="orange">POST /123 HTTP/1.1</div>
</div>

Response

<div className="httpRawRequest">
  <div className="green">HTTP/1.1 403 Forbidden</div>
  <div className="green">content-type: text/html; charset=UTF-8</div>
  <div className="green">Content-Length: 134</div>
  <div className="green">via: 1.1 google</div>
  <div className="green"></div>
  <div className="green">html content...</div>
</div>

Smuggled Request 的 StartLine 才剛打完，就被偵測到...
