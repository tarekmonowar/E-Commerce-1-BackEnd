import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import connectDB from "./utils/db.js";
const app = express();

// Route Imports
import { errorMiddleware } from "./middlewares/Error.js";
import orderRoute from "./routes/orderRouter.js";
import paymentRoute from "./routes/paymentsRouter.js";
import productRoute from "./routes/productRouter.js";
import statsRoute from "./routes/statisticsRouter.js";
import userRoute from "./routes/userRouter.js";
import { connectRedis } from "./utils/redis.js";

export const redisTTL = Number(process.env.REDIS_TTL) || 60 * 60 * 4;
const redisUrl = process.env.REDIS_URL || "";

// Connect to MongoDB and redis
connectDB();
export const redis = connectRedis(redisUrl);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware for parsing JSON and URL-encoded data  body-parser lage na
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cors());

// app.use(cookieParser());

// Setting up routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", statsRoute);

// Middleware for error handling and static file
app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

// Home route
app.get("/", (req, res) => {
  res.send("API Working with /api/v1");
});

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(400).send("Bad Request tarek");
});
export default app;
