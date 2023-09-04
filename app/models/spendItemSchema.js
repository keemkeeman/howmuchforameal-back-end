const mongoose = require("mongoose");

const spendItemSchema = new mongoose.Schema({
  creatorId: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
});

const SpendItem = mongoose.model("Spend", spendItemSchema);

module.exports = SpendItem;
