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
  let timeLeft = 20;
  
  const timerDisplay = document.createElement('div');
  timerDisplay.id = 'timerDisplay';
  timerDisplay.style.fontSize = '16px';
  timerDisplay.style.fontWeight = 'bold';
  timerDisplay.style.marginTop = '10px';
  shapeContainer.appendChild(timerDisplay);
  
  const triangleTypes = [
    { id: 'equilateral', name: 'Equilateral' },
    { id: 'right-acute', name: 'Right-Acute' },
    { id: 'isosceles-acute', name: 'Isosceles-Acute' },
    { id: 'isosceles-obtuse', name: 'Isosceles-Obtuse' },
    { id: 'scalene-acute', name: 'Scalene-Acute' },
    { id: 'scalene-obtuse', name: 'Scalene-Obtuse' }
  ];
  
  // Populate shape selector
  triangleTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    shapeSelector.appendChild(option);
  });
  
  // Timer functions
  function startTimer() {
    clearInterval(timer);
    timeLeft = 20;
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
    timerDisplay.style.color = timeLeft <= 5 ? 'red' : 'black';
  }
  
  function endGame(message) {
    feedbackDisplay.textContent = message;
    feedbackDisplay.classList.add('visible', 'incorrect');
    feedbackDisplay.classList.remove('correct');
    scoreDisplay.textContent = `Final Score: ${score}`;
    
    // Save high score
    saveHighScore();
    
    userAnswerInput.disabled = true;
    submitBtn.disabled = true;
    shapeSelector.disabled = true;
    
    const playAgainBtn = document.createElement('button');
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.style.margin = '10px';
    playAgainBtn.addEventListener('click', function() {
      resetGame();
      playAgainBtn.remove();
    });
    
    feedbackDisplay.appendChild(document.createElement('br'));
    feedbackDisplay.appendChild(playAgainBtn);
  }
  
  function resetGame() {
    score = 0;
    userAnswerInput.disabled = false;
    submitBtn.disabled = false;
    shapeSelector.disabled = false;
    feedbackDisplay.innerHTML = '';
    feedbackDisplay.className = 'feedback';
    scoreDisplay.textContent = `Score: ${score}`;
    newQuestion(shapeSelector.value);
  }
  
  function saveHighScore() {
    try {
      const highScores = JSON.parse(localStorage.getItem('triangleQuizHighScores')) || [];
      highScores.push({ 
        score: score, 
        date: new Date().toLocaleDateString(),
        type: shapeSelector.options[shapeSelector.selectedIndex].text
      });
      highScores.sort((a, b) => b.score - a.score);
      localStorage.setItem('triangleQuizHighScores', JSON.stringify(highScores.slice(0, 10)));
    } catch (error) {
      console.log('Could not save high score:', error);
    }
  }
  
  function newQuestion(triangleType) {
    try {
      currentQuestion = generateQuestion(triangleType);
      drawTriangleWithSVG(currentQuestion);
      
      questionDisplay.textContent = `Find the missing angle (?)`;
      userAnswerInput.value = '';
      feedbackDisplay.textContent = '';
      feedbackDisplay.className = 'feedback';
      
      userAnswerInput.focus();
      startTimer();
    } catch (error) {
      console.error('Error creating new question:', error);
      feedbackDisplay.textContent = 'Error generating question. Please try again.';
      feedbackDisplay.classList.add('visible', 'incorrect');
    }
  }
  
  function checkAnswer() {
    clearInterval(timer);
    const userAnswer = parseFloat(userAnswerInput.value);
    
    if (isNaN(userAnswer) || userAnswer < 0 || userAnswer > 180) {
      feedbackDisplay.textContent = 'Please enter a valid angle between 0 and 180 degrees.';
      feedbackDisplay.classList.add('visible', 'incorrect');
      userAnswerInput.focus();
      userAnswerInput.select();
      return;
    }
    
    if (Math.abs(userAnswer - currentQuestion.answer) < 0.5) {
      handleCorrectAnswer();
    } else {
      endGame(`Incorrect. The correct answer is ${currentQuestion.answer}°.`);
    }
  }
  
  function handleCorrectAnswer() {
    feedbackDisplay.textContent = 'Correct! Well done!';
    feedbackDisplay.classList.remove('incorrect');
    feedbackDisplay.classList.add('visible', 'correct');
    
    // Add visual celebration
    shapeElement.style.animation = 'pulse 0.5s ease-in-out';
    setTimeout(() => shapeElement.style.animation = '', 500);
    
    score++;
    scoreDisplay.textContent = `Score: ${score}`;
    
    setTimeout(() => {
      newQuestion(currentQuestion.type);
    }, 1000);
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
        question.hiddenAngle = getRandomInt(1, 3);
        break;
        
      case 'right-acute':
        const acute1 = getRandomInt(20, 70);
        const acute2 = 90 - acute1;
        question.angle1 = acute1;
        question.angle2 = 90; // right angle
        question.angle3 = acute2;
        
        // Only the acute angles can be hidden
        question.hiddenAngle = getRandomInt(1, 3) === 2 ? (Math.random() < 0.5 ? 1 : 3) : getRandomInt(1, 3);
        break;
        
      case 'isosceles-acute':
        const baseA = getRandomInt(40, 70);
        const apexA = 180 - 2 * baseA;
        question.angle1 = apexA;
        question.angle2 = baseA;
        question.angle3 = baseA;
        
        // For isosceles, if apex is hidden, show one base angle
        question.hiddenAngle = getRandomInt(1, 3);
        question.showBaseAngle = (question.hiddenAngle === 1); // Show base angle if apex is hidden
        break;
        
      case 'isosceles-obtuse':
        const baseO = getRandomInt(20, 70);
        const apexO = 180 - 2 * baseO;
        question.angle1 = apexO;
        question.angle2 = baseO;
        question.angle3 = baseO;
        
        // For isosceles, if apex is hidden, show one base angle
        question.hiddenAngle = getRandomInt(1, 3);
        question.showBaseAngle = (question.hiddenAngle === 1); // Show base angle if apex is hidden
        break;
        
      case 'scalene-acute':
        let a1, a2, a3;
        do {
          a1 = getRandomInt(30, 70);
          a2 = getRandomInt(30, 70);
          a3 = 180 - a1 - a2;
        } while (a3 <= 0 || a3 >= 90);
        question.angle1 = a1;
        question.angle2 = a2;
        question.angle3 = a3;
        question.hiddenAngle = getRandomInt(1, 3);
        break;
        
      case 'scalene-obtuse':
        let o1, o2, o3;
        do {
          o1 = getRandomInt(91, 140); // obtuse
          o2 = getRandomInt(20, 70);
          o3 = 180 - o1 - o2;
        } while (o3 <= 0 || o3 >= 90);
        question.angle1 = o1;
        question.angle2 = o2;
        question.angle3 = o3;
        question.hiddenAngle = getRandomInt(1, 3);
        break;
    }
    
    // Special rule for right triangle: hidden angle cannot be 2 (the right angle)
    if (triangleType === 'right-acute' && question.hiddenAngle === 2) {
      question.hiddenAngle = Math.random() < 0.5 ? 1 : 3;
    }
    
    // Determine answer
    question.answer =
      question.hiddenAngle === 1 ? question.angle1 :
      question.hiddenAngle === 2 ? question.angle2 :
      question.angle3;
    
    return question;
  }
  
  function drawTriangleWithSVG(question) {
    try {
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
      svg.setAttribute("aria-label", `Triangle with missing angle marked as question mark`);
      
      const size = 220;
      let vertices;
      
      switch (question.type) {
        case 'equilateral':
          vertices = [
            { x: centerX, y: centerY - size * 0.6 },
            { x: centerX - size / 2, y: centerY + size * 0.3 },
            { x: centerX + size / 2, y: centerY + size * 0.3 }
          ];
          break;
          
        case 'right-acute':
          vertices = [
            { x: centerX - size / 2, y: centerY - size / 2 },
            { x: centerX - size / 2, y: centerY + size / 2 },
            { x: centerX + size / 2, y: centerY + size / 2 }
          ];
          break;
          
        case 'isosceles-acute':
          vertices = [
            { x: centerX, y: centerY - size * 0.7 },
            { x: centerX - size / 2, y: centerY + size * 0.3 },
            { x: centerX + size / 2, y: centerY + size * 0.3 }
          ];
          break;
          
        case 'isosceles-obtuse':
          vertices = [
            { x: centerX, y: centerY - size * 0.3 }, // lower apex
            { x: centerX - size / 2, y: centerY + size * 0.4 },
            { x: centerX + size / 2, y: centerY + size * 0.4 }
          ];
          break;
          
        case 'scalene-acute':
          vertices = [
            { x: centerX - size * 0.3, y: centerY - size * 0.5 },
            { x: centerX - size * 0.5, y: centerY + size * 0.4 },
            { x: centerX + size * 0.5, y: centerY + size * 0.35 }
          ];
          break;
          
        case 'scalene-obtuse':
          vertices = [
            { x: centerX - size * 0.5, y: centerY - size * 0.2 }, // obtuse apex
            { x: centerX - size * 0.6, y: centerY + size * 0.5 },
            { x: centerX + size * 0.6, y: centerY + size * 0.3 }
          ];
          break;
      }
      
      const triangle = document.createElementNS(svgNS, "path");
      triangle.setAttribute(
        "d",
        `M ${vertices[0].x} ${vertices[0].y}
       L ${vertices[1].x} ${vertices[1].y}
       L ${vertices[2].x} ${vertices[2].y} Z`
      );
      triangle.setAttribute("fill", "#4CAF5099");
      triangle.setAttribute("stroke", "#222");
      triangle.setAttribute("stroke-width", "2");
      svg.appendChild(triangle);
      
      // Right angle square marker
      if (question.type === 'right-acute') {
        const box = document.createElementNS(svgNS, "rect");
        box.setAttribute("x", vertices[1].x);
        box.setAttribute("y", vertices[1].y - 25);
        box.setAttribute("width", 25);
        box.setAttribute("height", 25);
        box.setAttribute("fill", "transparent");
        box.setAttribute("stroke", "#222");
        box.setAttribute("stroke-width", "2");
        svg.appendChild(box);
      }
      
      // Side markers
      function addSlashMark(x1, y1, x2, y2, count = 1) {
        const spacing = 6;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * spacing;
          const mx = (x1 + x2) / 2 - offset * Math.sin(angle);
          const my = (y1 + y2) / 2 + offset * Math.cos(angle);
          const lx = 8 * Math.cos(angle + Math.PI / 2);
          const ly = 8 * Math.sin(angle + Math.PI / 2);
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", mx - lx);
          line.setAttribute("y1", my - ly);
          line.setAttribute("x2", mx + lx);
          line.setAttribute("y2", my + ly);
          line.setAttribute("stroke", "#000");
          line.setAttribute("stroke-width", "2");
          svg.appendChild(line);
        }
      }
      
      if (question.type === 'equilateral') {
        addSlashMark(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, 2);
        addSlashMark(vertices[1].x, vertices[1].y, vertices[2].x, vertices[2].y, 2);
        addSlashMark(vertices[2].x, vertices[2].y, vertices[0].x, vertices[0].y, 2);
      }
      if (question.type.startsWith('isosceles')) {
        addSlashMark(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, 1);
        addSlashMark(vertices[0].x, vertices[0].y, vertices[2].x, vertices[2].y, 1);
      }
      
      // Angle arcs and labels
      function addAngleArc(v, v1, v2, hidden, angleValue, vertexIndex, showDegreeOverride = false) {
        const dx1 = v1.x - v.x,
          dy1 = v1.y - v.y;
        const dx2 = v2.x - v.x,
          dy2 = v2.y - v.y;
        const angle1 = Math.atan2(dy1, dx1);
        const angle2 = Math.atan2(dy2, dx2);
        
        let start = angle1,
          end = angle2;
        if ((end - start + 2 * Math.PI) % (2 * Math.PI) > Math.PI)[start, end] = [end, start];
        
        // Draw the arc
        const radius = hidden ? 15 : 25;
        const x1 = v.x + radius * Math.cos(start);
        const y1 = v.y + radius * Math.sin(start);
        const x2 = v.x + radius * Math.cos(end);
        const y2 = v.y + radius * Math.sin(end);
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", `M${x1} ${y1} A${radius} ${radius} 0 0 1 ${x2} ${y2}`);
        path.setAttribute("stroke", "#222");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "transparent");
        svg.appendChild(path);
        
        // Compute centroid of triangle
        const cx = (vertices[0].x + vertices[1].x + vertices[2].x) / 3;
        const cy = (vertices[0].y + vertices[1].y + vertices[2].y) / 3;
        
        // Vector from vertex to centroid
        const vecX = cx - v.x;
        const vecY = cy - v.y;
        const vecLength = Math.sqrt(vecX * vecX + vecY * vecY);
        
        // Normalize and scale
        const scale = hidden ? 20 : 30; // distance from vertex
        const mx = v.x + (vecX / vecLength) * scale;
        const my = v.y + (vecY / vecLength) * scale;
        
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", mx);
        text.setAttribute("y", my);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", "14");
        text.setAttribute("font-weight", "bold");
        
        if (hidden) {
          text.setAttribute("fill", "#e74c3c");
          text.textContent = "?";
        } else {
          // Special logic for isosceles triangles
          let showDegree = false;
          
          if (question.type.startsWith('isosceles')) {
            // For isosceles triangles, if apex is hidden, show one base angle
            if (question.showBaseAngle && (vertexIndex === 1 || vertexIndex === 2)) {
              // Show only one base angle (randomly choose left or right)
              if ((vertexIndex === 1 && Math.random() < 0.5) || (vertexIndex === 2 && Math.random() >= 0.5)) {
                showDegree = true;
              }
            } else if (!question.showBaseAngle) {
              // If apex is not hidden, show apex angle
              showDegree = (vertexIndex === 0);
            }
          } else if (question.type === 'right-acute') {
            showDegree = (vertexIndex === 0 || vertexIndex === 2);
          } else if (question.type.startsWith('scalene')) {
            showDegree = (vertexIndex === 0 || vertexIndex === 1);
          }
          
          if (showDegreeOverride) {
            showDegree = true;
          }
          
          if (showDegree) {
            text.setAttribute("fill", "#222");
            text.textContent = `${Math.round(angleValue)}°`;
          }
        }
        
        svg.appendChild(text);
      }
      
      // Draw angles with special handling for isosceles triangles
      addAngleArc(vertices[0], vertices[1], vertices[2], question.hiddenAngle === 1, question.angle1, 0, question.type.startsWith('isosceles') && question.showBaseAngle);
      addAngleArc(vertices[1], vertices[0], vertices[2], question.hiddenAngle === 2, question.angle2, 1, question.type.startsWith('isosceles') && question.showBaseAngle);
      addAngleArc(vertices[2], vertices[0], vertices[1], question.hiddenAngle === 3, question.angle3, 2, question.type.startsWith('isosceles') && question.showBaseAngle);
      
      shapeElement.appendChild(svg);
    } catch (error) {
      console.error('Error drawing triangle:', error);
      shapeElement.innerHTML = '<p>Error displaying triangle. Please refresh the page.</p>';
    }
  }
  
  // Event Listeners
  submitBtn.addEventListener('click', checkAnswer);
  
  userAnswerInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') checkAnswer();
  });
  
  shapeSelector.addEventListener('change', function() {
    newQuestion(this.value);
  });
  
  window.addEventListener('resize', function() {
    if (currentQuestion) {
      drawTriangleWithSVG(currentQuestion);
    }
  });
  
  // Accessibility improvements
  userAnswerInput.setAttribute('aria-label', 'Enter your answer for the missing angle in degrees');
  submitBtn.setAttribute('aria-label', 'Submit your answer');
  shapeSelector.setAttribute('aria-label', 'Select triangle type');
  
  // Initialize the game
  newQuestion(triangleTypes[0].id);
});