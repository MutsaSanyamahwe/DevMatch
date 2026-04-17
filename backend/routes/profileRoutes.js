import express from "express";
import { getUserProfile } from "../controllers/profileController.js";
import { updateUserProfile } from "../controllers/profileController.js";
import { getUserGoals } from "../controllers/profileController.js";
import { getUserPreferences } from "../controllers/profileController.js";
import { getCvData } from "../controllers/profileController.js";

const router = express.Router();

router.get("/user-info/:userid", getUserProfile);
router.put("/update-user-info/:userid", updateUserProfile);
router.get("/get-user-goals/:userid", getUserGoals);
router.get("/get-user-preferences/:userid", getUserPreferences);
router.get("/get-cv-data/:userid", getCvData);

export default router;
