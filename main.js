const { Chat, saveChatToDB, saveChatListToDB, db } = require('./db');
const { onMessage } = require('./parseWs');



// 기존 채팅이 존재하는지 확인
function isExist(content) {
  // DB에서 content가 있는지 조회 있으면 PASS

      // 'chats' 컬렉션에서 주어진 'content' 값을 가진 문서가 있는지 조회
      var existingChat = db.collection('histories').findOne({ content: content });

      // 해당 'content'를 가진 채팅이 존재하지 않으면, 새로운 채팅을 삽입
      if (existingChat == null) {
          return false; 
      } else {
          console.log('content: '+content + "가 존재하여 추가하지 않음");
          // 해당 'content'를 가진 채팅이 이미 존재하는 경우
          return true;
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
      
      if(isExist(content)){
        return false;
      }

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
    }
  } catch (error) {
    console.error('Error extractMessageToDB :', error);
  }
}

function processAndSaveMessages(messageList) {
  const chatObjects = messageList.map(messageObj => makeChat(messageObj)).filter(chat => chat !== false);

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

        newChat = makeChat(messageObj);
        saveChatToDB(newChat);
        



        // if (savingLock.isSaving) {
        //   // If a save operation is in progress, add to temporary buffer
        //   tempBuffer.push(messageObj);
        // } else {
        //   // Otherwise, add to the main buffer
        //   messageBuffer.push(messageObj);
        // }

        // if (messageBuffer.length >= 100 && !savingLock.isSaving) {
        //   saveBufferToDB();
        // }


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