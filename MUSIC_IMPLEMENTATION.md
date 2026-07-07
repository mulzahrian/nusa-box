# Implementasi Musik dan Water Animation untuk City Empire

## File Musik
- `music/main-menu.mp3` - Musik untuk main menu
- `music/gameplay.mp3` - Musik untuk gameplay

## Perubahan yang Dilakukan

### 1. Audio System (game.js)
Sistem audio sudah dimodifikasi untuk menggunakan file musik eksternal:

#### Preload Musik
```javascript
const menuMusic = new Audio();
menuMusic.src = 'music/main-menu.mp3';
menuMusic.loop = true;
menuMusic.volume = 0.35;

const gameplayMusic = new Audio();
gameplayMusic.src = 'music/gameplay.mp3';
gameplayMusic.loop = true;
gameplayMusic.volume = 0.35;
```

#### Fungsi Kontrol Musik
- `playMenuMusic()` - Memutar musik main menu
- `playGameplayMusic()` - Memutar musik gameplay
- `stopAllMusic()` - Menghentikan semua musik
- `setMusicVol(v)` - Mengatur volume musik

### 2. Main Menu
Musik menu akan otomatis diputar ketika `renderMainMenu()` dipanggil:
```javascript
Audio.init(); // Memulai musik menu
```

### 3. Gameplay
Musik gameplay akan otomatis diputar ketika game dimulai di fungsi `startGame()`:
```javascript
Audio.playGameplayMusic();
```

### 4. Toggle Musik
Tombol music (🔊 Music) di HUD bisa digunakan untuk toggle on/off:
- On: Volume 0.35
- Off: Volume 0

## Cara Kerja
1. **Main Menu**: 
   - Ketika game dibuka, `main-menu.mp3` akan diputar secara loop
   
2. **Start Game**: 
   - Ketika user klik "New Game" atau "Sandbox Mode", musik akan beralih ke `gameplay.mp3`
   
3. **Return to Menu**: 
   - Ketika kembali ke menu (via reload), musik kembali ke `main-menu.mp3`

4. **Toggle Music**: 
   - User bisa mematikan/menyalakan musik via tombol di HUD
   - Ketika dimatikan, volume diset ke 0 (tidak di-stop, jadi posisi musik tetap berjalan)

## Testing
1. Jalankan dev server: `npm run dev`
2. Buka browser ke http://localhost:5173
3. Dengarkan musik menu
4. Klik "New Game" atau "Sandbox Mode"
5. Musik harus berganti ke gameplay music
6. Coba toggle tombol 🔊 Music untuk test on/off

## Notes
- Musik diloop secara otomatis (loop = true)
- Volume default: 0.35
- Ambient sounds (traffic, wind) tetap berjalan di background
- SFX (placement, bulldoze, error) tetap berfungsi normal

---

## Water Animation Implementation

### 1. Model GLB
File `model/utilities/water_animation.glb` digunakan untuk Lake/River tile.

### 2. GLB_MODELS Configuration
```javascript
water_tile: { path: './model/utilities/water_animation.glb', scaleBoost: 1.0 }
```

### 3. makeWaterTile() Function
Fungsi ini sekarang:
- Mencoba load model GLB dari cache
- Jika model ada, menggunakan model GLB dengan animasi
- Jika model belum loaded, fallback ke procedural water
- Tetap menambahkan shore indicators untuk water merging

### 4. Water Animation
- Semua mesh dalam model di-mark dengan `userData.waterAnim = true`
- Animasi wave: posisi Y bergerak naik-turun
- Color animation: HSL color shifting untuk efek air bergerak
- Random phase untuk setiap tile agar tidak sinkron

### 5. Water Merging
- Shore indicators (N, S, E, W) tetap ditambahkan ke model GLB
- Merging antar water tile tetap berfungsi
- Shores akan hidden ketika ada water tile bersebelahan

### 6. Preloading
Model water_tile di-preload saat game initialization:
```javascript
loadGLBTemplate('water_tile').catch(err => console.warn('Water animation model not loaded:', err));
```

### Testing Water Animation
1. Place water tile (🌊 Lake/River) dari Utilities menu
2. Model GLB akan muncul dengan animasi wave
3. Place multiple water tiles bersebelahan untuk test merging
4. Shore edges akan otomatis hide/show sesuai neighbor
