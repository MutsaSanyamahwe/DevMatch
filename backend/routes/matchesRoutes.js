import express from "express";
import { getDiscoverUsers } from "../controllers/matchesController.js";
import { handleUserAction } from "../controllers/matchesController.js";
import { getPendingLikes } from "../controllers/matchesController.js";
import { getMatches } from "../controllers/matchesController.js";
import { getSentPendingLikes } from "../controllers/matchesController.js";

const router = express.Router();

router.get("/discover-matches/:userid", getDiscoverUsers);
router.post("/like-pass", handleUserAction);
router.get("/pending-likes/:userid", getPendingLikes);
router.get("/matches/:userid", getMatches);
router.get("/sent-pending-likes/:userid", getSentPendingLikes);

export default router;
