
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

function initializeGame() {
    // Wait for MathJax to be ready
    if (typeof MathJax === 'undefined') {
        window.addEventListener('load', initializeGame);
        return;
    }
    
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
    
    // Dropdown Logic
    const dropdown = document.getElementById('mode-dropdown');
    const dropdownSelected = dropdown.querySelector('.dropdown-selected');
    const dropdownOptions = dropdown.querySelectorAll('.dropdown-option');
    const selectedModeText = document.getElementById('selected-mode-text');
    
    // Keypad Logic Elements
    const keys = document.querySelectorAll('.key-btn');
    let activeInput = null; // Tracks which input was last clicked
    
    // Game State
    let currentCoeff = 0;
    let initialCoeff = 0;
    let currentVars = {};
    let initialVars = {};
    let historyFactors = [];
    let score = 0;
    let timeLeft = 120;
    let timerInterval;
    let gameActive = true;
    let isGenerating = false;
    let gameMode = 'sq_root'; 
    
    const MODES = {
        'sq_root': { label: '$$\\sqrt (n) = $$', instruction: 'Find the Square Root.' },
        'cb_root': { label: '$$\\sqrt[3] (n) = $$', instruction: 'Find the Cube Root.' },
        'mk_sq':   { label: 'Multiplier:', instruction: 'Smallest term to make a Perfect Square?' },
        'mk_cb':   { label: 'Multiplier:', instruction: 'Smallest term to make a Perfect Cube?' }
    };

    // --- 1. KEYPAD LOGIC ---
    
    // Track focus
    document.addEventListener('focusin', (e) => {
        if(e.target.tagName === 'INPUT') {
            activeInput = e.target;
        }
    });

    // Handle clicks
    keys.forEach(key => {
        key.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent button from stealing focus
            if (!activeInput || activeInput.disabled) return;

            const char = key.getAttribute('data-key');
            
            if (key.id === 'key-backspace') {
                const val = activeInput.value;
                activeInput.value = val.slice(0, -1);
            } else {
                insertAtCursor(activeInput, char);
            }

            // Manually trigger input event so game logic runs
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    function insertAtCursor(myField, myValue) {
        if (myField.selectionStart || myField.selectionStart == '0') {
            var startPos = myField.selectionStart;
            var endPos = myField.selectionEnd;
            myField.value = myField.value.substring(0, startPos)
                + myValue
                + myField.value.substring(endPos, myField.value.length);
            // Move cursor to end of inserted text
            myField.selectionStart = startPos + myValue.length;
            myField.selectionEnd = startPos + myValue.length;
        } else {
            myField.value += myValue;
        }
        myField.focus();
    }

    // --- 2. DROPDOWN LOGIC ---
    dropdownSelected.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    dropdownOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.getAttribute('data-value');
            selectedModeText.textContent = option.textContent;
            gameMode = value;
            dropdown.classList.remove('active');
            resetGame();
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) dropdown.classList.remove('active');
    });

    // --- 3. FINAL ANSWER CHECK ---
    finalInput.addEventListener('input', () => {
        if (!gameActive) return;
        const val = cleanInput(finalInput.value);
        if(!val) return;

        const correctAnswer = calculateCorrectAnswer();
        
        if (val === correctAnswer) {
            finalInput.classList.add('correct');
            finalInput.disabled = true;
            
            // Format and display the answer with MathJax
            const answerObj = parseAnswerString(correctAnswer);
            const formattedAnswer = formatMonomialForDisplay(answerObj.c, answerObj.v);
            
            // Hide input and show formatted version
            finalInput.style.display = 'none';
            const mathSpan = document.createElement('span');
            mathSpan.className = 'math-display';
            mathSpan.innerHTML = `\\(${formattedAnswer}\\)`;
            finalInput.parentNode.insertBefore(mathSpan, finalInput.nextSibling);
            MathJax.typesetPromise([mathSpan]);
            
            messageEl.style.color = "var(--success)";
            messageEl.textContent = "Correct! Loading next...";
            updateScore(20);
            setTimeout(() => generateNewProblem(), 1500);
        }
    });

    finalInput.type = "text";
    // Set initial active input to final input if visible (safety fallback)
    activeInput = finalInput;
    generateNewProblem();
    
    function resetGame() {
        score = 0;
        scoreEl.textContent = `Score: ${score}`;
        generateNewProblem();
    }

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 120;
        progressEl.style.width = '100%';
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `${timeLeft}s`;
            progressEl.style.width = `${(timeLeft / 120) * 100}%`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (gameActive) endGame("Time's up!");
            }
        }, 1000);
    }
    
    // --- 4. GAME ROW GENERATION ---
    function createRow() {
        const row = document.createElement('div');
        row.classList.add('prime-row');
        
        const primeInput = document.createElement('input');
        primeInput.type = "text";
        primeInput.classList.add('prime-factor');
        primeInput.placeholder = "?";
        primeInput.autocomplete = "off";
        
        const resultInput = document.createElement('input');
        resultInput.type = "text";
        resultInput.classList.add('factor-input');
        resultInput.disabled = true;
        resultInput.autocomplete = "off";
        
        // Auto-focus logic
        if(window.innerWidth > 600) {
            primeInput.focus();
            activeInput = primeInput;
        }

        const isNumericPhase = currentCoeff > 1;

        // Logic: Left Input (Factor)
        primeInput.addEventListener('input', () => {
            if (!gameActive) return;
            const val = cleanInput(primeInput.value); 
            if (!val) return;

            const expectedFactor = getNextExpectedFactor();

            if (val == expectedFactor) {
                primeInput.classList.add('correct');
                primeInput.classList.remove('error');
                primeInput.disabled = true;
                
                resultInput.disabled = false;
                resultInput.focus();
                activeInput = resultInput; // Update keypad target
                
                if (isNumericPhase) {
                    messageEl.textContent = `Divide ${currentCoeff} by ${val}.`;
                } else {
                    messageEl.textContent = `Divide by ${val}.`;
                }
                messageEl.style.color = "var(--text-color)";
            } else {
                primeInput.classList.add('error');
                messageEl.style.color = "var(--accent-color)";
                if(isNumericPhase) {
                    if(isNaN(val)) messageEl.textContent = "Numbers first!";
                    else messageEl.textContent = `Use smallest prime: ${expectedFactor}`;
                } else {
                    messageEl.textContent = `Alphabetical order: ${expectedFactor}`;
                }
            }
        });

        // Logic: Right Input (Result)
        resultInput.addEventListener('input', () => {
            if (!gameActive) return;
            
            const userVal = cleanInput(resultInput.value);
            if(!userVal) return;

            const expectedResultObj = calculateNextResult(primeInput.value); 
            const expectedString = formatMonomialString(expectedResultObj.c, expectedResultObj.v);

            if (userVal === expectedString) {
                resultInput.classList.add('correct');
                resultInput.classList.remove('error');
                resultInput.disabled = true;
                
                // Format and display the result with MathJax
                const formattedResult = formatMonomialForDisplay(expectedResultObj.c, expectedResultObj.v);
                
                // Hide input and show formatted version
                resultInput.style.display = 'none';
                const mathSpan = document.createElement('span');
                mathSpan.className = 'math-display';
                mathSpan.innerHTML = `\\(${formattedResult}\\)`;
                row.appendChild(mathSpan);
                MathJax.typesetPromise([mathSpan]);
                
                const factor = isNumericPhase ? parseInt(primeInput.value) : primeInput.value;
                historyFactors.push(factor);
                
                currentCoeff = expectedResultObj.c;
                currentVars = expectedResultObj.v;
                updateScore(2);

                if (currentCoeff === 1 && Object.keys(currentVars).length === 0) {
                    finishFactorization();
                } else {
                    createRow(); 
                }
            } else {
                 if(userVal.length >= expectedString.length) resultInput.classList.add('error');
            }
        });
        
        row.appendChild(primeInput);
        row.appendChild(resultInput);
        primeContainer.appendChild(row);
    }

    // --- 5. LOGIC HELPERS ---

    function getNextExpectedFactor() {
        if (currentCoeff > 1) {
            if (currentCoeff % 2 === 0) return 2;
            for (let i = 3; i * i <= currentCoeff; i += 2) {
                if (currentCoeff % i === 0) return i;
            }
            return currentCoeff;
        }
        const sortedKeys = Object.keys(currentVars).sort();
        if (sortedKeys.length > 0) return sortedKeys[0];
        return null;
    }

    function calculateNextResult(divisorInput) {
        let newC = currentCoeff;
        let newV = { ...currentVars };

        const divVal = cleanInput(divisorInput);

        if (!isNaN(divVal)) {
            newC = currentCoeff / parseInt(divVal);
        } else {
            const char = divVal; 
            if (newV[char]) {
                newV[char]--;
                if (newV[char] === 0) delete newV[char];
            }
        }
        return { c: newC, v: newV };
    }

    function cleanInput(str) {
        if(!str) return '';
        // Remove spaces and converts ^2 to 2 for easier logic comparison
        return str.toString().replace(/\s/g, '').replace(/\^/g, '').toLowerCase();
    }

    function formatMonomialString(c, v) {
        let str = (c === 1 && Object.keys(v).length > 0) ? '' : c.toString();
        const sortedKeys = Object.keys(v).sort();
        for (let key of sortedKeys) {
            str += key;
            if (v[key] > 1) str += v[key];
        }
        return str || "1";
    }

    // NEW: Format for MathJax display with proper LaTeX
    function formatMonomialForDisplay(c, v) {
        let str = (c === 1 && Object.keys(v).length > 0) ? '' : c.toString();
        const sortedKeys = Object.keys(v).sort();
        for (let key of sortedKeys) {
            str += key;
            if (v[key] > 1) str += `^{${v[key]}}`; // LaTeX superscript format
        }
        return str || "1";
    }

    // NEW: Parse answer string back to coefficient and variables
    function parseAnswerString(str) {
        let c = 1;
        let v = {};
        
        // Extract coefficient
        const numMatch = str.match(/^\d+/);
        if (numMatch) {
            c = parseInt(numMatch[0]);
            str = str.substring(numMatch[0].length);
        }
        
        // Extract variables
        let i = 0;
        while (i < str.length) {
            const char = str[i];
            if (char >= 'a' && char <= 'z') {
                let exp = 1;
                if (i + 1 < str.length && !isNaN(str[i + 1])) {
                    exp = parseInt(str[i + 1]);
                    i++;
                }
                v[char] = exp;
            }
            i++;
        }
        
        return { c, v };
    }

    function finishFactorization() {
        messageEl.textContent = "Solved! Answer the final question.";
        finalStage.classList.remove('hidden');
        finalInput.value = '';
        finalInput.classList.remove('correct', 'error');
        finalInput.disabled = false;
        finalInput.style.display = ''; // Reset display in case it was hidden
        
        // Remove any previous math display
        const existingMath = finalInput.parentNode.querySelector('.math-display');
        if (existingMath) existingMath.remove();
        
        finalInput.focus();
        activeInput = finalInput;
        
        // Render MathJax in Labels
        finalLabel.innerHTML = MODES[gameMode].label;
        finalInstruction.textContent = MODES[gameMode].instruction;
        MathJax.typesetPromise([finalLabel]);
    }

    function calculateCorrectAnswer() {
        let coeffAns = 1;
        let varAns = {};

        const numericFactors = historyFactors.filter(f => !isNaN(f));
        const varFactors = historyFactors.filter(f => isNaN(f));
        
        const numCounts = getCounts(numericFactors);
        const varCounts = getCounts(varFactors);

        if (gameMode === 'sq_root') {
            coeffAns = Math.sqrt(initialCoeff);
            for (let v in initialVars) varAns[v] = initialVars[v] / 2;
        } 
        else if (gameMode === 'cb_root') {
            coeffAns = Math.cbrt(initialCoeff);
            for (let v in initialVars) varAns[v] = initialVars[v] / 3;
        } 
        else if (gameMode === 'mk_sq') {
            for (const [prime, count] of Object.entries(numCounts)) {
                if (count % 2 !== 0) coeffAns *= parseInt(prime);
            }
            for (const [v, count] of Object.entries(varCounts)) {
                if (count % 2 !== 0) varAns[v] = 1;
            }
        } 
        else if (gameMode === 'mk_cb') {
            for (const [prime, count] of Object.entries(numCounts)) {
                const rem = count % 3;
                if (rem === 1) coeffAns *= (parseInt(prime) * parseInt(prime)); 
                if (rem === 2) coeffAns *= parseInt(prime); 
            }
            for (const [v, count] of Object.entries(varCounts)) {
                const rem = count % 3;
                if (rem === 1) varAns[v] = 2; 
                if (rem === 2) varAns[v] = 1;
            }
        }
        
        return formatMonomialString(coeffAns, varAns);
    }

    function getCounts(arr) {
        const counts = {};
        for (const item of arr) {
            counts[item] = (counts[item] || 0) + 1;
        }
        return counts;
    }

    // --- 6. GENERATION & MATHJAX ---
    function generateNewProblem() {
        if (isGenerating) return;
        isGenerating = true;
        
        primeContainer.innerHTML = '';
        finalStage.classList.add('hidden');
        messageEl.style.color = "var(--text-color)";
        messageEl.textContent = "Factor numbers, then letters.";
        
        historyFactors = [];
        gameActive = true;
        
        let c = 0;
        let v = {}; 
        const varsPool = ['x', 'y']; 
        
        if (gameMode === 'sq_root') {
            const base = Math.floor(Math.random() * 6) + 2; 
            c = base * base;
            varsPool.forEach(key => {
                if(Math.random() > 0.4) v[key] = 2; 
            });
            if(Object.keys(v).length === 0) v['x'] = 2;
        } 
        else if (gameMode === 'cb_root') {
            const base = Math.floor(Math.random() * 3) + 2;
            c = base * base * base;
            varsPool.forEach(key => {
                if(Math.random() > 0.6) v[key] = 3; 
            });
            if(Object.keys(v).length === 0) v['x'] = 3;
        }
        else {
            const base = Math.floor(Math.random() * 4) + 2;
            const extra = [2, 3][Math.floor(Math.random() * 2)];
            c = base * extra; 
            varsPool.forEach(key => {
                if(Math.random() > 0.4) v[key] = Math.floor(Math.random() * 3) + 1;
            });
            if(Object.keys(v).length === 0) v['x'] = 2;
        }

        initialCoeff = c;
        initialVars = {...v};
        currentCoeff = c;
        currentVars = v;
        
        // Build LaTeX String
        let latexVars = '';
        Object.keys(v).sort().forEach(key => {
            if(v[key] === 1) latexVars += `${key}`;
            else latexVars += `${key}^{${v[key]}}`;
        });

        // Set Header content with MathJax delimiters
        headerRow.innerHTML = `$$${c}${latexVars}$$`;
        
        // Trigger MathJax Render
        MathJax.typesetPromise([headerRow]).then(() => {
            createRow();
            startTimer();
            isGenerating = false;
        });
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
        messageEl.textContent = msg + " Refresh to restart.";
        document.querySelectorAll('input').forEach(i => i.disabled = true);
    }
}
