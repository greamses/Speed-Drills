
const memoryStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
  },
  removeItem: function(key) {
    delete this.data[key];
  }
};

export function startEquationTimer(state, elements, config, updateStats, endGame) {
  clearTimeout(state.equationTimer);
  
  const timeLimit = config.timeLimits[state.currentLevel || state.currentDifficulty];
  state.equationTimeRemaining = timeLimit;
  state.equationStartTime = Date.now();
  
  elements.equationTimer.style.transition = 'none';
  elements.equationTimer.style.width = '100%';
  
  void elements.equationTimer.offsetWidth;
  
  elements.equationTimer.style.transition = `width ${timeLimit}s linear`;
  elements.equationTimer.style.width = '0%';
  
  state.equationTimer = setTimeout(() => {
    if (state.gameActive) {
      showFeedback(elements, 'Time\'s up!', false);
      state.streak = 0;
      updateStats(elements, state);
      endGame(elements, state, 'all', false);
    }
  }, timeLimit * 1000);
}

export function showFeedback(elements, message, isCorrect) {
  elements.feedback.textContent = message;
  elements.feedback.className = isCorrect ? 'correct' : 'incorrect';
}

export function renderScoreChart(state, level = 'all') {
  const canvas = document.getElementById('scoreChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let allScores = [];
  
  try {
    const scoresData = memoryStorage.getItem(state.data);
    allScores = scoresData ? JSON.parse(scoresData) : [];
    if (!Array.isArray(allScores)) {
      allScores = [];
      memoryStorage.setItem(state.data, JSON.stringify(allScores));
    }
  } catch (e) {
    console.error('Error parsing scores from storage', e);
    allScores = [];
    memoryStorage.setItem(state.data, JSON.stringify(allScores));
  }
  
  let filteredScores = allScores;
  if (level !== 'all') {
    filteredScores = allScores.filter(score => score.level == level);
  }
  
  const currentSessionScore = state.score;
  
  if (!state.gameActive && currentSessionScore > 0) {
    const lastSession = allScores[allScores.length - 1];
    if (!lastSession || lastSession.score !== currentSessionScore) {
      allScores.push({
        score: currentSessionScore,
        timestamp: new Date().toISOString(),
        level: state.currentLevel || state.currentDifficulty
      });
      try {
        memoryStorage.setItem(state.data, JSON.stringify(allScores));
      } catch (e) {
        console.error('Error saving scores to storage', e);
      }
    }
  }
  
  const highScore = Math.max(...filteredScores.map(s => s ? s.score : 0), currentSessionScore, 0);
  
  if (window.scoreChartInstance && typeof window.scoreChartInstance.destroy === 'function') {
    window.scoreChartInstance.destroy();
  }
  
  const noDataMessage = document.getElementById('noDataMessage');
  if (filteredScores.length === 0) {
    if (canvas) canvas.style.display = 'none';
    if (noDataMessage) noDataMessage.style.display = 'block';
    return;
  } else {
    if (canvas) canvas.style.display = 'block';
    if (noDataMessage) noDataMessage.style.display = 'none';
  }
  
  try {
    // Check if Chart.js is available
    if (typeof Chart !== 'undefined') {
      window.scoreChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: filteredScores.map((_, i) => `Session ${i + 1}`),
          datasets: [
            {
              label: 'Session Scores',
              data: filteredScores.map(s => s ? s.score : 0),
              backgroundColor: filteredScores.map(s =>
                s && s.score === highScore ?
                'rgba(255, 99, 132, 0.7)' :
                'rgba(54, 162, 235, 0.7)'
              ),
              borderColor: filteredScores.map(s =>
                s && s.score === highScore ?
                'rgba(255, 99, 132, 1)' :
                'rgba(54, 162, 235, 1)'
              ),
              borderWidth: 1
            },
            {
              label: 'High Score',
              data: filteredScores.map(() => highScore),
              type: 'line',
              borderColor: 'rgba(255, 206, 86, 1)',
              borderWidth: 2,
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Score'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Game Sessions'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  if (context.datasetIndex === 0) {
                    return `Score: ${context.raw}`;
                  } else {
                    return `High Score: ${context.raw}`;
                  }
                },
                afterLabel: function(context) {
                  if (context.datasetIndex === 0) {
                    const dataIndex = context.dataIndex;
                    const scoreData = filteredScores[dataIndex];
                    return `Level: ${scoreData.level}\nTime: ${scoreData.timeTaken?.toFixed(1) || 'N/A'}s`;
                  }
                  return '';
                }
              }
            }
          }
        }
      });
    }
  } catch (e) {
    console.error('Error creating chart:', e);
    if (canvas) canvas.style.display = 'none';
    if (noDataMessage) noDataMessage.style.display = 'block';
  }
}

export function printScoreChart(state) {
  const canvas = document.getElementById('scoreChart');
  if (!canvas) return;
  
  const dataUrl = canvas.toDataURL('image/png');
  
  const win = window.open();
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Equation Game Score Chart</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; }
        img { max-width: 100%; }
        .chart-info { margin: 20px; }
      </style>
    </head>
    <body>
      <h1>Equation Game Performance</h1>
      <div class="chart-info">
        <p>Final Score: ${state.score}</p>
        <p>High Score: ${state.highScore}</p>
        <p>Date: ${new Date().toLocaleString()}</p>
      </div>
      <img src="${dataUrl}" alt="Score Chart">
      <button class="print-out" onclick="window.print()">Print Chart</button>
    </body>
    </html>
  `);
  win.document.close();
}

export function updateStats(elements, state) {
  elements.score.textContent = `Score: ${state.score}`;
  elements.streak.textContent = `Streak: ${state.streak}`;
}

export function updateProgress(elements, config) {
  const newWidth = Math.min(100,
    parseFloat(elements.progress.style.width || '0') + config.progressPerCorrect);
  elements.progress.style.width = `${newWidth}%`;
}

export function endGame(elements, state, level, victory = false) {
  clearTimeout(state.equationTimer);
  state.gameActive = false;
  
  if (victory) {
    showFeedback(elements, `You won! Final score: ${state.score}`, true);
  } else {
    showFeedback(elements, `Game over! Final score: ${state.score}`, false);
  }
  
  if (state.score > state.highScore) {
    state.highScore = state.score;
    memoryStorage.setItem('algebraHighScore', state.highScore);
    showFeedback(elements, `New high score! Previous: ${state.highScore}`, true);
  }
  
  elements.checkBtn.disabled = true;
  elements.answer.disabled = true;
  elements.startBtn.disabled = false;
  if (elements.stepsSelect) elements.stepsSelect.disabled = false;
  toggleChart(state, level, true);
}

export function toggleChart(state, level, show = true) {
  const chartContainer = document.getElementById('chartContainer');
  if (chartContainer) {
    if (show) {
      chartContainer.classList.add('active');
      setTimeout(() => {
        renderScoreChart(state, level);
        updateChartStats(state);
      }, 50);
    } else {
      chartContainer.classList.remove('active');
    }
  }
}

export function setupLevelToggleButtons(state, elements) {
  const toggleButtons = document.querySelectorAll('.level-toggle-btn');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      toggleButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      const level = button.dataset.level;
      renderScoreChart(state, level);
    });
  });
}

export function updateChartStats(state) {
  const currentScoreDisplay = document.getElementById('currentScoreDisplay');
  const highScoreDisplay = document.getElementById('highScoreDisplay');
  const highScoreValue = document.getElementById('highScoreValue');
  const avgTimeDisplay = document.getElementById('avgTimeDisplay');
  
  if (currentScoreDisplay) currentScoreDisplay.textContent = state.score;
  if (highScoreDisplay) highScoreDisplay.textContent = state.highScore;
  if (highScoreValue) highScoreValue.textContent = state.highScore;
  
  if (state.gameSessionScores && state.gameSessionScores.length > 0 && avgTimeDisplay) {
    const totalTime = state.gameSessionScores.reduce((sum, score) => sum + (score.timeTaken || 0), 0);
    const avgTime = (totalTime / state.gameSessionScores.length).toFixed(1);
    avgTimeDisplay.textContent = avgTime;
  }
}

export function showLevels(elements) {
  const selectButtons = document.querySelectorAll('.select-button');
  
  selectButtons.forEach(button => {
    const selectContainer = button.parentElement;
    const dropdown = selectContainer.querySelector('.select-dropdown');
    const options = dropdown.querySelectorAll('.select-option');
    const hiddenSelect = selectContainer.querySelector('select');
    const selectedValue = button.querySelector('.selected-value');
    
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', !isExpanded);
      dropdown.setAttribute('aria-hidden', isExpanded);
    });
    
    options.forEach(option => {
      option.addEventListener('click', () => {
        const value = option.getAttribute('data-value');
        const text = option.textContent;
        
        selectedValue.textContent = text;
        button.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
        
        hiddenSelect.value = value;
        
        options.forEach(opt => opt.setAttribute('aria-selected', 'false'));
        option.setAttribute('aria-selected', 'true');
        
        hiddenSelect.dispatchEvent(new Event('change'));
      });
    });
    
    document.addEventListener('click', (e) => {
      if (!selectContainer.contains(e.target)) {
        button.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('aria-hidden', 'true');
      }
    });
    
    button.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        button.setAttribute('aria-expanded', 'true');
        dropdown.setAttribute('aria-hidden', 'false');
        
        const focusedOption = dropdown.querySelector('[aria-selected="true"]') || options[0];
        focusedOption.focus();
      }
    });
    
    options.forEach((option, index) => {
      option.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextOption = options[index + 1] || options[0];
          nextOption.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevOption = options[index - 1] || options[options.length - 1];
          prevOption.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          option.click();
        } else if (e.key === 'Escape') {
          button.setAttribute('aria-expanded', 'false');
          dropdown.setAttribute('aria-hidden', 'true');
          button.focus();
        }
      });
    });
    
    const selectedOption = dropdown.querySelector(`[data-value="${hiddenSelect.value}"]`);
    if (selectedOption) {
      selectedValue.textContent = selectedOption.textContent;
      selectedOption.setAttribute('aria-selected', 'true');
    }
  });
}

// Export as default array to match your import pattern
export default [
  startEquationTimer,
  showFeedback,
  renderScoreChart,
  printScoreChart,
  updateStats,
  updateProgress,
  endGame,
  toggleChart,
  setupLevelToggleButtons,
  updateChartStats,
  showLevels
];