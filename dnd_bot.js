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
const client = new Discord.Client();
client.config = config;

// ------------- Events -------------
client.reloadEvents = () => {
	fs.readdir("./client.events/", (err, files) => {
		if(err)
			return console.error("\x1b[41mFatal Error:\x1b[0m Unable to load Discord event handlers. %s", err);
		files.forEach(file => {
			if (!file.endsWith(".js"))
				return;
			var event = require(`./client.events/${file}`);
			var eventName = file.split(".")[0];
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
		//console.log(files);
		var cmdObject = client.commands;
		subdirs.forEach(subdir => cmdObject = cmdObject[subdir]);
		files.forEach(file => {
			if(file.isFile() && file.name.endsWith(".js"))
			{
				var command = require(`${dir}/${file.name}`);
				var commandName = file.name.split(".")[0];
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
		//console.log(client.commands);
	});
};
client.reloadCmds();

client.login(config.token);
