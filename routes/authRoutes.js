import express from "express";
import {
  changeForgottenPassword,
  login,
  registerAdmin,
  registerStudent,
  registerTeacher,
  refreshToken,
  getUser,
  sendCodeToEmail,
  checkOtpCode,
  registerSuperAdmin,
} from "../controllers/authController.js";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkSuperAdmin,
} from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getUser);
router.post("/super-admin/sign", registerSuperAdmin);
router.post("/admin/sign", authMiddleware, checkSuperAdmin, registerAdmin);
router.post(
  "/student/sign",
  authMiddleware,
  checkAdminAndSuperAdmin,
  registerStudent
);
router.post(
  "/teacher/sign",
  authMiddleware,
  checkAdminAndSuperAdmin,
  registerTeacher
);
router.post("/login", login);
router.get("/refresh_token", refreshToken);
router.post("/login/forget/send_to_email", sendCodeToEmail);
router.post("/login/forget/check_otp", checkOtpCode);
router.patch("/login/forget/change_password", changeForgottenPassword);

export default router;
