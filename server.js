import cors from 'cors';
import next from 'next';
import Pusher from 'pusher';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Sentiment from 'sentiment';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

const app = next({dev});
const handler =app.getRequestHandler();
const sentiment=new Sentiment();
const pusher = new Pusher({
    appId:process.env.PUSHER_APP_ID,
    key:process.env.PUSHER_APP_KEY,
    secret:process.env.PUSHER_APP_SECRET,
    cluster:process.env.PUSHER_APP_CLUSTER,
    useTLS:true
});


app.prepare()
.then(()=>{
    const server = express();

    server.use(cors());
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended:true}));

    server.get('*',(req,res)=>{
        return handler(req,res);
    });
    const chatHistory = { messages: [] };
    
    server.post('/message', (req, res, next) => {
        try {
          const { user, message, timestamp = +new Date } = req.body;
          if (!user || !message) {
            res.status(400).json({ error: 'User and message are required' });
            return;
          }
          const sentimentScore = sentiment.analyze(message).score;
     
          const chat = { user, message, timestamp, sentiment: sentimentScore };
          chatHistory.messages.push(chat);
          pusher.trigger('chat-room', 'new-message', { chat })
            .then(() => {
              res.status(200).json({ status: 'success' });
            })
            .catch(err => {
              console.error('Pusher error:', err);
              res.status(500).json({ error: 'Failed to trigger Pusher event' });
            });
        } catch (error) {
          console.error('Error processing message:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
    
    server.post('/messages', (req, res, next) => {
      res.json({ ...chatHistory, status: 'success' });
    });
    
    server.listen(PORT,err=>{
        if (err) throw err;
        console.log(`Server Ready on http://localhost:${PORT}`);
    });
})
.catch(ex=>{
    console.error(ex.stack);
    process.exit(1);
});