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
const favicon = require("express-favicon");

require("dotenv").config();

async function startServer() {
  const app = express(); // express 앱 생성
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(express.static("public")); // public 디렉토리에 정적파일 제공하기 위한 미들웨어 설정
  app.use(express.urlencoded({ extended: true })); // url 인코딩된 데이터 파싱하기 위한 미들웨어 설정
  app.use(express.json()); // JSON 데이터 파싱하기 위한 미들웨어 설정
  app.use(morgan("dev")); // dev 포멧(개발용)의 로깅을 설정
  app.use(favicon(__dirname + "/public/favicon.ico"));
  const port = process.env.PORT;

  app.listen(port || 5000);

  app.get("/", (req, res, next) => {
    res.send("한끼얼마 서버");
  });

  const corsOptions = {
    origin: process.env.CLIENT,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  };

  const allowCors = (req, res, next) => {
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Origin", process.env.CLIENT);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }
    next();
  };

  app.use(cors(corsOptions)); // cors 미들웨어에 corsOptions를 적용
  app.use(allowCors); // allowCors 미들웨어를 사용

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

  /****************************************/
  /************** SPEND CRUD **************/
  /****************************************/
  /* POST: 식비 추가 */
  app.post(`/spends/item`, async (req, res) => {
    try {
      const newSpend = new SpendItem(req.body);
      await newSpend.save();
      res.send({ message: "등록성공" });
    } catch (error) {
      console.error("식비 추가 에러");
      res.send({ message: "등록실패" });
    }
  });

  /* POST: 카드(끼니) 추가 */
  app.post(`/spends/mealcount`, async (req, res) => {
    try {
      const existMealCount = await MealCount.findOne({ date: req.body.date });
      if (!existMealCount) {
        const mealCount = new MealCount(req.body);
        await mealCount.save();
        res.send({ message: "등록성공" });
      } else {
        res.send({ message: "중복" });
      }
    } catch (error) {
      console.error("끼니 추가 에러", error);
      res.send({ message: "등록실패" });
    }
  });

  /* 최근 전체 카드 가져오기 */
  app.post("/spends", async (req, res) => {
    try {
      const userId = req.body.userId;
      const mergedItem = await MealCount.aggregate([
        {
          $match: { creatorId: userId },
        },
        {
          $lookup: {
            from: "spends", // SpendItem 컬렉션 이름
            localField: "date",
            foreignField: "date",
            as: "items",
          },
        },
        {
          $project: {
            creatorId: 1,
            date: 1,
            mealCount: 1,
            memo: 1,
            items: {
              $ifNull: ["$items", []], // items 배열이 없을 경우 빈 배열로 초기화
            },
          },
        },
      ]);

      res.send(mergedItem);
    } catch (error) {
      res.json({ error: error.message });
    }
  });

  /* 임시 보관 소비 카드 가져오기 */
  app.post("/spends/item/get", async (req, res) => {
    try {
      const userId = req.body.userId;
      const response = await SpendItem.find({
        creatorId: userId,
      });
      if (response.length > 0) {
        res.send(response);
      } else {
        return;
      }
    } catch (error) {
      console.error("임시 카드 가져오기 오류", error);
    }
  });

  /* PUT: 카드수정 */
  app.put("/spends/mealCount/:id", async (req, res) => {
    try {
      const response = await MealCount.findByIdAndUpdate(
        req.params.id,
        req.body
      );
      if (!response) {
        return res.status(404).send({ message: "카드를 찾을 수 없습니다." });
      } else {
        return res.status(200).send({ message: "수정성공" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "수정실패" });
    }
  });

  /* DELETE: 식비 삭제 */
  app.delete("/spends/item/:id", async (req, res) => {
    try {
      await SpendItem.findByIdAndDelete(req.params.id);
      res.json({ message: "삭제성공" });
    } catch (error) {
      res.json({ message: "삭제실패" });
    }
  });

  /* DELETE: 카드 삭제 */
  app.delete("/spends/mealCount/:id", async (req, res) => {
    try {
      await SpendItem.deleteMany({ date: req.body.date });
      await MealCount.findByIdAndDelete(req.params.id);
      res.json({ message: "삭제성공" });
    } catch (error) {
      res.json({ message: "삭제실패" });
    }
  });

  /***************************************/
  /************** USER CRUD **************/
  /***************************************/
  /* 로그인 */
  app.post("/users/login", async (req, res) => {
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
  app.get("/users/auth", async (req, res) => {
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
  app.post("/users/logout", (req, res) => {
    try {
      res.clearCookie("id");
      res.send({ message: "로그아웃성공" });
    } catch (error) {
      console.error("로그아웃 에러", error);
      res.send({ message: "로그아웃실패" });
    }
  });

  /* 회원가입 */
  app.post("/users/signup", async (req, res) => {
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
