const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 8080;

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    } else {
        console.log('Connected to MySQL database.');
    }
});

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        secure: false,
        maxAge: 30 * 60 * 1000
    }
}));

let translations = {};
fs.readFile(path.join(__dirname, 'public', 'translations.json'), (err, data) => {
    if (err) throw err;
    translations = JSON.parse(data);
});

function translate(lang, text) {
    return translations[lang][text] || text;
}

// 요일 이름 변환 함수
function getKoreanDayName(date) {
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    return days[date.getDay()];
}

// 회원 가입 처리
app.post('/register', (req, res) => {
    const { student_number, password } = req.body;
    if (student_number && password) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.json({ success: false, message: '서버 오류' });
            db.query('INSERT INTO users (student_number, password) VALUES (?, ?)', [student_number, hash], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        res.json({ success: false, message: '이미 존재하는 학번입니다.' });
                    } else {
                        res.json({ success: false, message: '서버 오류' });
                    }
                } else {
                    res.json({ success: true, message: '회원 가입 성공' });
                }
            });
        });
    } else {
        res.json({ success: false, message: '모든 필드를 입력하세요' });
    }
});

// 로그인 처리
app.post('/login', (req, res) => {
    const { student_number, password } = req.body;
    if (student_number && password) {
        db.query('SELECT * FROM users WHERE student_number = ?', [student_number], (err, results) => {
            if (err) return res.json({ success: false, message: '서버 오류' });
            if (results.length > 0) {
                bcrypt.compare(password, results[0].password, (err, result) => {
                    if (err) return res.json({ success: false, message: '서버 오류' });
                    if (result) {
                        req.session.loggedin = true;
                        req.session.student_id = results[0].id; // 세션에 student_id 저장
                        req.session.student_number = student_number;
                        req.session.loginTime = new Date();
                        res.json({ success: true, student_number: student_number });
                    } else {
                        res.json({ success: false, message: '비밀번호가 일치하지 않습니다' });
                    }
                });
            } else {
                res.json({ success: false, message: '사용자를 찾을 수 없습니다' });
            }
        });
    } else {
        res.json({ success: false, message: '모든 필드를 입력하세요' });
    }
});

// 로그인 상태 확인 및 학번 반환
app.get('/check-login-status', (req, res) => {
    if (req.session.loggedin) {
        res.json({ loggedIn: true, student_number: req.session.student_number });
    } else {
        res.json({ loggedIn: false });
    }
});

// 기본 라우트 (Main.html 제공)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Main.html'));
});

// 예약 페이지 제공
app.get('/reservation', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'public', 'Reservation.html'));
    } else {
        res.redirect('/');
    }
});

// 사용자 정보 제공
app.get('/user-info', (req, res) => {
    if (req.session.loggedin) {
        const query = `
            SELECT r.reservation_id, r.seat_number, DATE_FORMAT(r.reservation_date, '%Y-%m-%d') as reservation_date, r.reservation_time, s.Buslocation
            FROM reservations r
            JOIN Bus s ON r.busid = s.Busid
            WHERE r.student_id = ?
        `;
        db.query(query, [req.session.student_id], (err, results) => {
            if (err) throw err;
            res.json({
                student_number: req.session.student_number,
                loginTime: req.session.loginTime,
                reservations: results
            });
        });
    } else {
        res.json({});
    }
});

// 좌석 예약 처리
app.post('/reserve-seat', (req, res) => {
    if (req.session.loggedin) {
        const { departure, date, time, seat_number } = req.body;
        const student_id = req.session.student_id;

        const busQuery = 'SELECT Busid FROM Bus WHERE Buslocation = ? AND Busday = ? AND Bustime = ?';

        const dateObj = new Date(date);
        const dayName = getKoreanDayName(dateObj);

        db.query(busQuery, [departure, dayName, time], (err, results) => {
            if (err) return res.json({ success: false, message: '버스 조회 실패' });

            if (results.length === 0) {
                return res.json({ success: false, message: '해당 조건에 맞는 버스를 찾을 수 없습니다' });
            }

            const busid = results[0].Busid;

            const checkDuplicateQuery = 'SELECT * FROM reservations WHERE busid = ? AND seat_number = ? AND reservation_date = ? AND reservation_time = ?';
            db.query(checkDuplicateQuery, [busid, seat_number, date, time], (err, duplicateResults) => {
                if (err) return res.json({ success: false, message: '중복 예약 확인 실패' });

                if (duplicateResults.length > 0) {
                    return res.json({ success: false, message: '이미 예약된 좌석입니다' });
                }

                db.query(
                    'INSERT INTO reservations (student_id, busid, seat_number, reservation_date, reservation_time) VALUES (?, ?, ?, ?, ?)',
                    [student_id, busid, seat_number, date, time],
                    (err, result) => {
                        if (err) return res.json({ success: false, message: '예약 실패' });
                        res.json({ success: true, message: '좌석 예약 성공' });
                    }
                );
            });
        });
    } else {
        res.json({ success: false, message: '로그인 필요' });
    }
});

// 예약된 좌석 조회
app.get('/reserved-seats', (req, res) => {
    const { reservation_date, reservation_time } = req.query;
    db.query('SELECT seat_number FROM reservations WHERE reservation_date = ? AND reservation_time = ?',
        [reservation_date, reservation_time], (err, results) => {
        if (err) throw err;
        res.json(results.map(row => row.seat_number));
    });
});

// 좌석 예약 취소 처리
app.post('/cancel-reservation', (req, res) => {
    if (req.session.loggedin) {
        const { reservation_id } = req.body;
        const student_id = req.session.student_id;
        db.query('DELETE FROM reservations WHERE reservation_id = ? AND student_id = ?', [reservation_id, student_id], (err, result) => {
            if (err) {
                console.error('예약 취소 실패:', err);
                return res.json({ success: false, message: '예약 취소 실패' });
            }
            if (result.affectedRows === 0) {
                return res.json({ success: false, message: '예약을 찾을 수 없거나 권한이 없습니다.' });
            }
            res.json({ success: true, message: '예약 취소 성공' });
        });
    } else {
        res.json({ success: false, message: '로그인 필요' });
    }
});

// 버스 스케줄 조회
app.get('/bus-schedule', (req, res) => {
    const { departure, day } = req.query;
    const query = 'SELECT Bustime FROM Bus WHERE Buslocation = ? AND Busday = ?';
    db.query(query, [departure, day], (err, results) => {
        if (err) {
            console.error('버스 스케줄 조회 실패:', err);
            return res.status(500).json({ success: false, message: '서버 오류' });
        }
        const times = results.map(row => row.Bustime);
        res.json({ success: true, times });
    });
});

// 오늘의 버스 스케줄 조회
app.get('/api/bus-schedule', (req, res) => {
    const today = new Date();
    const dayName = getKoreanDayName(today);
    const query = 'SELECT Buslocation, Bustime FROM Bus WHERE Busday = ?';
    db.query(query, [dayName], (err, results) => {
        if (err) {
            console.error('버스 스케줄 조회 실패:', err);
            return res.status(500).json({ success: false, message: '서버 오류' });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: '운행중인 버스가 없습니다.' });
        }
        res.json({ success: true, data: results });
    });
});

// 로그아웃 처리
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.json({ success: false, message: '로그아웃 실패' });
        }
        res.json({ success: true, message: '로그아웃 성공' });
    });
});

app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다`);
});
