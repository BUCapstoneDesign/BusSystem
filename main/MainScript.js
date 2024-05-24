document.getElementById('language-select').addEventListener('change', function () {
  var selectedLanguage = this.value;
  fetchTranslations(selectedLanguage);
});

function fetchTranslations(language) {
  fetch('Translations.json')
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok');
          }
          return response.json();
      })
      .then(data => {
          applyTranslations(data[language]);
      })
      .catch(error => console.error('Error fetching translations:', error));
}

function applyTranslations(translations) {
  document.getElementById('notice-title').textContent = translations.noticeTitle;
  document.getElementById('no-notice').textContent = translations.noNotice;
  document.getElementById('no-bus').textContent = translations.noBus;
  document.getElementById('reservation-button').textContent = translations.reservationButton;
  document.getElementById('info-button').textContent = translations.infoButton;
}

document.addEventListener('DOMContentLoaded', () => {
  const languageSelect = document.getElementById('language-select');
  const infoButton = document.getElementById('info-button');
  const loginModal = document.getElementById('login-modal');
  const closeModal = document.getElementsByClassName('close')[0];
  const loginForm = document.getElementById('login-form');
  const messageDiv = document.getElementById('message');

  // Set default language to Korean
  languageSelect.value = 'ko';

  // Handle language change
  languageSelect.addEventListener('change', () => {
      const selectedLang = languageSelect.value;
      translatePage(selectedLang);
  });

  // Handle "내 정보" button click
  infoButton.addEventListener('click', () => {
      fetch('/check-login')
          .then(response => response.json())
          .then(data => {
              if (data.loggedIn) {
                  location.href = 'info.html';
              } else {
                  loginModal.style.display = 'block';
              }
          })
          .catch(error => {
              console.error('Error checking login status:', error);
              loginModal.style.display = 'block';
          });
  });

  // Close the modal
  closeModal.addEventListener('click', () => {
      loginModal.style.display = 'none';
  });

  // Close the modal when clicking outside of it
  window.addEventListener('click', (event) => {
      if (event.target == loginModal) {
          loginModal.style.display = 'none';
      }
  });

  // Handle login form submission
  loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const response = await fetch('/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
          messageDiv.textContent = '로그인 성공!';
          messageDiv.style.color = 'green';
          setTimeout(() => {
              loginModal.style.display = 'none';
              location.href = 'info.html';
          }, 1000);
      } else {
          messageDiv.textContent = '로그인 실패: ' + result.message;
          messageDiv.style.color = 'red';
      }
  });

  // Translate page content based on selected language
  function translatePage(lang) {
      fetch(`/translations.json`)
          .then(response => response.json())
          .then(translations => {
              const elementsToTranslate = document.querySelectorAll('[data-translate]');
              elementsToTranslate.forEach(element => {
                  const key = element.getAttribute('data-translate');
                  element.textContent = translations[lang][key] || element.textContent;
              });
          })
          .catch(error => console.error('Error fetching translations:', error));
  }
});
