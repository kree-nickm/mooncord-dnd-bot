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
		"token": process.env.token,
		"prefix": process.env.prefix,
		"guild_id": process.env.guild_id,
		"channel_ids": process.env.channel_ids.split(","),
		"admin_ids": process.env.admin_ids.split(","),
		"dm_role_ids": process.env.dm_role_ids.split(","),
		"signup_delay": process.env.signup_delay,
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
const { Client, Intents } = require('discord.js');
const client = new Client({
   intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.DIRECT_MESSAGES,
   ],
   partials: [
      "CHANNEL",
      "MESSAGE",
      "REACTION",
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
	fs.readdir(dir, {encoding:"utf8",withFileTypes:true}, (err, files) => {
		if(err)
			return console.error("["+(new Date()).toUTCString()+"]", "\x1b[41mFatal Error:\x1b[0m Unable to load message command handlers. %s", err);
		let cmdObject = client.commands;
		subdirs.forEach(subdir => cmdObject = cmdObject[subdir]);
		files.forEach(file => {
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
					console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Found file \x1b[1m%s\x1b[0m for command, but it does not resolve into a valid command object.", `${dir}/${file.name}`);
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
		});
	});
};
client.reloadCmds();

let promiseLogin = client.login(client.config.token);
promiseLogin.then(result => console.log("["+(new Date()).toUTCString()+"]", "Bot successfully logged in to Discord."));

/******************************************************************************
****************************** Initialize MySQL *******************************
******************************************************************************/

// -- Setup --

const mysql = require("mysql");
const database = mysql.createPool({
   host: config.mysql_host,
   user: config.mysql_user,
   password: config.mysql_pass,
   database: config.mysql_db,
});

database.queryPromise = function()
{
   let queryArgs = Array.prototype.slice.call(arguments);
   return new Promise((resolve,reject) => {
      queryArgs.push((err, results, fields) => {
         if(err)
            reject(err);
         else
            resolve(results);
      });
      this.query.apply(this, queryArgs);
   });
};

// -- Init --

let promiseMySQL = database.queryPromise("SELECT * FROM games WHERE `ended`=0 AND `advertiseData` NOT LIKE 'null'").then(results => {
   console.log("["+(new Date()).toUTCString()+"]", "MySQL connection established successfully. Active games with saved advertisements:");
   client.moonlightrpg.database = database;
   let advertisements = [];
   for(let game of results)
   {
      let data = JSON.parse(game.advertiseData);
      advertisements.push(data);
      console.log("["+(new Date()).toUTCString()+"]", `   GM: ${game.dm} | MessageID: ${data.message} | Signups: ${data.signups.length}/${data.limit} | Waitlist: ${data.waitlist.length} | Title: ${game.group}`);
   }
   return advertisements;
}, err => {
   console.error("["+(new Date()).toUTCString()+"]", "MySQL connection failed.", err);
   return [];
});

client.moonlightrpg.fixAdverts = async function(triggeringUser)
{
   // Get all the saved advertisements/data.
   let gamesWithAdvertData = await database.queryPromise("SELECT * FROM games WHERE `ended`=0 AND `advertiseData` NOT LIKE 'null'");
   for(let game of gamesWithAdvertData)
      game.advertiseData = JSON.parse(game.advertiseData);
   let channel = await client.channels.fetch(config.advert_channel_id);
   let messages = await channel.messages.fetch();
   let postedAdverts = messages.filter(m => m.author.id === client.user.id);
   console.log("["+(new Date()).toUTCString()+"]", `Checking ${postedAdverts.size} posted advertisements against ${gamesWithAdvertData.length} games with advertisement data.`);
   
   // Find all the games that point to a nonexistent message and empty their message/signup data. Needed if a message was manually deleted.
   let invalidMessageIds = [];
   for(let game of gamesWithAdvertData)
   {
      if(game.advertiseData.message)
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
      await database.queryPromise("UPDATE games SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(game.advertiseData), game.index]);
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
            await database.queryPromise("UPDATE games SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(advert.possibleGame.advertiseData), advert.possibleGame.index]);
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

Promise.all([promiseLogin, promiseMySQL]).then(async results => {
   
   let num = 0;
   let errnum = 0;
   let notnum = 0;
   for(let data of results[1])
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
   return results[1];
   
}, err => {
   
   console.error("["+(new Date()).toUTCString()+"]", num +" failed to connect to Discord or MySQL. Bot shutting down because it can't work now. PM2 should reboot it; better luck next time. Error:", err);
   process.exit();
   return null;

});
