const express = require("express"); // express 패키지 불러옴
const morgan = require("morgan"); // HTTP 요청,응답에 대한 로깅을 담당하는 미들웨어
const cors = require("cors");
const jwt = require("jsonwebtoken");
const index = require("./app/routes/index"); // 테스트용 라우팅
const bcrypt = require("bcrypt");
const saltRounds = 10;
const secretKey = "secretKey";
const Spend = require("./app/models/spendSchema"); // Spend 모델 가져오기
const User = require("./app/models/userSchema"); // User 모델 가져오기
const mongoose = require("mongoose");
require("dotenv").config();

async function startServer() {
  const app = express(); // express 앱 생성

  app.use(express.static("public")); // public 디렉토리에 정적파일 제공하기 위한 미들웨어 설정
  app.use(express.urlencoded({ extended: true })); // url 인코딩된 데이터 파싱하기 위한 미들웨어 설정
  app.use(express.json()); // JSON 데이터 파싱하기 위한 미들웨어 설정
  app.use("/", index); // '/' 경로로 들어오는 요청은 index 라우터 사용
  app.use(morgan("dev")); // dev 포멧(개발용)의 로깅을 설정
  app.use(cors()); // cors 미들웨어를 추가하여 모든 도메인에서의 요청을 허용합니다.

  /* 몽고 db 연결 */
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("몽고db 연결 성공");
    })
    .catch((err) => {
      console.log("몽고db 연결 실패", err);
      process.exit();
    });

  const db = mongoose.connection;

  app.listen(process.env.PORT, () => {
    console.log("서버 정상");
  }); // 5000포트에서 서버 실행하고 서버 실행시 함수 실행(콘솔 출력)

  /************** SPEND CRUD **************/
  /* POST: 식비 카드 생성 */
  app.post("/spends", async (req, res) => {
    try {
      const newSpend = new Spend(req.body);
      await newSpend.save();
      res.json(newSpend);
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  /* GET: 모든 식비 카드 가져오기 */
  app.get("/spends", async (req, res) => {
    try {
      const allSpends = await Spend.find();
      res.json(allSpends);
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  /* PUT: 식비 카드 업데이트 */
  app.put("/spends/:id", async (req, res) => {
    try {
      const updatedItem = await Spend.findByIdAndUpdate(
        req.params.id,
        req.body
      );
      res.json(updatedItem);
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  /* DELETE: 식비 카드 삭제 */
  app.delete("/spends/:id", async (req, res) => {
    try {
      await Spend.findByIdAndDelete(req.params.id);
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  /************** USER CRUD **************/
  /* POST: 유저 생성 */
  app.post("/signup", async (req, res) => {
    const { userId, password, nickName } = req.body;
    try {
      const hasedPw = await bcrypt.hash(password, saltRounds);
      const newUser = new User({ userId, password: hasedPw, nickName });
      await newUser.save();
      res.json(newUser);
    } catch (error) {
      res.status(500).json({ message: "회원가입 실패" });
    }
  });

  /* LOGIN */
  app.post("/login", async (req, res) => {
    const { userId, password } = req.body;
    try {
      const existUser = await User.findOne({ userId, password });
      if (existUser) {
        const passwordMatch = await bcrypt.compare(
          password,
          existUser.password
        );
        if (passwordMatch) {
          const token = jwt.sign({ userId: existUser.id }, secretKey, {
            expiresIn: "1h",
          });
          res.json({ token });
        } else {
          res.json({ message: "비밀번호 불일치" });
        }
      } else {
        res.json({ message: "없는 유저" });
      }
    } catch (error) {
      res.json({ message: "서버 에러" });
    }
  });

  /* 로그인 정보 가져오기 */
  app.get("/protected", (req, res) => {
    const token = req.header("Authorization"); // 토큰 가져옴

    if (!token) {
      return res.status(401).json({ message: "접근 실패" });
    }

    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "미인증 토큰" });
      }
      try {
        const user = await User.findOne({ id: decoded.userId });
        if (user) {
          res.json({ user });
        } else {
          res.status(404).json({ message: "사용자 정보 없음" });
        }
      } catch (error) {
        res.status(500).json({ message: "서버 에러" });
      }
    });
  });
}

startServer(); // 함수 호출하여 서버 시작
