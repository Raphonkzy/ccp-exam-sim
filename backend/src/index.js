// backend/src/index.js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import visitorsRouter from './routes/visitors.js';
import { initDb } from './db/pool.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(authMiddleware);   // attach req.user on every request

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/visitors', visitorsRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  console.log(`[backend] Listening on port ${PORT}`);
  await initDb();
});
