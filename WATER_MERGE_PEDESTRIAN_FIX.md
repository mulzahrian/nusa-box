# Water Merging & Pedestrian Spawn Fix

## Changes Made (2026-07-03)

### 1. ✅ Pedestrian Spawn Prevention

**Problem**: Pedestrians could spawn from roads, water tiles, irrigation, and railway.

**Solution**: Updated `spawnPedestrian()` to exclude these tiles from spawn points.

```javascript
function spawnPedestrian(){
  // Exclude roads, water tiles, and irrigation from spawn points
  const allBuildings = state.buildings.filter(b => 
    b.type !== 'road' && 
    b.type !== 'water_tile' && 
    b.type !== 'irrigation' &&
    b.type !== 'railway'
  );
  if (allBuildings.length < 1) return;
  // ... rest of function
}
```

**Result**: Pedestrians now only spawn near actual buildings (residential, commercial, industrial, public buildings).

---

### 2. ✅ Water Tile Merging

**Problem**: Water tiles (lake/river) did not visually merge when placed next to each other.

**Solution**: Implemented scale-based merging for GLB water models.

#### How It Works:

1. **Store Model Reference** in `makeWaterTile()`:
   ```javascript
   g.userData.waterModel = model;
   ```

2. **Check Neighbors** in `updateWaterMerge()`:
   ```javascript
   const n = isWaterAt(x, z-1);  // North
   const s = isWaterAt(x, z+1);  // South
   const e = isWaterAt(x+1, z);  // East
   const w = isWaterAt(x-1, z);  // West
   ```

3. **Scale Model to Merge**:
   ```javascript
   const scaleX = (e || w) ? 1.08 : 1.0;  // Expand if neighbor East or West
   const scaleZ = (n || s) ? 1.08 : 1.0;  // Expand if neighbor North or South
   model.scale.set(scaleX, 1.0, scaleZ);
   ```

#### Visual Effect:

- **Single water tile**: Normal size (scale 1.0)
- **2 tiles horizontal**: Both expand horizontally (scaleX 1.08) → overlap and merge
- **2 tiles vertical**: Both expand vertically (scaleZ 1.08) → overlap and merge
- **4 tiles in square**: All expand in both directions → seamless water body

---

## Features

### 🚫 No Pedestrians From:
- ✅ Roads (`road`)
- ✅ Water tiles (`water_tile`)
- ✅ Irrigation (`irrigation`)
- ✅ Railway (`railway`)

### 💧 Water Merging:
- ✅ Automatic detection of neighboring water tiles
- ✅ Scale expansion (8% overlap) for seamless merging
- ✅ Works in all 4 directions (N, S, E, W)
- ✅ Maintains GLB animations while scaling
- ✅ Updates dynamically when placing/removing water tiles

---

## Technical Details

### updateWaterMerge() Logic:

```javascript
function updateWaterMerge(gx, gz){
  // Check if tile at (x,z) is water
  const isWaterAt = (x, z) => inBounds(x, z) && 
    (state.grid[x][z].type === 'water_tile' || state.grid[x][z].type === 'irrigation');
  
  const updateTile = (x, z) => {
    // Get neighbors
    const n = isWaterAt(x, z-1);
    const s = isWaterAt(x, z+1);
    const e = isWaterAt(x+1, z);
    const w = isWaterAt(x-1, z);
    
    // Scale water model
    if (cell.mesh.userData.waterModel) {
      const scaleX = (e || w) ? 1.08 : 1.0;
      const scaleZ = (n || s) ? 1.08 : 1.0;
      model.scale.set(scaleX, 1.0, scaleZ);
    }
  };
  
  // Update current tile and all 4 neighbors
  updateTile(gx, gz);
  updateTile(gx-1, gz); updateTile(gx+1, gz);
  updateTile(gx, gz-1); updateTile(gx, gz+1);
}
```

### When updateWaterMerge() is Called:

1. **After placing water tile**: Line ~2106
   ```javascript
   if (key === 'water_tile' || key === 'irrigation') updateWaterMerge(gx, gz);
   ```

2. **After bulldozing water tile**: Line ~2192
   ```javascript
   if (key === 'water_tile' || key === 'irrigation'){
     updateWaterMerge(gx, gz);
   }
   ```

---

## Examples

### Example 1: Single Water Tile
```
[ ][ ][ ]
[ ][💧][ ]  → Scale: 1.0 x 1.0 (normal size)
[ ][ ][ ]
```

### Example 2: Horizontal Row
```
[ ][ ][ ][ ]
[💧][💧][💧][ ]  → All 3 tiles: scaleX = 1.08 (expand horizontally, overlap)
[ ][ ][ ][ ]
```
Result: Seamless horizontal water body

### Example 3: 2x2 Lake
```
[💧][💧]
[💧][💧]  → All 4 tiles: scale = 1.08 x 1.08 (expand in both directions)
```
Result: Unified lake appearance

### Example 4: Complex Shape
```
   [💧][💧]
[💧][💧][💧]
   [💧]
```
Each tile scales only in directions where neighbors exist.

---

## Testing

### Pedestrian Spawn Test:
1. ✅ Place roads → No pedestrians spawn from roads
2. ✅ Place water tiles → No pedestrians spawn from water
3. ✅ Place buildings → Pedestrians spawn near buildings
4. ✅ Pedestrians avoid walking into water (already implemented)

### Water Merging Test:
1. ✅ Place single water tile → Normal size
2. ✅ Place second water tile next to first → Both expand and merge
3. ✅ Place 4 tiles in square → Forms unified lake
4. ✅ Bulldoze one tile → Remaining tiles rescale
5. ✅ Animations still play while scaled
6. ✅ No gaps between merged tiles

---

## Notes

- **Scale Factor**: 1.08 provides 8% overlap, enough to hide seams without excessive overlap
- **Performance**: Scaling is very cheap (just changing 2 numbers per tile)
- **Animation**: AnimationMixer continues to work on scaled models
- **Irrigation**: Still uses old shore-based merging system (different visual style)
- **Non-Water**: Only water_tile and irrigation are affected by this merging

---

## Future Improvements

Potential enhancements:
- Corner detection for smoother diagonal merging
- Different models for edges vs center tiles
- Blending of water surface normals for better reflections
- Particle effects at water edges
- Sound effects for water placement
