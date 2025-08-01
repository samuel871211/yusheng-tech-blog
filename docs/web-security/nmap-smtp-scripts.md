---
title: nmap SMTP scripts
description: nmap SMTP scripts
last_update:
  date: "2025-07-29T08:00:00+08:00"
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
INFO  SMTP Server listening on [::]:25
ERROR gim2bgohu73wpgj3  read ECONNRESET
INFO  [#gim2bgohu73wpgj3] gim2bgohu73wpgj3 received "close" event from  after error
INFO  [#gim2bgohu73wpgj3] Connection closed to
ERROR [#gim2bgohu73wpgj3] Reverse resolve for : getHostByAddr EINVAL
INFO  [#uagk3xuzheqv5mll] Connection from [127.0.0.1]
DEBUG [#uagk3xuzheqv5mll] S: 220 yus test localhost SMTP Server ESMTP banner message
DEBUG [#uagk3xuzheqv5mll] C: EHLO localhost
DEBUG [#uagk3xuzheqv5mll] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#uagk3xuzheqv5mll] 250-PIPELINING
DEBUG [#uagk3xuzheqv5mll] 250-8BITMIME
DEBUG [#uagk3xuzheqv5mll] 250-SMTPUTF8
DEBUG [#uagk3xuzheqv5mll] 250-AUTH LOGIN PLAIN
DEBUG [#uagk3xuzheqv5mll] 250 STARTTLS
DEBUG [#uagk3xuzheqv5mll] C: QUIT
DEBUG [#uagk3xuzheqv5mll] S: 221 Bye
ERROR uagk3xuzheqv5mll 127.0.0.1 read ECONNRESET
INFO  [#uagk3xuzheqv5mll] uagk3xuzheqv5mll received "close" event from 127.0.0.1 after error
INFO  [#uagk3xuzheqv5mll] Connection closed to [127.0.0.1]
INFO  [#d4s5rv7oeamby7f7] Connection from [127.0.0.1]
DEBUG [#d4s5rv7oeamby7f7] S: 220 yus test localhost SMTP Server ESMTP banner message
DEBUG [#d4s5rv7oeamby7f7] C: AUTH LOGIN
DEBUG [#d4s5rv7oeamby7f7] S: 503 Error: send HELO/EHLO first
INFO  [#d4s5rv7oeamby7f7] d4s5rv7oeamby7f7 received "close" event from 127.0.0.1
INFO  [#d4s5rv7oeamby7f7] Connection closed to [127.0.0.1]
INFO  [#xlxtjxu6pimxweyk] Connection from [127.0.0.1]
DEBUG [#xlxtjxu6pimxweyk] S: 220 yus test localhost SMTP Server ESMTP banner message
DEBUG [#xlxtjxu6pimxweyk] C: AUTH LOGIN
DEBUG [#xlxtjxu6pimxweyk] S: 503 Error: send HELO/EHLO first
INFO  [#xlxtjxu6pimxweyk] xlxtjxu6pimxweyk received "close" event from 127.0.0.1
INFO  [#xlxtjxu6pimxweyk] Connection closed to [127.0.0.1]
```

我們主要看這一段就好

```
INFO  [#d4s5rv7oeamby7f7] Connection from [127.0.0.1]
DEBUG [#d4s5rv7oeamby7f7] S: 220 yus test localhost SMTP Server ESMTP banner message
DEBUG [#d4s5rv7oeamby7f7] C: AUTH LOGIN
DEBUG [#d4s5rv7oeamby7f7] S: 503 Error: send HELO/EHLO first
INFO  [#d4s5rv7oeamby7f7] d4s5rv7oeamby7f7 received "close" event from 127.0.0.1
INFO  [#d4s5rv7oeamby7f7] Connection closed to [127.0.0.1]
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
INFO  SMTP Server listening on [::]:25
ERROR gsrikuyeqefbbqez  read ECONNRESET
INFO  [#gsrikuyeqefbbqez] gsrikuyeqefbbqez received "close" event from  after error
INFO  [#gsrikuyeqefbbqez] Connection closed to
ERROR [#gsrikuyeqefbbqez] Reverse resolve for : getHostByAddr EINVAL
INFO  [#adoiwc44fmoz3wyc] Connection from [127.0.0.1]
DEBUG [#adoiwc44fmoz3wyc] S: 220 yus test localhost SMTP Server ESMTP banner message
DEBUG [#adoiwc44fmoz3wyc] C: EHLO localhost
DEBUG [#adoiwc44fmoz3wyc] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#adoiwc44fmoz3wyc] 250-PIPELINING
DEBUG [#adoiwc44fmoz3wyc] 250-8BITMIME
DEBUG [#adoiwc44fmoz3wyc] 250-SMTPUTF8
DEBUG [#adoiwc44fmoz3wyc] 250-AUTH LOGIN PLAIN
DEBUG [#adoiwc44fmoz3wyc] 250 STARTTLS
DEBUG [#adoiwc44fmoz3wyc] C: MAIL FROM:<usertest@localhost>
DEBUG [#adoiwc44fmoz3wyc] S: 530 Error: authentication Required
INFO  [#adoiwc44fmoz3wyc] adoiwc44fmoz3wyc received "close" event from 127.0.0.1
INFO  [#adoiwc44fmoz3wyc] Connection closed to [127.0.0.1]
```

主要看這段就好，其實如果不用登入就可以寄信，就算是 [smtp-open-relay](#smtp-open-relay) 的漏洞了

```
DEBUG [#adoiwc44fmoz3wyc] C: MAIL FROM:<usertest@localhost>
DEBUG [#adoiwc44fmoz3wyc] S: 530 Error: authentication Required
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
INFO  SMTP Server listening on [::]:25
ERROR pev5cek4f7lf66vm  read ECONNRESET
INFO  [#pev5cek4f7lf66vm] pev5cek4f7lf66vm received "close" event from  after error
INFO  [#pev5cek4f7lf66vm] Connection closed to
ERROR [#pev5cek4f7lf66vm] Reverse resolve for : getHostByAddr EINVAL
INFO  [#lcxdbhsmjoye2ahv] Connection from [127.0.0.1]
DEBUG [#lcxdbhsmjoye2ahv] S: 220 yus test localhost SMTP Server ESMTP banner message
DEBUG [#lcxdbhsmjoye2ahv] C: EHLO localhost
DEBUG [#lcxdbhsmjoye2ahv] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#lcxdbhsmjoye2ahv] 250-PIPELINING
DEBUG [#lcxdbhsmjoye2ahv] 250-8BITMIME
DEBUG [#lcxdbhsmjoye2ahv] 250-SMTPUTF8
DEBUG [#lcxdbhsmjoye2ahv] 250-AUTH LOGIN PLAIN
DEBUG [#lcxdbhsmjoye2ahv] 250 STARTTLS
DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root
DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root@localhost
DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
DEBUG [#lcxdbhsmjoye2ahv] C: VRFY root
DEBUG [#lcxdbhsmjoye2ahv] S: 252 Try to send something. No promises though
DEBUG [#lcxdbhsmjoye2ahv] C: QUIT
DEBUG [#lcxdbhsmjoye2ahv] S: 221 Bye
ERROR lcxdbhsmjoye2ahv 127.0.0.1 read ECONNRESET
INFO  [#lcxdbhsmjoye2ahv] lcxdbhsmjoye2ahv received "close" event from 127.0.0.1 after error
INFO  [#lcxdbhsmjoye2ahv] Connection closed to [127.0.0.1]
```

主要看這段就好

```
DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root
DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
DEBUG [#lcxdbhsmjoye2ahv] C: EXPN root@localhost
DEBUG [#lcxdbhsmjoye2ahv] S: 500 Error: command not recognized
DEBUG [#lcxdbhsmjoye2ahv] C: VRFY root
DEBUG [#lcxdbhsmjoye2ahv] S: 252 Try to send something. No promises though
DEBUG [#lcxdbhsmjoye2ahv] C: QUIT
DEBUG [#lcxdbhsmjoye2ahv] S: 221 Bye
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
INFO  SMTP Server listening on [::]:25
ERROR 33abcdmqaebovfld  read ECONNRESET
INFO  [#33abcdmqaebovfld] 33abcdmqaebovfld received "close" event from  after error
INFO  [#33abcdmqaebovfld] Connection closed to
ERROR [#33abcdmqaebovfld] Reverse resolve for : getHostByAddr EINVAL
INFO  [#tqdlwp62zkhtuyu6] Connection from [127.0.0.1]
DEBUG [#tqdlwp62zkhtuyu6] S: 220 yus test localhost SMTP Server ESMTP banner message
DEBUG [#tqdlwp62zkhtuyu6] C: EHLO localhost
DEBUG [#tqdlwp62zkhtuyu6] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#tqdlwp62zkhtuyu6] 250-PIPELINING
DEBUG [#tqdlwp62zkhtuyu6] 250-8BITMIME
DEBUG [#tqdlwp62zkhtuyu6] 250-SMTPUTF8
DEBUG [#tqdlwp62zkhtuyu6] 250-AUTH LOGIN PLAIN
DEBUG [#tqdlwp62zkhtuyu6] 250 STARTTLS
DEBUG [#ohlpougefcxlmmsx] C: ieU��random1random2random3random4
                                                                                    /
DEBUG [#ohlpougefcxlmmsx] S: 421 yus test localhost SMTP Server You talk too soon
DEBUG [#tqdlwp62zkhtuyu6] C: STARTTLS
DEBUG [#tqdlwp62zkhtuyu6] S: 220 Ready to start TLS
INFO  [#ohlpougefcxlmmsx] ohlpougefcxlmmsx received "close" event from 127.0.0.1
INFO  [#ohlpougefcxlmmsx] Connection closed to 127.0.0.1
INFO  [#tqdlwp62zkhtuyu6] Connection upgraded to TLS using TLS_AES_256_GCM_SHA384
DEBUG [#tqdlwp62zkhtuyu6] C: EHLO localhost
DEBUG [#tqdlwp62zkhtuyu6] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#tqdlwp62zkhtuyu6] 250-PIPELINING
DEBUG [#tqdlwp62zkhtuyu6] 250-8BITMIME
DEBUG [#tqdlwp62zkhtuyu6] 250-SMTPUTF8
DEBUG [#tqdlwp62zkhtuyu6] 250 AUTH LOGIN PLAIN
DEBUG [#tqdlwp62zkhtuyu6] C: AUTH NTLM
DEBUG [#tqdlwp62zkhtuyu6] S: 504 Error: Unrecognized authentication type
DEBUG [#tqdlwp62zkhtuyu6] C: TlRMTVNTUAABAAAAB4IIoAAAAAAAAAAAAAAAAAAAAAA=
DEBUG [#tqdlwp62zkhtuyu6] S: 500 Error: command not recognized
INFO  [#tqdlwp62zkhtuyu6] tqdlwp62zkhtuyu6 received "close" event from 127.0.0.1
INFO  [#tqdlwp62zkhtuyu6] Connection closed to [127.0.0.1]
```

NodeJS 的 smtp-server 預設不支援 `NTLM`，所以收到 `504 Error: Unrecognized authentication type` 也是預期內的結果

## smtp-open-relay

算是一個比較容易能發現的漏洞，只要學會基本的 [SMTP Commands](../protocols/smtp.md#smtp-commands)，就會知道原理

還是看看 [官方文件](https://nmap.org/nsedoc/scripts/smtp-open-relay.html) 的介紹

```
An SMTP server that works as an open relay, is a email server that does not verify if the user is authorised to send email from the specified email address. Therefore, users would be able to send email originating from any third-party email address that they want.

The checks are done based in combinations of MAIL FROM and RCPT TO commands.
```

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

## smtp-vuln-cve2010-4344

[官方文件](https://nmap.org/nsedoc/scripts/smtp-vuln-cve2010-4344.html) 的介紹

```
Checks for and/or exploits a heap overflow within versions of Exim prior to version 4.69 (CVE-2010-4344) and a privilege escalation vulnerability in Exim 4.72 and prior (CVE-2010-4345).
```

我特別查了一下 Exim，看起來目前（2025/07/29）是還有在維護

|                   | Exim                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| Written in        | C                                                                              |
| Role              | SMTP Server                                                                    |
| Official Document | https://www.exim.org/                                                          |
| Github            | https://github.com/Exim/exim                                                   |
| 4.69 release info | date: 2007/12/01<br/>note: https://github.com/Exim/exim/releases/tag/exim-4_69 |
| 4.72 release info | date: 2010/06/03<br/>note: https://github.com/Exim/exim/releases/tag/exim-4_72 |

實際查看 smtp-vuln-cve2010-4344 的原始碼，一開始會先檢查 banner 是否含有 `Exim 4.69` 之類的字串

```lua
local function get_exim_banner(response)
  local banner, version
  banner = response:match("%d+%s(.+)")
  if banner then
    version = tonumber(banner:match("Exim%s([0-9%.]+)"))
  end
  return banner, version
end
```

所以我們調整一下 SMTP Server 的程式碼

```ts
const SMTPServerInstance = new SMTPServer({
  name: "yus test localhost SMTP Server",
  logger: true,
  banner: "Exim 4.69",
  enableTrace: true,
  secure: false,
  needsUpgrade: false,
  // hideSTARTTLS: true
});

SMTPServerInstance.listen(25);
```

終端機執行以下指令

```
nmap --script smtp-vuln-cve2010-4344 --script-args='smtp-vuln-cve2010-4344.exploit' -p 25 localhost
```

SMTP Server log

```
INFO  SMTP Server listening on [::]:25
ERROR 2pz7kajiorexxd56  read ECONNRESET
INFO  [#2pz7kajiorexxd56] 2pz7kajiorexxd56 received "close" event from  after error
INFO  [#2pz7kajiorexxd56] Connection closed to
ERROR [#2pz7kajiorexxd56] Reverse resolve for : getHostByAddr EINVAL
INFO  [#wywj3m2s2rl36kqb] Connection from [127.0.0.1]
DEBUG [#wywj3m2s2rl36kqb] S: 220 yus test localhost SMTP Server ESMTP Exim 4.69
DEBUG [#wywj3m2s2rl36kqb] C: EHLO nmap.scanme.org
DEBUG [#wywj3m2s2rl36kqb] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#wywj3m2s2rl36kqb] 250-PIPELINING
DEBUG [#wywj3m2s2rl36kqb] 250-8BITMIME
DEBUG [#wywj3m2s2rl36kqb] 250-SMTPUTF8
DEBUG [#wywj3m2s2rl36kqb] 250-AUTH LOGIN PLAIN
DEBUG [#wywj3m2s2rl36kqb] 250 STARTTLS
DEBUG [#wywj3m2s2rl36kqb] C: MAIL FROM:<root@nmap.scanme.org>
DEBUG [#wywj3m2s2rl36kqb] S: 530 Error: authentication Required
DEBUG [#wywj3m2s2rl36kqb] C: QUIT
DEBUG [#wywj3m2s2rl36kqb] S: 221 Bye
ERROR wywj3m2s2rl36kqb 127.0.0.1 read ECONNRESET
INFO  [#wywj3m2s2rl36kqb] wywj3m2s2rl36kqb received "close" event from 127.0.0.1 after error
INFO  [#wywj3m2s2rl36kqb] Connection closed to [127.0.0.1]
```

主要看這段就好

```
DEBUG [#wywj3m2s2rl36kqb] C: MAIL FROM:<root@nmap.scanme.org>
DEBUG [#wywj3m2s2rl36kqb] S: 530 Error: authentication Required
DEBUG [#wywj3m2s2rl36kqb] C: QUIT
DEBUG [#wywj3m2s2rl36kqb] S: 221 Bye
```

現代 SMTP Server 的防禦都比較完整，在 `MAIL FROM` 階段就可以擋住沒登入的用戶，所以這個漏洞在現代也比較難應用

不過我們還是可以學一下攻擊手法，參考 [官方文件](https://nmap.org/nsedoc/scripts/smtp-vuln-cve2010-4344.html) 的介紹

```
The smtp-vuln-cve2010-4344.exploit script argument will make the script try to exploit the vulnerabilities, by sending more than 50MB of data, it depends on the message size limit configuration option of the Exim server.
```

## SIZE

SMTP Server 通常有支援 [SIZE extension](https://datatracker.ietf.org/doc/html/rfc1870)，可以設定 SMTP Server 最大可接受的 [SMTP Message](../protocols/smtp.md#smtp-message)。這個漏洞的手法，就是傳送超過上限的 SMTP Message，導致 heap overflow

## smtp-vuln-cve2011-1720

[官方文件](https://nmap.org/nsedoc/scripts/smtp-vuln-cve2011-1720.html) 的介紹

```
Checks for a memory corruption in the Postfix SMTP server when it uses Cyrus SASL library authentication mechanisms (CVE-2011-1720). This vulnerability can allow denial of service and possibly remote code execution.
```

我特別查了一下 Postfix，看起來目前（2025/07/29）是還有在維護

|                   | Postfix                                |
| ----------------- | -------------------------------------- |
| Role              | Mail Transfer Agent (MTA)              |
| Official Document | https://www.postfix.org/               |
| releases page     | https://linorg.usp.br/postfix/release/ |

實際查看 smtp-vuln-cve2011-1720 的原始碼，看起來是要特定的 AUTH Method 才會繼續執行檢查

```lua
local AUTH_VULN = {
  -- AUTH MECHANISM
  --    killby: a table of mechanisms that can corrupt and
  --          overwrite the AUTH MECHANISM data structure.
  --          probe: max number of probes for each test
  ["CRAM-MD5"]    = {
    killby = {["DIGEST-MD5"] = {probe = 1}}
  },
  ["DIGEST-MD5"]  = {
    killby = {}
  },
  ["EXTERNAL"]    = {
    killby = {}
  },
  ["GSSAPI"]      = {
    killby = {}
  },
  ["KERBEROS_V4"] = {
    killby = {}
  },
  ["NTLM"]        = {
    killby = {["DIGEST-MD5"] = {probe = 2}}
  },
  ["OTP"]         = {
    killby = {}
  },
  ["PASSDSS-3DES-1"] = {
    killby = {}
  },
  ["SRP"]         = {
    killby = {}
  },
}
```

調整 SMTP Server

```ts
import { SMTPServer } from "smtp-server";

const SMTPServerInstance = new SMTPServer({
  name: "yus test localhost SMTP Server",
  logger: true,
  banner: "Exim 4.69",
  enableTrace: true,
  secure: false,
  needsUpgrade: false,
  authMethods: ["CRAM-MD5", "DIGEST-MD5", "NTLM"],
  hideSTARTTLS: true,
});

SMTPServerInstance.listen(25);
```

終端機執行以下指令

```
nmap --script smtp-vuln-cve2011-1720 -p 25 localhost
```

SMTP Server log

```
INFO  SMTP Server listening on [::]:25
ERROR mm63mdee64lexiss  read ECONNRESET
INFO  [#mm63mdee64lexiss] mm63mdee64lexiss received "close" event from  after error
INFO  [#mm63mdee64lexiss] Connection closed to
ERROR [#mm63mdee64lexiss] Reverse resolve for : getHostByAddr EINVAL
INFO  [#keutixkxjox5y3fw] Connection from [127.0.0.1]
DEBUG [#keutixkxjox5y3fw] S: 220 yus test localhost SMTP Server ESMTP Exim 4.69
DEBUG [#keutixkxjox5y3fw] C: EHLO localhost
DEBUG [#keutixkxjox5y3fw] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#keutixkxjox5y3fw] 250-PIPELINING
DEBUG [#keutixkxjox5y3fw] 250-8BITMIME
DEBUG [#keutixkxjox5y3fw] 250-SMTPUTF8
DEBUG [#keutixkxjox5y3fw] 250 AUTH CRAM-MD5 DIGEST-MD5 NTLM
DEBUG [#keutixkxjox5y3fw] C: QUIT
DEBUG [#keutixkxjox5y3fw] S: 221 Bye
ERROR keutixkxjox5y3fw 127.0.0.1 read ECONNRESET
INFO  [#keutixkxjox5y3fw] keutixkxjox5y3fw received "close" event from 127.0.0.1 after error
INFO  [#keutixkxjox5y3fw] Connection closed to [127.0.0.1]
```

主要看這段就好

```
DEBUG [#keutixkxjox5y3fw] C: EHLO localhost
DEBUG [#keutixkxjox5y3fw] S: 250-yus test localhost SMTP Server Nice to meet you, [127.0.0.1]
DEBUG [#keutixkxjox5y3fw] 250-PIPELINING
DEBUG [#keutixkxjox5y3fw] 250-8BITMIME
DEBUG [#keutixkxjox5y3fw] 250-SMTPUTF8
DEBUG [#keutixkxjox5y3fw] 250 AUTH CRAM-MD5 DIGEST-MD5 NTLM
DEBUG [#keutixkxjox5y3fw] C: QUIT
DEBUG [#keutixkxjox5y3fw] S: 221 Bye
```

推測可能是 nmap 解析 `250 AUTH CRAM-MD5 DIGEST-MD5 NTLM` 錯誤，所以就直接 `QUIT` 吧

## smtp-vuln-cve2011-1764

[官方文件](https://nmap.org/nsedoc/scripts/smtp-vuln-cve2011-1764.html) 的介紹

```
Checks for a format string vulnerability in the Exim SMTP server (version 4.70 through 4.75) with DomainKeys Identified Mail (DKIM) support (CVE-2011-1764). The DKIM logging mechanism did not use format string specifiers when logging some parts of the DKIM-Signature header field. A remote attacker who is able to send emails, can exploit this vulnerability and execute arbitrary code with the privileges of the Exim daemon.
```

|                   | Exim                                                                           |
| ----------------- | ------------------------------------------------------------------------------ |
| 4.70 release info | date: 2009/11/13<br/>note: https://github.com/Exim/exim/releases/tag/exim-4_70 |
| 4.75 release info | date: 2011/03/22<br/>note: https://github.com/Exim/exim/releases/tag/exim-4_75 |

DKIM 我之前在 [SMTP](../protocols/smtp.md) 的文章沒有介紹到，但這個漏洞的前提是，要有辦法執行 `MAIL FROM` + `RCPT TO` + `DATA`，所以我覺得以滲透測試來講，效益也不高

## Additional Status Codes

這些是我之前的文章 [SMTP](../protocols/smtp.md) 沒有寫到的 Status Codes

| Status Code | Description                                         |
| ----------- | --------------------------------------------------- |
| 530         | Must issue a STARTTLS command first                 |
| 421         | Service not available, closing transmission channel |
| 504         | Command parameter not implemented                   |

## 小結

## 參考資料

- https://nmap.org/nsedoc/scripts/
