## Unicode

```js
"\u0061"; // a
"\u0061"; // a
`\u0061`; // a

function a() {}
a();
```

```js
"\u{61}"; // a
"\u{000000000061}"; // a
`\u{0061}`; // a

function a() {}
a(); // correctly calls the function

𱍊 = 123; // unicode character "𱍊" is allowed as a variable
```

## Octal

```js
"\141"; // a
"\8"; // number outside the octal range so 8 is returned
```

## Eval and escapesEval

```js
eval("\x61=123"); // a = 123
```

```js
eval("\\u0061=123");
// \u0061 = 123
// a = 123
```
