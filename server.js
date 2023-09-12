const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const SpendItem = require("./app/models/spendItemSchema"); // 식비 모델
const User = require("./app/models/userSchema"); // User 모델
const MealCount = require("./app/models/mealCountSchema"); // 끼니 모델
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

async function startServer() {
  dotenv.config();

  const app = express(); // express 앱 생성
  const port = process.env.PORT;
  const indexRouter = express.Router();
  indexRouter.route("/").get(function (req, res) {
    res.json({ 현재시간: new Date().toLocaleString() });
  });

  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true })); // HTML 폼 사용시 필요 (url 인코딩된 데이터 파싱)
  app.use(express.json()); // JSON 데이터 파싱하기 위한 미들웨어 설정
  app.use(morgan("dev")); // 개발 환경에서 HTTP 로그를 콘솔에 출력
  app.use("/", indexRouter);

  app.listen(port || 5000, () => {
    console.log("서버 실행");
  });

  /* CORS 설정 */
  const corsOptions = {
    origin: process.env.CLIENT,
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  };
  app.use(cors(corsOptions));

  /* 몽고 db 연결 */
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

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
  /* 식비 추가 */
  app.post(`/spends/item`, async (req, res) => {
    try {
      const newSpend = new SpendItem(req.body);
      await newSpend.save();
      const new_newSpend = await SpendItem.findOne({
        date: req.body.date,
        creatorId: req.body.creatorId,
        itemName: req.body.itemName,
        price: req.body.price,
      });
      res.send({ spendId: new_newSpend._id, message: "등록성공" });
    } catch (error) {
      console.error("식비 추가 에러");
      res.send({ message: "등록실패" });
    }
  });

  /* 끼니 추가 */
  app.post(`/spends/mealcount`, async (req, res) => {
    try {
      const existMealCount = await MealCount.findOne({
        date: req.body.date,
        creatorId: req.body.creatorId,
      });
      if (!existMealCount) {
        const mealCount = new MealCount(req.body);
        await mealCount.save();
        const newMealCount = await MealCount.findOne({
          date: req.body.date,
          creatorId: req.body.creatorId,
        });
        res.send({ mealCountId: newMealCount._id, message: "등록성공" });
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

  /* 임시 보관 식비 카드 가져오기 */
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

  /* 카드 수정 */
  app.put("/spends/mealCount/:id", async (req, res) => {
    try {
      const response = await MealCount.findByIdAndUpdate(
        req.params.id,
        req.body
      );
      if (!response) {
        res.status(404).send({ message: "카드를 찾을 수 없습니다." });
      } else {
        res.status(200).send({ message: "수정성공" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "수정실패" });
    }
  });

  /* 식비 삭제 */
  app.delete("/spends/item/:id", async (req, res) => {
    try {
      await SpendItem.findByIdAndDelete(req.params.id);
      res.json({ message: "삭제성공" });
    } catch (error) {
      res.json({ message: "삭제실패" });
    }
  });

  /* 끼니 삭제 */
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
    try {
      const { userId, password } = req.body;

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
      res.cookie("id", user._id, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 60 * 60 * 1000,
      });
      res.json({ nickName: user.nickName });
    } catch (error) {
      console.error("로그인 실패", error);
    }
  });

  /* 유저 불러오기 */
  app.get("/users/auth", async (req, res) => {
    try {
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
    } catch (error) {
      console.error("유저 불러오기 에러", error);
    }
  });

  /* 로그아웃 */
  app.post("/users/logout", (req, res) => {
    try {
      res.clearCookie("id", {
        path: "/",
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
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
