document.addEventListener('DOMContentLoaded', function () {
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
  { id: 'right-acute', name: 'Right-Acute' },
  { id: 'isosceles-acute', name: 'Isosceles-Acute' },
  { id: 'isosceles-obtuse', name: 'Isosceles-Obtuse' },
  { id: 'scalene-acute', name: 'Scalene-Acute' },
  { id: 'scalene-obtuse', name: 'Scalene-Obtuse' }
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
    playAgainBtn.addEventListener('click', function () {
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

    questionDisplay.textContent = `Find (?)`;
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
      endGame(`Invalid answer. The correct answer is ${currentQuestion.answer}°.`);
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
      
    case 'right-acute':
      const acute1 = getRandomInt(20, 70);
      const acute2 = 90 - acute1;
      question.angle1 = acute1;
      question.angle2 = 90;
      question.angle3 = acute2;
      break;
      
    case 'isosceles-acute':
      const baseA = getRandomInt(40, 70);
      const apexA = 180 - 2 * baseA;
      question.angle1 = apexA;
      question.angle2 = baseA;
      question.angle3 = baseA;
      break;
      
    case 'isosceles-obtuse':
      const baseO = getRandomInt(20, 70);
      const apexO = 180 - 2 * baseO;
      question.angle1 = apexO; // apex will be obtuse (>90)
      question.angle2 = baseO;
      question.angle3 = baseO;
      break;
      
    case 'scalene-acute':
      let a1, a2, a3;
      do {
        a1 = getRandomInt(30, 70);
        a2 = getRandomInt(30, 70);
        a3 = 180 - a1 - a2;
      } while (a3 <= 0 || a3 >= 90); // all <90
      question.angle1 = a1;
      question.angle2 = a2;
      question.angle3 = a3;
      break;
      
    case 'scalene-obtuse':
      let o1, o2, o3;
      do {
        o1 = getRandomInt(91, 140); // obtuse
        o2 = getRandomInt(20, 70);
        o3 = 180 - o1 - o2;
      } while (o3 <= 0 || o3 >= 90); // only one obtuse, others <90
      question.angle1 = o1;
      question.angle2 = o2;
      question.angle3 = o3;
      break;
  }
  
  const hide = getRandomInt(1, 3);
  question.hiddenAngle = hide;
  
  question.answer =
    hide === 1 ? question.angle1 :
    hide === 2 ? question.angle2 :
    question.angle3;
  
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

    case 'right-acute': // right triangle remains as before
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

  // Angle arcs and labels (same as before)
  function addAngleArc(v, v1, v2, hidden, angleValue, skip90 = false) {
  if (skip90) return;

  const radius = 25;
  const dx1 = v1.x - v.x, dy1 = v1.y - v.y;
  const dx2 = v2.x - v.x, dy2 = v2.y - v.y;
  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);

  let start = angle1, end = angle2;
  if ((end - start + 2 * Math.PI) % (2 * Math.PI) > Math.PI) [start, end] = [end, start];

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

  // Only show either the hidden "?" OR the angle value
  const mx = v.x + (radius + 10) * Math.cos((start + end) / 2);
  const my = v.y + (radius + 10) * Math.sin((start + end) / 2);

  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", mx);
  text.setAttribute("y", my);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("font-size", "16");
  
  if (hidden) {
    text.setAttribute("fill", "#e74c3c");
    text.textContent = "?";
  } else {
    // Only show known angles if they are meant to be labeled
    let showDegree = false;
    if (question.type === 'right-acute') showDegree = (v === vertices[0]); // one acute
    if (question.type.startsWith('isosceles')) showDegree = (v === vertices[0]); // apex
    if (question.type.startsWith('scalene')) showDegree = (v === vertices[0] || v === vertices[1]); // two angles

    if (!showDegree) return; // skip drawing number
    text.setAttribute("fill", "#222");
    text.textContent = `${Math.round(angleValue)}°`;
  }

  svg.appendChild(text);
}

  addAngleArc(vertices[0], vertices[1], vertices[2], question.hiddenAngle === 1, question.angle1, question.type.startsWith('right-acute') && question.angle1 === 90);
  addAngleArc(vertices[1], vertices[0], vertices[2], question.hiddenAngle === 2, question.angle2, question.type.startsWith('right-acute') && question.angle2 === 90);
  addAngleArc(vertices[2], vertices[0], vertices[1], question.hiddenAngle === 3, question.angle3, question.type.startsWith('right-acute') && question.angle3 === 90);

  shapeElement.appendChild(svg);
}

  submitBtn.addEventListener('click', checkAnswer);
  userAnswerInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') checkAnswer();
  });

  shapeSelector.addEventListener('change', function () {
    newQuestion(this.value);
  });

  window.addEventListener('resize', function () {
    if (currentQuestion) {
      drawTriangleWithSVG(currentQuestion);
    }
  });

  newQuestion(triangleTypes[0].id);
});