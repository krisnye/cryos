# Forest Sample

A simplified demonstration of the Cryos graphics library showing how to render 3D models with a single viewport.

## Features

- Single viewport with camera controls
- 3D circle models rendered in different planes (XY, XZ, YZ)
- Mouse picking/interaction
- Coordinate axis visualization

## File Structure

This sample uses a **collapsed file structure** with clear separation of concerns:

- `forest-store.ts` - Store schema definition only (~25 lines)
- `forest-service.ts` - Database and service creation (~55 lines)
- `forest-application.ts` - UI component only (~60 lines)
- `transactions/` - Transaction functions
  - `create-test-models.ts` - Creates the demo scene (~35 lines)
  - `index.ts` - Transaction exports

### Comparison with hello-model

The `hello-model` sample uses a **scalable file structure** designed for large applications with multiple maintainers:
- Separate service directories
- Dedicated transaction folders
- Individual action files
- System separation

The `forest` sample collapses these into 3 core files plus a transactions folder while maintaining clear separation:
- **Store** = Data schema
- **Service** = Database and service setup
- **Application** = UI
- **Transactions** = Business logic operations

This structure is easier to navigate than the fully-expanded hello-model structure while still being well-organized for demonstration purposes.

## Running

The sample is automatically registered in the sample container. Run the dev server and select "Forest" from the samples list:

```bash
pnpm run dev
```

Then navigate to the local server URL and click on "Forest".

## What it Demonstrates

1. **ECS Architecture** - Entity Component System with store schema
2. **Graphics Database** - How to create and configure 3D models
3. **Transactions** - Creating entities and components in a single operation
4. **WebGPU Integration** - Async device initialization
5. **System Scheduler** - Automatic update loop for graphics and UI systems
6. **Camera Controls** - Interactive 3D viewport navigation
7. **Mouse Picking** - Detecting which entity is under the cursor

