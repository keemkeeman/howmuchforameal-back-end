const mongoose = require("mongoose");

const mealCountSchema = new mongoose.Schema({
  creatorId: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  mealCount: { type: Number, required: true },
  memo: { type: String },
});

const MealCount = mongoose.model("MealCount", mealCountSchema);

module.exports = MealCount;
