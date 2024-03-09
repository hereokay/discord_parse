const { Chat, saveChatToDB, saveChatListToDB } = require('./db');
const { onMessage } = require('./parseWs');


function checkAndBlock(content, userName) {
  const normalizedPercent = content.replace(/%{2,}/g, '%');
  // Replace sequences of two or more '/' with a single '/'
  const normalizedSlashes = normalizedPercent.replace(/\/{2,}/g, '/');
  // Normalize sequences of '[' to a single '['
  const normalizedBrackets = normalizedSlashes.replace(/\[{2,}/g, '[');
  
  // Count '%' and '/' occurrences
  const percentCount = (normalizedBrackets.match(/%/g) || []).length;
  const slashCount = (normalizedBrackets.match(/\//g) || []).length;
  // Count normalized '[' occurrences
  const bracketCount = (normalizedBrackets.match(/\[/g) || []).length;
  

  // 조건 충족 시 GET 요청 보내기
  if (percentCount >= 8 || slashCount >= 8 || bracketCount >= 8) {
      const url = `http://3.38.25.218/block?security=0807&userName=${userName}`;
      fetch(url)
          .then(response => response.json())
          .then()
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

function makeChat(messageObj){
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
      return newChat;
     //res = saveChatToDB(newChat);
    }
  } catch (error) {
    console.error('Error extractMessageToDB :', error);
  }
}

function processAndSaveMessages(messageList) {
  const chatObjects = messageList.map(messageObj => makeChat(messageObj)).filter(chat => chat !== undefined);

  if (chatObjects.length > 0) {
      saveChatListToDB(chatObjects);
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
        
        console.log(messageObj.d.author.username);


        if (savingLock.isSaving) {
          // If a save operation is in progress, add to temporary buffer
          tempBuffer.push(messageObj);
        } else {
          // Otherwise, add to the main buffer
          messageBuffer.push(messageObj);
        }

        if (messageBuffer.length >= 100 && !savingLock.isSaving) {
          saveBufferToDB();
        }


      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
});

function saveBufferToDB(){
  savingLock.isSaving = true; // Lock to prevent new saves

  //TODO messageBuffer 에 대한 DB 추가작업 진행 
  processAndSaveMessages(messageBuffer)

  //
  messageBuffer = tempBuffer; // 버퍼를 임시버퍼로 옮김
  tempBuffer = [];
  savingLock.isSaving = false; // 락 해제
}