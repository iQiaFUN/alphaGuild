const { GuildApp, Guild, Channel } = require('oicq-guild');
const path = require('path');
const vcfg = NIL._vanilla.cfg;
const tmpcfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'example.json')));

function checkFile(file, text) {
    if (NIL.IO.exists(path.join(__dirname, file)) == false) {
        NIL.IO.WriteTo(path.join(__dirname, file), text);
    }
}

checkFile("config.json", JSON.stringify(tmpcfg, null, '\t'));
checkFile("chat_ser.json", "{}")
const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'config.json')));
let chat_ser = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'chat_ser.json')));
//直接从vanilla Copy过来的
const onChat = require('./onChat');
const Lang = require('./Lang');
const langhelper = new Lang('lang.ini');
const mobs = require('./mobs.json');
const cmd = {
    addMgr:"绑定Mgr",
    addMain:"绑定Main",
    addChat:"绑定Chat"
}
let client = NIL.bots.getBot(vcfg.self_id)
let app = GuildApp.bind(client);
function getGuild(gid){
    return new Guild(app,gid)
}
function getChannel(guild,chid){
    return new Channel(guild,chid)
}
function save_data(filesname,data) {
    NIL.IO.WriteTo(path.join(__dirname, filesname), JSON.stringify(data, null, '\t'));
}

class iQiaGuild extends NIL.ModuleBase{
    onStart(api){
        api.addEvent('GuildMsgReceived');
        api.addEvent('onMainChannelMsgReceived');
        api.addEvent('onChatChannelMsgReceived');
        api.addEvent('onMgrChannelMsgReceived');
        app.on("ready",function(){
            api.logger.info('Ready!');
        })
        
        app.on('message', e => {
            if(e.sender.tiny_id != client.tiny_id){
                NIL.EventManager.on('GuildMsgReceived',e);
                //api.logger.info(JSON.stringify(e));
            }
        })
        api.listen('GuildMsgReceived',e =>{
            //绑定超级管理员
            if(e.raw_message == cfg.key){
                if(cfg.root_id == "114514"){
                    cfg.root_id = e.sender.tiny_id;
                    e.reply(`绑定超级管理员成功`);
                    cfg.admin.push(e.sender.tiny_id);
                    e.reply(`已添加为admin`);
                    save_data('config.json',cfg);
                }else if(e.sender.tiny_id == cfg.root_id){
                    e.reply(`已绑定超级管理员,如需修改请手动修改config.json文件`)
                }else{
                    e.reply(`你不是超级管理员，无法进行此操作`)
                }
            }
            //绑定Manager子频道
            if(e.sender.tiny_id === cfg.root_id && e.raw_message == cmd.addMgr){
                if(cfg.guild_id === '114514' || e.guild_id === cfg.guild_id){
                    if(cfg.channel.manager == '114514'){
                        cfg.guild_id = e.guild_id;
                        cfg.channel.manager = e.channel_id;
                        save_data('config.json',cfg);
                        api.logger.info(`绑定子频道 ${e.channel_name} (${e.channel_id})为ManagerChannel成功`)
                        e.reply(`绑定子频道 ${e.channel_name} (${e.channel_id})为ManagerChannel成功`)
                    }else{
                        e.reply(`ManagerChannel已设置为${cfg.channel.manager}`);
                        e.reply(`如需修改${e.channel_name}(${e.channel_id})为ManagerChannel请手动复制子频道id并修改config.json文件`)
                    }
                }
            }
            //绑定Main子频道
            if(e.sender.tiny_id === cfg.root_id && e.raw_message == cmd.addMain){
                if(cfg.guild_id === '114514' || e.guild_id === cfg.guild_id){
                    if(cfg.channel.main == '114514'){
                        cfg.guild_id = e.guild_id;
                        cfg.channel.main = e.channel_id;
                        save_data('config.json',cfg);
                        api.logger.info(`绑定子频道 ${e.channel_name} (${e.channel_id})为MainChannel成功`)
                        e.reply(`绑定子频道 ${e.channel_name} (${e.channel_id})为MainChannel成功`)
                    }else{
                        e.reply(`MainChannel已设置为${cfg.channel.main}`);
                        e.reply(`如需修改${e.channel_name}(${e.channel_id})为MainChannel请手动复制子频道id并修改config.json文件`)
                    }
                }
            }
            //绑定Chat子频道
            if(e.sender.tiny_id === cfg.root_id && e.raw_message.indexOf(cmd.addChat) == 0){
				
                if(cfg.guild_id === '114514' || e.guild_id === cfg.guild_id){
					
                    let text = e.raw_message;
                    let pt = text.split(cmd.addChat+" ");
					//console.log(pt);
                    let ser = pt[1];
					//console.log(`${ser}`);
                    if(isServer(ser)){
						
                        if(ser_exists(ser)){
                            let id = getChat(ser);
                            e.reply(`${ser}已绑定聊天子频道${id}`)
                        }else if(chat_exists(e.channel_id)){
                            let ser_name = getSer(e.channel_id)
                            e.reply(`频道(${e.channel_id})已绑定${ser_name}`)
                        }else{
                            chat_ser[e.channel_id] = ser;
                            api.logger.info(`${ser}绑定聊天子频道${e.channel_id}成功`)
                            save_data('config.json',cfg);
                            save_data('chat_ser.json',chat_ser);
                            e.reply(`${ser}绑定成功`);
                        }
                    }
                } 
            }
            if(e.guild_id == cfg.guild_id){
                if(cfg.channel.manager == e.channel_id){
                    NIL.EventManager.on('onMgrChannelMsgReceived',e)
                }    
                if(cfg.channel.main == e.channel_id){
                    NIL.EventManager.on('onMainChannelMsgReceived',e)
                }    
                if(chat_exists(e.channel_id)){
                    NIL.EventManager.on('onChatChannelMsgReceived',e)
                }
            }
        });
        //api.listen('onMainChannelMsgReceived',e=>onMain(e));

        api.listen('onChatChannelMsgReceived',e=>onChat(e));

        api.listen('onMgrChannelMsgReceived',e=>{
            //console.log(JSON.stringify(e))
        });
        if(cfg.guild_id != '114514'){
            api.listen('onWebsocketReceived', (dt) => {
                onWebsocket(dt);
            });
        }
        NIL._alpha = {
            isServer,
            getChat,
            getSer,
            ser_exists,
            chat_exists,
            getGuild,
            getChannel
        }     
    }

    onStop(){}
}

// function isChat(id){
//     return cfg.group.chat.indexOf(id) != -1;
// }

function isServer(ser){
	let r = false
    NIL.SERVERS.forEach((server,key)=>{
        if(ser == key){
			r = true
		}
    });
    return r
}

function getChat(ser){
    for(let m in chat_ser){
        let tmp = chat_ser[m];
        if(tmp == ser){
            return m;
        }
    }
}

function getSer(id){
    return chat_ser[id]
}

function ser_exists(ser){
    for(let m in chat_ser){
        if(chat_ser[m] == ser){
            return true
        }
    }
    return false
}

function chat_exists(id){
    return chat_ser[id] != undefined;
}
function onWebsocket(dt){
    let data = JSON.parse(dt.message);
    let serName = dt.server;
    let guild = getGuild(cfg.guild_id)
    let MainChannel = getChannel(guild,cfg.channel.main);
    let cid = "114514"
    let chatSwitch = false;
    if(ser_exists(serName)){
        cid = getChat(serName);
        chatSwitch = true;
    }
    let ChatChannel = getChannel(guild,cid);
    let MgrChannel = getChannel(guild,cfg.channel.manager);
    
    switch (data.cause) {
        case 'chat':
            if(chatSwitch) ChatChannel.sendMessage(langhelper.get('MEMBER_CHAT', dt.server, data.params.sender, data.params.text));
            break;
        case 'join':
            if(chatSwitch) ChatChannel.sendMessage(langhelper.get('MEMBER_JOIN', dt.server, data.params.sender, NIL._vanilla.get_player(data.params.sender).join));
            break;
        case 'left':
            if(chatSwitch) ChatChannel.sendMessage(langhelper.get('MEMBER_LEFT', dt.server, data.params.sender));
            break;
        case 'start':
            MgrChannel.sendMessage(langhelper.get("SERVER_START", dt.server));
            break;
        case 'stop':
            MgrChannel.sendMessage(langhelper.get("SERVER_STOP", dt.server));
            break;
        case "accident_stop":
            MgrChannel.sendMessage(langhelper.get("SERVER_STOP_ACCIDENT", dt.server));
            MainChannel.sendMessage(langhelper.get("SERVER_STOP_ACCIDENT", dt.server));
            break;
        case 'plantext':
            MgrChannel.sendMessage(data.params.text);
            break;
        case 'mobdie':
            var mob = "entity." + data.params.srctype.toLowerCase() + ".name";
            if(mobs[mob] != undefined){
                if(chatSwitch) ChatChannel.sendMessage(langhelper.get('MEMBER_KILL_BY_MOBS',dt.server,data.params.mobname,mobs[mob]));
            }
            break;
    }
}

module.exports = new iQiaGuild;