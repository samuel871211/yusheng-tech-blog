---
title: mystery-lab-challenge
description: mystery-lab-challenge
last_update:
  date: "2025-11-09T08:00:00+08:00"
---

<!-- ✅ ❌ -->
<!-- ##

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: []()
- Complete Without "Reveal objective": ❌
- Complete Without "View full lab description": ❌
- Complete without search my tech blog for solution: ❌
- 卡點:  -->

## Lab: Basic server-side template injection

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: [Lab: Basic server-side template injection](./server-side-template-injection.md#lab-basic-server-side-template-injection)
- Complete without "Reveal objective": ❌
- Complete without "View full lab description": ❌
- Complete without search my tech blog for solution: ❌
- 卡點: 有找到注入點是 `?message=Unfortunately%20this%20product%20is%20out%20of%20stock`，但沒想到要用 SSTI

## Lab: Blind SQL injection with conditional responses

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: [Lab: Blind SQL injection with conditional responses](./sql-injection.md#lab-blind-sql-injection-with-conditional-responses)
- Complete Without "Reveal objective": ❌
- Complete Without "View full lab description": ❌
- Complete without search my tech blog for solution: ❌
- 卡點: 有找到注入點是 cookie 的 `TrackingId=' OR '1' = '1` 會有 "Welcome back!" 的訊息，但後來不知道為啥 SQLi Payload 好像寫錯

## Lab: Web cache poisoning via a fat GET request

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: [Lab: Web cache poisoning via a fat GET request](./web-cache-poisoning.md#lab-web-cache-poisoning-via-a-fat-get-request)
- Complete Without "Reveal objective": ✅
- Complete Without "View full lab description": ✅
- Complete without search my tech blog for solution: ❌
- 卡點: 有找到注入點是 `js/geolocate.js?callback?setCountryCookie`，記得以前有刷過這題，就直接搜尋我之前的解題過程，才想起來可以用 fat GET request 的技巧

## Lab: Web cache poisoning via a fat GET request

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: [Lab: SSRF with blacklist-based input filter](./ssrf.md#lab-ssrf-with-blacklist-based-input-filter)
- Complete Without "Reveal objective": ✅
- Complete Without "View full lab description": ✅
- Complete without search my tech blog for solution: ❌
- 卡點: 有找到注入點是 check stock 的 stockApi 有 SSRF

## ## Lab: Exploiting PHP deserialization with a pre-built gadget chain

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: [## Lab: Exploiting PHP deserialization with a pre-built gadget chain](./insecure-deserialization.md#lab-exploiting-php-deserialization-with-a-pre-built-gadget-chain)
- Complete Without "Reveal objective": ✅
- Complete Without "View full lab description": ✅
- Complete without search my tech blog for solution: ❌
- 卡點: 有找到注入點是 cookie 的 session，有 PHP serialize

## Lab: SQL injection attack, listing the database contents on non-Oracle databases

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: [Lab: SQL injection attack, listing the database contents on non-Oracle databases](./sql-injection.md#lab-sql-injection-attack-listing-the-database-contents-on-non-oracle-databases)
- Complete Without "Reveal objective": ❌
- Complete Without "View full lab description": ❌
- Complete without search my tech blog for solution: ❌
- 卡點: 有找到注入點是 `filter?category=Accessories' AND '1' = '2`

## Lab: SQL injection attack, listing the database contents on non-Oracle databases

- 時間: 2025/11/09
- 難度: Only solved labs / PRACTITIONER /Any Category
- 連結: [Lab: Modifying serialized data types](./insecure-deserialization.md#lab-modifying-serialized-data-types)
- Complete Without "Reveal objective": ❌
- Complete Without "View full lab description": ❌
- Complete without search my tech blog for solution: ❌
- 卡點: 有找到注入點是 cookie 的 session，有 PHP serialize

## 中場休息

感覺這樣刷 mystery-lab 沒有意義，我需要建立一個決策樹，系統化的增進我的 recon 技巧，把我在 portSwigger 學到的所有技巧都用上

## 參考連結

- https://portswigger.net/web-security/mystery-lab-challenge
