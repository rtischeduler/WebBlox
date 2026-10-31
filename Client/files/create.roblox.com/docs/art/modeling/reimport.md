---
title: "Reimport"
url: /docs/en-us/art/modeling/reimport
last_updated: 2026-10-30T19:55:36Z
description: "Reimport allows you to update an existing custom mesh and textures without generating a new instance."
---

# Reimport

**Reimport** allows you to update existing custom models and their textures from an external 3D file. Unlike regular [import](/docs/en-us/studio/importer.md#import-files), which creates brand new instances, the reimport function updates existing objects non-destructively to help support the iterative nature of 3D development.

Along with asset updates, reimport remembers the file and settings used to import the original asset. This means you can easily update an imported asset with a single click or hotkey without going through all the initial import settings. This memory persists across Studio sessions.

## Supported instances

Reimport supports the following entry points in the Explorer. Reimport also supports [packages](/docs/en-us/projects/assets/packages.md), allowing you to reimport batches of asset instances at once.

- `Class.Model` - The reimport feature scans the container, updating any changed `Class.MeshPart` and `Class.SurfaceAppearance` instances and adding newly created ones, while leaving your existing properties unchanged. Reimport replaces meshes based off of mesh names saved in Studio and the external 3D file (see [MeshPart detection](#meshpart-detection)). It replaces images for PBR textures based off of filenames (see [SurfaceAppearance detection](#surfaceappearance-detection)).
- `Class.SurfaceAppearance` or `Class.Decal` (selected directly) - Reimport uploads all texture maps found in the same folder as the selected file in one operation.

> **Info:** Reimport memory is local to your device. A Reimport ID is stored on the `Class.Model` instance and referenced locally. Keep in mind the following: - Filepaths are never saved in the place file. - Reimport supports different reimport paths on different devices for the same instance. - Reimport supports copy-pasting, saving and loading from `.rbxm`/`.rbxl`, and [Asset Manager](/docs/en-us/projects/assets/manager.md) workflows.
### MeshPart detection

Reimport updates meshes based off of the path and name of the 3D source file, and the path and name of the mesh object in Studio. Reimport only updates the mesh content and transform properties and preserves other Roblox-specific properties, including `Class.MeshPart.CollisionFidelity|CollisionFidelity` and `Class.MeshPart.RenderFidelity|RenderFidelity`. If the incoming mesh has no texture assigned, reimport keeps the existing `Class.MeshPart` texture rather than clearing it.

Reimport relies on matching mesh names between the Studio and the 3D source file:

- If a mesh's `path/name` in the 3D source file **matches** a `Class.MeshPart` `path/name` in Studio, reimport updates the matching `Class.MeshPart`.
- If a mesh's `path/name` in the 3D source file **doesn't exist** as `Class.MeshPart` `path/name` in Studio, reimport creates a new `Class.MeshPart` within the `Class.Model`.
- If a `Class.MeshPart` `path/name` in Studio **doesn't exist** in the 3D source file, reimport does not modify the `Class.MeshPart` in Studio.

#### Known asset cache

Studio uses a **known asset cache** which helps detect duplicate imports in the same Studio session. If an imported or reimported asset is detected, Roblox reuses the existing asset ID instead of creating and uploading a new asset.

If you attempt to reimport a single mesh object, but the 3D file contains a larger number of meshes or textures, Roblox only applies a single asset upload for that object.

#### Duplicates

Reimport detects duplicate meshes, and doesn't reupload matching meshes that are the same in both Studio and the 3D source file. In the scenario where a mesh in Blender is renamed from `Mesh1` to `Mesh2`, reimport creates a new `Class.MeshPart` named `Mesh2` and doesn't apply changes to the original `Mesh1`.

#### Pivot points

In cases where you may want to use the pivot point of the `Class.MeshPart` and not the `Class.Model`, right-click any `Class.MeshPart` with reimport information and select **Reimport** ⟩ **Reimport relative to this**. Doing so triggers a reimport for the entire model using the pivot point of right-clicked `Class.MeshPart` as an anchor instead of the `Class.Model` pivot point. You can use this for models that have custom pivots by reimporting relative to a mesh that has not changed position in the 3D file.

### SurfaceAppearance detection

Reimport can quickly batch update the textures of a model with [PBR textures](/docs/en-us/art/modeling/surface-appearance.md) based off of the naming convention of the image files.

Reimport detects a set of known suffixes for color, metalness, normal, roughness, and emissive maps. You can find the full list of supported suffixes in the following table:

| Map Type | Suffixes | Example |
| --- | --- | --- |
| [Color](/docs/en-us/art/modeling/surface-appearance.md#color-albedo) | `color`, `col`, `diffuse`, `diff`, `albedo`, `alb`, `base` | `Tree_Color.png` |
| [Metalness](/docs/en-us/art/modeling/surface-appearance.md#metalness) | `metal`, `metallic`, `metalness`, `mtl`, `met` | `Tree_Metal.png` |
| [Roughness](/docs/en-us/art/modeling/surface-appearance.md#roughness) | `rough`, `roughness`, `rgh` | `Tree_Rough.png` |
| [Normal](/docs/en-us/art/modeling/surface-appearance.md#normal) | `normal`, `nor`, `nrm`, `nrml`, `norm` | `Tree_Normal.png` |
| [Emissive Mask](/docs/en-us/art/modeling/surface-appearance.md#emissive-mask) | `emissive`, `emission`, `emiss`, `emit`, `glow`, `illum`, `selfillum`, `light`, `luminance`, `emissivemask` | `Tree_Emissive.png` |

When reimporting an asset with a `Class.SurfaceAppearance` selected, a file dialog displays allowing you to select a new image file to use as a PBR texture. Reimport automatically detects other PBR images in the directory based off of naming and maps them to the `Class.SurfaceAppearance` object.

Texture files without a recognized material map suffix are accepted as the color map for `Class.SurfaceAppearance` reimport.

## Reimport models

When you bring an asset into Studio through the [importer](/docs/en-us/studio/importer.md#import-files), reimport automatically stores the filepath, import preset, and upload inventory, so subsequent reimports require no manual setup.

To reimport a configured `Class.Model`:

1. Right-click the `Class.Model` and select **Reimport** ⟩ **Reimport** from the context menu.
  - Alternatively, when selecting the object, use the reimport hotkey `Alt``Shift``R`.
  - A loading indicator appears after selecting reimport. If there are any issues, an error dialog displays with a **Configure Reimport Settings** button that opens the **Configure** dialog.

If a `Class.Model` has no saved reimport configuration (for example, a model imported on a different device or before reimport was available), triggering **Reimport** opens the **Configure** dialog instead of starting the reimport. You can also open it directly at any time through **Reimport** ⟩ **Configure**. In this dialog, you can set the file path, upload target, and import presets.

> **Warning:** Since reimport relies on matching mesh paths/names to update a `Class.Model` from a 3D file, it’s important to maintain unique naming of meshes and their paths in your external 3D tools. In Studio, you should also maintain the naming/tree structure of the `Class.MeshPart` objects within your model in order for reimport to update correctly.