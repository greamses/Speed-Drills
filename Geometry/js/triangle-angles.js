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

      case 'right':
        const acute1 = getRandomInt(20, 70);
        const acute2 = 90 - acute1;
        question.angle1 = acute1;
        question.angle2 = 90;
        question.angle3 = acute2;
        break;

      case 'isosceles':
        const base = getRandomInt(30, 75);
        const apex = 180 - 2 * base;
        question.angle1 = apex;
        question.angle2 = base;
        question.angle3 = base;
        break;

      case 'scalene':
        question.angle1 = getRandomInt(30, 80);
        question.angle2 = getRandomInt(30, 180 - question.angle1 - 30);
        question.angle3 = 180 - question.angle1 - question.angle2;
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
        { x: centerX + size * 0.55, y: centerY + size * 0.25 }
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
  if (question.type === 'right') {
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

  // Side markers (slashes cutting the lines)
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

  if (question.type === 'isosceles') {
    addSlashMark(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, 1);
    addSlashMark(vertices[0].x, vertices[0].y, vertices[2].x, vertices[2].y, 1);
  }

  // Angle arcs and labels
  function addAngleArc(v, v1, v2, hidden, angleValue, skip90 = false) {
    if (skip90) return;

    const radius = 25;
    const dx1 = v1.x - v.x, dy1 = v1.y - v.y;
    const dx2 = v2.x - v.x, dy2 = v2.y - v.y;
    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);

    let start = angle1;
    let end = angle2;
    if ((end - start + 2 * Math.PI) % (2 * Math.PI) > Math.PI) {
      [start, end] = [end, start];
    }

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

    // Label known angles with degree numbers
    let showDegree = false;
    if (question.type === 'right') showDegree = (v === vertices[0]); // one acute
    if (question.type === 'isosceles') showDegree = (v === vertices[0]); // apex
    if (question.type === 'scalene') showDegree = (v === vertices[0] || v === vertices[1]); // two angles

    if (showDegree) {
      const text = document.createElementNS(svgNS, "text");
      const mx = v.x + (radius + 10) * Math.cos((start + end) / 2);
      const my = v.y + (radius + 10) * Math.sin((start + end) / 2);
      text.setAttribute("x", mx);
      text.setAttribute("y", my);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "16");
      text.setAttribute("fill", "#222");
      text.textContent = `${Math.round(angleValue)}°`;
      svg.appendChild(text);
    }

    // Hidden angle
    if (hidden) {
      const text = document.createElementNS(svgNS, "text");
      const mx = v.x + (radius + 10) * Math.cos((start + end) / 2);
      const my = v.y + (radius + 10) * Math.sin((start + end) / 2);
      text.setAttribute("x", mx);
      text.setAttribute("y", my);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "16");
      text.setAttribute("fill", "#e74c3c");
      text.textContent = "?";
      svg.appendChild(text);
    }
  }

  addAngleArc(vertices[0], vertices[1], vertices[2], question.hiddenAngle === 1, question.angle1, question.type === 'right' && question.angle1 === 90);
  addAngleArc(vertices[1], vertices[0], vertices[2], question.hiddenAngle === 2, question.angle2, question.type === 'right' && question.angle2 === 90);
  addAngleArc(vertices[2], vertices[0], vertices[1], question.hiddenAngle === 3, question.angle3, question.type === 'right' && question.angle3 === 90);

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