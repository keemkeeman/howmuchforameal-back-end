const dotenv = require("dotenv");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dotenv.MONGO_URI;
// db.User = new UserModel(mongoose)

module.exports = db;
