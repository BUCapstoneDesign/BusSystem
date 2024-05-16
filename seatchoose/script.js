document.addEventListener('DOMContentLoaded', () => {
  const seats = document.querySelectorAll('.seat');

  seats.forEach(seat => {
      seat.addEventListener('click', () => {
          if (!seat.classList.contains('selected')) {
              seat.classList.add('selected');
          } else {
              seat.classList.remove('selected');
          }
      });
  });
});
