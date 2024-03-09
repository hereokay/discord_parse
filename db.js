const mongoose = require('mongoose');
const schedule = require('node-schedule');

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
function saveChatToDB(chat) {
    chat.save()
}

function saveChatListToDB(chats){
    Chat.insertMany(chats).then(docs => {
        
    }).catch(error => {
        console.error('Error saving chats to DB:', error);
    });
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
  deleteOldMessages();
  setInterval(deleteOldMessages, 3600000);
});

module.exports = { Chat, saveChatToDB, saveChatListToDB};

function deleteOldMessages() {
    const currentTime = new Date();
    const fortyEightHoursAgo = new Date(currentTime.getTime() - (48 * 60 * 60 * 1000));
    const fortyEightHoursAgoStr = fortyEightHoursAgo.toISOString();

  

    db.collection('histories').deleteMany({ timeStamp: { $lt: fortyEightHoursAgoStr } }, function(err, result) {
      if (err) {
      } else {
      }
    });
}
