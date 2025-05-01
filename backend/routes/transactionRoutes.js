const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

router.post('/', async (req, res) => {
  try {
    const {
      senderAccount,
      receiverAccount,
      amount,
      note,
      type,
      currency,
      transactionPin
    } = req.body;

    if (!senderAccount || !receiverAccount || !amount || !transactionPin) {
      return res.status(400).json({ error: 'Бүх талбаруудыг бөглөнө үү' });
    }

    if (senderAccount === receiverAccount) {
      return res.status(400).json({ error: 'Илгээгч, хүлээн авагчийн данс ижил байж болохгүй' });
    }

    const senderUser = await User.findOne({ 'accounts.accountNumber': senderAccount });
    if (!senderUser) return res.status(404).json({ error: 'Илгээгчийн данс олдсонгүй' });
    if (senderUser.transactionPin !== transactionPin) {
      return res.status(403).json({ error: 'Гүйлгээний нууц үг буруу байна' });
    }

    const senderAcc = senderUser.accounts.find(acc => acc.accountNumber === senderAccount);
    if (!senderAcc) return res.status(404).json({ error: 'Илгээгчийн данс олдсонгүй' });

    // 💱 Валют хөрвүүлэлт
    let amountInMNT = amount;
    if (currency === 'USD') {
      amountInMNT = amount * 3450;
    } else if (currency === 'EUR') {
      amountInMNT = amount * 3700;
    }

    if (senderAcc.balance < amountInMNT) {
      return res.status(400).json({ error: 'Үлдэгдэл хүрэлцэхгүй байна' });
    }

    const receiverUser = await User.findOne({ 'accounts.accountNumber': receiverAccount });
    if (!receiverUser) return res.status(404).json({ error: 'Хүлээн авагчийн данс олдсонгүй' });

    const receiverAcc = receiverUser.accounts.find(acc => acc.accountNumber === receiverAccount);
    if (!receiverAcc) return res.status(404).json({ error: 'Хүлээн авагчийн данс буруу байна' });

    // 💸 Үлдэгдэл шинэчлэлт (MNT дүнгээр)
    await User.updateOne(
      { 'accounts.accountNumber': senderAccount },
      { $inc: { 'accounts.$.balance': -amountInMNT } }
    );

    await User.updateOne(
      { 'accounts.accountNumber': receiverAccount },
      { $inc: { 'accounts.$.balance': amountInMNT } }
    );

    // 🧾 Гүйлгээ хадгалах
    const transaction = new Transaction({
      senderAccount,
      receiverAccount,
      amount, // Хэрэглэгч оруулсан дүн (валютынхаа нэгжээр)
      note,
      type,
      currency,
      date: new Date()
    });

    await transaction.save();

    res.status(201).json({ message: 'Гүйлгээ амжилттай', transaction });

  } catch (error) {
    console.error('❌ Системийн алдаа:', error.message);
    res.status(500).json({ error: 'Системийн алдаа' });
  }
});

module.exports = router;
