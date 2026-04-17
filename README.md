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
- header(s)
- body
- TCP connection
- request / response
- client
- server
- TCP socket
- Node.js
- Node.js `http.Server`
- Node.js `http` 模組
- Node.js `net` 模組
- Apache HTTP Server
- `200`, `206` ...
- `OK`, `Partial Content` ...

## Installation

```
npm i
```

## Local Development

```
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

This website is deployed using Github workflows.

## last_update

每篇文章都會有 last_update，這代表的是文章內容最後的更新日期，格式排版、修正錯字不算在內。
