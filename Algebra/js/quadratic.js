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
  maxNumber: 10,
  minNumber: 1,
  variables: ['x', 'y', 'z'],
  maxScoresToStore: 50,
  timeLimits: { 1: 30, 2: 45, 3: 50, 4: 80, 5: 120 },
  basePoints: { 1: 15, 2: 30, 3: 45, 4: 60, 5: 75 }
};

let state = {
  scoreHistory: [],
  highScore: localStorage.getItem('quadraticHighScore') || 0,
  score: 0,
  streak: 0,
  currentEquation: null,
  solutions: null,
  data: 'quadraticScores',
  equationTimer: null,
  equationTimeRemaining: 0,
  gameActive: false,
  gameSessionScores: [],
  currentLevel: 1,
  equationStartTime: 0,
  equationType: 'ax² + bx + c = 0'
};

const elements = {
  equation: document.getElementById('equation'),
  mathDisplay: document.getElementById('math-display'),
  answer1: document.getElementById('answer1'),
  answer2: document.getElementById('answer2'),
  feedback: document.getElementById('feedback'),
  score: document.getElementById('score'),
  streak: document.getElementById('streak'),
  progress: document.getElementById('progress'),
  checkBtn: document.getElementById('check-btn'),
  startBtn: document.getElementById('start-btn'),
  equationTimer: document.getElementById('equation-timer'),
  equationTypeSelect: document.getElementById('equation-type')
};

// Initialize game
elements.startBtn.addEventListener('click', initGame);
elements.checkBtn.addEventListener('click', checkAnswer);
elements.answer1.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') checkAnswer();
});
elements.answer2.addEventListener('keypress', (e) => {
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
  state.equationType = elements.equationTypeSelect.value;
  elements.checkBtn.disabled = false;
  elements.answer1.disabled = false;
  elements.answer2.disabled = false;
  elements.equationTypeSelect.disabled = true;
  generateEquation();
  elements.answer1.focus();
}

function generateEquation() {
  if (!state.gameActive) return;
  
  const variable = config.variables[Math.floor(Math.random() * config.variables.length)];
  
  let equation, latex, a, b, c, root1, root2;
  let attempts = 0;
  const maxAttempts = 50;
  
  do {
    attempts++;
    
    // Generate two integer roots first - this guarantees integer solutions
    root1 = randomIntNonZero(-config.maxNumber, config.maxNumber);
    root2 = randomIntNonZero(-config.maxNumber, config.maxNumber);
    
    // Ensure roots are different for most equation types
    while (root1 === root2 && state.equationType !== 'ax² - c = 0') {
      root2 = randomIntNonZero(-config.maxNumber, config.maxNumber);
    }
    
    switch (state.equationType) {
      case 'ax² + bx + c = 0':

        a = randomIntNonZero(1, 3);
        b = -a * (root1 + root2);
        c = a * root1 * root2;
        break;
        
      case 'ax² - bx + c = 0':

        a = randomIntNonZero(1, 3);
        
        // Ensure sum is positive for the -bx term
        if (root1 + root2 <= 0) {
          root1 = Math.abs(root1);
          root2 = Math.abs(root2);
          // Make sure they're still different if needed
          if (root1 === root2) {
            root2 = root1 + 1;
          }
        }
        
        b = a * (root1 + root2); // Positive coefficient for -bx
        c = a * root1 * root2;
        break;
        
      case 'ax² + bx - c = 0':
        // We want the constant term to be negative: ax² + bx - c
        // From (x - root1)(x - root2) = x² - (root1+root2)x + root1*root2
        // We need root1*root2 to be negative for the -c term
        a = randomIntNonZero(1, 3);
        
        // Ensure one root is positive, one negative
        if (root1 * root2 > 0) {
          root2 = -Math.abs(root2);
          root1 = Math.abs(root1);
        }
        
        b = -a * (root1 + root2);
        c = -a * root1 * root2; // This will be positive since root1*root2 < 0
        break;
        
      case 'ax² - c = 0':
        // Perfect square form: a(x² - k²) = ax² - ak² where k is an integer
        // This gives roots ±k
        a = randomIntNonZero(1, 3);
        root1 = randomIntNonZero(1, config.maxNumber);
        root2 = -root1; // Always ±k for perfect squares
        c = a * root1 * root1;
        b = 0;
        break;
    }
    
    // Verify the equation actually has the expected integer roots
    // Using the quadratic formula: x = (-b ± √(b²-4ac)) / (2a)
    const discriminant = b*b - 4*a*c;
    const sqrtDiscriminant = Math.sqrt(discriminant);
    
    // Check if discriminant is a perfect square (for integer roots)
    const isValidEquation = (
      discriminant >= 0 && 
      Number.isInteger(sqrtDiscriminant) &&
      Number.isInteger((-b + sqrtDiscriminant) / (2*a)) &&
      Number.isInteger((-b - sqrtDiscriminant) / (2*a))
    );
    
    if (isValidEquation) {
      // Double-check our roots match
      const calculatedRoot1 = (-b + sqrtDiscriminant) / (2*a);
      const calculatedRoot2 = (-b - sqrtDiscriminant) / (2*a);
      const calculatedRoots = [calculatedRoot1, calculatedRoot2].sort((x, y) => x - y);
      const expectedRoots = [root1, root2].sort((x, y) => x - y);
      
      if (Math.abs(calculatedRoots[0] - expectedRoots[0]) < 0.0001 && 
          Math.abs(calculatedRoots[1] - expectedRoots[1]) < 0.0001) {
        break; // Valid equation found
      }
    }
    
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    console.warn('Could not generate valid equation, using fallback');
    // Fallback to simple case
    a = 1;
    root1 = randomIntNonZero(-5, 5);
    root2 = randomIntNonZero(-5, 5);
    while (root1 === root2) {
      root2 = randomIntNonZero(-5, 5);
    }
    b = -(root1 + root2);
    c = root1 * root2;
  }
  
  // Build the equation string and LaTeX
  equation = buildEquationString(a, b, c, variable);
  latex = buildLatexString(a, b, c, variable);
  
  state.currentEquation = equation;
  state.solutions = [root1, root2].sort((x, y) => x - y); // Sort for consistent checking
  
  renderEquation(latex);
  elements.answer1.value = '';
  elements.answer2.value = '';
  elements.feedback.textContent = '';
  elements.feedback.className = '';
  startEquationTimer(state, elements, config, updateStats, endGame);
}

function buildEquationString(a, b, c, variable) {
  let equation = '';
  
  // ax² term
  if (a === 1) {
    equation += `${variable}²`;
  } else if (a === -1) {
    equation += `-${variable}²`;
  } else {
    equation += `${a}${variable}²`;
  }
  
  // bx term
  if (b > 0) {
    if (b === 1) {
      equation += ` + ${variable}`;
    } else {
      equation += ` + ${b}${variable}`;
    }
  } else if (b < 0) {
    if (b === -1) {
      equation += ` - ${variable}`;
    } else {
      equation += ` - ${Math.abs(b)}${variable}`;
    }
  }
  // If b === 0, add nothing
  
  // c term
  if (c > 0) {
    equation += ` + ${c}`;
  } else if (c < 0) {
    equation += ` - ${Math.abs(c)}`;
  }
  // If c === 0, add nothing
  
  equation += ' = 0';
  return equation;
}

function buildLatexString(a, b, c, variable) {
  let latex = '';
  
  // ax² term
  if (a === 1) {
    latex += `${variable}^2`;
  } else if (a === -1) {
    latex += `-${variable}^2`;
  } else {
    latex += `${a}${variable}^2`;
  }
  
  // bx term
  if (b > 0) {
    if (b === 1) {
      latex += ` + ${variable}`;
    } else {
      latex += ` + ${b}${variable}`;
    }
  } else if (b < 0) {
    if (b === -1) {
      latex += ` - ${variable}`;
    } else {
      latex += ` - ${Math.abs(b)}${variable}`;
    }
  }
  
  // c term
  if (c > 0) {
    latex += ` + ${c}`;
  } else if (c < 0) {
    latex += ` - ${Math.abs(c)}`;
  }
  
  latex += ' = 0';
  return latex;
}

function renderEquation(latex) {
  elements.mathDisplay.innerHTML = `\\( ${latex} \\)`;
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise();
  }
}

// Updated function to exclude zero
function randomInt(min = config.minNumber, max = config.maxNumber) {
  min = Math.min(min, max);
  max = Math.max(min, max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// New function that ensures non-zero values
function randomIntNonZero(min = config.minNumber, max = config.maxNumber) {
  let result;
  do {
    result = randomInt(min, max);
  } while (result === 0);
  return result;
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
    localStorage.setItem('quadraticHighScore', state.highScore);
  }
  
  if (state.scoreHistory.length >= config.maxScoresToStore) {
    state.scoreHistory.shift();
  }
  state.scoreHistory.push(scoreEvent);
}

function checkAnswer() {
  if (!state.gameActive) return;
  
  const playerAnswer1 = parseInt(elements.answer1.value);
  const playerAnswer2 = parseInt(elements.answer2.value);
  
  if (isNaN(playerAnswer1)) {
      showFeedback(elements, 'Please enter an integer for the first solution', false);
      return;
    }
    
    if (isNaN(playerAnswer2)) {
      showFeedback(elements, 'Please enter an integer for the second solution', false);
      return;
    }
    
    clearTimeout(state.equationTimer);
    
    const playerSolutions = [playerAnswer1, playerAnswer2].sort((x, y) => x - y);
    const correctSolutions = state.solutions;
    
    if (playerSolutions[0] === correctSolutions[0] && playerSolutions[1] === correctSolutions[1]) {
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
      showFeedback(elements, `❌ The solutions were ${correctSolutions[0]} and ${correctSolutions[1]}`, false);
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