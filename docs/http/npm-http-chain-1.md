---
title: 拆解 npm HTTP 俄羅斯套娃：從 ee-first 到 Express 的依賴地獄
description: weekly download 幾千萬的套件，核心可能只有 30 行。帶你從最底層的 EventEmitter 工具到 Express，系統性拆解 npm HTTP 生態系的每一層。
last_update:
  date: "2026-03-06T08:00:00+08:00"
---

## 架構

```mermaid
flowchart TD
    Node.js --> Express
    Node.js --> koa
    Node.js --> fastify
    Node.js --> Connect

    Express --> finalhandler
    finalhandler --> on-finished
    on-finished --> ee-first
```

## ee-first

### 基本資訊

- [Github Repo](https://github.com/jonathanong/ee-first)
- ee = `EventEmitter`
- 底層套件
- 核心程式碼約 100 行

### 核心概念

監聽多個 `EventEmitter` 上的多個 events，只要其中任何一個最先 fire，就觸發 callback，然後自動把所有 listener 都清掉

### 解決什麼問題？

原生 Node.js `EventEmitter` 沒有「race 多個 emitter」的機制。如果你想監聽 req 的 `end`, `error` 其中一個先發生，你得手動：

1. 在每個 emitter 上各掛 listener
2. callback 被觸發後，記得把其他所有 listener 都 `removeListener` 掉，否則 memory leak

`ee-first` 把這個 boilerplate 封裝掉了

### 基本用法
