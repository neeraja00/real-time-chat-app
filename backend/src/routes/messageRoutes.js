import express from 'express';
import { getMessages, createMessage } from '../controllers/messageController.js';

const router = express.Router();

router.route('/')
  .get(getMessages)
  .post(createMessage);

export default router;
