
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
  
  const quadrilateralTypes = [
    { id: 'square', name: 'Square' },
    { id: 'rectangle', name: 'Rectangle' },
    { id: 'parallelogram', name: 'Parallelogram' },
    { id: 'rhombus', name: 'Rhombus' },
    { id: 'trapezoid', name: 'Trapezoid' },
    { id: 'kite', name: 'Kite' },
    { id: 'scalene', name: 'Irregular Quadrilateral' },
    { id: 'concave', name: 'Concave (Reflex Angle)' }
  ];
  
  // Populate shape selector
  quadrilateralTypes.forEach(type => {
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
    const highScores = JSON.parse(sessionStorage.getItem('quadQuizHighScores') || '[]');
    highScores.push({ 
      score: score, 
      date: new Date().toLocaleDateString(),
      type: shapeSelector.options[shapeSelector.selectedIndex].text
    });
    highScores.sort((a, b) => b.score - a.score);
    sessionStorage.setItem('quadQuizHighScores', JSON.stringify(highScores.slice(0, 10)));
  }
  
  function newQuestion(quadType) {
    try {
      currentQuestion = generateQuestion(quadType);
      drawQuadrilateralWithSVG(currentQuestion);
      
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
    
    if (isNaN(userAnswer) || userAnswer < 0 || userAnswer > 360) {
      feedbackDisplay.textContent = 'Please enter a valid angle between 0 and 360 degrees.';
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
  
  function generateQuestion(quadType) {
    let question = { type: quadType };
    
    switch (quadType) {
      case 'square':
        question.angle1 = 90;
        question.angle2 = 90;
        question.angle3 = 90;
        question.angle4 = 90;
        question.hiddenAngle = getRandomInt(1, 4);
        break;
        
      case 'rectangle':
        question.angle1 = 90;
        question.angle2 = 90;
        question.angle3 = 90;
        question.angle4 = 90;
        question.hiddenAngle = getRandomInt(1, 4);
        break;
        
      case 'parallelogram':
        const angle = getRandomInt(50, 130);
        question.angle1 = angle;
        question.angle2 = 180 - angle;
        question.angle3 = angle;
        question.angle4 = 180 - angle;
        question.hiddenAngle = getRandomInt(1, 4);
        break;
        
      case 'rhombus':
        const rhombusAngle = getRandomInt(50, 130);
        question.angle1 = rhombusAngle;
        question.angle2 = 180 - rhombusAngle;
        question.angle3 = rhombusAngle;
        question.angle4 = 180 - rhombusAngle;
        question.hiddenAngle = getRandomInt(1, 4);
        break;
        
      case 'trapezoid':
        // Isosceles trapezoid
        const baseAngle = getRandomInt(50, 80);
        question.angle1 = baseAngle;
        question.angle2 = baseAngle;
        question.angle3 = 180 - baseAngle;
        question.angle4 = 180 - baseAngle;
        question.hiddenAngle = getRandomInt(1, 4);
        break;
        
      case 'kite':
        const kiteAngle1 = getRandomInt(60, 120);
        const kiteAngle2 = getRandomInt(60, 120);
        const remaining = 360 - kiteAngle1 - kiteAngle2;
        question.angle1 = kiteAngle1;
        question.angle2 = kiteAngle2;
        question.angle3 = kiteAngle1;
        question.angle4 = remaining;
        question.hiddenAngle = getRandomInt(1, 4);
        break;
        
      case 'scalene':
        // Generate three random angles, fourth is calculated
        let a1, a2, a3, a4;
        do {
          a1 = getRandomInt(50, 140);
          a2 = getRandomInt(50, 140);
          a3 = getRandomInt(50, 140);
          a4 = 360 - a1 - a2 - a3;
        } while (a4 < 30 || a4 > 160);
        
        question.angle1 = a1;
        question.angle2 = a2;
        question.angle3 = a3;
        question.angle4 = a4;
        question.hiddenAngle = getRandomInt(1, 4);
        break;
        
      case 'concave':
        // One reflex angle (> 180°), three acute/obtuse
        const reflexAngle = getRandomInt(190, 270);
        const remaining3 = 360 - reflexAngle;
        
        // Distribute remaining among 3 angles
        let c1, c2, c3;
        do {
          c1 = getRandomInt(30, 90);
          c2 = getRandomInt(30, 90);
          c3 = remaining3 - c1 - c2;
        } while (c3 < 30 || c3 > 100);
        
        // Put reflex angle at position 2 (for easier drawing)
        question.angle1 = c1;
        question.angle2 = reflexAngle;
        question.angle3 = c2;
        question.angle4 = c3;
        question.hiddenAngle = getRandomInt(1, 4);
        question.isReflex = true;
        break;
    }
    
    // Determine answer
    question.answer =
      question.hiddenAngle === 1 ? question.angle1 :
      question.hiddenAngle === 2 ? question.angle2 :
      question.hiddenAngle === 3 ? question.angle3 :
      question.angle4;
    
    return question;
  }
  
  function drawQuadrilateralWithSVG(question) {
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
      svg.setAttribute("aria-label", `Quadrilateral with missing angle marked as question mark`);
      
      const size = 200;
      let vertices;
      
      switch (question.type) {
        case 'square':
          vertices = [
            { x: centerX - size / 2, y: centerY - size / 2 },
            { x: centerX + size / 2, y: centerY - size / 2 },
            { x: centerX + size / 2, y: centerY + size / 2 },
            { x: centerX - size / 2, y: centerY + size / 2 }
          ];
          break;
          
        case 'rectangle':
          vertices = [
            { x: centerX - size * 0.7, y: centerY - size * 0.4 },
            { x: centerX + size * 0.7, y: centerY - size * 0.4 },
            { x: centerX + size * 0.7, y: centerY + size * 0.4 },
            { x: centerX - size * 0.7, y: centerY + size * 0.4 }
          ];
          break;
          
        case 'parallelogram':
          const offset = size * 0.3;
          vertices = [
            { x: centerX - size / 2 + offset, y: centerY - size / 2 },
            { x: centerX + size / 2 + offset, y: centerY - size / 2 },
            { x: centerX + size / 2 - offset, y: centerY + size / 2 },
            { x: centerX - size / 2 - offset, y: centerY + size / 2 }
          ];
          break;
          
        case 'rhombus':
          vertices = [
            { x: centerX, y: centerY - size * 0.6 },
            { x: centerX + size * 0.5, y: centerY },
            { x: centerX, y: centerY + size * 0.6 },
            { x: centerX - size * 0.5, y: centerY }
          ];
          break;
          
        case 'trapezoid':
          vertices = [
            { x: centerX - size * 0.4, y: centerY - size * 0.4 },
            { x: centerX + size * 0.4, y: centerY - size * 0.4 },
            { x: centerX + size * 0.6, y: centerY + size * 0.4 },
            { x: centerX - size * 0.6, y: centerY + size * 0.4 }
          ];
          break;
          
        case 'kite':
          vertices = [
            { x: centerX, y: centerY - size * 0.7 },
            { x: centerX + size * 0.4, y: centerY - size * 0.1 },
            { x: centerX, y: centerY + size * 0.6 },
            { x: centerX - size * 0.4, y: centerY - size * 0.1 }
          ];
          break;
          
        case 'scalene':
          // Create an irregular quadrilateral
          vertices = [
            { x: centerX - size * 0.5, y: centerY - size * 0.5 },
            { x: centerX + size * 0.6, y: centerY - size * 0.3 },
            { x: centerX + size * 0.4, y: centerY + size * 0.6 },
            { x: centerX - size * 0.6, y: centerY + size * 0.4 }
          ];
          break;
          
        case 'concave':
          // Concave quadrilateral with reflex angle at vertex 1
          vertices = [
            { x: centerX - size * 0.5, y: centerY - size * 0.4 },
            { x: centerX + size * 0.1, y: centerY + size * 0.1 }, // Indented vertex
            { x: centerX + size * 0.6, y: centerY - size * 0.2 },
            { x: centerX - size * 0.3, y: centerY + size * 0.6 }
          ];
          break;
      }
      
      const quad = document.createElementNS(svgNS, "path");
      quad.setAttribute(
        "d",
        `M ${vertices[0].x} ${vertices[0].y}
         L ${vertices[1].x} ${vertices[1].y}
         L ${vertices[2].x} ${vertices[2].y}
         L ${vertices[3].x} ${vertices[3].y} Z`
      );
      quad.setAttribute("fill", "#4CAF5099");
      quad.setAttribute("stroke", "#222");
      quad.setAttribute("stroke-width", "2");
      svg.appendChild(quad);
      
      // Right angle markers for squares and rectangles
      if (question.type === 'square' || question.type === 'rectangle') {
        for (let i = 0; i < 4; i++) {
          const v = vertices[i];
          const v1 = vertices[(i + 1) % 4];
          const v2 = vertices[(i + 3) % 4];
          
          const dx1 = v1.x - v.x;
          const dy1 = v1.y - v.y;
          const dx2 = v2.x - v.x;
          const dy2 = v2.y - v.y;
          
          const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          
          const ux1 = (dx1 / len1) * 15;
          const uy1 = (dy1 / len1) * 15;
          const ux2 = (dx2 / len2) * 15;
          const uy2 = (dy2 / len2) * 15;
          
          const box = document.createElementNS(svgNS, "path");
          box.setAttribute(
            "d",
            `M ${v.x + ux1} ${v.y + uy1}
             L ${v.x + ux1 + ux2} ${v.y + uy1 + uy2}
             L ${v.x + ux2} ${v.y + uy2}`
          );
          box.setAttribute("fill", "transparent");
          box.setAttribute("stroke", "#222");
          box.setAttribute("stroke-width", "2");
          svg.appendChild(box);
        }
      }
      
      // Side markers for special quadrilaterals
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
      
      if (question.type === 'square' || question.type === 'rhombus') {
        for (let i = 0; i < 4; i++) {
          addSlashMark(vertices[i].x, vertices[i].y, vertices[(i + 1) % 4].x, vertices[(i + 1) % 4].y, 2);
        }
      }
      
      if (question.type === 'rectangle') {
        addSlashMark(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, 2);
        addSlashMark(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, 2);
        addSlashMark(vertices[1].x, vertices[1].y, vertices[2].x, vertices[2].y, 1);
        addSlashMark(vertices[3].x, vertices[3].y, vertices[0].x, vertices[0].y, 1);
      }
      
      if (question.type === 'parallelogram') {
        addSlashMark(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, 2);
        addSlashMark(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, 2);
        addSlashMark(vertices[1].x, vertices[1].y, vertices[2].x, vertices[2].y, 1);
        addSlashMark(vertices[3].x, vertices[3].y, vertices[0].x, vertices[0].y, 1);
      }
      
      if (question.type === 'trapezoid') {
        addSlashMark(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, 2);
        addSlashMark(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, 2);
      }
      
      if (question.type === 'kite') {
        addSlashMark(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, 1);
        addSlashMark(vertices[0].x, vertices[0].y, vertices[3].x, vertices[3].y, 1);
        addSlashMark(vertices[2].x, vertices[2].y, vertices[1].x, vertices[1].y, 2);
        addSlashMark(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, 2);
      }
      
      // Angle arcs and labels
      function addAngleArc(v, v1, v2, hidden, angleValue, vertexIndex) {
        const dx1 = v1.x - v.x;
        const dy1 = v1.y - v.y;
        const dx2 = v2.x - v.x;
        const dy2 = v2.y - v.y;
        let angle1 = Math.atan2(dy1, dx1);
        let angle2 = Math.atan2(dy2, dx2);
        
        // Determine if this is a reflex angle
        const isReflex = angleValue > 180;
        
        let start = angle1;
        let end = angle2;
        
        // For reflex angles, we want the larger arc
        if (isReflex) {
          if ((end - start + 2 * Math.PI) % (2 * Math.PI) < Math.PI) {
            [start, end] = [end, start];
          }
        } else {
          if ((end - start + 2 * Math.PI) % (2 * Math.PI) > Math.PI) {
            [start, end] = [end, start];
          }
        }
        
        // Draw the arc
        const radius = hidden ? 20 : 30;
        const x1 = v.x + radius * Math.cos(start);
        const y1 = v.y + radius * Math.sin(start);
        const x2 = v.x + radius * Math.cos(end);
        const y2 = v.y + radius * Math.sin(end);
        
        const largeArcFlag = isReflex ? 1 : 0;
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", `M${x1} ${y1} A${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`);
        path.setAttribute("stroke", isReflex ? "#e74c3c" : "#222");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "transparent");
        svg.appendChild(path);
        
        // Position label
        const midAngle = isReflex 
          ? start + ((end - start + 2 * Math.PI) % (2 * Math.PI)) / 2
          : start + ((end - start + 2 * Math.PI) % (2 * Math.PI)) / 2;
        
        const labelRadius = hidden ? 35 : 45;
        const mx = v.x + labelRadius * Math.cos(midAngle);
        const my = v.y + labelRadius * Math.sin(midAngle);
        
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
          let showDegree = false;
          
          // Determine which angles to show
          if (question.type === 'square' || question.type === 'rectangle') {
            showDegree = true;
          } else if (question.type === 'parallelogram' || question.type === 'rhombus') {
            if (question.hiddenAngle === 1 || question.hiddenAngle === 3) {
              showDegree = (vertexIndex === 1 || vertexIndex === 3);
            } else {
              showDegree = (vertexIndex === 0 || vertexIndex === 2);
            }
          } else if (question.type === 'trapezoid') {
            if (question.hiddenAngle === 1 || question.hiddenAngle === 2) {
              showDegree = (vertexIndex === 2 || vertexIndex === 3);
            } else {
              showDegree = (vertexIndex === 0 || vertexIndex === 1);
            }
          } else if (question.type === 'kite') {
            const shown = [0, 1, 2, 3].filter(i => i + 1 !== question.hiddenAngle).slice(0, 2);
            showDegree = shown.includes(vertexIndex);
          } else if (question.type === 'scalene' || question.type === 'concave') {
            // Show all angles except the hidden one
            const shown = [0, 1, 2, 3].filter(i => i + 1 !== question.hiddenAngle);
            showDegree = shown.includes(vertexIndex);
          }
          
          if (showDegree) {
            text.setAttribute("fill", isReflex ? "#e74c3c" : "#222");
            text.textContent = `${Math.round(angleValue)}°`;
          }
        }
        
        svg.appendChild(text);
      }
      
      // Draw all angles
      addAngleArc(vertices[0], vertices[3], vertices[1], question.hiddenAngle === 1, question.angle1, 0);
      addAngleArc(vertices[1], vertices[0], vertices[2], question.hiddenAngle === 2, question.angle2, 1);
      addAngleArc(vertices[2], vertices[1], vertices[3], question.hiddenAngle === 3, question.angle3, 2);
      addAngleArc(vertices[3], vertices[2], vertices[0], question.hiddenAngle === 4, question.angle4, 3);
      
      shapeElement.appendChild(svg);
    } catch (error) {
      console.error('Error drawing quadrilateral:', error);
      shapeElement.innerHTML = '<p>Error displaying quadrilateral. Please refresh the page.</p>';
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
      drawQuadrilateralWithSVG(currentQuestion);
    }
  });
  
  // Accessibility improvements
  userAnswerInput.setAttribute('aria-label', 'Enter your answer for the missing angle in degrees');
  submitBtn.setAttribute('aria-label', 'Submit your answer');
  shapeSelector.setAttribute('aria-label', 'Select quadrilateral type');
  
  // Initialize the game
  newQuestion(quadrilateralTypes[0].id);
});
