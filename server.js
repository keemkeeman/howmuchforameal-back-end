const express = require("express"); // express 패키지 불러옴
const morgan = require("morgan"); // HTTP 요청,응답에 대한 로깅을 담당하는 미들웨어
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const SpendItem = require("./app/models/spendItemSchema"); // Spend 모델 가져오기
const User = require("./app/models/userSchema"); // User 모델 가져오기
const MealCount = require("./app/models/mealCountSchema");
const mongoose = require("mongoose");

require("dotenv").config();

async function startServer() {
  const app = express(); // express 앱 생성
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(express.static("public")); // public 디렉토리에 정적파일 제공하기 위한 미들웨어 설정
  app.use(express.urlencoded({ extended: true })); // url 인코딩된 데이터 파싱하기 위한 미들웨어 설정
  app.use(express.json()); // JSON 데이터 파싱하기 위한 미들웨어 설정
  app.use(morgan("dev")); // dev 포멧(개발용)의 로깅을 설정
  app.use(cors({ origin: "http://localhost:3000", credentials: true })); // cors 미들웨어를 추가하여 모든 도메인에서의 요청을 허용합니다.

  /* 몽고 db 연결 */
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // DB 접근
  const db = mongoose.connection;

  db.on("error", (error) => {
    console.error("몽고DB 연결 에러", error);
  });

  db.once("open", () => {
    console.log("몽고DB 연결 성공");
  });

  app.listen(process.env.PORT, () => {
    console.log("서버 정상");
  }); // 5000포트에서 서버 실행시 콘솔 출력

  /****************************************/
  /************** SPEND CRUD **************/
  /****************************************/
  /* POST: 소비 아이템 추가 */
  app.post(`/spends/item`, async (req, res) => {
    const newSpend = new SpendItem(req.body);
    await newSpend.save();
    res.send(newSpend);

    // try {
    //   const sameDate = await Spend.findOne(
    //     $and([{ date: req.body.date }, { creatorId: req.body.creatorId }])
    //   );
    //   if (!sameDate) {
    //     const newSpend = new Spend(req.body);
    //     await newSpend.save();
    //     res.json({ newSpend });
    //   } else {
    //     res.json({ message: "똑같은게 있으니까 업데이트 혹시 자동으로되나?" });
    //   }
    // } catch (error) {
    //   res.json({ error: error.message });
    // }
  });

  /* POST: 끼니 추가 */
  app.post(`/spends/mealcount`, async (req, res) => {
    const mealCount = new MealCount(req.body);
    await mealCount.save();
    res.send(mealCount);
    // try {
    //   const sameDate = await MealCount.findOne(
    //     $and([{ date: req.body.date }, { creatorId: req.body.creatorId }])
    //   );

    //   if (!sameDate) {
    //     const mealCount = new MealCount(req.body);
    //     await mealCount.save();
    //   } else {
    //     await MealCount.findByIdAndUpdate(sameDate._id, req.body);
    //   }
    // } catch (error) {
    //   res.json({ error: error.message });
    // }
  });

  /* GET: 모든 식비 카드 가져오기 */
  app.post("/spends", async (req, res) => {
    try {
      const userId = req.body.userId;
      const allSpends = await SpendItem.find({ userId });
      res.json(allSpends);
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  /* PUT: 식비 카드 업데이트 */
  app.put("/api/spends/:id", async (req, res) => {
    try {
      const updatedItem = await SpendItem.findByIdAndUpdate(
        req.params.id,
        req.body
      );
      res.json(updatedItem);
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  /* DELETE: 식비 카드 삭제 */
  app.delete("/api/spends/:id", async (req, res) => {
    try {
      await SpendItem.findByIdAndDelete(req.params.id);
      res.json({ message: "삭제 성공" });
    } catch (error) {
      res.json({ message: "삭제 실패" });
    }
  });

  /***************************************/
  /************** USER CRUD **************/
  /***************************************/
  /* 로그인 */
  app.post("/api/users/login", async (req, res) => {
    const { userId, password } = req.body;

    /* 아이디 확인 */
    const user = await User.findOne({ userId });

    if (!user) {
      res.json({ message: "ID가 존재하지 않습니다." });
      return;
    }

    /* 비밀번호 확인 */
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.json({ message: "아이디, 비밀번호를 확인해주세요." });
      return;
    }

    /* 쿠키 발급 */
    res.cookie("id", user._id, { httpOnly: true });
    res.json({ nickName: user.nickName });
  });

  /* 유저 불러오기 */
  app.get("/api/users/auth", async (req, res) => {
    const user_id = req.cookies.id;

    if (user_id) {
      const user = await User.findById(user_id);
      if (user) {
        delete user.password;
        res.json({ user });
      } else {
        res.json({ message: "인증 실패" });
      }
    } else {
      res.json({ message: "인증 실패" });
    }
  });

  /* 로그아웃 */
  app.post("/api/users/logout", (req, res) => {
    res.clearCookie("id");
    res.json({ message: "로그아웃 성공" });
  });

  /* 회원가입 */
  app.post("/api/users/signup", async (req, res) => {
    try {
      const { userId, password, nickName } = req.body;

      const existUser = await User.findOne({ userId: userId });
      if (existUser) {
        res.json({ message: "이미 존재하는 아이디입니다." });
        return;
      }

      const existNickName = await User.findOne({ nickName: nickName });
      if (existNickName) {
        res.json({ message: "이미 존재하는 닉네임입니다." });
        return;
      }

      const hashedPw = await bcrypt.hash(password, 10);

      const newUser = new User({ userId, password: hashedPw, nickName });
      await newUser.save();
      res.json({ nickName: nickName });
    } catch (error) {
      console.error("회원가입 에러", error);
    }
  });
}

startServer();
