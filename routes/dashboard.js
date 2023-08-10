import express from "express";
import { getDahsboardData } from "../controllers/dashboard.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getDahsboardData);

export default router;
