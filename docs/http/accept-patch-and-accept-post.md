---
title: Accept-Patch and Accept-Post
description: Accept-Patch and Accept-Post
last_update:
  date: "2025-06-25T08:00:00+08:00"
---

## Accept-Patch and Accept-Post 使用情境

Accept-Patch 跟 Accept-Post 這兩個 response header，有兩種使用情境

1. 當 client 端實際發送 PATCH 或是 POST 請求，並且 Server 不支援 request header 的 Content-Type 時，就會回傳 415 Unsupported Media Type，並且提供 Accept-Patch 或是 Accept-Post 告訴 client 端 "我支援的 media type 有這些呦"！

2. 當 client 端發送 OPTIONS 請求時，若這個 API Endpoint 有支援 PATCH 或是 POST，Server 就會在 response header 附上 Accept-Patch 或是 Accept-Post，告訴 client 端 "我支援的 media type 有這些呦"！

## 真實世界情況

這兩個 Response Header 比較像是 "API Best Practice"，HTTP 規範說要提供這個 Information 會比較好，但實務上，我完全沒有看過這個 Response Header 在主流的 Web Server 出現，也沒有看過任何 HTTP Client 會特別處理這兩個 Response Header。

我個人的經驗，覺得有以下原因：

1. 與其透過這個 Response Header 動態協商支援的 Media Type，通常會優先把 API 文件完善，所以實際使用 API 的人類，照著 API 文件的指引來呼叫 API，就不會走到 415 Unsupported Media Type 的情況
2. 目前主流 RESTFUL API 各種服務，都是使用 `application/json`，遇到圖片或檔案上傳的，通常就 `multipart/form-data`，通常也不會支援很多種 media/type，Server 用固定一套邏輯（例如：jsonParser）去解析，如果遇到錯誤，通常就直接回傳 400 Bad Request 或是 500 Internal Server Error，會回傳 415 Unsupported Media Type 的算少數，更不用說還會貼心地回傳 Accept-Patch 跟 Accept-Post 這兩個 Response Header！

## Accept-Patch 的歷史

HTTP Request Method PATCH 是在 2010 年的 [RFC5789](https://www.rfc-editor.org/rfc/rfc5789) 提出的，熟悉 RESTFUL API 設計原則的小夥伴的應該都知道，PATCH 是用來部分更新資源的。而在當時的這份 RFC，就有一起提出了 Accept-Patch，使用方法就如同上面提到的，但最後 PATCH 的精神留下來了，而 Accept-Patch 卻沒有被廣泛使用。

## Accept-Post 的歷史

Accept-Post 其實不是一個標準化的 HTTP Header，它大約是在 2014 ~ 2015 年被提出，但一直停留在 [draft](https://datatracker.ietf.org/doc/draft-wilde-accept-post/) 階段，從發布時間上來推敲，它確實是受到 `Accept-Patch` 的影響，才催生出來的一個 Response Header，只可惜 Accept-Patch 都沒有被廣泛使用了，所以 Accept-Post 當然也沒有列為標準化的規範。

## 小結

本篇文章，是少數沒有實作環節的文章，因為我真的找不到任何框架、程式語言或是 Web Server 有這兩個 HTTP Header 的行為或是使用方式，所以我也沒辦法驗證我寫的 NodeJS HTTP Server 是否是正確的。

但在研究這兩個 HTTP Header 的過程，也了解到這兩個 HTTP Header 的歷史，算是小有收穫吧！

## 參考資料

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Patch
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Post
- https://www.rfc-editor.org/rfc/rfc5789#section-3.1
- https://www.w3.org/TR/ldp/#header-accept-post
