const mongoose = require("mongoose");

const spendSchema = new mongoose.Schema({
  creatorId: { type: String, required: true, unique: true },
  mealCount: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  memo: { type: String },
});

const Spend = mongoose.model("Spend", spendSchema);

module.exports = Spend;
