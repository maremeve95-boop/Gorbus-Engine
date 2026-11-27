# Gorbus Engine 3.0.0 — Preview

GE 3.0.0 is a development preview based on the 2.1.0 release branch. It preserves the 2D/3D editor, Luau runtime, Rapier physics, multi-file scripts, AI-assisted web migration, world tools and the NEON RELAY sample.

## New tools implemented

### 1. Runtime profiler overlay
Toggle from a Luau game script:

```lua
function onStart()
    Gorbus.setProfilerVisible(true)
end

function onStop()
    Gorbus.setProfilerVisible(false)
end
```

Metrics: approximate browser animation FPS and frame time, Three.js draw calls and triangles, geometry/texture counts, and JS heap when the browser exposes `performance.memory`.

Read a JSON snapshot with `Gorbus.getPerformanceStatsJSON()`.

**Limitations:** FPS is sampled from browser animation frames, not a separately measured game-loop budget. Renderer counters are sampled from Three.js and may represent the previous completed render. JS heap is unavailable in some browsers. No true GPU timing, per-system CPU profiling, native memory or per-object cost attribution is claimed.

### 2. Runtime transform inspection
- `Gorbus.getObjectScale(name)`
- `Gorbus.setObjectScale(name, x, y, z)`
- `Gorbus.getObjectRotation(name)`
- `Gorbus.setObjectRotation(name, x, y, z)`

Rotation values are degrees. Calls return a transform object or boolean success value.

### 3. Project diagnostics CLI
Run:

```bash
npm run diagnose -- samples/NEON_RELAY/NEON_RELAY.gorbus
```

The checker reports duplicate/empty object names, malformed position/rotation/scale arrays, dynamic bodies without a Rigidbody component, capsules without Capsule Collider, empty script entries and malformed scene structure. It exits with code 1 when structural errors are found.

This is a static project-file inspection tool. It does not execute or compile Luau, verify external model files, guarantee collision correctness, or prove that gameplay works.

## Verification

The CI pipeline runs:
- Existing GE 2.0 and GE 2.1 structural checks.
- NEON RELAY sample consistency checks.
- GE 3.0 profiler patch idempotency and API checks.
- Project diagnostics tests using both deliberately invalid and valid fixture scenes.
- Vite production build and ZIP artifact packaging.

## Still incomplete / next major work

These are not included as finished capabilities in this preview:
- CPU/GPU profiler with per-system attribution and capture/export.
- Asset browser with licensed asset packs and bulk import.
- Full ECS with data-oriented rendering, batching and spatial culling.
- Undoable preview/cancel workflow for physics placement.
- 100/250/500 crowd benchmarks and baked animation textures.
- Full keyframe animation graph, retargeting and IK.
- Native responsive in-game UI editor and secure HTML/JS bridge.
- Automated HTML-to-Luau semantic conversion.
- Browser-based end-to-end testing on desktop and mobile.

A 110-feature count is not claimed: only features with implemented code and repeatable checks are counted as delivered. The release should be promoted only after CI passes and the editor has been manually tested in a browser.
