---
title: undici Class Dispatcher
description: undici Class Dispatcher
last_update:
  date: "2026-03-23T08:00:00+08:00"
---

- Dispatcher 是 undici 最底層、最核心的 Class
- Dispatcher 繼承 [EventEmiiter](./events.md#eventemitter)
- [Client](./undici-client.md) 就是繼承 Dispatcher

也因此，在進入 undici 的其他 Class 之前，若要先把基礎打好，就得先從 Dispatcher 開始！

## Dispatcher.close([callback]): Promise

## Dispatcher.destroy([error, callback]): Promise

## Dispatcher.connect(options[, callback])

## Dispatcher.dispatch(options, handler)

## Dispatcher.pipeline(options, handler)

要先搞懂 Node.js 的 [stream.pipeline](https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-options)，暫不研究

## Dispatcher.stream(options, factory[, callback])

比 [Dispatcher.request](#dispatcherrequestoptions-callback) 還要快一點，因為可以節省一個 [stream.Readable](./stream-readable.md) 的創建成本，直接把 response body pipe 到 [stream.Writable](./stream-writable.md)

## Dispatcher.upgrade(options[, callback])

## Dispatcher.request(options[, callback])
