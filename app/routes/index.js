const express = require("express");
/* 테스트 라우터 */
const indexRouter = express.Router(); 

indexRouter.route("/").get(function (req, res) {
  res.json({ "현재시간:": new Date().toLocaleString() });
});


module.exports = indexRouter;
