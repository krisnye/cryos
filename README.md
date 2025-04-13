# Games Monorepo

A collection of games built with TypeScript using functional programming principles.

## Tech Stack

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Build Tool**: Vite
- **Framework**: Lit
- **Graphics**: WebGPU
- **Testing**: Vitest

## Project Structure

The project is organized into several key directories:
- `src/` - Source code for the games
- `models/` - Shared models and types
- `ai/` - AI-related components

## Available Games

- Voxel Editor
- Pong
- Demo

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- A browser that supports WebGPU (like Chrome Canary with WebGPU flags enabled)

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start development server for a specific game:
   ```bash
   # For Voxel Editor
   pnpm dev:voxel-editor

   # For Pong
   pnpm dev:pong

   # For Demo
   pnpm dev:demo
   ```

3. For development with type checking and tests:
   ```bash
   pnpm dev
   ```

## Building

To build all games:
```bash
pnpm build
```

To build a specific game:
```bash
pnpm build:voxel-editor
# or
pnpm build:pong
# or
pnpm build:demo
```

## Development

- `pnpm test` - Run tests
- `pnpm lint` - Run linter
- `pnpm type-check` - Run type checker

# Performance

## Tuple Arrays

For reading/writing tuples from linear TypedArrays, we found:

### Small Tuples (≤16 elements)
- Plain array operations are consistently faster
- For size 2 tuples:
  - Plain array read/write is ~8-9x faster than subarray
- Performance advantage gradually decreases as size increases
- Most common tuple sizes (vec2, vec3, vec4, mat4) all fall in this range

### Medium Tuples (32-64 elements)
- Crossover point where subarray becomes competitive
- At 32 elements:
  - Plain array write still slightly faster
  - Subarray read becomes competitive
- At 64 elements:
  - Subarray read becomes fastest
  - But subarray write still slower than plain array write

### Large Tuples (≥256 elements)
- Subarray read becomes dramatically faster
- At 4096 elements:
  - Subarray read is ~160x faster than plain array read
  - But subarray write remains slower

### Implementation Choice
Since our primary use case is small tuples (vec2, vec3, vec4, mat4), we use plain arrays for all tuple operations as they provide the best performance in this range.
