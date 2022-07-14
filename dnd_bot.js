/******************************************************************************
************************** Initialize Configuration ***************************
******************************************************************************/

console.log("");
console.log("********************************************************************************");
console.log("****************************** MoonlightRPG Bot ********************************");
console.log("********************************************************************************");
console.log("");
   
const fs = require("fs");
var config;
if(fs.existsSync("config.json"))
{
	config = require("./config.json");
}
else
{
	console.log("config.json not found, attempting to use environment variables.");
	config = {
		"token": process.env.token,
		"prefix": process.env.prefix,
		"guild_id": process.env.guild_id,
		"channel_ids": process.env.channel_ids.split(","),
		"admin_ids": process.env.admin_ids.split(","),
		"dm_role_ids": process.env.dm_role_ids.split(","),
		"mysql_host": process.env.mysql_host,
		"mysql_user": process.env.mysql_user,
		"mysql_pass": process.env.mysql_pass,
		"mysql_db": process.env.mysql_db,
	};
}
if(typeof(config) !== "object")
{
	console.error("\x1b[41mFatal Error:\x1b[0m config.json is not loaded.");
	return false;
}
else if(config.token == null)
{
	console.error("\x1b[41mFatal Error:\x1b[0m Bot token not specified in config.json; specify the token with the 'token' property.");
	return false;
}
else if(config.prefix == null)
{
	console.error("\x1b[41mFatal Error:\x1b[0m Prefix not specified in config.json; specify the prefix with the 'prefix' property.");
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
			return console.error("\x1b[41mFatal Error:\x1b[0m Unable to load Discord event handlers. %s", err);
		files.forEach(file => {
			if (!file.endsWith(".js"))
				return;
         let event = require(`./client.events/${file}`);
         let eventName = file.split(".")[0];
         if(typeof(event) == "function")
            client.on(eventName, event);
         else
            console.warn("\x1b[1mWarning:\x1b[0m Found file for \x1b[1m%s\x1b[0m event, but it does not resolve into a valid function.", eventName);
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
			return console.error("\x1b[41mFatal Error:\x1b[0m Unable to load message command handlers. %s", err);
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
					console.warn("\x1b[1mWarning:\x1b[0m Found file \x1b[1m%s\x1b[0m for command, but it does not resolve into a valid command object.", `${dir}/${file.name}`);
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
promiseLogin.then(result => console.log("Bot successfully logged in to Discord."));

/******************************************************************************
****************************** Initialize MySQL *******************************
******************************************************************************/
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

let promiseMySQL = database.queryPromise("SELECT * FROM games WHERE `advertiseData`->'$.message'").then(results => {
   client.moonlightrpg.database = database;
   client.moonlightrpg.advertisements = [];
   for(let game of results)
   {
      let data = JSON.parse(game.advertiseData);
      data.game = game.index;
      data.gm = game.dm;
      client.moonlightrpg.advertisements.push(data);
   }
   return client.moonlightrpg.advertisements;
});

/*
let promiseMySQL = new Promise((resolve,reject) => {
   database.query("SELECT * FROM games WHERE `advertiseData`->'$.message'", function(err, results, fields){
      if(err)
         reject(err);
      else
      {
         client.moonlightrpg.database = database;
         client.moonlightrpg.advertisements = [];
         for(let game of results)
         {
            let data = JSON.parse(game.advertiseData);
            data.game = game.index;
            data.gm = game.dm;
            client.moonlightrpg.advertisements.push(data);
         }
         resolve(client.moonlightrpg.advertisements);
      }
   });
});
*/

promiseMySQL.then(result => {
   console.log("MySQL connection established successfully. Advertisements found:");
   for(let row of result)
      console.log(`    "${row.title}" | GameID: ${row.game} | Signups: ${row.signups.length}/${row.limit} | Waitlist: ${row.waitlist.length}`);
   console.log("");
}, err => {
   console.error("MySQL connection failed.", err);
});

/******************************************************************************
*************************** Finish Initialization *****************************
******************************************************************************/

Promise.all([promiseLogin, promiseMySQL]).then(async result => {
   for(let data of client.moonlightrpg.advertisements)
   {
      let channel = await client.channels.fetch(data.channel);
      let message = await channel.messages.fetch(data.message);
      // TODO: If the message has been deleted or reactions changed while the bot was down, inform the database.
   }
   console.log("Existing advertisements fetched.");
});
