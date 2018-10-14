// ------------- Initialization -------------
const Discord = require("discord.js");
const fs = require("fs");
const config = require("./config.json");
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

/* Uncomment these 2 lines to use Google Sheets API (and comment out the MySQL lines) */
const GoogleSheetsApplications = require('./applist/GoogleSheetsApplications.js');
const appList = new GoogleSheetsApplications(config.google_sheet, config.sheet_id, config.handle_column);
/* Uncomment these 2 lines to use MySQL (and comment out the Google Sheets API lines) */
//const MySQLApplications = require('./applist/MySQLApplications.js');
//const appList = new MySQLApplications(config.mysql_host, config.mysql_user, config.mysql_pass, config.mysql_db, config.mysql_table, config.mysql_column);

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
client.commands.dnd = {};
/* NOTE: The functions in these commands must all return true or false:
/* * true means they were executed by the bot as normal.
/* * false means they were ignored by the bot, and thus the default command should be run instead.
*/
fs.readdir("./client.events/message.commands/dnd", function(err, files){
	if(err)
		return console.error("\x1b[41mFatal Error:\x1b[0m Unable to load message command handlers. %s", err);
	files.forEach(function(file){
		if (!file.endsWith(".js"))
			return;
		var command = require(`./client.events/message.commands/dnd/${file}`);
		var commandName = file.split(".")[0];
		if(typeof(command) == "object" && typeof(command.run) == "function")
		{
			client.commands.dnd[commandName] = command;
			//delete require.cache[require.resolve(`./client.events/message.commands/dnd/${file}`)];
		}
		else
			console.warn("\x1b[1mWarning:\x1b[0m Found file for \x1b[1m%s\x1b[0m command, but it does not resolve into a valid command object.", commandName);
	});
});

client.login(config.token);
