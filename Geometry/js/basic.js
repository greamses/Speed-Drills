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
    { id: 'rectangle', name: 'Rectangle', params: ['length (l)', 'width (w)'] },
    { id: 'square', name: 'Square', params: ['side (s)', 'diagonal (d)'] },
    { id: 'triangle', name: 'Triangle', params: ['base (b)', 'height (h)'] },
    { id: 'rightTriangle', name: 'Right Triangle', params: ['base (b)', 'height (h)', 'hypotenuse (hyp)'] }
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
    if (currentQuestion.calculationType === 'find_l_and_w') {
      questionText = `l-w; A: , P: `;
    } else if (currentQuestion.isReverse) {
      if (currentQuestion.calculationType === 'A_from_P' || currentQuestion.calculationType === 'P_from_A') {
        questionText = `${currentQuestion.calculationType === 'A_from_P' ? 'P → A, P' : 'A → P, A'}: ${currentQuestion.givenValue}`;
      } else if (currentQuestion.calculationType === 'A_from_d') {
        questionText = `d → A: `;
      } else {
        questionText = `${currentQuestion.type === 'A' ? 'A:' : 'P:'} ${currentQuestion.givenValue}, ${currentQuestion.hiddenParam}`;
      }
    } else {
      questionText = `${currentQuestion.type === 'A' ? 'A' : 'P'}`;
      if (currentQuestion.calculationType === 'A_from_d') {
        questionText = 'A from d';
      }
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
    
    if (currentQuestion.calculationType === 'find_l_and_w') {
      const userAnswers = userAnswerInput.value.split(',').map(val => parseFloat(val.trim()));
      if (userAnswers.length !== 2 || userAnswers.some(isNaN)) {
        endGame(`Invalid answer. Please enter two numbers separated by a comma. The correct answers were ${currentQuestion.l} and ${currentQuestion.w}. Game over!`);
        return;
      }
      
      const [userL, userW] = userAnswers;
      const correctL = currentQuestion.l;
      const correctW = currentQuestion.w;
      
      if ((Math.abs(userL - correctL) < 0.01 && Math.abs(userW - correctW) < 0.01) ||
        (Math.abs(userL - correctW) < 0.01 && Math.abs(userW - correctL) < 0.01)) {
        handleCorrectAnswer();
      } else {
        endGame(`Incorrect. The correct answers are ${currentQuestion.l} and ${currentQuestion.w}. Game over!`);
      }
      return;
    }
    
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
    const calculationTypes = ['normal', 'A_from_P', 'P_from_A', 'find_l_and_w'];
    
    if (shapeId === 'square') {
      calculationTypes.splice(calculationTypes.indexOf('find_l_and_w'), 1);
      calculationTypes.push('A_from_d');
    } else if (shapeId === 'triangle' || shapeId === 'rightTriangle') {
      calculationTypes.splice(calculationTypes.indexOf('find_l_and_w'), 1);
    }
    
    question.calculationType = (shapeId === 'triangle' || shapeId === 'rightTriangle') ? 'normal' : calculationTypes[Math.floor(Math.random() * calculationTypes.length)];
    question.isReverse = question.calculationType === 'normal' ? Math.random() > 0.5 : true;
    question.type = (shapeId === 'triangle' || shapeId === 'rightTriangle') ? (Math.random() > 0.5 ? 'A' : 'P') : Math.random() > 0.5 ? 'A' : 'P';
    
    switch (shapeId) {
      case 'rectangle':
        question.l = getRandomInt(5, 12);
        question.w = getRandomInt(5, 12);
        
        if (question.calculationType === 'find_l_and_w') {
          question.A = question.l * question.w;
          question.P = 2 * (question.l + question.w);
          question.answer = `${question.l}, ${question.w}`;
          question.hiddenParam = 'both';
        } else if (question.calculationType === 'A_from_P') {
          question.givenValue = 2 * (question.l + question.w);
          question.answer = question.l * question.w;
          question.hiddenParam = Math.random() > 0.5 ? 'w' : 'l';
        } else if (question.calculationType === 'P_from_A') {
          question.givenValue = question.l * question.w;
          question.answer = 2 * (question.l + question.w);
          question.hiddenParam = Math.random() > 0.5 ? 'w' : 'l';
        } else if (question.isReverse) {
          if (question.type === 'A') {
            question.answer = Math.random() > 0.5 ? question.w : question.l;
            question.givenValue = question.l * question.w;
            question.hiddenParam = question.answer === question.w ? 'w' : 'l';
          } else {
            question.answer = Math.random() > 0.5 ? question.w : question.l;
            question.givenValue = 2 * (question.l + question.w);
            question.hiddenParam = question.answer === question.w ? 'w' : 'l';
          }
        } else {
          question.answer = question.type === 'A' ? question.l * question.w : 2 * (question.l + question.w);
        }
        break;
        
      case 'square':
        // For A_from_d questions, generate integer diagonal between 5-15
        if (question.calculationType === 'A_from_d') {
          question.d = getRandomInt(5, 15);
          // Area from diagonal = d²/2
          question.answer = (question.d * question.d) / 2;
          question.hiddenParam = 's';
        } else {
          // For other square questions, use normal side length
          question.s = getRandomInt(5, 12);
          question.d = question.s * Math.sqrt(2);
          
          if (question.calculationType === 'A_from_P') {
            question.givenValue = 4 * question.s;
            question.answer = question.s * question.s;
            question.hiddenParam = 's';
          } else if (question.calculationType === 'P_from_A') {
            question.givenValue = question.s * question.s;
            question.answer = 4 * question.s;
            question.hiddenParam = 's';
          } else if (question.isReverse) {
            if (question.type === 'A') {
              question.answer = question.s;
              question.givenValue = question.s * question.s;
              question.hiddenParam = 's';
            } else {
              question.answer = question.s;
              question.givenValue = 4 * question.s;
              question.hiddenParam = 's';
            }
          } else {
            question.answer = question.type === 'A' ? question.s * question.s : 4 * question.s;
          }
        }
        break;
        
      case 'triangle':
        question.b = getRandomInt(6, 12);
        question.h = getRandomInt(4, 10);
        
        if (question.isReverse) {
          if (Math.random() > 0.5) {
            question.answer = question.b;
            question.givenValue = 0.5 * question.b * question.h;
            question.hiddenParam = 'b';
          } else {
            question.answer = question.h;
            question.givenValue = 0.5 * question.b * question.h;
            question.hiddenParam = 'h';
          }
        } else {
          question.answer = 0.5 * question.b * question.h;
        }
        break;
        
      case 'rightTriangle':
        // Pythagorean triples including multiples
        const pythagoreanTriples = [
          [3, 4, 5],
          [6, 8, 10],
          [5, 12, 13],
          [7, 24, 25],
          [8, 15, 17],
          [9, 40, 41],
          [12, 35, 37],
          [20, 21, 29],
          [11, 60, 61],
          [13, 84, 85],
          [16, 63, 65]
        ];
        
        const selectedTriple = pythagoreanTriples[Math.floor(Math.random() * pythagoreanTriples.length)];
        
        // Sort to get the two legs and hypotenuse
        const sortedTriple = [...selectedTriple].sort((a, b) => a - b);
        const leg1 = sortedTriple[0];
        const leg2 = sortedTriple[1];
        const hypotenuse = sortedTriple[2]; // Always the largest
        
        // Randomly assign legs to base and height
        const useFirstLeg = Math.random() > 0.5;
        question.b = useFirstLeg ? leg1 : leg2;
        question.h = useFirstLeg ? leg2 : leg1;
        question.hyp = hypotenuse;
        
        // NEW LOGIC: Show any two sides, hide one, with hypotenuse always shown
        const sides = ['b', 'h', 'hyp'];
        
        // Always include hypotenuse in shown sides
        const shownSides = ['hyp'];
        
        // Randomly choose one more side to show
        const remainingSides = sides.filter(side => side !== 'hyp');
        const secondShownSide = remainingSides[Math.floor(Math.random() * remainingSides.length)];
        shownSides.push(secondShownSide);
        
        // The hidden side is the one not in shownSides
        question.hiddenSide = sides.find(side => !shownSides.includes(side));
        question.shownSides = shownSides;
        
        if (question.type === 'A') {
          // For area, user needs to find both legs first using Pythagorean theorem
          if (question.hiddenSide === 'b') {
            // If base is hidden, calculate it using hypotenuse and height
            question.missingLeg = Math.sqrt(question.hyp * question.hyp - question.h * question.h);
            question.answer = 0.5 * question.missingLeg * question.h;
          } else if (question.hiddenSide === 'h') {
            // If height is hidden, calculate it using hypotenuse and base
            question.missingLeg = Math.sqrt(question.hyp * question.hyp - question.b * question.b);
            question.answer = 0.5 * question.b * question.missingLeg;
          } else {
            // If hypotenuse is hidden (shouldn't happen with our logic, but just in case)
            question.answer = 0.5 * question.b * question.h;
          }
        } else {
          // For perimeter, user needs to find all three sides first
          if (question.hiddenSide === 'b') {
            // If base is hidden, calculate it using hypotenuse and height
            question.missingLeg = Math.sqrt(question.hyp * question.hyp - question.h * question.h);
            question.answer = question.missingLeg + question.h + question.hyp;
          } else if (question.hiddenSide === 'h') {
            // If height is hidden, calculate it using hypotenuse and base
            question.missingLeg = Math.sqrt(question.hyp * question.hyp - question.b * question.b);
            question.answer = question.b + question.missingLeg + question.hyp;
          } else {
            // If hypotenuse is hidden (shouldn't happen with our logic, but just in case)
            question.answer = question.b + question.h + question.hyp;
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
    const scale = 18;
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`);
    svg.style.display = "block";
    
    switch (question.shape) {
      case 'rectangle': {
        let rectWidth = question.l * scale;
        let rectHeight = question.w * scale;
        
        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", centerX - rectWidth / 2);
        rect.setAttribute("y", centerY - rectHeight / 2);
        rect.setAttribute("width", rectWidth);
        rect.setAttribute("height", rectHeight);
        rect.setAttribute("fill", "#4CAF5099");
        rect.setAttribute("stroke", "#333");
        rect.setAttribute("stroke-width", "2");
        svg.appendChild(rect);
        
        if (question.calculationType === 'find_l_and_w') {
          addDimensionLine(svg, centerX - rectWidth / 2, centerY - rectHeight / 2 - 10,
            centerX + rectWidth / 2, centerY - rectHeight / 2 - 10,
            '?', 'top');
          
          addDimensionLine(svg, centerX - rectWidth / 2 - 10, centerY - rectHeight / 2,
            centerX - rectWidth / 2 - 10, centerY + rectHeight / 2,
            '?', 'left');
        } else if (question.calculationType === 'A_from_P' || question.calculationType === 'P_from_A') {
          if (question.hiddenParam === 'w') {
            addDimensionLine(svg, centerX - rectWidth / 2, centerY - rectHeight / 2 - 10,
              centerX + rectWidth / 2, centerY - rectHeight / 2 - 10,
              `${question.l}`, 'top');
            
            addDimensionLine(svg, centerX - rectWidth / 2 - 10, centerY - rectHeight / 2,
              centerX - rectWidth / 2 - 10, centerY + rectHeight / 2,
              '?', 'left');
          } else {
            addDimensionLine(svg, centerX - rectWidth / 2, centerY - rectHeight / 2 - 10,
              centerX + rectWidth / 2, centerY - rectHeight / 2 - 10,
              '?', 'top');
            
            addDimensionLine(svg, centerX - rectWidth / 2 - 10, centerY - rectHeight / 2,
              centerX - rectWidth / 2 - 10, centerY + rectHeight / 2,
              `${question.w}`, 'left');
          }
        } else if (question.isReverse) {
          if (question.hiddenParam === 'w') {
            addDimensionLine(svg, centerX - rectWidth / 2, centerY - rectHeight / 2 - 10,
              centerX + rectWidth / 2, centerY - rectHeight / 2 - 10,
              `${question.l}`, 'top');
            
            addDimensionLine(svg, centerX - rectWidth / 2 - 10, centerY - rectHeight / 2,
              centerX - rectWidth / 2 - 10, centerY + rectHeight / 2,
              '?', 'left');
          } else {
            addDimensionLine(svg, centerX - rectWidth / 2, centerY - rectHeight / 2 - 10,
              centerX + rectWidth / 2, centerY - rectHeight / 2 - 10,
              '?', 'top');
            
            addDimensionLine(svg, centerX - rectWidth / 2 - 10, centerY - rectHeight / 2,
              centerX - rectWidth / 2 - 10, centerY + rectHeight / 2,
              `${question.w}`, 'left');
          }
        } else {
          addDimensionLine(svg, centerX - rectWidth / 2, centerY - rectHeight / 2 - 10,
            centerX + rectWidth / 2, centerY - rectHeight / 2 - 10,
            `${question.l}`, 'top');
          
          addDimensionLine(svg, centerX - rectWidth / 2 - 10, centerY - rectHeight / 2,
            centerX - rectWidth / 2 - 10, centerY + rectHeight / 2,
            `${question.w}`, 'left');
        }
        break;
      }
      
      case 'square': {
        // Use fixed size for visual representation but keep actual params unchanged
        const fixedSquareSize = 120;
        
        const square = document.createElementNS(svgNS, "rect");
        square.setAttribute("x", centerX - fixedSquareSize / 2);
        square.setAttribute("y", centerY - fixedSquareSize / 2);
        square.setAttribute("width", fixedSquareSize);
        square.setAttribute("height", fixedSquareSize);
        square.setAttribute("fill", "#2196F399");
        square.setAttribute("stroke", "#333");
        square.setAttribute("stroke-width", "2");
        svg.appendChild(square);
        
        if (question.calculationType === 'A_from_d') {
          const diagonal = document.createElementNS(svgNS, "line");
          diagonal.setAttribute("x1", centerX - fixedSquareSize / 2);
          diagonal.setAttribute("y1", centerY - fixedSquareSize / 2);
          diagonal.setAttribute("x2", centerX + fixedSquareSize / 2);
          diagonal.setAttribute("y2", centerY + fixedSquareSize / 2);
          diagonal.setAttribute("stroke", "#333");
          diagonal.setAttribute("stroke-width", "2");
          diagonal.setAttribute("stroke-dasharray", "5,5");
          svg.appendChild(diagonal);
          
          addDimensionLine(svg, centerX - fixedSquareSize / 2, centerY - fixedSquareSize / 2 - 10,
            centerX + fixedSquareSize / 2, centerY - fixedSquareSize / 2 - 10,
            '?', 'top');
          
          const diagText = document.createElementNS(svgNS, "text");
          diagText.setAttribute("x", centerX);
          diagText.setAttribute("y", centerY - 5);
          diagText.setAttribute("text-anchor", "middle");
          diagText.setAttribute("font-size", "18");
          diagText.setAttribute("fill", "#333");
          diagText.textContent = `d = ${question.d}`;
          svg.appendChild(diagText);
        } else if (question.calculationType === 'A_from_P' || question.calculationType === 'P_from_A' || question.isReverse) {
          addDimensionLine(svg, centerX - fixedSquareSize / 2, centerY - fixedSquareSize / 2 - 10,
            centerX + fixedSquareSize / 2, centerY - fixedSquareSize / 2 - 10,
            '?', 'top');
        } else {
          addDimensionLine(svg, centerX - fixedSquareSize / 2, centerY - fixedSquareSize / 2 - 10,
            centerX + fixedSquareSize / 2, centerY - fixedSquareSize / 2 - 10,
            `${question.s}`, 'top');
        }
        break;
      }
      
      case 'triangle': {
        let triWidth = question.b * scale;
        let triHeight = question.h * scale;
        
        const triangle = document.createElementNS(svgNS, "path");
        const x1 = centerX - triWidth / 2;
        const y1 = centerY + triHeight / 2;
        const x2 = centerX + triWidth / 2;
        const y2 = centerY + triHeight / 2;
        const x3 = centerX;
        const y3 = centerY - triHeight / 2;
        
        triangle.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`);
        triangle.setAttribute("fill", "#F4433699");
        triangle.setAttribute("stroke", "#333");
        triangle.setAttribute("stroke-width", "2");
        svg.appendChild(triangle);
        
        const heightLine = document.createElementNS(svgNS, "line");
        heightLine.setAttribute("x1", centerX);
        heightLine.setAttribute("y1", centerY + triHeight / 2);
        heightLine.setAttribute("x2", centerX);
        heightLine.setAttribute("y2", centerY - triHeight / 2);
        heightLine.setAttribute("stroke", "#333");
        heightLine.setAttribute("stroke-width", "1.5");
        heightLine.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(heightLine);
        
        if (question.isReverse) {
          if (question.hiddenParam === 'b') {
            addDimensionLine(svg, centerX - triWidth / 2, centerY + triHeight / 2 + 10,
              centerX + triWidth / 2, centerY + triHeight / 2 + 10,
              '?', 'bottom');
            
            addDimensionLine(svg, centerX - triWidth / 2 - 10, centerY + triHeight / 2,
              centerX - triWidth / 2 - 10, centerY - triHeight / 2,
              `${question.h}`, 'left');
          } else {
            addDimensionLine(svg, centerX - triWidth / 2, centerY + triHeight / 2 + 10,
              centerX + triWidth / 2, centerY + triHeight / 2 + 10,
              `${question.b}`, 'bottom');
            
            addDimensionLine(svg, centerX - triWidth / 2 - 10, centerY + triHeight / 2,
              centerX - triWidth / 2 - 10, centerY - triHeight / 2,
              '?', 'left');
          }
        } else {
          addDimensionLine(svg, centerX - triWidth / 2, centerY + triHeight / 2 + 10,
            centerX + triWidth / 2, centerY + triHeight / 2 + 10,
            `${question.b}`, 'bottom');
          
          addDimensionLine(svg, centerX - triWidth / 2 - 10, centerY + triHeight / 2,
            centerX - triWidth / 2 - 10, centerY - triHeight / 2,
            `${question.h}`, 'left');
        }
        break;
      }
      
      case 'rightTriangle': {
        // Use fixed sizes for visual representation but keep actual params unchanged
        const fixedBase = 140;
        const fixedHeight = 100;
        
        const triangle = document.createElementNS(svgNS, "path");
        const x1 = centerX - fixedBase / 2;
        const y1 = centerY + fixedHeight / 2;
        const x2 = centerX + fixedBase / 2;
        const y2 = centerY + fixedHeight / 2;
        const x3 = centerX - fixedBase / 2;
        const y3 = centerY - fixedHeight / 2;
        
        triangle.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`);
        triangle.setAttribute("fill", "#FF980099");
        triangle.setAttribute("stroke", "#333");
        triangle.setAttribute("stroke-width", "2");
        svg.appendChild(triangle);
        
        const rightAngle = document.createElementNS(svgNS, "path");
        const angleSize = 10;
        rightAngle.setAttribute("d", `M ${x1} ${y1} L ${x1 + angleSize} ${y1} L ${x1 + angleSize} ${y1 - angleSize} L ${x1} ${y1}`);
        rightAngle.setAttribute("fill", "none");
        rightAngle.setAttribute("stroke", "#333");
        rightAngle.setAttribute("stroke-width", "1.5");
        svg.appendChild(rightAngle);
        
        // Draw all three sides but show/hide labels based on question.shownSides
        const hypLine = document.createElementNS(svgNS, "line");
        hypLine.setAttribute("x1", x2);
        hypLine.setAttribute("y1", y2);
        hypLine.setAttribute("x2", x3);
        hypLine.setAttribute("y2", y3);
        hypLine.setAttribute("stroke", "#333");
        hypLine.setAttribute("stroke-width", "2");
        svg.appendChild(hypLine);
        
        // Base (bottom)
        if (question.shownSides.includes('b')) {
          addDimensionLine(svg, x1, y1 + 10, x2, y2 + 10, `${question.b}`, 'bottom');
        } else {
          addDimensionLine(svg, x1, y1 + 10, x2, y2 + 10, '?', 'bottom');
        }
        
        // Height (left)
        if (question.shownSides.includes('h')) {
          addDimensionLine(svg, x1 - 10, y1, x3 - 10, y3, `${question.h}`, 'left');
        } else {
          addDimensionLine(svg, x1 - 10, y1, x3 - 10, y3, '?', 'left');
        }
        
        // Hypotenuse
        if (question.shownSides.includes('hyp')) {
          const hypText = document.createElementNS(svgNS, "text");
          hypText.setAttribute("x", (x2 + x3) / 2 + 15);
          hypText.setAttribute("y", (y2 + y3) / 2);
          hypText.setAttribute("text-anchor", "middle");
          hypText.setAttribute("font-size", "18");
          hypText.setAttribute("fill", "#333");
          hypText.textContent = `${question.hyp}`;
          svg.appendChild(hypText);
        } else {
          const hypText = document.createElementNS(svgNS, "text");
          hypText.setAttribute("x", (x2 + x3) / 2 + 15);
          hypText.setAttribute("y", (y2 + y3) / 2);
          hypText.setAttribute("text-anchor", "middle");
          hypText.setAttribute("font-size", "18");
          hypText.setAttribute("fill", "#333");
          hypText.textContent = '?';
          svg.appendChild(hypText);
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
      textElement.setAttribute("x", x1 - 8);
      textElement.setAttribute("y", (y1 + y2) / 2);
      textElement.setAttribute("text-anchor", "end");
      textElement.setAttribute("dominant-baseline", "middle");
    } else if (position === 'right') {
      textElement.setAttribute("x", x1 + 8);
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