const express = require("express"); // express 모듈 불러오기
const mongoose = require("mongoose"); // mongoose 모듈 불러오기
const bodyParser = require("body-parser"); // body-parser 모듈 불러오기
const cors = require("cors");
const dotenv = require("dotenv"); // dotenv 모듈 불러오기

dotenv.config(); // .env 파일에서 환경 변수 로드

const app = express(); // express app 생성
app.use(cors()); // CORS 설정
const port = process.env.PORT || 3000; // 포트 설정

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
  match_members: [userSchema],
  //creatorId: String,
});

const User = mongoose.model("User", userSchema); // 스키마를 모델로 변환
const Match = mongoose.model("Match", matchSchema);

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
    //creatorId,
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
    //creatorId, // 요청에서 작성자 정보 추출
  } = req.body;

  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).send("Match not found");
    }

    // // 작성자 검증
    // if (match.creatorId !== creatorId) {
    //   return res
    //     .status(403)
    //     .send("Unauthorized: Only the creator can update the match");
    // }

    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.id,
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
  const { creatorId } = req.body; // 요청에서 작성자 정보 추출

  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).send("Match not found");
    }

    // // 작성자 검증
    // if (match.creatorId !== creatorId) {
    //   return res
    //     .status(403)
    //     .send("Unauthorized: Only the creator can delete the match");
    // }

    const deletedMatch = await Match.findByIdAndDelete(req.params.id);

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
/*
// 매치데이터 부분 업데이트 (PATCH)
app.patch('/api/match/:id', async (req, res) => {
    try {
        const updatedMatch = await Match.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!updatedMatch) {
            return res.status(404).send('Match not found');
        }

        res.status(200).send(updatedMatch);
    } catch (err) {
        console.error('Error updating match:', err);
        res.status(500).send('Failed to update match');
    }
});
*/

// 첫 로그인 사용자 정보 저장 엔드포인트
app.post("/api/user-info", async (req, res) => {
  const { user_id, level, team } = req.body;
  console.log(req.body);

  // const user = new User({
  //   user_id,
  //   level,
  //   team,
  // });

  try {
    let user = await User.findOne({ user_id: user_id });

    if (user) {
      // 기존 사용자 정보 업데이트
      user.level = level;
      user.team = team;
    } else {
      // 새로운 사용자 생성
      user = new User({
        user_id,
        level,
        team,
      });
    }

    await user.save();
    console.log(user);
    res.status(200).send("User info saved");
  } catch (err) {
    console.error(error);
    res.status(500).send("Failed to save user info");
  }
});

app.listen(port, () => {
  console.log("Server is running on port ${port}");
});
