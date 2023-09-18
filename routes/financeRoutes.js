import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import { getFinance } from "../controllers/financeController.js";

const router = express.Router();

router.get("/", authMiddleware, checkAdminAndSuperAdmin, getFinance);

export default router;
