# Water Animation GLB - Changelog

## Changes Summary (2026-07-03)

### ✅ What Changed

#### 1. **No More Shore Frames**
Water tiles now display **ONLY the GLB model** without any extra frames or shore indicators around it.

```javascript
// OLD: Had shore frames
const sN = addBox(g, shoreW, shoreH, shoreD, 0, 0.04, -(TILE*0.49 - shoreD/2), mat(0x1a3a5c));
const sS = addBox(g, shoreW, shoreH, shoreD, 0, 0.04,  (TILE*0.49 - shoreD/2), mat(0x1a3a5c));
// ...

// NEW: Clean GLB model only
g.userData.isWater = true;
return g; // No shore frames!
```

#### 2. **GLB Animation Playback**
The GLB file's built-in animations are now automatically played using Three.js AnimationMixer.

```javascript
// Play GLB animations if available
if (waterModel.userData.animations && waterModel.userData.animations.length > 0) {
  const mixer = new THREE.AnimationMixer(model);
  waterModel.userData.animations.forEach(clip => {
    const action = mixer.clipAction(clip);
    action.play();
  });
  g.userData.mixer = mixer;
}
```

#### 3. **Animation Updates in Game Loop**
Added `updateWaterMixers()` function to update all animation mixers every frame.

```javascript
function updateWaterMixers(dt){
  state.grid.forEach(col => {
    col.forEach(cell => {
      if (cell && cell.mesh && cell.mesh.userData.mixer) {
        cell.mesh.userData.mixer.update(dt);
      }
    });
  });
}
```

#### 4. **Store Animations in GLB Cache**
Modified `loadGLBTemplate()` to store animation clips from GLB files.

```javascript
// Store animation clips if available
if (gltf.animations && gltf.animations.length > 0) {
  tpl.userData.animations = gltf.animations;
}
```

### 🎯 Key Features

1. **Pure GLB Model**: Water tile is now just the GLB model without any procedural geometry
2. **Native Animations**: Uses the animations from the GLB file itself
3. **Automatic Playback**: All animations in the GLB file are played automatically
4. **Frame-by-frame Updates**: AnimationMixer updates every frame for smooth animation
5. **Fallback Support**: If GLB not loaded, still uses procedural water (with shore frames)

### 📝 Technical Details

**File Modified**: `game.js`

**Functions Changed**:
- `loadGLBTemplate()` - Stores animation clips
- `makeWaterTile()` - No shore frames, plays GLB animations
- `updateWaterMerge()` - Skips water_tile (no shores to merge)
- `updateWaterMixers()` - NEW function to update mixers
- Game loop - Added `updateWaterMixers(dt)` call

**Game Loop Integration**:
```javascript
if (state.running) gameTick(dt);
updateConstructions(dt);
updateDestructions(dt);
updateWaterAnimation(dt);  // Still used for fallback procedural water
updateWaterMixers(dt);     // NEW: Updates GLB animations
```

### 🎬 How It Works

1. **Load**: `loadGLBTemplate('water_tile')` loads the GLB and stores animations
2. **Place**: When placing water tile, `makeWaterTile()` is called
3. **Setup**: Function clones the model and creates AnimationMixer
4. **Play**: All animation clips are played immediately
5. **Update**: Every frame, `updateWaterMixers(dt)` updates the mixer
6. **Animate**: The GLB animations run smoothly in-game

### 🔧 GLB File Requirements

Your `water_animation.glb` should:
- ✅ Be properly scaled (will auto-fit to TILE size)
- ✅ Have animations built-in (keyframe animations in Blender/3D software)
- ✅ Be centered at origin (0,0,0)
- ✅ Have bottom at Y=0
- ✅ Use looping animations for continuous motion

### 🧪 Testing

Place a water tile and verify:
- [ ] No shore frames/borders around the water
- [ ] GLB model is visible
- [ ] GLB animations are playing
- [ ] Animation is smooth and continuous
- [ ] Multiple water tiles can be placed side-by-side
- [ ] Performance is good with many water tiles

### 💡 Notes

- **No More Merging**: Water tiles no longer merge visually (each is independent)
- **Procedural Fallback**: If GLB fails to load, uses old procedural water with shore frames
- **Performance**: AnimationMixer is efficient but check performance with many tiles
- **Custom Animations**: Any animations in the GLB file will play automatically

### 🐛 Troubleshooting

**Animation not playing?**
- Check that GLB file contains animations (open in Blender and check Action Editor)
- Verify animations are exported with GLB file
- Check browser console for any loading errors

**Shore frames still visible?**
- Make sure GLB model loaded successfully
- Check that `GLB_CACHE.get('water_tile')` returns the model
- If seeing procedural water, GLB didn't load (check path/file)

**Performance issues?**
- Each water tile has its own AnimationMixer
- Consider optimizing the number of keyframes in GLB
- Could batch update mixers (update every N frames instead of every frame)
