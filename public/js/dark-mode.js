document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
  
  // Initialize dark mode state based on localStorage
  if (isDarkMode) {
    body.classList.add('dark-mode');
    darkModeToggle.checked = true;
  }
  
  // Listen for toggle changes
  darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
      body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'enabled');
    } else {
      body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'disabled');
    }
  });
});
