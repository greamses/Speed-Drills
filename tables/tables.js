class GeometryCalculator {
    constructor() {
        this.currentShape = 'rectangle';
        this.selectButton = document.getElementById('selectButton');
        this.selectDropdown = document.getElementById('selectDropdown');
        this.selectedShapeSpan = document.getElementById('selectedShape');
        this.tableContainer = document.getElementById('tableContainer');
        this.shapeTable = document.getElementById('shapeTable');
        this.successMessage = document.getElementById('successMessage');
        this.timerDisplay = document.getElementById('timer');
        this.restartButton = document.getElementById('restartButton');
        this.chartCanvas = document.getElementById('scoreChart');
        this.chartContainer = document.getElementById('chartContainer');
        this.highScoresList = document.getElementById('highScoresList');
        this.completionTimeDisplay = document.getElementById('completionTime');
        this.resultsModal = document.getElementById('resultsModal');
        this.closeModal = document.getElementById('closeModal');
        this.showChartButton = document.getElementById('showChartButton');
        this.printButton = document.getElementById('printButton');
        
        this.timeLimit = 120; // 2 minutes in seconds
        this.timeLeft = this.timeLimit;
        this.timerInterval = null;
        this.sessionScores = [];
        this.highScores = JSON.parse(localStorage.getItem('geometryHighScores')) || [];
        this.currentSessionScore = 0;
        this.sessionCount = 0;
        this.chart = null;
        this.startTime = null;
        this.completionTime = null;
        this.totalProblems = 0;
        this.solvedProblems = 0;
        this.isCompleted = false;
        
        this.userNameInput = document.getElementById('userNameInput');
        this.avatarSelector = document.getElementById('avatarSelector');
        this.userDisplay = document.getElementById('userDisplay');
        this.avatarDisplay = document.getElementById('avatarDisplay');
        this.triesDisplay = document.getElementById('triesDisplay');
        this.saveProfileBtn = document.getElementById('saveProfileBtn');
        
        this.userName = localStorage.getItem('geometryUserName') || '';
        this.userAvatar = localStorage.getItem('geometryUserAvatar') || 'male1';
        this.totalTries = parseInt(localStorage.getItem('geometryTotalTries')) || 0;
        
        // DiceBear avatar options (Pixar-style)
        this.avatarOptions = [
            'male1', 'male2', 'male3', 'male4',
            'female1', 'female2', 'female3', 'female4'
        ];
        this.avatarBaseUrl = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=';
        
        this.initializeEventListeners();
        this.initializeUserProfile();
        this.generateTable();
        this.initializeChart();
        this.updateHighScoresDisplay();
        
        // Hide chart initially
        this.chartContainer.style.display = 'none';
        this.resultsModal.style.display = 'none';
        
        this.practiceCount = parseInt(localStorage.getItem('geometryPracticeCount')) || 0;
        this.shapePracticeCounts = JSON.parse(localStorage.getItem('geometryShapePracticeCounts')) || {
            rectangle: 0,
            square: 0,
            triangle: 0
        };
        
        setTimeout(() => this.checkForAwards(), 1000);
    }
    
    initializeEventListeners() {
        if (this.selectButton) {
            this.selectButton.addEventListener('click', () => this.toggleDropdown());
        }
        
        document.addEventListener('click', (e) => {
            if (this.selectButton && !this.selectButton.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        if (this.selectDropdown) {
            this.selectDropdown.addEventListener('click', (e) => {
                if (e.target.classList.contains('select-option')) {
                    this.selectShape(e.target.dataset.value, e.target.textContent);
                }
            });
        }
        
        // Table input validation
        if (this.shapeTable) {
            this.shapeTable.addEventListener('input', (e) => {
                if (e.target.tagName === 'INPUT') {
                    this.validateInput(e.target);
                }
            });
        }
        
        // Restart button
        if (this.restartButton) {
            this.restartButton.addEventListener('click', () => this.restartGame());
        }
        
        // Modal close button
        if (this.closeModal) {
            this.closeModal.addEventListener('click', () => this.closeResultsModal());
        }
        
        // Show chart button
        if (this.showChartButton) {
            this.showChartButton.addEventListener('click', () => this.showResultsModal());
        }
        
        
        // Add to initializeEventListeners():
        document.getElementById('confirmAvatar').addEventListener('click', () => this.saveAvatarSelection());
        document.querySelector('#avatarModal .close').addEventListener('click', () => this.closeAvatarModal());
        
        // Print button
        if (this.printButton) {
            this.printButton.addEventListener('click', () => this.printResults());
        }
        
        if (document.getElementById('switchPlayerButton')) {
            document.getElementById('switchPlayerButton').addEventListener('click', () => this.showPlayerSelection());
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === this.resultsModal) {
                this.closeResultsModal();
            }
        });
        
        // Save profile button
        if (this.saveProfileBtn) {
            this.saveProfileBtn.addEventListener('click', () => this.saveUserProfile());
        }
    }
    
    toggleDropdown() {
        if (this.selectButton && this.selectDropdown) {
            this.selectButton.classList.toggle('active');
            this.selectDropdown.classList.toggle('show');
        }
    }
    
    closeDropdown() {
        if (this.selectButton && this.selectDropdown) {
            this.selectButton.classList.remove('active');
            this.selectDropdown.classList.remove('show');
        }
    }
    
    selectShape(shapeValue, shapeText) {
        // Update selected option in dropdown
        document.querySelectorAll('.select-option').forEach(option => {
            option.classList.remove('selected');
        });
        const selectedOption = document.querySelector(`[data-value="${shapeValue}"]`);
        if (selectedOption) selectedOption.classList.add('selected');
        
        // Update button text
        if (this.selectedShapeSpan) this.selectedShapeSpan.textContent = shapeText;
        this.currentShape = shapeValue;
        
        // Close dropdown
        this.closeDropdown();
        
        // Regenerate table with animation
        if (this.tableContainer) {
            this.tableContainer.classList.remove('show');
            setTimeout(() => {
                this.generateTable();
                this.tableContainer.classList.add('show');
            }, 200);
        }
        
        // Hide success message
        if (this.successMessage) this.successMessage.classList.remove('show');
        this.isCompleted = false;
    }
    
    generateTable() {
        if (!this.shapeTable) return;
        
        let tableHTML = '';
        this.startTime = performance.now();
        this.solvedProblems = 0;
        this.isCompleted = false;
        
        switch (this.currentShape) {
            case 'rectangle':
                tableHTML = this.generateRectangleTable();
                this.totalProblems = 5 * 2; // 5 rows, 2 inputs per row
                break;
            case 'square':
                tableHTML = this.generateSquareTable();
                this.totalProblems = 5 * 2; // 5 rows, 2 inputs per row
                break;
            case 'triangle':
                tableHTML = this.generateTriangleTable();
                this.totalProblems = 5 * 1; // 5 rows, 1 input per row
                break;
        }
        
        this.shapeTable.innerHTML = tableHTML;
    }
    
    generateRandomRectangleData() {
        const data = [];
        for (let i = 0; i < 5; i++) {
            const length = this.randomInt(4, 20);
            const width = this.randomInt(3, 15);
            const perimeter = 2 * (length + width);
            const area = length * width;
            data.push({ length, width, perimeter, area });
        }
        return data;
    }
    
    generateRandomSquareData() {
        const data = [];
        for (let i = 0; i < 5; i++) {
            const side = this.randomInt(3, 15);
            const perimeter = 4 * side;
            const area = side * side;
            data.push({ side, perimeter, area });
        }
        return data;
    }
    
    generateRandomTriangleData() {
        const data = [];
        for (let i = 0; i < 5; i++) {
            const base = this.randomInt(4, 20);
            const height = this.randomInt(3, 15);
            const area = (base * height) / 2;
            data.push({ base, height, area });
        }
        return data;
    }
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    generateRectangleTable() {
        const data = this.generateRandomRectangleData();
        
        let html = `
            <thead>
                <tr>
                    <th>l</th>
                    <th>w</th>
                    <th>P</th>
                    <th>A</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        data.forEach((row, index) => {
            const hiddenFields = this.getRandomHiddenFields(4, 2);
            html += '<tr>';
            
            // Length
            if (hiddenFields.includes(0)) {
                html += `<td><input type="number" data-expected="${row.length}" data-row="${index}" data-field="length"></td>`;
            } else {
                html += `<td><span class="given-value">${row.length}</span></td>`;
            }
            
            // Width
            if (hiddenFields.includes(1)) {
                html += `<td><input type="number" data-expected="${row.width}" data-row="${index}" data-field="width"></td>`;
            } else {
                html += `<td><span class="given-value">${row.width}</span></td>`;
            }
            
            // Perimeter
            if (hiddenFields.includes(2)) {
                html += `<td><input type="number" data-expected="${row.perimeter}" data-row="${index}" data-field="perimeter"></td>`;
            } else {
                html += `<td><span class="given-value">${row.perimeter}</span></td>`;
            }
            
            // Area
            if (hiddenFields.includes(3)) {
                html += `<td><input type="number" data-expected="${row.area}" data-row="${index}" data-field="area"></td>`;
            } else {
                html += `<td><span class="given-value">${row.area}</span></td>`;
            }
            
            html += '</tr>';
        });
        
        html += '</tbody>';
        return html;
    }
    
    generateSquareTable() {
        const data = this.generateRandomSquareData();
        
        let html = `
            <thead>
                <tr>
                    <th>s</th>
                    <th>P</th>
                    <th>A</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        data.forEach((row, index) => {
            const hiddenFields = this.getRandomHiddenFields(3, 2);
            html += '<tr>';
            
            // Side
            if (hiddenFields.includes(0)) {
                html += `<td><input type="number" data-expected="${row.side}" data-row="${index}" data-field="side"></td>`;
            } else {
                html += `<td><span class="given-value">${row.side}</span></td>`;
            }
            
            // Perimeter
            if (hiddenFields.includes(1)) {
                html += `<td><input type="number" data-expected="${row.perimeter}" data-row="${index}" data-field="perimeter"></td>`;
            } else {
                html += `<td><span class="given-value">${row.perimeter}</span></td>`;
            }
            
            // Area
            if (hiddenFields.includes(2)) {
                html += `<td><input type="number" data-expected="${row.area}" data-row="${index}" data-field="area"></td>`;
            } else {
                html += `<td><span class="given-value">${row.area}</span></td>`;
            }
            
            html += '</tr>';
        });
        
        html += '</tbody>';
        return html;
    }
    
    generateTriangleTable() {
        const data = this.generateRandomTriangleData();
        
        let html = `
            <thead>
                <tr>
                    <th>b</th>
                    <th>h</th>
                    <th>A</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        data.forEach((row, index) => {
            const hiddenFields = this.getRandomHiddenFields(3, 1);
            html += '<tr>';
            
            // Base
            if (hiddenFields.includes(0)) {
                html += `<td><input type="number" data-expected="${row.base}" data-row="${index}" data-field="base"></td>`;
            } else {
                html += `<td><span class="given-value">${row.base}</span></td>`;
            }
            
            // Height
            if (hiddenFields.includes(1)) {
                html += `<td><input type="number" data-expected="${row.height}" data-row="${index}" data-field="height"></td>`;
            } else {
                html += `<td><span class="given-value">${row.height}</span></td>`;
            }
            
            // Area
            if (hiddenFields.includes(2)) {
                html += `<td><input type="number" data-expected="${row.area}" data-row="${index}" data-field="area"></td>`;
            } else {
                html += `<td><span class="given-value">${row.area}</span></td>`;
            }
            
            html += '</tr>';
        });
        
        html += '</tbody>';
        return html;
    }
    
    getRandomHiddenFields(totalFields, hiddenCount) {
        const indices = Array.from({ length: totalFields }, (_, i) => i);
        const hidden = [];
        
        for (let i = 0; i < hiddenCount; i++) {
            const randomIndex = Math.floor(Math.random() * indices.length);
            hidden.push(indices.splice(randomIndex, 1)[0]);
        }
        
        return hidden;
    }
    
    validateInput(input) {
        if (this.isCompleted) return;
        
        const expectedValue = parseFloat(input.dataset.expected);
        const userValue = parseFloat(input.value);
        
        input.classList.remove('correct', 'incorrect');
        
        if (input.value === '') {
            return;
        }
        
        if (userValue === expectedValue) {
            input.classList.add('correct');
            this.solvedProblems++;
            this.updateScore();
            this.checkAllCorrect();
        } else {
            input.classList.add('incorrect');
            if (this.successMessage) this.successMessage.classList.remove('show');
        }
    }
    
    checkAllCorrect() {
        if (!this.shapeTable) return;
        
        const inputs = this.shapeTable.querySelectorAll('input');
        const correctInputs = this.shapeTable.querySelectorAll('input.correct');
        
        if (inputs.length > 0 && correctInputs.length === inputs.length) {
            this.completionTime = (performance.now() - this.startTime) / 1000;
            if (this.completionTimeDisplay) {
                this.completionTimeDisplay.textContent = `Completed in: ${this.completionTime.toFixed(2)}s`;
            }
            
            this.updateScore();
            this.saveSessionScore();
            this.stopTimer();
            this.isCompleted = true;
            
            setTimeout(() => {
                if (this.successMessage) this.successMessage.classList.add('show');
                this.showResultsModal();
            }, 300);
        }
    }
    
    showResultsModal() {
        if (!this.resultsModal || !this.chartContainer) return;
        
        this.resultsModal.style.display = 'block';
        this.chartContainer.style.display = 'block';
        this.updateChart();
    }
    
    closeResultsModal() {
        if (this.resultsModal) {
            this.resultsModal.style.display = 'none';
        }
    }
    
    updateScore() {
        if (this.totalProblems === 0) return;
        
        const accuracy = (this.solvedProblems / this.totalProblems) * 100;
        
        const currentTime = (performance.now() - this.startTime) / 1000;
        const maxTime = 120;
        const speedScore = Math.max(0, 100 - (currentTime / maxTime * 50));
        
        // Weighted score (70% accuracy, 30% speed)
        this.currentSessionScore = Math.round(
            (accuracy * 0.7) + (speedScore * 0.3)
        );
        
        this.updateChart();
    }
    
    startTimer() {
        if (!this.timerDisplay) return;
        
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
    
    updateTimerDisplay() {
        if (!this.timerDisplay) return;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (this.timeLeft <= 30) {
            this.timerDisplay.classList.add('warning');
        } else {
            this.timerDisplay.classList.remove('warning');
        }
    }
    
    endGame() {
        this.stopTimer();
        if (this.timerDisplay) {
            this.timerDisplay.textContent = "Time's up!";
            this.timerDisplay.classList.add('time-up');
        }
        
        if (this.shapeTable) {
            const inputs = this.shapeTable.querySelectorAll('input');
            inputs.forEach(input => {
                input.disabled = true;
            });
        }
        
        if (this.completionTime === null) {
            this.completionTime = this.timeLimit - this.timeLeft;
            if (this.completionTimeDisplay) {
                this.completionTimeDisplay.textContent = `Time's up! Completed ${this.solvedProblems}/${this.totalProblems}`;
            }
            this.updateScore();
        }
        
        this.saveSessionScore();
        this.isCompleted = true;
        this.showResultsModal();
    }
    
    saveSessionScore() {
        this.shapePracticeCounts[this.currentShape]++;
        this.practiceCount++;
        
        localStorage.setItem('geometryPracticeCount', this.practiceCount.toString());
        localStorage.setItem('geometryShapePracticeCounts', JSON.stringify(this.shapePracticeCounts));
        if (this.currentSessionScore > 0) {
            const scoreData = {
                score: this.currentSessionScore,
                time: this.completionTime,
                accuracy: Math.round((this.solvedProblems / this.totalProblems) * 100),
                date: new Date().toLocaleDateString(),
                shape: this.currentShape,
                timestamp: Date.now()
            };
            
            this.sessionScores.push(scoreData);
            this.sessionCount++;
            
            // Add to player's high scores
            const players = JSON.parse(localStorage.getItem('geometryPlayers')) || [];
            const currentPlayer = players.find(p => p.name === this.userName);
            
            if (currentPlayer) {
                if (!currentPlayer.highScores) currentPlayer.highScores = [];
                
                currentPlayer.highScores.push(scoreData);
                currentPlayer.highScores.sort((a, b) => b.score - a.score);
                if (currentPlayer.highScores.length > 5) {
                    currentPlayer.highScores = currentPlayer.highScores.slice(0, 5);
                }
                
                localStorage.setItem('geometryPlayers', JSON.stringify(players));
            }
            
            
            this.highScores.push(scoreData);
            this.highScores.sort((a, b) => b.score - a.score);
            if (this.highScores.length > 5) {
                this.highScores = this.highScores.slice(0, 5);
            }
            
            localStorage.setItem('geometryHighScores', JSON.stringify(this.highScores));
            this.updateHighScoresDisplay();
            
            this.updateChart();
        }
        this.checkForAwards();
    }
    
    updateHighScoresDisplay() {
        if (!this.highScoresList) return;
        
        this.highScoresList.innerHTML = '';
        
        if (this.highScores.length === 0) {
            this.highScoresList.innerHTML = '<li class="no-scores">No high scores yet</li>';
            return;
        }
        
        this.highScores.forEach((scoreData, index) => {
            const li = document.createElement('li');
            li.dataset.timestamp = scoreData.timestamp;
            li.innerHTML = `
            <div class="score-header">
                <span class="rank">${index + 1}</span>
                <img src="${this.avatarBaseUrl}${scoreData.avatar || 'male1'}" alt="${scoreData.userName}'s avatar" class="score-avatar">
                <span class="score-value">${scoreData.score} pts</span>
            </div>
            <div class="score-details">
                <span>${scoreData.accuracy}% accuracy</span>
                <span>${scoreData.time.toFixed(2)}s</span>
                <span>${scoreData.shape}</span>
                <span class="date">${scoreData.date}</span>
            </div>
        `;
            
            li.addEventListener('click', () => {
                this.showScoreComparison(scoreData.timestamp);
            });
            
            this.highScoresList.appendChild(li);
        });
    }
    
    showScoreComparison(timestamp) {
        const selectedScore = this.highScores.find(score => score.timestamp === timestamp);
        if (!selectedScore) return;
        
        // Find the highest score
        const highestScore = this.highScores.reduce((max, score) =>
            score.score > max.score ? score : max, this.highScores[0]);
        
        // Create comparison container
        const comparisonContainer = document.createElement('div');
        comparisonContainer.className = 'score-comparison-container';
        
        // Create comparison cards HTML
        comparisonContainer.innerHTML = `
        <div class="comparison-header">
            <h3 class="comparison-title">Score Comparison</h3>
            <div class="comparison-stats">
                <div class="comparison-stat">
                    <i class="fas fa-trophy"></i> Highest: ${highestScore.score} pts
                </div>
                <div class="comparison-stat">
                    <i class="fas fa-clock"></i> Best Time: ${highestScore.time.toFixed(2)}s
                </div>
            </div>
        </div>
        
        <div class="comparison-chart-container">
            <canvas id="comparisonChart"></canvas>
        </div>
        
        <div class="comparison-cards">
            <div class="comparison-card highscore">
                <div class="comparison-card-header">
                    <img src="${this.avatarBaseUrl}${highestScore.avatar || 'male1'}" 
                         alt="${highestScore.userName}'s avatar" class="comparison-avatar">
                    <div class="comparison-user">
                        <div class="comparison-user-name">${highestScore.userName || 'Top Player'}</div>
                        <div class="comparison-user-date">${highestScore.date}</div>
                    </div>
                </div>
                <div class="comparison-score">${highestScore.score} pts</div>
                <div class="comparison-details">
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Accuracy</div>
                        <div class="comparison-detail-value accuracy">${highestScore.accuracy}%</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Time</div>
                        <div class="comparison-detail-value time">${highestScore.time.toFixed(2)}s</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Shape</div>
                        <div class="comparison-detail-value">${highestScore.shape}</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Completed</div>
                        <div class="comparison-detail-value">${highestScore.date}</div>
                    </div>
                </div>
            </div>
            
            <div class="comparison-card selected">
                <div class="comparison-card-header">
                    <img src="${this.avatarBaseUrl}${selectedScore.avatar || 'male1'}" 
                         alt="${selectedScore.userName}'s avatar" class="comparison-avatar">
                    <div class="comparison-user">
                        <div class="comparison-user-name">${selectedScore.userName || 'Player'}</div>
                        <div class="comparison-user-date">${selectedScore.date}</div>
                    </div>
                </div>
                <div class="comparison-score">${selectedScore.score} pts</div>
                <div class="comparison-details">
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Accuracy</div>
                        <div class="comparison-detail-value accuracy">${selectedScore.accuracy}%</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Time</div>
                        <div class="comparison-detail-value time">${selectedScore.time.toFixed(2)}s</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Shape</div>
                        <div class="comparison-detail-value">${selectedScore.shape}</div>
                    </div>
                    <div class="comparison-detail">
                        <div class="comparison-detail-label">Completed</div>
                        <div class="comparison-detail-value">${selectedScore.date}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
        
        // Replace existing chart container with this new comparison view
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '';
            chartContainer.appendChild(comparisonContainer);
        }
        
        // Initialize the comparison chart
        this.initializeComparisonChart(highestScore, selectedScore);
        
        // Highlight the selected card in high scores list
        document.querySelectorAll('#highScoresList li').forEach(li => {
            li.classList.remove('selected-card');
            if (li.dataset.timestamp === timestamp.toString()) {
                li.classList.add('selected-card');
            }
        });
        
        this.showResultsModal();
    }
    
    initializeComparisonChart(highestScore, selectedScore) {
        const ctx = document.getElementById('comparisonChart')?.getContext('2d');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Score', 'Accuracy', 'Time (s)'],
                datasets: [
                {
                    label: highestScore.userName || 'High Score',
                    data: [highestScore.score, highestScore.accuracy, highestScore.time],
                    backgroundColor: 'rgba(58, 142, 226, 0.7)',
                    borderColor: 'rgba(58, 142, 226, 1)',
                    borderWidth: 1
                },
                {
                    label: selectedScore.userName || 'Your Score',
                    data: [selectedScore.score, selectedScore.accuracy, selectedScore.time],
                    backgroundColor: 'rgba(245, 192, 54, 0.7)',
                    borderColor: 'rgba(245, 192, 54, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Score & Accuracy (%)'
                        },
                        ticks: {
                            callback: function(value, index, ticks) {
                                // For the first two labels (Score and Accuracy), use pts and %
                                const label = this.chart.scales.y.axis === 'y' ?
                                    this.chart.data.labels[index] : '';
                                
                                if (label === 'Score') {
                                    return value + ' pts';
                                } else if (label === 'Accuracy') {
                                    return value + '%';
                                }
                                return value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    const suffix = context.label === 'Score' ? ' pts' :
                                        context.label === 'Accuracy' ? '%' : 's';
                                    label += context.parsed.y.toFixed(2) + suffix;
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }
    
    initializeUserProfile() {
        // If user doesn't have a name, prompt for it
        if (!this.userName) {
            this.showUserProfileModal();
        } else {
            this.updateUserDisplay();
        }
        
        // Setup avatar selector with DiceBear avatars
        if (this.avatarSelector) {
            this.avatarSelector.innerHTML = this.avatarOptions.map(avatar =>
                `<div class="avatar-option" data-avatar="${avatar}">
                    <img src="${this.avatarBaseUrl}${avatar}" alt="${avatar}">
                </div>`
            ).join('');
            
            document.querySelectorAll('.avatar-option').forEach(option => {
                option.addEventListener('click', () => {
                    this.userAvatar = option.dataset.avatar;
                    localStorage.setItem('geometryUserAvatar', this.userAvatar);
                    this.updateUserDisplay();
                    document.getElementById('avatarModal').style.display = 'none';
                });
            });
        }
        
        // Start timer only if we have a user name
        if (this.userName) {
            this.startTimer();
        }
    }
    
    showUserProfileModal() {
        const profileModal = document.getElementById('profileModal');
        if (profileModal) profileModal.style.display = 'block';
    }
    
    saveUserProfile() {
        if (!this.userNameInput) return;
        
        const newPlayerName = this.userNameInput.value.trim();
        if (!newPlayerName) {
            alert('Please enter your name');
            return;
        }
        
        const players = JSON.parse(localStorage.getItem('geometryPlayers')) || [];
        const existingPlayer = players.find(p => p.name === newPlayerName);
        
        if (existingPlayer) {
            // Switch to existing player
            this.switchPlayer(existingPlayer.id);
        } else {
            // Create new player with default avatar
            const newPlayer = {
                id: Date.now().toString(),
                name: newPlayerName,
                avatar: 'male1', // Default avatar
                highScores: [],
                totalTries: 0
            };
            
            players.push(newPlayer);
            localStorage.setItem('geometryPlayers', JSON.stringify(players));
            this.switchPlayer(newPlayer.id);
        }
        
        const profileModal = document.getElementById('profileModal');
        if (profileModal) profileModal.style.display = 'none';
        
        // Open avatar selection modal
        this.openAvatarModal();
        
        // Start the timer after profile is saved
        this.startTimer();
    }
    
    updateUserDisplay() {
        if (this.userDisplay) this.userDisplay.textContent = this.userName;
        if (this.avatarDisplay) {
            // Use DiceBear avatar image instead of emoji
            this.avatarDisplay.innerHTML = this.userAvatar ?
                `<img src="${this.avatarBaseUrl}${this.userAvatar}" alt="${this.userName}'s avatar">` :
                `<img src="${this.avatarBaseUrl}male1" alt="Default avatar">`;
        }
        if (this.triesDisplay) this.triesDisplay.textContent = `Tries: ${this.totalTries}`;
    }
    
    incrementTries() {
        this.totalTries++;
        localStorage.setItem('geometryTotalTries', this.totalTries.toString());
        this.updateUserDisplay();
    }
    
    initializeChart() {
        if (!this.chartCanvas) return;
        
        if (this.chart) {
            this.chart.destroy();
        }
        this.chart = new Chart(this.chartCanvas, {
            type: 'bar',
            data: {
                labels: ['Highest Score', 'Your Score'],
                datasets: [
                {
                    label: 'Score',
                    data: [0, 0],
                    backgroundColor: ['rgba(58, 142, 226, 0.7)', 'rgba(245, 192, 54, 0.7)'],
                    borderColor: ['rgba(58, 142, 226, 1)', 'rgba(245, 192, 54, 1)'],
                    borderWidth: 1
                },
                {
                    label: 'Accuracy',
                    data: [0, 0],
                    backgroundColor: ['rgba(58, 142, 226, 0.5)', 'rgba(245, 192, 54, 0.5)'],
                    borderColor: ['rgba(58, 142, 226, 1)', 'rgba(245, 192, 54, 1)'],
                    borderWidth: 1,
                    type: 'line',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Score (%)'
                        }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        },
                        title: {
                            display: true,
                            text: 'Accuracy (%)'
                        }
                    }
                }
            }
        });
    }
    
    updateChart() {
        if (!this.chart) return;
        
        this.chart.data.labels = Array.from({ length: this.sessionScores.length }, (_, i) => `Session ${i+1}`);
        this.chart.data.datasets[0].data = this.sessionScores.map(s => s.score);
        this.chart.data.datasets[1].data = this.sessionScores.map(s => s.accuracy);
        
        this.chart.update();
    }
    
    printResults() {
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const printAvatarUrl = this.userAvatar ?
            `${this.avatarBaseUrl}${this.userAvatar}` :
            `${this.avatarBaseUrl}male1`;
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Geometry Genius Report</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Fredoka+One&display=swap');
                        
                        body {
                            font-family: 'Poppins', sans-serif;
                            background: #f5f7fa;
                            margin: 0;
                            padding: 0;
                        }
                        
                        .print-container {
                            width: 21cm;
                            min-height: 29.7cm;
                            margin: 0 auto;
                            padding: 2cm;
                            background: white;
                            position: relative;
                            box-shadow: 0 0 20px rgba(0,0,0,0.1);
                        }
                        
                        .print-header {
                            text-align: center;
                            margin-bottom: 30px;
                            position: relative;
                            padding-bottom: 20px;
                            border-bottom: 3px solid #3A8EE2;
                        }
                        
                        .print-title {
                            font-family: 'Fredoka One', cursive;
                            color: #3A8EE2;
                            font-size: 42px;
                            margin: 0;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
                        }
                        
                        .print-subtitle {
                            color: #666;
                            font-size: 18px;
                            margin-top: 5px;
                        }
                        
                        .print-date {
                            position: absolute;
                            right: 0;
                            top: 0;
                            color: #888;
                            font-size: 14px;
                        }
                        
                        .user-info {
                            display: flex;
                            justify-content: space-between;
                            margin: 30px 0;
                            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
                            padding: 20px;
                            border-radius: 10px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                        }
                        
                        .user-avatar {
                            margin-right: 20px;
                        }
                        
                        .user-avatar img {
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 3px solid #3A8EE2;
                        }
                        
                        .user-details {
                            flex: 1;
                        }
                        
                        .user-name {
                            font-size: 24px;
                            font-weight: 600;
                            color: #333;
                            margin-bottom: 5px;
                        }
                        
                        .user-stats {
                            display: flex;
                            gap: 15px;
                            margin-top: 10px;
                        }
                        
                        .stat-item {
                            background: white;
                            padding: 8px 15px;
                            border-radius: 20px;
                            font-size: 14px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        }
                        
                        .chart-container {
                            width: 100%;
                            height: 400px;
                            margin: 30px 0;
                            background: white;
                            border-radius: 10px;
                            padding: 20px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                        }
                        
                        .leaderboard {
                            margin-top: 40px;
                            background: white;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                        }
                        
                        .leaderboard-header {
                            background: #3A8EE2;
                            color: white;
                            padding: 15px 20px;
                            font-size: 20px;
                            font-weight: 600;
                        }
                        
                        .leaderboard-item {
                            display: flex;
                            align-items: center;
                            padding: 15px 20px;
                            border-bottom: 1px solid #eee;
                        }
                        
                        .leaderboard-item:last-child {
                            border-bottom: none;
                        }
                        
                        .leaderboard-avatar {
                            margin-right: 15px;
                        }
                        
                        .leaderboard-avatar img {
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            object-fit: cover;
                        }
                        
                        .leaderboard-rank {
                            font-weight: 600;
                            color: #3A8EE2;
                            width: 30px;
                        }
                        
                        .leaderboard-name {
                            flex: 1;
                        }
                        
                        .leaderboard-score {
                            font-weight: 600;
                            color: #F5C036;
                        }
                        
                        .print-footer {
                            text-align: center;
                            margin-top: 40px;
                            padding-top: 20px;
                            border-top: 2px dashed #ddd;
                            color: #888;
                            font-size: 14px;
                        }
                        
                        .watermark {
                            position: absolute;
                            bottom: 20px;
                            right: 20px;
                            opacity: 0.1;
                            font-size: 72px;
                            font-weight: 700;
                            color: #3A8EE2;
                            transform: rotate(-15deg);
                        }
                        
                        @media print {
                            body {
                                background: white !important;
                            }
                            .print-container {
                                box-shadow: none;
                                padding: 1cm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="print-header">
                            <div class="print-date">${currentDate}</div>
                            <h1 class="print-title">Geometry Genius</h1>
                            <div class="print-subtitle">Performance Report</div>
                        </div>
                        
                        <div class="user-info">
                            <div class="user-avatar">
                                <img src="${printAvatarUrl}" alt="User Avatar" width="80" height="80">
                            </div>
                            <div class="user-details">
                                <div class="user-name">${this.userName || 'Math Whiz'}</div>
                                <div class="user-stats">
                                    <div class="stat-item">Score: ${this.currentSessionScore}%</div>
                                    <div class="stat-item">Accuracy: ${Math.round((this.solvedProblems / this.totalProblems) * 100)}%</div>
                                    <div class="stat-item">Time: ${this.completionTime ? this.completionTime.toFixed(2) + 's' : 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chart-container">
                            <canvas id="printChart" width="100%" height="100%"></canvas>
                        </div>
                        
                        <div class="leaderboard">
                            <div class="leaderboard-header">Top Performers</div>
                            ${this.highScores.map((score, index) => `
                                <div class="leaderboard-item">
                                    <div class="leaderboard-avatar">
                                        <img src="${this.avatarBaseUrl}${score.avatar || 'male1'}" alt="${score.userName || 'Player'}">
                                    </div>
                                    <div class="leaderboard-rank">${index + 1}.</div>
                                    <div class="leaderboard-name">${score.userName || 'Player'}</div>
                                    <div class="leaderboard-score">${score.score} pts</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="print-footer">
                            Generated by Geometry Practice App • ${new Date().getFullYear()}
                        </div>
                        
                        <div class="watermark">MATH</div>
                    </div>
                    
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                    <script>
                        const ctx = document.getElementById('printChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: ${JSON.stringify(this.sessionScores.map((_, i) => `Session ${i+1}`))},
                                datasets: [
                                    {
                                        label: 'Total Score',
                                        data: ${JSON.stringify(this.sessionScores.map(s => s.score))},
                                        backgroundColor: '#3A8EE2',
                                        borderColor: '#2a6cb9',
                                        borderWidth: 2
                                    },
                                    {
                                        label: 'Accuracy',
                                        data: ${JSON.stringify(this.sessionScores.map(s => s.accuracy))},
                                        backgroundColor: '#F5C036',
                                        borderColor: '#d9a82e',
                                        borderWidth: 2
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        grid: {
                                            color: 'rgba(0,0,0,0.05)'
                                        },
                                        ticks: {
                                            font: {
                                                family: 'Poppins',
                                                weight: '600'
                                            }
                                        }
                                    },
                                    x: {
                                        grid: {
                                            display: false
                                        },
                                        ticks: {
                                            font: {
                                                family: 'Poppins',
                                                weight: '600'
                                            }
                                        }
                                    }
                                },
                                plugins: {
                                    legend: {
                                        labels: {
                                            font: {
                                                family: 'Poppins',
                                                size: 14,
                                                weight: '600'
                                            },
                                            boxWidth: 20,
                                            padding: 20
                                        }
                                    },
                                    tooltip: {
                                        titleFont: {
                                            family: 'Poppins',
                                            size: 14,
                                            weight: '600'
                                        },
                                        bodyFont: {
                                            family: 'Poppins',
                                            size: 12
                                        },
                                        padding: 10,
                                        backgroundColor: 'rgba(0,0,0,0.8)'
                                    }
                                }
                            }
                        });
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
    
    restartGame() {
        this.stopTimer();
        
        if (this.currentSessionScore > 0) {
            this.saveSessionScore();
        }
        
        this.timeLeft = this.timeLimit;
        if (this.timerDisplay) {
            this.timerDisplay.textContent = "2:00";
            this.timerDisplay.classList.remove('warning', 'time-up');
        }
        this.currentSessionScore = 0;
        this.completionTime = null;
        if (this.completionTimeDisplay) {
            this.completionTimeDisplay.textContent = '';
        }
        this.isCompleted = false;
        
        this.closeResultsModal();
        
        // Hide chart again
        if (this.chartContainer) {
            this.chartContainer.style.display = 'none';
        }
        
        this.generateTable();
        if (this.successMessage) {
            this.successMessage.classList.remove('show');
        }
        this.startTimer();
        this.incrementTries();
    }
    
    showPlayerSelection() {
        const modal = document.createElement('div');
        modal.className = 'player-selection-modal';
        modal.innerHTML = `
        <div class="player-selection-content">
            <h3>Select Player</h3>
            <div class="player-list" id="playerList"></div>
            <div class="new-player-form">
                <input type="text" id="newPlayerName" placeholder="New player name">
                <button id="addNewPlayer" class="btn btn-primary">Add Player</button>
            </div>
            <div class="player-selection-buttons">
                <button id="cancelPlayerSelection" class="btn btn-secondary">Cancel</button>
            </div>
        </div>
    `;
        
        document.body.appendChild(modal);
        
        // Load existing players
        this.loadPlayerList();
        
        // Set up event listeners
        document.getElementById('addNewPlayer').addEventListener('click', () => this.addNewPlayer());
        document.getElementById('cancelPlayerSelection').addEventListener('click', () => modal.remove());
    }
    
    loadPlayerList() {
        const playerList = document.getElementById('playerList');
        if (!playerList) return;
        
        playerList.innerHTML = '';
        
        const players = JSON.parse(localStorage.getItem('geometryPlayers')) || [];
        
        if (players.length === 0) {
            playerList.innerHTML = '<p>No players found. Add a new player.</p>';
            return;
        }
        
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.innerHTML = `
            <img src="${this.avatarBaseUrl}${player.avatar || 'male1'}" alt="${player.name}'s avatar">
            <span>${player.name}</span>
            <button class="btn btn-small select-player" data-id="${player.id}">Select</button>
            <button class="btn btn-small btn-edit edit-avatar" data-id="${player.id}" title="Edit Avatar">
                <i class="fas fa-user-edit">Edit</i>
            </button>
        `;
            playerList.appendChild(playerElement);
            
            playerElement.querySelector('.select-player').addEventListener('click', () => {
                this.switchPlayer(player.id);
                document.querySelector('.player-selection-modal').remove();
            });
            
            playerElement.querySelector('.edit-avatar').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editPlayerAvatar(player.id);
            });
        });
    }
    
    editPlayerAvatar(playerId) {
        const players = JSON.parse(localStorage.getItem('geometryPlayers')) || [];
        const player = players.find(p => p.id === playerId);
        
        if (player) {
            // Temporarily switch to this player for avatar selection
            const currentPlayer = {
                name: this.userName,
                avatar: this.userAvatar
            };
            
            this.userName = player.name;
            this.userAvatar = player.avatar;
            this.setupAvatarSelection();
            
            const avatarModal = document.getElementById('avatarModal');
            if (avatarModal) avatarModal.style.display = 'block';
            
            // Override the confirm button to handle avatar update
            const confirmBtn = document.getElementById('confirmAvatar');
            if (confirmBtn) {
                const originalClick = confirmBtn.onclick;
                confirmBtn.onclick = () => {
                    player.avatar = this.userAvatar;
                    localStorage.setItem('geometryPlayers', JSON.stringify(players));
                    
                    // Restore original player if not switching
                    this.userName = currentPlayer.name;
                    this.userAvatar = currentPlayer.avatar;
                    this.updateUserDisplay();
                    
                    // Reload player list
                    this.loadPlayerList();
                    this.closeAvatarModal();
                    
                    // Restore original click handler
                    confirmBtn.onclick = originalClick;
                };
            }
        }
    }
    
    addNewPlayer() {
        const newPlayerName = document.getElementById('newPlayerName').value.trim();
        if (!newPlayerName) {
            alert('Please enter a player name');
            return;
        }
        
        const players = JSON.parse(localStorage.getItem('geometryPlayers')) || [];
        const newPlayer = {
            id: Date.now().toString(),
            name: newPlayerName,
            avatar: 'male1', // Default avatar
            highScores: [],
            totalTries: 0
        };
        
        players.push(newPlayer);
        localStorage.setItem('geometryPlayers', JSON.stringify(players));
        
        // Switch to the new player
        this.switchPlayer(newPlayer.id);
        document.querySelector('.player-selection-modal').remove();
    }
    
    switchPlayer(playerId) {
        const players = JSON.parse(localStorage.getItem('geometryPlayers')) || [];
        const player = players.find(p => p.id === playerId);
        
        if (player) {
            // Update current player data
            this.userName = player.name;
            this.userAvatar = player.avatar;
            this.totalTries = player.totalTries || 0;
            this.highScores = player.highScores || [];
            
            // Save to localStorage (individual fields for backward compatibility)
            localStorage.setItem('geometryUserName', this.userName);
            localStorage.setItem('geometryUserAvatar', this.userAvatar);
            localStorage.setItem('geometryTotalTries', this.totalTries.toString());
            localStorage.setItem('geometryHighScores', JSON.stringify(this.highScores));
            
            // Update UI
            this.updateUserDisplay();
            this.updateHighScoresDisplay();
            
            // Restart game with new player
            this.restartGame();
        }
    }
    
    // Add new methods:
    setupAvatarSelection() {
        const avatarGrid = document.getElementById('avatarGrid');
        if (!avatarGrid) return;
        
        avatarGrid.innerHTML = '';
        
        this.avatarOptions.forEach(avatar => {
            const avatarElement = document.createElement('div');
            avatarElement.className = `avatar-option ${this.userAvatar === avatar ? 'selected' : ''}`;
            avatarElement.dataset.avatar = avatar;
            avatarElement.innerHTML = `
            <img src="${this.avatarBaseUrl}${avatar}" alt="${avatar}">
            <div class="avatar-checkmark">✓</div>
        `;
            
            avatarElement.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                avatarElement.classList.add('selected');
                this.userAvatar = avatar;
            });
            
            avatarGrid.appendChild(avatarElement);
        });
    }
    
    openAvatarModal() {
        const avatarModal = document.getElementById('avatarModal');
        if (!avatarModal) return;
        
        this.setupAvatarSelection();
        avatarModal.style.display = 'block';
    }
    
    closeAvatarModal() {
        const avatarModal = document.getElementById('avatarModal');
        if (avatarModal) avatarModal.style.display = 'none';
    }
    
    saveAvatarSelection() {
        // Update current player's avatar
        const players = JSON.parse(localStorage.getItem('geometryPlayers')) || [];
        const playerIndex = players.findIndex(p => p.name === this.userName);
        
        if (playerIndex !== -1) {
            players[playerIndex].avatar = this.userAvatar;
            localStorage.setItem('geometryPlayers', JSON.stringify(players));
        }
        
        // Also update the standalone avatar storage for backward compatibility
        localStorage.setItem('geometryUserAvatar', this.userAvatar);
        
        this.updateUserDisplay();
        this.closeAvatarModal();
    }
    
    checkForAwards() {

        const awardsShown = JSON.parse(localStorage.getItem('geometryAwardsShown')) || {};
        
        if (this.practiceCount >= 200 &&
            this.shapePracticeCounts.rectangle >= 60 &&
            this.shapePracticeCounts.square >= 60 &&
            this.shapePracticeCounts.triangle >= 60 &&
            !awardsShown.bronze) {
            
            this.showBronzeAward();
            awardsShown.bronze = true;
            localStorage.setItem('geometryAwardsShown', JSON.stringify(awardsShown));
        }
    }
    
    showBronzeAward() {
        // Create award modal
        const awardModal = document.createElement('div');
        awardModal.className = 'award-modal';
        awardModal.innerHTML = `
            <div class="award-content">
                <button class="close-award">&times;</button>
                <div class="certificate">
                    <div class="border-pattern"></div>
                    <div class="watermark">GEOMETRY</div>
                    
                    <div class="header">
                        <h1>Certificate of Achievement</h1>
                        <h2>Bronze Medal Award</h2>
                    </div>
                    
                    <div class="seal">
                        <div class="seal-inner">
                            <span>200</span>
                            <span>PRACTICE</span>
                            <span>SESSIONS</span>
                        </div>
                    </div>
                    
                    <div class="content">
                        <p>This certificate is proudly presented to</p>
                        <div class="recipient">${this.userName || 'Geometry Student'}</div>
                        <p class="achievement">for demonstrating exceptional dedication to mastering geometry concepts</p>
                        
                        <div class="shapes">
                            <div class="shape rectangle" title="Rectangle Practice">RECT</div>
                            <div class="shape square" title="Square Practice">SQUARE</div>
                            <div class="shape triangle" title="Triangle Practice">TRI</div>
                        </div>
                        
                        <p class="achievement">with at least 30% practice in each geometric shape</p>
                    </div>
                    
                    <div class="signatures">
                        <div class="signature">
                            <div class="signature-line"></div>
                            <div>Math Instructor</div>
                        </div>
                        <div class="signature">
                            <div class="signature-line"></div>
                            <div>Geometry Genius App</div>
                        </div>
                    </div>
                    
                    <div class="date">${new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</div>
                    
                    <div class="print-award">Print Certificate</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(awardModal);
        
        // Add styles dynamically
        const style = document.createElement('style');
        style.textContent = `
            .award-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .award-content {
                position: relative;
                max-width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .close-award {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 30px;
                color: white;
                cursor: pointer;
                z-index: 10;
            }
            
            .certificate {
                width: 800px;
                max-width: 100%;
                height: auto;
                background: linear-gradient(to bottom, #f9f2e8, #f0e6d2);
                border: 20px solid #cd7f32;
                padding: 40px;
                text-align: center;
                position: relative;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            }
            
            .border-pattern {
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                bottom: 10px;
                border: 2px solid #cd7f32;
                pointer-events: none;
            }
            
            .header h1 {
                font-size: 48px;
                color: #cd7f32;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 3px;
                font-weight: normal;
            }
            
            .header h2 {
                font-size: 24px;
                color: #333;
                margin: 10px 0;
                font-weight: normal;
                font-style: italic;
            }
            
            .seal {
                width: 120px;
                height: 120px;
                background-color: #cd7f32;
                border-radius: 50%;
                margin: 20px auto;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 14px;
                font-weight: bold;
                border: 4px solid #b87333;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            }
            
            .seal-inner {
                width: 100px;
                height: 100px;
                border: 2px solid white;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            
            .seal-inner span:first-child {
                font-size: 24px;
            }
            
            .content {
                margin: 30px 0;
                font-size: 20px;
                line-height: 1.6;
            }
            
            .recipient {
                font-size: 32px;
                font-weight: bold;
                color: #333;
                margin: 20px 0;
                text-decoration: underline;
                text-decoration-color: #cd7f32;
            }
            
            .achievement {
                font-size: 18px;
                margin: 10px 0;
            }
            
            .shapes {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin: 30px 0;
            }
            
            .shape {
                width: 80px;
                height: 80px;
                background-color: #cd7f32;
                opacity: 0.8;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 14px;
            }
            
            .rectangle {
                clip-path: polygon(0% 0%, 100% 0%, 100% 70%, 0% 70%);
            }
            
            .square {
                clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
            }
            
            .triangle {
                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            }
            
            .signatures {
                display: flex;
                justify-content: space-around;
                margin-top: 40px;
            }
            
            .signature {
                text-align: center;
                width: 200px;
            }
            
            .signature-line {
                border-top: 1px solid #333;
                margin: 5px auto;
                width: 150px;
            }
            
            .date {
                margin-top: 20px;
                font-style: italic;
            }
            
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 120px;
                font-weight: bold;
                color: rgba(205, 127, 50, 0.1);
                pointer-events: none;
                z-index: 0;
            }
            
            .print-award {
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #cd7f32;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: inline-block;
            }
            
            @media print {
                .award-modal {
                    background-color: white;
                    position: static;
                }
                .close-award, .print-award {
                    display: none;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        awardModal.querySelector('.close-award').addEventListener('click', () => {
            awardModal.remove();
            style.remove();
        });
        
        awardModal.querySelector('.print-award').addEventListener('click', () => {
            window.print();
        });
        
        // Play celebration sound if available
        this.playCelebrationSound();
    }
    
    playCelebrationSound() {
        try {
            const audio = new Audio('celebration-sound.mp3'); 
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Could not play sound:', e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GeometryCalculator();
});