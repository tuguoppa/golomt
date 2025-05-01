const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 👤 Хэрэглэгчийг accountNumber-р авах — ЭНЭГИЙГ ЭХЭНД НЬ ТАВИНА
router.get('/account/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;
  try {
    const user = await User.findOne({ 'accounts.accountNumber': accountNumber });
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// 🔐 Нэвтрэх
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (!user) {
    return res.status(401).json({ error: 'Нэвтрэх нэр эсвэл нууц үг буруу' });
  }

  res.json(user);
});

router.get('/account/:accountNumber', async (req, res) => {
  try {
    const user = await User.findOne({ 'accounts.accountNumber': req.params.accountNumber });
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    res.json({ firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});


module.exports = router;
