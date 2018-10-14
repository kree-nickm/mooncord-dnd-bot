// ------------- Initialization -------------
const Discord = require("discord.js");
const fs = require("fs");
const config = require("./config.json");/*
config.json should be saved in the same directory as this file and contain something like this:
{
	"token": "application-bot-secret-token",
	"prefix": "!",
	"guild_id": "193277318494420992",
	"channel_ids": ["##################","##################"],
	"admin_ids": ["##################","##################"],
	"dm_role_id": "##################",
	"google_sheet": "google-spreadsheet-id",
	"sheet_id": "worksheet-id",
	"handle_column": "discordhandlecolumnheader",
	"mysql_host": "hostname.or.ip",
	"mysql_user": "username",
	"mysql_pass": "password",
	"mysql_db": "database",
	"mysql_table": "table_with_apps",
	"mysql_column": "column_with_Discord_handle"
}
*/
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
		const event = require(`./client.events/${file}`);
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

client.login(config.token);
