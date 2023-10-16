/******************************************************************************
************************** Initialize Configuration ***************************
******************************************************************************/

console.log("");
console.log("********************************************************************************");
console.log("****************************** MoonlightRPG Bot ********************************");
console.log("********************************************************************************");
console.log("["+(new Date()).toUTCString()+"]", "Bot Startup...");
  
const fs = require("fs");

var config;
if(fs.existsSync("config.json"))
{
  config = require("./config.json");
}
else
{
  console.log("["+(new Date()).toUTCString()+"]", "config.json not found, attempting to use environment variables.");
  config = {
    "id": process.env.id,
    "token": process.env.token,
    "prefix": process.env.prefix,
    "guild_id": process.env.guild_id,
    "channel_ids": process.env.channel_ids.split(","),
    "admin_ids": process.env.admin_ids.split(","),
    "dm_role_ids": process.env.dm_role_ids.split(","),
    "signup_delay": process.env.signup_delay,
    "advert_channel_id": process.env.advert_channel_id,
    "mysql_host": process.env.mysql_host,
    "mysql_user": process.env.mysql_user,
    "mysql_pass": process.env.mysql_pass,
    "mysql_db": process.env.mysql_db,
  };
}
if(typeof(config) !== "object")
{
  console.error("["+(new Date()).toUTCString()+"]", "\x1b[41mFatal Error:\x1b[0m config.json is not loaded.");
  return false;
}
else if(config.token == null)
{
  console.error("["+(new Date()).toUTCString()+"]", "\x1b[41mFatal Error:\x1b[0m Bot token not specified in config.json; specify the token with the 'token' property.");
  return false;
}
else if(config.prefix == null)
{
  console.error("["+(new Date()).toUTCString()+"]", "\x1b[41mFatal Error:\x1b[0m Prefix not specified in config.json; specify the prefix with the 'prefix' property.");
  return false;
}

/******************************************************************************
***************************** Initialize Discord ******************************
******************************************************************************/
const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
  ],
});
client.moonlightrpg = {};
client.config = config;

client.reloadEvents = () => {
  fs.readdir("./client.events/", (err, files) => {
    if(err)
      return console.error("["+(new Date()).toUTCString()+"]", "\x1b[41mFatal Error:\x1b[0m Unable to load Discord event handlers. %s", err);
    files.forEach(file => {
      if (!file.endsWith(".js"))
        return;
      let event = require(`./client.events/${file}`);
      let eventName = file.split(".")[0];
      if(typeof(event) == "function")
        client.on(eventName, event);
      else
        console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Found file for \x1b[1m%s\x1b[0m event, but it does not resolve into a valid function.", eventName);
      delete require.cache[require.resolve(`./client.events/${file}`)];
    });
  })
};
client.reloadEvents();

/* NOTE: The functions in these commands must all return true or false:
/* * true means they were executed by the bot as normal.
/* * false means they were ignored by the bot, and thus the default command should be run instead.
*/
client.commands = {};
client.reloadCmds = (dir="./client.events/message.commands", subdirs=[]) => {
  let cmdObject = client.commands;
  subdirs.forEach(subdir => cmdObject = cmdObject[subdir]);
  let files = fs.readdirSync(dir, {encoding:"utf8",withFileTypes:true});
  for(let file of files)
  {
    if(file.isFile() && file.name.endsWith(".js"))
    {
      let command = require(`${dir}/${file.name}`);
      let commandName = file.name.split(".")[0];
      if(commandName != "" && command !== null && typeof(command) === "object" && typeof(command.run) === "function")
      {
        // Add aliases.
        if(command.help !== null && typeof(command.help) === "object" && Array.isArray(command.help.aliases))
        {
          command.help.aliases.forEach(alias => {
            // Ignore any aliases that already have files/directories associated with them.
            if(!fs.existsSync(`${alias}.js`) && !fs.existsSync(`${alias}/`))
            {
              command.help.primary = commandName;
              cmdObject[alias] = command;
            }
          });
        }
        // This happens if there's both a directory (already) and a JS file with the same command name. Treat this command as the default with no arguments.
        if(typeof(cmdObject[commandName]) == "object")
          cmdObject[commandName][''] = command;
        else
          cmdObject[commandName] = command;
      }
      else
        console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Found file \x1b[1m%s\x1b[0m for message command, but it does not resolve into a valid command object.", `${dir}/${file.name}`);
      delete require.cache[require.resolve(`${dir}/${file.name}`)];
    }
    else if(file.isDirectory())
    {
      // This happens if there's both a directory and a JS file (already) with the same command name. Set the stored command as the default with no arguments.
      if(typeof(cmdObject[file.name]) == "object" && typeof(cmdObject[file.name].run) == "function")
        cmdObject[file.name] = {'':cmdObject[file.name]};
      else
        cmdObject[file.name] = {};
      client.reloadCmds(dir +"/"+ file.name, subdirs.concat([file.name]));
    }
  }
  // Output the registered commands to the log.
  if(!subdirs.length)
  {
    console.log(`[${(new Date()).toUTCString()}] Registered Chat Commands:`);
    for(let cmd in client.commands)
    {
      if(typeof(client.commands[cmd].run) == "function")
      {
        if(!client.commands[cmd].help?.primary || client.commands[cmd].help.primary == cmd)
        {
          console.log(`   ${client.config.prefix}${client.commands[cmd].help?.format?client.commands[cmd].help.format:cmd}   | ${client.commands[cmd].help?.short}`);
          if(Array.isArray(client.commands[cmd].help?.aliases))
            for(let a of client.commands[cmd].help.aliases)
              console.log(`   ${client.config.prefix}${a}   | Alias of ${client.config.prefix}${cmd}`);
        }
      }
      else
      {
        for(let subcmd in client.commands[cmd])
        {
          if(typeof(client.commands[cmd][subcmd].run) == "function")
          {
            if(!client.commands[cmd][subcmd].help?.primary || client.commands[cmd][subcmd].help.primary == subcmd)
            {
              console.log(`   ${client.config.prefix}${client.commands[cmd][subcmd].help?.format?client.commands[cmd][subcmd].help.format:cmd+" "+subcmd}   | ${client.commands[cmd][subcmd].help?.short}`);
              if(Array.isArray(client.commands[cmd][subcmd].help?.aliases))
                for(let a of client.commands[cmd][subcmd].help.aliases)
                  console.log(`   ${client.config.prefix}${cmd} ${a}   | Alias of ${client.config.prefix}${cmd} ${subcmd}`);
            }
          }
          else
          {
            console.log(`   ${client.config.prefix}${cmd} ${subcmd} ... More parameters not shown.`);
          }
        }
      }
    }
  }
};
client.reloadCmds();

const rest = new REST().setToken(client.config.token);
client.reloadSlashCmds = async (dir="./client.events/slash.commands") => {
  // Load any data that the slash commands depend on before they are registered.
  client.moonlightrpg.timezones = await client.moonlightrpg.database.query("SELECT * FROM util_timezones ORDER BY `offset` ASC, `name` ASC");
  client.moonlightrpg.timezones.forEach(tz => {
    let offset = parseFloat(tz.offset);
    let minutes = Math.round(offset) != offset;
    if(tz.dst)
      offset = (offset>=0 ? "+" : "") + String(offset.toFixed(minutes?2:0)).replace(".", ":") +"/"+ (offset+1>=0 ? "+" : "") + String((offset+1).toFixed(minutes?2:0)).replace(".", ":");
    else
      offset = (offset>=0 ? "+" : "") + String(offset.toFixed(minutes?2:0)).replace(".", ":");
    tz.label = `(GMT ${offset}) ${tz.name}`;
  });
  
  client.slashCmds = {};
  commandRegistry = [];
  let files = fs.readdirSync(dir, {encoding:"utf8",withFileTypes:true});
  for(let file of files)
  {
      if(file.isFile() && file.name.endsWith(".js"))
      {
        let command = require(`${dir}/${file.name}`);
        let commandName = file.name.split(".")[0];
        if(commandName != "" && command !== null && typeof(command) === "object" && typeof(command.data) === "object" && typeof(command.run) === "function")
        {
          client.slashCmds[commandName] = command;
          command.data.name = commandName;
          commandRegistry.push(command.data);
        }
        else
          console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Found file \x1b[1m%s\x1b[0m for slash command, but it does not resolve into a valid command object.", `${dir}/${file.name}`);
        delete require.cache[require.resolve(`${dir}/${file.name}`)];
      }
  }
  let data = await rest.put(Routes.applicationGuildCommands(client.config.id, client.config.guild_id), { body: commandRegistry });
  console.log(`[${(new Date()).toUTCString()}] Registered Slash Commands:`, data);
};

let promiseLogin = client.login(client.config.token);
promiseLogin.then(result => console.log("["+(new Date()).toUTCString()+"]", "Bot successfully logged in to Discord."));

/******************************************************************************
****************************** Initialize MySQL *******************************
******************************************************************************/

// -- Setup --

const mysql = require("mysql");
const { Database } = require('./mysqlWrapper.js');
client.moonlightrpg.database = new Database(config.mysql_host, config.mysql_user, config.mysql_pass, config.mysql_db);

// -- Init --

client.moonlightrpg.updateApp = async function(user, appData={}, blame=user)
{
  let existing = await client.moonlightrpg.database.query("SELECT *,CAST(`id` AS CHAR) AS `id` FROM dnd WHERE id=?", user.id);
  let basicData = {
    'id': user.id,
    'handle': user.username,
    'handle_noaids': user.username,
    'avatar': user.avatar,
    'permission': 1,
  };
  if(Object.keys(appData).length)
  {
    appData.changed = Math.round(Date.now()/1000);
    if(!existing[0]?.submitted)
      appData.submitted = Math.round(Date.now()/1000);
  }
  Object.assign(appData, basicData);
  await client.moonlightrpg.database.insert("dnd", appData, ["id","permission"], blame);
  await client.moonlightrpg.database.insert("users", basicData, ["id","permission"]);
  return (await client.moonlightrpg.database.query("SELECT *,CAST(`id` AS CHAR) AS `id` FROM dnd WHERE id=?", user.id))[0];
};

client.moonlightrpg.appToEmbed = async function(app, isGM)
{
  console.log(`client.moonlightrpg.appToEmbed`, app);
  let user = await client.users.fetch(app.id);
  let embed = {
    title: `Moonlight RPG Player Application`,
    description: `For ${user}`,
    fields: [
      {name: `Submitted On`, value: `<t:${app.submitted}:D>`, inline:true},
      {name: `Last Changed`, value: `<t:${app.changed}:D>`, inline:true},
      {name: `Experience`, value: app.experience, inline:true},
      {name: `Timezone`, value: client.moonlightrpg.timezones.find(tz => tz.index == app.timezone_id)?.label},
      {name: `Sunday Availability`, value: app.sunday, inline:true},
      {name: `Monday Availability`, value: app.monday, inline:true},
      {name: `Tuesday Availability`, value: app.tuesday, inline:true},
      {name: `Wednesday Availability`, value: app.wednesday, inline:true},
      {name: `Thursday Availability`, value: app.thursday, inline:true},
      {name: `Friday Availability`, value: app.friday, inline:true},
      {name: `Saturday Availability`, value: app.saturday, inline:true},
      {name: `Preferences`, value: app.preferences},
      {name: `Comments`, value: app.comments},
    ],
  };
  if(isGM)
    embed.fields.push({name: `Notes`, value: app.notes});
  return embed;
};

client.moonlightrpg.gameToEmbed = async function(game)
{
  let gm = await client.users.fetch(game.dm);
  let players = Object.values(JSON.parse(game.players));
  players = players.map(async player => player.id ? (await client.users.fetch(player.id)).toString() : player.handle);
  players = await Promise.all(players);
  let advertiseData = JSON.parse(game.advertiseData);
  let embed = {
    title: game.group,
    description: game.notes,
    fields: [
      {name: `GM`, value: gm.toString(), inline:true},
      {name: `Game Index`, value: game.index, inline:true},
      {name: `Game System`, value: game.system, inline:true},
      {name: `Time`, value: game.time, inline:true},
      {name: `Players`, value: players.length?players.join('\n'):"None yet", inline:!players.length},
    ],
  };
  return embed;
};

client.moonlightrpg.fixAdverts = async function(triggeringUser)
{
  if(!config.advert_channel_id)
  {
    console.warn("["+(new Date()).toUTCString()+"]", `Cannot fix advertisement data because 'advert_channel_id' is invalid.`);
    return;
  }
  // Get all the saved advertisements in MySQL.
  let gamesWithAdvertData = await client.moonlightrpg.database.query("SELECT * FROM games WHERE `ended`=0 AND `advertiseData` NOT LIKE 'null'");
  for(let game of gamesWithAdvertData)
    game.advertiseData = JSON.parse(game.advertiseData);
  
  // Get all the posted advertisements in the channel.
  let channel = await client.channels.fetch(config.advert_channel_id);
  let messages = await channel.messages.fetch();
  let postedAdverts = messages.filter(m => m.author.id === client.user.id);
  
  console.log("["+(new Date()).toUTCString()+"]", `Checking ${postedAdverts.size} posted advertisements against ${gamesWithAdvertData.length} games with advertisement data.`);
  
  // Find all the games that point to a nonexistent message and empty their message/signup data. Needed if a message was manually deleted.
  let invalidMessageIds = [];
  for(let game of gamesWithAdvertData)
  {
    if(game.advertiseData.message && game.advertiseData.channel == config.advert_channel_id)
    {
      let foundMessageId = false;
      postedAdverts.each((advert) => {
        if(game.advertiseData.message == advert.id)
        {
          foundMessageId = true;
        }
      });
      if(!foundMessageId)
        invalidMessageIds.push(game);
    }
  }
  for(let game of invalidMessageIds)
  {
    game.advertiseData.message = null;
    game.advertiseData.signups = [];
    game.advertiseData.waitlist = [];
    await client.moonlightrpg.database.query("UPDATE games SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(game.advertiseData), game.index]);
  }
  
  // Find all the messages that aren't being pointed to by a game in the database. Figure out what game the message goes to and set its message pointer.
  let gameUpdates = 0;
  let failedUpdates = 0;
  let reactUpdates = 0;
  for(let kv of postedAdverts)
  {
    let advert = kv[1];
    for(let game of gamesWithAdvertData)
    {
      if(game.advertiseData.message == advert.id)
      {
        advert.game = game;
        break;
      }
      else
      {
        console.log("["+(new Date()).toUTCString()+"]", `Checking for possible game... Group Name: ${game.group}, Post Title: ${advert.embeds?.[0]?.title}`);
        if(game.group == advert.embeds?.[0]?.title)
        {
          advert.possibleGame = game;
        }
      }
    }
    if(!advert.game)
    {
      if(advert.possibleGame)
      {
        console.log("["+(new Date()).toUTCString()+"]", `No game found for message ID "${advert.id}," but it is probably "${advert.possibleGame.group}."`);
        advert.possibleGame.advertiseData.message = advert.id;
        await client.moonlightrpg.database.query("UPDATE games SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(advert.possibleGame.advertiseData), advert.possibleGame.index]);
        advert.game = advert.possibleGame;
        gameUpdates++;
      }
      else
      {
        console.log("["+(new Date()).toUTCString()+"]", `No game found for message ${advert.id}.`);
        failedUpdates++;
      }
    }
    
    if(advert.game)
    {
      // See if the reactions match the signups.
      let reaction = advert.reactions.resolve(client.moonlightrpg.advertReactEmoji);
      if(!reaction?.me)
        await advert.react(client.moonlightrpg.advertReactEmoji);
      if(!reaction)
        reaction = advert.reactions.resolve(client.moonlightrpg.advertReactEmoji);
      let reactors = await reaction?.users.fetch();
      if(!reactors)
      {
        console.warn("["+(new Date()).toUTCString()+"]", `Could not fetch reactions on message ${advert.id}.`);
        continue;
      }
      let allSignups = advert.game.advertiseData.signups.concat(advert.game.advertiseData.waitlist).concat(advert.game.advertiseData.ignore);
      for(let kv2 of reactors)
      {
        let reactor = kv2[1];
        if(reactor.id != client.user.id && reactor.id != advert.game.gm && allSignups.indexOf(reactor.id) == -1)
        {
          console.log("["+(new Date()).toUTCString()+"]", `User "${reactor.id}" has reacted but is not on the signup list. Processing their reaction now.`);
          client.emit("messageReactionUpdate", "added", reaction, reactor);
          reactUpdates++;
        }
      }
      for(let signup of allSignups)
      {
        if(!reactors.get(signup))
        {
          console.log("["+(new Date()).toUTCString()+"]", `User "${signup}" is on the signup list but has no reaction. Processing their reaction removal now.`);
          client.emit("messageReactionUpdate", "removed", reaction, await client.users.fetch(signup));
          reactUpdates++;
        }
      }
    }
  }
  
  /* TODO list:
  * Check the reactions on each message, and see if there are reactors that are not on the signups. Process their sign-up now.
  * Check if there's people on the signup list who are no longer reacted. Process their removed sign-up now.
  */
  let msgs = [];
  if(invalidMessageIds.length)
    msgs.push(`Fixed ${invalidMessageIds.length} games with advertisement data that pointed to an invalid message.`);
  if(gameUpdates || failedUpdates)
    msgs.push(`Fixed ${gameUpdates} advertisements whose games did not properly track their messages.` + (failedUpdates?` ${failedUpdates} failed.`:""));
  if(reactUpdates)
    msgs.push(`Fixed ${reactUpdates} reactions/sign-ups/cancellations that were not processed yet.`);
  if(msgs.length)
  {
    console.log("["+(new Date()).toUTCString()+"]", msgs.join("\n"));
    if(triggeringUser) triggeringUser.send(msgs.join("\n"));
  }
  else if(triggeringUser) triggeringUser.send("Nothing needed to be fixed.");
};

/******************************************************************************
*************************** Finish Initialization *****************************
******************************************************************************/

Promise.all([promiseLogin, client.moonlightrpg.database.init()]).then(async results => {
  
  client.reloadSlashCmds();
  
  let promiseMySQL = await client.moonlightrpg.database.query("SELECT * FROM games WHERE `ended`=0 AND `advertiseData`->'$.closed'=0").then(results => {
    console.log("["+(new Date()).toUTCString()+"]", "MySQL connection established successfully. Active games with saved advertisements:");
    let advertisements = [];
    for(let game of results)
    {
      let data = JSON.parse(game.advertiseData);
      advertisements.push(data);
      console.log("["+(new Date()).toUTCString()+"]", `  GM: ${game.dm} | MessageID: ${data.message} | Signups: ${data.signups.length}/${data.limit} | Waitlist: ${data.waitlist.length} | Title: ${game.group}`);
    }
    return advertisements;
  }, err => {
    console.error("["+(new Date()).toUTCString()+"]", "MySQL connection failed.", err);
    return [];
  });
  
  let num = 0;
  let errnum = 0;
  let notnum = 0;
  for(let data of promiseMySQL)
  {
    if(data.channel && data.message)
    {
      let channel = await client.channels.fetch(data.channel);
      let message = await channel.messages.fetch(data.message);
      if(message?.id)
        num++;
      else
        errnum++;
    }
    else
      notnum++;
  }
  console.log("["+(new Date()).toUTCString()+"]", `${num} existing advertisements fetched.`);
  if(errnum || notnum)
    client.moonlightrpg.fixAdverts();
  return promiseMySQL;
  
}, err => {
  
  console.error("["+(new Date()).toUTCString()+"]", "Failed to connect to Discord or MySQL. Bot shutting down because it can't work now. PM2 should reboot it; better luck next time. Error:", err);
  process.exit();
  return null;

});
