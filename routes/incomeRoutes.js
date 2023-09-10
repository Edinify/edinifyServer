import express from "express";

import { authMiddleware } from "../middleware/auth.js";
import {
  createIncome,
  deleteIncome,
  getIncomesForPagination,
  updateIncome,
} from "../controllers/incomeController.js";

const router = express.Router();

router.get("/", authMiddleware, getIncomesForPagination);
router.post("/", authMiddleware, createIncome);
router.patch("/:id", authMiddleware, updateIncome);
router.delete("/:id", authMiddleware, deleteIncome);

export default router;
