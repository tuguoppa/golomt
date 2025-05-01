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
      transactionPin,
      selectedBank
    } = req.body;

    if (!senderAccount || !receiverAccount || !amount || !transactionPin) {
      return res.status(400).json({ error: 'Бүх талбаруудыг бөглөнө үү' });
    }

    const senderUser = await User.findOne({ 'accounts.accountNumber': senderAccount });
    if (!senderUser) return res.status(404).json({ error: 'Илгээгчийн данс олдсонгүй' });

    if (senderUser.transactionPin !== transactionPin) {
      return res.status(403).json({ error: 'Гүйлгээний нууц үг буруу байна' });
    }

    const senderAcc = senderUser.accounts.find(acc => acc.accountNumber === senderAccount);
    const numericAmount = parseFloat(amount);

    if (!senderAcc || senderAcc.balance < numericAmount) {
      return res.status(400).json({ error: 'Үлдэгдэл хүрэлцэхгүй байна' });
    }

    const receiverUser = await User.findOne({ 'accounts.accountNumber': receiverAccount });
    if (!receiverUser) return res.status(404).json({ error: 'Хүлээн авагчийн данс олдсонгүй' });

    // 🛡️ Банк шалгах (interbank үед)
    if (type === 'interbank') {
      const bankMap = {
        'Хаан банк': 'Хаан',
        'Худалдаа хөгжлийн банк': 'Хөгжлийн',
        'Төрийн банк': 'Төрийн'
      };

      const expectedBank = bankMap[selectedBank];
      if (!expectedBank) {
        return res.status(400).json({ error: 'Банкны сонголт буруу байна' });
      }

      if (receiverUser.lastName !== expectedBank) {
        return res.status(400).json({
          error: `Сонгосон банк (${selectedBank}) болон хүлээн авагч (${receiverUser.lastName}) таарахгүй байна`
        });
      }
    }

    const receiverAcc = receiverUser.accounts.find(acc => acc.accountNumber === receiverAccount);
    if (!receiverAcc) return res.status(404).json({ error: 'Хүлээн авагчийн данс буруу байна' });

    // 💱 Валют хөрвүүлэлт
    let amountInMNT = numericAmount;
    if (currency === 'USD') amountInMNT = numericAmount * 3450;
    else if (currency === 'EUR') amountInMNT = numericAmount * 3700;

    // 💸 Үлдэгдэл шинэчлэх
    senderAcc.balance -= amountInMNT;
    receiverAcc.balance += amountInMNT;

    await senderUser.save();
    await receiverUser.save();

    const transaction = new Transaction({
      senderAccount,
      receiverAccount,
      amount: numericAmount,
      note,
      type,
      currency,
      date: new Date()
    });

    await transaction.save();

    return res.status(201).json({ message: 'Гүйлгээ амжилттай', transaction });

  } catch (error) {
    console.error('❌ Системийн алдаа:', error.message);
    return res.status(500).json({ error: 'Системийн алдаа' });
  }
});

// Нэвтэрсэн хэрэглэгчийн бүх дансаар гүйлгээ шүүж авах
router.post('/user', async (req, res) => {
  try {
    const { accountNumbers, query } = req.body;

    if (!accountNumbers || !Array.isArray(accountNumbers) || accountNumbers.length === 0) {
      return res.status(400).json({ error: 'Дансны дугаарууд шаардлагатай' });
    }

    const filter = {
      $or: [
        { senderAccount: { $in: accountNumbers } },
        { receiverAccount: { $in: accountNumbers } }
      ]
    };

    if (query) {
      filter.note = { $regex: query, $options: 'i' };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error('❌ Гүйлгээ шүүх алдаа:', err.message);
    res.status(500).json({ error: 'Системийн алдаа' });
  }
});

module.exports = router;
