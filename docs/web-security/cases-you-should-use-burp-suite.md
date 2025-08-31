---
title: Cases you should use burp suite
description: Cases you should use burp suite
last_update:
  date: "2025-08-31T08:00:00+08:00"
---

1. 需要看原始的 Response Hex 的時候

- 情境: Exploit SQLi + 老舊的 MSSQL Server + 回傳 Big5 編碼的錯誤訊息 + 沒有指定 Content-Type 的編碼 => 瀏覽器用 utf8 編碼會變成亂碼
- 情境: Exploit SQLi + 老舊的 MSSQL Server + 回傳的 Content-Type 是 Big5 編碼 + 實際上是 utf8 => 瀏覽器用 Big5 編碼會變成亂碼
- 解法: 用 Burp Suite Repeater 複製 Response Hex，貼到 [Hex to String Converter Online](https://www.hextostring.com/)

2. 需要在 querystring 的 value 送出 `'` 的時候

- 情境: Exploit SQLi + Server 會把 URL Decode 前的字串直接拼接到 SQL 語法 + 瀏覽器會把 `?query='` 轉換成 `?query=%27`
- 解法: 用 Burp Suite Repeater 可以在 querystring 的 value 送出 `'`
