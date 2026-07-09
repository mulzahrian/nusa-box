/**
 * Quiz Minigame — fully self-contained
 * Usage: QuizGame.launch({ questions, name, rewardMoney, rewardHappiness }, onWin, onClose)
 */

const QuizGame = {
  _overlay: null,

  launch(config, onWin, onClose) {
    this.stop();
    const { questions = [], name = 'Kuis', rewardMoney = 0, rewardHappiness = 0 } = config;
    if (!questions.length) return;

    let qi = 0;
    let score = 0;
    const total = questions.length;

    const ov = document.createElement('div');
    ov.id = 'minigame-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.93);display:flex;align-items:center;justify-content:center;z-index:9000;font-family:monospace;';
    document.body.appendChild(ov);
    this._overlay = ov;

    const showQ = () => {
      if (qi >= total) {
        const passed = score >= Math.ceil(total * 0.6);
        ov.innerHTML = `
          <div style="max-width:500px;width:90%;padding:24px;background:#0d0d1a;border:3px solid ${passed ? '#00ff88' : '#ff4444'};box-shadow:0 0 40px ${passed ? '#00ff8844' : '#ff444444'};">
            <div style="font-size:22px;text-align:center;margin-bottom:12px;">${passed ? '🎉 LULUS!' : '❌ GAGAL'}</div>
            <div style="color:#aaa;text-align:center;margin-bottom:8px;">Skor: <b style="color:#fff">${score}/${total}</b></div>
            ${passed ? `<div style="color:#00ff88;text-align:center;margin-bottom:16px;">+Rp ${rewardMoney.toLocaleString()} &amp; +${rewardHappiness}% kebahagiaan</div>` : '<div style="color:#aaa;text-align:center;margin-bottom:16px;">Coba klik gedung lagi untuk main ulang.</div>'}
            <button id="mg-close" style="width:100%;padding:10px;background:${passed ? '#004422' : '#220000'};border:2px solid ${passed ? '#00ff88' : '#ff4444'};color:#fff;cursor:pointer;font-size:14px;">Tutup</button>
          </div>`;
        ov.querySelector('#mg-close').onclick = () => {
          this.stop();
          if (passed && onWin) onWin({ score, total, rewardMoney, rewardHappiness });
          if (onClose) onClose();
        };
        return;
      }

      const q = questions[qi];
      const opts = q.options.map((opt, i) =>
        `<button data-i="${i}" style="padding:10px 12px;background:#1a1a2e;border:2px solid #333;color:#ccc;cursor:pointer;font-size:13px;text-align:left;border-radius:3px;">${opt}</button>`
      ).join('');

      ov.innerHTML = `
        <div style="max-width:520px;width:92%;padding:24px;background:#0d0d1a;border:3px solid #00bbff;box-shadow:0 0 30px #00bbff33;">
          <div style="color:#00bbff;font-size:11px;margin-bottom:6px;">${name} — Soal ${qi + 1} dari ${total}</div>
          <div style="color:#fff;font-size:15px;margin-bottom:18px;line-height:1.5;">${q.q}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;" id="mg-opts">${opts}</div>
          <div style="margin-top:12px;color:#555;font-size:11px;">Skor: ${score}/${qi}</div>
        </div>`;

      ov.querySelectorAll('[data-i]').forEach(btn => {
        btn.onmouseover = () => { if (!btn.disabled) btn.style.borderColor = '#00bbff'; };
        btn.onmouseout = () => { if (!btn.disabled) btn.style.borderColor = '#333'; };
        btn.onclick = () => {
          const chosen = parseInt(btn.dataset.i, 10);
          ov.querySelectorAll('[data-i]').forEach(b => { b.disabled = true; });
          if (chosen === q.answer) {
            score++;
            btn.style.background = '#003322';
            btn.style.borderColor = '#00cc66';
            btn.style.color = '#00ff88';
          } else {
            btn.style.background = '#2a0000';
            btn.style.borderColor = '#cc0000';
            btn.style.color = '#ff6666';
            ov.querySelectorAll('[data-i]').forEach(b => {
              if (parseInt(b.dataset.i, 10) === q.answer) {
                b.style.borderColor = '#00cc66';
                b.style.color = '#00ff88';
              }
            });
          }
          setTimeout(() => { qi++; showQ(); }, 1000);
        };
      });
    };

    showQ();
  },

  stop() {
    const existing = document.getElementById('minigame-overlay');
    if (existing) existing.remove();
    this._overlay = null;
  }
};

export default QuizGame;
