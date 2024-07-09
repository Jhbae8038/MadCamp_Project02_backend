const express = require("express"); // express 모듈 불러오기
const mongoose = require("mongoose"); // mongoose 모듈 불러오기
const bodyParser = require("body-parser"); // body-parser 모듈 불러오기
const cors = require("cors");
const dotenv = require("dotenv"); // dotenv 모듈 불러오기

dotenv.config(); // .env 파일에서 환경 변수 로드

const app = express(); // express app 생성
app.use(cors()); // CORS 설정
const port = process.env.PORT || 3000; // 포트 설정

// // MongoDB 연결
// mongoose
//   .connect(process.env.MONGODB_URI, {
//     useNewUrlParser: true, // 사용자가 입력한 쿼리를 몽구스가 이해할 수 있도록 하는 옵션
//     useUnifiedTopology: true, // 몽구스가 MongoDB 드라이버의 새로운 서버 디스커버리 및 모니터링 엔진을 사용하도록 하는 옵션
//   })
//   .then(() => {
//     console.log("Connected to MongoDB"); // 연결 성공 시 콘솔에 표시
//   })
//   .catch((err) => {
//     console.error("Connection error:", err); // 연결 실패 시 콘솔에 에러 표시
//   });

// 사용자 정보를 저장할 스키마 정의
const userSchema = new mongoose.Schema({
    user_id: String,
    image_url: String,
    profile_nickname: String,
    memo: String,
    level: Number,
    team: String,
    isFirstLogin: { type: Boolean, default: true },

    //email: String,
});

const matchSchema = new mongoose.Schema({
    matchId: Number,
    date: String,
    time: String,
    place: String,
    matchTitle: String,
    content: String,
    max_member: Number,
    image: String,
    level: Number,
    cur_member: Number,
    match_members: [String],
});

const User = mongoose.model("User", userSchema); // 스키마를 모델로 변환
const Match = mongoose.model("Match", matchSchema);
const addReservation = async (matchId, userId) => {
    try {
        const match = await Match.findOne({ matchId: matchId });
        if (!match) {
            throw new Error("Match not found");
        }

        const user = await User.findOne({ user_id: userId });
        if (!user) {
            throw new Error("User not found");
        }

        // 중복 예약 방지
        if (match.match_members.includes(userId)) {
            throw new Error("User already reserved this match");
        }

        match.match_members.push(userId);
        match.cur_member = match.match_members.length;
        await match.save();
        match.match_members.push(userId);
        match.cur_member = match.match_members.length;
        await match.save();

        console.log("Reservation added successfully");
    } catch (error) {
        console.error("Error adding reservation:", error);
    }
};

const cancelReservation = async (matchId, userId) => {
    try {
        const match = await Match.findOne({ matchId: matchId });
        if (!match) {
            throw new Error("Match not found");
        }

        // 사용자 예약 정보 삭제
        match.match_members = match.match_members.filter(
            (memberId) => memberId !== userId
        );
        match.cur_member = match.match_members.length;
        await match.save();

        console.log("Reservation cancelled successfully");
    } catch (error) {
        console.error("Error cancelling reservation:", error);
    }
};

const getUserReservations = async (userId) => {
    try {
        const matches = await Match.find({ match_members: userId });

        return matches;
    } catch (error) {
        console.error("Error fetching reservations:", error);
        throw error;
    }
};

// MongoDB 연결
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true, // 사용자가 입력한 쿼리를 몽구스가 이해할 수 있도록 하는 옵션
        useUnifiedTopology: true, // 몽구스가 MongoDB 드라이버의 새로운 서버 디스커버리 및 모니터링 엔진을 사용하도록 하는 옵션
    })
    .then(() => {
        console.log("Connected to MongoDB"); // 연결 성공 시 콘솔에 표시
    })
    .catch((err) => {
        console.error("Connection error:", err); // 연결 실패 시 콘솔에 에러 표시
    });

app.use(express.json()); // JSON 데이터 파싱
app.use(bodyParser.urlencoded({ extended: true })); // URL 인코딩된 데이터 파싱

app.post("/api/login", async (req, res) => {
    const { access_token, profile_nickname, user_id, image_url } = req.body; // 요청 바디에서 필요한 정보 추출
    console.log(req.body);
    // 토큰 검증 및 사용자 정보 저장 로직 구현
    console.log("Nickname: ${profile_nickname}"); // 사용자 정보 콘솔에 출력
    //const user = new User({ profile_nickname }); // 사용자 정보를 저장할 인스턴스 생성
    let user = await User.findOne({ user_id: user_id });
    let isFirstLogin = false;

    if (user) {
        // 기존 사용자 정보 업데이트
        user.isFirstLogin = false;
        user.profile_nickname = profile_nickname;
        user.image_url = image_url;
        user.access_token = access_token; // 토큰 저장을 원하면 추가
    } else {
        // 새로운 사용자 생성
        user = new User({
            user_id,
            profile_nickname,
            image_url,
            access_token,
            isFirstLogin: true,
        });
        isFirstLogin = true;
    }
    try {
        await user.save(); // 생성한 인스턴스(Document)를 DB에 저장
        console.log(user);
        res.status(200).json({ isFirstLogin }); // 사용자 정보 수신 성공 메시지 응답
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to save user info"); // 사용자 정보 저장 실패 시 응답
    }
});

app.post("/api/login", async (req, res) => {
    const { access_token, user_id, image_url, profile_nickname, team, level } =
        req.body;

    console.log(req.body);
    try {
        let user = await User.findOne({ user_id });
        if (!user) {
            user = new User({
                user_id: user_id,
                image_url: image_url,
                profile_nickname: profile_nickname,
            });
            await user.save();
            return res.status(200).json({ message: "User info saved" });
        }
        res.status(200).json({ message: "User already exists" });
    } catch (err) {
        console.error("Error saving user info:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// API to check if the user is logging in for the first time
app.get("/api/is-first-login/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findOne({ user_id: userId });
        if (user) {
            return res.status(200).json({ isFirstLogin: false });
        }
        res.status(200).json({ isFirstLogin: true });
    } catch (err) {
        console.error("Error checking first login:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 첫 로그인 사용자 정보 저장 엔드포인트
app.post("/api/user-info", async (req, res) => {
    const { user_id, level, team, memo } = req.body;
    console.log("first login user info:", req.body);
    //const token = req.headers.authorization.split(' ')[1];
    // Simulate finding user by token (in practice, decode the token to find user)
    //const user_id = token; // For demonstration, assume token is user_id
    try {
        const user = await User.findOne({ user_id });
        if (user) {
            user.level = level;
            user.memo = memo;
            user.team = team;
            await user.save();
            return res.status(200).json({ message: "User info saved successfully" });
        }
        res.status(404).json({ message: "User not found" });
    } catch (err) {
        console.error("Error saving user info:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/api/match", async (req, res) => {
    const {
        matchId,
        date,
        time,
        place,
        matchTitle,
        content,
        max_member,
        image,
        level,
        cur_member,
        user_id,
    } = req.body;
    console.log(req.body);
    //const members = match_members.map(member => new User(member)); // 사용자 정보를 저장할 인스턴스 생성

    const match = new Match({
        matchId,
        date,
        time,
        place,
        matchTitle,
        content,
        max_member,
        image,
        level,
        cur_member,
        user_id,
        //creatorId,
        //match_members: members,
    });

    try {
        const savedMatch = await match.save();
        console.log("Match saved successfully:", savedMatch); // 생성한 인스턴스(Document)를 DB에 저장
        res.status(200).send(savedMatch); // 생성한 인스턴스(Document)를 DB에 저장
    } catch (err) {
        console.error("Error saving match:", err);
        res.status(500).send("Failed to save match");
    }
});

// 특정 매치정보 조회 (GET)
app.get("/api/match/:id", async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) {
            return res.status(404).send("Match not found");
        }
        res.status(200).send(match);
    } catch (err) {
        console.error("Error fetching match:", err);
        res.status(500).send("Failed to fetch match");
    }
});

// 매치 데이터 업데이트 (PUT)
app.put("/api/match/:id", async (req, res) => {
    const {
        matchId,
        date,
        time,
        place,
        matchTitle,
        content,
        max_member,
        image,
        level,
        cur_member,
        user_id,
        //creatorId, // 요청에서 작성자 정보 추출
    } = req.body;

    try {
        const match = await Match.findOne({ matchId: matchId });

        if (!match) {
            return res.status(404).send("Match not found");
        }

        // // 작성자 검증
        // if (match.creatorId !== creatorId) {
        //   return res
        //     .status(403)
        //     .send("Unauthorized: Only the creator can update the match");
        // }

        const updatedMatch = await Match.findOneAndUpdate(
            { matchId: matchId },
            {
                matchId,
                date,
                time,
                place,
                matchTitle,
                content,
                max_member,
                image,
                level,
                cur_member,
                user_id,
            },
            { new: true }
        );

        res.status(200).send(updatedMatch);
    } catch (err) {
        console.error("Error updating match:", err);
        res.status(500).send("Failed to update match");
    }
});

// 매치 데이터 삭제 (DELETE)
app.delete("/api/match/:id", async (req, res) => {
    const { matchId } = req.params.id; // 요청에서 작성자 정보 추출

    console.log(matchId);

    try {
        const match = await Match.findOne({ matchId: req.params.id });

        console.log(match);

        if (!match) {
            return res.status(404).send("Match not found");
        }

        const deletedMatch = await Match.findOneAndDelete({
            matchId: req.params.id,
        });

        res.status(200).send("Match deleted");
    } catch (err) {
        console.error("Error deleting match:", err);
        res.status(500).send("Failed to delete match");
    }
});

// 모든 매치정보 조회 (GET)
app.get("/api/match", async (req, res) => {
    try {
        const matches = await Match.find();
        res.status(200).send(matches);
    } catch (err) {
        console.error("Error fetching matches:", err);
        res.status(500).send("Failed to fetch matches");
    }
});

// 모든 사용자정보 조회 (GET)
app.get("/api/user", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).send("Failed to fetch users");
    }
});
// 특정 사용자정보 조회 (GET)
app.get('/api/user/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findOne({ user_id: id }); // 여기서 user_id를 필드 이름으로 사용
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// 사용자정보 업데이트 (PUT)

app.put("/api/user/:user_id", async (req, res) => {
    const { profile_nickname, memo, level, team } = req.body;
    const { user_id } = req.params;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { user_id: user_id }, // _id 대신 user_id로 검색
            { $set: { profile_nickname, memo, level, team } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).send("Failed to update user");
    }
});

// 사용자정보 삭제 (DELETE)
app.delete("/api/user/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).send("User not found");
        }

        res.status(200).send("User deleted");
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).send("Failed to delete user");
    }
});

// 특정 사용자 예약 내역 조회
app.get("/api/user/:userId/reservations", async (req, res) => {
    const { userId } = req.params;
    //console.log(`Fetching reservations for user: ${userId}`); // 디버그 로그 추가
    try {
        const reservations = await getUserReservations(userId);
        res.status(200).send(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).send(error.message);
    }
});

// 예약 추가
app.post("/api/match/:matchId/reserve", async (req, res) => {
    const { matchId } = req.params;
    const { userId } = req.body;

    try {
        await addReservation(matchId, userId);
        res.status(200).send("Reservation added successfully");
    } catch (error) {
        console.error("Error adding reservation:", error);
        res.status(500).send(error.message);
    }
});

// 예약 취소
app.post("/api/match/:matchId/cancel", async (req, res) => {
    const { matchId } = req.params;
    const { userId } = req.body;

    try {
        await cancelReservation(matchId, userId);
        res.status(200).send("Reservation cancelled successfully");
    } catch (error) {
        console.error("Error cancelling reservation:", error);
        res.status(500).send(error.message);
    }
});

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 정적 파일 제공 설정
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
        );
    },
});

const upload = multer({ storage: storage });

app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded");
    }
    const image = `/uploads/${req.file.filename}`;
    res.status(200).json({ image });
});

app.listen(port, () => {
    console.log("Server is running on port ${port}");
});
