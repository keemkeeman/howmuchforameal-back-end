const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", function () {
  console.log("User Schema Connection Failed!");
});

db.once("open", function () {
  console.log("User Schema Connected");
});

const userSchema = new mongoose.Schema({
  userId: String,
  password: String,
  nickName: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
