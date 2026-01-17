# @repo/typescript-config

Shared TypeScript configurations for the Elysia monorepo.

## Available Configs

### `base.json`
Base configuration with common settings for all TypeScript projects.

### `react.json`
Configuration for React/Vite projects. Extends `base.json` with:
- React JSX support
- DOM type definitions
- Vite-specific settings
- Bundler module resolution

### `node.json`
Configuration for Node.js/Bun backend projects. Extends `base.json` with:
- Bun type definitions
- Node module resolution
- CommonJS/ESM interop

## Usage

In your `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/react.json",
  "include": ["src"]
}
```

Or for backend:

```json
{
  "extends": "@repo/typescript-config/node.json",
  "include": ["src"]
}
```

## Features

All configurations include:
- Strict type checking enabled
- Modern ES2022+ target
- Source maps and declarations
- Consistent casing enforcement
- No unused locals/parameters
- And more...
