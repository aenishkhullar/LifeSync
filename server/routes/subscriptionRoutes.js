import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createSubscription,
    getSubscriptions,
    updateSubscription,
    deleteSubscription,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createSubscription).get(getSubscriptions);
router.route("/:id").put(updateSubscription).delete(deleteSubscription);

export default router;
