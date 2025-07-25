---
title: SMTP
description: SMTP
---

## Port

| Port | Description                                               |
| ---- | --------------------------------------------------------- |
| 25   | SMTP，最古老的，主要用來 Server ->> Server 之間的信件傳送 |
| 465  | SMTPS，已棄用，建議使用 587                               |
| 587  | SMTPS，主要用來接收 SMTP Client 發送的信件                |
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

P.S. 之前有使用過 telnet，但終端介面的鍵盤事件很不習慣，例如 backspace 不能刪除打錯的字，以及 Ctrl + C 不能退出，所以後來就無痛轉移到 netcat

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

| Command    | Description                                         |
| ---------- | --------------------------------------------------- |
| EHLO       | Extended Hello，用來確認 Server 支援哪些 Extensions |
| AUTH LOGIN | Extended Hello，用來確認 Server 支援哪些 Extensions |
| AUTH PLAIN | Extended Hello，用來確認 Server 支援哪些 Extensions |
| STARTTLS   | Extended Hello，用來確認 Server 支援哪些 Extensions |

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
        <div>支援 [128 ~ 255 對應的字符](https://www.ascii-code.com/)</div>
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

嘗試登入時，由於 `netcat` 不支援在終端介面建立 TLS 連線，我們這邊只有單純送出 `STARTTLS` 的指令，所以需要改用 `ncat` 來建立 TLS 連線QQ

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
```

改用 `openssl s_client` 來建立 TLS 連線

```
openssl s_client -connect smtp.ethereal.email:587 -starttls smtp
...建立 TLS 連線的訊息
AUTH LOGIN
334 VXNlcm5hbWU6
123
334 UGFzc3dvcmQ6
456
535 Authentication failed
AUTH LOGIN
334 VXNlcm5hbWU6 # Username: 的 base64 編碼
bGVvcG9sZG8udHVyY290dGUyNEBldGhlcmVhbC5lbWFpbA==
334 UGFzc3dvcmQ6 # Password: 的 base64 編碼
empubm5SMlE0d2tOVnBnbmYx
235 Authentication successful
```

| Command    | Description                                                         |
| ---------- | ------------------------------------------------------------------- |
| AUTH LOGIN | 使用 base64 username + password 來登入，跟 HTTP Basic Auth 同樣概念 |

| Status Code | Description                        |
| ----------- | ---------------------------------- |
| 535         | Authentication credentials invalid |
| 334         | 334 `<base64 challenge>`           |
| 235         | Authentication Succeeded           |

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

###

<!-- todo https://datatracker.ietf.org/doc/html/rfc5321#section-3.5.2 -->

## nodemailer

## SMTP Message

### Content-Transfer-Encoding

### MIME-Version

### Return-Path

## Inbound Email

## 參考資料

- https://datatracker.ietf.org/doc/html/rfc5321
- https://datatracker.ietf.org/doc/html/rfc5322
- https://datatracker.ietf.org/doc/html/rfc2920
- https://datatracker.ietf.org/doc/html/rfc6152
- https://datatracker.ietf.org/doc/html/rfc6531
- https://github.com/nodemailer/nodemailer
- https://github.com/nodemailer/smtp-server
- https://nodemailer.com/
- https://ethereal.email/
- https://chatgpt.com/c/687e2fed-c4c0-8011-a382-6dc667f75b5a
  <!-- - https://emailengine.app/ -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc3207 -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc4954 -->
  <!-- - https://datatracker.ietf.org/doc/html/rfc1870 -->
