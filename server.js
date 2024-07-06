const express = require('express'); // express 모듈 불러오기
const mongoose = require('mongoose'); // mongoose 모듈 불러오기
const bodyParser = require('body-parser'); // body-parser 모듈 불러오기
const cors = require('cors');
const dotenv = require('dotenv'); // dotenv 모듈 불러오기

dotenv.config(); // .env 파일에서 환경 변수 로드

const app = express(); // express app 생성
app.use(cors());// CORS 설정
const port = process.env.PORT || 3000; // 포트 설정

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true, // 사용자가 입력한 쿼리를 몽구스가 이해할 수 있도록 하는 옵션
    useUnifiedTopology: true, // 몽구스가 MongoDB 드라이버의 새로운 서버 디스커버리 및 모니터링 엔진을 사용하도록 하는 옵션
}).then(() => {
    console.log('Connected to MongoDB'); // 연결 성공 시 콘솔에 표시
}).catch((err) => {
    console.error('Connection error:', err); // 연결 실패 시 콘솔에 에러 표시
});

// 사용자 정보를 저장할 스키마 정의
const userSchema = new mongoose.Schema({
    //user_id: String,
    image_url: String,
    profile_nickname: String,
    memo: String,
    level: Number,

    //email: String,
});

const matchSchema = new mongoose.Schema({
    match_id: String,
    match_title: String,
    match_level: Number,
    match_image_url: String,
    match_place: String,
    match_member: [userSchema],
});

const User = mongoose.model('User', userSchema); // 스키마를 모델로 변환
const Match = mongoose.model('Match', matchSchema);

app.use(express.json()); // JSON 데이터 파싱
app.use(bodyParser.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

app.post('/api/login', async (req, res) => {
    const { access_token, profile_nickname } = req.body; // 요청 바디에서 필요한 정보 추출
    console.log(req.body);
    // 토큰 검증 및 사용자 정보 저장 로직 구현

    console.log(`Image_url: ${image_url}`, `Nickname: ${profile_nickname}`); // 사용자 정보 콘솔에 출력

    const user = new User({ image_url, profile_nickname }); // 사용자 정보를 저장할 인스턴스 생성

    try {
        await user.save(); // 생성한 인스턴스(Document)를 DB에 저장
        console.log(user);
        res.status(200).send('User info received'); // 사용자 정보 수신 성공 메시지 응답
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to save user info'); // 사용자 정보 저장 실패 시 응답
    }
});

app.post('/api/match', async (req, res) => {
    const { match_id, match_title, match_level, match_image_url, match_place, match_member } = req.body;
    console.log(req.body);

    const match = new Match({ match_id, match_title, match_level, match_image_url, match_place, match_member });

    try {
        await match.save();
        console.log(match);
        res.status(200).send('Match info received');
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to save match info');
    }
});




app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
