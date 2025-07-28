---
title: nmap SMTP scripts
description: nmap SMTP scripts
---

建議先閱讀過我之前寫過的 [SMTP](../protocols/smtp.md)，了解 SMTP 的基礎，再來閱讀這篇文章呦～

## smtp-server 架設

接下來的 nmap-smtp-scripts，會使用自架的 smtp-server 來測試，方便看 SMTP Server log，觀察 nmap 到底送了什麼 SMTP Commands

```ts
import { SMTPServer } from "smtp-server";

const SMTPServerInstance = new SMTPServer({
  logger: true,
  banner: "Welcome to yus test smtp server",
  enableTrace: true,
  secure: false,
  needsUpgrade: false,
  // hideSTARTTLS: true
});

SMTPServerInstance.listen(25);
```

## smtp-brute

為了避免大量 SMTP Server 短時間收到大量 log，使用以下參數去掃

| Nmap Script Args | Description                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| brute.delay=100  | the number of seconds to wait between guesses (default: 0)               |
| brute.start=1    | the number of threads the engine will start with. (default: 5)           |
| brute.retries=1  | the number of times to retry if recoverable failures occur. (default: 2) |

```
nmap --script smtp-brute -p 25 --script-args "brute.delay=100,brute.start=1,brute.retries=1" localhost
```

SMTP Server log

```
[2025-07-28 05:59:23] INFO  SMTP Server listening on [::]:25
[2025-07-28 05:59:25] ERROR gim2bgohu73wpgj3  read ECONNRESET
[2025-07-28 05:59:25] INFO  [#gim2bgohu73wpgj3] gim2bgohu73wpgj3 received "close" event from  after error
[2025-07-28 05:59:25] INFO  [#gim2bgohu73wpgj3] Connection closed to
[2025-07-28 05:59:25] ERROR [#gim2bgohu73wpgj3] Reverse resolve for : getHostByAddr EINVAL
[2025-07-28 05:59:25] INFO  [#uagk3xuzheqv5mll] Connection from [127.0.0.1]
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] S: 220 yus test localhost SMTP Server ESMTP banner message
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] C: EHLO localhost
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] 250-PIPELINING
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] 250-8BITMIME
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] 250-SMTPUTF8
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] 250-AUTH LOGIN PLAIN
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] 250 STARTTLS
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] C: QUIT
[2025-07-28 05:59:25] DEBUG [#uagk3xuzheqv5mll] S: 221 Bye
[2025-07-28 05:59:25] ERROR uagk3xuzheqv5mll 127.0.0.1 read ECONNRESET
[2025-07-28 05:59:25] INFO  [#uagk3xuzheqv5mll] uagk3xuzheqv5mll received "close" event from 127.0.0.1 after error
[2025-07-28 05:59:25] INFO  [#uagk3xuzheqv5mll] Connection closed to [127.0.0.1]
[2025-07-28 05:59:25] INFO  [#d4s5rv7oeamby7f7] Connection from [127.0.0.1]
[2025-07-28 05:59:25] DEBUG [#d4s5rv7oeamby7f7] S: 220 yus test localhost SMTP Server ESMTP banner message
[2025-07-28 05:59:25] DEBUG [#d4s5rv7oeamby7f7] C: AUTH LOGIN
[2025-07-28 05:59:25] DEBUG [#d4s5rv7oeamby7f7] S: 503 Error: send HELO/EHLO first
[2025-07-28 05:59:25] INFO  [#d4s5rv7oeamby7f7] d4s5rv7oeamby7f7 received "close" event from 127.0.0.1
[2025-07-28 05:59:25] INFO  [#d4s5rv7oeamby7f7] Connection closed to [127.0.0.1]
[2025-07-28 05:59:25] INFO  [#xlxtjxu6pimxweyk] Connection from [127.0.0.1]
[2025-07-28 05:59:25] DEBUG [#xlxtjxu6pimxweyk] S: 220 yus test localhost SMTP Server ESMTP banner message
[2025-07-28 05:59:25] DEBUG [#xlxtjxu6pimxweyk] C: AUTH LOGIN
[2025-07-28 05:59:25] DEBUG [#xlxtjxu6pimxweyk] S: 503 Error: send HELO/EHLO first
[2025-07-28 05:59:25] INFO  [#xlxtjxu6pimxweyk] xlxtjxu6pimxweyk received "close" event from 127.0.0.1
[2025-07-28 05:59:25] INFO  [#xlxtjxu6pimxweyk] Connection closed to [127.0.0.1]
```

我們主要看這一段就好

```
[2025-07-28 05:59:25] INFO  [#d4s5rv7oeamby7f7] Connection from [127.0.0.1]
[2025-07-28 05:59:25] DEBUG [#d4s5rv7oeamby7f7] S: 220 yus test localhost SMTP Server ESMTP banner message
[2025-07-28 05:59:25] DEBUG [#d4s5rv7oeamby7f7] C: AUTH LOGIN
[2025-07-28 05:59:25] DEBUG [#d4s5rv7oeamby7f7] S: 503 Error: send HELO/EHLO first
[2025-07-28 05:59:25] INFO  [#d4s5rv7oeamby7f7] d4s5rv7oeamby7f7 received "close" event from 127.0.0.1
[2025-07-28 05:59:25] INFO  [#d4s5rv7oeamby7f7] Connection closed to [127.0.0.1]
```

nmap 在 `AUTH LOGIN` 之前，沒有先送 `HELO` 或是 `EHLO` 這個 Command，導致整個 smtp-brute 腳本都沒有如預期執行

至於預設的帳密資料庫，跟 [nmap ftp-brute](../web-security/nmap-ftp-scripts.md#nmap-ftp-brute) 一樣

## smtp-commands

學過 SMTP 之後，再來看這個 script，就會覺得沒什麼魔法，就是發一個 `EHLO` 的 SMTP Command 而已

## smtp-enum-users

[官方文件](https://nmap.org/nsedoc/scripts/smtp-enum-users.html) 描述的很清楚

```
Attempts to enumerate the users on a SMTP server by issuing the VRFY, EXPN or RCPT TO commands. The goal of this script is to discover all the user accounts in the remote system.

The script will output the list of user names that were found. The script will stop querying the SMTP server if authentication is enforced. If an error occurs while testing the target host, the error will be printed with the list of any combinations that were found prior to the error.

The user can specify which methods to use and in which order. The script will ignore repeated methods. If not specified the script will use the RCPT first, then VRFY and EXPN. An example of how to specify the methods to use and the order is the following:

smtp-enum-users.methods={EXPN,RCPT,VRFY}
```

先試試看用預設參數

```
nmap --script smtp-enum-users -p 25 localhost
```

nmap 結果

```
PORT   STATE SERVICE
25/tcp open  smtp
| smtp-enum-users:
|_  Couldn't perform user enumeration, authentication needed
```

SMTP Server log

```
[2025-07-28 06:46:05] INFO  SMTP Server listening on [::]:25
[2025-07-28 06:47:00] ERROR gsrikuyeqefbbqez  read ECONNRESET
[2025-07-28 06:47:00] INFO  [#gsrikuyeqefbbqez] gsrikuyeqefbbqez received "close" event from  after error
[2025-07-28 06:47:00] INFO  [#gsrikuyeqefbbqez] Connection closed to
[2025-07-28 06:47:00] ERROR [#gsrikuyeqefbbqez] Reverse resolve for : getHostByAddr EINVAL
[2025-07-28 06:47:00] INFO  [#adoiwc44fmoz3wyc] Connection from [127.0.0.1]
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] S: 220 yus test localhost SMTP Server ESMTP banner message
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] C: EHLO localhost
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] 250-PIPELINING
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] 250-8BITMIME
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] 250-SMTPUTF8
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] 250-AUTH LOGIN PLAIN
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] 250 STARTTLS
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] C: MAIL FROM:<usertest@localhost>
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] S: 530 Error: authentication Required
[2025-07-28 06:47:00] INFO  [#adoiwc44fmoz3wyc] adoiwc44fmoz3wyc received "close" event from 127.0.0.1
[2025-07-28 06:47:00] INFO  [#adoiwc44fmoz3wyc] Connection closed to [127.0.0.1]
```

主要看這段就好，其實如果不用登入就可以寄信，就算是 [smtp-open-relay](#smtp-open-relay) 的漏洞了

```
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] C: MAIL FROM:<usertest@localhost>
[2025-07-28 06:47:00] DEBUG [#adoiwc44fmoz3wyc] S: 530 Error: authentication Required
```

為了避免 `RCPT` 影響到結果，改用 `{EXPN,VRFY}` 來測試

```
nmap --script smtp-enum-users -p 25 --script-args "smtp-enum-users.methods={EXPN,VRFY}" localhost
```

nmap 結果

```
PORT   STATE SERVICE
25/tcp open  smtp
| smtp-enum-users:
|_  Method EXPN returned a unhandled status code.
```

SMTP Server log

```
[2025-07-28 06:54:24] INFO  SMTP Server listening on [::]:25
[2025-07-28 06:54:29] ERROR pev5cek4f7lf66vm  read ECONNRESET
[2025-07-28 06:54:29] INFO  [#pev5cek4f7lf66vm] pev5cek4f7lf66vm received "close" event from  after error
[2025-07-28 06:54:29] INFO  [#pev5cek4f7lf66vm] Connection closed to
[2025-07-28 06:54:29] ERROR [#pev5cek4f7lf66vm] Reverse resolve for : getHostByAddr EINVAL
[2025-07-28 06:54:29] INFO  [#lcxdbhsmjoye2ahv] Connection from [127.0.0.1]
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 220 yus test localhost SMTP Server ESMTP banner message
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: EHLO localhost
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] 250-PIPELINING
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] 250-8BITMIME
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] 250-SMTPUTF8
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] 250-AUTH LOGIN PLAIN
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] 250 STARTTLS
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root@localhost
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: VRFY root
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 252 Try to send something. No promises though
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: QUIT
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 221 Bye
[2025-07-28 06:54:29] ERROR lcxdbhsmjoye2ahv 127.0.0.1 read ECONNRESET
[2025-07-28 06:54:29] INFO  [#lcxdbhsmjoye2ahv] lcxdbhsmjoye2ahv received "close" event from 127.0.0.1 after error
[2025-07-28 06:54:29] INFO  [#lcxdbhsmjoye2ahv] Connection closed to [127.0.0.1]
```

主要看這段就好

```
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root@localhost
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: VRFY root
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 252 Try to send something. No promises though
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] C: QUIT
[2025-07-28 06:54:29] DEBUG [#lcxdbhsmjoye2ahv] S: 221 Bye
```

現代很多 SMTP Server 都會把 [EXPN](../protocols/smtp.md#expn) 跟 [VRFY](../protocols/smtp.md#vrfy) 的功能關閉，要是掃得到的話，就算是一個列舉使用者的資安漏洞了

## smtp-ntlm-info

[官方文件](https://nmap.org/nsedoc/scripts/smtp-ntlm-info.html) 的介紹

```
This script enumerates information from remote SMTP services with NTLM authentication enabled.

Sending a SMTP NTLM authentication request with null credentials will cause the remote service to respond with a NTLMSSP message disclosing information to include NetBIOS, DNS, and OS build version.
```

大致查了一下 NTLM，全名是 New Technology LAN Manager，是微軟一個比較早期的身份驗證方式，附上 ithome 的相關新聞

- https://www.ithome.com.tw/news/159292
- https://www.ithome.com.tw/news/168503

```
nmap --script smtp-ntlm-info -p 25 localhost
```

SMTP Server log

```
[2025-07-28 08:22:11] INFO  SMTP Server listening on [::]:25
[2025-07-28 08:22:12] ERROR 33abcdmqaebovfld  read ECONNRESET
[2025-07-28 08:22:12] INFO  [#33abcdmqaebovfld] 33abcdmqaebovfld received "close" event from  after error
[2025-07-28 08:22:12] INFO  [#33abcdmqaebovfld] Connection closed to
[2025-07-28 08:22:12] ERROR [#33abcdmqaebovfld] Reverse resolve for : getHostByAddr EINVAL
[2025-07-28 08:22:12] INFO  [#tqdlwp62zkhtuyu6] Connection from [127.0.0.1]
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] S: 220 yus test localhost SMTP Server ESMTP banner message
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] C: EHLO localhost
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250-PIPELINING
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250-8BITMIME
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250-SMTPUTF8
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250-AUTH LOGIN PLAIN
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250 STARTTLS
[2025-07-28 08:22:12] DEBUG [#ohlpougefcxlmmsx] C: ieU��random1random2random3random4
                                                                                    /
[2025-07-28 08:22:12] DEBUG [#ohlpougefcxlmmsx] S: 421 yus test localhost SMTP Server You talk too soon
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] C: STARTTLS
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] S: 220 Ready to start TLS
[2025-07-28 08:22:12] INFO  [#ohlpougefcxlmmsx] ohlpougefcxlmmsx received "close" event from 127.0.0.1
[2025-07-28 08:22:12] INFO  [#ohlpougefcxlmmsx] Connection closed to 127.0.0.1
[2025-07-28 08:22:12] INFO  [#tqdlwp62zkhtuyu6] Connection upgraded to TLS using TLS_AES_256_GCM_SHA384
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] C: EHLO localhost
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250-PIPELINING
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250-8BITMIME
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250-SMTPUTF8
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] 250 AUTH LOGIN PLAIN
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] C: AUTH NTLM
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] S: 504 Error: Unrecognized authentication type
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] C: TlRMTVNTUAABAAAAB4IIoAAAAAAAAAAAAAAAAAAAAAA=
[2025-07-28 08:22:12] DEBUG [#tqdlwp62zkhtuyu6] S: 500 Error: command not recognized
[2025-07-28 08:22:12] INFO  [#tqdlwp62zkhtuyu6] tqdlwp62zkhtuyu6 received "close" event from 127.0.0.1
[2025-07-28 08:22:12] INFO  [#tqdlwp62zkhtuyu6] Connection closed to [127.0.0.1]
```

NodeJS 的 smtp-server 預設不支援 `NTLM`，所以收到 `504 Error: Unrecognized authentication type` 也是預期內的結果

## smtp-open-relay

## smtp-strangeport

```
nmap -sV --script=smtp-strangeport localhost
```

smtp-strangeport 的實作很簡短

```lua
portrule = function(host, port)
  return port.service == "smtp" and
    port.number ~= 25 and port.number ~= 465 and port.number ~= 587
    and port.protocol == "tcp"
    and port.state == "open"
end

action = function()
  return "Mail server on unusual port: possible malware"
end
```

主要核心是 `-sV: Probe open ports to determine service/version info`，不只會去掃 port，還會偵測該 port 的服務，偵測的邏輯主要是放在 [nmap-service-probes](https://raw.githubusercontent.com/nmap/nmap/refs/heads/master/nmap-service-probes)

<!-- smtp-vuln-cve2010-4344 -->
<!-- smtp-vuln-cve2011-1720 -->
<!-- smtp-vuln-cve2011-1764 -->

### 參考資料

- https://nmap.org/nsedoc/scripts/
