# Feature PRD: Load/Save Voxel Models

## Problem Statement

**Why are we building this?**

Currently, the Cryos voxel editor stores all model data only in memory. When developers refresh the browser or close the tab, all their voxel modeling work is permanently lost. This makes the editor unusable for any real game development workflow, as users cannot:
- Preserve their work between sessions
- Build a library of reusable voxel assets
- Share models with team members
- Iterate on designs over time

This is a **critical blocker** preventing the voxel editor from being useful for actual game development.

## Solution

**What are we building?**

A complete load/save system that allows developers to persist voxel models to the local filesystem using the Browser File System Access API. The system will:
- Convert ECS Model entities to compact `Volume<MaterialIndex>` format
- Serialize/deserialize to JSON (.vox.json files)
- Provide intuitive UI controls (toolbar buttons and menu)
- Track unsaved changes and warn users before data loss
- Remember current file for quick saves

## User Journey

### Primary Persona
**Game Developer** - Using Cryos voxel editor to create 3D voxel models for game assets

---

### Journey Step 1: Creating and Saving a New Model

**Scenario:** Developer creates their first voxel model

1. Developer opens voxel editor (starts with empty/default model)
2. Uses editor tools to create voxel model:
   - Selects materials from palette
   - Extrudes voxels to build shapes
   - Paints different materials
3. When satisfied with initial version, clicks **Save** button or presses **Ctrl+S**
4. Browser prompts: "Choose where to save your voxel model"
5. Developer navigates to project folder, names file `spaceship.vox.json`
6. System converts Model entities → Volume<MaterialIndex> → JSON format
7. File saved to disk
8. Editor title bar updates to show: `Cryos Voxel Editor - spaceship.vox.json`
9. Status message: "✓ Model saved successfully"

**Success criteria:** File exists on disk, can be opened in text editor to verify JSON structure

---

### Journey Step 2: Loading an Existing Model

**Scenario:** Developer returns next day to continue work

1. Opens voxel editor (starts with empty model)
2. Clicks **Open** button or presses **Ctrl+O**
3. Browser file picker opens
4. Navigates to and selects `spaceship.vox.json`
5. System reads JSON → Volume<MaterialIndex> → Model entities
6. Previous model cleared, loaded model displayed in editor
7. Title bar shows: `Cryos Voxel Editor - spaceship.vox.json`
8. Can immediately continue editing

**Success criteria:** Model appears exactly as it was when saved

---

### Journey Step 3: Making Changes and Quick Save

**Scenario:** Developer modifies existing model

1. Has `spaceship.vox.json` loaded (from Journey Step 2)
2. Makes modifications (add wings, change colors, etc.)
3. Title bar updates to show unsaved state: `Cryos Voxel Editor - spaceship.vox.json *`
4. Presses **Ctrl+S** (quick save)
5. No file picker - saves directly to current file
6. Title bar updates: `Cryos Voxel Editor - spaceship.vox.json` (no asterisk)
7. Status: "✓ Model saved"

**Success criteria:** Changes persisted without additional file dialog

---

### Journey Step 4: Unsaved Changes Warning

**Scenario:** Developer tries to close with unsaved work

1. Has unsaved changes (title shows asterisk)
2. Attempts to:
   - Close browser tab, OR
   - Refresh page, OR
   - Click "Open" to load different file, OR
   - Click "New" to start fresh
3. Dialog appears: "⚠️ Unsaved Changes - Save before closing?"
4. Three buttons:
   - **Save** - Opens save dialog (if new file) or saves to current file
   - **Don't Save** - Proceeds with action, losing changes
   - **Cancel** - Returns to editor, keeps working

**Success criteria:** No accidental data loss

---

### Journey Step 5: Starting a New Model

**Scenario:** Developer wants to start from scratch

1. Currently editing a model (may have changes)
2. Clicks **New** button
3. If unsaved changes exist → Show warning dialog (Journey Step 4)
4. If no changes (or user chose "Don't Save"):
   - Clears all Model entities
   - Resets to default model size (16×16×16)
   - Clears current file reference
   - Title bar: `Cryos Voxel Editor - Untitled`
5. Ready for new creation

**Success criteria:** Clean slate, no leftover voxels

---

## Functional Requirements

### Core Serialization

#### FR-1: Convert Models to Volume
**Given** a VoxelEditorStore with Model entities at various 3D positions with MaterialIndex values,  
**Should** produce a Volume<MaterialIndex> with:
- size: Vec3 encompassing all model voxels (tightly packed)
- data: TypedBuffer containing MaterialIndex for each voxel position
- Empty positions filled with MaterialIndex 0 (air)

#### FR-2: Convert Volume to Models
**Given** a Volume<MaterialIndex> with non-air voxels,  
**Should** create Model entities in the store with:
- position: Vec3 derived from volume coordinates
- material: MaterialIndex from volume data
- All required Model archetype components (pickable, color, scale, rotation, etc.)

#### FR-3: Serialize Volume to JSON
**Given** a Volume<MaterialIndex> and model size,  
**Should** create object `{ version: "1.0", size, data: volume }`  
**Should** use `serializeToJSON()` from @adobe/data to produce JSON string  
**Should** result in JSON string with base64-encoded binary data ready to write to file

#### FR-4: Deserialize JSON to Volume
**Given** JSON string from .vox.json file,  
**Should** use `deserializeFromJSON<VoxelModelData>()` from @adobe/data  
**Should** extract version, size, and Volume<MaterialIndex> from result  
**Should** validate version compatibility (reject if version > "1.0")  
**Should** reconstruct Volume with correct TypedBuffer data

---

### File System Operations

#### FR-5: Save New File
**Given** user triggers save action with no current file,  
**Should** prompt for file location using File System Access API  
**Should** default file extension to `.vox.json`  
**Should** write serialized JSON to chosen location  
**Should** remember file handle for future quick saves

#### FR-6: Quick Save to Current File
**Given** user triggers save action with existing current file,  
**Should** write directly to current file without prompting  
**Should** not show file picker dialog

#### FR-7: Load from File System
**Given** user selects a .vox.json file,  
**Should** read file contents  
**Should** validate JSON structure  
**Should** clear existing model before loading  
**Should** set loaded file as current file  
**Should** clear dirty state

#### FR-8: Handle File Errors
**Given** file read/write operation fails (permissions, disk full, invalid JSON),  
**Should** display user-friendly error message  
**Should** not corrupt existing editor state  
**Should** log detailed error to console for debugging

---

### State Management

#### FR-9: Track Dirty State
**Given** user modifies model after save/load (adds, removes, or changes voxels),  
**Should** set dirty flag to true  
**Should** update UI to show unsaved indicator

#### FR-10: Clear Dirty State
**Given** successful save or load operation,  
**Should** set dirty flag to false  
**Should** remove unsaved indicator from UI

#### FR-11: Unsaved Changes Warning
**Given** dirty flag is true AND user attempts destructive action (close, refresh, load, new),  
**Should** show confirmation dialog with three options: Save / Don't Save / Cancel  
**Should** prevent data loss unless user explicitly chooses "Don't Save"

---

### User Interface

#### FR-12: File Menu
**Should** provide toolbar/menu with buttons:
- New (⌘N / Ctrl+N)
- Open (⌘O / Ctrl+O)  
- Save (⌘S / Ctrl+S)

#### FR-13: Title Bar Display
**Should** show in title bar:
- Format: `Cryos Voxel Editor - {filename}`
- When no file: `Cryos Voxel Editor - Untitled`
- When dirty: `Cryos Voxel Editor - {filename} *` (asterisk indicates unsaved)

#### FR-14: Status Messages
**Should** display temporary status messages for:
- Save success: "✓ Model saved successfully"
- Load success: "✓ Model loaded: {filename}"
- Errors: "⚠️ {error message}"

---

## Technical Architecture

### Data Flow

```
┌─────────────┐  serialize   ┌────────────────────┐  toJSON   ┌──────────┐
│   Model     │ ──────────> │ Volume<Material    │ ────────> │  .vox    │
│  Entities   │             │      Index>        │           │  .json   │
│   (ECS)     │ <────────── │                    │ <──────── │  File    │
└─────────────┘ deserialize  └────────────────────┘ fromJSON  └──────────┘
```

### File Format Specification

The file format uses `serializeToJSON` / `deserializeFromJSON` from `@adobe/data/functions/serialization`:

```typescript
// What we serialize
type VoxelModelData = {
  version: string;           // "1.0" - for future compatibility
  size: [number, number, number];  // [width, height, depth]
  data: Volume<MaterialIndex>;  // Contains TypedBuffer
}

// What gets written to .vox.json file
type SerializedVoxelModel = {
  json: string;              // JSON-serializable parts (nested, stringified)
  lengths: number[];         // Byte lengths of each binary chunk
  binary: string;            // Base64-encoded concatenated binary data
}
```

**Implementation:**
```typescript
// Save
const modelData = { version: "1.0", size, data: volume };
const jsonString = serializeToJSON(modelData);
// Write jsonString to file

// Load  
const jsonString = readFileContents();
const modelData = deserializeFromJSON<VoxelModelData>(jsonString);
```

The @adobe/data serialization system automatically handles TypedBuffer → base64 conversion, making the file format both human-inspectable (JSON) and efficient (binary data encoded).

### Module Structure

```
src/samples/voxel-editor/
  functions/
    models-to-volume.ts          # FR-1: Convert entities to Volume
    volume-to-models.ts          # FR-2: Convert Volume to entities
    serialize-voxel-model.ts     # FR-3: Volume to JSON
    deserialize-voxel-model.ts   # FR-4: JSON to Volume
  transactions/
    save-model.ts                # FR-5, FR-6: Save operations
    load-model.ts                # FR-7: Load operations
    new-model.ts                 # FR-5: New model creation
  elements/
    voxel-editor-file-menu.ts    # FR-12: UI for file operations
  voxel-editor-store.ts          # Add dirty state tracking
```

---

## Success Metrics

- ✅ User can create model, save it, close browser, reopen, load it - model is identical
- ✅ File size is reasonable (compact Volume format)
- ✅ No data loss scenarios (all destructive actions have warnings)
- ✅ File operations complete in <100ms for typical models (16³ to 64³)
- ✅ Error messages are clear and actionable

---

## Future Enhancements (Out of Scope)

- Auto-save every N seconds
- File browser/recent files list  
- Export to other formats (.vox, .png slices, etc.)
- Cloud storage integration
- Collaborative editing
- Undo/redo across sessions (save undo history)
- Model thumbnails
- Compression for large models

---

## Dependencies

- ✅ Browser File System Access API (requires HTTPS or localhost)
- ✅ `serializeToJSON` / `deserializeFromJSON` from `@adobe/data/functions/serialization`
- ✅ `registerTypedBufferCodecs()` from `@adobe/data/typed-buffer` (must be called at startup)
- ✅ Existing `Volume<T>` type and utilities
- ✅ Existing `Model` archetype and transaction infrastructure
- ✅ MaterialIndex type and schema

---

## Timeline Estimate

**Total: ~2-4 hours of implementation**

1. Core serialization functions (FR-1 through FR-4): 1 hour
2. File system operations (FR-5 through FR-8): 1 hour  
3. State management and dirty tracking (FR-9 through FR-11): 30 min
4. UI components and integration (FR-12 through FR-14): 1-2 hours
5. Testing and polish: 30 min

---

## Open Questions

1. ~~Should we validate MaterialIndex values against the materials registry?~~ → Start simple, validate later
2. ~~What happens if model size exceeds original modelSize resource?~~ → Adjust modelSize on load (already have expandModelSize)
3. ~~Should we store material palette or other metadata?~~ → Start with just volume data

