---
title: Simple Mail Transfer Protocol (SMTP)
description: Simple Mail Transfer Protocol (SMTP)
last_update:
  date: "2025-07-29T08:00:00+08:00"
---

## Port

| Port | Description                                               |
| ---- | --------------------------------------------------------- |
| 25   | SMTP，最古老的，主要用來 Server ->> Server 之間的信件傳送 |
| 465  | SMTPS，已棄用，建議使用 587                               |
| 587  | Submission，主要用來接收 SMTP Client 發送的信件           |
| 2525 | Fallback，沒有在規範內                                    |

## SMTP Server Minimum Implementation

根據 [RFC 5321](https://datatracker.ietf.org/doc/html/rfc5321#section-4.5.1) 的描述，這些是 SMTP Server 至少要有的功能

```
In order to make SMTP workable, the following minimum implementation
MUST be provided by all receivers.  The following commands MUST be
supported to conform to this specification:

  EHLO
  HELO
  MAIL
  RCPT
  DATA
  RSET
  NOOP
  QUIT
  VRFY
```

## netcat 安裝

安裝 `netcat` 當作 SMTP Client 端，方便後續連線到 SMTP Server 輸入指令

```
brew install netcat
```

P.S. 之前有使用過 telnet，但終端介面的鍵盤事件很不習慣，例如 backspace 不能刪除打錯的字，以及 Ctrl + C 不能退出...

## SMTP Commands

使用 https://ethereal.email/ 現成的 SMTP Server 來測試

### 連線

```
nc smtp.ethereal.email 587
220 smtp.ethereal.email ESMTP Welcome to Ethereal MSA
```

| Status Code | Description   |
| ----------- | ------------- |
| 220         | Service ready |

### HELO

```
HELO
501 Error: Syntax: HELO hostname
HELO localhost
250 smtp.ethereal.email Nice to meet you, 59-xxx-y-zzz.hinet-ip.hinet.net
```

| Command         | Description                           |
| --------------- | ------------------------------------- |
| HELO `<domain>` | HELLO，用來讓 Server 知道 Client 是誰 |

| Status Code | Description                             |
| ----------- | --------------------------------------- |
| 501         | Syntax error in parameters or arguments |
| 250         | Requested mail action okay, completed   |

### EHLO

```
EHLO localhost
250-smtp.ethereal.email Nice to meet you, 59-xxx-y-zzz.hinet-ip.hinet.net
250-PIPELINING
250-8BITMIME
250-SMTPUTF8
250-AUTH LOGIN PLAIN
250 STARTTLS
```

| Command | Description                                         |
| ------- | --------------------------------------------------- |
| EHLO    | Extended Hello，用來確認 Server 支援哪些 Extensions |

<table>
  <thead>
    <tr>
      <th>Server Capability</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>PIPELINING</td>
      <td>
        <div>支援一次傳送多條 Commands</div>
        <div>詳見 [RFC 2920](https://datatracker.ietf.org/doc/html/rfc2920)</div>
      </td>
    </tr>
    <tr>
      <td>8BITMIME</td>
      <td>
        <div>[SMTP Message](#smtp-message) 支援 [128 ~ 255 對應的字符](https://www.ascii-code.com/)</div>
        <div>詳見 [RFC 6152](https://datatracker.ietf.org/doc/html/rfc6152)</div>
      </td>
    </tr>
    <tr>
      <td>SMTPUTF8</td>
      <td>
        <div>支援 UTF8（Server 必須也要支援 8BITMIME）</div>
        <div>詳見 [RFC 6531](https://datatracker.ietf.org/doc/html/rfc6531)</div>
      </td>
    </tr>
  </tbody>
</table>

### 登入

嘗試登入時，由於 `netcat` 不支援在終端介面建立 TLS 連線，我們這邊只有單純送出 `STARTTLS` 的指令

```
AUTH LOGIN
503 Error: send HELO/EHLO first
HELO hello
250 smtp.ethereal.email Nice to meet you, 59-120-6-153.hinet-ip.hinet.net
AUTH LOGIN
538 Error: Must issue a STARTTLS command first
STARTTLS
220 Ready to start TLS
AUTH LOGIN
... 連線被強制斷開
```

我們改用 `openssl s_client` 來建立 TLS 連線

P.S. `openssl` 在 linux 環境應該預設都有安裝，Windows 的話要到 [這裡](https://slproweb.com/products/Win32OpenSSL.html) 下載

```
openssl s_client -connect smtp.ethereal.email:587 -starttls smtp
...建立 TLS 連線的訊息

# 第一次先故意輸入錯誤的帳密
AUTH LOGIN
334 VXNlcm5hbWU6 # Username: 的 base64 編碼
123
334 UGFzc3dvcmQ6 # Password: 的 base64 編碼
456
535 Authentication failed

# 第二次再用真實的帳密登入
AUTH LOGIN
334 VXNlcm5hbWU6
bGVvcG9sZG8udHVyY290dGUyNEBldGhlcmVhbC5lbWFpbA==
334 UGFzc3dvcmQ6
empubm5SMlE0d2tOVnBnbmYx
235 Authentication successful
```

| Command    | Description                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| AUTH LOGIN | 使用 base64 username + password 來登入，跟 [HTTP Basic Auth](../http/http-authentication.md#nginx-http-basic-auth) 同樣概念 |
| STARTTLS   | 建立 TLS 連線，跟 [FTP](ftp.md) 的 AUTH TLS 是同樣概念                                                                      |

| Status Code | Description                                                |
| ----------- | ---------------------------------------------------------- |
| 503         | Bad sequence of commands                                   |
| 538         | Encryption required for requested authentication mechanism |
| 535         | Authentication credentials invalid                         |
| 334         | 334 `<base64 challenge>`                                   |
| 235         | Authentication Succeeded                                   |

### 閒置太久

```
421 Timeout - closing connection
```

| Status Code | Description                                         |
| ----------- | --------------------------------------------------- |
| 421         | Service not available, closing transmission channel |

### 斷開連線

```
QUIT
221 Bye
```

| Command | Description |
| ------- | ----------- |
| QUIT    | 斷開連線    |

| Status Code | Description                          |
| ----------- | ------------------------------------ |
| 221         | Service closing transmission channel |

### 保持活躍

```
NOOP
250 OK
```

| Command | Description          |
| ------- | -------------------- |
| NOOP    | 我還活著！別斷開連線 |

### VRFY

看起來 `smtp.ethereal.email` 似乎沒有開啟 `VRFY` 的功能

```
VRFY leopoldo.turcotte24@ethereal.email
252 Try to send something. No promises though
```

| Command | Description   |
| ------- | ------------- |
| VRFY    | VERIFY a user |

| Status Code | Description                                                    |
| ----------- | -------------------------------------------------------------- |
| 252         | Cannot VRFY user, but will accept message and attempt delivery |

### EXPN

```
EXPN admin
500 Error: command not recognized
```

| Command | Description           |
| ------- | --------------------- |
| EXPN    | EXPAND a mailing list |

| Status Code | Description                        |
| ----------- | ---------------------------------- |
| 500         | Syntax error, command unrecognized |

關於 [VRFY](#vrfy) 跟 [EXPN](#expn)，由於都有列舉使用者郵件地址的資安風險，所以 [RFC 5321](https://datatracker.ietf.org/doc/html/rfc5321#section-7.3) 有專門提到解法：

```
If a site disables these commands for security reasons, the SMTP
  server MUST return a 252 response, rather than a code that could be
  confused with successful or unsuccessful verification.
```

### 寄送郵件

先執行 [openssl 連線 + 登入](#登入)，之後開始寄送郵件

```
MAIL FROM:<leopoldo.turcotte24@ethereal.email>
250 Accepted
RCPT TO:<test.account@ethereal.email>
RENEGOTIATING
40D7FDD02E7F0000:error:0A00010A:SSL routines:can_renegotiate:wrong ssl version:../ssl/ssl_lib.c:2323:
```

看起來是開頭大寫的 R 會被 openssl 視為 RENEGOTIATING，改成小寫的重試一次

```
MAIL FROM:<leopoldo.turcotte24@ethereal.email>
250 Accepted
rCPT TO:<test.account@ethereal.email>
250 Accepted
DATA
354 End data with <CR><LF>.<CR><LF>
Date: Fri, 25 Jul 2025 14:30:00 +0800
From: userx@leopoldo.turcotte24@ethereal.email

helloworld
.
250 Accepted [STATUS=new MSGID=aIIQr6fe0eT1BCHlaIOCxqqYuaj5Gk85AAAACVuuft7tdhLnFwSkehrezwA]
QUIT
DONE
```

這次有成功了，不過剛好我是用 Windows 系統，所以 Enter 鍵會被轉譯成 `\r\n`。

如果是 linux 系統，需要將第一行加上 `-crlf` 參數，就可以確保 Enter 鍵是 `\r\n`，而不是單純的 `\n`

```
openssl s_client -connect smtp.ethereal.email:587 -starttls smtp -crlf
```

| Command   | Description      |
| --------- | ---------------- |
| MAIL FROM | 寄件人           |
| RCPT TO   | 收件人           |
| DATA      | 開始傳送郵件內容 |

| Status Code | Description                                |
| ----------- | ------------------------------------------ |
| 354         | Start mail input; end with `<CRLF>.<CRLF>` |

## SMTP Message

上面的 [寄送郵件](#寄送郵件) 範例，有演示了基本的 SMTP Message 傳輸格式

```
Date: Fri, 25 Jul 2025 14:30:00 +0800
From: userx@leopoldo.turcotte24@ethereal.email

helloworld
.
```

其實用 HTTP 的概念來理解，就會發現其實不難，基本上有 87% 像，可參考我寫過的 [anatomy-of-an-http-message](../http/anatomy-of-an-http-message.md) 這篇文章。SMTP Message 可以分成三個區塊

```
SMTP Headers

SMTP Body
.
```

### SMTP Message Headers

這邊把常用的 SMTP Headers 列出來參考：

<table>
  <thead>
    <tr>
      <th>SMTP Header</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>* Return-Path</td>
      <td>
        <div>郵件寄出失敗時，要通知誰</div>
        <div>由終端 SMTP Server 在 SMTP Headers 的第一行加入</div>
        <div>Return-Path: MAIL FROM</div>
        <div>`Return-Path: <leopoldo.turcotte24@ethereal.email>`</div>
      </td>
    </tr>
    <tr>
      <td>* From</td>
      <td>
        <div>郵件內容的作者</div>
        <div>`From: Leopoldo Turcotte <leopoldo.turcotte24@ethereal.email>`</div>
        <div>❗可設定多個作者，但實務上好像很少這樣做</div>
      </td>
    </tr>
    <tr>
      <td>Sender</td>
      <td>
        <div>寄件者</div>
        <div>`Sender: Leopoldo Turcotte <leopoldo.turcotte24@ethereal.email>`</div>
        <div>❗如果 From 跟 Sender 是同一個人，則 Sender 可以省略</div>
      </td>
    </tr>
    <tr>
      <td>To</td>
      <td>
        <div>收件者，可複數</div>
        <div>`To: <messageA@example.com> <messageB@example.com>`</div>
      </td>
    </tr>
    <tr>
      <td>Cc</td>
      <td>
        <div>副本 (Carbon Copy)，可複數</div>
        <div>`Cc: <messageA@example.com> <messageB@example.com>`</div>
      </td>
    </tr>
    <tr>
      <td>Bcc</td>
      <td>
        <div>密件副本 (Blind Carbon Copy)，可複數</div>
        <div>`Bcc: <messageA@example.com> <messageB@example.com>`</div>
      </td>
    </tr>
    <tr>
      <td>Reply To</td>
      <td>
        <div>請回覆到這個郵件地址</div>
        <div>`Reply To: "My Personal Account" <myPersonalAccount@ethereal.email>`</div>
      </td>
    </tr>
    <tr>
      <td>Subject</td>
      <td>標題</td>
    </tr>
    <tr>
      <td>Message-ID</td>
      <td>`Message-ID: <c112c786-81a9-aa6c-ad3f-de01c887ae8a@ethereal.email>`</td>
    </tr>
    <tr>
      <td>In Reply To</td>
      <td>
        <div>回覆哪一則郵件</div>
        <div>`In Reply To: <c112c786-81a9-aa6c-ad3f-de01c887ae8a@ethereal.email>`</div>
      </td>
    </tr>
    <tr>
      <td>References</td>
      <td>
        <div>對話串的歷史</div>
        <div>`References: <messageA@example.com> <messageB@example.com>`</div>
      </td>
    </tr>
    <tr>
      <td>Content-Transfer-Encoding</td>
      <td>
        <div>SMTP 最初只有支援 7-bit ASCII 文字</div>
        <div>為了要傳輸各國文字、二進制圖片等等，才有了這個 Header</div>
        <div>`Content-Transfer-Encoding: 7bit`</div>
      </td>
    </tr>
    <tr>
      <td>* Date</td>
      <td>`Date: Sat, 26 Jul 2025 02:01:28 +0000`</td>
    </tr>
    <tr>
      <td>MIME-Version</td>
      <td>`MIME-Version: 1.0`</td>
    </tr>
    <tr>
      <td>Content-Type</td>
      <td>基本上跟 [HTTP 的 Content-Type](../http/content-type-and-mime-type.md) 是同樣概念</td>
    </tr>
  </tbody>
</table>

## nodemailer

nodemailer 是一個 npm 知名的 SMTP Client，用來學習 SMTP 非常適合，並且它也有測試用的 SMTP Server 可以看到信件內容

1. 我們先到 https://ethereal.email/ 免費註冊，並且把帳密跟使用者名稱記下來
2. `npm i nodemailer`
3. `npm i -D @types/nodemailer`
4. 建立跟 SMTP Server 的連線

```ts
import { createTransport } from "nodemailer";

const transport = createTransport({
  debug: true,
  logger: true,
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "leopoldo.turcotte24@ethereal.email",
    pass: "zjnnnR2Q4wkNVpgnf1",
  },
});
```

5. 寄送

```ts
transport
  .sendMail({
    from: '"中文" 中文1@ethereal.email',
    to: ["中文2@ethereal.email", "中文3@ethereal.email"],
    subject: "中文 subject",
    text: "中文 content",
    html: "<h1>中文中文中文</h1>",
    cc: ["中文4@ethereal.email", "中文5@ethereal.email"],
    bcc: ["中文6@ethereal.email", "中文7@ethereal.email"],
    sender: "中文8@ethereal.email",
    replyTo: ["中文9@ethereal.email", "中文10@ethereal.email"],
    list: {
      Help: {
        url: "https://example.com/Help",
        comment: "Help",
      },
      Unsubscribe: {
        url: "https://example.com/Unsubscribe",
        comment: "Unsubscribe",
      },
      Subscribe: {
        url: "https://example.com/Subscribe",
        comment: "Subscribe",
      },
      Post: {
        url: "https://example.com/Post",
        comment: "Post",
      },
      Owner: {
        url: "https://example.com/Owner",
        comment: "Owner",
      },
      Archive: {
        url: "https://example.com/Archive",
        comment: "Archive",
      },
    },
    attachments: [
      { path: join(__dirname, "small.png"), filename: "small.png" },
    ],
  })
  .then((res) => console.log(res))
  .catch((err) => console.log(err));
```

DEBUG LOG

```
DEBUG [JEYEJIdafM] S: 220 smtp.ethereal.email ESMTP Welcome to Ethereal MSA
DEBUG [JEYEJIdafM] C: EHLO [127.0.0.1]
DEBUG [JEYEJIdafM] S: 250-smtp.ethereal.email Nice to meet you, 1-xxx-yyy-zz.dynamic-ip.hinet.net
DEBUG [JEYEJIdafM] S: 250-PIPELINING
DEBUG [JEYEJIdafM] S: 250-8BITMIME
DEBUG [JEYEJIdafM] S: 250-SMTPUTF8
DEBUG [JEYEJIdafM] S: 250-AUTH LOGIN PLAIN
DEBUG [JEYEJIdafM] S: 250 STARTTLS
DEBUG [JEYEJIdafM] C: STARTTLS
DEBUG [JEYEJIdafM] S: 220 Ready to start TLS
DEBUG [JEYEJIdafM] C: EHLO [127.0.0.1]
DEBUG [JEYEJIdafM] S: 250-smtp.ethereal.email Nice to meet you, 1-xxx-yyy-zz.dynamic-ip.hinet.net
DEBUG [JEYEJIdafM] S: 250-PIPELINING
DEBUG [JEYEJIdafM] S: 250-8BITMIME
DEBUG [JEYEJIdafM] S: 250-SMTPUTF8
DEBUG [JEYEJIdafM] S: 250 AUTH LOGIN PLAIN
DEBUG [JEYEJIdafM] SMTP handshake finished
DEBUG [JEYEJIdafM] C: AUTH PLAIN AGxlb3BvbGRvLnR1cmNvdHRlMjRAZXRoZXJlYWwuZW1haWwALyogc2VjcmV0ICov
DEBUG [JEYEJIdafM] S: 235 Authentication successful
DEBUG [JEYEJIdafM] C: MAIL FROM:<中文1@ethereal.email> SMTPUTF8
DEBUG [JEYEJIdafM] S: 250 Accepted
DEBUG [JEYEJIdafM] C: RCPT TO:<中文2@ethereal.email>
DEBUG [JEYEJIdafM] C: RCPT TO:<中文3@ethereal.email>
DEBUG [JEYEJIdafM] C: RCPT TO:<中文4@ethereal.email>
DEBUG [JEYEJIdafM] C: RCPT TO:<中文5@ethereal.email>
DEBUG [JEYEJIdafM] C: RCPT TO:<中文6@ethereal.email>
DEBUG [JEYEJIdafM] C: RCPT TO:<中文7@ethereal.email>
DEBUG [JEYEJIdafM] S: 250 Accepted
DEBUG [JEYEJIdafM] S: 250 Accepted
DEBUG [JEYEJIdafM] S: 250 Accepted
DEBUG [JEYEJIdafM] S: 250 Accepted
DEBUG [JEYEJIdafM] S: 250 Accepted
DEBUG [JEYEJIdafM] S: 250 Accepted
DEBUG [JEYEJIdafM] C: DATA
DEBUG [JEYEJIdafM] S: 354 End data with <CR><LF>.<CR><LF>
DEBUG [JEYEJIdafM] From: =?UTF-8?B?5Lit5paH?= <ä¸­æ1@ethereal.email>
DEBUG [JEYEJIdafM] Sender: ä¸­æ8@ethereal.email
DEBUG [JEYEJIdafM] To: ä¸­æ2@ethereal.email, ä¸­æ3@ethereal.email
DEBUG [JEYEJIdafM] Cc: ä¸­æ4@ethereal.email, ä¸­æ5@ethereal.email
DEBUG [JEYEJIdafM] Reply-To: ä¸­æ9@ethereal.email, ä¸­æ10@ethereal.email
DEBUG [JEYEJIdafM] Subject: =?UTF-8?Q?=E4=B8=AD=E6=96=87_subject?=
DEBUG [JEYEJIdafM] Message-ID: <bb6aa2ab-cfe6-67bf-9132-4e72509b4581@ethereal.email>
DEBUG [JEYEJIdafM] List-Help: <https://example.com/Help> (Help)
DEBUG [JEYEJIdafM] List-Unsubscribe: <https://example.com/Unsubscribe> (Unsubscribe)
DEBUG [JEYEJIdafM] List-Subscribe: <https://example.com/Subscribe> (Subscribe)
DEBUG [JEYEJIdafM] List-Post: <https://example.com/Post> (Post)
DEBUG [JEYEJIdafM] List-Owner: <https://example.com/Owner> (Owner)
DEBUG [JEYEJIdafM] List-Archive: <https://example.com/Archive> (Archive)
DEBUG [JEYEJIdafM] Date: Sun, 27 Jul 2025 02:58:50 +0000
DEBUG [JEYEJIdafM] MIME-Version: 1.0
DEBUG [JEYEJIdafM] Content-Type: multipart/mixed; boundary="--_NmP-bdcd17b03de1a474-Part_1"
DEBUG [JEYEJIdafM]
DEBUG [JEYEJIdafM] ----_NmP-bdcd17b03de1a474-Part_1
DEBUG [JEYEJIdafM] Content-Type: multipart/alternative;
DEBUG [JEYEJIdafM]  boundary="--_NmP-bdcd17b03de1a474-Part_2"
DEBUG [JEYEJIdafM]
DEBUG [JEYEJIdafM] ----_NmP-bdcd17b03de1a474-Part_2
DEBUG [JEYEJIdafM] Content-Type: text/plain; charset=utf-8
DEBUG [JEYEJIdafM] Content-Transfer-Encoding: quoted-printable
DEBUG [JEYEJIdafM]
DEBUG [JEYEJIdafM] =E4=B8=AD=E6=96=87 content
DEBUG [JEYEJIdafM] ----_NmP-bdcd17b03de1a474-Part_2
DEBUG [JEYEJIdafM] Content-Type: text/html; charset=utf-8
DEBUG [JEYEJIdafM] Content-Transfer-Encoding: base64
DEBUG [JEYEJIdafM]
DEBUG [JEYEJIdafM] PGgxPuS4reaWh+S4reaWh+S4reaWhzwvaDE+
DEBUG [JEYEJIdafM] ----_NmP-bdcd17b03de1a474-Part_2--
DEBUG [JEYEJIdafM]
DEBUG [JEYEJIdafM] ----_NmP-bdcd17b03de1a474-Part_1
DEBUG [JEYEJIdafM] Content-Type: image/png; name=small.png
DEBUG [JEYEJIdafM] Content-Transfer-Encoding: base64
DEBUG [JEYEJIdafM] Content-Disposition: attachment; filename=small.png
DEBUG [JEYEJIdafM]
DEBUG [JEYEJIdafM] iVBORw0KGgoAAAANSUhEUgAAAMgAAACqCAYAAADoZADPAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJ
...省略 base64 圖片的部分
DEBUG [JEYEJIdafM] ----_NmP-bdcd17b03de1a474-Part_1--
DEBUG [JEYEJIdafM] .
DEBUG [JEYEJIdafM] S: 250 Accepted [STATUS=new MSGID=aIIQr6fe0eT1BCHlaIWV7zr3pD0h7PfsAAAAG70xFV0ufO5Yy1T1yiO87Tw]
DEBUG [JEYEJIdafM] Closing connection to the server using "end"
```

sendMail response

```ts
{
  accepted: [
    '中文2@ethereal.email',
    '中文3@ethereal.email',
    '中文4@ethereal.email',
    '中文5@ethereal.email',
    '中文6@ethereal.email',
    '中文7@ethereal.email'
  ],
  rejected: [],
  ehlo: [ 'PIPELINING', '8BITMIME', 'SMTPUTF8', 'AUTH LOGIN PLAIN' ],
  envelopeTime: 1319,
  messageTime: 285,
  messageSize: 13395,
  response: '250 Accepted [STATUS=new MSGID=aIIQr6fe0eT1BCHlaIWV7zr3pD0h7PfsAAAAG70xFV0ufO5Yy1T1yiO87Tw]',
  envelope: {
    from: '中文1@ethereal.email',
    to: [
      '中文2@ethereal.email',
      '中文3@ethereal.email',
      '中文4@ethereal.email',
      '中文5@ethereal.email',
      '中文6@ethereal.email',
      '中文7@ethereal.email'
    ]
  },
  messageId: '<bb6aa2ab-cfe6-67bf-9132-4e72509b4581@ethereal.email>'
}
```

有幾個重點可以關注

- `STARTTLS` 前後都會進行一次 `EHLO`
- `AUTH PLAIN` 的格式，根據 [RFC 4616](https://datatracker.ietf.org/doc/html/rfc4616)

```
# 原始傳輸
AUTH PLAIN AGxlb3BvbGRvLnR1cmNvdHRlMjRAZXRoZXJlYWwuZW1haWwALyogc2VjcmV0ICov

# base64 decode
\x00leopoldo.turcotte24@ethereal.email\x00/* secret */

# 格式
UTF8NUL authcid UTF8NUL passwd
```

- 從 `MAIL FROM:<中文1@ethereal.email> SMTPUTF8` 可以發現 `SMTPUTF8` 真的有啟用
- `To`, `Cc`, `Bcc` 這三個 [SMTP Message Headers](#smtp-message-headers) 實際上在 [SMTP Command](#smtp-commands) 是用多行 `RCPT TO` 來指定多個收件人

```
RCPT TO:<中文2@ethereal.email>
RCPT TO:<中文3@ethereal.email>
RCPT TO:<中文4@ethereal.email>
RCPT TO:<中文5@ethereal.email>
RCPT TO:<中文6@ethereal.email>
RCPT TO:<中文7@ethereal.email>
```

- [SMTP Message Headers](#smtp-message-headers) 在傳輸 UTF-8 字串時，會經過 base64 encoding 再傳輸<br/>（為了向後兼容，畢竟 SMTP 最初只支援 7-bit ASCII）

```
# 原始傳輸
From: =?UTF-8?B?5Lit5paH?= <ä¸­æ1@ethereal.email>

# 可以解讀成
From: =?UTF-8?Base64?中文?= <中文1@ethereal.email>
```

- SMTP Message Body 若包含文字、HTML、圖片，就會啟動 `Content-Type: multipart/mixed` 傳輸<br/>（跟 [multipart/formdata](../http/content-type-and-mime-type.md#multipartformdata) 有異曲同工之妙）

text（`quoted-printable` 可參考 [RFC 2045](https://datatracker.ietf.org/doc/html/rfc2045#section-6.7)）

```
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: quoted-printable

=E4=B8=AD=E6=96=87 content
```

html

```
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: base64

PGgxPuS4reaWh+S4reaWh+S4reaWhzwvaDE+
```

attachment

```
Content-Type: image/png; name=small.png
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename=small.png

iVBORw0KGgoAAAANSUhEUgAAAMgAAACqCAYAAADoZADPAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJ
...省略 base64 圖片的部分
```

## enhanced status code

https://datatracker.ietf.org/doc/html/rfc2034
https://datatracker.ietf.org/doc/html/rfc3463

| Status Code | Description                                          |
| ----------- | ---------------------------------------------------- |
| 502         | Command not implemented                              |
| 450         | Requested mail action not taken: mailbox unavailable |
| 554         | Transaction failed                                   |
| 535         | Authentication credentials invalid                   |
| 550         | Requested action not taken: mailbox unavailable      |
| 454         |                                                      |

| Enhanced Status Code | Description |
| -------------------- | ----------- |
| 5.7.1                |             |
| 4.2.0                |             |
| 5.7.8                |             |
| 2.7.0                |             |
| 4.7.1                |             |

## BDAT

## ETRN

## DSN

## CHUNKING

## 小結

SMTP 在 2025 年其實也是佔有一席之地，從它的 RFC 發展活躍度，我才發現到 SMTP 遠沒有我想像的簡單。這篇文章頂多算是淺入淺出的學習筆記，實際上還有很多主題我沒有研究，但我的目標只是對 SMTP 有個初步的認識，會用一些基本的 SMTP Commands，並且大概知道 SMTP Message 的格式。不過，有 HTTP 的基礎，再來學習 SMTP 真的會快很多，很多概念我認為都是相通的，在學習 SMTP 的時候，常常有一種忽然打通任督二脈的感覺，原來這不是 HTTP 獨有的設計模式啊！

<!-- ## DKIM -->

<!-- ## AMP -->

<!-- ## Inbound Email -->

## 參考資料

| Topic                               | URL                                           |
| ----------------------------------- | --------------------------------------------- |
| Simple Mail Transfer Protocol       | https://datatracker.ietf.org/doc/html/rfc5321 |
| Internet Message Format             | https://datatracker.ietf.org/doc/html/rfc5322 |
| List-\* 開頭的 SMTP Message Headers | https://datatracker.ietf.org/doc/html/rfc2369 |
| PIPELINING                          | https://datatracker.ietf.org/doc/html/rfc2920 |
| Authentication                      | https://datatracker.ietf.org/doc/html/rfc4954 |
| 8BITMIME                            | https://datatracker.ietf.org/doc/html/rfc6152 |
| SMTPUTF8                            | https://datatracker.ietf.org/doc/html/rfc6531 |
| NodeJS SMTP Client                  | https://github.com/nodemailer/nodemailer      |
| nodemailer Official Document        | https://nodemailer.com/                       |
| nodemailer Test SMTP Server         | https://ethereal.email/                       |

<!-- | Format of Internet Message Bodies | https://datatracker.ietf.org/doc/html/rfc2045 | -->
<!-- | TLS | https://datatracker.ietf.org/doc/html/rfc3207 | -->
<!-- | Message Size Declaration | https://datatracker.ietf.org/doc/html/rfc1870 | -->
<!-- | DomainKeys Identified Mail (DKIM) | https://datatracker.ietf.org/doc/html/rfc6376 | -->
<!-- | Accelerated Mobile Pages (AMP) | https://amp.dev/documentation/guides-and-tutorials/learn/spec/amphtml | -->
