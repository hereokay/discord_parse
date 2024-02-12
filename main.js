const { Chat, saveChatToDB, saveChatListToDB } = require('./db');
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


function determineGlobalName(messageObj){
  let globalName = messageObj.d.author.global_name; // 채널별명
  const userName = messageObj.d.author.username; // 진짜이름
  const nick = messageObj.d.member.nick;

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
  return globalName;
}

function extractMessageToDB(messageObj){
  try {
    // MESSAGE_CREATE 유형의 메시지인지 확인
    if (messageObj.t === 'MESSAGE_CREATE') {

      // 공백을 기준으로 단어 분리, 중복 제거 후 다시 결합
      let content = messageObj.d.content.replace(/<[^>]*>/g, "");
      content = [...new Set(content.split(/\s+/))].join(' ');
      
      checkAndBlock(content, messageObj.d.author.username);

      const newChat = new Chat({
          globalName: determineGlobalName(messageObj),
          userName: messageObj.d.author.username,
          content: content,
          guildId: messageObj.d.guild_id,
          channelId:messageObj.d.channel_id,
          msgId: messageObj.d.id,
          timeStamp: messageObj.d.timestamp
      });

     res = saveChatToDB(newChat);
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
      if (messageObj.t === 'MESSAGE_CREATE' ) {
        if(messageObj.d.guild_id !== '1134059900666916935'){
          return;
        }
        
        extractMessageToDB(messageObj);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
});

function saveBufferToDB(){
  savingLock.isSaving = true; // Lock to prevent new saves

  //TODO messageBuffer 에 대한 DB 추가작업 진행 후

  //
  messageBuffer = tempBuffer; // 그 동안 쌓여있던 버퍼 해결
  tempBuffer = [];
  savingLock.isSaving = false; // 락 해제
}