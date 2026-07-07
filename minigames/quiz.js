// ===================== QUIZ GAME - TEMPLATE =====================
// Mini game: Kuis tentang kota
// Trigger: Click pada school building

/**
 * Quiz Game Class
 * Struktur standard untuk mini game
 */
class QuizGame {
  constructor(config) {
    this.config = config;
    this.score = 0;
    this.questions = [
      {
        question: "Berapa banyak warga yang dibutuhkan untuk memulai kota?",
        options: ["10", "50", "100", "500"],
        correct: 1
      },
      {
        question: "Apa nama presiden di kota Nusabox?",
        options: ["Pak Wiwi", "The President", "Acel", "Pak Budi"],
        correct: 1
      },
      {
        question: "Berapa biaya untuk membangun jalan?",
        options: ["$20", "$50", "$100", "$200"],
        correct: 1
      },
      {
        question: "Bangunan apa yang memberikan listrik?",
        options: ["School", "Hospital", "Power Plant", "Park"],
        correct: 2
      },
      {
        question: "Apa yang paling penting untuk kebahagiaan warga?",
        options: ["Uang", "Fasilitas", "Hiburan", "Semua di atas"],
        correct: 3
      }
    ];
    this.currentQuestion = 0;
  }

  /**
   * Main method - harus return Promise
   * @returns {Promise}
   */
  start() {
    return new Promise((resolve) => {
      this.showGameUI(resolve);
    });
  }

  /**
   * Tampilkan UI game
   * @private
   */
  showGameUI(onComplete) {
    // Container game
    const container = document.createElement('div');
    container.id = 'quiz-game-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      font-family: Arial, sans-serif;
    `;

    // Game box
    const gameBox = document.createElement('div');
    gameBox.style.cssText = `
      background-color: rgba(20, 20, 20, 0.95);
      border: 3px solid gold;
      border-radius: 15px;
      padding: 40px;
      color: white;
      text-align: center;
      max-width: 600px;
      width: 90%;
    `;

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Kuis Kota Nusabox';
    title.style.cssText = `
      color: gold;
      margin-bottom: 30px;
      font-size: 28px;
    `;
    gameBox.appendChild(title);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      background-color: rgba(255, 255, 255, 0.1);
      height: 10px;
      border-radius: 5px;
      margin-bottom: 30px;
      overflow: hidden;
    `;
    const progress = document.createElement('div');
    progress.style.cssText = `
      background-color: gold;
      height: 100%;
      width: ${(this.currentQuestion / this.questions.length) * 100}%;
      transition: width 0.3s;
    `;
    progressBar.appendChild(progress);
    gameBox.appendChild(progressBar);

    // Question
    const questionDiv = document.createElement('div');
    questionDiv.style.cssText = `
      font-size: 20px;
      margin-bottom: 30px;
      line-height: 1.5;
    `;
    questionDiv.textContent = this.questions[this.currentQuestion].question;
    gameBox.appendChild(questionDiv);

    // Options
    const optionsDiv = document.createElement('div');
    optionsDiv.style.cssText = `
      text-align: left;
      margin-bottom: 30px;
    `;

    this.questions[this.currentQuestion].options.forEach((option, index) => {
      const button = document.createElement('button');
      button.textContent = option;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 15px;
        margin-bottom: 10px;
        background-color: rgba(100, 100, 100, 0.5);
        color: white;
        border: 2px solid gold;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;
      `;

      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = 'rgba(150, 150, 150, 0.7)';
      });

      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'rgba(100, 100, 100, 0.5)';
      });

      button.addEventListener('click', () => {
        this.answerQuestion(index, progress, onComplete, container);
      });

      optionsDiv.appendChild(button);
    });

    gameBox.appendChild(optionsDiv);

    // Score display
    const scoreDiv = document.createElement('div');
    scoreDiv.style.cssText = `
      font-size: 14px;
      color: #aaa;
    `;
    scoreDiv.textContent = `Soal ${this.currentQuestion + 1}/${this.questions.length}`;
    gameBox.appendChild(scoreDiv);

    container.appendChild(gameBox);
    document.body.appendChild(container);
  }

  /**
   * Handle answer
   * @private
   */
  answerQuestion(selectedIndex, progressBar, onComplete, container) {
    const question = this.questions[this.currentQuestion];
    
    if (selectedIndex === question.correct) {
      this.score++;
    }

    this.currentQuestion++;

    if (this.currentQuestion < this.questions.length) {
      // Remove container dan show next question
      document.body.removeChild(container);
      this.showGameUI(onComplete);
    } else {
      // Game complete
      this.showResult(onComplete, container);
    }
  }

  /**
   * Tampilkan hasil akhir
   * @private
   */
  showResult(onComplete, container) {
    const resultBox = container.querySelector('div > div');
    resultBox.innerHTML = '';

    // Title
    const title = document.createElement('h1');
    title.textContent = 'Hasil Kuis';
    title.style.cssText = `
      color: gold;
      margin-bottom: 30px;
      font-size: 28px;
    `;
    resultBox.appendChild(title);

    // Score display
    const scoreDiv = document.createElement('div');
    scoreDiv.style.cssText = `
      font-size: 48px;
      font-weight: bold;
      color: #ffcc00;
      margin-bottom: 10px;
    `;
    scoreDiv.textContent = `${this.score}/${this.questions.length}`;
    resultBox.appendChild(scoreDiv);

    // Percentage
    const percentage = (this.score / this.questions.length) * 100;
    const percentDiv = document.createElement('div');
    percentDiv.style.cssText = `
      font-size: 20px;
      color: #aaa;
      margin-bottom: 30px;
    `;
    percentDiv.textContent = `${percentage.toFixed(0)}%`;
    resultBox.appendChild(percentDiv);

    // Message
    const message = document.createElement('div');
    message.style.cssText = `
      font-size: 16px;
      margin-bottom: 30px;
      line-height: 1.5;
    `;

    if (percentage >= 80) {
      message.textContent = 'Sempurna! Kamu mengerti banget tentang kota ini!';
    } else if (percentage >= 60) {
      message.textContent = 'Bagus! Masih ada yang perlu dipelajari.';
    } else {
      message.textContent = 'Terus belajar! Kamu pasti bisa lebih baik lagi.';
    }

    resultBox.appendChild(message);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Selesai';
    closeBtn.style.cssText = `
      padding: 12px 30px;
      background-color: gold;
      color: black;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    `;

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(container);
      
      // Return result
      const result = {
        completed: true,
        score: this.score,
        total: this.questions.length,
        percentage: percentage,
        money: this.config.rewardMoney,
        happiness: this.config.rewardHappiness * (percentage / 100)
      };

      onComplete(result);
    });

    resultBox.appendChild(closeBtn);
  }
}

// Export untuk digunakan
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuizGame;
}
