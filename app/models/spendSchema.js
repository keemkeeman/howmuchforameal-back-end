const mongoose = require("mongoose");

const spendSchema = new mongoose.Schema({
  creatorId: String,
  mealCount: Number,
  totalPrice: Number,
  date: { type: Date, default: Date.now },
  memo: String,
});

const Spend = mongoose.model("Spend", spendSchema);

module.exports = Spend;
