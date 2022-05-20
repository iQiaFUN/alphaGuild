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
const cfg = JSON.parse(NIL.IO.readFrom(path.join(__dirname, 'config.json')));
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
                api.logger.info(JSON.stringify(e));
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
            //绑定Manager，Main，Chat子频道
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
            if(e.sender.tiny_id === cfg.root_id && e.raw_message == cmd.addChat){
                if(cfg.guild_id === '114514' || e.guild_id === cfg.guild_id){
                    if(cfg.channel.chat == '114514'){
                        cfg.guild_id = e.guild_id;
                        cfg.channel.chat = e.channel_id;
                        save_data('config.json',cfg);
                        api.logger.info(`绑定子频道 ${e.channel_name} (${e.channel_id})为ChatChannel成功`)
                        e.reply(`绑定子频道 ${e.channel_name} (${e.channel_id})为ChatChannel成功`)
                    }else{
                        e.reply(`ChatChannel已设置为${cfg.channel.chat}`);
                        e.reply(`如需修改${e.channel_name}(${e.channel_id})为ChatChannel请手动复制子频道id并修改config.json文件`)
                    }
                }
            }
            if(e.guild_id == cfg.guild_id){
                switch(e.channel_id){
                    case cfg.channel.manager:
                        NIL.EventManager.on('onMgrChannelMsgReceived',e)
                        break;
                    case cfg.channel.main:
                        NIL.EventManager.on('onMainChannelMsgReceived',e)
                        break;
                    case cfg.channel.chat:
                        NIL.EventManager.on('onChatChannelMsgReceived',e)
                        break;
                    default:
                        break;
                }
            }
        });
        //api.listen('onMainChannelMsgReceived',e=>onMain(e));
        if(cfg.channel.chat != '114514'){
            api.listen('onChatChannelMsgReceived',e=>onChat(e));
        }
        //api.listen('onMgrChannelMsgReceived',e=>onMgr(e));
        if(cfg.guild_id != '114514'){
            api.listen('onWebsocketReceived', (dt) => {
                onWebsocket(dt);
            });
        }     
    }

    onStop(){}
}

function onWebsocket(dt){
    let data = JSON.parse(dt.message);
    let guild = getGuild(cfg.guild_id)
    let MainChannel = getChannel(guild,cfg.channel.main);
    let ChatChannel = getChannel(guild,cfg.channel.chat);
    let MgrChannel = getChannel(guild,cfg.channel.manager);
    switch (data.cause) {
        case 'chat':
            ChatChannel.sendMessage(langhelper.get('MEMBER_CHAT', dt.server, data.params.sender, data.params.text));
            break;
        case 'join':
            ChatChannel.sendMessage(langhelper.get('MEMBER_JOIN', dt.server, data.params.sender, NIL._vanilla.get_player(data.params.sender).join));
            break;
        case 'left':
            ChatChannel.sendMessage(langhelper.get('MEMBER_LEFT', dt.server, data.params.sender));
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
                ChatChannel.sendMessage(langhelper.get('MEMBER_KILL_BY_MOBS',dt.server,data.params.mobname,mobs[mob]));
            }
            break;
    }
}

module.exports = new iQiaGuild;