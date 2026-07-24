---
title: stream.Readable 生命週期
description: 整理 Node.js Readable 面向開發者與使用者的方法、事件觸發順序，附時間軸圖解正常關閉流程
last_update:
  date: "2026-07-24T08:00:00+08:00"
---

## 前言

這篇會把 `stream.Readable` 分多個生命週期階段來拆解

- [生命週期 1：初始化](#生命週期-1初始化)
- [生命週期 2：運作 - 兩種讀取模式的切換](#生命週期-2運作---兩種讀取模式的切換)
- [生命週期 3：結束](#生命週期-3結束)
- [生命週期 4：關閉](#生命週期-4關閉)

## 生命週期 1：初始化

初始化階段，會依序執行 `constructor` 跟 `_construct`

```ts
import { Readable, ReadableOptions } from "stream";

class MyReadable extends Readable {
  constructor(opts?: ReadableOptions) {
    console.log(performance.now(), "constructor");
    super(opts);
  }
  _construct(callback: (error?: Error | null) => void): void {
    console.log(performance.now(), "_construct");
    // 模擬 async 操作，例如：建立 TCP 連線
    setTimeout(callback, 1000);
  }
}

const myReadable = new MyReadable();
```

執行順序

```ts
185.6451 constructor
186.6653 _construct
```

## 生命週期 2：運作 - 兩種讀取模式的切換

### `_construct` 完成才會執行 `_read`

`_construct` 代表的是非同步的初始化階段，需等到初始化完成，才能開始 `_read` 讀取資料

```ts
import { Readable, ReadableOptions } from "stream";

class MyReadable extends Readable {
  _construct(callback: (error?: Error | null) => void): void {
    console.log(performance.now(), "_construct");
    // 模擬 async 操作，例如：建立 TCP 連線
    setTimeout(callback, 100);
  }
  _read(size: number): void {
    console.log(performance.now(), "_read");
  }
}

const myReadable = new MyReadable();
myReadable.read();
```

執行順序

```ts
161.7818 _construct
269.6082 _read
```

### `push(chunk)` 或 `push(null)`

- `push(chunk)` 用來把讀進來的資料寫入 internal buffer，概念類似 `writable.write(chunk)`
- `push(null)` 用來宣告讀取結束，概念類似 `writable.end()`
- 以上兩者都必須在 `_read` 的實作內呼叫

### 自動讀取：`on("data")`

```ts
import assert from "assert";
import { Readable } from "stream";

class MyReadable extends Readable {
  // 設定計數器，最多觸發 5 次 push(chunk)
  private maxCount = 5;
  private curCount = 0;
  _read(size: number): void {
    console.log(performance.now(), "_read");
    // 模擬讀取資料的延遲
    setTimeout(() => {
      if (this.curCount < this.maxCount) {
        this.push("1".repeat(size));
        this.curCount++;
        return;
      }
      // 第 6 次就會 push(null) 來結束 readable
      this.push(null);
    }, 100);
  }
}

const myReadable = new MyReadable();
assert(myReadable.readableFlowing === null);
// ✅ 使用 on("data") 自動讀取資料
myReadable.on("data", ({ byteLength }: Buffer) => {
  console.log(performance.now(), 'on("data")', { byteLength });
});
assert(myReadable.readableFlowing === true);
```

執行順序

```ts
79.826625  _read
181.514167 on("data") { byteLength: 16384 }
181.921875 _read
283.394417 on("data") { byteLength: 16384 }
283.983792 _read
385.229083 on("data") { byteLength: 16384 }
385.627667 _read
487.119792 on("data") { byteLength: 16384 }
487.470292 _read
589.229042 on("data") { byteLength: 16384 }
589.918458 _read
```

- [readableFlowing](https://nodejs.org/api/stream.html#readablereadableflowing) 有 `null`、`true` 跟 `false` 三種狀態，初始值是 `null`
- 當 `on("data")` 開始監聽後，`readableFlowing` 會轉成 `true`
- 自動讀取的設計哲學是 **"有多少讀多少"**，所以 Node.js 會直接在背後呼叫 `_read(highWaterMark)`
- 承上，根據 [Node.js 原始碼](https://github.com/nodejs/node/blob/main/lib/internal/streams/state.js)，Windows 的預設 `highWaterMark` 16KiB 符合預期

  <!-- prettier-ignore -->
  ```js
  let defaultHighWaterMarkBytes = process.platform === "win32" ? 16 * 1024 : 64 * 1024;
  ```

### 自動讀取：用 `pause` 跟 `resume` 控制開關

- 註冊 `on("data")` 會讓 `readableFlowing` 變成 `true`
- 若想要暫停，可以使用 `pause()`，會讓 `readableFlowing` 從 `true` 變成 `false`，並且觸發 `on("pause")`
- 若想要繼續，可以使用 `resume()`，會讓 `readableFlowing` 從 `false` 變成 `true`，並且觸發 `on("resume")`

```ts
import { Readable } from "stream";
import assert from "assert";

class MyReadable extends Readable {
  // 設定計數器，最多觸發 5 次 push(chunk)
  private maxCount = 5;
  private curCount = 0;
  _read(size: number): void {
    // 模擬讀取資料的延遲
    setTimeout(() => {
      if (this.curCount < this.maxCount) {
        this.push("1".repeat(size));
        this.curCount++;
        return;
      }
      // 第 6 次就會 push(null) 來結束 readable
      this.push(null);
    }, 100);
  }
}

const myReadable = new MyReadable();
// ✅ Step 1：第一次觸發 "data" event，呼叫 pause()
myReadable.once("data", (chunk) => {
  console.log('once("data")');
  myReadable.pause();
  assert(myReadable.isPaused() === true);
  assert(myReadable.readableFlowing === false);
});
// ✅ Step 2：觸發 "pause" event，一秒後再呼叫 resume()
myReadable.once("pause", () => {
  console.log('once("pause")');
  assert(myReadable.readableFlowing === false);
  setTimeout(() => myReadable.resume(), 1000);
  // ✅ Step 3：觸發 "resume" event，監聽 on("data") 把剩下的資料讀完
  myReadable.once("resume", () => {
    console.log('once("resume")');
    assert(myReadable.readableFlowing === true);
    myReadable.on("data", () => console.log('on("data")'));
  });
});
```

執行順序

```ts
once("data");
once("pause");
once("resume");
on("data");
on("data");
on("data");
on("data");
```

### 手動讀取：`on("readable")` 搭配 `read`

```ts
import { Readable } from "stream";
import assert from "assert";

class MyReadable extends Readable {
  // 設定計數器，最多觸發 5 次 push(chunk)
  private maxCount = 5;
  private curCount = 0;
  _read(size: number): void {
    console.log(performance.now(), "_read");
    // 模擬讀取資料的延遲
    setTimeout(() => {
      if (this.curCount < this.maxCount) {
        this.push("1".repeat(size));
        this.curCount++;
        return;
      }
      // 第 6 次就會 push(null) 來結束 readable
      this.push(null);
    }, 100);
  }
}

// 統一使用 16KiB，避免跨作業系統的預設值不一樣
const myReadable = new MyReadable({ highWaterMark: 16384 });
assert(myReadable.readableFlowing === null);
myReadable.on("readable", () => {
  assert(myReadable.readableFlowing === false);
  const data = myReadable.read();
  console.log(performance.now(), 'on("readable")', data?.byteLength);
});
```

執行順序

```ts
180.767333 on("readable") 16384
281.010791 on("readable") 16384
381.541625 on("readable") 16384
483.318708 on("readable") 16384
585.326958 on("readable") 16384
687.046375 on("readable") undefined
```

- 當 `on("readable")` 開始監聽後，`readableFlowing` 會從 `null` 轉成 `false`
- `read` 若無指定 `size` 參數，則預設會把 internal buffer 的資料讀完，參考 Node.js [readable.read([size])](https://nodejs.org/api/stream.html#readablereadsize) 官方文件：

  ```
  If the size argument is not specified, all of the data contained in the internal buffer will be returned.
  ```

- 最後一次的 `read` 讀到的資料是 `null`，故 `data?.byteLength` 等於 `undefined`，參考 Node.js [on("readable")](https://nodejs.org/api/stream.html#event-readable) 官方文件：

  ```
  If the end of the stream has been reached, calling stream.read() will return null and trigger the 'end' event.
  ```

## 生命週期 3：結束

- `stream.Writable` 的結束訊號，是由 **使用者** 呼叫 `writable.end`
- `stream.Readable` 的結束訊號，是由 **開發者** 呼叫 `readable.push(null)`

寫個 PoC 來觀察 `on("end")` 的觸發

```ts
import { Readable } from "stream";

class MyReadable extends Readable {
  // 設定計數器，最多觸發 5 次 push(chunk)
  private maxCount = 5;
  private curCount = 0;
  _read(size: number): void {
    // 模擬讀取資料的延遲
    setTimeout(() => {
      if (this.curCount < this.maxCount) {
        this.push("1".repeat(size));
        this.curCount++;
        return;
      }
      // 第 6 次就會 push(null) 來結束 readable
      this.push(null);
    }, 100);
  }
}

const myReadable = new MyReadable({ autoDestroy: false });
myReadable.on("data", () => console.log('on("data")'));
// ✅ 監聽 on("end")
myReadable.on("end", () => console.log('on("end")'));
```

執行順序

```ts
on("data");
on("data");
on("data");
on("data");
on("data");
on("end");
```

## 生命週期 4：關閉

結束之後，若有設定 `autoDestroy: true`，則會依序觸發 `_destroy` 跟 `on("close")`

```ts
import { Readable } from "stream";

class MyReadable extends Readable {
  // 設定計數器，最多觸發 5 次 push(chunk)
  private maxCount = 5;
  private curCount = 0;
  _read(size: number): void {
    // 模擬讀取資料的延遲
    setTimeout(() => {
      if (this.curCount < this.maxCount) {
        this.push("1".repeat(size));
        this.curCount++;
        return;
      }
      // 第 6 次就會 push(null) 來結束 readable
      this.push(null);
    }, 100);
  }
  // ✅ 實作 _destroy
  _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void,
  ): void {
    console.log(performance.now(), "_destroy");
    setTimeout(callback, 100);
  }
}

const myReadable = new MyReadable();
myReadable.on("data", () => console.log(performance.now(), 'on("data")'));
// ✅ _destroy 完成後，會觸發 on("close")
myReadable.on("close", () => console.log(performance.now(), 'on("close")'));
```

執行順序

```ts
225.960292 on("data")
327.929167 on("data")
428.927167 on("data")
529.897292 on("data")
631.481875 on("data")
733.411125 _destroy
834.911792 on("close")
```

## 小結

面向開發者（實作 Readable）的 methods

| method        | required to implement | description                                    |
| ------------- | --------------------- | ---------------------------------------------- |
| `constructor` | No                    | place synchronous code here                    |
| `_construct`  | No                    | place asynchronous code here                   |
| `_read`       | Yes                   | handle fetch data from the underlying resource |
| `_destroy`    | No                    | release underlying resources                   |
| `push`        | No                    | should only be invoked inside `_read`          |

![readable-flowing](../../static/img/readable-flowing.svg)

![readable-boolean](../../static/img/readable-boolean.svg)

## 參考資料

- https://nodejs.org/api/stream.html
