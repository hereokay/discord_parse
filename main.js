const {INIT_MSG, START_MSG, CONTINUE_MSG} = require('./constants');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const axios = require('axios');

require('dotenv').config();
// DB URL
SERVER_URI = process.env.SERVER_URI;

// Discord WebSocket 게이트웨이 URL
const url = "wss://gateway.discord.gg/?v=9&encoding=json";
// WebSocket 클라이언트 생성
let ws = new WebSocket(url);


// value

let messageQueue = []; // 메시지를 임시로 저장할 배열



ws.on('open', () => {
    console.log('Connected to Discord Gateway');
    ws.send(JSON.stringify(INIT_MSG)); // init_msg 전송
    ws.send(JSON.stringify(START_MSG));
});

ws.on('message', function incoming(message) {
  if (message instanceof Buffer) {
    const messageString = message.toString('utf-8');
    
    try {
      const messageObj = JSON.parse(messageString);

      if (messageObj.t === 'MESSAGE_CREATE' && messageObj.d.guild_id === '1134059900666916935') {
        // 조건에 맞는 메시지를 큐에 추가
        messageQueue.push(messageObj);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
});

ws.on('close', function close() {
    console.log('Disconnected from Discord Gateway');
});

ws.on('error', function error(error) {
  console.error('WebSocket error:', error);
});

// ----------------------------- 주기적 호출 ------------------------------------
 
 // 매 20초마다 continue_msg 보내기
setInterval(() => {
   ws.send(JSON.stringify(CONTINUE_MSG));
 }, 40000);


 // 1분마다 큐에 있는 메시지를 일괄적으로 처리
setInterval(() => {
  if (messageQueue.length > 0) {
    l = messageQueue.length;
    axios.post(SERVER_URI, messageQueue)
      .then(function (response) {
        console.log(`${l} messages sent. Response:`);
      })
      .catch(function (error) {
        console.error('Error sending messages:', error);
      });
    
    // 메시지 전송 후 큐 초기화
    messageQueue = [];
  }
}, 60000/30); // 60000ms = 1분
