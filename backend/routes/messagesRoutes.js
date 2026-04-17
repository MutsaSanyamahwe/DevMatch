import express from "express";
import { sendMessage } from "../controllers/messagesController.js";
import { getMessages } from "../controllers/messagesController.js";
import { getConversations } from "../controllers/messagesController.js";
import { markMessagesAsRead } from "../controllers/messagesController.js";

const router = express.Router();

router.post("/send-message", sendMessage);
router.get("/get-messages/:match_id", getMessages);
router.get("/conversations/:userid", getConversations);
router.post("/mark-read", markMessagesAsRead);

export default router;
