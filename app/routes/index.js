const express = require("express");

const indexRouter = express.Router(); // 새로운 라우터 객체를 생성

indexRouter.route("/").get(function (req, res) {
  res.json({ "현재시간:": new Date().toLocaleString() });
});
// '/' 경로로 들어오는 GET 요청에 대한 처리
// function (req, res){} 는 라우터의 get 핸들러 함수 (get일때 이 함수 실행)
// req는 클라이언트 요청에 대한 정보를 담고있는 객체
// res는 서버의 응답을 다루는 객체

module.exports = indexRouter;
