import modules from '../../js/modules.js';

const [
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
] = modules;

const config = {
  maxNumber: 1000,
  minNumber: 1,
  variables: ['x', 'y', 'z'],
  maxScoresToStore: 50,
  timeLimits: {
    1: 10, // Level 1 time limit
    2: 15, // Level 2 time limit
    3: 20 // Level 3 time limit
  },
  basePoints: {
    1: 10, // Level 1 base points
    2: 15, // Level 2 base points
    3: 20 // Level 3 base points
  }
};

let state = {
  scoreHistory: [],
  highScore: localStorage.getItem('squarerootHighScore') || 0,
  score: 0,
  streak: 0,
  currentEquation: null,
  solution: null,
  data: 'squarerootScores',
  equationTimer: null,
  equationTimeRemaining: 0,
  gameActive: false,
  gameSessionScores: [],
  currentLevel: 1,
  equationStartTime: 0
};

const elements = {
  equation: document.getElementById('equation'),
  mathDisplay: document.getElementById('math-display'),
  answer: document.getElementById('answer'),
  feedback: document.getElementById('feedback'),
  score: document.getElementById('score'),
  streak: document.getElementById('streak'),
  progress: document.getElementById('progress'),
  checkBtn: document.getElementById('check-btn'),
  startBtn: document.getElementById('start-btn'),
  equationTimer: document.getElementById('equation-timer'),
  stepsSelect: document.getElementById('level')
};

elements.startBtn.addEventListener('click', initGame);
elements.checkBtn.addEventListener('click', checkAnswer);
elements.answer.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') checkAnswer();
});
document.getElementById('printChartBtn').addEventListener('click', printScoreChart);
document.getElementById('newGameBtn').addEventListener('click', () => {
  toggleChart(state, 'all', false);
  initGame();
});

function initGame() {
  state.score = 0;
  state.streak = 0;
  state.gameActive = true;
  state.currentLevel = parseInt(elements.stepsSelect.value);
  updateStats(elements, state);
  elements.startBtn.disabled = true;
  elements.checkBtn.disabled = false;
  elements.answer.disabled = false;
  elements.stepsSelect.disabled = true;
  generateEquation();
  elements.answer.focus();
}

function generateEquation() {
  if (!state.gameActive) return;
  
  let solution;
  
  switch (state.currentLevel) {
    case 1: // 1-digit square roots
      solution = Math.floor(Math.random() * 9) + 1; // 1-9
      break;
      
    case 2: // 2-digit square roots
      solution = Math.floor(Math.random() * 90) + 10; // 10-99
      break;
      
    case 3: // 3-digit square roots
      solution = Math.floor(Math.random() * 900) + 100; // 100-999
      break;
  }
  
  const square = solution * solution;
  const latex = `\\sqrt{${square}} = ?`;
  
  state.currentEquation = `√${square} = ?`;
  state.solution = solution;
  renderEquation(latex);
  elements.answer.value = '';
  elements.feedback.textContent = '';
  elements.feedback.className = '';
  startEquationTimer(state, elements, config, updateStats, endGame);
}

function renderEquation(latex) {
  elements.mathDisplay.innerHTML = `\\( ${latex} \\)`;
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise();
  }
}

function trackScore(points, timeTaken, isStreakBonus = false) {
  const scoreEvent = {
    points,
    timeTaken,
    timestamp: new Date().toISOString(),
    level: state.currentLevel,
    isStreakBonus
  };
  
  state.gameSessionScores.push(scoreEvent);
  
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('squarerootHighScore', state.highScore);
  }
  
  if (state.scoreHistory.length >= config.maxScoresToStore) {
    state.scoreHistory.shift();
  }
  state.scoreHistory.push(scoreEvent);
}

function checkAnswer() {
  if (!state.gameActive) return;
  
  const playerAnswer = parseFloat(elements.answer.value);
  
  if (isNaN(playerAnswer)) {
    showFeedback(elements, 'Please enter a number', false);
    return;
  }
  
  clearTimeout(state.equationTimer);
  
  const timeTaken = (Date.now() - state.equationStartTime) / 1000;
  const basePoints = config.basePoints[state.currentLevel];
  
  if (Math.abs(playerAnswer - state.solution) < 0.01) {
    const reductionPerHalfSecond = 0.05;
    const timeUnits = timeTaken / 0.5;
    const reduction = Math.min(0.99, timeUnits * reductionPerHalfSecond);
    const pointsEarned = Math.max(1, Math.floor(basePoints * (1 - reduction)));
    
    state.score += pointsEarned;
    state.streak++;
    
    trackScore(pointsEarned, timeTaken);
    
    if (state.streak % 5 === 0) {
      const streakBonus = Math.floor(basePoints * 0.2);
      state.score += streakBonus;
      trackScore(streakBonus, timeTaken, true);
      showFeedback(elements, `✅ +${pointsEarned} (${timeTaken.toFixed(1)}s) +${streakBonus} streak!`, true);
    } else {
      showFeedback(elements, `✅ +${pointsEarned} (${timeTaken.toFixed(1)}s)`, true);
    }
    
    updateStats(elements, state);
    setTimeout(generateEquation, 1000);
  } else {
    state.streak = 0;
    showFeedback(elements, `❌ The answer was ${state.solution}`, false);
    updateStats(elements, state);
    endGame(elements, state, 'all', false);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof MathJax !== 'undefined') {
    MathJax.startup.promise.then(() => {
      renderEquation("");
    });
  }
  showLevels(elements);
  setupLevelToggleButtons(state, elements);
});