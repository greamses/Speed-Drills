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
  maxNumber: 100,
  minNumber: 1,
  variables: ['x', 'y', 'z'],
  maxScoresToStore: 50,
  timeLimits: {
    1: 10,
    2: 15,
    3: 20,
    4: 25,
    5: 20,
    6: 20,
    7: 25,
    8: 25
  },
  basePoints: {
    1: 10,
    2: 15,
    3: 20,
    4: 25,
    5: 20,
    6: 20,
    7: 25,
    8: 25
  }
};

let state = {
  scoreHistory: [],
  highScore: localStorage.getItem('percentHighScore') || 0,
  score: 0,
  streak: 0,
  currentEquation: null,
  solution: null,
  data: 'percentScores',
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

// ... (keep all the imports, config, state, and elements declarations the same)

function generateEquation() {
  if (!state.gameActive) return;
  
  let equation, solution, latex;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const percent = randomMultipleOf5(5, 100);
    
    switch (state.currentLevel) {
      case 1: // Basic percent of number
        const number1 = randomMultipleOf5(10, 200);
        solution = Math.round((percent * number1) / 100);
        equation = `${percent}% of ${number1} = ?`;
        latex = `${percent}\\% \\times ${number1} = ?`;
        break;
        
      case 2: // Find base number
        const result2 = randomMultipleOf5(10, 100);
        solution = Math.round((result2 * 100) / percent);
        equation = `${percent}% of ? = ${result2}`;
        latex = `${percent}\\% \\times ? = ${result2}`;
        break;
        
      case 3: // Percent of percent
        const percent3 = randomMultipleOf5(5, 100);
        const base3 = findCommonBase(percent, percent3);
        solution = Math.round((percent * percent3 * base3) / 10000);
        equation = `${percent}% of ${percent3}% of ${base3} = ?`;
        latex = `${percent}\\% \\times ${percent3}\\% \\times ${base3} = ?`;
        break;
        
      case 4: // Find base from percent of percent
        const percent4 = randomMultipleOf5(5, 100);
        const result4 = randomMultipleOf5(10, 100);
        solution = Math.round((result4 * 10000) / (percent * percent4));
        equation = `${percent}% of ${percent4}% of ? = ${result4}`;
        latex = `${percent}\\% \\times ${percent4}\\% \\times ? = ${result4}`;
        break;
        
      case 5: // Percent increase
        const number5 = randomMultipleOf5(10, 100);
        solution = Math.round(number5 + (percent * number5) / 100);
        equation = `Increase ${number5} by ${percent}% = ?`;
        latex = `(100\\% + ${percent}\\%) \\times ${number5} = ?`;
        break;
        
      case 6: // Percent decrease
        const number6 = randomMultipleOf5(10, 100);
        solution = Math.round(number6 - (percent * number6) / 100);
        equation = `Decrease ${number6} by ${percent}% = ?`;
        latex = `(100\\% - ${percent}\\%) \\times ${number6} = ?`;
        break;
        
      case 7: // Find original before increase
        const result7 = randomMultipleOf5(20, 200);
        solution = Math.round((result7 * 100) / (100 + percent));
        equation = `After ${percent}% increase = ${result7}. Original?`;
        latex = `(100\\% + ${percent}\\%) \\times ? = ${result7}`;
        break;
        
      case 8: // Find original before decrease
        const result8 = randomMultipleOf5(20, 200);
        solution = Math.round((result8 * 100) / (100 - percent));
        equation = `After ${percent}% decrease = ${result8}. Original?`;
        latex = `(100\\% - ${percent}\\%) \\times ? = ${result8}`;
        break;
    }
    
    if (solution && Number.isInteger(solution) && solution > 0) {
      state.currentEquation = equation;
      state.solution = solution;
      renderEquation(latex);
      elements.answer.value = '';
      elements.feedback.textContent = '';
      elements.feedback.className = '';
      startEquationTimer(state, elements, config, updateStats, endGame);
      return;
    }
    
    attempts++;
  }
  
  state.currentEquation = '25% of 200 = ?';
  state.solution = 50;
  renderEquation('25\\% \\times 200 = ?');
  startEquationTimer(state, elements, config, updateStats, endGame);
}

function randomMultipleOf5(min, max) {
  min = Math.ceil(min / 5) * 5;
  max = Math.floor(max / 5) * 5;
  return Math.floor(Math.random() * ((max - min) / 5 + 1)) * 5 + min;
}

function findCommonBase(pct1, pct2) {
  const gcdVal = gcd(pct1, pct2);
  const factor = (pct1 * pct2) / gcdVal;
  return randomMultipleOf5(1, 10) * factor;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
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
    localStorage.setItem('percentHighScore', state.highScore);
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