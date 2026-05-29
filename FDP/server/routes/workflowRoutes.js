import express from "express";
import {
  runWorkflow,
  executeWorkflow,
  sendEmails,
} from "../controllers/workflowController.js";

const router = express.Router();

router.post("/run", runWorkflow);
router.post("/execute", executeWorkflow);
router.post("/send-emails", sendEmails);

export default router;
