# Irrigation Feature Removed

## Changes (2026-07-03)

### ✅ Irrigation (💦) Has Been Removed

The irrigation feature has been completely removed from the game.

---

## What Was Removed

### 1. **BUILDINGS Config**
```javascript
// REMOVED:
irrigation:  { name:'Irrigation', icon:'💦', cost:150, cat:'util', color:0x44aadd, h:0.05, size:1, isWater:true }
```

### 2. **CATEGORIES Config**
```javascript
// REMOVED from Utilities category:
{ id:'util', icon:'⚡', name:'Utilities', items:['power_coal','power_solar','power_wind','water_tile','irrigation','water_pump'] }

// NOW:
{ id:'util', icon:'⚡', name:'Utilities', items:['power_coal','power_solar','power_wind','water_tile','water_pump'] }
```

### 3. **makeIrrigationTile() Function**
Entire function removed (~45 lines)

### 4. **All References**
Removed from:
- ✅ Switch case in building factory
- ✅ instantKeys array
- ✅ updateWaterMerge calls
- ✅ Bulldoze water restore logic
- ✅ nearWater() function
- ✅ spawnPedestrian() filter
- ✅ Pedestrian update water check
- ✅ isInstant placement check

---

## What Remains

### Water Tiles (🌊)
- Still available in Utilities menu
- Uses GLB model with animations
- No shore frames
- Normal size (no scaling)

### Water System
- Water Pump (💧) - generates water
- Lake/River (🌊) - decorative water
- No more irrigation canals

---

## Impact

### Before:
- **2 water types**: Lake/River + Irrigation
- Irrigation had green field + brown dirt + blue canal
- Both marked as `isWater: true`

### After:
- **1 water type**: Lake/River only
- Simpler water system
- Less confusion for players

---

## Benefits

1. **Simpler UI**: One less button in Utilities menu
2. **Less Confusion**: Clear distinction - Lake for decoration, Pump for water supply
3. **Cleaner Code**: Removed ~100+ lines of irrigation references
4. **Better Focus**: Lake/River can be improved without considering irrigation

---

## If You Want It Back

To restore irrigation:

1. Add back to BUILDINGS (line ~30)
2. Add back to CATEGORIES (line ~50)
3. Recreate makeIrrigationTile() function
4. Add back switch case: `case 'irrigation': g = makeIrrigationTile(); break;`
5. Add back to all filter checks (spawn, water, instant, etc.)

Or use git to revert this commit.
