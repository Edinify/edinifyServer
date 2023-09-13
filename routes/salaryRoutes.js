import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import { getSalaries } from "../controllers/salaryController.js";

const Router = express.Router();

Router.get("/", authMiddleware, checkAdminAndSuperAdmin, getSalaries);

export default Router;
