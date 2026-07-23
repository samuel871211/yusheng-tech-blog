# Yusheng's Tech Blog

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## 初衷

學習 HTTP、Web Security、Node.js、JavaScript 以及 Layer 7 Protocols 等等

技術文章是主要的產出，CVE 只是研究過程順手拿到的，請勿當成主要 KPI，而模糊了 "初衷"

## 專有名詞規範

- HTTP client
- HTTP server
- HTTP range requests
- HTTP caching
- HTTP header
- HTTP request
- HTTP response
- HTTP Request Smuggling
- request header
- header(s)
- request body
- body
- TCP connection
- TCP 連線
- request / response
- client
- server
- TCP socket
- TCP client
- TCP server
- Node.js
- Node.js `http.Server`
- Node.js `http` 模組
- Node.js `net` 模組
- Apache HTTP Server
- F12 > Console
- JavaScript
- `200`, `206` ...
- `OK`, `Partial Content` ...
- `GET`, `POST` ...
- `Connection`, `Keep-Alive` ...
- Forward Proxy
- Reverse Proxy
- target server
- Cors preflight request
- `on("event")` (雙引號)
- `emit("event")` (雙引號)

## Installation

```
pnpm i
```

## Local Development

```
pnpm dev
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## last_update

每篇文章都會有 last_update，這代表的是文章內容最後的更新日期，格式排版、修正錯字不算在內。

## 圖片

| Path        | Description                     |
| ----------- | ------------------------------- |
| /static/img | images reference by docs folder |
| /static/    | images only reference by iThome |
