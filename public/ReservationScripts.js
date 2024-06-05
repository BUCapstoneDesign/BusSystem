document.addEventListener('DOMContentLoaded', () => {
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

    // 요일을 반환하는 함수
    function getDayOfWeek(date) {
        const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        return days[date.getDay()];
    }

    // 주말을 제외한 날짜 선택 처리
    departureDateInput.addEventListener('input', () => {
        const selectedDate = new Date(departureDateInput.value);
        if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
            alert('주말은 선택할 수 없습니다.');
            departureDateInput.value = '';
        } else {
            fetchBusTimes(departureSelect.value, selectedDate);
        }
    });

    // 선택한 날짜의 요일에 맞는 버스 시간을 가져오는 함수
    function fetchBusTimes(departure, date) {
        const dayOfWeek = getDayOfWeek(date);
        fetch(`/bus-schedule?departure=${departure}&day=${dayOfWeek}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateBusTimes(data.times);
                } else {
                    console.error('Error fetching bus times:', data.message);
                }
            })
            .catch(error => console.error('Error fetching bus times:', error));
    }

    // 버스 시간을 업데이트하는 함수
    function updateBusTimes(times) {
        departureTimeInput.innerHTML = ''; // 기존 옵션을 초기화합니다.
        if (times.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '해당 날짜에 이용 가능한 버스가 없습니다';
            departureTimeInput.appendChild(option);
        } else {
            times.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                departureTimeInput.appendChild(option);
            });
        }
    }

    // "승차권 예약" 버튼 클릭 핸들러
    submitButton.addEventListener('click', () => {
        seatSelectionModal.style.display = 'block';
        fetchReservedSeats();
    });

    // 모달 닫기 핸들러
    closeModal.addEventListener('click', () => {
        seatSelectionModal.style.display = 'none';
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        if (event.target == seatSelectionModal) {
            seatSelectionModal.style.display = 'none';
        }
    });

    // 좌석 선택 로직
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

    // 선택된 좌석 수 업데이트
    function updateSelectedSeatsCount() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        selectedSeatsCount.textContent = `선택된 좌석: ${selectedSeats.length}`;
    }

    // "예약" 버튼 클릭 핸들러
    reserveButton.addEventListener('click', () => {
        if (!selectedSeat) {
            alert('좌석을 선택하세요.');
            return;
        }

        const departure = departureSelect.value;
        const arrival = document.getElementById('arrival').value;
        const date = departureDateInput.value;
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
                alert('좌석이 예약되었습니다.');
                seatSelectionModal.style.display = 'none';
                fetchReservedSeats();
            } else {
                alert(`예약 실패: ${result.message}`);
            }
        })
        .catch(error => console.error('Error during reservation:', error));
    });

    // 예약된 좌석을 가져오는 함수
    function fetchReservedSeats() {
        const reservationDate = departureDateInput.value;
        const reservationTime = departureTimeInput.value;
        fetch(`/reserved-seats?reservation_date=${reservationDate}&reservation_time=${reservationTime}`)
            .then(response => response.json())
            .then(data => {
                reservedSeats = data;
                updateSeats();
            })
            .catch(error => console.error('Error fetching reserved seats:', error));
    }

    // 좌석 UI 업데이트
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