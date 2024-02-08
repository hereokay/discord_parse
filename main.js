const WebSocket = require('ws');
const express = require('express');
const bodyParser = require('body-parser');
const {INIT_MSG, START_MSG, CONTINUE_MSG} = require('./constants.js');
const { saveChatToDB } = require('./db.js');


// Discord WebSocket 게이트웨이 URL
const url = "wss://gateway.discord.gg/?v=9&encoding=json";


// WebSocket 클라이언트 생성
let ws = new WebSocket(url);


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


ws.on('open', () => {
    console.log('Connected to Discord Gateway');
    ws.send(JSON.stringify(INIT_MSG)); // init_msg 전송
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
          
         res = saveChatToDB(globalName,userName,content,guildId,channelId,msgId,timeStamp);
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




 // DB 관련 ㅇ