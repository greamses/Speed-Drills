// 20 Demo credentials
const validCredentials = [
  { username: 'admin', password: 'eemadanyel' },
  { username: 'ebumetry', password: 'mth1023' },
  { username: 'dancimals', password: 'mth2123' },
  { username: 'fundivision', password: 'mth3325' },
  { username: 'cherimetry', password: 'mth1227' },
  { username: 'chlodivision', password: 'mth4332' },
  { username: 'eraction', password: 'mth5217' },
  { username: 'karsquare', password: 'mth2290' },
  { username: 'chizzyatio', password: 'mth7786' },
  { username: 'furoduct', password: 'mth5443' },
  { username: 'jatimes', password: 'mth6231' },
  { username: 'kamsity', password: 'mth6779' },
  { username: 'davision', password: 'mth4553' },
  { username: 'meltiplication', password: 'mth8765' },
  { username: 'fikision', password: 'mth4330' },
  { username: 'jotraction', password: 'mth5329' },
  { username: 'mmegebra', password: 'mth8123' },
  { username: 'vikasion', password: 'mth8909' },
  { username: 'mia_thomas', password: 'Mia$963' },
  { username: 'alexander_jackson', password: 'Alex!159' }
];

// Display credentials

validCredentials.forEach((cred, index) => {
  const div = document.createElement('div');
  div.className = 'credential-item';
  div.innerHTML = `<strong>${index + 1}.</strong> <span class="username">${cred.username}</span><br><span class="password">${cred.password}</span>`;
  div.onclick = () => {
    document.getElementById('username').value = cred.username;
    document.getElementById('password').value = cred.password;
    document.getElementById('username').focus();
  };
  
});

// Form handling
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const feedback = document.getElementById('feedback');

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  // Clear previous feedback
  feedback.className = '';
  feedback.textContent = '';
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  
  // Validate credentials
  const isValid = validCredentials.some(
    cred => cred.username === username && cred.password === password
  );
  
  if (isValid) {
    feedback.textContent = '✓ Login successful! Redirecting...';
    feedback.className = 'correct visible';
    
    setTimeout(() => {
      window.location.href = './subjects.html';
    }, 1500);
  } else {
    feedback.textContent = '✗ Invalid username or password. Please try again.';
    feedback.className = 'incorrect visible';
    passwordInput.value = '';
    passwordInput.focus();
  }
});

// Clear feedback on input
usernameInput.addEventListener('input', () => {
  feedback.className = '';
});

passwordInput.addEventListener('input', () => {
  feedback.className = '';
});