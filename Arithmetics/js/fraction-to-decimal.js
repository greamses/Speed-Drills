import modules from '../../modules.js';

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
  maxScoresToStore: 50,
  timeLimits: {
    1: 15,  // Recurring decimals (3,6,9)
    2: 12,  // Power decimals (2,4,8)
    3: 20,  // Circle decimals (7)
    4: 10,  // Proper fractions
    5: 15,  // Mixed fractions
    6: 12   // Improper fractions
  },
  basePoints: {
    1: 15,
    2: 15,
    3: 20,
    4: 10,
    5: 15,
    6: 15
  },
  denominators: {
    1: [3, 6, 9],
    2: [2, 4, 8],
    3: [7],
    4: [2, 3, 4, 5, 6, 7, 8, 9],
    5: [2, 3, 4, 5, 6, 7, 8, 9],
    6: [2, 3, 4, 5, 6, 7, 8, 9]
  }
};

let state = {
  scoreHistory: [],
  highScore: localStorage.getItem('fractionsHighScore') || 0,
  score: 0,
  streak: 0,
  currentEquation: null,
  solution: null,
  data: 'fractionsScores',
  equationTimer: null,
  equationTimeRemaining: 0,
  gameActive: false,
  gameSessionScores: [],
  currentLevel: 1,
  currentStep: 1,
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

// Initialize game event listeners
function initEventListeners() {
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
}

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
  
  let numerator, denominator, wholeNumber;
  const denoms = config.denominators[state.currentLevel];
  
  // Create weighted denominator options
  let weightedDenominators = [];
  denoms.forEach(d => {
    const count = d - 1; // Number of possible numerators
    weightedDenominators.push(...Array(count).fill(d));
  });
  
  denominator = weightedDenominators[Math.floor(Math.random() * weightedDenominators.length)];
  
  switch(state.currentLevel) {
    case 1: case 2: case 4: // Proper fractions
      numerator = Math.floor(Math.random() * (denominator-1)) + 1;
      state.solution = parseFloat((numerator / denominator).toFixed(3));
      state.currentEquation = `${numerator}/${denominator} ≈ ?`;
      renderEquation(`\\frac{${numerator}}{${denominator}} \\approx ?`);
      break;
      
    case 3: // Sevenths
      numerator = Math.floor(Math.random() * 6) + 1;
      denominator = 7;
      state.solution = parseFloat((numerator / denominator).toFixed(3));
      state.currentEquation = `${numerator}/7 ≈ ?`;
      renderEquation(`\\frac{${numerator}}{7} \\approx ?`);
      break;
      
    case 5: // Mixed fractions
      wholeNumber = Math.floor(Math.random() * 3) + 1; // 1-3
      numerator = Math.floor(Math.random() * (denominator-1)) + 1;
      state.solution = parseFloat((wholeNumber + numerator/denominator).toFixed(3));
      state.currentEquation = `${wholeNumber} ${numerator}/${denominator} ≈ ?`;
      renderEquation(`${wholeNumber}\\frac{${numerator}}{${denominator}} \\approx ?`);
      break;
      
    case 6: // Improper fractions
      numerator = Math.floor(Math.random() * 8) + denominator; // numerator ≥ denominator
      state.solution = parseFloat((numerator / denominator).toFixed(3));
      state.currentEquation = `${numerator}/${denominator} ≈ ?`;
      renderEquation(`\\frac{${numerator}}{${denominator}} \\approx ?`);
      break;
  }
  
  elements.answer.value = '';
  elements.feedback.textContent = '';
  elements.feedback.className = '';
  startEquationTimer(state, elements, config, updateStats, endGame);
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
  const tolerance = 0.0005; // For 3 decimal place rounding
  
  if (Math.abs(playerAnswer - state.solution) < tolerance) {
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
    showFeedback(elements, `❌ The answer was ${state.solution.toFixed(3)}`, false);
    updateStats(elements, state);
    endGame(elements, state, 'all', false);
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
    localStorage.setItem('fractionsHighScore', state.highScore);
  }
  
  if (state.scoreHistory.length >= config.maxScoresToStore) {
    state.scoreHistory.shift();
  }
  state.scoreHistory.push(scoreEvent);
}

function renderEquation(latex) {
  elements.mathDisplay.innerHTML = `\\( ${latex} \\)`;
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof MathJax !== 'undefined') {
    MathJax.startup.promise.then(() => {
      renderEquation("");
    });
  }
  initEventListeners();
  showLevels(elements);
  setupLevelToggleButtons(state, elements);
});
