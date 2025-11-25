document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    const primeContainer = document.getElementById('primeContainer');
    const headerRow = document.getElementById('headerRow');
    const messageEl = document.getElementById('message');
    const finalStage = document.getElementById('final-stage');
    const finalLabel = document.getElementById('final-label');
    const finalInput = document.getElementById('final-input');
    const finalInstruction = document.getElementById('final-instruction');
    const timerEl = document.getElementById('timer');
    const scoreEl = document.getElementById('score');
    const progressEl = document.getElementById('progress');
    
    // Dropdown Elements
    const dropdown = document.getElementById('mode-dropdown');
    const dropdownSelected = dropdown.querySelector('.dropdown-selected');
    const dropdownOptions = dropdown.querySelectorAll('.dropdown-option');
    const selectedModeText = document.getElementById('selected-mode-text');
    
    let currentNumber = 0;
    let initialNumber = 0;
    let historyFactors = [];
    let score = 0;
    let timeLeft = 60;
    let timerInterval;
    let gameActive = true;
    let isGenerating = false;
    let gameMode = 'sq_root'; 
    
    const MODES = {
        'sq_root': { label: '√N =', instruction: 'Find the Square Root.' },
        'cb_root': { label: '∛N =', instruction: 'Find the Cube Root.' },
        'mk_sq':   { label: 'Multiplier:', instruction: 'Smallest number to make a Perfect Square?' },
        'mk_cb':   { label: 'Multiplier:', instruction: 'Smallest number to make a Perfect Cube?' }
    };

    // --- 1. DROPDOWN LOGIC (Fixed) ---
    // Toggle dropdown
    dropdownSelected.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Handle Option Click
    dropdownOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            const text = option.textContent;
            
            // UI Update
            selectedModeText.textContent = text;
            gameMode = value;
            dropdown.classList.remove('active');
            
            // Restart Game
            resetGame();
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // --- 2. FINAL ANSWER AUTO-CHECK (Changed) ---
    finalInput.addEventListener('input', () => {
        if (!gameActive) return;
        
        const val = finalInput.value;
        if(!val) return; // Don't validate empty input

        const userAns = parseInt(val);
        const correctAns = calculateCorrectAnswer();

        if (userAns === correctAns) {
            // Success Sequence
            finalInput.classList.add('correct');
            finalInput.disabled = true; // Prevent double entry
            messageEl.style.color = "var(--success)";
            messageEl.textContent = "Correct! Loading next...";
            updateScore(10);
            
            // Auto advance after short delay
            setTimeout(() => {
                generateNewProblem();
            }, 1000);
        }
    });

    generateNewProblem();
    
    function resetGame() {
        score = 0;
        scoreEl.textContent = `Score: ${score}`;
        generateNewProblem();
    }

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 60;
        progressEl.style.width = '100%';
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `${timeLeft}s`;
            progressEl.style.width = `${(timeLeft / 60) * 100}%`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (gameActive) endGame("Time's up!");
            }
        }, 1000);
    }
    
    function createRow() {
        const row = document.createElement('div');
        row.classList.add('prime-row');
        
        const primeInput = document.createElement('input');
        primeInput.type = "number";
        primeInput.classList.add('prime-factor');
        primeInput.placeholder = "?";
        
        // Only autofocus on desktop to prevent keyboard jumping on mobile
        if(window.innerWidth > 600) primeInput.autofocus = true;
        
        const resultInput = document.createElement('input');
        resultInput.type = "number";
        resultInput.classList.add('factor-input');
        resultInput.disabled = true;

        // --- 3. SMALLEST PRIME ENFORCEMENT (Changed) ---
        primeInput.addEventListener('input', () => {
            if (!gameActive) return;
            const val = parseInt(primeInput.value);
            if (!val) return;

            // Determine the expected smallest prime factor
            const smallestPrime = getSmallestPrimeFactor(currentNumber);

            if (val === smallestPrime) {
                // Correct
                primeInput.classList.add('correct');
                primeInput.classList.remove('error');
                primeInput.disabled = true;
                
                resultInput.disabled = false;
                resultInput.focus();
                
                messageEl.style.color = "var(--text-color)";
                messageEl.textContent = `Correct! Now divide ${currentNumber} by ${val}.`;
            } else {
                // Incorrect
                primeInput.classList.add('error');
                messageEl.style.color = "var(--accent-color)";
                
                // Specific feedback
                if (currentNumber % val !== 0) {
                    messageEl.textContent = `${val} is not a factor of ${currentNumber}.`;
                } else if (!isPrime(val)) {
                    messageEl.textContent = `${val} is not a prime number.`;
                } else {
                    messageEl.textContent = `Order matters! Use the smallest prime (${smallestPrime}) first.`;
                }
            }
        });

        // Result Input Logic
        resultInput.addEventListener('input', () => {
            if (!gameActive) return;
            const userRes = parseInt(resultInput.value);
            const primeVal = parseInt(primeInput.value);
            const expectedRes = currentNumber / primeVal;

            if (userRes === expectedRes) {
                resultInput.classList.add('correct');
                resultInput.classList.remove('error');
                resultInput.disabled = true;
                
                historyFactors.push(primeVal);
                currentNumber = expectedRes;
                updateScore(1);

                if (currentNumber === 1) {
                    finishFactorization();
                } else {
                    createRow(); 
                }
            } else if (resultInput.value.length > 0 && resultInput.value.length >= expectedRes.toString().length) {
                // Only show error if they typed enough digits or wrong number
                 if(userRes !== expectedRes) resultInput.classList.add('error');
            }
        });
        
        row.appendChild(primeInput);
        row.appendChild(resultInput);
        primeContainer.appendChild(row);
        primeInput.focus();
    }
    
    function finishFactorization() {
        messageEl.textContent = "Factorization complete! Answer the final question.";
        finalStage.classList.remove('hidden');
        finalInput.value = '';
        finalInput.classList.remove('correct', 'error');
        finalInput.disabled = false;
        finalInput.focus();
        
        finalLabel.textContent = MODES[gameMode].label;
        finalInstruction.textContent = MODES[gameMode].instruction;
    }

    function calculateCorrectAnswer() {
        let ans = 0;
        if (gameMode === 'sq_root') {
            ans = Math.sqrt(initialNumber);
        } 
        else if (gameMode === 'cb_root') {
            ans = Math.cbrt(initialNumber);
        } 
        else if (gameMode === 'mk_sq') {
            const counts = getFactorCounts(historyFactors);
            let multiplier = 1;
            for (const [prime, count] of Object.entries(counts)) {
                if (count % 2 !== 0) multiplier *= parseInt(prime);
            }
            ans = multiplier;
        } 
        else if (gameMode === 'mk_cb') {
            const counts = getFactorCounts(historyFactors);
            let multiplier = 1;
            for (const [prime, count] of Object.entries(counts)) {
                const rem = count % 3;
                if (rem === 1) multiplier *= (parseInt(prime) * parseInt(prime)); 
                if (rem === 2) multiplier *= parseInt(prime); 
            }
            ans = multiplier;
        }
        return Math.round(ans); // Ensure integer
    }
    
    function generateNewProblem() {
        if (isGenerating) return;
        isGenerating = true;
        
        primeContainer.innerHTML = '';
        finalStage.classList.add('hidden');
        messageEl.style.color = "var(--text-color)";
        messageEl.textContent = "Start factorizing with the smallest prime.";
        
        historyFactors = [];
        gameActive = true;
        
        let num = 0;
        
        // Simplified Generation Logic
        if (gameMode === 'sq_root') {
            const base = Math.floor(Math.random() * 20) + 4; 
            num = base * base;
        } 
        else if (gameMode === 'cb_root') {
            const base = Math.floor(Math.random() * 8) + 2;
            num = base * base * base;
        }
        else if (gameMode === 'mk_sq') {
            const base = Math.floor(Math.random() * 12) + 2;
            const extraPrime = [2, 3, 5][Math.floor(Math.random() * 3)];
            num = base * base * extraPrime;
        }
        else if (gameMode === 'mk_cb') {
            const base = Math.floor(Math.random() * 5) + 2;
            const extraPrime = [2, 3][Math.floor(Math.random() * 2)];
            num = Math.pow(base, 3) * extraPrime;
        }

        initialNumber = num;
        currentNumber = num;
        
        headerRow.innerHTML = `<div>${num}</div>`;
        createRow();
        startTimer();
        isGenerating = false;
    }

    // Helper: Get Smallest Prime Factor
    function getSmallestPrimeFactor(n) {
        if (n % 2 === 0) return 2;
        for (let i = 3; i * i <= n; i += 2) {
            if (n % i === 0) return i;
        }
        return n;
    }

    // Helper: Is Prime (for fallback validation)
    function isPrime(num) {
        if (num <= 1) return false;
        if (num === 2) return true;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }
    
    function getFactorCounts(arr) {
        const counts = {};
        for (const num of arr) {
            counts[num] = (counts[num] || 0) + 1;
        }
        return counts;
    }

    function updateScore(points) {
        score += points;
        scoreEl.textContent = `Score: ${score}`;
        scoreEl.classList.add('success-animation');
        setTimeout(() => scoreEl.classList.remove('success-animation'), 200);
    }
    
    function endGame(msg) {
        gameActive = false;
        messageEl.style.color = "var(--accent-color)";
        messageEl.textContent = msg + " Refresh or change mode to restart.";
        document.querySelectorAll('input').forEach(i => i.disabled = true);
    }
}
