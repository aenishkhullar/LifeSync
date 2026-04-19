import express from "express";
import { getUserProfile, updateUserBudget } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);
router.put("/budget", protect, updateUserBudget);

export default router;
