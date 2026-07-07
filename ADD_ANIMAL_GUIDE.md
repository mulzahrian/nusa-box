# 🐾 Panduan Menambah Hewan Baru ke Skyline

Panduan ini menjelaskan langkah-langkah untuk menambahkan hewan baru (selain rusa/deer) ke dalam game, mengikuti pola yang sudah ada di sistem deer.

---

## Langkah 1 — Siapkan File GLB

1. Simpan model `.glb` hewan kamu di folder `model/animal/`
   - Contoh: `model/animal/fox.glb`, `model/animal/rabbit.glb`
2. Pastikan model memiliki **animasi** di dalam GLB-nya
   - Animasi yang direkomendasikan: `walk` dan `idle` (atau `eat`)
   - Cek nama animasi dengan membuka di [Babylon.js Sandbox](https://sandbox.babylonjs.com/) atau [gltf.report](https://gltf.report/)

---

## Langkah 2 — Deklarasi Variabel (di `game.js`)

Cari bagian `// ===================== DEER SYSTEM =====================` sebagai referensi.  
Tambahkan blok baru **di bawah** sistem deer (sekitar baris 4140+):

```js
// ===================== FOX SYSTEM =====================
const FOX_COUNT_MAX   = 6;
const FOX_MONEY_REWARD = 150;
let _foxGLB        = null;
let _foxAnimations = [];
let _foxReady      = false;
let _foxGLTF       = null;
```

---

## Langkah 3 — Load Model GLB

```js
gltfLoader.load('./model/animal/fox.glb', (gltf) => {
  const root = gltf.scene;

  // Sesuaikan angka 0.35 dengan ukuran yang diinginkan (dalam world unit)
  // Referensi: bangunan rumah tingginya ~0.7, rusa ~0.35
  const box0 = new THREE.Box3().setFromObject(root);
  const sz0  = box0.getSize(new THREE.Vector3());
  if (sz0.y > 0.001) root.scale.multiplyScalar(0.30 / sz0.y);

  const box2 = new THREE.Box3().setFromObject(root);
  const c = box2.getCenter(new THREE.Vector3());
  root.position.x -= c.x; root.position.z -= c.z;
  root.position.y -= box2.min.y;
  root.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});

  _foxGLB = root;
  _foxGLTF = gltf;
  _foxAnimations = gltf.animations || [];
  _foxReady = true;
  console.log('[fox] loaded, animations:', _foxAnimations.map(a => a.name).join(', '));
  if (state.running && _forestCenter) spawnFox();
}, undefined, err => { console.warn('[fox] failed', err); _foxReady = true; });

if (!state.foxes) state.foxes = [];
```

---

## Langkah 4 — Fungsi `makeFoxMesh()`

```js
function makeFoxMesh() {
  if (!_foxGLB || !_foxGLTF) return null;
  const clone = SkeletonUtils.clone(_foxGLB); // WAJIB pakai SkeletonUtils.clone untuk skinned mesh
  clone.scale.multiplyScalar(rand(0.85, 1.15)); // variasi ukuran kecil
  clone.rotation.y = rand(0, Math.PI * 2);
  clone.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; }});

  const mixer = new THREE.AnimationMixer(clone);
  let walkAction = null, idleAction = null;

  for (const clip of _foxAnimations) {
    const lc = clip.name.toLowerCase();
    if (lc.includes('walk'))        { walkAction  = mixer.clipAction(clip); walkAction.loop  = THREE.LoopRepeat; }
    else if (lc.includes('idle') || lc.includes('eat')) { idleAction = mixer.clipAction(clip); idleAction.loop = THREE.LoopRepeat; }
  }
  // Fallback jika nama animasi tidak mengandung 'walk'/'idle'
  if (!walkAction && _foxAnimations.length > 0) { walkAction = mixer.clipAction(_foxAnimations[0]); walkAction.loop = THREE.LoopRepeat; }
  if (!idleAction && _foxAnimations.length > 1) { idleAction = mixer.clipAction(_foxAnimations[1]); idleAction.loop = THREE.LoopRepeat; }

  return { clone, mixer, walkAction, eatAction: idleAction };
}
```

> ⚠️ **Penting**: Selalu pakai `SkeletonUtils.clone()` bukan `.clone(true)` untuk model dengan armature/skeleton. Kalau pakai `.clone(true)`, animasi tidak akan berjalan.

---

## Langkah 5 — Fungsi `spawnFox()`

```js
function spawnFox() {
  if (!_foxReady || !_forestCenter) return;
  if (state.foxes.length >= FOX_COUNT_MAX) return;

  const toSpawn = Math.min(FOX_COUNT_MAX - state.foxes.length, randInt(3, 5));
  const fc      = _forestCenter;
  const spread  = FOREST_ZONE_SIZE * 1.4;

  for (let i = 0; i < toSpawn; i++) {
    const result = makeFoxMesh();
    if (!result) break;
    const { clone, mixer, walkAction, eatAction } = result;

    const angle = rand(0, Math.PI * 2);
    const dist  = rand(1, spread);
    const wx = clamp(fc.x + Math.cos(angle) * dist, -HALF + 2, HALF - 2);
    const wz = clamp(fc.z + Math.sin(angle) * dist, -HALF + 2, HALF - 2);
    clone.position.set(wx, 0, wz);
    scene.add(clone);

    const startState = Math.random() < 0.5 ? 'eat' : 'walk';
    if (startState === 'eat' && eatAction)  { eatAction.reset().play(); }
    else if (walkAction)                     { walkAction.reset().play(); }

    state.foxes.push({
      mesh: clone, mixer, walkAction, eatAction,
      state: startState,
      stateTimer: rand(3, 10),
      wx, wz,
      dirAngle: rand(0, Math.PI * 2),
      speed: rand(2.0, 3.5),
    });
  }
}
```

---

## Langkah 6 — Fungsi `updateFoxes(dt)`

```js
function updateFoxes(dt) {
  if (!state.foxes || !state.foxes.length) return;
  const fc = _forestCenter;

  for (let i = state.foxes.length - 1; i >= 0; i--) {
    const d = state.foxes[i];
    if (!d.mesh) continue;

    d.mixer.update(dt);

    d.stateTimer -= dt;
    if (d.stateTimer <= 0) {
      d.state = d.state === 'walk' ? 'eat' : 'walk';
      d.stateTimer = d.state === 'eat' ? rand(4, 12) : rand(3, 8);
      d.dirAngle = rand(0, Math.PI * 2);

      if (d.state === 'eat') {
        if (d.walkAction) d.walkAction.fadeOut(0.4);
        if (d.eatAction)  d.eatAction.reset().fadeIn(0.4).play();
      } else {
        if (d.eatAction)  d.eatAction.fadeOut(0.4);
        if (d.walkAction) d.walkAction.reset().fadeIn(0.4).play();
      }
    }

    if (d.state === 'walk') {
      const homeX = fc ? fc.x : 0, homeZ = fc ? fc.z : 0;
      const distFromHome = Math.sqrt((d.wx - homeX) ** 2 + (d.wz - homeZ) ** 2);
      if (distFromHome > FOREST_ZONE_SIZE * 1.6) {
        d.dirAngle = Math.atan2(homeZ - d.wz, homeX - d.wx) + rand(-0.3, 0.3);
      } else {
        d.dirAngle += rand(-0.15, 0.15);
      }

      d.wx = clamp(d.wx + Math.cos(d.dirAngle) * d.speed * dt, -HALF + 1, HALF - 1);
      d.wz = clamp(d.wz + Math.sin(d.dirAngle) * d.speed * dt, -HALF + 1, HALF - 1);
      d.mesh.position.set(d.wx, 0, d.wz);
      d.mesh.rotation.y = -d.dirAngle + Math.PI / 2;
    }

    // Distance culling — jangan render kalau jauh dari kamera
    const camDx = d.wx - camTarget.x, camDz = d.wz - camTarget.z;
    d.mesh.visible = (camDx * camDx + camDz * camDz) <= 110 * 110;
  }
}
```

---

## Langkah 7 — Daftarkan di Game Loop

Cari baris `if (state.running) updateDeers(dt);` di bagian game loop (sekitar akhir file), lalu tambahkan baris baru di bawahnya:

```js
if (state.running) updateDeers(dt);
if (state.running) updateFoxes(dt);   // ← tambahkan ini
```

---

## Langkah 8 — Reset saat New Game

Cari `state.deers = [];` di fungsi `startGame()`, tambahkan di bawahnya:

```js
state.deers = [];
state.foxes = [];   // ← tambahkan ini
```

Dan spawn saat game mulai — cari `if (_deerReady) spawnDeer();` lalu tambahkan:

```js
if (_deerReady) spawnDeer();
if (_foxReady)  spawnFox();   // ← tambahkan ini
```

---

## Langkah 9 — (Opsional) Tambah Tool Hunt untuk Hewan Baru

Di fungsi `applyTool()`:

```js
else if (state.selected === 'hunt') {
  const wx = ...;
  const wz = ...;
  huntDeer(wx, wz);    // sudah ada
  huntFox(wx, wz);     // ← tambahkan untuk hunt fox juga
}
```

Fungsi `huntFox()`:

```js
function huntFox(wx, wz) {
  if (!state.foxes || !state.foxes.length) return false;
  const rangeSq = 8 * 8;
  let closest = null, closestDist = rangeSq;
  for (const d of state.foxes) {
    const dist = (d.wx - wx) ** 2 + (d.wz - wz) ** 2;
    if (dist < closestDist) { closestDist = dist; closest = d; }
  }
  if (!closest) return false;

  scene.remove(closest.mesh);
  closest.mixer.stopAllAction();
  closest.mesh.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  state.foxes = state.foxes.filter(d => d !== closest);

  state.money += FOX_MONEY_REWARD;
  renderTopBar();
  notify('🦊 Rubah Ditangkap!', `+Rp${FOX_MONEY_REWARD.toLocaleString('id-ID')}`, 'success');
  return true;
}
```

---

## Referensi Ukuran (Height Normalization)

| Objek | World Unit |
|---|---|
| Bangunan rumah (`res_low`) | ~0.7 |
| Rusa (deer) saat ini | ~0.35 |
| Ideal hewan kecil (kelinci, dll) | ~0.15 – 0.20 |
| Ideal hewan sedang (rubah, serigala) | ~0.25 – 0.35 |
| Ideal hewan besar (beruang, sapi) | ~0.45 – 0.60 |

Sesuaikan angka di `root.scale.multiplyScalar(X / sz0.y)` dengan tabel di atas.

---

## Tips & Troubleshooting

| Masalah | Solusi |
|---|---|
| Animasi tidak jalan / T-pose | Pastikan pakai `SkeletonUtils.clone()` bukan `.clone(true)` |
| Hewan tidak muncul | Cek console browser — pastikan nama file `.glb` benar |
| Hewan terlalu besar/kecil | Ubah angka di `multiplyScalar(X / sz0.y)` |
| Hewan tidak bergerak | Pastikan `updateFoxes(dt)` sudah dipanggil di game loop |
| Nama animasi tidak dikenali | Cek nama animasi di console log saat load, sesuaikan `lc.includes('...')` |
