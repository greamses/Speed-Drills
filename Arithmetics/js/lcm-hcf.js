document.addEventListener('DOMContentLoaded', function() {
    // Wait for dropdown to be initialized
    setTimeout(() => {
        initializeGame();
    }, 100);
});

function initializeGame() {
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
    const dropdown = document.getElementById('number-count-dropdown');
    
    let currentNumbers = [];
    let initialNumbers = [];
    let historyFactors = [];
    let currentFactor = null;
    let score = 0;
    let timeLeft = 60;
    let timerInterval;
    let gameActive = true;
    let currentRow = null;
    let finalAnswersValidated = false;
    let isGenerating = false;
    let numberCount = 2;
    let gameOver = false;
    
    // Event Listener for Custom Dropdown
    if (dropdown) {
        dropdown.addEventListener('dropdownChange', (e) => {
            if (gameOver) return;
            numberCount = parseInt(e.detail.value);
            // Reset game completely
            score = 0;
            scoreEl.textContent = `Score: ${score}`;
            generateNewProblem();
        });
    }
    
    generateNewProblem();
    
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 60;
        progressEl.style.width = '100%';
        progressEl.classList.remove('time-warning', 'time-critical');
        
        timerInterval = setInterval(() => {
            if (gameOver) {
                clearInterval(timerInterval);
                return;
            }
            
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
                if (!gameActive || isGenerating || gameOver) return;
                
                endGame("Time's up! Game Over."); // ONLY time triggers game over
            }
        }, 1000);
    }
    
    function disableAllInputs() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = true;
        });
    }
    
    function enableAllInputs() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = false;
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
            if (gameOver) return;
            if (factorInput.value.length > 0) {
                validateFactor(factorInput, row, expectedFactor);
            }
        });
        
        row.appendChild(factorInput);
        
        // Dynamic creation of number inputs based on current array length
        currentNumbers.forEach((num, index) => {
            const divInput = document.createElement('input');
            divInput.type = "number";
            divInput.classList.add('factor-input');
            divInput.dataset.index = index;
            divInput.disabled = true;
            
            divInput.addEventListener('input', () => {
                if (gameOver) return;
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
            
            messageEl.textContent = `Correct!`;
            
            const firstInput = row.querySelectorAll('.factor-input')[0];
            firstInput.disabled = false;
            firstInput.focus();
            
            updateScore(1);
        } else if (input.value.length > 0) {
            input.classList.add('error');
            messageEl.textContent = `Incorrect. Find a prime number that divides ALL values.`;
            // REMOVED: endGame() call - just show error but let continue
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
            
            // Determine next focus
            if (index < allInputs.length - 1) {
                const nextInput = allInputs[index + 1];
                nextInput.disabled = false;
                nextInput.focus();
            } else {
                finishRow(row);
            }
            
            updateScore(1);
        } else if (input.value.length > 0) {
            input.classList.add('error');
            messageEl.textContent = "Check your division again.";
            // REMOVED: endGame() call - just show error but let continue
        }
    }
    
    function finishRow(row) {
        const inputs = row.querySelectorAll('.factor-input');
        currentNumbers = Array.from(inputs).map(inp => parseInt(inp.value));
        
        messageEl.textContent = "Row complete. Looking for more common factors...";
        
        checkStateAndCreateRow();
    }
    
    function triggerFinalStage() {
        messageEl.textContent = "Fill in final answers.";
        finalStage.classList.remove('hidden');
        finalAnswersValidated = false;
        
        lowestTermsContainer.innerHTML = '';
        currentNumbers.forEach((num, i) => {
            const inp = document.createElement('input');
            inp.type = "number";
            inp.id = `term-${i}`;
            lowestTermsContainer.appendChild(inp);
            
            inp.addEventListener('input', () => {
                if (gameOver) return;
                checkIfAllFinalInputsFilled();
            });
        });
        
        hcfInput.addEventListener('input', () => {
            if (gameOver) return;
            checkIfAllFinalInputsFilled();
        });
        
        lcmInput.addEventListener('input', () => {
            if (gameOver) return;
            checkIfAllFinalInputsFilled();
        });
    }
    
    function checkIfAllFinalInputsFilled() {
        if (!gameActive || finalAnswersValidated || gameOver) return;
        
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
        if (!gameActive || finalAnswersValidated || gameOver) return;
        
        let allCorrect = true;
        
        // 1. Validate HCF (Product of side numbers)
        const actualHCF = historyFactors.reduce((acc, val) => acc * val, 1);
        const userHCF = parseInt(hcfInput.value);
        
        if (userHCF === actualHCF) {
            hcfInput.classList.add('correct');
            hcfInput.classList.remove('error');
        } else {
            hcfInput.classList.add('error');
            hcfInput.classList.remove('correct');
            allCorrect = false;
        }
        
        // 2. Validate Lowest Terms (The bottom row)
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
        
        // 3. Validate LCM
        const actualLCM = getLCMOfArray(initialNumbers);
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
            messageEl.textContent = "CONGRATULATIONS!.";
            messageEl.classList.add('success-animation');
            
            updateScore(numberCount * 2);
            clearInterval(timerInterval);
            
            setTimeout(() => {
                if (!isGenerating && !gameOver) {
                    messageEl.classList.remove('success-animation');
                    generateNewProblem();
                }
            }, 2000);
        } else {
            messageEl.style.color = "var(--error-color)";
            messageEl.textContent = "Some answers are wrong!";
        }
    }
    
    function endGame(message) {
        gameOver = true;
        gameActive = false;
        clearInterval(timerInterval);
        
        messageEl.style.color = "var(--error-color)";
        messageEl.textContent = message;
        
        disableAllInputs();
        
        // Add restart button or instructions
        setTimeout(() => {
            if (!isGenerating) {
                messageEl.textContent += " Refresh";
            }
        }, 2000);
    }
    
    function generateNewProblem() {
    if (isGenerating) return;
    isGenerating = true;
    
    gameOver = false;
    gameActive = true;
    
    let attempts = 0;
    let success = false;
    let generatedNums = [];
    
    while (!success && attempts < 200) {
        attempts++;
        generatedNums = [];
        
        // 1. Build HCF with multiple 2s and 3s, plus optional higher primes
        const num2s = 1 + Math.floor(Math.random() * 3); // 1-3 factors of 2
        const num3s = 1 + Math.floor(Math.random() * 3); // 1-3 factors of 3
        
        // Start with powers of 2 and 3
        let hcf = Math.pow(2, num2s) * Math.pow(3, num3s);
        
        // Add higher primes with decreasing probability
        const higherPrimes = [
            { prime: 5, probability: 0.6 }, // 60% chance
            { prime: 7, probability: 0.4 }, // 40% chance
            { prime: 11, probability: 0.25 }, // 25% chance
            { prime: 13, probability: 0.15 } // 15% chance
        ];
        
        for (let primeObj of higherPrimes) {
            if (Math.random() < primeObj.probability) {
                const testHcf = hcf * primeObj.prime;
                // Only add if it keeps numbers reasonable
                if (testHcf * 2 <= 500) { // Check if even smallest number would be under 500
                    hcf = testHcf;
                }
            }
        }
        
        // 2. Determine multiplier range to keep numbers under 500
        const maxMultiplier = Math.floor(500 / hcf);
        
        if (maxMultiplier < numberCount) continue; // Need enough room for unique multipliers
        
        // 3. Generate distinct multipliers
        const multipliers = [];
        for (let i = 0; i < numberCount; i++) {
            let m;
            let subAttempts = 0;
            do {
                // Use smaller multipliers to keep numbers manageable
                const effectiveMax = Math.min(maxMultiplier, 15);
                m = Math.floor(Math.random() * effectiveMax) + 1;
                subAttempts++;
            } while (multipliers.includes(m) && subAttempts < 30);
            multipliers.push(m);
        }
        
        // Ensure multipliers are unique
        if (new Set(multipliers).size !== multipliers.length) continue;
        
        // 4. Create numbers
        generatedNums = multipliers.map(m => m * hcf);
        
        // 5. Ensure all numbers are under 500
        if (Math.max(...generatedNums) > 500) continue;
        
        // 6. Validation Check - ensure at least 3 prime factors total
        const minPrimeFactors = Math.min(...generatedNums.map(n => countPrimeFactors(n)));
        if (minPrimeFactors >= 3 && getCommonPrimeFactor(generatedNums) !== null) {
            // Count common factors for logging
            const common2s = countCommonFactor(generatedNums, 2);
            const common3s = countCommonFactor(generatedNums, 3);
            const common5s = countCommonFactor(generatedNums, 5);
            const common7s = countCommonFactor(generatedNums, 7);
            const common11s = countCommonFactor(generatedNums, 11);
            const common13s = countCommonFactor(generatedNums, 13);
            
            let commonStr = `
$ { common2s }× 2, $ { common3s }× 3`;
            if (common5s > 0) commonStr += `, $ { common5s }× 5`;
            if (common7s > 0) commonStr += `, $ { common7s }× 7`;
            if (common11s > 0) commonStr += `, $ { common11s }× 11`;
            if (common13s > 0) commonStr += `, $ { common13s }× 13`;
            
            console.log(`
Common factors: $ { commonStr }
`);
            success = true;
        }
    }
    
    // Fallback if generation fails - rich in 2s and 3s with some higher primes
    if (!success) {
        if (numberCount === 2) generatedNums = [210, 420]; // 2×3×5×7, 2²×3×5×7
        if (numberCount === 3) generatedNums = [180, 360, 450]; // 2²×3²×5, 2³×3²×5, 2×3²×5²
        if (numberCount === 4) generatedNums = [120, 240, 360, 480]; // All have multiple factors
    }
    
    currentNumbers = [...generatedNums];
    initialNumbers = [...generatedNums];
    historyFactors = [];
    currentFactor = null;
    gameActive = true;
    finalAnswersValidated = false;
    
    // Clean UI
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
        messageEl.textContent = `
Factorize`;
    }
    
    const common2s = countCommonFactor(generatedNums, 2);
    const common3s = countCommonFactor(generatedNums, 3);
    const common5s = countCommonFactor(generatedNums, 5);
    const common7s = countCommonFactor(generatedNums, 7);
    const common11s = countCommonFactor(generatedNums, 11);
    const common13s = countCommonFactor(generatedNums, 13);
    
    
    let commonStr = `
${common2s} × 2, ${common3s}× 3`;
    if (common5s > 0) commonStr += `, ${common5s} × 5`;
    if (common7s > 0) commonStr += `, ${common7s} × 7`;
    if (common11s > 0) commonStr += `, ${common11s} × 11`;
    if (common13s > 0) commonStr += `, ${common13s} × 13`;
    
    if (typeof headerRow !== 'undefined') {
        headerRow.innerHTML = currentNumbers.map(n => ` <div>${n}</div>
`).join('');
    }
    
    enableAllInputs();
    
    if (typeof checkStateAndCreateRow === 'function') checkStateAndCreateRow();
    if (typeof startTimer === 'function') startTimer();
    
    isGenerating = false;
}

function countPrimeFactors(num) {
    let count = 0;
    let n = num;
    
    // Count factor of 2
    while (n % 2 === 0) {
        count++;
        n = n / 2;
    }
    
    // Count odd factors
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        while (n % i === 0) {
            count++;
            n = n / i;
        }
    }
    
    // If n is still greater than 1, it's a prime factor
    if (n > 1) count++;
    
    return count;
}

function countCommonFactor(arr, prime) {
    let minCount = Infinity;
    
    for (let num of arr) {
        let count = 0;
        let n = num;
        while (n % prime === 0) {
            count++;
            n = n / prime;
        }
        minCount = Math.min(minCount, count);
    }
    
    return minCount;
}

function getCommonPrimeFactor(arr) {
    const limit = Math.min(...arr);
    
    // Quick check for 2
    if (arr.every(num => num % 2 === 0)) return 2;
    
    // Check odd numbers
    for (let i = 3; i <= limit; i += 2) {
        let isCommon = true;
        for (let num of arr) {
            if (num % i !== 0) {
                isCommon = false;
                break;
            }
        }
        
        if (isCommon && isPrime(i)) {
            return i;
        }
    }
    
    return null;
}

function isPrime(num) {
    if (num <= 1) return false;
    if (num === 2) return true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}
    
    function gcd(a, b) {
        return !b ? a : gcd(b, a % b);
    }
    
    function lcm(a, b) {
        return (a * b) / gcd(a, b);
    }
    
    function getLCMOfArray(arr) {
        let result = arr[0];
        for (let i = 1; i < arr.length; i++) {
            result = lcm(result, arr[i]);
        }
        return result;
    }
    
    function updateScore(points) {
        score += points;
        scoreEl.textContent = `Score: ${score}`;
        scoreEl.classList.add('success-animation');
        setTimeout(() => {
            scoreEl.classList.remove('success-animation');
        }, 200);
    }
}
