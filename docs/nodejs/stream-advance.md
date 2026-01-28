---
title: Node.js stream 進階：objectMode, pipe, unshift
description: Node.js stream 進階：ObjectMode, pipe, unshift
last_update:
  date: "2026-01-28T08:00:00+08:00"
---

## encode & decode

我們之前的範例都是讀寫 string，並且沒有指定任何 `encoding` 或是 `decodeStrings`，所以從 internal buffer 取出來的資料都是 `Buffer`

```ts
readable.push("123");
const chunk = readable.read(); // chunk: <Buffer 31 32 33>

writable.write("123");
writable._write(chunk); // chunk: <Buffer 31 32 33>
```

若希望 `writable._write(chunk)` 可以保留原始編碼，可以在 create instance 的傳入 `decodeStrings: false`

```ts
class MyWritable extends Writable {
  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    console.log(chunk); // 123
    callback();
  }
}

const myWritable = new MyWritable({ decodeStrings: false });
myWritable.write("123");
```

若希望 `readable.read()` 讀出來的 chunk 可以轉換成 utf8，可以在 create instance 的傳入 `encoding: "utf8"`

```ts
class MyReadable extends Readable {
  _read(size: number): void {
    this.push("123");
    this.push(null);
  }
}

const myReadable = new MyReadable({ encoding: "utf8" });
myReadable.on("readable", () => {
  const chunk = myReadable.read();
  console.log(chunk); // 123
});
```

## objectMode

若想要針對 string, Buffer, TypedArray, DataView 以外的資料讀寫，則需要用到 objectMode

假設我有一個 10GB 的 json 檔，存了 Array of Objects

```json
[
  { "name": "kelly", "age": 24 },
  { "name": "alex", "age": 30 }
]
```

若希望 `writable._write(chunk)` 的 chunk 都是一個完整的 Object，這個情況就很適合用 objectMode

```ts
class MyWritable extends Writable {
  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    console.log(chunk);
    callback();
  }
}

const myWritable = new MyWritable({ objectMode: true });
myWritable.writableObjectMode; // true
myWritable.write({ name: "kelly", age: 24 });
myWritable.write({ name: "alex", age: 30 });

// Prints
// { name: 'kelly', age: 24 }
// { name: 'alex', age: 30 }
```

若希望 `readable.read()` 讀出來的 chunk 都是一個完整的 Object，這個情況就很適合用 objectMode

```ts
class MyReadable extends Readable {
  _read(size: number): void {
    this.push({ name: "kelly", age: 24 });
    this.push({ name: "alex", age: 30 });
    this.push(null);
  }
}

const myReadable = new MyReadable({ objectMode: true });
myReadable.readableObjectMode; // true
myReadable.on("readable", () => {
  const kelly = myReadable.read();
  const alex = myReadable.read();
});
```

在 objectMode 的情況，highWaterMark 的單位就會從 bytes 變成 Object 的數量

Writable

```ts
class MyWritable extends Writable {
  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    setTimeout(callback, 100);
  }
}

const myWritable = new MyWritable({ objectMode: true, highWaterMark: 2 });
const canContinue1 = myWritable.write({ name: "kelly", age: 24 });
const canContinue2 = myWritable.write({ name: "alex", age: 30 });
console.log({ canContinue1 }); // true
console.log({ canContinue2 }); // false
```

Readable

```ts
class MyReadable extends Readable {
  _read(size: number): void {
    const canContinue1 = this.push({ name: "kelly", age: 24 });
    const canContinue2 = this.push({ name: "alex", age: 30 });
    this.push(null);
    console.log({ canContinue1 }); // true
    console.log({ canContinue2 }); // false
  }
}

const myReadable = new MyReadable({ objectMode: true, highWaterMark: 2 });
myReadable.on("readable", () => {
  const kelly = myReadable.read();
  const alex = myReadable.read();
});
```

另外，objectMode 跟上面介紹的 [encode / decode](#encode--decode) 是互斥的參數，基本上只能擇一使用

Writable 若在 `objectMode: true` 的情境，則 decodeStrings, defaultEncoding 基本上就無效

```ts
class MyWritable extends Writable {
  _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    console.log(chunk); // { "name": "kelly", "age": 24 }
    callback();
  }
}

const myWritable = new MyWritable({
  objectMode: true,
  decodeStrings: true,
  defaultEncoding: "utf8",
});
myWritable.write({ name: "kelly", age: 24 });
```

Readable 若在 `objectMode: true` 的情境，同時設定 encoding 會導致 `read()` 噴錯

```ts
class MyReadable extends Readable {
  _read(size: number): void {
    this.push({ name: "kelly", age: 24 });
    this.push(null);
  }
}

const myReadable = new MyReadable({ objectMode: true, encoding: "utf8" });
myReadable.readableObjectMode;
myReadable.on("readable", () => {
  myReadable.read(); // TypeError: The "buf" argument must be an instance of Buffer, TypedArray, or DataView. Received an instance of Object
});
```

## readable.pipe

pipe 的中文是管子，在這邊的意思是把 readable 資料源 (source) "透過水管接到" writable 目的地 (destination)

聽起來很抽象，但實際上各種 HTTP 中間層（Web Server, CDN, Proxy）就是用這個概念在轉發 HTTP Request / Response

若以 "HTTP 中間層" 當作第一人稱的話

```mermaid
sequenceDiagram
  participant client
  participant middle as HTTP 中間層<br/>(We are here)
  participant server

  client ->> middle: Receive HTTP Request<br/>(stream.Readable)
  middle ->> server: 將 HTTP Request 轉發出去<br/>Readable.pipe(res)
  server ->> middle: Receive HTTP Response<br/>(stream.Readable)
  middle ->> client: 將 HTTP Request 轉傳回去<br/>Readable.pipe(res)
```

## unshift

## 參考資料

- https://nodejs.org/api/stream.html
- https://nodejs.org/api/stream.html#new-streamreadableoptions
- https://nodejs.org/api/stream.html#new-streamwritableoptions
