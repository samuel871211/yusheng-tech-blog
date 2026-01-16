---
title: Node.js stream.Readable 生命週期
# description: Node.js stream.Readable 生命週期
last_update:
  date: "2026-01-16T08:00:00+08:00"
---

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
