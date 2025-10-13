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
  maxNumber: 20,
  minNumber: 1,
  variables: ['x', 'y', 'z', 'a', 'b', 'c', 'n', 'm'],
  maxScoresToStore: 50,
  timeLimits: { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 },
  basePoints: { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 }
};


let state = {
  scoreHistory: [],
  highScore: localStorage.getItem('algebraHighScore') || 0,
  score: 0,
  streak: 0,
  currentEquation: null,
  solution: null,
  data: 'algebraScores',
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
  stepsSelect: document.getElementById('steps')
};

// Initialize game
elements.startBtn.addEventListener('click', initGame);
elements.checkBtn.addEventListener('click', checkAnswer);
elements.answer.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') checkAnswer();
});
document.getElementById('printChartBtn').addEventListener('click', () => printScoreChart(state));
document.getElementById('newGameBtn').addEventListener('click', () => {
  toggleChart(state, 'all', false);
  initGame();
});

function initGame() {
  state.score = 0;
  state.streak = 0;
  state.gameActive = true;
  updateStats(elements, state);
  elements.startBtn.disabled = true;
  state.currentLevel = parseInt(elements.stepsSelect.value);
  elements.checkBtn.disabled = false;
  elements.answer.disabled = false;
  elements.stepsSelect.disabled = true;
  generateEquation();
  elements.answer.focus();
}

function generateEquation() {
  if (!state.gameActive) return;
  
  let equation, solution, latex;
  let attempts = 0;
  const maxAttempts = 100;
  const variable = config.variables[Math.floor(Math.random() * config.variables.length)];
  
  while (attempts < maxAttempts) {
    solution = randomInt();
    const steps = state.currentLevel;
    
    switch (steps) {
      case 1:
        const type1 = ['add', 'subtract', 'multiply', 'divide'][Math.floor(Math.random() * 4)];
        switch (type1) {
          case 'add':
            const a1 = randomInt();
            equation = `${variable} + ${a1} = ${solution + a1}`;
            latex = `${variable} + ${a1} = ${solution + a1}`;
            break;
          case 'subtract':
            const a2 = randomInt();
            equation = `${variable} - ${a2} = ${solution - a2}`;
            latex = `${variable} - ${a2} = ${solution - a2}`;
            break;
          case 'multiply':
            const a3 = randomInt(1);
            equation = `${a3}${variable} = ${a3 * solution}`;
            latex = `${a3}${variable} = ${a3 * solution}`;
            break;
          case 'divide':
            const a4 = randomInt(1);
            equation = `${variable}/${a4} = ${solution/a4}`;
            latex = `\\frac{${variable}}{${a4}} = ${solution/a4}`;
            if (!Number.isInteger(solution / a4)) continue;
            break;
        }
        break;
        
      case 2:
        const type2 = ['add-multiply', 'subtract-divide', 'add-divide', 'subtract-multiply'][Math.floor(Math.random() * 4)];
        switch (type2) {
          case 'add-multiply':
            const a5 = randomInt(1);
            const b5 = randomInt();
            equation = `${a5}${variable} + ${b5} = ${a5 * solution + b5}`;
            latex = `${a5}${variable} + ${b5} = ${a5 * solution + b5}`;
            break;
          case 'subtract-divide':
            const a6 = randomInt(1);
            const b6 = randomInt();
            equation = `${variable}/${a6} - ${b6} = ${solution/a6 - b6}`;
            latex = `\\frac{${variable}}{${a6}} - ${b6} = ${solution/a6 - b6}`;
            if (!Number.isInteger(solution / a6 - b6)) continue;
            break;
          case 'add-divide':
            const a7 = randomInt(1);
            const b7 = randomInt();
            equation = `(${variable} + ${b7})/${a7} = ${(solution + b7)/a7}`;
            latex = `\\frac{${variable} + ${b7}}{${a7}} = ${(solution + b7)/a7}`;
            if (!Number.isInteger((solution + b7) / a7)) continue;
            break;
          case 'subtract-multiply':
            const a8 = randomInt(1);
            const b8 = randomInt();
            equation = `${a8}(${variable} - ${b8}) = ${a8 * (solution - b8)}`;
            latex = `${a8}(${variable} - ${b8}) = ${a8 * (solution - b8)}`;
            break;
        }
        break;
        
      case 3:
        const type3 = ['combine-like', 'distribute-divide', 'multi-operations'][Math.floor(Math.random() * 3)];
        switch (type3) {
          case 'combine-like':
            const a9 = randomInt(1);
            const b9 = randomInt(1);
            const c9 = randomInt();
            equation = `${a9}${variable} + ${b9}${variable} + ${c9} = ${(a9 + b9) * solution + c9}`;
            latex = `${a9}${variable} + ${b9}${variable} + ${c9} = ${(a9 + b9) * solution + c9}`;
            break;
          case 'distribute-divide':
            const a10 = randomInt(1);
            const b10 = randomInt();
            const c10 = randomInt(1);
            equation = `(${a10}${variable} + ${b10})/${c10} = ${(a10 * solution + b10)/c10}`;
            latex = `\\frac{${a10}${variable} + ${b10}}{${c10}} = ${(a10 * solution + b10)/c10}`;
            if (!Number.isInteger((a10 * solution + b10) / c10)) continue;
            break;
          case 'multi-operations':
            const a11 = randomInt(1);
            const b11 = randomInt();
            const c11 = randomInt(1);
            equation = `${a11}${variable}/${c11} + ${b11} = ${a11 * solution / c11 + b11}`;
            latex = `\\frac{${a11}${variable}}{${c11}} + ${b11} = ${a11 * solution / c11 + b11}`;
            if (!Number.isInteger(a11 * solution / c11 + b11)) continue;
            break;
        }
        break;
        
      case 4:
        const type4 = ['nested-parentheses', 'multi-fractions', 'combined-operations'][Math.floor(Math.random() * 3)];
        switch (type4) {
          case 'nested-parentheses':
            const a12 = randomInt(1);
            const b12 = randomInt();
            const c12 = randomInt();
            const d12 = randomInt(1);
            equation = `${a12}(${variable} + ${b12}) + ${c12} = ${d12 * solution}`;
            latex = `${a12}(${variable} + ${b12}) + ${c12} = ${d12 * solution}`;
            if (a12 * (solution + b12) + c12 !== d12 * solution) continue;
            break;
          case 'multi-fractions':
            const a13 = randomInt(1);
            const b13 = randomInt(1);
            const c13 = randomInt();
            equation = `${variable}/${a13} + ${variable}/${b13} = ${c13}`;
            latex = `\\frac{${variable}}{${a13}} + \\frac{${variable}}{${b13}} = ${c13}`;
            if (solution / a13 + solution / b13 !== c13) continue;
            break;
          case 'combined-operations':
            const a14 = randomInt(1);
            const b14 = randomInt();
            const c14 = randomInt(1);
            const d14 = randomInt();
            equation = `${a14}${variable} + ${b14} = ${c14}${variable} - ${d14}`;
            latex = `${a14}${variable} + ${b14} = ${c14}${variable} - ${d14}`;
            if (a14 * solution + b14 !== c14 * solution - d14) continue;
            break;
        }
        break;
        
      case 5:
        const type5 = ['complex-fractions', 'multiple-terms', 'advanced-distribution'][Math.floor(Math.random() * 3)];
        switch (type5) {
          case 'complex-fractions':
            const a15 = randomInt(1);
            const b15 = randomInt(1);
            const c15 = randomInt(1);
            const d15 = randomInt();
            equation = `(${variable}/${a15} + ${b15})/${c15} = ${d15}`;
            latex = `\\frac{\\frac{${variable}}{${a15}} + ${b15}}{${c15}} = ${d15}`;
            if ((solution / a15 + b15) / c15 !== d15) continue;
            break;
          case 'multiple-terms':
            const a16 = randomInt(1);
            const b16 = randomInt(1);
            const c16 = randomInt();
            const d16 = randomInt();
            const e16 = randomInt();
            equation = `${a16}${variable} + ${b16}${variable} + ${c16} = ${d16}${variable} + ${e16}`;
            latex = `${a16}${variable} + ${b16}${variable} + ${c16} = ${d16}${variable} + ${e16}`;
            if ((a16 + b16) * solution + c16 !== d16 * solution + e16) continue;
            break;
          case 'advanced-distribution':
            const a17 = randomInt(1);
            const b17 = randomInt();
            const c17 = randomInt(1);
            const d17 = randomInt();
            const e17 = randomInt();
            equation = `${a17}(${variable} + ${b17}) + ${c17} = ${d17}(${variable} - ${e17})`;
            latex = `${a17}(${variable} + ${b17}) + ${c17} = ${d17}(${variable} - ${e17})`;
            if (a17 * (solution + b17) + c17 !== d17 * (solution - e17)) continue;
            break;
        }
        break;
    }
    
    if (Number.isInteger(solution)) {
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
  
  state.currentEquation = '2x + 3 = 13';
  state.solution = 5;
  renderEquation('2x + 3 = 13');
  startEquationTimer(state, elements, config, updateStats, endGame);
}

function renderEquation(latex) {
  elements.mathDisplay.innerHTML = `\\( ${latex} \\)`;
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise();
  }
}

function randomInt(min = config.minNumber, max = config.maxNumber) {
  min = Math.min(min, max);
  max = Math.max(min, max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    localStorage.setItem('algebraHighScore', state.highScore);
  }
  
  if (state.scoreHistory.length >= config.maxScoresToStore) {
    state.scoreHistory.shift();
  }
  state.scoreHistory.push(scoreEvent);
}

function checkAnswer() {
  if (!state.gameActive) return;
  
  const playerAnswer = parseInt(elements.answer.value);
  
  if (isNaN(playerAnswer)) {
    showFeedback(elements, 'Please enter an integer', false);
    return;
  }
  
  clearTimeout(state.equationTimer);
  
  if (playerAnswer === state.solution) {
    const timeTaken = (Date.now() - state.equationStartTime) / 1000;
    const basePoints = config.basePoints[state.currentLevel];
    const timeLimit = config.timeLimits[state.currentLevel];
    
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