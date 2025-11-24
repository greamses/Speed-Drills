// Wait for DOM to be fully loaded
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

    // MODIFIED: Only used for time running out
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

        // HCF Candidates
        const validHCFs = [];
        for (let i = 2; i <= 12; i++) {
            validHCFs.push(i);
        }

        while (!success && attempts < 200) {
            attempts++;
            generatedNums = [];
            
            // 1. Pick a random shared HCF
            const hcf = validHCFs[Math.floor(Math.random() * validHCFs.length)];
            
            // 2. Determine multiplier range based on count
            let limit = (numberCount > 2) ? 50 : 200;
            const maxMultiplier = Math.floor(limit / hcf);
            
            if (maxMultiplier < 2) continue;

            // 3. Generate distinct multipliers
            const multipliers = [];
            for(let i=0; i < numberCount; i++) {
                let m;
                let subAttempts = 0;
                do {
                    m = Math.floor(Math.random() * maxMultiplier) + 1;
                    subAttempts++;
                } while(multipliers.includes(m) && subAttempts < 20);
                multipliers.push(m);
            }
            
            // Ensure multipliers are unique
            if(new Set(multipliers).size !== multipliers.length) continue;

            // 4. Create numbers
            generatedNums = multipliers.map(m => m * hcf);

            // 5. Validation Check
            if (getCommonPrimeFactor(generatedNums) !== null) {
                success = true;
            }
        }

        // Fallback if generation fails
        if (!success) {
            if(numberCount === 2) generatedNums = [60, 120];
            if(numberCount === 3) generatedNums = [12, 24, 36];
            if(numberCount === 4) generatedNums = [10, 20, 30, 40];
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
            messageEl.textContent = `Factorize`;
        }

        console.log(`Generated: ${generatedNums.join(', ')}`);

        if (typeof headerRow !== 'undefined') {
            headerRow.innerHTML = currentNumbers.map(n => `<div>${n}</div>`).join('');
        }
        
        enableAllInputs();
        
        if (typeof checkStateAndCreateRow === 'function') checkStateAndCreateRow();
        if (typeof startTimer === 'function') startTimer();

        isGenerating = false;
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

    // Math Helpers for True LCM calculation
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