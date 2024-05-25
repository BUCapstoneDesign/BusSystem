document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select');
    const departureSelect = document.getElementById('departure');
    const departureDateInput = document.getElementById('departure-date');
    const departureTimeInput = document.getElementById('departure-time');
    const submitButton = document.getElementById('submit');
    const seatSelectionModal = document.getElementById('seat-selection-modal');
    const closeModal = document.getElementsByClassName('close')[0];
    const reserveButton = document.getElementById('reserve-button');
    const selectedSeatsCount = document.getElementById('selected-seats-count');
    const seats = document.querySelectorAll('.seat');

    // Set default language to Korean
    languageSelect.value = 'ko';

    // Disable weekends in the date picker
    departureDateInput.addEventListener('input', () => {
        const selectedDate = new Date(departureDateInput.value);
        if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
            alert('주말은 선택할 수 없습니다.');
            departureDateInput.value = '';
        }
    });

    // Set default time for each departure location
    departureSelect.addEventListener('change', () => {
        switch (departureSelect.value) {
            case '영등포':
                departureTimeInput.value = '06:50';
                break;
            case '교대':
                const day = new Date(departureDateInput.value).getDay();
                if (day === 5) {
                    departureTimeInput.value = '07:30';
                } else {
                    departureTimeInput.value = '07:30'; // 1st session
                    // For 2nd session, add logic to select either 07:30 or 08:30
                }
                break;
            case '잠실':
                departureTimeInput.value = '07:00';
                break;
            // Add more cases for each departure location
            // ...
            default:
                departureTimeInput.value = '12:00'; // Default time
                break;
        }
    });

    // Handle "승차권 예약" button click
    submitButton.addEventListener('click', () => {
        seatSelectionModal.style.display = 'block';
    });

    // Close the modal
    closeModal.addEventListener('click', () => {
        seatSelectionModal.style.display = 'none';
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target == seatSelectionModal) {
            seatSelectionModal.style.display = 'none';
        }
    });

    // Seat selection logic
    seats.forEach(seat => {
        seat.addEventListener('click', () => {
            if (!seat.classList.contains('selected')) {
                seat.classList.add('selected');
            } else {
                seat.classList.remove('selected');
            }
            updateSelectedSeatsCount();
        });
    });

    // Update selected seats count
    function updateSelectedSeatsCount() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        selectedSeatsCount.textContent = selectedSeats.length;
    }

    // Handle reserve button click
    reserveButton.addEventListener('click', () => {
        alert(`총 ${selectedSeatsCount.textContent}개의 좌석이 예약되었습니다.`);
        seatSelectionModal.style.display = 'none';
    });
});
