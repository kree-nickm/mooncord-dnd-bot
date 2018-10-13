// ------------- Requirements -------------
const Discord = require("discord.js");
const Applications = require('./GoogleSheetsApplications.js');
const config = require("./config.json");
/*
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
	"handle_column": "discordhandlecolumnheader"
}
*/

// ------------- Initialization -------------
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
client.login(config.token);
const appList = new Applications(config.google_sheet, config.sheet_id, config.handle_column);

// ------------- Events -------------
var guild;
client.on("ready", function()
{
	if(!Array.isArray(config.channel_ids))
		console.warn("\x1b[1mWarning:\x1b[0m Channel IDs not specified in config.json; specify the valid channels by listing their IDs in an array with the 'channel_ids' property. Without this, the bot will only be able to respond to direct messages.");
	if(!Array.isArray(config.admin_ids))
		console.warn("\x1b[1mWarning:\x1b[0m Admin IDs not specified in config.json; specify the admins by listing their IDs in an array with the 'admin_ids' property. Without this, the bot will not be able to identify admins.");
	if(config.dm_role_id == null)
		console.warn("\x1b[1mWarning:\x1b[0m DM role ID not specified in config.json; specify the ID of the DM role with the 'dm_role_id' property. Without this, the bot will not be able to identify dungeon masters.");
	if(config.guild_id == null)
		console.warn("\x1b[1mWarning:\x1b[0m Guild ID not specified in config.json; specify the ID of the Mooncord guild with the 'guild_id' property. Without this, the bot will not be able to identify dungeon masters if a command is sent in a direct message.");
	else
	{
		guild = client.guilds.get(config.guild_id);
		if(guild == null)
			console.warn("\x1b[1mWarning:\x1b[0m This bot does not appear to be a member of the specified Mooncord guild. Without this, the bot will not be able to identify dungeon masters if a command is sent in a direct message.");
		else
			console.log("Using guild: "+ guild.name);
	}
	console.log("Mooncord D&D bot active.");
});

client.on("message", function(message)
{
	if(message.author.bot || !message.content.startsWith(config.prefix))
		return;
	console.log(message);
	var args = message.content.substr(config.prefix.length).trim().split(/ +/g);
	var command = args.shift().toLowerCase();
	if(command == "dnd" && (message.channel.type == "dm" || config.channel_ids.indexOf(message.channel.id) != -1))
	{
		if(message.channel.type == "dm" && guild != null)
			guild.fetchMember(message.author).then(process_command.bind(this,message,args));
		else
			process_command.call(this, message, args, message.member);
	}
});

client.on("error", (e) => console.error("\x1b[31mError:\x1b[0m %s", e));
client.on("warn", (e) => console.warn("\x1b[1mWarning:\x1b[0m %s", e));
//client.on("debug", (e) => console.info("\x1b[37m%s\x1b[0m", e));

// ------------- The Work -------------
// The rate limit for commands. The bot will not respond faster than this unless it is a dungeon master or an admin making the command.
var command_frequency = {
	global: 1000, // This applies to all of this bot's messages everywhere. Ex. if two different people send whispered commands within this period, the second will be ignored.
	perUser: 5000, // This applies to an individual person's commands.
	perChannel: 30000, // This applies to individual channels. Though only DM commands go to the channel, which bypass the limit, so maybe this is useless.
};
var last_command = {
	user: {},
	channel: {},
};
// TODO: Detect if one person is spamming and ban them.
function process_command(message, args, member)
{
	if(!(is_dm || is_admin))
	{	// Yeah I know this doesn't need to be split up if statements, but it's way easier to read this way.
		if(last_command.global != null && ((new Date())-last_command.global) < command_frequency.global)
			return;
		if(last_command.user[message.author.id] != null && ((new Date())-last_command.user[message.author.id]) < command_frequency.perUser)
			return;
	}
	// TODO: Emote codes below, but they might not work on a bot. If not, edit all the replies to get rid of them.
	// <:moon2T:284219508615413761> <:moon2S:496519208549613568> <:moon2N:497606808542642176> <:moon2PH:482219761699389450> <:moon2A:430810259620364309>
	var is_admin = Array.isArray(config.admin_ids) && config.admin_ids.indexOf(message.author.id) != -1;
	var is_dm = member != null && Array.isArray(member._roles) && member._roles.indexOf(config.dm_role_id) != -1;
	var param1 = args.length ? args.shift().toLowerCase() : "";
	if(param1 == "app")
	{
		if(appList.ready)
		{
			if((is_dm || is_admin) && message.mentions.users.size)
			{
				var targetid = message.mentions.users.first().id;
				var handle = message.mentions.users.first().username +"#"+ message.mentions.users.first().discriminator
				var myself = false;
			}
			else
			{
				var targetid = message.author.id;
				var handle = message.author.username +"#"+ message.author.discriminator
				var myself = true;
			}
			var apps = appList.findAllAppsByHandle(handle);
			if(apps.length > 1)
			{
				if(myself)
					message.author.send("Woah, "+ apps.length +" applications were found with your Discord handle.");
				else
					message.reply("Woah, "+ apps.length +" applications were found for <@"+ targetid +">.");
			}
			else if(apps.length == 1)
			{
				if(myself)
					message.author.send("Your application has been found. It looks like you submitted it on "+ apps[0].timestamp +". <:moon2S:496519208549613568>");
				else
					message.reply("An application has been found for <@"+ targetid +">. It looks like it was submitted on "+ apps[0].timestamp +". <:moon2S:496519208549613568>");
			}
			else
			{
				if(myself)
					message.author.send("There doesn't seem to be an application for you. <:moon2N:497606808542642176>");
				else
					message.reply("There doesn't seem to be an application for <@"+ targetid +">. <:moon2N:497606808542642176>");
			}
		}
		else
		{
			console.warn("Application list is not loaded for some reason.");
			message.reply("I'm unable to access the list of applications right now. <:moon2PH:482219761699389450> Ask a DM to !dnd refresh and that might fix it.");
		}
	}
	else if(param1 == "lastrefresh")
	{
		// TODO: This is probably only relavent for Google Sheets applications; I don't think MySQL will ever need to refresh. But we'll see.
		if(typeof(appList.loadApplications) == "function")
			message.author.send("The application list was last refreshed "+ Math.round(((new Date()) - last_refresh)/1000) +" seconds ago. <:moon2S:496519208549613568>");
		else
			message.author.send("The refresh command is not necessary with the current application list. The results should always be up to date. <:moon2S:496519208549613568>");
	}
	else if((is_dm || is_admin) && param1 == "refresh")
	{
		// Example of a DM-only command (admins can use them as well).
		// TODO: This is probably only relavent for Google Sheets applications; I don't think MySQL will ever need to refresh. But we'll see.
		clearTimeout(refresh_timer);
		if(typeof(appList.loadApplications) == "function")
		{
			appList.loadApplications(function(success){
				if(success)
				{
					message.author.send("I've now memorized the current list of applications. <:moon2S:496519208549613568>");
					last_refresh = new Date();
				}
				else
					message.author.send("There was a problem when I tried to fetch the applications. <:moon2N:497606808542642176>");
				refresh_timer = setTimeout(periodic_refresh, refresh_frequency);
			});
		}
		else
			message.author.send("The refresh command is not necessary with the current application list. The results should always be up to date. <:moon2S:496519208549613568>");
	}
	else if(is_admin && param1 == "reloadconfig")
	{
		// TODO: Replace this with some commands that modify the values directly rather than just reloading the config.json file on the host computer.
		// Example of an admin-only command.
		var temp = require("./config.json");
		for(var i in config)
			delete config[i];
		for(var i in temp)
			config[i] = temp[i];
		message.author.send("'config.json' has been reloaded. <:moon2N:497606808542642176>");
		console.log("config.json reloaded via admin command.");
	}
	else
	{
		// Default response to any !dnd message that isn't covered above.
		if(is_dm || is_admin)
			message.reply("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. <:moon2S:496519208549613568>");
		else
			message.author.send("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. <:moon2S:496519208549613568>");
	}
	last_command.global = new Date();
	last_command.user[message.author.id] = new Date();
	if(message.channel.type != "dm")
		last_command.channel[message.channel.id] = new Date();
}

var refresh_frequency = 3600000;
var last_refresh = new Date();
var refresh_timer = setTimeout(periodic_refresh, refresh_frequency);
function periodic_refresh()
{
	clearTimeout(refresh_timer);
	if(typeof(appList.loadApplications) == "function")
	{
		appList.loadApplications(function(success){
			if(success)
				last_refresh = new Date();
			refresh_timer = setTimeout(periodic_refresh, refresh_frequency);
		});
	}
}
