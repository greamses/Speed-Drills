// DOM Elements
const landingScreen = document.getElementById("landing-screen");
const tutorialScreen = document.getElementById("tutorial-screen");
const practiceScreen = document.getElementById("practice-screen");

const learnBtn = document.getElementById("learn-btn");
const practiceBtn = document.getElementById("practice-btn");
const backToMenuBtn = document.getElementById("back-to-menu");
const tutorialToMenuBtn = document.getElementById("tutorial-to-menu");
const tutorialToPracticeBtn = document.getElementById("tutorial-to-practice");

const editableNumber = document.getElementById("editable-number");
const numberContainer = document.getElementById("number-container");
const feedbackElement = document.getElementById("feedback");
const progressBar = document.getElementById("progress-bar");
const currentLevelElement = document.getElementById("current-level");
const streakElement = document.getElementById("streak");
const correctCountElement = document.getElementById("correct-count");
const totalCountElement = document.getElementById("total-count");

const prevTutorialBtn = document.getElementById("prev-tutorial");
const nextTutorialBtn = document.getElementById("next-tutorial");
const hintButton = document.getElementById("hint-button");

// Custom dropdown elements
const dropdown = document.querySelector('.dropdown');
const dropdownSelected = document.getElementById('dropdown-selected');
const dropdownOptions = document.querySelector('.dropdown-options');
const dropdownOptionItems = document.querySelectorAll('.dropdown-option');

// Tutorial steps
const tutorialSteps = document.querySelectorAll(".tutorial-step");
let currentTutorialStep = 0;

// Game variables
let currentLevel = 1;
let currentStreak = 0;
let correctCount = 0;
let totalCount = 0;
let difficulty = "easy";
let isMultiplication = true;
let touchStartX = 0;
let touchStartTime = 0;

// Initialize the app
init();

function init() {
    setupEventListeners();
    generatePracticeProblem();
    updateTutorialNavigation();
}

function setupEventListeners() {
    // Screen navigation
    learnBtn.addEventListener("click", showTutorialScreen);
    practiceBtn.addEventListener("click", showPracticeScreen);
    backToMenuBtn.addEventListener("click", showLandingScreen);
    tutorialToMenuBtn.addEventListener("click", showLandingScreen);
    tutorialToPracticeBtn.addEventListener("click", showPracticeScreen);

    // Number manipulation
    document.getElementById("add-zero-left").addEventListener("click", addZeroLeft);
    document.getElementById("add-zero-right").addEventListener("click", addZeroRight);
    document.getElementById("remove-zeros").addEventListener("click", removeExtraZeros);
    document.getElementById("move-left").addEventListener("click", () => moveDecimal(-1));
    document.getElementById("move-right").addEventListener("click", () => moveDecimal(1));
    document.getElementById("check-answer").addEventListener("click", checkAnswer);
    document.getElementById("new-problem").addEventListener("click", generatePracticeProblem);
    
    // Tutorial navigation
    prevTutorialBtn.addEventListener("click", showPreviousTutorialStep);
    nextTutorialBtn.addEventListener("click", showNextTutorialStep);
    
    // Custom dropdown functionality
    setupDropdown();
    
    // Hint button
    hintButton.addEventListener("click", showHint);

    // Touch and drag support for editable number
    numberContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
    numberContainer.addEventListener("touchmove", handleTouchMove, { passive: false });
    numberContainer.addEventListener("touchend", handleTouchEnd);
    
    // Keyboard support
    document.addEventListener("keydown", handleKeyDown);
}

function setupDropdown() {
    dropdownSelected.addEventListener("click", toggleDropdown);
    
    dropdownOptionItems.forEach(option => {
        option.addEventListener("click", () => {
            const value = option.getAttribute("data-value");
            setDifficulty(value);
            closeDropdown();
        });
    });
    
    document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target)) {
            closeDropdown();
        }
    });
}

function toggleDropdown() {
    dropdown.classList.toggle("open");
}

function closeDropdown() {
    dropdown.classList.remove("open");
}

// Screen navigation functions
function showLandingScreen() {
    tutorialScreen.classList.add("hidden");
    practiceScreen.classList.add("hidden");
    landingScreen.classList.remove("hidden");
}

function showTutorialScreen() {
    landingScreen.classList.add("hidden");
    practiceScreen.classList.add("hidden");
    tutorialScreen.classList.remove("hidden");
    showTutorialStep(0);
}

function showPracticeScreen() {
    landingScreen.classList.add("hidden");
    tutorialScreen.classList.add("hidden");
    practiceScreen.classList.remove("hidden");
    generatePracticeProblem();
}

function showPreviousTutorialStep() {
    if (currentTutorialStep > 0) {
        showTutorialStep(currentTutorialStep - 1);
    }
}

function showNextTutorialStep() {
    if (currentTutorialStep < tutorialSteps.length - 1) {
        showTutorialStep(currentTutorialStep + 1);
    }
}

function showTutorialStep(stepIndex) {
    tutorialSteps.forEach(step => step.classList.remove("active"));
    tutorialSteps[stepIndex].classList.add("active");
    currentTutorialStep = stepIndex;
    updateTutorialNavigation();
}

function updateTutorialNavigation() {
    prevTutorialBtn.classList.toggle("hidden", currentTutorialStep === 0);
    nextTutorialBtn.classList.toggle("hidden", currentTutorialStep === tutorialSteps.length - 1);
}

function setDifficulty(level) {
    difficulty = level;
    let icon, text;
    
    switch(level) {
        case "easy":
            icon = '<i class="fas fa-smile"></i>';
            text = "Easy";
            break;
        case "medium":
            icon = '<i class="fas fa-meh"></i>';
            text = "Medium";
            break;
        case "hard":
            icon = '<i class="fas fa-frown"></i>';
            text = "Hard";
            break;
    }
    
    dropdownSelected.innerHTML = `<span>${icon} ${text}</span><i class="fas fa-chevron-down dropdown-arrow"></i>`;
    
    if (!practiceScreen.classList.contains("hidden")) {
        generatePracticeProblem();
    }
}

function generatePracticeProblem() {
    let num, multiplier;
    isMultiplication = Math.random() > 0.3; // 70% chance for multiplication
    
    // Reset feedback
    resetFeedback();
    
    // Generate problem based on difficulty
    switch (difficulty) {
        case "easy":
            num = (Math.random() * 10).toFixed(1);
            multiplier = [10, 100][Math.floor(Math.random() * 2)];
            break;
        case "medium":
            num = (Math.random() * 100).toFixed(Math.floor(Math.random() * 2) + 1);
            multiplier = [10, 100, 1000][Math.floor(Math.random() * 3)];
            break;
        case "hard":
            num = (Math.random() * 1000).toFixed(Math.floor(Math.random() * 3) + 1);
            multiplier = [10, 100, 1000, 10000][Math.floor(Math.random() * 4)];
            break;
    }
    
    // Update problem display
    document.getElementById("practice-number").textContent = num;
    document.getElementById("practice-multiplier").textContent = multiplier;
    document.getElementById("operation-symbol").textContent = isMultiplication ? "×" : "÷";
    
    // Reset editable number
    editableNumber.textContent = num;
    totalCount++;
    totalCountElement.textContent = totalCount;
    
    updateProgressBar();
}

function resetFeedback() {
    feedbackElement.textContent = "";
    feedbackElement.className = "feedback";
}

function updateProgressBar() {
    const progress = (currentStreak / 5) * 100;
    progressBar.style.width = `${progress}%`;
    currentLevelElement.textContent = currentLevel;
}

// Number manipulation functions
function addZeroLeft() {
    let numStr = editableNumber.textContent;
    editableNumber.textContent = numStr.includes(".") ? "0" + numStr : "0." + numStr;
    animateNumberChange();
}

function addZeroRight() {
    let numStr = editableNumber.textContent;
    editableNumber.textContent = numStr.includes(".") ? numStr + "0" : numStr + ".0";
    animateNumberChange();
}

function removeExtraZeros() {
    let numStr = editableNumber.textContent;
    const hadDecimal = numStr.includes(".");
    
    numStr = numStr.replace(/^0+(?=\d)/, "");
    
    if (numStr.includes(".")) {
        numStr = numStr.replace(/\.?0+$/, "");
        if (numStr.endsWith(".")) numStr = numStr.slice(0, -1);
    }
    
    if (numStr === "" || numStr.startsWith(".")) numStr = "0" + numStr;
    if (hadDecimal && !numStr.includes(".")) numStr = numStr + ".0";
    
    editableNumber.textContent = numStr;
    animateNumberChange();
}

function animateNumberChange() {
    numberContainer.classList.add("shake");
    setTimeout(() => numberContainer.classList.remove("shake"), 500);
}

function moveDecimal(direction) {
    let numStr = editableNumber.textContent;
    
    if (!numStr.includes(".")) numStr = numStr + ".0";
    
    const decimalIndex = numStr.indexOf(".");
    const before = numStr.substring(0, decimalIndex);
    const decimal = numStr.substring(decimalIndex, decimalIndex + 1);
    const after = numStr.substring(decimalIndex + 1);
    
    // Highlight decimal temporarily
    editableNumber.innerHTML = `${before}<span class="decimal-highlight">${decimal}</span>${after}`;
    
    if (direction > 0 && decimalIndex < numStr.length - 1) {
        // Move right
        editableNumber.textContent = 
            numStr.slice(0, decimalIndex) +
            numStr[decimalIndex + 1] +
            "." +
            numStr.slice(decimalIndex + 2);
    } else if (direction < 0 && decimalIndex > 0) {
        // Move left
        editableNumber.textContent = 
            numStr.slice(0, decimalIndex - 1) +
            "." +
            numStr[decimalIndex - 1] +
            numStr.slice(decimalIndex + 1);
    }
    
    addDecimalHighlightStyle();
    setTimeout(() => {
        document.head.removeChild(document.querySelector('style[data-decimal-highlight]'));
        removeExtraZeros();
        animateNumberChange();
    }, 500);
}

function addDecimalHighlightStyle() {
    const style = document.createElement('style');
    style.setAttribute('data-decimal-highlight', 'true');
    style.textContent = `
        .decimal-highlight {
            color: orange;
            font-weight: bold;
            position: relative;
        }
        .decimal-highlight::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: orange;
            animation: decimalPulse 0.5s;
        }
        @keyframes decimalPulse {
            0% { transform: scaleX(0.5); opacity: 0; }
            50% { transform: scaleX(1.2); opacity: 1; }
            100% { transform: scaleX(1); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Touch handlers
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartTime = Date.now();
    numberContainer.classList.add("highlight");
}

function handleTouchMove(e) {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - touchStartX;
    
    if (Math.abs(deltaX) > 30) {
        moveDecimal(deltaX > 0 ? 1 : -1);
        touchStartX = touchX;
    }
}

function handleTouchEnd() {
    numberContainer.classList.remove("highlight");
}

// Keyboard handler
function handleKeyDown(e) {
    if (practiceScreen.classList.contains("hidden")) return;
    
    switch(e.key) {
        case "ArrowLeft": moveDecimal(-1); break;
        case "ArrowRight": moveDecimal(1); break;
        case "Enter": checkAnswer(); break;
    }
}

// Game logic functions
function checkAnswer() {
    const problemNum = parseFloat(document.getElementById("practice-number").textContent);
    const multiplier = parseInt(document.getElementById("practice-multiplier").textContent);
    const isMultiplication = document.getElementById("operation-symbol").textContent === "×";
    
    const userAnswer = parseFloat(editableNumber.textContent);
    const correctAnswer = isMultiplication ? problemNum * multiplier : problemNum / multiplier;
    const isCorrect = Math.abs(userAnswer - correctAnswer) < 0.00001;

    if (isCorrect) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer();
    }
    
    updateProgressBar();
}

function handleCorrectAnswer() {
    currentStreak++;
    correctCount++;
    correctCountElement.textContent = correctCount;
    streakElement.textContent = currentStreak;
    
    feedbackElement.textContent = "Excellent! That's correct! 🎉";
    feedbackElement.className = "feedback correct";
    
    if (currentStreak >= 5) {
        currentLevel++;
        currentStreak = 0;
        feedbackElement.textContent = `Level Up! You're now at level ${currentLevel}! 🏆`;
    }
    
    setTimeout(generatePracticeProblem, 1500);
}

function handleIncorrectAnswer() {
    currentStreak = 0;
    streakElement.textContent = currentStreak;
    feedbackElement.textContent = "Not quite. Try again!";
    feedbackElement.className = "feedback incorrect";
    animateNumberChange();
}

function showHint() {
    const problemNum = parseFloat(document.getElementById("practice-number").textContent);
    const multiplier = parseInt(document.getElementById("practice-multiplier").textContent);
    const isMultiplication = document.getElementById("operation-symbol").textContent === "×";
    
    const places = Math.log10(multiplier);
    const direction = isMultiplication ? "RIGHT" : "LEFT";
    const operation = isMultiplication ? "multiplying" : "dividing";
    
    feedbackElement.textContent = `When ${operation} by ${multiplier}, move the decimal point ${places} places to the ${direction}.`;
    feedbackElement.className = "feedback";
}