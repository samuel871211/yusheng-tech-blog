---
title: "C and C++ basics"
description: "C and C++ basics"
last_update:
  date: "2026-05-14T08:00:00+08:00"
---

## 名詞解釋

| Term                      | Description                    |
| ------------------------- | ------------------------------ |
| Visual Studio Installer   |                                |
| Visual Studio Build Tools |                                |
| Makefile                  |                                |
| make                      |                                |
| CMake                     |                                |
| xcode-select              | Mac prebuilt Command Line Tool |
| Clang                     | Mac default Compiler Frontend  |

## 副檔名

| File Extension | Description | Same As |
| -------------- | ----------- | ------- |
| .h             | header file | .d.ts   |
| .c             | C           | -       |
| .cc            | C++         | -       |

## Preprocessor Directives

| Syntax  | Description    |
| ------- | -------------- |
| #ifdef  | if defined     |
| #ifndef | if not defined |
| #endif  | end if         |
| #define | define         |
| #if     | if             |

## C Data Types

| Format Specifier | Data Type | Size         |
| :--------------- | :-------- | :----------- |
| %d or %i         | int       | 2 or 4 bytes |
| %f or %F         | float     | 4 bytes      |
| %lf              | double    | 8 bytes      |
| %c               | char      | 1 byte       |
| %s               | string    | -            |

## C Extended Types

| Format Specifier | Data Type              | Size               |
| :--------------- | :--------------------- | :----------------- |
| %hd              | short int              | 2 bytes            |
| %u               | unsigned int           | 2 or 4 bytes       |
| %ld              | long int               | 4 or 8 bytes       |
| %lld             | long long int          | 8 bytes            |
| %lu              | unsigned long int      | 4 or 8 bytes       |
| %llu             | unsigned long long int | 8 bytes            |
| %Lf              | long double            | 8, 12, or 16 bytes |

## C Type Conversion

```c
int num1 = 5;
int num2 = 2;
float sum = (float) num1 / num2;

printf("%f", sum); // 2.500000
```

## C Arrays

```c
int myNumbers[] = {25, 50, 75, 100};
printf("%lu", sizeof(myNumbers)); // 20
```

## C Memory Address

```c
int myAge = 43;
printf("%p", &myAge); // 0x16f4c6c2c
```

## C Pointers

```c
int myAge = 43;    // Variable declaration
int *ptr = &myAge; // Pointer declaration

// Reference: Output the memory address of myAge with the pointer (0x7ffe5367e044)
printf("%p\n", ptr);

// Dereference: Output the value of myAge with the pointer (43)
printf("%d\n", *ptr);
```

<!-- ## Files

https://www.w3schools.com/c/c_files.php -->

<!-- ## Memory Management

https://www.w3schools.com/c/c_memory_management.php -->
