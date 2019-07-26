// ------------- Initialization -------------
const Discord = require("discord.js");
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
		
		"socks_connection": process.env.FIXIE_SOCKS_HOST
	};
}
if(typeof(config) != "object")
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
const client = new Discord.Client();
client.config = config;

const MySQLApplications = require('./applist/MySQLApplications.js');
const appList = new MySQLApplications(config.mysql_host, config.mysql_user, config.mysql_pass, config.mysql_db, config.socks_connection);

client.appList = appList;

// ------------- Events -------------
fs.readdir("./client.events/", function(err, files){
	if(err)
		return console.error("\x1b[41mFatal Error:\x1b[0m Unable to load Discord event handlers. %s", err);
	files.forEach(function(file){
		if (!file.endsWith(".js"))
			return;
		var event = require(`./client.events/${file}`);
		var eventName = file.split(".")[0];
		if(typeof(event) == "function")
		{
			client.on(eventName, event);
			//delete require.cache[require.resolve(`./client.events/${file}`)];
		}
		else
			console.warn("\x1b[1mWarning:\x1b[0m Found file for \x1b[1m%s\x1b[0m event, but it does not resolve into a valid function.", eventName);
	});
});

client.commands = {};
/* NOTE: The functions in these commands must all return true or false:
/* * true means they were executed by the bot as normal.
/* * false means they were ignored by the bot, and thus the default command should be run instead.
*/
(function parseMessageDirectory(dir, subdirs)
{
	fs.readdir(dir, {encoding:"utf8",withFileTypes:true}, function(err, files){
		if(err)
			return console.error("\x1b[41mFatal Error:\x1b[0m Unable to load message command handlers. %s", err);
		//console.log(files);
		var cmdObject = client.commands;
		subdirs.forEach(function(subdir){
			cmdObject = cmdObject[subdir];
		});
		files.forEach(function(file){
			if(file.isFile() && file.name.endsWith(".js"))
			{
				var command = require(`${dir}/${file.name}`);
				var commandName = file.name.split(".")[0];
				if(commandName != "" && typeof(command) == "object" && typeof(command.run) == "function")
				{
					if(typeof(cmdObject[commandName]) == "object")
						cmdObject[commandName][''] = command;
					else
						cmdObject[commandName] = command;
					//delete require.cache[require.resolve(`${dir}/${file.name}`)];
				}
				else
					console.warn("\x1b[1mWarning:\x1b[0m Found file \x1b[1m%s\x1b[0m for command, but it does not resolve into a valid command object.", `${dir}/${file.name}`);
			}
			else if(file.isDirectory())
			{
				if(typeof(cmdObject[file.name]) == "object" && typeof(cmdObject[file.name].run) == "function")
					cmdObject[file.name] = {'':cmdObject[file.name]};
				else
					cmdObject[file.name] = {};
				parseMessageDirectory(dir +"/"+ file.name, subdirs.concat([file.name]));
			}
		});
		//console.log(client.commands);
	});
})("./client.events/message.commands", []);


client.login(config.token);
