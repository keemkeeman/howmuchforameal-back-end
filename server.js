const express = require("express"); // express 패키지 불러옴
const morgan = require("morgan"); // HTTP 요청,응답에 대한 로깅을 담당하는 미들웨어
const cors = require("cors");
const bodyParser = require("body-parser");
const index = require("./app/routes/index"); // 테스트용 라우팅
const bcrypt = require("bcrypt");
const saltRounds = 10;
const secretKey = "secretKey";
const session = require("express-session");
const Spend = require("./app/models/spendSchema"); // Spend 모델 가져오기
const User = require("./app/models/userSchema"); // User 모델 가져오기
const mongoose = require("mongoose");
require("dotenv").config();

async function startServer() {
  const app = express(); // express 앱 생성

  app.use(bodyParser.json());
  app.use(express.static("public")); // public 디렉토리에 정적파일 제공하기 위한 미들웨어 설정
  app.use(express.urlencoded({ extended: true })); // url 인코딩된 데이터 파싱하기 위한 미들웨어 설정
  app.use(express.json()); // JSON 데이터 파싱하기 위한 미들웨어 설정
  app.use(morgan("dev")); // dev 포멧(개발용)의 로깅을 설정
  app.use(cors()); // cors 미들웨어를 추가하여 모든 도메인에서의 요청을 허용합니다.
  app.use(express.json());
  app.use(
    session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: true,
    })
  );

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

  app.listen(process.env.PORT, () => {
    console.log("서버 정상");
  }); // 5000포트에서 서버 실행시 콘솔 출력

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
  /* LOGIN */
  app.post("/api/users/login", async (req, res) => {
    try {
      const { userId, password } = req.body;
      const user = await User.findOne({ userId });

      if (!user) {
        return res.json({ message: "가입하지 않은 유저입니다." });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.json({ message: "아이디, 비밀번호를 확인하세요." });
      }

      req.session.user = {
        userId: user.userId,
        nickName: user.nickName,
      };
      res.cookie("sessionId", req.sessionID, { httpOnly: true, secure: false });
      res.json({ userId: user.userId, nickName: user.nickName });
    } catch (error) {
      res.json({ message: "서버 에러" });
    }
  });

  /* LOGOUT */
  app.post("/api/users/logout", (req, res) => {
    req.session.destroy();
    res.json({ message: "로그아웃 성공" });
  });

  /* 유저 불러오기 */
  app.get("/api/users/auth", async (req, res) => {
    if (req.session) {
      res.json({});
    }
  });

  /* POST: 유저 생성 */
  app.post("/api/users/signup", async (req, res) => {
    const { userId, password, nickName } = req.body;
    try {
      const hashedPw = await bcrypt.hash(password, saltRounds);
      const newUser = new User({ userId, password: hashedPw, nickName });
      await newUser.save();
      res.json(newUser);
    } catch (error) {
      res.json({ message: "회원가입 실패" });
    }
  });
}
startServer(); // 함수 호출하여 서버 시작
