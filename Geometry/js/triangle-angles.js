
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
  timerDisplay.style.fontSize = '20px';
  timerDisplay.style.fontWeight = 'bold';
  timerDisplay.style.marginTop = '10px';
  shapeContainer.appendChild(timerDisplay);
  
  const triangleTypes = [
    { id: 'equilateral', name: 'Equilateral' },
    { id: 'right', name: 'Right Angled' },
    { id: 'isosceles', name: 'Isosceles' },
    { id: 'scalene', name: 'Scalene' }
  ];
  
  triangleTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
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
        endGame(`Time's up! The correct answer was ${currentQuestion.answer}°.`);
      }
    }, 1000);
  }
  
  function updateTimerDisplay() {
    timerDisplay.textContent = `⏱ ${timeLeft}s`;
    timerDisplay.style.color = timeLeft <= 10 ? 'red' : 'black';
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
  
  function newQuestion(triangleType) {
    currentQuestion = generateQuestion(triangleType);
    drawTriangleWithSVG(currentQuestion);
    
    questionDisplay.textContent = `Find  (?)`;
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
      endGame(`Invalid answer. The correct answer is ${currentQuestion.answer}°. Game over!`);
      return;
    }
    
    if (Math.abs(userAnswer - currentQuestion.answer) < 0.5) {
      handleCorrectAnswer();
    } else {
      endGame(`Incorrect. The correct answer is ${currentQuestion.answer}°. Game over!`);
    }
  }
  
  function handleCorrectAnswer() {
    feedbackDisplay.textContent = 'Correct! Well done!';
    feedbackDisplay.classList.remove('incorrect');
    feedbackDisplay.classList.add('visible', 'correct');
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    setTimeout(() => {
      newQuestion(currentQuestion.type);
    }, 500);
  }
  
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function generateQuestion(triangleType) {
    let question = { type: triangleType };
    
    switch (triangleType) {
      case 'equilateral':
        question.angle1 = 60;
        question.angle2 = 60;
        question.angle3 = 60;
        break;
        
      case 'right':
        question.angle1 = 90;
        const remaining = 90;
        question.angle2 = getRandomInt(20, 70);
        question.angle3 = remaining - question.angle2;
        break;
        
      case 'isosceles':
        const baseAngle = getRandomInt(30, 75);
        const apexAngle = 180 - (2 * baseAngle);
        question.angle1 = apexAngle;
        question.angle2 = baseAngle;
        question.angle3 = baseAngle;
        break;
        
      case 'scalene':
        question.angle1 = getRandomInt(30, 80);
        question.angle2 = getRandomInt(30, 180 - question.angle1 - 30);
        question.angle3 = 180 - question.angle1 - question.angle2;
        break;
    }
    
    // Randomly choose which angle to hide
    const hideAngle = getRandomInt(1, 3);
    question.hiddenAngle = hideAngle;
    
    if (hideAngle === 1) {
      question.answer = question.angle1;
      question.shownAngles = [question.angle2, question.angle3];
    } else if (hideAngle === 2) {
      question.answer = question.angle2;
      question.shownAngles = [question.angle1, question.angle3];
    } else {
      question.answer = question.angle3;
      question.shownAngles = [question.angle1, question.angle2];
    }
    
    return question;
  }
  
  function drawTriangleWithSVG(question) {
    labelsContainer.innerHTML = '';
    shapeElement.innerHTML = '';
    
    const containerWidth = shapeContainer.clientWidth || 600;
    const containerHeight = shapeContainer.clientHeight || 400;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`);
    svg.style.display = "block";
    
    // Calculate triangle vertices based on type
    let vertices;
    const size = 150;
    
    switch (question.type) {
      case 'equilateral':
        vertices = [
          { x: centerX, y: centerY - size * 0.577 },
          { x: centerX - size / 2, y: centerY + size * 0.289 },
          { x: centerX + size / 2, y: centerY + size * 0.289 }
        ];
        break;
        
      case 'right':
        vertices = [
          { x: centerX - size / 2, y: centerY - size / 2 },
          { x: centerX - size / 2, y: centerY + size / 2 },
          { x: centerX + size / 2, y: centerY + size / 2 }
        ];
        break;
        
      case 'isosceles':
        vertices = [
          { x: centerX, y: centerY - size * 0.7 },
          { x: centerX - size / 2, y: centerY + size * 0.3 },
          { x: centerX + size / 2, y: centerY + size * 0.3 }
        ];
        break;
        
      case 'scalene':
        vertices = [
          { x: centerX - size * 0.3, y: centerY - size * 0.5 },
          { x: centerX - size * 0.4, y: centerY + size * 0.4 },
          { x: centerX + size * 0.5, y: centerY + size * 0.3 }
        ];
        break;
    }
    
    // Draw triangle
    const triangle = document.createElementNS(svgNS, "path");
    triangle.setAttribute("d", `M ${vertices[0].x} ${vertices[0].y} 
                                L ${vertices[1].x} ${vertices[1].y} 
                                L ${vertices[2].x} ${vertices[2].y} Z`);
    triangle.setAttribute("fill", "#4CAF5099");
    triangle.setAttribute("stroke", "#333");
    triangle.setAttribute("stroke-width", "2");
    svg.appendChild(triangle);
    
    // Add angle labels
    const anglePositions = [
      { x: vertices[0].x, y: vertices[0].y - 25, angle: question.angle1, hidden: question.hiddenAngle === 1 },
      { x: vertices[1].x - 30, y: vertices[1].y + 20, angle: question.angle2, hidden: question.hiddenAngle === 2 },
      { x: vertices[2].x + 30, y: vertices[2].y + 20, angle: question.angle3, hidden: question.hiddenAngle === 3 }
    ];
    
    anglePositions.forEach((pos, index) => {
      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", pos.x);
      text.setAttribute("y", pos.y);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "20");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("fill", pos.hidden ? "#e74c3c" : "#2c3e50");
      text.textContent = pos.hidden ? "?" : `${pos.angle}°`;
      svg.appendChild(text);
    });
    
    shapeElement.appendChild(svg);
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
      drawTriangleWithSVG(currentQuestion);
    }
  });
  
  newQuestion(triangleTypes[0].id);
});
