document.addEventListener('DOMContentLoaded', () => {
    const departureSelect = document.getElementById('departure');
    const departureDateInput = document.getElementById('departure-date');
    const departureTimeInput = document.getElementById('departure-time');
    const submitButton = document.getElementById('submit');

    const fixedTimes = {
        '영등포': '06:50',
        '교대': { 'weekdays': ['07:30', '08:30'], 'friday': '07:30' },
        '잠실': '07:00',
        '분당': { 'weekdays': ['07:30', '08:30'], 'friday': '07:30' },
        '인천': '06:20',
        '송내': '06:40',
        '안산': ['07:00', '07:10'],
        '안양': ['07:00', '07:10'],
        '수원': {
            'weekdays': [
                { 'time': '07:30', 'locations': ['Court Intersection', 'Yeongtong Entrance', 'Suwon T/G Entrance', 'Dongtan E-Mart'] },
                { 'time': '08:30', 'locations': ['Court Intersection', 'Yeongtong Entrance', 'Suwon T/G Entrance', 'Dongtan E-Mart'] }
            ],
            'friday': [
                { 'time': '07:30', 'locations': ['Court Intersection', 'Yeongtong Entrance', 'Suwon T/G Entrance', 'Dongtan E-Mart'] }
            ]
        },
        '용인': [
            '07:10 Across from Yongin Cullinan Hotel',
            '07:15 In front of Samsung Digital Plaza',
            '07:30 In front of Gangnam University Samgeori Good Morning Surgery Building',
            '07:35 Singal intercity bus stop'
        ],
        '수원병점': ['07:00 Suwon Station', '07:15 Byeongjeom'],
        '오산': '07:30 Osan',
        '평택': '08:10 Pyeongtaek',
        '죽전': {
            'weekdays': ['07:30~07:50', '08:50~09:00'],
            'friday': ['07:30~07:50']
        },
        '아산': [
            '07:40 Asan Intercity Bus Terminal (Mojong Transfer Point)',
            '07:45 In front of Asan LG Electronics',
            '07:55 In front of Baebang Station Intersection',
            '08:00 In front of Handeul Mulbit Middle School'
        ]
    };

    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 14);

    const formatDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    departureDateInput.setAttribute('min', formatDateString(today));
    departureDateInput.setAttribute('max', formatDateString(maxDate));

    departureDateInput.addEventListener('change', (event) => {
        const selectedDate = new Date(event.target.value);
        const dayOfWeek = selectedDate.getUTCDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            alert('주말은 선택할 수 없습니다.');
            departureDateInput.value = '';
        } else {
            setFixedTime(departureSelect.value, dayOfWeek);
        }
    });

    departureSelect.addEventListener('change', () => {
        const selectedDate = new Date(departureDateInput.value);
        const dayOfWeek = selectedDate.getUTCDay();
        setFixedTime(departureSelect.value, dayOfWeek);
    });

    const setFixedTime = (departure, dayOfWeek) => {
        if (fixedTimes[departure]) {
            const fixedTime = fixedTimes[departure];
            if (typeof fixedTime === 'string') {
                departureTimeInput.value = fixedTime;
            } else if (Array.isArray(fixedTime)) {
                departureTimeInput.value = fixedTime[0]; // 기본 첫 번째 시간으로 설정
            } else {
                if (dayOfWeek === 5) { // 금요일
                    departureTimeInput.value = fixedTime.friday[0].time;
                } else {
                    departureTimeInput.value = fixedTime.weekdays[0].time;
                }
            }
            departureTimeInput.setAttribute('readonly', true);
        } else {
            departureTimeInput.value = '12:00';
            departureTimeInput.removeAttribute('readonly');
        }
    };

    submitButton.addEventListener('click', () => {
        const modal = document.getElementById('seat-selection-modal');
        modal.style.display = 'block';
    });

    document.querySelector('.close').addEventListener('click', () => {
        const modal = document.getElementById('seat-selection-modal');
        modal.style.display = 'none';
    });

    window.onclick = (event) => {
        const modal = document.getElementById('seat-selection-modal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
});
