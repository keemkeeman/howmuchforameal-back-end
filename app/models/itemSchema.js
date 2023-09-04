const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  creatorId: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  mealCount: { type: Number, required: true },
  memo: { type: String },
  items: [
    {
      itemName: { type: String, required: true },
      price: { type: Number, required: true },
    },
  ],
});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
