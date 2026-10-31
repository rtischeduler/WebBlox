---
title: "Explorer window"
url: /docs/en-us/studio/explorer
last_updated: 2026-10-30T19:55:57Z
description: "The Explorer window shows a hierarchical list of every instance inside a game."
---

# Explorer window

The **Explorer** window, accessible from Studio's **Window** menu or **Home** tab toolbar, shows a hierarchical list of every instance inside a game. At the highest level of the hierarchy are the services; `Class.Workspace`, for example, is where visible 3D content such as [parts](/docs/en-us/parts.md) are stored.

![Explorer highlighted in Studio's toolbar.](../assets/studio/general/Toolbar-Explorer.png) ## Parent-child hierarchy

All children of a parent object appear under its branch when expanded. Click the arrow next to a parent branch — or press the `→`/`←` arrow keys when a parent is selected — to expand/collapse only that branch.

![Explorer hierarchy showing Camera, Terrain, and SignModel as children of Workspace; Board and Post as children of SignModel](../assets/studio/explorer/Parent-Child-Hierarchy.png)

![Only the topmost parent expanded with click](../assets/studio/explorer/Branch-Expanded.png)

> **Info:** To expand or collapse **all** branches within a multi‑nested hierarchy, hold `Shift` when clicking the expand/collapse arrow.

To change the parent of one or more children (reparent), simply drag and drop them onto the new parent.

![Dragging one object over another to reparent it](../assets/studio/explorer/Reparent-Object.png) ## Object insertion

While primitive [parts](/docs/en-us/parts.md) can be [inserted](/docs/en-us/parts.md#insert-parts) from the **Home** or **Model** tab toolbars, you can select from a full array of objects by hovering over the intended parent and clicking the ⊕ button (shortcut of `Ctrl``I` on Windows or `⌘``I` on Mac).

![Hovering over Workspace object to reveal insertion button](../assets/studio/explorer/Workspace-Add-Object.png)

You can further customize insertion behavior by clicking the **⋯** button to the right of the search field:

![Additional customization options for insertion workflow](../assets/studio/explorer/Insert-Object-Options.png)

| Option | Description |
| --- | --- |
| **Increment names for new instances** | When enabled, inserted/pasted/duplicated instances of the same type will have numbered names for differentiation. |
| **Expand hierarchy when selecting** | When enabled, inserting/pasting an instance or selecting an object in the [3D viewport](/docs/en-us/studio/overview.md#3d-viewport) will expand the **Explorer** hierarchy to reveal that instance. When disabled, the top‑level parent within the hierarchy will be highlighted, but it won't expand to reveal the selected instance. |

> **Success:** To keep the hierarchy cleaner, services such as `Class.VoiceChatService` are hidden by default. You can show hidden services by right‑clicking in the window and selecting **Show Services…** from the context menu. Similarly, you can hide a visible service by right‑clicking it and selecting **Hide Service in Explorer**.
## Duplicate and paste

Objects can be quickly duplicated into the same branch, while items copied to the clipboard can be pasted into the top‑level `Class.Workspace` or directly into one or more existing parents.

| Action | Windows | Mac | Description |
| --- | --- | --- | --- |
| **Duplicate** | `Ctrl``D` | `⌘``D` | Duplicates the selected objects into the same branch. |
| **Paste** | `Ctrl``V` | `⌘``V` | Pastes the clipboard contents into the top‑level `Class.Workspace` branch. |
| **Paste Into** | `Ctrl``Shift``V` | `⌘``Shift``V` | Pastes the clipboard contents into the selected object(s). Using this action on multiple selected objects is a convenient way to paste the same clipboard items into multiple parents, such as a common `Class.Texture` into several different `Class.Part\|Parts`. |

> **Info:** When pasting 3D objects copied to the clipboard, you can maintain their original `Datatype.CFrame` position by right‑clicking the target parent instance in the hierarchy and selecting **Paste Options** ⟩ **Paste Into At Original Location**.
## Contextual options

Right-clicking on an instance opens the options menu, contextually adjusted for the object type. For example, right‑clicking a `Class.Model` reveals standard options like **Copy** and **Duplicate**, and also options specific to `Class.Model|Models` like **Ungroup**. In contrast, right‑clicking a service like `Class.Lighting` reveals a more concise menu of actions valid for services.

## Folder organization

Like directories/folders on a computer, the `Class.Folder` object is a useful way to organize objects. For instance, if you want to store all environmental audio assets in a logical place, you can create a folder and place multiple `Class.AudioPlayer` objects within it.

![Multiple Sound objects grouped inside a Folder object](../assets/studio/explorer/Folder-Children.png)

You can organize objects into folders as follows:

- Create a `Class.Folder` instance through a standard [insertion](#object-insertion) method, then drag and drop existing objects into it.
- Select multiple objects, right-click them, and then select **Group As a Folder** from the context menu (shortcut of `Alt``Ctrl``G` on Windows or `⌥``⌘``G` on Mac).

## Search methods

Through the **search** input near the top of the window, you can find instances by [name](#name-search), [property](#property-search), class/subclass/tag [bespoke](#bespoke-search) queries, and [ancestry](#ancestry-search) queries. You can also [combine parameters](#combined) for advanced logical searches. Quickly access this input by pressing `Ctrl``Shift``X` (Windows) or `⌘``Shift``X` (Mac).

![Example search query and search options](../assets/studio/explorer/Search-Diagram.png)

Navigate up and down through search results

Select all search results (`Ctrl``A` on Windows or `⌘``A` on Mac)

Refresh search results

> **Success:** A name is a sequence of characters that are alphanumeric, `_`, `-`, or `.`. In all of the following search methods, exercise caution when searching for instances whose names contain spaces, as the search logic may confuse spaces for a [combined search](#combined). When searching for names with spaces, you should surround the full name with double quotes, for example`tag:"Light Source"` to search by the full [tag](/docs/en-us/studio/properties.md#instance-tags) name of`Light Source`.
### Name search

Typing in a basic string yields **name** matched instances, case‑insensitive. For example, searching by the keyword `script` finds all instances containing it, such as `ServerScriptService` and `LocalScript`.

![Objects filtered by query of 'script'](../assets/studio/explorer/Search-By-Name.png) ### Property search

You can filter by property equality or value comparisons. Most properties are supported, it works with partial matches, ignores spacing, and is case‑insensitive.

#### Equality

Property **equality** is searched through the operators `=` or `==`.

| Example | Result |
| --- | --- |
| `ClassName = Decal` | All instances of class `Class.Decal`. |
| `Locked = true` | `Class.BasePart\|BaseParts` with `Class.BasePart.Locked\|Locked` set to `true`. |
| `Material == plas` | `Class.BasePart\|BaseParts` with `Class.BasePart.Material\|Material` of either `Enum.Material\|Plastic` or `Enum.Material\|SmoothPlastic`. |

#### Value Comparisons

Property **value comparisons** are searched through the operators `~=`, `>`, `<`, `<=`, or `>=`.

| Example | Result |
| --- | --- |
| `Health > 50` | Every `Class.Humanoid` with `Class.Humanoid.Health\|Health` more than `50`. |
| `Transparency ~= 0.5` | `Class.BasePart\|BaseParts` with `Class.BasePart.Transparency\|Transparency` **not** equal to `0.5`. |

#### Individual Fields

Property types such as `Datatype.Vector3` and `Datatype.Color3` support searching by **individual fields**. This works either for exact equality or for value comparisons.

| Example | Result |
| --- | --- |
| `Position.X = 1` | Objects with an `X` position of exactly `1`. |
| `Color.R > 120` | Objects with a red (`R`) color channel value greater than `120`. |

#### Complete Units

Property types such as `Datatype.Vector3` and `Datatype.Color3` support searching as a **complete unit**, with the unit surrounded by quotes. This works either for exact equality, or with comparison operators in which every value is compared against the comparator.

| Example | Result |
| --- | --- |
| `Size > "20, 5, 20"` | Objects with an `X`, `Y`, and `Z` size greater than `20`, `5`, `20`, respectively. |
| `Color = "255, 0, 0"` | Objects with an RGB color value of exactly`[255, 0, 0]`. |

### Bespoke search

Classes, and subclasses, and tags are searched through various **bespoke** queries, including:

- `is:[Class]` finds everything that is of **class** `[Class]`. For example, `is:Part` finds everything that is a `Class.Part`.
- `is:[SubClass]` finds everything that is a **subclass** of `[SubClass]`. For example, `is:BasePart` finds everything that is a subclass of `Class.BasePart`, such as `Class.Part` and `Class.MeshPart`.
- `tag:[TagName]` finds everything with a `Class.CollectionService` tag of `[TagName]`. For example, `tag:LightSource` finds everything that is tagged `LightSource`. You can add tags using the [Tags](/docs/en-us/studio/properties.md#instance-tags) section of an instance's properties and tag names will autocomplete.

### Ancestry search

You can search within a specific scope using the `.` operator, chain operators together for highly specific searches, or use `*` as a wildcard.

- `[Parent].[Child]` finds named children inside a named parent. For example, `workspace.Model` finds instances named `Model` inside instances named `workspace`, similar to scripting.
- Chaining `.` operators adds specificity. For instance, `Animals.Dog.Tail` finds objects named `Tail` inside `Dog` inside `Animals`.
- `*` acts as a wildcard, for instance: | Example | Result |
| --- | --- | | `Cart.*` | All children of an object named `Cart`. | | `Cart.Barrier.*` | All children of `Barrier`, itself a child of `Cart`. | | `Cart.*.*` | All grandchildren of `Cart`, excluding direct children of `Cart`. | | `Cart.*.Trim` | All grandchildren of `Cart` that are named `Trim`. |
- `[Parent].**` finds all descendants of a parent. For example, `CarModel.**` finds all descendants of `CarModel`.

### Combined

For advanced logical searches, you can combine queries through unions and grouping.

- Multiple queries separated by spaces or `and` operate on **all** of the conditions. | Example | Result |
| --- | --- | | `Anchored=true CanCollide=true` | Every `Class.BasePart` that is anchored and can collide. | | `Cart.*.* Transparency < 1` | All grandchildren of `Cart` that are not fully transparent. | | `Anchored=false and CanCollide=false` | Every `Class.BasePart` that isn't anchored and can't collide. |
- The `or` conjunction operates just like the `or` operator in code. Groups within parentheses, conjoined by `or`, find everything within multiple combined queries. | Example | Result |
| --- | --- | | `Cat or Dog` | Everything that has `Cat` or `Dog` in its name. | | `(Anchored=true CanCollide=true) or (Anchored=false CanCollide=false)` | Every `Class.BasePart` that either is anchored and can collide, **or** isn't anchored and can't collide. |

## Selection methods

Within a [searched](#search-methods) hierarchy, certain key shortcuts and mouse operations behave differently than they do within a non‑searched hierarchy.

### Select all

Within a non‑searched hierarchy, pressing `Ctrl``A` on Windows or `⌘``A` on Mac selects all instances. Within a [searched](#search-methods) hierarchy, the same shortcut or the **select all** button selects only the query‑matching objects, for example all objects matching **Board** in a hierarchy searched for `board`.

![Image showing how only matching objects are selected in a searched hierarchy using the Select All shortcut](../assets/studio/explorer/Select-All-Searched.png) ### Shift-select

Clicking an object and `Shift`-clicking another object behaves differently within a non‑searched hierarchy versus a [searched](#search-methods) hierarchy.

#### Non-Searched Hierarchy

Within a non-searched hierarchy, `Shift`-clicking two objects at the same hierarchy level selects both of them and every object between which is also at the same hierarchy level, as shown in image **🅰** where **LeftFoot** is initially clicked, **LeftLowerArm** is `Shift`‑clicked, and **LeftHand** at same hierarchy level is also selected. Duplicating, copying, or pasting the selected objects will result in a deep copy of those objects **and** all children.

If the first `Shift`-clicked object and the second `Shift`-clicked object are at **different** hierarchy levels, all objects in between them will be selected, as shown in image **🅱** where **LeftFoot** is initially clicked, **LeftHand** is `Shift`‑clicked, and everything between is also selected.

_`Shift`-click at same hierarchy level_

_`Shift`-click at different hierarchy level_

#### Searched Hierarchy

Within a searched hierarchy, if both the initially‑clicked object and the `Shift`‑clicked object match the query, only query‑matching objects between are selected. For example, in the following image with a hierarchy searched for `anim`, **FallAnim** is initially clicked, **RunAnim** is `Shift`‑clicked, and every object matching `anim` between is also selected.

![Image showing how only matching objects in range are selected within a searched hierarchy](../assets/studio/explorer/Shift-Click-Searched.png)

### Drag select

Clicking and dragging from an empty region of the window initiates a selection box. Within a non‑searched hierarchy, everything inside the box is selected. Within a [searched](#search-methods) hierarchy, only query‑matching objects inside the box are selected.

![Image showing how only matching objects inside the selection box are selected within a searched hierarchy](../assets/studio/explorer/Drag-Select-Searched.png)

## Key shortcuts

| Shortcut | Description |
| --- | --- |
| `→` | With a collapsed branch selected, expands that branch. When pressed again, selects the **first child** immediately under the parent node. |
| `←` | With any child of a branch selected, moves selection back to the parent node. When pressed again, collapses the entire branch. |
| `Home` | Selects the topmost object in the hierarchy (`Class.Workspace`). |
| `End` | Selects the bottommost object in the hierarchy. |
| `PageUp` | Selects the object in the hierarchy that's above the topmost **visible** hierarchy item. |
| `PageDown` | Selects the object in the hierarchy that's below the bottommost **visible** hierarchy item. |
| `Ctrl``Shift``X`<br>`⌘``Shift``X` | Jump to the [search input](#search-methods) near the top of the window. |