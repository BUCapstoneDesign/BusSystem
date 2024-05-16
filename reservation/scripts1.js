document.addEventListener("DOMContentLoaded", function() {
  const departureDateInput = document.getElementById('departure-date');

  // Set the minimum and maximum dates for the departure date input
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);

  const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  departureDateInput.min = formatDate(today);
  departureDateInput.max = formatDate(twoWeeksLater);

  // Set default date to today
  departureDateInput.value = formatDate(today);
});
