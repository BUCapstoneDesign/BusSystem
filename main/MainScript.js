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