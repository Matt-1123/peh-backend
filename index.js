import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import cleanupsRouter from "./routes/cleanupRoutes.js";
import dietActionsRouter from "./routes/dietActionRoutes.js";
import userRouter from "./routes/userRoutes.js";

dotenv.config();
const app = express();

// Middleware

// CORS Config
const allowedOrigins = [
  'http://localhost:3000',
  'https://peh-ui.vercel.app',
  'https://projectearthhealth.com',
  'https://www.projectearthhealth.com',
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

app.use(express.json()); // parse request JSON
app.use(cookieParser())

// request logging
const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}
app.use(requestLogger)

const PORT = process.env.PORT || 8000;
// const PORT = process.env.LOCAL_PORT || 8000;
const hostname = '0.0.0.0'; // listen on every available network interface

connectDB();

app.get("/api", (req, res) => {
  res.json("Welcome to the Project Earth Health API");
});

// Routes
app.use('/api/cleanups', cleanupsRouter);
app.use('/api/diet', dietActionsRouter)
app.use('/api/auth', authRouter);
app.use('/api/user/', userRouter);

// Middleware - 404 Fallback
const unknownEndpoint = (request, response) => {
  response.status(404).json({
    error: 'Unknown Endpoint',
    message: `Cannot ${request.method} ${request.originalUrl}`
  })
}

app.use(unknownEndpoint)

app.listen(PORT, hostname, () => {
  console.log(`Server listening on port ${PORT} on host ${hostname}`);
});
