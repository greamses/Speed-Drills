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
  maxNumber: 15,
  minNumber: 1,
  maxScoresToStore: 50,
  timeLimits: { 
    '2-easy': 60, 
    '2-medium': 75, 
    '2-hard': 90,
    '3-easy': 150,
    '3-medium': 180,
    '3-hard': 240
  },
  basePoints: { 
    '2-easy': 20, 
    '2-medium': 35, 
    '2-hard': 50,
    '3-easy': 40,
    '3-medium': 65,
    '3-hard': 100
  }
};

let state = {
  scoreHistory: [],
  highScore: localStorage.getItem('systemsHighScore') || 0,
  score: 0,
  streak: 0,
  currentSystem: null,
  solution: null,
  data: 'systemsScores',
  equationTimer: null,
  equationTimeRemaining: 0,
  gameActive: false,
  gameSessionScores: [],
  currentDifficulty: '2-easy',
  equationStartTime: 0
};

const elements = {
  equation: document.getElementById('equation'),
  mathDisplay: document.getElementById('math-display'),
  xAnswer: document.getElementById('answer1'),
  yAnswer: document.getElementById('answer2'),
  zAnswer: document.getElementById('answer3'),
  zInput: document.getElementById('z-input'),
  answerInputs: document.getElementById('answer-inputs'),
  feedback: document.getElementById('feedback'),
  score: document.getElementById('score'),
  streak: document.getElementById('streak'),
  progress: document.getElementById('progress'),
  checkBtn: document.getElementById('check-btn'),
  startBtn: document.getElementById('start-btn'),
  equationTimer: document.getElementById('equation-timer'),
  difficultySelect: document.getElementById('difficulty')
};

// Initialize game
elements.startBtn.addEventListener('click', initGame);
elements.checkBtn.addEventListener('click', checkAnswer);

// Add enter key support for all answer inputs
[elements.xAnswer, elements.yAnswer, elements.zAnswer].forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });
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
  state.currentDifficulty = elements.difficultySelect.value;
  
  // Show/hide z input based on difficulty
  if (state.currentDifficulty.startsWith('3')) {
    elements.zInput.style.display = 'block';
  } else {
    elements.zInput.style.display = 'none';
  }
  
  elements.checkBtn.disabled = false;
  elements.xAnswer.disabled = false;
  elements.yAnswer.disabled = false;
  elements.zAnswer.disabled = !state.currentDifficulty.startsWith('3');
  elements.difficultySelect.disabled = true;
  
  generateSystem();
  elements.xAnswer.focus();
}

function generateSystem() {
  if (!state.gameActive) return;
  
  let system, solution, latex;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    if (state.currentDifficulty.startsWith('2')) {
      const result = generate2VariableSystem(state.currentDifficulty);
      if (result) {
        system = result.system;
        solution = result.solution;
        latex = result.latex;
        break;
      }
    } else {
      const result = generate3VariableSystem(state.currentDifficulty);
      if (result) {
        system = result.system;
        solution = result.solution;
        latex = result.latex;
        break;
      }
    }
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    // Fallback system
    system = ['2x + y = 7', 'x - y = 2'];
    solution = { x: 3, y: 1 };
    latex = '\\begin{cases} 2x + y = 7 \\\\ x - y = 2 \\end{cases}';
  }
  
  state.currentSystem = system;
  state.solution = solution;
  renderSystem(latex);
  clearInputs();
  elements.feedback.textContent = '';
  elements.feedback.className = '';
  startEquationTimer(state, elements, config, updateStats, endGame);
}

function generate2VariableSystem(difficulty) {
  // Generate integer solution first
  const x = randomInt(-10, 10);
  const y = randomInt(-10, 10);
  
  let maxCoeff;
  switch (difficulty) {
    case '2-easy': maxCoeff = 5; break;
    case '2-medium': maxCoeff = 8; break;
    case '2-hard': maxCoeff = 12; break;
    default: maxCoeff = 5;
  }
  
  // Generate non-zero coefficients for x variables
  let a1 = randomInt(-maxCoeff, maxCoeff);
  while (a1 === 0) a1 = randomInt(-maxCoeff, maxCoeff);
  
  let a2 = randomInt(-maxCoeff, maxCoeff);
  while (a2 === 0) a2 = randomInt(-maxCoeff, maxCoeff);
  
  // Generate non-zero coefficients for y variables
  let b1 = randomInt(-maxCoeff, maxCoeff);
  while (b1 === 0) b1 = randomInt(-maxCoeff, maxCoeff);
  
  let b2 = randomInt(-maxCoeff, maxCoeff);
  while (b2 === 0) b2 = randomInt(-maxCoeff, maxCoeff);
  
  // Calculate right-hand sides using our known solution
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  
  // Format equations
  const eq1 = formatEquation(a1, 'x', b1, 'y', c1);
  const eq2 = formatEquation(a2, 'x', b2, 'y', c2);
  
  const latex1 = formatLatexEquation(a1, 'x', b1, 'y', c1);
  const latex2 = formatLatexEquation(a2, 'x', b2, 'y', c2);
  
  return {
    system: [eq1, eq2],
    solution: { x, y },
    latex: `\\begin{cases} ${latex1} \\\\ ${latex2} \\end{cases}`
  };
}

function generate3VariableSystem(difficulty) {
  // Generate integer solution first
  const x = randomInt(-8, 8);
  const y = randomInt(-8, 8);
  const z = randomInt(-8, 8);
  
  // Generate random coefficients based on difficulty
  let maxCoeff;
  switch (difficulty) {
    case '3-easy': maxCoeff = 3; break;
    case '3-medium': maxCoeff = 5; break;
    case '3-hard': maxCoeff = 8; break;
    default: maxCoeff = 3;
  }
  
  // Generate non-zero coefficients for x variables
  let a1 = randomInt(-maxCoeff, maxCoeff);
  while (a1 === 0) a1 = randomInt(-maxCoeff, maxCoeff);
  
  let a2 = randomInt(-maxCoeff, maxCoeff);
  while (a2 === 0) a2 = randomInt(-maxCoeff, maxCoeff);
  
  let a3 = randomInt(-maxCoeff, maxCoeff);
  while (a3 === 0) a3 = randomInt(-maxCoeff, maxCoeff);
  
  // Generate non-zero coefficients for y variables
  let b1 = randomInt(-maxCoeff, maxCoeff);
  while (b1 === 0) b1 = randomInt(-maxCoeff, maxCoeff);
  
  let b2 = randomInt(-maxCoeff, maxCoeff);
  while (b2 === 0) b2 = randomInt(-maxCoeff, maxCoeff);
  
  let b3 = randomInt(-maxCoeff, maxCoeff);
  while (b3 === 0) b3 = randomInt(-maxCoeff, maxCoeff);
  
  // Generate non-zero coefficients for z variables
  let c1 = randomInt(-maxCoeff, maxCoeff);
  while (c1 === 0) c1 = randomInt(-maxCoeff, maxCoeff);
  
  let c2 = randomInt(-maxCoeff, maxCoeff);
  while (c2 === 0) c2 = randomInt(-maxCoeff, maxCoeff);
  
  let c3 = randomInt(-maxCoeff, maxCoeff);
  while (c3 === 0) c3 = randomInt(-maxCoeff, maxCoeff);
  
  // Calculate right-hand sides using our known solution
  const rhs1 = a1 * x + b1 * y + c1 * z;
  const rhs2 = a2 * x + b2 * y + c2 * z;
  const rhs3 = a3 * x + b3 * y + c3 * z;
  
  // Format equations
  const eq1 = formatEquation3Var(a1, 'x', b1, 'y', c1, 'z', rhs1);
  const eq2 = formatEquation3Var(a2, 'x', b2, 'y', c2, 'z', rhs2);
  const eq3 = formatEquation3Var(a3, 'x', b3, 'y', c3, 'z', rhs3);
  
  const latex1 = formatLatexEquation3Var(a1, 'x', b1, 'y', c1, 'z', rhs1);
  const latex2 = formatLatexEquation3Var(a2, 'x', b2, 'y', c2, 'z', rhs2);
  const latex3 = formatLatexEquation3Var(a3, 'x', b3, 'y', c3, 'z', rhs3);
  
  return {
    system: [eq1, eq2, eq3],
    solution: { x, y, z },
    latex: `\\begin{cases} ${latex1} \\\\ ${latex2} \\\\ ${latex3} \\end{cases}`
  };
}

function generateNonZeroCoeff(min, max) {
  let coeff = randomInt(min, max);
  while (coeff === 0) {
    coeff = randomInt(min, max);
  }
  return coeff;
}

function generate2VariableSystemCleaner(difficulty) {
  const x = randomInt(-10, 10);
  const y = randomInt(-10, 10);
  
  let maxCoeff;
  switch (difficulty) {
    case '2-easy': maxCoeff = 5; break;
    case '2-medium': maxCoeff = 8; break;
    case '2-hard': maxCoeff = 12; break;
    default: maxCoeff = 5;
  }
  
  // Generate all non-zero coefficients
  const a1 = generateNonZeroCoeff(-maxCoeff, maxCoeff);
  const b1 = generateNonZeroCoeff(-maxCoeff, maxCoeff);
  const a2 = generateNonZeroCoeff(-maxCoeff, maxCoeff);
  const b2 = generateNonZeroCoeff(-maxCoeff, maxCoeff);
  
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  
  const eq1 = formatEquation(a1, 'x', b1, 'y', c1);
  const eq2 = formatEquation(a2, 'x', b2, 'y', c2);
  
  const latex1 = formatLatexEquation(a1, 'x', b1, 'y', c1);
  const latex2 = formatLatexEquation(a2, 'x', b2, 'y', c2);
  
  return {
    system: [eq1, eq2],
    solution: { x, y },
    latex: `\\begin{cases} ${latex1} \\\\ ${latex2} \\end{cases}`
  };
}

function formatEquation(a, varX, b, varY, rhs) {
  let equation = '';
  
  // First term
  if (a === 1) equation += varX;
  else if (a === -1) equation += `-${varX}`;
  else equation += `${a}${varX}`;
  
  // Second term
  if (b > 0) {
    if (b === 1) equation += ` + ${varY}`;
    else equation += ` + ${b}${varY}`;
  } else if (b < 0) {
    if (b === -1) equation += ` - ${varY}`;
    else equation += ` - ${Math.abs(b)}${varY}`;
  }
  
  equation += ` = ${rhs}`;
  return equation;
}

function formatEquation3Var(a, varX, b, varY, c, varZ, rhs) {
  let equation = '';
  
  // First term
  if (a === 1) equation += varX;
  else if (a === -1) equation += `-${varX}`;
  else equation += `${a}${varX}`;
  
  // Second term
  if (b > 0) {
    if (b === 1) equation += ` + ${varY}`;
    else equation += ` + ${b}${varY}`;
  } else if (b < 0) {
    if (b === -1) equation += ` - ${varY}`;
    else equation += ` - ${Math.abs(b)}${varY}`;
  }
  
  // Third term
  if (c > 0) {
    if (c === 1) equation += ` + ${varZ}`;
    else equation += ` + ${c}${varZ}`;
  } else if (c < 0) {
    if (c === -1) equation += ` - ${varZ}`;
    else equation += ` - ${Math.abs(c)}${varZ}`;
  }
  
  equation += ` = ${rhs}`;
  return equation;
}

function formatLatexEquation(a, varX, b, varY, rhs) {
  let equation = '';
  
  // First term
  if (a === 1) equation += varX;
  else if (a === -1) equation += `-${varX}`;
  else equation += `${a}${varX}`;
  
  // Second term
  if (b > 0) {
    if (b === 1) equation += ` + ${varY}`;
    else equation += ` + ${b}${varY}`;
  } else if (b < 0) {
    if (b === -1) equation += ` - ${varY}`;
    else equation += ` - ${Math.abs(b)}${varY}`;
  }
  
  equation += ` = ${rhs}`;
  return equation;
}

function formatLatexEquation3Var(a, varX, b, varY, c, varZ, rhs) {
  let equation = '';
  
  // First term
  if (a === 1) equation += varX;
  else if (a === -1) equation += `-${varX}`;
  else equation += `${a}${varX}`;
  
  // Second term
  if (b > 0) {
    if (b === 1) equation += ` + ${varY}`;
    else equation += ` + ${b}${varY}`;
  } else if (b < 0) {
    if (b === -1) equation += ` - ${varY}`;
    else equation += ` - ${Math.abs(b)}${varY}`;
  }
  
  // Third term
  if (c > 0) {
    if (c === 1) equation += ` + ${varZ}`;
    else equation += ` + ${c}${varZ}`;
  } else if (c < 0) {
    if (c === -1) equation += ` - ${varZ}`;
    else equation += ` - ${Math.abs(c)}${varZ}`;
  }
  
  equation += ` = ${rhs}`;
  return equation;
}

function renderSystem(latex) {
  elements.mathDisplay.innerHTML = `\\[ ${latex} \\]`;
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise();
  }
}

function clearInputs() {
  elements.xAnswer.value = '';
  elements.yAnswer.value = '';
  elements.zAnswer.value = '';
}

function randomInt(min = config.minNumber, max = config.maxNumber) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function trackScore(points, timeTaken, isStreakBonus = false) {
  const scoreEvent = {
    points,
    timeTaken,
    timestamp: new Date().toISOString(),
    level: state.currentDifficulty,
    isStreakBonus
  };
  
  state.gameSessionScores.push(scoreEvent);
  
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('systemsHighScore', state.highScore);
  }
  
  if (state.scoreHistory.length >= config.maxScoresToStore) {
    state.scoreHistory.shift();
  }
  state.scoreHistory.push(scoreEvent);
}

function checkAnswer() {
  if (!state.gameActive) return;
  
  const playerX = parseInt(elements.xAnswer.value);
  const playerY = parseInt(elements.yAnswer.value);
  const playerZ = state.currentDifficulty.startsWith('3') ? parseInt(elements.zAnswer.value) : undefined;
  
  if (isNaN(playerX) || isNaN(playerY) || (state.currentDifficulty.startsWith('3') && isNaN(playerZ))) {
    showFeedback(elements, 'Please enter integers for all variables', false);
    return;
  }
  
  clearTimeout(state.equationTimer);
  
  const isCorrect = playerX === state.solution.x && 
                   playerY === state.solution.y && 
                   (state.currentDifficulty.startsWith('2') || playerZ === state.solution.z);
  
  if (isCorrect) {
    const timeTaken = (Date.now() - state.equationStartTime) / 1000;
    const basePoints = config.basePoints[state.currentDifficulty];
    const timeLimit = config.timeLimits[state.currentDifficulty];
    
    const reductionPerSecond = 0.02;
    const reduction = Math.min(0.95, timeTaken * reductionPerSecond);
    const pointsEarned = Math.max(1, Math.floor(basePoints * (1 - reduction)));
    
    state.score += pointsEarned;
    state.streak++;
    
    trackScore(pointsEarned, timeTaken);
    
    if (state.streak % 3 === 0) {
      const streakBonus = Math.floor(basePoints * 0.3);
      state.score += streakBonus;
      trackScore(streakBonus, timeTaken, true);
      showFeedback(elements, `✅ +${pointsEarned} (${timeTaken.toFixed(1)}s) +${streakBonus} streak!`, true);
    } else {
      showFeedback(elements, `✅ +${pointsEarned} (${timeTaken.toFixed(1)}s)`, true);
    }
    
    updateStats(elements, state);
    setTimeout(generateSystem, 1500);
  } else {
    state.streak = 0;
    let solutionText = `x = ${state.solution.x}, y = ${state.solution.y}`;
    if (state.currentDifficulty.startsWith('3')) {
      solutionText += `, z = ${state.solution.z}`;
    }
    showFeedback(elements, `❌ The answer was: ${solutionText}`, false);
    updateStats(elements, state);
    endGame(elements, state, 'all', false);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof MathJax !== 'undefined') {
    MathJax.startup.promise.then(() => {
      renderSystem("");
    });
  }
  showLevels(elements);
  setupLevelToggleButtons(state, elements);
});