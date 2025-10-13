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
    { id: 'rhombus', name: 'Rhombus', params: ['side (a)', 'diagonal 1 (d1)', 'diagonal 2 (d2)'] },
    { id: 'kite', name: 'Kite', params: ['side a (a)', 'side b (b)', 'diagonal 1 (d1)', 'diagonal 2 (d2)'] }
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
      case 'rhombus':
        // For rhombus, all sides are equal
        question.a = getRandomInt(5, 12); // Side length
        question.d1 = getRandomInt(5, 15); // Diagonal 1
        question.d2 = getRandomInt(5, 15); // Diagonal 2
        
        if (question.isReverse) {
          if (question.type === 'A') {
            // For area reverse questions, we don't hide any sides - only diagonals
            const choice = Math.random();
            if (choice < 0.5) {
              question.answer = question.d1;
              question.hiddenParam = 'd1';
              question.shownParams = ['d2'];
            } else {
              question.answer = question.d2;
              question.hiddenParam = 'd2';
              question.shownParams = ['d1'];
            }
            question.givenValue = 0.5 * question.d1 * question.d2;
          } else {
            // For perimeter reverse questions, we can ask for side length
            question.answer = question.a;
            question.hiddenParam = 'a';
            question.shownParams = [];
            question.givenValue = 4 * question.a;
          }
        } else {
          // Forward questions
          if (question.type === 'A') {
            question.answer = 0.5 * question.d1 * question.d2;
            question.shownParams = ['d1', 'd2'];
          } else {
            question.answer = 4 * question.a;
            question.shownParams = ['a'];
          }
        }
        break;
        
      case 'kite':
        question.a = getRandomInt(5, 10); // Side a
        question.b = getRandomInt(5, 10); // Side b (different from a)
        question.d1 = getRandomInt(8, 16); // Diagonal 1 (longer diagonal)
        question.d2 = getRandomInt(5, 12); // Diagonal 2 (shorter diagonal)
        
        if (question.isReverse) {
          if (question.type === 'A') {
            // For area reverse questions, only hide diagonals, not sides
            const choice = Math.random();
            if (choice < 0.5) {
              question.answer = question.d1;
              question.hiddenParam = 'd1';
              question.shownParams = ['d2'];
            } else {
              question.answer = question.d2;
              question.hiddenParam = 'd2';
              question.shownParams = ['d1'];
            }
            question.givenValue = 0.5 * question.d1 * question.d2;
          } else {
            // For perimeter reverse questions, we can hide one side
            const choice = Math.random();
            if (choice < 0.5) {
              question.answer = question.a;
              question.hiddenParam = 'a';
              question.shownParams = ['b'];
            } else {
              question.answer = question.b;
              question.hiddenParam = 'b';
              question.shownParams = ['a'];
            }
            question.givenValue = 2 * (question.a + question.b);
          }
        } else {
          // Forward questions
          if (question.type === 'A') {
            question.answer = 0.5 * question.d1 * question.d2;
            question.shownParams = ['d1', 'd2'];
          } else {
            question.answer = 2 * (question.a + question.b);
            question.shownParams = ['a', 'b'];
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
      case 'rhombus': {
        const d1 = question.d1 * scale;
        const d2 = question.d2 * scale;
        
        // Rhombus points (diagonals intersect at right angles)
        const top = { x: centerX, y: centerY - d2/2 };
        const right = { x: centerX + d1/2, y: centerY };
        const bottom = { x: centerX, y: centerY + d2/2 };
        const left = { x: centerX - d1/2, y: centerY };
        
        const rhombus = document.createElementNS(svgNS, "path");
        rhombus.setAttribute("d", `M ${top.x} ${top.y} 
                                  L ${right.x} ${right.y} 
                                  L ${bottom.x} ${bottom.y} 
                                  L ${left.x} ${left.y} Z`);
        rhombus.setAttribute("fill", "#FF980099");
        rhombus.setAttribute("stroke", "#333");
        rhombus.setAttribute("stroke-width", "2");
        svg.appendChild(rhombus);
        
        // Draw diagonals if they're shown
        if (question.type === 'A' && (question.shownParams.includes('d1') || question.shownParams.includes('d2'))) {
          const diag1 = document.createElementNS(svgNS, "line");
          diag1.setAttribute("x1", left.x);
          diag1.setAttribute("y1", left.y);
          diag1.setAttribute("x2", right.x);
          diag1.setAttribute("y2", right.y);
          diag1.setAttribute("stroke", "#333");
          diag1.setAttribute("stroke-width", "1");
          diag1.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(diag1);
          
          const diag2 = document.createElementNS(svgNS, "line");
          diag2.setAttribute("x1", top.x);
          diag2.setAttribute("y1", top.y);
          diag2.setAttribute("x2", bottom.x);
          diag2.setAttribute("y2", bottom.y);
          diag2.setAttribute("stroke", "#333");
          diag2.setAttribute("stroke-width", "1");
          diag2.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(diag2);
        }
        
        // Show diagonals if they're shown (for area questions)
        if (question.type === 'A') {
          if (question.shownParams.includes('d1')) {
            addDimensionLine(svg, left.x, left.y, right.x, right.y, 
                            `${question.d1}`, 'horizontal');
          } else if (question.hiddenParam === 'd1') {
            addDimensionLine(svg, left.x, left.y, right.x, right.y, 
                            '?', 'horizontal');
          }
          
          if (question.shownParams.includes('d2')) {
            addDimensionLine(svg, top.x, top.y, bottom.x, bottom.y, 
                            `${question.d2}`, 'vertical');
          } else if (question.hiddenParam === 'd2') {
            addDimensionLine(svg, top.x, top.y, bottom.x, bottom.y, 
                            '?', 'vertical');
          }
        }
        
        // Show side if it's shown (for perimeter questions)
        if (question.type === 'P') {
          if (question.shownParams.includes('a')) {
            addDimensionLine(svg, top.x, top.y, right.x, right.y, 
                           `${question.a}`, 'diagonal');
          } else if (question.hiddenParam === 'a') {
            addDimensionLine(svg, top.x, top.y, right.x, right.y, 
                           '?', 'diagonal');
          }
        }
        
        break;
      }
      
      case 'kite': {
        const d1 = question.d1 * scale;
        const d2 = question.d2 * scale;
        
        // Kite points (one diagonal is longer, and they intersect at right angles)
        // Let's make d1 the longer diagonal (vertical)
        const top = { x: centerX, y: centerY - d1/2 };
        const right = { x: centerX + d2/2, y: centerY };
        const bottom = { x: centerX, y: centerY + d1/2 };
        const left = { x: centerX - d2/2, y: centerY };
        
        const kite = document.createElementNS(svgNS, "path");
        kite.setAttribute("d", `M ${top.x} ${top.y} 
                              L ${right.x} ${right.y} 
                              L ${bottom.x} ${bottom.y} 
                              L ${left.x} ${left.y} Z`);
        kite.setAttribute("fill", "#9C27B099");
        kite.setAttribute("stroke", "#333");
        kite.setAttribute("stroke-width", "2");
        svg.appendChild(kite);
        
        // Draw diagonals if they're shown (for area questions)
        if (question.type === 'A' && (question.shownParams.includes('d1') || question.shownParams.includes('d2'))) {
          const diag1 = document.createElementNS(svgNS, "line");
          diag1.setAttribute("x1", top.x);
          diag1.setAttribute("y1", top.y);
          diag1.setAttribute("x2", bottom.x);
          diag1.setAttribute("y2", bottom.y);
          diag1.setAttribute("stroke", "#333");
          diag1.setAttribute("stroke-width", "1");
          diag1.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(diag1);
          
          const diag2 = document.createElementNS(svgNS, "line");
          diag2.setAttribute("x1", left.x);
          diag2.setAttribute("y1", left.y);
          diag2.setAttribute("x2", right.x);
          diag2.setAttribute("y2", right.y);
          diag2.setAttribute("stroke", "#333");
          diag2.setAttribute("stroke-width", "1");
          diag2.setAttribute("stroke-dasharray", "3,3");
          svg.appendChild(diag2);
        }
        
        // Show diagonals if they're shown (for area questions)
        if (question.type === 'A') {
          if (question.shownParams.includes('d1')) {
            addDimensionLine(svg, top.x, top.y, bottom.x, bottom.y, 
                           `${question.d1}`, 'vertical');
          } else if (question.hiddenParam === 'd1') {
            addDimensionLine(svg, top.x, top.y, bottom.x, bottom.y, 
                           '?', 'vertical');
          }
          
          if (question.shownParams.includes('d2')) {
            addDimensionLine(svg, left.x, left.y, right.x, right.y, 
                           `${question.d2}`, 'horizontal');
          } else if (question.hiddenParam === 'd2') {
            addDimensionLine(svg, left.x, left.y, right.x, right.y, 
                           '?', 'horizontal');
          }
        }
        
        // Show sides if they're shown (for perimeter questions)
        if (question.type === 'P') {
          if (question.shownParams.includes('a')) {
            addDimensionLine(svg, top.x, top.y, right.x, right.y, 
                           `${question.a}`, 'diagonal');
          } else if (question.hiddenParam === 'a') {
            addDimensionLine(svg, top.x, top.y, right.x, right.y, 
                           '?', 'diagonal');
          }
          
          if (question.shownParams.includes('b')) {
            addDimensionLine(svg, top.x, top.y, left.x, left.y, 
                           `${question.b}`, 'diagonal');
          } else if (question.hiddenParam === 'b') {
            addDimensionLine(svg, top.x, top.y, left.x, left.y, 
                           '?', 'diagonal');
          }
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
    
    // Add ticks
    if (position === 'horizontal') {
      // Horizontal dimension line (add vertical ticks)
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
      
      // Add text in the middle
      const textElement = document.createElementNS(svgNS, "text");
      textElement.setAttribute("x", (x1 + x2) / 2);
      textElement.setAttribute("y", y1 - 8);
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("dominant-baseline", "auto");
      textElement.setAttribute("font-size", "18");
      textElement.setAttribute("fill", "#333");
      textElement.textContent = text;
      svg.appendChild(textElement);
    } else if (position === 'vertical') {
      // Vertical dimension line (add horizontal ticks)
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
      
      // Add text to the left
      const textElement = document.createElementNS(svgNS, "text");
      textElement.setAttribute("x", x1 - 15);
      textElement.setAttribute("y", (y1 + y2) / 2);
      textElement.setAttribute("text-anchor", "end");
      textElement.setAttribute("dominant-baseline", "middle");
      textElement.setAttribute("font-size", "18");
      textElement.setAttribute("fill", "#333");
      textElement.textContent = text;
      svg.appendChild(textElement);
    } else if (position === 'diagonal') {
      // Diagonal dimension line (add perpendicular ticks)
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const tickLength = 5;
      
      // First tick
      const tick1x1 = x1 + tickLength * Math.sin(angle);
      const tick1y1 = y1 - tickLength * Math.cos(angle);
      const tick1x2 = x1 - tickLength * Math.sin(angle);
      const tick1y2 = y1 + tickLength * Math.cos(angle);
      
      const tick1 = document.createElementNS(svgNS, "line");
      tick1.setAttribute("x1", tick1x1);
      tick1.setAttribute("y1", tick1y1);
      tick1.setAttribute("x2", tick1x2);
      tick1.setAttribute("y2", tick1y2);
      tick1.setAttribute("stroke", "#333");
      tick1.setAttribute("stroke-width", "1");
      svg.appendChild(tick1);
      
      // Second tick
      const tick2x1 = x2 + tickLength * Math.sin(angle);
      const tick2y1 = y2 - tickLength * Math.cos(angle);
      const tick2x2 = x2 - tickLength * Math.sin(angle);
      const tick2y2 = y2 + tickLength * Math.cos(angle);
      
      const tick2 = document.createElementNS(svgNS, "line");
      tick2.setAttribute("x1", tick2x1);
      tick2.setAttribute("y1", tick2y1);
      tick2.setAttribute("x2", tick2x2);
      tick2.setAttribute("y2", tick2y2);
      tick2.setAttribute("stroke", "#333");
      tick2.setAttribute("stroke-width", "1");
      svg.appendChild(tick2);
      
      // Add text in the middle
      const textElement = document.createElementNS(svgNS, "text");
      textElement.setAttribute("x", (x1 + x2) / 2 + 10 * Math.sin(angle));
      textElement.setAttribute("y", (y1 + y2) / 2 - 10 * Math.cos(angle));
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("dominant-baseline", "middle");
      textElement.setAttribute("font-size", "18");
      textElement.setAttribute("fill", "#333");
      textElement.textContent = text;
      svg.appendChild(textElement);
    }
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