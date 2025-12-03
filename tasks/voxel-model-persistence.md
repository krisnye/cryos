# Voxel Model Persistence Epic

**Status**: ✅ COMPLETED (2024-11-15)
**Goal**: Enable saving and loading voxel models to local filesystem

## Overview

Developers cannot preserve their voxel modeling work between browser sessions, making the editor unusable for real game development. This epic adds complete file persistence using the Browser File System Access API and @adobe/data serialization, allowing developers to save models as .vox.json files, load them back, and track unsaved changes to prevent data loss.

---

## Models to Volume Conversion

Convert ECS Model entities into compact Volume<MaterialIndex> format for serialization.

**Requirements**:
- Given store with Model entities at scattered positions, should determine tight bounding box encompassing all voxels
- Given bounding box dimensions, should create Volume<MaterialIndex> with appropriate size
- Given Model entity with position and material, should write MaterialIndex to correct volume coordinates
- Given empty volume positions, should fill with MaterialIndex 0 (air)
- Given volume coordinates, should correctly calculate flat array index using x + width * (y + z * height)

---

## Volume to Models Conversion

Reconstruct Model entities from Volume<MaterialIndex> data.

**Requirements**:
- Given Volume<MaterialIndex> with non-zero material indices, should create Model entity for each voxel
- Given volume index and size, should calculate correct 3D position for Model entity
- Given MaterialIndex value, should look up corresponding material and set entity color
- Given MaterialIndex 0 (air), should skip entity creation
- Given material index, should create Model archetype with all required components (pickable, color, scale, rotation)

---

## Volume Serialization

Serialize Volume<MaterialIndex> to JSON string using @adobe/data codec system.

**Requirements**:
- Given Volume<MaterialIndex> and model size Vec3, should create VoxelModelData object with version "1.0"
- Given VoxelModelData object, should use serializeToJSON to produce JSON string
- Given serialized output, should contain base64-encoded binary data for TypedBuffer
- Given TypedBuffer codec not registered, should fail gracefully with clear error message

---

## Volume Deserialization

Deserialize JSON string back to Volume<MaterialIndex>.

**Requirements**:
- Given valid JSON string from file, should use deserializeFromJSON to reconstruct VoxelModelData
- Given deserialized data, should extract version, size, and Volume<MaterialIndex>
- Given version greater than "1.0", should reject with incompatible version error
- Given corrupted JSON, should catch error and return user-friendly message
- Given missing required fields, should validate and report specific missing field

---

## Save Model Transaction

Implement transaction to save current voxel model to file.

**Requirements**:
- Given store with Model entities, should convert to Volume using models-to-volume
- Given Volume and modelSize resource, should serialize using serializeToJSON
- Given no current file handle, should prompt user with File System Access API picker
- Given current file handle exists, should write directly without prompting
- Given file write success, should clear dirty flag and update current filename
- Given file write failure, should preserve dirty flag and show error to user

---

## Load Model Transaction

Implement transaction to load voxel model from file.

**Requirements**:
- Given user selects file via picker, should read file contents as text
- Given file contents, should deserialize to VoxelModelData
- Given deserialized volume, should clear all existing Model entities before loading
- Given deserialized volume, should convert to Model entities using volume-to-models
- Given deserialized size, should update modelSize resource
- Given successful load, should set current file handle and clear dirty flag
- Given load failure at any step, should preserve existing model and show error

---

## New Model Transaction

Clear current model and start fresh.

**Requirements**:
- Given dirty flag is true, should trigger unsaved changes warning before proceeding
- Given user confirms or no unsaved changes, should delete all Model entities
- Given reset in progress, should set modelSize to default [16, 16, 16]
- Given reset complete, should clear current file handle and dirty flag
- Given reset complete, should trigger recreation of walls via setModelSize

---

## Dirty State Tracking

Track when model has unsaved changes.

**Requirements**:
- Given any Model entity created/modified/deleted, should set dirty flag to true
- Given successful save or load operation, should set dirty flag to false
- Given dirty flag changes, should emit event for UI update

---

## File System Access API Integration

Provide browser file system access functions.

**Requirements**:
- Given save without file handle, should call showSaveFilePicker with .vox.json extension
- Given file handle returned, should create writable stream and write content
- Given load request, should call showOpenFilePicker with .vox.json filter
- Given file handle, should get File object and read as text
- Given user cancels picker, should return null without error
- Given permission denied, should show clear error message to user

---

## Unsaved Changes Warning Dialog

Prevent accidental data loss with confirmation dialogs.

**Requirements**:
- Given dirty flag true and destructive action (new/load/close), should show confirmation dialog
- Given dialog, should offer three buttons: Save / Don't Save / Cancel
- Given Save clicked, should trigger save flow then proceed with action
- Given Don't Save clicked, should proceed with action losing changes
- Given Cancel clicked, should abort action and return to editor
- Given beforeunload browser event and dirty flag true, should show browser's native confirmation

---

## File Menu UI Component

Create toolbar/menu for file operations.

**Requirements**:
- Given voxel editor UI, should render file menu with New/Open/Save buttons
- Given New button clicked, should invoke new-model transaction
- Given Open button clicked, should invoke load-model transaction
- Given Save button clicked, should invoke save-model transaction
- Given keyboard shortcut Ctrl+N (Cmd+N), should trigger New
- Given keyboard shortcut Ctrl+O (Cmd+O), should trigger Open
- Given keyboard shortcut Ctrl+S (Cmd+S), should trigger Save

---

## Title Bar Display

Show current filename and unsaved state in title bar.

**Requirements**:
- Given no current file, should display "Cryos Voxel Editor - Untitled"
- Given current file "model.vox.json" and not dirty, should display "Cryos Voxel Editor - model.vox.json"
- Given current file and dirty flag true, should display "Cryos Voxel Editor - model.vox.json *"
- Given filename changes, should update title bar reactively

---

## Status Messages

Display feedback for file operations.

**Requirements**:
- Given successful save, should show temporary message "✓ Model saved successfully"
- Given successful load, should show temporary message "✓ Model loaded: {filename}"
- Given any error, should show message "⚠️ {error description}"
- Given status message shown, should auto-dismiss after 3 seconds
- Given multiple messages queued, should show most recent and dismiss previous

