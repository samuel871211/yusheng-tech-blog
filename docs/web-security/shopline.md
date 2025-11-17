---
title: Shopline
description: Shopline
---

## Subdomains

- [https://admin.shoplineapp.com](#httpsadminshoplineappcom)
- [https://sso.shoplineapp.com](#httpsssoshoplineappcom)
- [https://cdn.shoplineapp.com](#httpscdnshoplineappcom)
- [https://shoplineapp.com](#httpsshoplineappcom)
- [https://support.shoplineapp.com](#httpssupportshoplineappcom)
- [https://message-center.shoplineapp.com](#httpsmessage-centershoplineappcom)

## https://admin.shoplineapp.com

### Fingerprint

- Server: openresty
- Server: awselb/2.0 (via TRACE HTTP Method)
- Frontend: Angular 1.4.1

### Interesting Endpoints

1. Get Current User
   PoC

```
GET /api/admin/v1/691afba3182bb1008cac8fe9/users/show_current_user HTTP/2
Host: admin.shoplineapp.com
Cookie: _shopline_sso_session_id=ffa5f030350408c4d1f19afa99b1705c
User-Agent: 1


```

- `"is_admin": false` ?
- CSRF ?

2. Update Current User

```
PUT /api/admin/v1/691afba3182bb1008cac8fe9 HTTP/1.1
Host: admin.shoplineapp.com
Cookie: _shopline_sso_session_id=ffa5f030350408c4d1f19afa99b1705c
X-Csrf-Token: 1hH71EHgxYhVOGgalphTkh/44V0sG4dLzeTcH8zlxMJjoMzIqZrOZrox2LYdEXbegJN+92/i8Gj02EFt6opyfQ==
User-Agent: 1
Content-Type: application/json;charset=UTF-8
Content-Length: 398


{
  "merchant": {
    "name": "aaa",
    "email": "samuel871211@gmail.com",
    "emails": {
      "order": "",
      "message": "",
      "comment": "",
      "low_inventory": "",
      "invoice": ""
    },
    "base_currency_code": "TWD",
    "base_country_code": "TW",
    "force_update_country_code": false,
    "default_language_code": "zh-hant",
    "ignore_browser_lang": false,
    "shop_status": "open",
    "phone_number": "0900000000",
    "tags": [
      "life"
    ],
    "supported_languages": [
      "en",
      "zh-hant"
    ]
  }
}
```

- Mass Assignment ?
- Error Message ?
- `"is_admin": true` ?
- Incomplete JSON => Double 400
  PoC

```
Content-Length: 5

{"name":"789"}
```

## https://sso.shoplineapp.com

<!-- ### Fingerprint -->

## https://cdn.shoplineapp.com

### Fingerprint

- Server: AmazonS3
- Alternative: https://static.shoplineapp.com
- Alternative: https://s3-ap-southeast-1.amazonaws.com/static.shoplineapp.com
- Alternative: https://d31xv78q8gnfco.cloudfront.net/
- Alternative: https://img.shoplineapp.com/

### Potential Attack Factor

- Web Cache Poison
  - Age, Vary, X-cache
  - querystring not in cache-key

## https://shoplineapp.com

## https://support.shoplineapp.com

## https://message-center.shoplineapp.com

### Potential Attack Factor

- 聯絡我們 XSS
