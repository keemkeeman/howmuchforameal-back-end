const dotenv = require("dotenv"); // env 파일 읽을 수 있음
const express = require("express"); // express 패키지 불러옴
const morgan = require("morgan"); // HTTP 요청,응답에 대한 로깅을 담당하는 미들웨어

const db = require("./app/models/index");
const applyDotenv = require("./app/lambdas/applyDotenv");

const index = require("./app/routes/index"); // 여기서 정의한 라우팅을 불러온다.

async function startServer() {
  const app = express(); // express 앱 생성
  const { mongoUri, port, jwtSecret } = applyDotenv(dotenv);

  app.use(express.static("public")); // public 디렉토리에 정적파일 제공하기 위한 미들웨어 설정
  app.use(express.urlencoded({ extended: true })); // url 인코딩된 데이터 파싱하기 위한 미들웨어 설정
  app.use(express.json()); // JSON 데이터 파싱하기 위한 미들웨어 설정
  app.use("/", index); // '/' 경로로 들어오는 요청은 index 라우터 사용
  app.use(morgan("dev")); // dev 포멧(개발용)의 로깅을 설정

  db.mongoose
    .connect(mongoUri, {
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

  app.listen(port, () => {
    console.log("서버가 정상적으로 실행중이다.");
  }); // 5000포트에서 서버 실행하고 서버 실행시 함수 실행(콘솔 출력)
}

startServer(); // 함수 호출하여 서버 시작
