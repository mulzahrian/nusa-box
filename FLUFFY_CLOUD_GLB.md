# Fluffy Cloud GLB Implementation

## Changes (2026-07-03)

### ✅ Clouds Now Use GLB Model

Clouds are now loaded from `fluffy_cloud.glb` instead of procedural spheres.

---

## Implementation

### Cloud Loading System

```javascript
// Load fluffy cloud model
gltfLoader.load('./model/fluffy_cloud.glb', (gltf) => {
  cloudTemplate = gltf.scene;
  
  // Scale to ~4 units
  cloudTemplate.scale.setScalar(4.0 / maxDim);
  
  // Setup materials
  cloudTemplate.traverse(obj => {
    if (obj.isMesh) {
      obj.material.transparent = true;
      obj.material.opacity = 0.85;
    }
  });
  
  // Create 14 clouds with variations
  for (let i = 0; i < 14; i++) {
    const c = cloudTemplate.clone();
    c.position.set(rand(-HALF, HALF), rand(22, 40), rand(-HALF, HALF));
    c.scale.multiplyScalar(rand(0.8, 2.0));  // Random size variation
    c.rotation.y = rand(0, Math.PI * 2);      // Random rotation
    cloudGroup.add(c);
  }
});
```

---

## Features

### 🌥️ Cloud System

1. **GLB Model**: Uses `fluffy_cloud.glb` from model folder
2. **Auto-scaling**: Scaled to ~4 world units
3. **Variations**: Each cloud has random:
   - Position (across entire map)
   - Height (22-40 units up)
   - Scale (0.8-2.0x multiplier)
   - Rotation (0-360°)
4. **Materials**: 
   - Transparent (85% opacity)
   - No shadows (castShadow: false)
5. **Animation**: Drifts horizontally at 0.5 units/sec
6. **Wrap-around**: Clouds loop from right to left

### 🔄 Fallback System

If GLB model fails to load:
- Falls back to procedural sphere clouds
- Same behavior and animation
- Ensures game doesn't break

---

## Visual Comparison

### Before:
- **Type**: Procedural spheres
- **Look**: Simple white spheres (8x6 segments)
- **Scale**: Random ellipsoids (stretched)

### After:
- **Type**: GLB 3D model
- **Look**: Detailed fluffy cloud from Blender/3D software
- **Scale**: Random uniform scale with rotation

---

## Cloud Behavior

### Position & Movement:
```
Sky (Y: 22-40)
   ↓
[☁️]  →  [☁️]  →  [☁️]
   ↓         ↓         ↓
Move 0.5 units/sec to the right
Wrap around when off-screen
```

### Properties per Cloud:
- **Position X**: -HALF to +HALF (spans map)
- **Position Y**: 22-40 (sky height)
- **Position Z**: -HALF to +HALF (depth)
- **Scale**: 0.8x to 2.0x (size variation)
- **Rotation**: Random Y rotation (0-360°)

---

## Performance

- **14 clouds total** (same as before)
- **Instanced**: Each cloud is a clone (efficient)
- **No shadows**: Clouds don't cast/receive shadows
- **Transparent**: Uses alpha blending
- **Movement**: Simple X translation (very cheap)

---

## Model Requirements

The `fluffy_cloud.glb` should:
- ✅ Be a fluffy cloud shape (organic, irregular)
- ✅ Be white or light colored
- ✅ Have reasonable polygon count (not too high-poly)
- ✅ Be centered at origin
- ✅ Work with transparency (if using alpha textures)

The game will automatically:
- Scale it to fit (~4 units)
- Make it transparent (85% opacity)
- Rotate and vary size for each instance
- Animate drift

---

## Testing

Verify clouds:
- [ ] Load correctly from GLB
- [ ] Appear in the sky (not on ground)
- [ ] Are visible and look like clouds
- [ ] Drift smoothly from left to right
- [ ] Wrap around when off-screen
- [ ] Have size/rotation variations
- [ ] Don't impact performance
- [ ] Fallback works if model missing

---

## Customization

To change cloud behavior:

**Number of clouds**:
```javascript
for (let i = 0; i < 14; i++) {  // Change 14 to desired count
```

**Speed**:
```javascript
c.position.x += dt * mult * 0.5;  // Change 0.5 to faster/slower
```

**Height range**:
```javascript
rand(22, 40)  // Change min/max height
```

**Size range**:
```javascript
rand(0.8, 2.0)  // Change min/max scale multiplier
```

**Opacity**:
```javascript
obj.material.opacity = 0.85;  // 0.0 (invisible) to 1.0 (solid)
```

---

## Notes

- Clouds are created **after** GLB loads (asynchronous)
- If you reload the page quickly, clouds may not appear immediately
- Fallback ensures game still works if model is missing
- Clouds are purely decorative (no gameplay effect)
- No collision detection with clouds
