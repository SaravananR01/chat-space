import cors from 'cors';
import next from 'next';
import Pusher from 'pusher';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import Sentiment from 'sentiment';

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
      const { user = null, message = '', timestamp = +new Date } = req.body;
      const sentimentScore = sentiment.analyze(message).score;
      
      const chat = { user, message, timestamp, sentiment: sentimentScore };
      
      chatHistory.messages.push(chat);
      pusher.trigger('chat-room', 'new-message', { chat });
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