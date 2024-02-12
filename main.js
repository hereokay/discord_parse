const { saveChatToDB } = require('./db');
const { onMessage } = require('./parseWs');


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



function extractMessageToDB(messageObj){
  try {
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
    console.error('Error extractMessageToDB :', error);
  }
}

let messageBuffer = [];
let tempBuffer = []; // Temporary buffer to hold messages during DB operations
const savingLock = { isSaving: false }; // Lock to track DB save operation


onMessage(function(message) {
  if (message instanceof Buffer) {
    const messageString = message.toString('utf-8');

    try {
      const messageObj = JSON.parse(messageString);
      
      // MESSAGE_CREATE 유형의 메시지인지 확인
      if (messageObj.t === 'MESSAGE_CREATE') {
        // console.log(messageObj)
        // 필요한 정보 추출
        
        extractMessageToDB(messageObj);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
});

function saveBufferToDB(){
  savingLock.isSaving = true; // Lock to prevent new saves


  messageBuffer
}