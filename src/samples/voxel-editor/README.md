# Voxel Editor Sample

A simple demonstration of the Cryos graphics library showing how to render basic 3D models with multiple viewports.

## Features

- Dual viewports with different camera angles
- 3D circle models rendered in different planes (XY, XZ, YZ)
- Mouse picking/interaction
- Coordinate axis visualization
- Color-coded planes (Yellow, Magenta, Cyan)

## File Structure

This sample uses a **simplified file structure** with clear separation of concerns:

- `voxel-editor-service.ts` - Store schema and service creation (~30 lines)
- `voxel-editor-application.ts` - UI component with two viewports (~60 lines)
- `transactions/` - Transaction functions
  - `create-test-models.ts` - Creates the demo scene
  - `index.ts` - Transaction exports

### Design Philosophy

This structure follows the same simplified pattern as the `forest` sample:
- **Service** = Store schema + service setup using `GameService.create()`
- **Application** = UI component
- **Transactions** = Business logic operations

This makes it easy for new learners to understand the framework architecture without navigating through many directories.

## Running

The sample is automatically registered in the sample container. Run the dev server and select "Voxel Editor" from the samples list:

```bash
pnpm run dev
```

Then navigate to the local server URL and click on "Voxel Editor".

## What it Demonstrates

1. **ECS Architecture** - Entity Component System with store schema
2. **Graphics Database** - How to create and configure 3D models
3. **Transactions** - Creating entities and components
4. **WebGPU Integration** - Async device initialization
5. **System Scheduler** - Automatic update loop using GameService
6. **Multiple Viewports** - Same scene from different camera angles
7. **Mouse Picking** - Detecting which entity is under the cursor
8. **GameService Pattern** - Simplified service creation using `GameService.create()`

## Comparison with Forest Sample

Both samples now use the same simplified pattern:
- **voxel-editor**: Shows basic 3D rendering with multiple viewports
- **forest**: Shows advanced rendering with 1000 procedural trees and instancing

Choose this sample to learn the basics, then check out the forest sample to see what's possible with the framework.




