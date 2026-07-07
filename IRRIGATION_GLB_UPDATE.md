# Irrigation GLB Model Update

## Changes (2026-07-03)

### ✅ Irrigation Now Uses Same GLB Model as Lake/River

**Before**: Irrigation used procedural water (boxes with green base and blue canal)

**After**: Irrigation uses `water_animation.glb` - same as lake/river

---

## Implementation

### makeIrrigationTile() Updated

```javascript
function makeIrrigationTile(){
  const g = new THREE.Group();
  
  // Use the same GLB model as water_tile
  const waterModel = GLB_CACHE.get('water_tile');
  if (waterModel) {
    const model = waterModel.clone();
    model.position.y = 0;
    g.add(model);
    
    // Store reference and play animations
    g.userData.waterModel = model;
    
    if (waterModel.userData.animations && waterModel.userData.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      waterModel.userData.animations.forEach(clip => {
        const action = mixer.clipAction(clip);
        action.play();
      });
      g.userData.mixer = mixer;
    }
  } else {
    // Fallback to old procedural style
    // ... green/blue boxes ...
  }
  
  g.userData.isWater = true;
  return g;
}
```

---

## Features

### Both Water Tile & Irrigation Now:
- ✅ Use same GLB model (`water_animation.glb`)
- ✅ Play GLB animations automatically
- ✅ Have animation mixers updated every frame
- ✅ No shore frames (clean model)
- ✅ Normal size (no scaling)
- ✅ Fallback to procedural if GLB fails

### Differences:
| Feature | Water Tile (🌊) | Irrigation (💦) |
|---------|----------------|-----------------|
| GLB Model | ✅ water_animation.glb | ✅ water_animation.glb |
| Animations | ✅ Yes | ✅ Yes |
| Merging | ❌ Disabled | ❌ Disabled |
| Fallback | Blue water boxes | Green+blue canal |

---

## Visual Result

### Before:
- **Water Tile**: GLB animated water
- **Irrigation**: Green field with blue canal (procedural)

### After:
- **Water Tile**: GLB animated water
- **Irrigation**: GLB animated water (same as water tile!)

---

## Benefits

1. **Visual Consistency**: Both water types look the same
2. **Better Animation**: Irrigation now has smooth GLB animations
3. **Simpler Code**: Reuse same model and animation system
4. **Performance**: Same caching benefits

---

## Testing

Place both types and verify:
- [ ] Water Tile (🌊) displays GLB model
- [ ] Irrigation (💦) displays GLB model
- [ ] Both have same appearance
- [ ] Both have animations playing
- [ ] Animations are smooth
- [ ] No shore frames on either

---

## Notes

- If you want different appearance for irrigation vs lake, you can:
  1. Create separate GLB file (e.g., `irrigation_animation.glb`)
  2. Add to GLB_MODELS
  3. Change `GLB_CACHE.get('water_tile')` to `GLB_CACHE.get('irrigation')`
  
- Current setup treats both as the same water type visually
- Functionally they're still different (irrigation provides water, lake is decorative)
