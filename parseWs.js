const {INIT_MSG, START_MSG, CONTINUE_MSG} = require('./constants');
const WebSocket = require('ws');
const bodyParser = require('body-parser');


// Discord WebSocket 게이트웨이 URL
const url = "wss://gateway.discord.gg/?v=9&encoding=json";


// WebSocket 클라이언트 생성
let ws = new WebSocket(url);


ws.on('open', () => {
    console.log('Connected to Discord Gateway');
    ws.send(JSON.stringify(INIT_MSG)); // init_msg 전송
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

// 메시지 이벤트 처리를 위한 콜백 함수를 설정할 수 있는 기능 제공
function onMessage(callback) {
    ws.on('message', function incoming(data) {
      // 메시지 받았을 때 콜백 함수 호출
      callback(data);
    });
}

// ----------------------------- 주기적 호출 ------------------------------------

// Initial delay of 1 second before the first message
setTimeout(() => {
  // Send the first message
  ws.send(JSON.stringify(START_MSG));

  // Set an interval to send the message every 5 minutes
  setInterval(() => {
      ws.send(JSON.stringify(START_MSG));
  }, 300000); // 300000 milliseconds = 5 minutes
}, 1000);

 
 // 매 20초마다 continue_msg 보내기
setInterval(() => {
   ws.send(JSON.stringify(CONTINUE_MSG));
 }, 40000);

 module.exports = { onMessage };