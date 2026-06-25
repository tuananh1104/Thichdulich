import express from 'express';
import { chatController } from './src/chatController.js';

const app = express();
app.use(express.json());
app.post('/api/chat', chatController);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Travel chatbot API running on http://localhost:${port}`));
