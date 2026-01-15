---
title: Node.js stream (2)
description: 了解 Readable, Writable, Duplex 的生命週期？一篇帶你搞懂
last_update:
  date: "2026-01-15T08:00:00+08:00"
---

## backpressure

<!-- todo-yus -->

## highWaterMark

<!-- todo-yus -->

## handle errors

https://nodejs.org/api/stream.html#errors-while-writing

<!-- todo-yus -->

## Readable 生命週期 1：誕生 - constructor 與初始化

- constructor
- \_construct

## Readable 生命週期 2: 運作 - 兩種讀取模式的切換

- readableFlowing = null
- on('readable'), read, \_read, push
- on('data')
- pause, on('pause'), isPaused
- resume, on('resume')
- highWaterMark, backpressure

## Readable 生命週期 3: 終結 - 結束、銷毀與錯誤處理

- on('end'), readableEnded
- autoDestroy, destroy, on('destory'), destroyed
- on('close'), closed
- on('error'), errored
