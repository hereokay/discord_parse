const WebSocket = require('ws');
const mysql = require('mysql');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();



// ----------------------------- VALUE ------------------------------------

// Discord WebSocket 게이트웨이 URL
const url = "wss://gateway.discord.gg/?v=9&encoding=json";
// WebSocket 클라이언트 생성
const ws = new WebSocket(url);

const token = process.env.TOKEN

init_msg = {"op":2,"d":{"token":token, "capabilities":16381,"properties":{"os":"Mac OS X","browser":"Chrome","device":"","system_locale":"en-US","browser_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36","browser_version":"120.0.0.0","os_version":"10.15.7","referrer":"https://app.subsquid.io/","referring_domain":"app.subsquid.io","referrer_current":"","referring_domain_current":"","release_channel":"stable","client_build_number":260292,"client_event_source":null},"presence":{"status":"unknown","since":0,"activities":[],"afk":false},"compress":false,"client_state":{"guild_versions":{},"highest_last_message_id":"0","read_state_version":0,"user_guild_settings_version":-1,"private_channels_version":"0","api_code_version":0}}}
start_msg = {"op":37,"d":{"subscriptions":{"1134059900666916935":{"typing":true,"threads":true,"activities":true,"members":[],"member_updates":false,"channels":{},"thread_member_lists":[]}}}}
continue_msg = {"op":1,"d":5997}

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // 일부 레거시 브라우저에 대한 지원
};




// back to front 소켓
const wss_front = new WebSocket.Server({ port: 4000 }); // 4000번 웹소켓
const app = express();
const port = 8000;  // 8000번 api 포트
app.use(bodyParser.json());
app.use(cors(corsOptions));


// POST 요청 처리
app.post('/search', async (req, res) => {
  try {
    const { content, userName } = req.body;
    let query = { content: new RegExp(content, 'i') };

    // userName이 제공된 경우 쿼리에 추가
    if (userName) {
      query.userName = userName;
    }

    const results = await History.find(query);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).send('서버 오류: ' + error.message);
  }
});


app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중`);
});

const userSchema = new mongoose.Schema({
  userName: String,
  userId:String,
  timeStamp: String,
  content:String
});

const History = mongoose.model('history', userSchema);


// ----------------------------- FUNCTION ------------------------------------
// 메시지를 데이터베이스에 저장하는 함수
function saveMessageToDB(userName, content, userId, timeStamp) {
  // 먼저 동일한 userId를 가진 메시지들을 삭제
  return History.deleteMany({ content: content })
    .then(() => {
      // 삭제 후 새 메시지 생성 및 저장
      const newHistory = new History({
        userName: userName,
        content: content,
        userId: userId,
        timeStamp: timeStamp
      });

      return newHistory.save();
    })
    .then(() => {
      console.log('메시지 저장 성공');
    })
    .catch((error) => {
      console.error('메시지 저장 중 에러 발생:', error);
    });
}


function findMessagesContainingText(searchText) {
  return History.find({ content: new RegExp(searchText, 'i') });
}

/**
 * 주어진 텍스트와 사용자 이름을 포함하는 메시지를 검색합니다.
 * @param {string} searchText - 검색할 텍스트
 * @param {string} userName - 검색할 사용자 이름
 * @returns {Promise<Array>} 검색 결과를 포함하는 프로미스
 */
 function findMessagesByContentAndUsername(searchText, userName) {
  return History.find({
    content: new RegExp(searchText, 'i'),
    userName: userName
  });
}


// ----------------------------- CONNECT ------------------------------------

// MongoDB 데이터베이스 연결 설정
mongoose.connect('mongodb://localhost:27017/msw', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


// DB 연결관리
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 연결 에러:'));
db.once('open', function() {
  console.log('MongoDB 연결 성공');
});

//userName: String,
// userId:Number,
// timeStamp: String,
// context:String
// });


// A 서버(프론트엔드)와의 연결을 관리
wss_front.on('connection', (ws) => {
  // console.log('프론트엔드 연결됨');

  // 타이머 초기화
  let pingTimeout = setTimeout(() => {
    ws.terminate();
  }, 40000); // 40초

  // 클라이언트로부터 메시지 받기
  ws.on('message', (message) => {
      // Buffer 객체를 문자열로 변환
    const messageString = message.toString();

    // console.log('받은 메시지:', messageString);

    // "살아있다"는 신호를 받으면 타이머 재설정
    if (messageString === 'alive') {
      clearTimeout(pingTimeout);
      pingTimeout = setTimeout(() => {
        ws.terminate();
      }, 40000); // 40초
    }
  });

  // 연결 종료 시 이벤트
  ws.on('close', () => {
    clearTimeout(pingTimeout);
    // console.log('프론트엔드 연결 끊김');
  });
});


// 데이터베이스에 연결
// db.connect(err => {
//     if (err) {
//       console.error('Error connecting to MySQL database:', err);
//       return;
//     }
//     console.log('Connected to MySQL database');
//   });


ws.on('open', () => {
    // console.log('Connected to Discord Gateway');
    ws.send(JSON.stringify(init_msg)); // init_msg 전송
  });

ws.on('message', function incoming(message) {
    if (message instanceof Buffer) {
      const messageString = message.toString('utf-8');
  
      try {
        const messageObj = JSON.parse(messageString);
        // console.log(messageObj)
        // MESSAGE_CREATE 유형의 메시지인지 확인
        if (messageObj.t === 'MESSAGE_CREATE') {
          // 필요한 정보 추출
          // const nonce = messageObj.d.nonce;
          const userName = messageObj.d.author.username;
          let content = messageObj.d.content.replace(/<[^>]*>/g, "");
          // 공백을 기준으로 단어 분리, 중복 제거 후 다시 결합
          content = [...new Set(content.split(/\s+/))].join(' ');
          
          const userId = messageObj.d.guild_id
          const timeStamp =  messageObj.d.timestamp;
          
          
          //  추출한 정보 출력
          //   console.log(`[${username}]: ${content}`);

          // console.log(content)
            // 메시지를 데이터베이스에 저장
          res = saveMessageToDB(userName,content,userId,timeStamp);
          // console.log(userId)
          // console.log(res)

          // wss_front.clients.forEach(client =>{
          //   if (client.readyState === WebSocket.OPEN){
          //     client.send(JSON.stringify({1,content,username}));
          //   }
          // });
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


// ----------------------------- MAIN ------------------------------------

// init_msg 전송 후 1초 기다렸다가 start_msg 전송
setTimeout(() => {
    ws.send(JSON.stringify(start_msg));
 }, 1000);
   
 
 // 매 20초마다 continue_msg 보내기
 setInterval(() => {
   ws.send(JSON.stringify(continue_msg));
 }, 20000);