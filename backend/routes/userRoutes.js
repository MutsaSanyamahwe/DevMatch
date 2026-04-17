import express from "express";
import { getUsers } from "../controllers/userController.js";
import { createProfile } from "../controllers/userController.js";
import { uploadAvatar } from "../controllers/userController.js";
import { upload } from "../middleware/upload.js";
import { saveCvData } from "../controllers/userController.js";
import { saveUserGoals } from "../controllers/userController.js";
import { saveUserPreferences } from "../controllers/userController.js";
import { removeAvatar } from "../controllers/userController.js";

const router = express.Router();

router.get("/", getUsers);
router.post("/profile", createProfile);
router.post("/save-cv", saveCvData);
router.post("/save-goals", saveUserGoals);
router.post("/save-preferences", saveUserPreferences);

//file/image upload route
router.post("/upload-avatar", upload.single("avatar"), uploadAvatar);
router.post("/remove-avatar", removeAvatar);

export default router;
