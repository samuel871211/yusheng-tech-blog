---
title: Cases you should use burp suite
description: Cases you should use burp suite
last_update:
  date: "2025-10-08T08:00:00+08:00"
---

1. 需要看原始的 Response Hex 的時候

- 情境: Exploit SQLi + 老舊的 MSSQL Server + 回傳 Big5 編碼的錯誤訊息 + 沒有指定 Content-Type 的編碼 => 瀏覽器用 utf8 編碼會變成亂碼
- 情境: Exploit SQLi + 老舊的 MSSQL Server + 回傳的 Content-Type 是 Big5 編碼 + 實際上是 utf8 => 瀏覽器用 Big5 編碼會變成亂碼
- 解法: 用 Burp Suite Repeater 複製 Response Hex，貼到 [Hex to String Converter Online](https://www.hextostring.com/)

2. 需要在 querystring 的 value 送出 `'` 的時候

- 情境: Exploit SQLi + Server 會把 URL Decode 前的字串直接拼接到 SQL 語法 + 瀏覽器會把 `?query='` 轉換成 `?query=%27`
- 解法: 用 Burp Suite Repeater 可以在 querystring 的 value 送出 `'`

3. 需要看 30x redirect HTTP Response Body 的時候

- 情境: 有時候 30x redirect HTTP Response Body 會包含一些有趣的資訊，例如 [Port Swigger 這個 Lab](../port-swigger/access-control.md#lab-user-id-controlled-by-request-parameter-with-data-leakage-in-redirect)
- 解法: 用 Burp Suite Proxy 的瀏覽器，就可以看到完整的 HTTP History

4. 需要建立 WebSocket 連線，但又需要加上 Custom HTTP Header 的時候

- 情境: 瀏覽器的 JavaScript，不支援在 `new WebSocket` 的時候加上 Custom HTTP Header，例如我想要加上 `X-Forwarded-For`
- 解法：用 Burp Suite Proxy 的瀏覽器 > WebSocket History > 選擇一個 message > Send To Repeater > 斷線以後可以選擇 Reconnect

5. 需要在 HTTP GET Request 帶上 Body 的時候

- 情境: 瀏覽器的 fetch 不支援在 GET 請求帶上 Body
- 解法: 用 Burp Suite Repeater（是說 Postman 也可以啦）

6. 需要修改 HTTP Request Header Host 的時候

- 情境: 瀏覽器的 fetch 不支援修改 Host Header
- 解法: 用 Burp Suite Repeater（Postman 應該是不行，會噴 `Error:The "options.headers.host" property must be of type string. Received an instance of Array`）
