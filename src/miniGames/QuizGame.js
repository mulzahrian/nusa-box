/**
 * Quiz Minigame - simple trivia game
 */

class QuizGame {
  constructor() {
    this.id = 'quiz';
    this.name = 'Quiz Nusantara';
    this.description = 'Jawab pertanyaan tentang Indonesia!';
    this._container = null;
    this._onComplete = null;
    this._questions = [
      { q: 'Ibukota Indonesia?', options: ['Jakarta', 'Surabaya', 'Bandung', 'Medan'], answer: 0 },
      { q: 'Pulau terbesar di Indonesia?', options: ['Jawa', 'Sumatra', 'Kalimantan', 'Papua'], answer: 2 },
      { q: 'Mata uang Indonesia?', options: ['Ringgit', 'Rupiah', 'Baht', 'Peso'], answer: 1 },
    ];
    this._currentQ = 0;
    this._score = 0;
  }
  
  start(container) {
    this._container = container;
    this._currentQ = 0;
    this._score = 0;
    this._render();
  }
  
  _render() {
    if (!this._container) return;
    const q = this._questions[this._currentQ];
    if (!q) {
      this._showResult();
      return;
    }
    
    this._container.innerHTML = `
      <div style="padding:20px;font-family:var(--font);color:var(--text)">
        <h3 style="color:var(--cyan);font-size:10px">Quiz ${this._currentQ + 1}/${this._questions.length}</h3>
        <p style="font-size:9px;margin:12px 0">${q.q}</p>
        <div id="quiz-options" style="display:flex;flex-direction:column;gap:6px"></div>
      </div>
    `;
    
    const optContainer = this._container.querySelector('#quiz-options');
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.cssText = 'font-size:8px;padding:8px;text-align:left';
      btn.onclick = () => this._answer(i);
      optContainer.appendChild(btn);
    });
  }
  
  _answer(index) {
    const q = this._questions[this._currentQ];
    if (index === q.answer) this._score++;
    this._currentQ++;
    this._render();
  }
  
  _showResult() {
    const passed = this._score >= 2;
    this._container.innerHTML = `
      <div style="padding:20px;font-family:var(--font);color:var(--text);text-align:center">
        <h3 style="color:${passed ? 'var(--green)' : 'var(--red)'};font-size:12px">
          ${passed ? '🎉 Lulus!' : '❌ Gagal'}
        </h3>
        <p style="font-size:9px">Skor: ${this._score}/${this._questions.length}</p>
        <button id="quiz-close" style="margin-top:12px;font-size:8px">Tutup</button>
      </div>
    `;
    this._container.querySelector('#quiz-close').onclick = () => {
      if (passed && this._onComplete) this._onComplete(this._score);
      this.stop();
    };
  }
  
  stop() {
    if (this._container) {
      this._container.innerHTML = '';
      this._container = null;
    }
  }
  
  onComplete(callback) {
    this._onComplete = callback;
  }
}

export default new QuizGame();
