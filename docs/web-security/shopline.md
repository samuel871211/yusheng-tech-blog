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
- [https://front-admin.shoplineapp.com](#httpsfront-adminshoplineappcom)
- [https://developers.shoplineapp.com](#httpsdevelopersshoplineappcom)

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

3. 加 IP 功能 bulk_create

- bulk_create => Seems like MongoDB
- "name" length not verify => DoS ?
- X-Forwarded-For Bypass ? But still need to get admin's cookie and csrf-token

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

### Fingerprint

- Frontend: React 16.14.0, Ant Design

### Potential Attack Factor

- 聯絡我們 XSS
- Source Map Enabled, but failed to retrieve .js.map (
  https://cdn.shoplineapp.com/sc/web/message-center/release-2025-10-23/86290ecf/assets/index.esm-a6b4ca3e.js)

## https://front-admin.shoplineapp.com

### Fingerprint

- Server: APISIX

### Interesting Endpoints

1. 聊天室上傳圖片

Request

```
POST /openApi/proxy/v1/media HTTP/2
Host: front-admin.shoplineapp.com
Cookie: thoauth_sid=09edf7168819ddeb0e9dd48e9c181937; _prod_shopline_auth_session_id_v3=1e28852d8ab7d3c1f9f226cd380af642
Content-Length: 182
User-Agent: 1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryEDoQzPCqN6UtVkku

------WebKitFormBoundaryEDoQzPCqN6UtVkku
Content-Disposition: form-data; name="data"; filename="1"
Content-Type: text/html

<script>
------WebKitFormBoundaryEDoQzPCqN6UtVkku--
```

Response

```
HTTP/2 412 Precondition Failed
Date: Tue, 18 Nov 2025 08:36:35 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 670
Server: APISIX

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>您访问的网页不存在。。</title>
</head>
<body>
<style type="text/css">
img { border:0}
body{background:#fff;color:#333;font-size:12px;font-family:Arial,'微软雅黑'}
.m404 {margin:100px auto; vertical-align:middle; text-align:center}
</style>
<div class="m404"><img src="https://img.myshopline.com/image/official/9f0bcdc8fa664145988d78c75c9e1fe1.png" width="700" height="250" border="0"></div>
</body>
</html>
```

Request

```
POST /openApi/proxy/v1/media HTTP/2
Host: front-admin.shoplineapp.com
Cookie: _prod_shopline_auth_session_id_v3=1e28852d8ab7d3c1f9f226cd380af642
Content-Length: 177
User-Agent: 1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryEDoQzPCqN6UtVkku

------WebKitFormBoundaryEDoQzPCqN6UtVkku
Content-Disposition: form-data; name="data"; filename="1"
Content-Type: text/html

123
------WebKitFormBoundaryEDoQzPCqN6UtVkku--
```

Response

```
HTTP/2 302 Found
Date: Tue, 18 Nov 2025 08:35:09 GMT
Content-Length: 0
Location: https://developers.shoplineapp.com/oauth/authorize?client_id=b2ef776b9813f0fc968e84b95aaeff66db70841f4c7ae08f0b978a4fc128c173&response_type=code&scope=mcs media channels webhooks staffs merchants permissions openid payments delivery_options products categories customers tags orders gifts settings carts customer_groups&redirect_uri=https://front-admin.shoplineapp.com/admin/api/bff-web/auth/oauth/callback?state=MG-5821972303fd4d74851b295e45e7f25b-mc
Access-Control-Allow-Credentials: true
Set-Cookie: thoauth_sid=e5723946c2a5aa36ee3f233a49f15c2f; Path=/; HttpOnly; Secure; SameSite=None
Server: APISIX

```

## https://developers.shoplineapp.com

## https://plus-shoplineapp-com.s3.ap-southeast-1.amazonaws.com

- Directory Listing
- Find `.shoplineapp.com` subdomain ?
- Upload HTML ?

## https://apps.shopline.tw

### Fingerprint

- Frontend: 15.4.0-canary.94

### Interesting Endpoints

1. 研究 x-nextjs-cache: https://apps.shopline.tw/_next/image?url=https%3A%2F%2Fd31xv78q8gnfco.cloudfront.net%2Fdeveloper-center%2Fimages%2F667d6c3ff0b05be6ff3d58fc.jpg&w=128&q=75

2. 研究 https://apps.shopline.tw/zh-hant/apps?keyword=%27 => 500

3. 研究 `vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding`

4. https://apps.shopline.tw/zh-hant/apps?keyword=%27%20OR%20%271%27%20=%20%271 => 200 => client side error (?)

## https://marketing.shopline.tw/anti-fraud
