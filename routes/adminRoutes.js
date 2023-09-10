import express from "express";
import {
  getAdmin,
  getAdmins,
  updateAdminPassword,
  updateAdminPasswordWithoutCheckingOldPassword,
} from "../controllers/adminController.js";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkSuperAdmin,
} from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, checkSuperAdmin, getAdmins);
router.get("/:id", authMiddleware, getAdmin);
router.patch(
  "/me/password",
  authMiddleware,
  checkAdminAndSuperAdmin,
  updateAdminPassword
);
router.patch("/password/:id", updateAdminPasswordWithoutCheckingOldPassword);

export default router;
