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


ws.on('open', () => {
    console.log('Connected to Discord Gateway');
    ws.send(JSON.stringify(INIT_MSG)); // init_msg 전송
});

ws.on('message', function incoming(message) {
  // 메시지 받았을 때 콜백 함수 호출
  if (message instanceof Buffer) {
    const messageString = message.toString('utf-8');

    try {
      const messageObj = JSON.parse(messageString);
      

      // MESSAGE_CREATE 유형의 메시지인지 확인
      if (messageObj.t === 'MESSAGE_CREATE' ) {
        if(messageObj.d.guild_id !== '1134059900666916935'){
          return;
        }

        
        axios.post(URI, messageObj)
          .then(function (response) {
            console.log('Response:', response.data);
          })
          .catch(function (error) {
            console.error('Error:', error);
          });

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

