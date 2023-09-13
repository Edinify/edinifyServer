import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  createBonus,
  deleteBonus,
  getBonusesWithPagination,
  updateBonus,
} from "../controllers/bonusController.js";

const router = express.Router();

router.post("/", authMiddleware, checkAdminAndSuperAdmin, createBonus);
router.get(
  "/",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getBonusesWithPagination
);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateBonus);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteBonus);

export default router;
