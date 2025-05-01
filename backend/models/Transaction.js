const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  senderAccount: String,
  receiverAccount: String,
  amount: Number,
  note: String,
  type: String, // self, golomt, interbank
  currency: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
