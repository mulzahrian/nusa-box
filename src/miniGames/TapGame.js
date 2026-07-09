/**
 * Tap Minigame — tap targets before time runs out
 * Usage: TapGame.launch({ targets, timeLimit, name, rewardMoney, rewardHappiness }, onWin, onClose)
 */

const TapGame = {
  _overlay: null,
  _timer: null,

  launch(config, onWin, onClose) {
    this.stop();
    const { targets = 8, timeLimit = 15, name = 'Tap Game', rewardMoney = 0, rewardHappiness = 0, missAllowed = 3 } = config;

    let tapped = 0;
    let missed = 0;
    let timeLeft = timeLimit;
    let ended = false;

    const ov = document.createElement('div');
    ov.id = 'minigame-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9000;font-family:monospace;user-select:none;';
    document.body.appendChild(ov);
    this._overlay = ov;

    const arena = document.createElement('div');
    arena.style.cssText = 'position:relative;width:480px;height:360px;background:#0d0d1a;border:3px solid #ff4400;overflow:hidden;border-radius:4px;';

    const hud = document.createElement('div');
    hud.style.cssText = 'color:#fff;font-size:13px;margin-bottom:10px;text-align:center;';

    ov.appendChild(hud);
    ov.appendChild(arena);

    arena.onclick = (e) => {
      if (ended) return;
      if (e.target === arena) {
        missed++;
        updateHUD();
        if (missed > missAllowed) endGame(false);
      }
    };

    const updateHUD = () => {
      hud.innerHTML = `<span style="color:#ff4400">${name}</span> &nbsp;|&nbsp; 🎯 ${tapped}/${targets} &nbsp;|&nbsp; ⏱ ${Math.ceil(timeLeft)}s &nbsp;|&nbsp; ❌ Miss: ${missed}/${missAllowed}`;
    };

    const spawnTarget = () => {
      if (ended || tapped >= targets) return;
      const size = 44 + Math.random() * 24;
      const x = Math.random() * (480 - size - 10) + 5;
      const y = Math.random() * (360 - size - 10) + 5;
      const t = document.createElement('div');
      t.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:radial-gradient(circle, #ff6600, #ff0000);border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #ff9900;box-shadow:0 0 15px #ff440088;transition:transform .1s;`;
      t.textContent = '🔥';
      t.onmouseover = () => { t.style.transform = 'scale(1.15)'; };
      t.onmouseout = () => { t.style.transform = 'scale(1)'; };
      t.onclick = (e) => {
        if (ended) return;
        e.stopPropagation();
        tapped++;
        t.style.transform = 'scale(0)';
        setTimeout(() => t.remove(), 150);
        updateHUD();
        if (tapped >= targets) {
          endGame(true);
          return;
        }
        setTimeout(spawnTarget, 300 + Math.random() * 500);
      };
      arena.appendChild(t);
      setTimeout(() => {
        if (ended) return;
        if (t.parentNode && tapped < targets) {
          t.remove();
          missed++;
          updateHUD();
          if (missed > missAllowed) {
            endGame(false);
            return;
          }
          spawnTarget();
        }
      }, 2500);
    };

    const endGame = (passed) => {
      if (ended) return;
      ended = true;
      clearInterval(this._timer);
      ov.innerHTML = `
        <div style="max-width:400px;padding:24px;background:#0d0d1a;border:3px solid ${passed ? '#00ff88' : '#ff4444'};text-align:center;">
          <div style="font-size:22px;margin-bottom:12px;">${passed ? '🎉 BERHASIL!' : '💀 GAGAL'}</div>
          <div style="color:#aaa;margin-bottom:8px;">Berhasil tap: ${tapped}/${targets}</div>
          ${passed ? `<div style="color:#00ff88;margin-bottom:16px;">+Rp ${rewardMoney.toLocaleString()} &amp; +${rewardHappiness}%</div>` : '<div style="color:#aaa;margin-bottom:16px;">Coba lagi!</div>'}
          <button id="mg-close" style="padding:10px 24px;background:${passed ? '#004422' : '#220000'};border:2px solid ${passed ? '#00ff88' : '#ff4444'};color:#fff;cursor:pointer;font-size:14px;">Tutup</button>
        </div>`;
      ov.querySelector('#mg-close').onclick = () => {
        this.stop();
        if (passed && onWin) onWin({ tapped, targets, rewardMoney, rewardHappiness });
        if (onClose) onClose();
      };
    };

    updateHUD();
    spawnTarget();
    setTimeout(spawnTarget, 600);

    this._timer = setInterval(() => {
      timeLeft -= 0.1;
      updateHUD();
      if (timeLeft <= 0) endGame(tapped >= targets);
    }, 100);
  },

  stop() {
    clearInterval(this._timer);
    this._timer = null;
    const existing = document.getElementById('minigame-overlay');
    if (existing) existing.remove();
    this._overlay = null;
  }
};

export default TapGame;
