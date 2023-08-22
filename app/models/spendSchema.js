const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", function () {
  console.log("Spend Schema Connection Failed!");
});

db.once("open", function () {
  console.log("Spend Schema Connected");
});

const spendSchema = new mongoose.Schema({
  creatorId: String,
  mealCount: Number,
  totalPrice: Number,
  date: { type: Date, default: Date.now },
  memo: String,
});

const Spend = mongoose.model("Spend", spendSchema);

module.exports = Spend;
