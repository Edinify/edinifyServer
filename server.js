import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import workerRoutes from "./routes/workersRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import syllabusRoutes from "./routes/syllabusRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import lessonRoutes from "./routes/lessonRotes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import demoSmtpRoutes from "./routes/demoSmtpRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import bonusRoutes from "./routes/bonusRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import fineRoutes from "./routes/fineRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import demoRoutes from "./routes/demoRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
// import updateButtonRoutes from "./routes/updateButtonRoutes.js";

import {
  createNotificationForBirthdayWithCron,
  deleteNotificationsForBirthday,
} from "./controllers/notificationController.js";
import { calcDate } from "./calculate/calculateDate.js";
import { getUnviewedLessons } from "./controllers/dashboardController.js";

import cron from "node-cron";
import logger from "./config/logger.js";
import { Lesson } from "./models/lessonModel.js";
import { Admin } from "./models/adminModel.js";
import { ProfileImage } from "./models/profileImageModel.js";

dotenv.config();
const app = express();
const port = process.env.PORT;
const uri = process.env.DB_URI;

app.use(
  cors({
    origin: process.env.URL_PORT1,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Type"],
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "15mb" }));
app.use("/api/user/auth", authRoutes);
app.use("/api/user/student", studentRoutes);
app.use("/api/user/teacher", teacherRoutes);
app.use("/api/user/admin", adminRoutes);
app.use("/api/user/worker", workerRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/lesson", lessonRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/bonus", bonusRoutes);
app.use("/api/fine", fineRoutes);
app.use("/api/user/profile", profileRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/demo", demoSmtpRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/demo", demoRoutes);
app.use("/api/receipt", receiptRoutes);

app.get("/", (req, res) => {
  res.send("salam");
});

mongoose
  .connect(uri)
  .then(() => {
    console.log("connected database");
    app.listen(port, async () => {
      console.log(`listen server at ${port}`);
    });
  })
  .catch((err) => console.log(err));
