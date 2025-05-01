const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 👤 Хэрэглэгчийг дансны дугаараар авах
router.get('/account/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;
  try {
    const user = await User.findOne({ 'accounts.accountNumber': accountNumber });
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });

    // Зөвхөн name-г буцаана (гүйлгээний хүлээн авагчийн нэр харуулах зорилготой)
    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (err) {
    console.error('❌ Хэрэглэгч хайхад алдаа:', err.message);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

// 🔐 Нэвтрэх
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: 'Нэвтрэх нэр эсвэл нууц үг буруу' });
    }
    res.json(user);
  } catch (err) {
    console.error('❌ Нэвтрэхэд алдаа:', err.message);
    res.status(500).json({ error: 'Серверийн алдаа' });
  }
});

module.exports = router;
