const mongoose = require('mongoose');
require('dotenv').config();

// DB URL
dbUri = process.env.DB_URI

const chatSchema = new mongoose.Schema({
    globalName: String,
    userName: String,
    content: String,
    guildId:String,
    channelId:String,
    msgId:String,
    timeStamp: String
});
  

const Chat = mongoose.model('history', chatSchema);

// 메시지를 데이터베이스에 저장하는 함수
function saveChatToDB(globalName,userName,content,guildId,channelId,msgId,timeStamp) {

    const newChat = new Chat({
            globalName: globalName,
            userName: userName,
            content: content,
            guildId:guildId,
            channelId:channelId,
            msgId:msgId,
            timeStamp: timeStamp
        });
    
    newChat.save()
}

// MongoDB 데이터베이스 연결 설정 15.164.105.119
mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// DB 연결관리
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB 연결 에러:'));

db.once('open', function() {
  console.log('MongoDB 연결 성공');
});

module.exports = { saveChatToDB };
