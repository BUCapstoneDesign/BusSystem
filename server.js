require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: process.env.DB_HOST,  // 데이터베이스 호스트
    user: process.env.DB_USER,  // 데이터베이스 사용자 이름
    password: process.env.DB_PASSWORD,  // 데이터베이스 비밀번호
    database: process.env.DB_NAME,  // 데이터베이스 이름
    port: process.env.DB_PORT // 데이터베이스 포트
});

db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
        process.exit(1); // 연결 실패 시 애플리케이션 종료
    }
    console.log('MySQL 연결 성공');
});

// Express 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret', // 고유의 문자열로 변경하세요
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // 프로덕션 환경에서는 true로 설정
        httpOnly: true
    }
}));

// 바디 파서 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

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

// 로그아웃 처리
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
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
    res.sendFile(path.join(__dirname, 'public', 'reservation.html'));
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