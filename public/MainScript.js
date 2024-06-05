document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('info-button');
    const reservationButton = document.getElementById('reservation-button');
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const alertModal = document.getElementById('alert-modal');
    const infoModal = document.getElementById('info-modal');
    const closeModal = document.getElementsByClassName('close');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessageDiv = document.getElementById('login-message');
    const registerMessageDiv = document.getElementById('register-message');
    const registerButton = document.getElementById('register-button');
    const userInfoDiv = document.getElementById('user-info');
    const studentNumberP = document.getElementById('student-number');
    const loginTimeP = document.getElementById('login-time');
    const reservationList = document.getElementById('reservation-list');
    let reservedSeats = [];

    // Handle "내 정보" button click
    infoButton.addEventListener('click', () => {
        fetch('/check-login-status')
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    fetchUserInfo();
                } else {
                    loginModal.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error checking login status:', error);
                loginModal.style.display = 'block';
            });
    });

    // Handle "승차권 예매" button click
    reservationButton.addEventListener('click', () => {
        fetch('/check-login-status')
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    location.href = 'Reservation.html';
                } else {
                    alertModal.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error checking login status:', error);
                alertModal.style.display = 'block';
            });
    });

    // Close the modal
    Array.from(closeModal).forEach(element => {
        element.addEventListener('click', () => {
            element.parentElement.parentElement.style.display = 'none';
        });
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
        } else if (event.target == registerModal) {
            registerModal.style.display = 'none';
        } else if (event.target == alertModal) {
            alertModal.style.display = 'none';
        } else if (event.target == infoModal) {
            infoModal.style.display = 'none';
        }
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const student_number = document.getElementById('login-student_number').value;
        const password = document.getElementById('login-password').value;

        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ student_number, password })
        });

        const result = await response.json();

        if (result.success) {
            loginMessageDiv.textContent = '로그인 성공!';
            loginMessageDiv.style.color = 'green';
            userInfoDiv.textContent = `학번: ${result.student_number}`;
            setTimeout(() => {
                loginModal.style.display = 'none';
                location.href = '/'; // 메인 화면으로 리디렉트
            }, 1000);
        } else {
            loginMessageDiv.textContent = '로그인 실패: ' + result.message;
            loginMessageDiv.style.color = 'red';
        }
    });

    // Handle register button click
    registerButton.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'block';
    });

    // Handle register form submission
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const student_number = document.getElementById('register-student_number').value;
        const password = document.getElementById('register-password').value;

        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ student_number, password })
        });

        const result = await response.json();

        if (result.success) {
            registerMessageDiv.textContent = '회원 가입 성공!';
            registerMessageDiv.style.color = 'green';
            setTimeout(() => {
                registerModal.style.display = 'none';
                loginModal.style.display = 'block';
            }, 1000);
        } else {
            registerMessageDiv.textContent = '회원 가입 실패: ' + result.message;
            registerMessageDiv.style.color = 'red';
        }
    });

    // Fetch reserved seats
    function fetchReservedSeats() {
        const reservationDate = document.getElementById('reservation-date').value;
        const reservationTime = document.getElementById('reservation-time').value;
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

    // Handle seat selection
    seats.forEach(seat => {
        seat.addEventListener('click', () => {
            if (!seat.classList.contains('reserved')) {
                if (!seat.classList.contains('selected')) {
                    seat.classList.add('selected');
                } else {
                    seat.classList.remove('selected');
                }
                updateSelectedSeatsCount();
            }
        });
    });

    // Update selected seats count
    function updateSelectedSeatsCount() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        selectedSeatsCount.textContent = `선택된 좌석: ${selectedSeats.length}`;
    }

    // Handle reserve button click
    reserveButton.addEventListener('click', () => {
        const selectedSeats = Array.from(document.querySelectorAll('.seat.selected')).map(seat => seat.getAttribute('data-seat'));
        const reservationDate = document.getElementById('reservation-date').value;
        const reservationTime = document.getElementById('reservation-time').value;

        if (selectedSeats.length > 0) {
            fetch('/reserve-seat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    seat_number: selectedSeats[0], // 예시로 첫 번째 좌석만 예약
                    reservation_date: reservationDate,
                    reservation_time: reservationTime
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert(`총 ${selectedSeats.length}개의 좌석이 예약되었습니다.`);
                    seatSelectionModal.style.display = 'none';
                    fetchReservedSeats(); // 예약 후 다시 조회하여 업데이트
                } else {
                    alert(`예약 실패: ${result.message}`);
                }
            })
            .catch(error => console.error('Error reserving seat:', error));
        } else {
            alert('좌석을 선택하세요.');
        }
    });

    // Fetch user info to display in modal
    function fetchUserInfo() {
        fetch('/user-info')
            .then(response => response.json())
            .then(data => {
                if (data.student_number) {
                    studentNumberP.textContent = `학번: ${data.student_number}`;
                    loginTimeP.textContent = `로그인 일시: ${new Date(data.loginTime).toLocaleString()}`;
                    renderReservationList(data.reservations);

                    infoModal.style.display = 'block';
                }
            })
            .catch(error => console.error('Error fetching user info:', error));
    }

    // Render reservation list with cancel buttons
    function renderReservationList(reservations) {
        reservationList.innerHTML = '';
        reservations.forEach(reservation => {
            const listItem = document.createElement('li');
            listItem.textContent = `날짜: ${reservation.reservation_date}, 시간: ${reservation.reservation_time}, 좌석: ${reservation.seat_number}`;
            
            // 예약 취소 버튼 추가
            const cancelButton = document.createElement('button');
            cancelButton.textContent = '취소';
            cancelButton.addEventListener('click', () => {
                if (confirm('정말 취소하시겠습니까?')) {
                    cancelReservation(reservation.reservation_id);
                }
            });

            listItem.appendChild(cancelButton);
            reservationList.appendChild(listItem);
        });
    }

    // 예약 취소 함수
    function cancelReservation(reservation_id) {
        fetch('/cancel-reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reservation_id })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('예약이 취소되었습니다.');
                fetchUserInfo(); // 예약 목록 갱신
            } else {
                alert('예약 취소 실패: ' + result.message);
            }
        })
        .catch(error => console.error('Error cancelling reservation:', error));
    }

    // Fetch reserved seats on page load
    fetchReservedSeats();

    // Check login status on page load
    fetch('/check-login-status')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                userInfoDiv.textContent = `학번: ${data.student_number}`;
                // Update UI with student number
                const studentNumberDisplay = document.createElement('span');
                studentNumberDisplay.textContent = `학번: ${data.student_number}`;
                const languageDiv = document.querySelector('.language');
                languageDiv.insertAdjacentElement('beforebegin', studentNumberDisplay);
            }
        })
        .catch(error => console.error('Error checking login status:', error));
});