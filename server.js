const express = require("express"); // express 패키지 불러옴
const morgan = require("morgan"); // HTTP 요청,응답에 대한 로깅을 담당하는 미들웨어
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const index = require("./app/routes/index"); // 여기서 정의한 라우팅을 불러온다.
const Spend = require("./app/models/index"); // Spend 모델 가져오기

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

  app.listen(process.env.PORT, () => {
    console.log("서버가 정상적으로 실행중이다.");
  }); // 5000포트에서 서버 실행하고 서버 실행시 함수 실행(콘솔 출력)

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
}

startServer(); // 함수 호출하여 서버 시작
