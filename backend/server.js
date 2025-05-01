const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB холболт
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB холбогдлоо'))
.catch(err => console.error(err));

// ✅ ROUTES-уудыг хамгийн сүүлд app.listen-оос ӨМНӨ дуудаарай
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);

// ✅ Серверийг хамгийн сүүлд ажиллуулна
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер ${PORT} порт дээр ажиллаж байна`));
