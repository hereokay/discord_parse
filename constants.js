require('dotenv').config();
const token = process.env.TOKEN


const INIT_MSG = {
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

const START_MSG = {
    "op":37,
    "d":{
        "subscriptions":{
            "1134059900666916935":{
                "typing":true,
                "threads":true,
                "activities":true,
                "members":[],
                "member_updates":false,
                "channels":{},
                "thread_member_lists":[]
            }
        }
    }
}

const CONTINUE_MSG = {
    "op":1,
    "d":4000
}
  

module.exports = {INIT_MSG, START_MSG, CONTINUE_MSG};