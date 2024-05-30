const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2'); // mysql2 사용
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
        process.exit(1); // 연결 실패 시 프로세스를 종료합니다.
    } else {
        console.log('Connected to MySQL database.');
    }
});

// MySQL 세션 저장소 설정
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

// 세션 설정
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // MySQL 세션 저장소 사용
    cookie: { 
        secure: false, // HTTPS를 사용한다면 true로 설정
        maxAge: 30 * 60 * 1000 // 30분 후 세션 만료
    }
}));

// Load translations
let translations = {};
fs.readFile(path.join(__dirname, 'public', 'translations.json'), (err, data) => {
    if (err) throw err;
    translations = JSON.parse(data);
});

function translate(lang, text) {
    return translations[lang][text] || text;
}

// 회원 가입 처리
app.post('/register', (req, res) => {
    const { student_number, password } = req.body;
    console.log('회원가입 요청 데이터:', req.body); // 디버깅 메시지 추가
    if (student_number && password) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('비밀번호 해시화 실패:', err); // 디버깅 메시지 추가
                return res.json({ success: false, message: '서버 오류' });
            }
            db.query('INSERT INTO users (student_number, password) VALUES (?, ?)', [student_number, hash], (err, result) => {
                if (err) {
                    console.error('회원가입 쿼리 실패:', err); // 디버깅 메시지 추가
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
            if (err) {
                console.error('사용자 조회 쿼리 실패:', err);
                return res.json({ success: false, message: '서버 오류' });
            }
            if (results.length > 0) {
                bcrypt.compare(password, results[0].password, (err, result) => {
                    if (err) {
                        console.error('비밀번호 비교 실패:', err);
                        return res.json({ success: false, message: '서버 오류' });
                    }
                    if (result) {
                        req.session.loggedin = true;
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
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// 예약 페이지 제공
app.get('/reservation', (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'public', 'reservation.html'));
    } else {
        res.redirect('/');
    }
});

// 사용자 정보 제공
app.get('/user-info', (req, res) => {
    if (req.session.loggedin) {
        const query = 'SELECT seat_number, reservation_date, reservation_time FROM reservations WHERE student_number = ?';
        db.query(query, [req.session.student_number], (err, results) => {
            if (err) throw err;
            res.json({
                student_number: req.session.student_number,
                loginTime: req.session.loginTime,
                reservations: results
            });
        });
    } else {
        res.json({ error: '로그인 필요' });
    }
});

// 좌석 예약 처리
app.post('/reserve-seat', (req, res) => {
    if (req.session.loggedin) {
        const { seat_number, reservation_date, reservation_time } = req.body;
        const student_number = req.session.student_number;
        db.query('INSERT INTO reservations (student_number, seat_number, reservation_date, reservation_time) VALUES (?, ?, ?, ?)', 
            [student_number, seat_number, reservation_date, reservation_time], (err, result) => {
            if (err) throw err;
            res.json({ success: true, message: '좌석 예약 성공' });
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

app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다`);
});