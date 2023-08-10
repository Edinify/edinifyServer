import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getSalaries } from "../controllers/salaryController.js";

const Router = express.Router();

Router.get("/", authMiddleware, getSalaries);

export default Router;
