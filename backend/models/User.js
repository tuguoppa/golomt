const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountNumber: String,
  accountName: String,
  balance: Number
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  firstName: String,
  lastName: String,
  transactionPin: String,
  accounts: [accountSchema]
});

module.exports = mongoose.model('User', userSchema);
