import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin, checkTeacher } from "../middleware/auth.js";
import {
  createBonus,
  deleteBonus,
  getBonusesForTeacher,
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
router.get("/me", authMiddleware, checkTeacher, getBonusesForTeacher)
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateBonus);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteBonus);

export default router;
