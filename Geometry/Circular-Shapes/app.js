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
    { id: 'circle', name: 'Circle' },
    { id: 'sector', name: 'Sector' }
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
      questionText = `${currentQuestion.type === 'A' ? 'A:' : 'C:'} ${currentQuestion.givenValue}`;
      if (shapeId === 'sector') {
        questionText += `, angle: ${currentQuestion.angle}°`;
      }
    } else {
      questionText = `${currentQuestion.type === 'A' ? 'Area' : 'Circumference'}`;
      if (shapeId === 'sector') {
        questionText += ` (angle: ${currentQuestion.angle}°)`;
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
  const PI = 22 / 7;
  
  // Radius is a multiple of 3.5 (like 7, 10.5, 14, etc.)
  question.r = (getRandomInt(2, 8) * 3.5);
  question.d = question.r * 2;
  
  question.isReverse = Math.random() > 0.5;
  question.type = Math.random() > 0.5 ? 'A' : 'C';
  
  // Determine if we're asking for radius or diameter in reverse questions
  question.askingForRadius = Math.random() > 0.5;
  
  if (shapeId === 'sector') {
    // Sector angle is a multiple of 45° (45, 90, 135, 180, 225, 270, 315)
    const angleOptions = [45, 90, 135, 180, 225, 270, 315];
    question.angle = angleOptions[getRandomInt(0, angleOptions.length - 1)];
  }
  
  if (question.isReverse) {
    // Reverse question (given area/circumference, find radius/diameter)
    if (question.type === 'A') {
      question.givenValue = shapeId === 'circle' ?
        PI * question.r * question.r :
        (PI * question.r * question.r) * (question.angle / 360);
      question.answer = question.askingForRadius ? question.r : question.d;
    } else {
      question.givenValue = shapeId === 'circle' ?
        2 * PI * question.r :
        (2 * PI * question.r) * (question.angle / 360) + (2 * question.r);
      question.answer = question.askingForRadius ? question.r : question.d;
    }
  } else {
    // Normal question (given radius/diameter, find area/circumference)
    if (question.type === 'A') {
      question.answer = shapeId === 'circle' ?
        PI * question.r * question.r :
        (PI * question.r * question.r) * (question.angle / 360);
    } else {
      question.answer = shapeId === 'circle' ?
        2 * PI * question.r :
        (2 * PI * question.r) * (question.angle / 360) + (2 * question.r);
    }
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
  const scale = 5;
  
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`);
  svg.style.display = "block";
  
  switch (question.shape) {
    case 'circle': {
      const radius = question.r * scale;
      
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", centerX);
      circle.setAttribute("cy", centerY);
      circle.setAttribute("r", radius);
      circle.setAttribute("fill", "#4CAF5099");
      circle.setAttribute("stroke", "#333");
      circle.setAttribute("stroke-width", "2");
      svg.appendChild(circle);
      
      if (question.isReverse) {
        if (question.askingForRadius) {
          // Draw radius line
          const radiusLine = document.createElementNS(svgNS, "line");
          radiusLine.setAttribute("x1", centerX);
          radiusLine.setAttribute("y1", centerY);
          radiusLine.setAttribute("x2", centerX + radius);
          radiusLine.setAttribute("y2", centerY);
          radiusLine.setAttribute("stroke", "#333");
          radiusLine.setAttribute("stroke-width", "2");
          radiusLine.setAttribute("stroke-dasharray", "5,5");
          svg.appendChild(radiusLine);
          
          addDimensionLine(svg, centerX, centerY, centerX + radius, centerY, '?', 'middle');
        } else {
          // Draw diameter line
          const diameterLine = document.createElementNS(svgNS, "line");
          diameterLine.setAttribute("x1", centerX - radius);
          diameterLine.setAttribute("y1", centerY);
          diameterLine.setAttribute("x2", centerX + radius);
          diameterLine.setAttribute("y2", centerY);
          diameterLine.setAttribute("stroke", "#333");
          diameterLine.setAttribute("stroke-width", "2");
          diameterLine.setAttribute("stroke-dasharray", "5,5");
          svg.appendChild(diameterLine);
          
          addDimensionLine(svg, centerX - radius, centerY, centerX + radius, centerY, '?', 'middle');
        }
      } else {
        // Show both radius and diameter in normal questions
        const radiusLine = document.createElementNS(svgNS, "line");
        radiusLine.setAttribute("x1", centerX);
        radiusLine.setAttribute("y1", centerY);
        radiusLine.setAttribute("x2", centerX + radius);
        radiusLine.setAttribute("y2", centerY);
        radiusLine.setAttribute("stroke", "#333");
        radiusLine.setAttribute("stroke-width", "2");
        radiusLine.setAttribute("stroke-dasharray", "5,5");
        svg.appendChild(radiusLine);
        
        addDimensionLine(svg, centerX, centerY, centerX + radius, centerY, `${question.r}`, 'middle');
        
        const diameterLine = document.createElementNS(svgNS, "line");
        diameterLine.setAttribute("x1", centerX - radius);
        diameterLine.setAttribute("y1", centerY);
        diameterLine.setAttribute("x2", centerX + radius);
        diameterLine.setAttribute("y2", centerY);
        diameterLine.setAttribute("stroke", "#333");
        diameterLine.setAttribute("stroke-width", "1");
        diameterLine.setAttribute("stroke-dasharray", "3,3");
        svg.appendChild(diameterLine);
        
        addDimensionLine(svg, centerX - radius, centerY, centerX + radius, centerY, `${question.d}`, 'bottom');
      }
      break;
    }
    
    case 'sector': {
      const radius = question.r * scale;
      const startAngle = -90; // Start at top
      const endAngle = startAngle + question.angle;
      
      // Convert angles to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      // Calculate start and end points
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      // Create sector path
      const sector = document.createElementNS(svgNS, "path");
      sector.setAttribute("d",
        `M ${centerX} ${centerY} ` +
        `L ${x1} ${y1} ` +
        `A ${radius} ${radius} 0 ${question.angle > 180 ? 1 : 0} 1 ${x2} ${y2} ` +
        `Z`);
      sector.setAttribute("fill", "#2196F399");
      sector.setAttribute("stroke", "#333");
      sector.setAttribute("stroke-width", "2");
      svg.appendChild(sector);
      
      // Draw radius lines
      const radiusLine1 = document.createElementNS(svgNS, "line");
      radiusLine1.setAttribute("x1", centerX);
      radiusLine1.setAttribute("y1", centerY);
      radiusLine1.setAttribute("x2", x1);
      radiusLine1.setAttribute("y2", y1);
      radiusLine1.setAttribute("stroke", "#333");
      radiusLine1.setAttribute("stroke-width", "2");
      radiusLine1.setAttribute("stroke-dasharray", "5,5");
      svg.appendChild(radiusLine1);
      
      const radiusLine2 = document.createElementNS(svgNS, "line");
      radiusLine2.setAttribute("x1", centerX);
      radiusLine2.setAttribute("y1", centerY);
      radiusLine2.setAttribute("x2", x2);
      radiusLine2.setAttribute("y2", y2);
      radiusLine2.setAttribute("stroke", "#333");
      radiusLine2.setAttribute("stroke-width", "2");
      radiusLine2.setAttribute("stroke-dasharray", "5,5");
      svg.appendChild(radiusLine2);
      
      // Angle arc
      const angleArcRadius = radius * 0.3;
      const angleArc = document.createElementNS(svgNS, "path");
      angleArc.setAttribute("d",
        `M ${centerX + angleArcRadius * Math.cos(startRad)} ${centerY + angleArcRadius * Math.sin(startRad)} ` +
        `A ${angleArcRadius} ${angleArcRadius} 0 ${question.angle > 180 ? 1 : 0} 1 ` +
        `${centerX + angleArcRadius * Math.cos(endRad)} ${centerY + angleArcRadius * Math.sin(endRad)}`);
      angleArc.setAttribute("stroke", "#333");
      angleArc.setAttribute("stroke-width", "1");
      angleArc.setAttribute("fill", "none");
      svg.appendChild(angleArc);
      
      // Angle label
      const angleLabel = document.createElementNS(svgNS, "text");
      const midAngle = startAngle + question.angle / 2;
      const labelRadius = angleArcRadius * 1.2;
      angleLabel.setAttribute("x", centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180));
      angleLabel.setAttribute("y", centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180));
      angleLabel.setAttribute("text-anchor", "middle");
      angleLabel.setAttribute("font-size", "16");
      angleLabel.textContent = `${question.angle}°`;
      svg.appendChild(angleLabel);
      
      // Radius label
      if (question.isReverse) {
        if (question.askingForRadius) {
          addDimensionLine(svg, centerX, centerY, x1, y1, '?', 'along');
        } else {
          // For diameter, draw a line across the circle
          const diameterLine = document.createElementNS(svgNS, "line");
          diameterLine.setAttribute("x1", centerX - radius * Math.cos(startRad));
          diameterLine.setAttribute("y1", centerY - radius * Math.sin(startRad));
          diameterLine.setAttribute("x2", centerX + radius * Math.cos(startRad));
          diameterLine.setAttribute("y2", centerY + radius * Math.sin(startRad));
          diameterLine.setAttribute("stroke", "#333");
          diameterLine.setAttribute("stroke-width", "2");
          diameterLine.setAttribute("stroke-dasharray", "5,5");
          svg.appendChild(diameterLine);
          
          addDimensionLine(svg,
            centerX - radius * Math.cos(startRad),
            centerY - radius * Math.sin(startRad),
            centerX + radius * Math.cos(startRad),
            centerY + radius * Math.sin(startRad),
            '?', 'middle');
        }
      } else {
        addDimensionLine(svg, centerX, centerY, x1, y1, `${question.r}`, 'along');
      }
      break;
    }
  }
  
  shapeElement.appendChild(svg);
}
  
  function addDimensionLine(svg, x1, y1, x2, y2, text, position) {
    const svgNS = "http://www.w3.org/2000/svg";
    
    // For circles/sectors, we only need "middle" and "along" positions
    if (position === 'middle') {
      // Horizontal dimension line (for circle radius/diameter)
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#333");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
      
      // Add ticks
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
      
      // Add text
      const textElement = document.createElementNS(svgNS, "text");
      textElement.setAttribute("x", (x1 + x2) / 2);
      textElement.setAttribute("y", y1 - 8);
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("font-size", "16");
      textElement.textContent = text;
      svg.appendChild(textElement);
    } else if (position === 'along') {
      // For sector radius
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // Calculate perpendicular offset
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offsetX = (-dy / len) * 15;
      const offsetY = (dx / len) * 15;
      
      const textElement = document.createElementNS(svgNS, "text");
      textElement.setAttribute("x", midX + offsetX);
      textElement.setAttribute("y", midY + offsetY);
      textElement.setAttribute("text-anchor", "middle");
      textElement.setAttribute("font-size", "16");
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

