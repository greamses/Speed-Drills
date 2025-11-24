const primeContainer = document.getElementById('primeContainer');
const headerRow = document.getElementById('headerRow');
const messageEl = document.getElementById('message');
const finalStage = document.getElementById('final-stage');
const lowestTermsContainer = document.getElementById('lowest-terms-inputs');
const hcfInput = document.getElementById('hcf-input');
const lcmInput = document.getElementById('lcm-input');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const progressEl = document.getElementById('progress');

let currentNumbers = [];
let historyFactors = [];
let currentFactor = null;
let score = 0;
let timeLeft = 60;
let timerInterval;
let gameActive = true;
let currentRow = null;
let finalAnswersValidated = false;
let isGenerating = false;

generateNewProblem();

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 60;
  progressEl.style.width = '100%';
  progressEl.classList.remove('time-warning', 'time-critical');
  
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `${timeLeft}s`;
    progressEl.style.width = `${(timeLeft / 60) * 100}%`;
    
    if (timeLeft <= 10) {
      progressEl.classList.add('time-critical');
    } else if (timeLeft <= 20) {
      progressEl.classList.add('time-warning');
    }
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      if (!gameActive || isGenerating) return;
      
      gameActive = false;
      messageEl.style.color = "var(--error-color)";
      messageEl.textContent = "Time's up! Starting new problem...";
      disableAllInputs();
      setTimeout(() => {
        if (!isGenerating) {
          generateNewProblem();
        }
      }, 2000);
    }
  }, 1000);
}

function disableAllInputs() {
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.disabled = true;
  });
}

function checkStateAndCreateRow() {
  const nextCommon = getCommonPrimeFactor(currentNumbers);
  
  if (nextCommon === null) {
    triggerFinalStage();
  } else {
    createRow(nextCommon);
  }
}

function createRow(expectedFactor) {
  const row = document.createElement('div');
  row.classList.add('prime-row');
  currentRow = row;
  
  const factorInput = document.createElement('input');
  factorInput.type = "number";
  factorInput.classList.add('prime-factor');
  factorInput.placeholder = "?";
  factorInput.autofocus = true;
  
  factorInput.addEventListener('input', () => {
    if (factorInput.value.length > 0) {
      validateFactor(factorInput, row, expectedFactor);
    }
  });
  
  row.appendChild(factorInput);
  
  currentNumbers.forEach((num, index) => {
    const divInput = document.createElement('input');
    divInput.type = "number";
    divInput.classList.add('factor-input');
    divInput.dataset.index = index;
    divInput.disabled = true;
    
    divInput.addEventListener('input', () => {
      if (divInput.value.length > 0) {
        validateDivision(divInput, row, index);
      }
    });
    
    row.appendChild(divInput);
  });
  
  primeContainer.appendChild(row);
  factorInput.focus();
}

function validateFactor(input, row, expected) {
  const val = parseInt(input.value);
  
  if (val === expected) {
    input.classList.remove('error');
    input.classList.add('correct');
    input.disabled = true;
    
    currentFactor = val;
    historyFactors.push(val);
    
    messageEl.textContent = `Correct! Now divide the numbers by ${val}`;
    
    const firstInput = row.querySelectorAll('.factor-input')[0];
    firstInput.disabled = false;
    firstInput.focus();
    
    updateScore(10);
  } else if (input.value.length > 0) {
    input.classList.add('error');
    messageEl.textContent = `Incorrect. Find a prime number that divides ALL values.`;
  }
}

function validateDivision(input, row, index) {
  const userVal = parseInt(input.value);
  const originalNum = currentNumbers[index];
  const expectedVal = originalNum / currentFactor;
  
  if (userVal === expectedVal) {
    input.classList.remove('error');
    input.classList.add('correct');
    input.disabled = true;
    
    const allInputs = row.querySelectorAll('.factor-input');
    
    if (index < allInputs.length - 1) {
      const nextInput = allInputs[index + 1];
      nextInput.disabled = false;
      nextInput.focus();
    } else {
      finishRow(row);
    }
    
    updateScore(5);
  } else if (input.value.length > 0) {
    input.classList.add('error');
    messageEl.textContent = "Check your division again.";
  }
}

function finishRow(row) {
  const inputs = row.querySelectorAll('.factor-input');
  currentNumbers = Array.from(inputs).map(inp => parseInt(inp.value));
  
  messageEl.textContent = "Row complete. Looking for more common factors...";
  
  checkStateAndCreateRow();
}

function triggerFinalStage() {
  messageEl.textContent = "No common factors left. Fill in the final answers.";
  finalStage.classList.remove('hidden');
  finalAnswersValidated = false;
  
  lowestTermsContainer.innerHTML = '';
  currentNumbers.forEach((num, i) => {
    const inp = document.createElement('input');
    inp.type = "number";
    inp.id = `term-${i}`;
    lowestTermsContainer.appendChild(inp);
    
    inp.addEventListener('input', () => {
      checkIfAllFinalInputsFilled();
    });
  });
  
  hcfInput.addEventListener('input', () => {
    checkIfAllFinalInputsFilled();
  });
  
  lcmInput.addEventListener('input', () => {
    checkIfAllFinalInputsFilled();
  });
}

function checkIfAllFinalInputsFilled() {
  if (!gameActive || finalAnswersValidated) return;
  
  const termInputs = lowestTermsContainer.querySelectorAll('input');
  const allFilled = 
    hcfInput.value.length > 0 &&
    lcmInput.value.length > 0 &&
    Array.from(termInputs).every(inp => inp.value.length > 0);
  
  if (allFilled) {
    validateFinalAnswers();
  }
}

function validateFinalAnswers() {
  if (!gameActive || finalAnswersValidated) return;
  
  let allCorrect = true;
  
  const actualHCF = historyFactors.reduce((acc, val) => acc * val, 1);
  const lowestTermsProduct = currentNumbers.reduce((acc, val) => acc * val, 1);
  const actualLCM = actualHCF * lowestTermsProduct;
  
  const userHCF = parseInt(hcfInput.value);
  if (userHCF === actualHCF) {
    hcfInput.classList.add('correct');
    hcfInput.classList.remove('error');
  } else {
    hcfInput.classList.add('error');
    hcfInput.classList.remove('correct');
    allCorrect = false;
  }
  
  const termInputs = lowestTermsContainer.querySelectorAll('input');
  termInputs.forEach((inp, index) => {
    if (parseInt(inp.value) === currentNumbers[index]) {
      inp.classList.add('correct');
      inp.classList.remove('error');
    } else {
      inp.classList.add('error');
      inp.classList.remove('correct');
      allCorrect = false;
    }
  });
  
  const userLCM = parseInt(lcmInput.value);
  if (userLCM === actualLCM) {
    lcmInput.classList.add('correct');
    lcmInput.classList.remove('error');
  } else {
    lcmInput.classList.add('error');
    lcmInput.classList.remove('correct');
    allCorrect = false;
  }
  
  if (allCorrect) {
    finalAnswersValidated = true;
    messageEl.style.color = "var(--success-color)";
    messageEl.textContent = "CONGRATULATIONS! All answers are correct.";
    messageEl.classList.add('success-animation');
    
    updateScore(50);
    clearInterval(timerInterval);
    
    setTimeout(() => {
      if (!isGenerating) {
        messageEl.classList.remove('success-animation');
        generateNewProblem();
      }
    }, 2000);
  } else {
    messageEl.style.color = "var(--error-color)";
    messageEl.textContent = "Some answers are wrong. Check Red boxes.";
  }
}


function calculateHCF(a, b) {
  return !b ? a : calculateHCF(b, a % b);
}

function generateNewProblem() {
  if (isGenerating) return;
  isGenerating = true;

  let num1, num2, hcf;
  let attempts = 0;
  let success = false;

  // We need an HCF with at least 3 prime factors (e.g., 2*2*2=8, 2*2*3=12, 2*3*5=30)
  // We filter for numbers < 60 to leave room for multipliers within the 200 limit.
  const validHCFs = [];
  for (let i = 8; i <= 60; i++) {
    if (getPrimeFactors(i).length >= 3) {
      validHCFs.push(i);
    }
  }

  while (!success && attempts < 100) {
    attempts++;

    // 1. Pick a "rich" HCF from our pre-calculated list
    hcf = validHCFs[Math.floor(Math.random() * validHCFs.length)];

    // 2. Determine max possible multiplier to stay under 200
    const maxMultiplier = Math.floor(200 / hcf);

    if (maxMultiplier < 2) continue; // Should not happen given hcf <= 60, but safety first

    // 3. Pick two distinct multipliers (m1, m2)
    // They MUST be coprime (GCD = 1) otherwise the HCF increases.
    // e.g. if HCF=10, m1=2, m2=4 -> Num1=20, Num2=40 -> Actual HCF becomes 20.
    let m1 = Math.floor(Math.random() * maxMultiplier) + 1;
    let m2 = Math.floor(Math.random() * maxMultiplier) + 1;

    if (m1 === m2) continue;
    if (calculateHCF(m1, m2) !== 1) continue;

    num1 = hcf * m1;
    num2 = hcf * m2;

    // 4. Final Validation
    // Ensure numbers aren't identical (already checked by m1!==m2)
    // Ensure they aren't too simple (e.g., avoid 1 * HCF if you prefer harder problems)
    if (num1 <= 200 && num2 <= 200) {
      success = true;
    }
  }

  // Fallback if RNG fails (unlikely with this logic)
  if (!success) {
    num1 = 60;  // 2*2*3*5
    num2 = 120; // 2*2*2*3*5
  }

  // --- UI UPDATE LOGIC (Kept largely the same) ---
  
  currentNumbers = [num1, num2];
  historyFactors = [];
  currentFactor = null;
  gameActive = true;
  finalAnswersValidated = false;

  // Assuming these elements exist in your global scope
  if (typeof primeContainer !== 'undefined') primeContainer.innerHTML = '';
  if (typeof finalStage !== 'undefined') finalStage.classList.add('hidden');
  
  if (typeof hcfInput !== 'undefined') {
    hcfInput.value = '';
    hcfInput.classList.remove('correct', 'error');
  }
  if (typeof lcmInput !== 'undefined') {
    lcmInput.value = '';
    lcmInput.classList.remove('correct', 'error');
  }

  if (typeof messageEl !== 'undefined') {
    messageEl.style.color = "var(--text-color)";
    messageEl.textContent = "Find a common prime factor";
  }

  console.log(`Generated: ${num1}, ${num2} | HCF: ${calculateHCF(num1, num2)}`);

  if (typeof headerRow !== 'undefined') {
    headerRow.innerHTML = currentNumbers.map(n => `<div>${n}</div>`).join('');
  }
  
  // Assuming these functions exist in your global scope
  if (typeof checkStateAndCreateRow === 'function') checkStateAndCreateRow();
  if (typeof startTimer === 'function') startTimer();

  isGenerating = false;
}

function getPrimeFactors(num) {
  const factors = [];
  let n = num;

  // Optimized: Handle 2 separately
  while (n % 2 === 0) {
    factors.push(2);
    n = n / 2;
  }

  // Optimized: Loop odd numbers only
  for (let i = 3; i * i <= n; i += 2) {
    while (n % i === 0) {
      factors.push(i);
      n = n / i;
    }
  }

  if (n > 1) {
    factors.push(n);
  }

  return factors;
}

function getCommonPrimeFactor(arr) {
  // Find the smallest number in the array to set our search limit
  const limit = Math.min(...arr);
  
  // Start checking from 2
  if (arr.every(num => num % 2 === 0)) return 2;

  for (let i = 3; i <= limit; i += 2) {
    let isCommon = true;
    for (let num of arr) {
      if (num % i !== 0) {
        isCommon = false;
        break;
      }
    }
    
    if (isCommon) {

      return i; 
    }
  }

  return null;
}

function calculateHCF(a, b) {
  while (b !== 0) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

function updateScore(points) {
  score += points;
  scoreEl.textContent = `Score: ${score}`;
  scoreEl.classList.add('success-animation');
  setTimeout(() => {
    scoreEl.classList.remove('success-animation');
  }, 200);
}