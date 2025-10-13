document.addEventListener('DOMContentLoaded', function() {
  const shapeElement = document.getElementById('shape');
  const questionDisplay = document.getElementById('questionDisplay');
  const userAnswerInput = document.getElementById('userAnswer');
  const submitBtn = document.getElementById('submitBtn');
  const feedbackDisplay = document.getElementById('feedback');
  const scoreDisplay = document.getElementById('score');
  const shapeSelector = document.getElementById('shapeSelector');
  const labelsContainer = document.getElementById('labelsContainer');
  const shapeContainer = document.getElementById('shapeContainer');
  
  let currentQuestion = null;
  let score = 0;
  let timer;
  let timeLeft = 45;
  const timerDisplay = document.createElement('div');
  timerDisplay.id = 'timerDisplay';
  shapeContainer.appendChild(timerDisplay);
  
  const shapes = [
    { id: 'trapezium', name: 'Trapezium', params: ['parallel side a (a)', 'parallel side b (b)', 'height (h)'] },
    { id: 'parallelogram', name: 'Parallelogram', params: ['base (b)', 'height (h)', 'side (s)'] }
  ];
  
  shapes.forEach(shape => {
    const option = document.createElement('option');
    option.value = shape.id;
    option.textContent = shape.name;
    shapeSelector.appendChild(option);
  });
  
  function startTimer() {
    clearInterval(timer);
    timeLeft = 45;
    updateTimerDisplay();
    
    timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timer);
        endGame(`Time's up! The correct answer was ${currentQuestion.answer.toFixed(2)}.`);
      }
    }, 1000);
  }
  
  function updateTimerDisplay() {
    timerDisplay.textContent = ` ${timeLeft}s`;
    timerDisplay.style.color = timeLeft <= 3 ? 'red' : 'black';
  }
  
  function endGame(message) {
    feedbackDisplay.textContent = message;
    feedbackDisplay.classList.add('visible', 'incorrect');
    feedbackDisplay.classList.remove('correct');
    scoreDisplay.textContent = `Final Score: ${score}`;
    score = 0;
    userAnswerInput.disabled = true;
    submitBtn.disabled = true;
    shapeSelector.disabled = true;
    
    const playAgainBtn = document.createElement('button');
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.style.margin = '10px';
    playAgainBtn.addEventListener('click', function() {
      score = 0;
      userAnswerInput.disabled = false;
      submitBtn.disabled = false;
      shapeSelector.disabled = false;
      feedbackDisplay.innerHTML = '';
      newQuestion(shapeSelector.value);
      playAgainBtn.remove();
    });
    feedbackDisplay.appendChild(document.createElement('br'));
    feedbackDisplay.appendChild(playAgainBtn);
  }
  
  function newQuestion(shapeId) {
    currentQuestion = generateQuestion(shapeId);
    drawShapeWithSVG(currentQuestion);
    
    let questionText = '';
    if (currentQuestion.isReverse) {
      if (currentQuestion.calculationType === 'A_from_P' || currentQuestion.calculationType === 'P_from_A') {
        questionText = `${currentQuestion.calculationType === 'A_from_P' ? 'P → A, P' : 'A → P, A'}: ${currentQuestion.givenValue}`;
      } else {
        questionText = `${currentQuestion.type === 'A' ? 'A:' : 'P:'} ${currentQuestion.givenValue}, ${currentQuestion.hiddenParam}`;
      }
    } else {
      questionText = `${currentQuestion.type === 'A' ? 'A' : 'P'}`;
    }
    
    questionDisplay.textContent = questionText;
    userAnswerInput.value = '';
    feedbackDisplay.textContent = '';
    feedbackDisplay.className = 'feedback';
    userAnswerInput.focus();
    startTimer();
  }
  
  function checkAnswer() {
    clearInterval(timer);
    
    const userAnswer = parseFloat(userAnswerInput.value);
    if (isNaN(userAnswer)) {
      endGame(`Invalid answer. The correct answer is ${currentQuestion.answer.toFixed(2)}. Game over!`);
      return;
    }
    
    if (Math.abs(userAnswer - currentQuestion.answer) < 0.01) {
      handleCorrectAnswer();
    } else {
      endGame(`Incorrect. The correct answer is ${currentQuestion.answer.toFixed(2)}. Game over!`);
    }
  }
  
  function handleCorrectAnswer() {
    feedbackDisplay.textContent = 'Correct! Well done!';
    feedbackDisplay.classList.remove('incorrect');
    feedbackDisplay.classList.add('visible', 'correct');
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    setTimeout(() => {
      newQuestion(currentQuestion.shape);
    }, 500);
  }
  
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function generateQuestion(shapeId) {
  let question = { shape: shapeId };
  const calculationTypes = ['normal'];
  
  question.calculationType = calculationTypes[Math.floor(Math.random() * calculationTypes.length)];
  question.isReverse = question.calculationType === 'normal' ? Math.random() > 0.5 : true;
  question.type = Math.random() > 0.5 ? 'A' : 'P';
  
  switch (shapeId) {
    case 'trapezium':
      question.a = getRandomInt(5, 12); // Shorter parallel side
      question.b = getRandomInt(question.a + 2, question.a + 8); // Longer parallel side
      question.h = getRandomInt(4, 10); // Height
      
      const sideWidth = (question.b - question.a) / 2;
      // Calculate both non-parallel sides as integers
      question.s1 = Math.round(Math.sqrt(question.h * question.h + sideWidth * sideWidth));
      question.s2 = question.s1; // Make both sides equal
      
      if (question.isReverse) {
        if (question.type === 'A') {
          // For area reverse questions, hide one parameter
          const choice = Math.random();
          if (choice < 0.33) {
            question.answer = question.a;
            question.hiddenParam = 'a';
            question.shownParams = ['b', 'h'];
          } else if (choice < 0.67) {
            question.answer = question.b;
            question.hiddenParam = 'b';
            question.shownParams = ['a', 'h'];
          } else {
            question.answer = question.h;
            question.hiddenParam = 'h';
            question.shownParams = ['a', 'b'];
          }
          question.givenValue = 0.5 * (question.a + question.b) * question.h;
        } else {
          // For perimeter reverse questions, we must show all sides
          // So we'll ask to calculate perimeter from all sides (no hidden params)
          question.answer = question.a + question.b + question.s1 + question.s2;
          question.hiddenParam = null;
          question.shownParams = ['a', 'b', 's1', 's2'];
          question.givenValue = null; // Not needed for forward perimeter questions
        }
      } else {
        // Forward questions
        if (question.type === 'A') {
          question.answer = 0.5 * (question.a + question.b) * question.h;
          // For area, show all parameters
          question.shownParams = ['a', 'b', 'h'];
        } else {
          question.answer = question.a + question.b + question.s1 + question.s2;
          // For perimeter, show all sides
          question.shownParams = ['a', 'b', 's1', 's2'];
        }
      }
      break;
      
    case 'parallelogram':
      question.b = getRandomInt(6, 12); // Base
      question.h = getRandomInt(4, 10); // Height
      question.s = getRandomInt(Math.max(4, question.b - 3), question.b + 3); // Side
      
      if (question.isReverse) {
        if (question.type === 'A') {
          // For area reverse questions
          if (Math.random() > 0.5) {
            question.answer = question.b;
            question.hiddenParam = 'b';
            question.shownParams = ['h'];
          } else {
            question.answer = question.h;
            question.hiddenParam = 'h';
            question.shownParams = ['b'];
          }
          question.givenValue = question.b * question.h;
        } else {
          // For perimeter reverse questions, show both sides
          question.answer = 2 * (question.b + question.s);
          question.hiddenParam = null;
          question.shownParams = ['b', 's'];
          question.givenValue = null;
        }
      } else {
        // Forward questions
        if (question.type === 'A') {
          question.answer = question.b * question.h;
          question.shownParams = ['b', 'h'];
        } else {
          question.answer = 2 * (question.b + question.s);
          // For perimeter, show both sides
          question.shownParams = ['b', 's'];
        }
      }
      break;
  }
  
  return question;
}

function drawShapeWithSVG(question) {
  labelsContainer.innerHTML = '';
  shapeElement.innerHTML = '';
  
  const containerWidth = shapeContainer.clientWidth;
  const containerHeight = shapeContainer.clientHeight;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const scale = 12;
  
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`);
  svg.style.display = "block";
  
  switch (question.shape) {
    case 'trapezium': {
      let topWidth = question.a * scale;
      let bottomWidth = question.b * scale;
      let height = question.h * scale;
      
      const topLeft = { x: centerX - topWidth / 2, y: centerY - height / 2 };
      const topRight = { x: centerX + topWidth / 2, y: centerY - height / 2 };
      const bottomLeft = { x: centerX - bottomWidth / 2, y: centerY + height / 2 };
      const bottomRight = { x: centerX + bottomWidth / 2, y: centerY + height / 2 };
      
      const trapezium = document.createElementNS(svgNS, "path");
      trapezium.setAttribute("d", `M ${topLeft.x} ${topLeft.y} 
                                  L ${topRight.x} ${topRight.y} 
                                  L ${bottomRight.x} ${bottomRight.y} 
                                  L ${bottomLeft.x} ${bottomLeft.y} Z`);
      trapezium.setAttribute("fill", "#4CAF5099");
      trapezium.setAttribute("stroke", "#333");
      trapezium.setAttribute("stroke-width", "2");
      svg.appendChild(trapezium);
      
      // Show height only for area questions if it's shown
      if (question.type === 'A' && question.shownParams.includes('h')) {
        const heightLine = document.createElementNS(svgNS, "line");
        heightLine.setAttribute("x1", centerX);
        heightLine.setAttribute("y1", centerY - height / 2);
        heightLine.setAttribute("x2", centerX);
        heightLine.setAttribute("y2", centerY + height / 2);
        heightLine.setAttribute("stroke", "#333");
        heightLine.setAttribute("stroke-width", "1.5");
        heightLine.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(heightLine);
        addDimensionLine(svg, centerX - bottomWidth / 2 - 10, centerY - height / 2,
          centerX - bottomWidth / 2 - 10, centerY + height / 2,
          `${question.h}`, 'left');
      }
      
      // Always show all sides for perimeter, or shown sides for area
      addDimensionLine(svg, topLeft.x, topLeft.y - 10,
        topRight.x, topRight.y - 10,
        question.shownParams.includes('a') ? `${question.a}` : '?', 'top');
      
      addDimensionLine(svg, bottomLeft.x, bottomLeft.y + 10,
        bottomRight.x, bottomRight.y + 10,
        question.shownParams.includes('b') ? `${question.b}` : '?', 'bottom');
      
      // For perimeter or when sides are shown
      if (question.type === 'P' || question.shownParams.includes('s1')) {
        addDimensionLine(svg, topLeft.x - 10, topLeft.y,
          bottomLeft.x - 10, bottomLeft.y,
          question.shownParams.includes('s1') ? `${question.s1}` : '?', 'left');
      }
      
      if (question.type === 'P' || question.shownParams.includes('s2')) {
        addDimensionLine(svg, topRight.x + 10, topRight.y,
          bottomRight.x + 10, bottomRight.y,
          question.shownParams.includes('s2') ? `${question.s2}` : '?', 'right');
      }
      
      break;
    }
    
    case 'parallelogram': {
      let width = question.b * scale;
      let height = question.h * scale;
      const skew = width / 4;
      
      const topLeft = { x: centerX - width / 2 + skew, y: centerY - height / 2 };
      const topRight = { x: centerX + width / 2 + skew, y: centerY - height / 2 };
      const bottomLeft = { x: centerX - width / 2, y: centerY + height / 2 };
      const bottomRight = { x: centerX + width / 2, y: centerY + height / 2 };
      
      const parallelogram = document.createElementNS(svgNS, "path");
      parallelogram.setAttribute("d", `M ${topLeft.x} ${topLeft.y} 
                                     L ${topRight.x} ${topRight.y} 
                                     L ${bottomRight.x} ${bottomRight.y} 
                                     L ${bottomLeft.x} ${bottomLeft.y} Z`);
      parallelogram.setAttribute("fill", "#2196F399");
      parallelogram.setAttribute("stroke", "#333");
      parallelogram.setAttribute("stroke-width", "2");
      svg.appendChild(parallelogram);
      
      // Show height only for area questions if shown
      if (question.type === 'A' && question.shownParams.includes('h')) {
        const heightLine = document.createElementNS(svgNS, "line");
        heightLine.setAttribute("x1", centerX - width / 2 + skew / 2);
        heightLine.setAttribute("y1", centerY - height / 2);
        heightLine.setAttribute("x2", centerX - width / 2 + skew / 2);
        heightLine.setAttribute("y2", centerY + height / 2);
        heightLine.setAttribute("stroke", "#333");
        heightLine.setAttribute("stroke-width", "1.5");
        heightLine.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(heightLine);
        addDimensionLine(svg, bottomLeft.x - 10, bottomLeft.y,
          bottomLeft.x - 10 + skew, topLeft.y,
          `${question.h}`, 'left');
      }
      
      // Show base
      addDimensionLine(svg, bottomLeft.x, bottomLeft.y + 10,
        bottomRight.x, bottomRight.y + 10,
        question.shownParams.includes('b') ? `${question.b}` : '?', 'bottom');
      
      // Show side if it's shown or if it's a perimeter question
      if (question.shownParams.includes('s') || question.type === 'P') {
        addDimensionLine(svg, topLeft.x, topLeft.y - 10,
          bottomLeft.x, bottomLeft.y - 10,
          question.shownParams.includes('s') ? `${question.s}` : '?', 'left');
      }
      
      break;
    }
  }
  
  shapeElement.appendChild(svg);
}
  
  function addDimensionLine(svg, x1, y1, x2, y2, text, position) {
    const svgNS = "http://www.w3.org/2000/svg";
    
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#333");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
    
    if (position === 'top' || position === 'bottom') {
      const tick1 = document.createElementNS(svgNS, "line");
      tick1.setAttribute("x1", x1);
      tick1.setAttribute("y1", y1 - 5);
      tick1.setAttribute("x2", x1);
      tick1.setAttribute("y2", y1 + 5);
      tick1.setAttribute("stroke", "#333");
      tick1.setAttribute("stroke-width", "1");
      svg.appendChild(tick1);
      
      const tick2 = document.createElementNS(svgNS, "line");
      tick2.setAttribute("x1", x2);
      tick2.setAttribute("y1", y2 - 5);
      tick2.setAttribute("x2", x2);
      tick2.setAttribute("y2", y2 + 5);
      tick2.setAttribute("stroke", "#333");
      tick2.setAttribute("stroke-width", "1");
      svg.appendChild(tick2);
    } else {
      const tick1 = document.createElementNS(svgNS, "line");
      tick1.setAttribute("x1", x1 - 5);
      tick1.setAttribute("y1", y1);
      tick1.setAttribute("x2", x1 + 5);
      tick1.setAttribute("y2", y1);
      tick1.setAttribute("stroke", "#333");
      tick1.setAttribute("stroke-width", "1");
      svg.appendChild(tick1);
      
      const tick2 = document.createElementNS(svgNS, "line");
      tick2.setAttribute("x1", x2 - 5);
      tick2.setAttribute("y1", y2);
      tick2.setAttribute("x2", x2 + 5);
      tick2.setAttribute("y2", y2);
      tick2.setAttribute("stroke", "#333");
      tick2.setAttribute("stroke-width", "1");
      svg.appendChild(tick2);
    }
    
    const textElement = document.createElementNS(svgNS, "text");
    
    if (position === 'top') {
      textElement.setAttribute("x", (x1 + x2) / 2);
      textElement.setAttribute("y", y1 - 8);
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("dominant-baseline", "auto");
    } else if (position === 'bottom') {
      textElement.setAttribute("x", (x1 + x2) / 2);
      textElement.setAttribute("y", y1 + 20);
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("dominant-baseline", "hanging");
    } else if (position === 'left') {
      textElement.setAttribute("x", x1 - 15);
      textElement.setAttribute("y", (y1 + y2) / 2);
      textElement.setAttribute("text-anchor", "end");
      textElement.setAttribute("dominant-baseline", "middle");
    } else if (position === 'right') {
      textElement.setAttribute("x", x1 + 15);
      textElement.setAttribute("y", (y1 + y2) / 2);
      textElement.setAttribute("text-anchor", "start");
      textElement.setAttribute("dominant-baseline", "middle");
    }
    
    textElement.setAttribute("font-size", "18");
    textElement.setAttribute("fill", "#333");
    textElement.textContent = text;
    svg.appendChild(textElement);
  }
  
  submitBtn.addEventListener('click', checkAnswer);
  userAnswerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      checkAnswer();
    }
  });
  
  shapeSelector.addEventListener('change', function() {
    newQuestion(this.value);
  });
  
  window.addEventListener('resize', function() {
    if (currentQuestion) {
      drawShapeWithSVG(currentQuestion);
    }
  });
  
  newQuestion(shapes[0].id);
});

