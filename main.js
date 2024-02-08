const WebSocket = require('ws');
const mysql = require('mysql');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');

require('dotenv').config();


dbUri = process.env.DB_URI

// ----------------------------- VALUE ------------------------------------

// Discord WebSocket 게이트웨이 URL
const url = "wss://gateway.discord.gg/?v=9&encoding=json";
// WebSocket 클라이언트 생성
let ws = new WebSocket(url);

const token = process.env.TOKEN


init_msg = {
  "op": 2,
  "d": {
    "token": token,
    "capabilities": 16381,
    "properties": {
      "os": "Mac OS X",
      "browser": "Chrome",
      "device": "",
      "system_locale": "ko-KR",
      "browser_user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      "browser_version": "121.0.0.0",
      "os_version": "10.15.7",
      "referrer": "https://www.google.com/",
      "referring_domain": "www.google.com",
      "search_engine": "google",
      "referrer_current": "",
      "referring_domain_current": "",
      "release_channel": "stable",
      "client_build_number": 261973,
      "client_event_source": null
    },
    "presence": {
      "status": "online",
      "since": 0,
      "activities": [],
      "afk": false
    },
    "compress": false,
    "client_state": {
      "guild_versions": {},
      "highest_last_message_id": "0",
      "read_state_version": 0,
      "user_guild_settings_version": -1,
      "private_channels_version": "0",
      "api_code_version": 0
    }
  }
}
start_msg = {"op":37,"d":{"subscriptions":{"1134059900666916935":{"typing":true,"threads":true,"activities":true,"members":[],"member_updates":false,"channels":{},"thread_member_lists":[]}}}}
continue_msg = {"op":1,"d":4000}

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // 일부 레거시 브라우저에 대한 지원
};

function checkAndBlock(content, userName) {
  // %와 /의 개수를 세기
  const percentCount = (content.match(/%/g) || []).length;
  const slashCount = (content.match(/\//g) || []).length;

  

  // 조건 충족 시 GET 요청 보내기
  if (percentCount >= 8 || slashCount >= 8) {
      const url = `http://3.38.25.218/block?security=0807&userName=${userName}`;
      fetch(url)
          .then(response => response.json())
          .then(data => console.log(data))
          .catch(error => console.error('Error:', error));
  }
}

const userSchema = new mongoose.Schema({
  globalName: String,
  userName: String,
  content: String,
  guildId:String,
  channelId:String,
  msgId:String,
  timeStamp: String
});

const History = mongoose.model('history', userSchema);


// ----------------------------- FUNCTION ------------------------------------
// 메시지를 데이터베이스에 저장하는 함수
function saveMessageToDB(globalName,userName,content,guildId,channelId,msgId,timeStamp) {

      
  const newHistory = new History({
          globalName: globalName,
          userName: userName,
          content: content,
          guildId:guildId,
          channelId:channelId,
          msgId:msgId,
          timeStamp: timeStamp
      });
      newHistory.save()
}


// ----------------------------- CONNECT ------------------------------------

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


ws.on('open', () => {
    console.log('Connected to Discord Gateway');
    ws.send(JSON.stringify(init_msg)); // init_msg 전송
  });


  
ws.on('message', function incoming(message) {
    if (message instanceof Buffer) {
      const messageString = message.toString('utf-8');
  
      try {
        const messageObj = JSON.parse(messageString);
        
        // MESSAGE_CREATE 유형의 메시지인지 확인
        if (messageObj.t === 'MESSAGE_CREATE') {
          // console.log(messageObj)
          // 필요한 정보 추출
          
          let globalName = messageObj.d.author.global_name; // 채널별명
          const userName = messageObj.d.author.username; // 진짜이름
          const guildId = messageObj.d.guild_id // 메이플랜드 채널
          const channelId = messageObj.d.channel_id; // 경매장 or 파티
          const nick = messageObj.d.member.nick;
          const msgId = messageObj.d.id;
          
          if(nick !== null ){
            // nick이 있으먄 우선순위
            globalName = nick;
          }
          else{
            // 닉이 없고 globalName이 있으면
            if (globalName !== null){
              globalName = globalName;
            }
            else{
              //다 없으면
              globalName = userName;
            }
          }

          if (globalName===null){
            if (nick !== null){
              globalName = nick;
            }
            else{
              globalName = userName;
            }
          }

          const timeStamp =  messageObj.d.timestamp;
          let content = messageObj.d.content.replace(/<[^>]*>/g, "");
          // 공백을 기준으로 단어 분리, 중복 제거 후 다시 결합
          content = [...new Set(content.split(/\s+/))].join(' ');
          
          checkAndBlock(content, userName);

          // 메이플랜드 채널
          if(guildId !== '1134059900666916935'){
            return;
          }
          
         res = saveMessageToDB(globalName,userName,content,guildId,channelId,msgId,timeStamp);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  });

ws.on('close', function close() {
    console.log('Disconnected from Discord Gateway');
  
    // 1분 후에 재연결 시도
    setTimeout(function() {
  
      // 'open' 이벤트 핸들러 다시 설정
      ws.on('open', () => {
        console.log('Connected to Discord Gateway');
        ws.send(JSON.stringify(init_msg)); // init_msg 전송
      });
  
      // 필요한 경우 다른 이벤트 핸들러들도 여기에 추가
      // 예: ws.on('message', function incoming(data) { ... });
  
    }, 60000); // 60000밀리초(1분) 후에 실행
  });
  

ws.on('error', function error(error) {
  console.error('WebSocket error:', error);
});


// ----------------------------- 주기적 호출 ------------------------------------

// Initial delay of 1 second before the first message
setTimeout(() => {
  // Send the first message
  ws.send(JSON.stringify(start_msg));

  // Set an interval to send the message every 5 minutes
  setInterval(() => {
      ws.send(JSON.stringify(start_msg));
  }, 300000); // 300000 milliseconds = 5 minutes
}, 1000);

 
 // 매 20초마다 continue_msg 보내기
 setInterval(() => {
   ws.send(JSON.stringify(continue_msg));
 }, 40000);