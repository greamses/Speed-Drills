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
let touchStartX = 0;
let touchStartTime = 0;

// Metric units data
const metricTypes = ['m', 'l', 'g'];
const metricPrefixes = ['m', 'c', 'd', '', 'da', 'h', 'k'];
const prefixNames = ['milli', 'centi', 'deci', '', 'deca', 'hecto', 'kilo'];
const prefixValues = [0.001, 0.01, 0.1, 1, 10, 100, 1000];

let currentFromIndex = 3;
let currentToIndex = 5;
let currentType = 'm';

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
    
    switch (level) {
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
    // Reset feedback
    resetFeedback();
    
    // Set random metric type (m, l, g)
    currentType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
    
    // Generate problem based on difficulty
    let fromValue;
    switch (difficulty) {
        case "easy":
            fromValue = (Math.random() * 10).toFixed(1);
            currentFromIndex = 3; // base unit
            currentToIndex = Math.random() > 0.5 ?
                Math.min(6, currentFromIndex + Math.floor(Math.random() * 2) + 1) : // to smaller unit
                Math.max(0, currentFromIndex - Math.floor(Math.random() * 2) - 1); // to larger unit
            break;
        case "medium":
            fromValue = (Math.random() * 100).toFixed(Math.floor(Math.random() * 2) + 1);
            currentFromIndex = Math.floor(Math.random() * 5) + 1; // between h and d
            currentToIndex = Math.random() > 0.5 ?
                Math.min(6, currentFromIndex + Math.floor(Math.random() * 3) + 1) :
                Math.max(0, currentFromIndex - Math.floor(Math.random() * 3) - 1);
            break;
        case "hard":
            fromValue = (Math.random() * 1000).toFixed(Math.floor(Math.random() * 3) + 1);
            currentFromIndex = Math.floor(Math.random() * 7); // any prefix
            do {
                currentToIndex = Math.floor(Math.random() * 7);
            } while (currentToIndex === currentFromIndex); // ensure different units
            break;
    }
    
    // Update problem display with full names
    document.getElementById("practice-number").textContent = fromValue;
    document.getElementById("from-unit").textContent = getFullUnitName(currentFromIndex);
    document.getElementById("to-unit").textContent = getFullUnitName(currentToIndex);
    
    // Reset active decimal position
    const tags = document.querySelectorAll('.unit-tag');
    tags.forEach(tag => tag.classList.remove('active'));
    if (tags[currentFromIndex]) {
        tags[currentFromIndex].classList.add('active');
    }
    
    // Update unit tags display
    updateUnitTags();
    
    // Reset editable number
    editableNumber.textContent = fromValue;
    totalCount++;
    totalCountElement.textContent = totalCount;
    
    updateProgressBar();
}

function getUnitName(index) {
    return (metricPrefixes[index] || '') + currentType;
}

function getFullUnitName(index) {
    const prefix = prefixNames[index] ? prefixNames[index] + ' ' : '';
    let unit;
    switch(currentType) {
        case 'm': unit = 'meter'; break;
        case 'l': unit = 'liter'; break;
        case 'g': unit = 'gram'; break;
    }
    
    // Handle pluralization (if value is not 1)
    const fromValue = parseFloat(document.getElementById("practice-number").textContent);
    if (Math.abs(fromValue - 1) > 0.0001) {
        unit += 's'; // pluralize
    }
    
    return prefix + unit;
}

function updateUnitTags() {
    const container = document.getElementById("unit-tags-container");
    container.innerHTML = '';
    
    // Add conversion arrow
    const arrow = document.createElement('div');
    arrow.className = 'conversion-arrow';
    const steps = currentToIndex - currentFromIndex;
    arrow.classList.add(steps > 0 ? 'right-direction' : 'left-direction');
    container.appendChild(arrow);
    
    // Create tags in order from k (left) to m (right)
    for (let i = 0; i < metricPrefixes.length; i++) {
        const prefix = metricPrefixes[i];
        const tag = document.createElement('div');
        const prefixClass = prefix === '' ? 'base' :
            prefix === 'da' ? 'dk' : // Handle 'da' class for styling
            prefix;
        tag.className = `unit-tag ${prefixClass}`;
        if (i === currentFromIndex) tag.classList.add('from-unit');
        if (i === currentToIndex) tag.classList.add('to-unit');
        
        // Set abbreviation as text content
        tag.textContent = prefix + currentType;
        
        // Add title with full name
        tag.title = getFullUnitName(i);
        
        // Add decimal tracker
        const decimalTracker = document.createElement('div');
        decimalTracker.className = 'decimal-tracker';

        tag.appendChild(decimalTracker);
        
        // Highlight active decimal position
        if (i === currentFromIndex) {
            tag.classList.add('active');
        }
        
        container.appendChild(tag);
    }
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
    

    editableNumber.innerHTML = `${before}<span class="decimal-highlight">${decimal}</span>${after}`;
    
    const tags = document.querySelectorAll('.unit-tag');
    let currentActiveIndex = -1;
    tags.forEach((tag, index) => {
        if (tag.classList.contains('active')) {
            currentActiveIndex = index;
        }
    });
    

    if (currentActiveIndex === -1) {
        currentActiveIndex = currentFromIndex;
    }
    

    const newIndex = currentActiveIndex - direction;
    

    if (newIndex < 0 || newIndex >= tags.length) {

        numberContainer.classList.add("shake");
        setTimeout(() => numberContainer.classList.remove("shake"), 300);
        
        // Show boundary message
        if (newIndex < 0) {
            feedbackElement.textContent = "Can't move further right (millimeters is the smallest unit)";
        } else {
            feedbackElement.textContent = "Can't move further left (kilometers is the largest unit)";
        }
        feedbackElement.className = "feedback boundary";
        setTimeout(() => resetFeedback(), 1500);
        
        document.head.removeChild(document.querySelector('style[data-decimal-highlight]'));
        return;
    }
    
    // Only proceed with the move if it's within bounds
    if (direction > 0 && decimalIndex < numStr.length - 1) {
        // Move decimal right in the number (left in unit tags)
        editableNumber.textContent =
            numStr.slice(0, decimalIndex) +
            numStr[decimalIndex + 1] +
            "." +
            numStr.slice(decimalIndex + 2);
        
        // Update decimal position visualization
        updateDecimalPosition(1);
    } else if (direction < 0 && decimalIndex > 0) {
        // Move decimal left in the number (right in unit tags)
        editableNumber.textContent =
            numStr.slice(0, decimalIndex - 1) +
            "." +
            numStr[decimalIndex - 1] +
            numStr.slice(decimalIndex + 1);
        
        // Update decimal position visualization
        updateDecimalPosition(-1);
    }
    
    addDecimalHighlightStyle();
    setTimeout(() => {
        document.head.removeChild(document.querySelector('style[data-decimal-highlight]'));
        removeExtraZeros();
        animateNumberChange();
    }, 500);
}

function updateDecimalPosition(direction) {
    const tags = document.querySelectorAll('.unit-tag');
    
    // Find current active tag
    let currentActiveIndex = -1;
    tags.forEach((tag, index) => {
        if (tag.classList.contains('active')) {
            currentActiveIndex = index;
            tag.classList.remove('active');
        }
    });
    
    // If no active tag found (shouldn't happen), default to fromIndex
    if (currentActiveIndex === -1) {
        currentActiveIndex = currentFromIndex;
    }
    
    // Calculate new index based on direction
    const newIndex = currentActiveIndex - direction; // Note: we subtract direction here
    
    // Only update if new index is valid
    if (newIndex >= 0 && newIndex < tags.length) {
        tags[newIndex].classList.add('active');
        
        // Animate the decimal tracker
        const decimalTracker = tags[newIndex].querySelector('.decimal-tracker');
        decimalTracker.style.transform = 'translateX(-50%, -50%) rotate(-90deg) scale(1.5)';
        setTimeout(() => {
            decimalTracker.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
        }, 300);
    } else {
        // If invalid position, revert to current active index
        if (currentActiveIndex >= 0) {
            tags[currentActiveIndex].classList.add('active');
        }
    }
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

function handleKeyDown(e) {
    if (practiceScreen.classList.contains("hidden")) return;
    
    switch (e.key) {
        case "ArrowLeft":
            moveDecimal(-1);
            break;
        case "ArrowRight":
            moveDecimal(1);
            break;
        case "Enter":
            checkAnswer();
            break;
    }
}

function checkAnswer() {
    const fromValue = parseFloat(document.getElementById("practice-number").textContent);
    const userAnswer = parseFloat(editableNumber.textContent);
    
    // Calculate correct answer
    const fromFactor = prefixValues[currentFromIndex];
    const toFactor = prefixValues[currentToIndex];
    const correctAnswer = fromValue * (fromFactor / toFactor);
    
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
    const steps = currentToIndex - currentFromIndex;
    const direction = steps > 0 ? "RIGHT" : "LEFT";
    const absSteps = Math.abs(steps);
    
    feedbackElement.textContent = `Convert ${getFullUnitName(currentFromIndex)} to ${getFullUnitName(currentToIndex)} by moving the decimal point ${absSteps} place${absSteps !== 1 ? 's' : ''} to the ${direction}.`;
    feedbackElement.className = "feedback";
}