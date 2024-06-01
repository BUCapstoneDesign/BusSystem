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
    let selectedSeat = null;
    let reservedSeats = [];
    let translations = {};

    // Fetch translations
    fetch('translations.json')
        .then(response => response.json())
        .then(data => {
            translations = data;
            applyTranslations('ko'); // 기본 언어를 한국어로 설정합니다.
        })
        .catch(error => console.error('Error fetching translations:', error));

    // Apply translations based on selected language
    function applyTranslations(lang) {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[lang] && translations[lang][key]) {
                element.textContent = translations[lang][key];
            }
        });
    }

    // Handle language change
    languageSelect.addEventListener('change', () => {
        const selectedLang = languageSelect.value;
        applyTranslations(selectedLang);
    });

    // Disable weekends in the date picker
    departureDateInput.addEventListener('input', () => {
        const selectedDate = new Date(departureDateInput.value);
        if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
            alert(translations[languageSelect.value]['alert_weekend'] || '주말은 선택할 수 없습니다.');
            departureDateInput.value = '';
        } else {
            fetchBusTimes(departureSelect.value, selectedDate);
        }
    });

    // Fetch available bus times for the selected date
    function fetchBusTimes(departure, date) {
        fetch(`/bus-schedule?departure=${departure}&date=${date.toISOString().split('T')[0]}`)
            .then(response => response.json())
            .then(data => {
                updateBusTimes(data.times);
            })
            .catch(error => console.error('Error fetching bus times:', error));
    }

    // Update the departure time options based on the fetched bus times
    function updateBusTimes(times) {
        departureTimeInput.innerHTML = times.map(time => `<option value="${time}">${time}</option>`).join('');
    }

    // Handle "승차권 예약" button click
    submitButton.addEventListener('click', () => {
        seatSelectionModal.style.display = 'block';
        fetchReservedSeats();
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
            if (!seat.classList.contains('reserved')) {
                if (selectedSeat) {
                    selectedSeat.classList.remove('selected');
                }
                seat.classList.add('selected');
                selectedSeat = seat;
                updateSelectedSeatsCount();
            }
        });
    });

    // Update selected seats count
    function updateSelectedSeatsCount() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        selectedSeatsCount.textContent = `${translations[languageSelect.value]['selected_seats'] || '선택된 좌석'}: ${selectedSeats.length}`;
    }

    // Handle reserve button click
    reserveButton.addEventListener('click', () => {
        if (!selectedSeat) {
            alert(translations[languageSelect.value]['select_seat'] || '좌석을 선택하세요.');
            return;
        }

        const departure = departureSelect.value;
        const arrival = document.getElementById('arrival').value;
        const date = departureDateInput.value.slice(5); // MM-DD 형식으로 변환
        const time = departureTimeInput.value;
        const seatNumber = selectedSeat.getAttribute('data-seat');

        fetch('/reserve-seat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                departure,
                arrival,
                date,
                time,
                seat_number: seatNumber
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(translations[languageSelect.value]['reservation_success'] || '예약 성공!');
                seatSelectionModal.style.display = 'none';
                fetchReservedSeats();
            } else {
                alert(translations[languageSelect.value]['reservation_failed'] || '예약 실패: ' + result.message);
            }
        })
        .catch(error => console.error('Error during reservation:', error));
    });

    // Fetch reserved seats
    function fetchReservedSeats() {
        const reservationDate = departureDateInput.value.slice(5); // MM-DD 형식으로 변환
        const reservationTime = departureTimeInput.value;
        fetch(`/reserved-seats?reservation_date=${reservationDate}&reservation_time=${reservationTime}`)
            .then(response => response.json())
            .then(data => {
                reservedSeats = data;
                updateSeats();
            })
            .catch(error => console.error('Error fetching reserved seats:', error));
    }

    // Update seats UI
    function updateSeats() {
        seats.forEach(seat => {
            const seatNumber = parseInt(seat.getAttribute('data-seat'));
            if (reservedSeats.includes(seatNumber)) {
                seat.classList.add('reserved');
                seat.classList.remove('selected');
            } else {
                seat.classList.remove('reserved');
            }
        });
    }
});