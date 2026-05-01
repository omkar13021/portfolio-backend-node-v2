import express from 'express';
import env from 'dotenv';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler.js';
import DBConnect from './config/DBConnection.js';
import authRouter from './routes/authRoutes.js';
import blogRouter from './routes/blogRoutes.js';
import logsMonitor from './middleware/logsHandler.js';
import corsHandler from './middleware/corsHandler.js';
import requestIdMiddleware from './middleware/requestId.js';
import rateLimiter from './middleware/rateLimiter.js';

env.config();

const port = process.env.PORT || 5000;

const app = express();

await DBConnect();

app.use(requestIdMiddleware);
app.use(rateLimiter);
app.use(logsMonitor());
app.use(corsHandler);
app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/blogs', blogRouter);
app.use(errorHandler);


app.listen(port, () => {
    console.log(`Server listening on :${port}`);
});
