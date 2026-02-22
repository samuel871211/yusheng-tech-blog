---
title: JavaScript 重修就好
description: new, this, bind, call, arguments, apply, __proto__, prototype, window, Window
last_update:
  date: "2026-02-21T08:00:00+08:00"
---

## new, call, this

```js
function Product(name, price) {
  this.name = name;
  this.price = price;
}

function Food(name, price) {
  // ✅ 讓 Food 繼承 Product 所有的 properties
  Product.call(this, name, price);
  this.category = "food";
}

const cheese = new Food("cheese", 5);
console.log(cheese.name); // cheese
```

❌ 沒使用 `new` => `this` 會指向全域 `window`（瀏覽器環境），造成全域汙染

```js
function Product(name, price) {
  this.name = name;
  this.price = price;
}

function Food(name, price) {
  // ✅ 讓 Food 繼承 Product 所有的 properties
  Product.call(this, name, price);
  this.category = "food";
}

const cheese = Food("cheese", 5);
console.log(cheese); // undefined
console.log(window.name); // cheese
console.log(window.price); // 5
console.log(window.category); // food
```

✅ function 內部可實作防呆（Node.js 原始碼會用到這個技巧）

```js
function Food(name, price) {
  if (!(this instanceof Food)) return new Food(name, price);

  // ✅ 讓 Food 繼承 Product 所有的 properties
  Product.call(this, name, price);
  this.category = "food";
}

const cheese = Food("cheese", 5);
console.log(cheese.name); // cheese
```

## 瀏覽器環境的 window, Window

```js
console.log(window instanceof Window); // true
console.log(window.constructor === Window); // true
console.log(this === window); // true
```
