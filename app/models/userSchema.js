const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickName: { type: String, required: true },
  profileImg: { type: String },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
