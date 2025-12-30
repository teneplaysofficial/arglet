<div align="center">

# Arglet

_A tiny helper that lets your CLI args lead_

</div>

[![ci](https://github.com/teneplaysofficial/arglet/actions/workflows/ci.yml/badge.svg)](https://github.com/teneplaysofficial/arglet)
[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/teneplaysofficial/arglet/main.svg)](https://results.pre-commit.ci/latest/github/teneplaysofficial/arglet/main)

## Overview

**Arglet** is a small, joyful utility for CLI tools that helps merge configuration from CLI arguments.

**Arglet is designed to be:**

- 🌱 lightweight and dependency-free
- 🧠 predictable and easy to reason about
- ✨ TypeScript-first with great IntelliSense
- 🔧 parser-agnostic

## Installation

```bash
npm install arglet
# or
pnpm add arglet
# or
yarn add arglet
```

## Quick Start

Get a fully-typed CLI configuration in **one line**.

```ts
import arglet from "arglet";

const config = arglet({
  input: "src",
  output: "dist",
  watch: false,
});
```

```bash
node cli.js --input=lib --watch
```

Output:

```ts
{
  input: "lib",
  output: "dist",
  watch: true
}
```

## Usage

### Basic usage

Define a configuration object and let **Arglet** update it using CLI arguments.

```ts
import arglet from "arglet";

const config = arglet({
  name: "sriman",
  age: 23,
  debug: false,
});
```

Run your script:

```bash
node cli.js --name tene --age 25 --debug
```

Result:

```ts
{
  name: "tene",
  age: "25",
  debug: true
}
```

### Boolean flags

Boolean options support implicit enable/disable flags.

```ts
const config = arglet({
  verbose: false,
  cache: true,
});
```

```bash
--verbose        # sets verbose → true
--no-cache       # sets cache → false
```

> ❗ Boolean shortcuts are only allowed for boolean options.
> Using `--flag` or `--no-flag` on non-boolean keys throws an error.

### Explicit values

Non-boolean options **must** receive a value.

```ts
const config = arglet({
  port: "3000",
});
```

```bash
--port 8080
# or
--port=8080
```

### Array values

Provide multiple values using a separator (`,` by default).

```ts
const config = arglet({
  ids: [],
});
```

```bash
--ids=1,2,3
```

Result:

```ts
{
  ids: ["1", "2", "3"];
}
```

You can customize the separator:

```ts
arglet({ ids: [] }, { arraySeparator: "|" });
```

```bash
--ids=1|2|3
```

### Nested configuration (dot notation)

Arglet supports deep configuration using dot paths.

```ts
const config = arglet({
  server: {
    host: "localhost",
    port: "3000",
  },
});
```

```bash
--server.host=0.0.0.0 --server.port=8080
```

### Custom arguments (testing & programmatic use)

You can pass arguments directly (useful for tests).

```ts
const config = arglet({ debug: false }, ["--debug"]);
```

### Debug mode

Enable debug output to see how arguments are parsed and applied.

```ts
arglet({ debug: false }, { debug: true });
```

This logs:

- ignored flags
- inferred boolean behavior
- final resolved configuration

### Error handling

Arglet is intentionally strict.

The following will throw errors:

```bash
--age            # age is not boolean
--no-name        # name is not boolean
--unknown        # key does not exist
```

This keeps CLI behavior **predictable and safe**.

### Example CLI

```ts
import arglet from "arglet";

const config = arglet({
  input: "src",
  output: "dist",
  watch: false,
});

console.log(config);
```

```bash
node cli.js --input=lib --watch
```
