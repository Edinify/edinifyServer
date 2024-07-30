import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  createReceipt,
  deleteReceipt,
  getReceiptForPagination,
  updateReceipt,
} from "../controllers/receiptController.js";

const router = express.Router();

router.get("/pagination", authMiddleware, getReceiptForPagination);
router.post("/", authMiddleware, createReceipt);
router.patch("/:id", authMiddleware, updateReceipt);
router.delete("/:id", authMiddleware, deleteReceipt);

export default router;
