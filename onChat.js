const Lang = require('./Lang');
const langhelper = new Lang('lang.ini');

// function SendTextAll(text) {
//     NIL.SERVERS.forEach((s, k) => {
//         s.sendText(text);
//     });
// }
function SendText(ser,text){
    NIL.SERVERS.forEach((s, k) => {
        if(ser == k){
            s.sendText(text);
        }
    });
}
function onChat(e) {
    if(NIL._alpha.chat_exists(e.channel_id)){
        let ser = NIL._alpha.getSer(e.channel_id);
        SendText(ser,langhelper.get('GUILD_MEMBER_CHAT',e.sender.nickname, GetFormatText(e)));
    }
    //SendTextAll(langhelper.get('GROUP_MEMBER_CHAT',e.sender.nickname, GetFormatText(e)));
}

var GetFormatText = function (e) {
    var rt = '';
    for (i in e.message) {
        switch (e.message[i].type) {
            case "at":
                if (e.message[i].qq.toString() == 'all') {
                    rt += langhelper.get("MESSAGE_AT_ALL");
                    continue;
                }
                rt += langhelper.get('MESSAGE_AT', NIL._vanilla.wl_exists(e.message[i].qq)?NIL._vanilla.get_xboxid(e.message[i].qq):e.sender.nick);
                break;
            case "image":
                rt += langhelper.get("MESSAGE_IMAGE");
                break;
            case "text":
                if (e.message[i].text.length>50)
                    rt += langhelper.get("MESSAGE_TOO_LONG");
                else
                    rt += e.message[i].text;
                break;
        }
    }
    return rt;
}

module.exports = onChat;