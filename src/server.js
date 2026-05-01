import express from 'express';
import env from 'dotenv';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler.js';
import DBConnect from './config/DBConnection.js';
import authRouter from './routes/authRoutes.js';
import logsMonitor from './middleware/logsHandler.js';
import corsHandler from './middleware/corsHandler.js';

env.config();

const port = process.env.PORT || 5000;

const app = express();

await DBConnect();

app.use(logsMonitor());
app.use(corsHandler);
app.use(cookieParser());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);


app.listen(port, () => {
    console.log(`Server listening on :${port}`);
});
