import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import cleanupsRouter from "./routes/cleanupRoutes.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js"

dotenv.config();
const app = express();

// CORS Config
const allowedOrigins = [
  'http://localhost:3000',
  'https://peh-ui.vercel.app',
  'https://peh-backend-goo1.onrender.com'

]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: [
    "Origin",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-Requested-With",
    "Access-Control-Allow-Origin"
  ] 
})); // allows sending json files via any client (e.g. Postman)
app.use(express.json()); // Middleware to parse JSON
app.use(cookieParser())

const PORT = process.env.PORT || 8000;
const hostname = '0.0.0.0'; // listen on every available network interface

connectDB();

app.get("/", (req, res) => {
  res.json("Welcome to the Project Earth Health API");
});

// Routes
app.use('/api/cleanups', cleanupsRouter);
app.use('/api/auth', authRouter);
app.use('/api/user/', userRouter);

// 404 Fallback
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.listen(PORT, hostname, () => {
  console.log(`Server listening on port ${PORT} on host ${hostname}`);
});
