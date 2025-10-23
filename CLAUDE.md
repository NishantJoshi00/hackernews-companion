# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HackerNews Companion - A TypeScript application built with Bun runtime. This is an early-stage project with strict type safety enforced throughout.

## Runtime & Build System

**This project uses Bun, not Node.js.** All commands must be run with `bun`:

```bash
bun run dev          # Development with watch mode
bun run build        # Build for production (outputs to dist/)
bun run start        # Run the built application
bun run type-check   # Type check without emitting files
bun run lint         # Lint TypeScript files
bun run format       # Format code with Prettier
bun run format:check # Check formatting without writing
```

To run TypeScript files directly: `bun run <file>.ts`

## TypeScript Configuration

This project enforces **maximum type strictness**. Key compiler options that affect development:

- `noUncheckedIndexedAccess: true` - Array/object index access returns `T | undefined`, requiring explicit undefined checks
- `exactOptionalPropertyTypes: true` - Optional properties cannot be explicitly set to `undefined`
- `noPropertyAccessFromIndexSignature: true` - Must use bracket notation for index signature access
- `noImplicitReturns: true` - All code paths in functions must return a value
- `explicit-function-return-type` (ESLint rule) - All functions must have explicit return type annotations

## Linting & Code Quality

ESLint is configured with strict TypeScript rules:

- `@typescript-eslint/strict` - Strictest TypeScript ruleset
- `@typescript-eslint/no-explicit-any` - No `any` types allowed
- `@typescript-eslint/strict-boolean-expressions` - Booleans must be actual booleans, not truthy/falsy
- `@typescript-eslint/no-floating-promises` - All promises must be awaited or handled
- `@typescript-eslint/explicit-function-return-type` - Return types required on all functions

Prefix unused parameters with underscore: `_unusedParam`

## Project Structure

```
src/          # All TypeScript source code
dist/         # Build output (gitignored)
```

The entry point is `src/index.ts`.
