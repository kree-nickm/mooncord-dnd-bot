const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('./credentials.json');
/*
config.json should be saved in the same directory as this file and contain something like this:
{
	"token": "application-bot-secret-token",
	"prefix": "!",
	"guild_id": "##################",
	"channel_ids": ["##################","##################"],
	"admin_ids": ["##################","##################"],
	"dm_role_id": "##################",
	"google_sheet": "google-spreadsheet-id",
	"sheet_id": "worksheet-id",
	"handle_column": "discordhandlecolumnheader"
}
*/
var sheet;
var all_apps;
var guild;

client.on("ready", () => {
	if(!Array.isArray(config.admin_ids))
		console.warn("Admin IDs not specified in config.json; specify the admins by listing their IDs in an array with the 'admin_ids' property.");
	if(config.dm_role_id == null)
		console.warn("DM role ID not specified in config.json; specify the ID of the DM role with the 'dm_role_id' property.");
	if(config.guild_id == null)
		console.warn("Guild ID not specified in config.json; specify the ID of the Mooncord guild with the 'guild_id' property.");
	else
	{
		guild = client.guilds.get(config.guild_id);
		if(guild == null)
			console.warn("This bot does not appear to be a member of the specified Mooncord guild.");
		else
			console.warn("Using guild: "+ guild.name);
	}
	doc.useServiceAccountAuth(creds, function(err){
		if(err == null)
			console.log("Logged into Google Drive.");
		doc.getInfo(function(err,info){
			for(var i in info.worksheets)
			{
				//console.log("Sheet found: ", info.worksheets[i]);
				if(info.worksheets[i].id == config.sheet_id)
				{
					sheet = info.worksheets[i];
					console.log("Application list found.");
					break;
				}
			}
			if(sheet == null)
				console.error("Application list was NOT found.");
			else
			{
				sheet.getRows({orderby:config.handle_column}, function(err,info){
					if(err != null)
						console.warn("Error when trying to read list of applications: ", err);
					else
					{
						all_apps = info;
						console.log("Application list read into memory.");
					}
				});
			}
		});
	});
	console.log("Mooncord D&D bot active.");
});

client.on("message", (message) => {
	try
	{
		if(message.author.bot || !message.content.startsWith(config.prefix))
			return;
		console.log(message);
		
		let args = message.content.slice(config.prefix.length).trim().split(/ +/g);
		let command = args.shift().toLowerCase();
		if(command == "dnd" && (message.channel.type == "dm" || config.channel_ids.indexOf(message.channel.id) != -1))
		{
			// TODO: Make all of the following responses direct messages (I think).
			let param1 = args.length ? args.shift().toLowerCase() : "";
			let is_admin = Array.isArray(config.admin_ids) && config.admin_ids.indexOf(message.author.id) != -1;
			var member = message.member;
			if(message.channel.type == "dm" && guild != null)
				guild.fetchMember(message.author).then(function(mem){member = mem;});
			// TODO: The above doesn't actually work because it's asynchronous; `member` won't be set by the time this function moves on. Find a way to do it synchronously or this function will have to be sequenced.
			let is_dm = member != null && Array.isArray(member._roles) && member._roles.indexOf(config.dm_role_id) != -1;
			if(param1 == "app")
			{
				if(Array.isArray(all_apps))
				{
					if((is_dm || is_admin) && message.mentions.users.size)
					{
						var handle = message.mentions.users.first().username +"#"+ message.mentions.users.first().discriminator
						var myself = false;
					}
					else
					{
						var handle = message.author.username +"#"+ message.author.discriminator
						var myself = true;
					}
					var app = findAppByHandle(handle, all_apps);
					if(app != false)
					{
						if(myself)
							message.reply("Your application has been found. It looks like you submitted it on "+ app.timestamp);
						else
							message.reply("An application was found for @"+ handle +" submitted on "+ app.timestamp);
						//console.log(app);
					}
					else
					{
						if(myself)
							message.reply("No application found for @"+ handle +".");
						else
							message.reply("There doesn't seem to be an application for you. Head to https://goo.gl/forms/vLASDQVIjfGVMfTS2 to fill one out.");
					}
				}
				else
				{
					console.warn("Application list is not loaded for some reason.");
					message.reply("I'm unable to access the list of applications right now. Ask a DM to !dnd refresh and that might fix it. :(");
				}
			}
			else if((is_dm || is_admin) && param1 == "refresh")
			{
				// Example of a DM-only command (admins can use them as well).
				if(sheet != null)
				{
					sheet.getRows({orderby:config.handle_column}, function(err,info){
						if(err != null)
						{
							message.reply("There was a problem when I tried to fetch the applications. :(");
							console.warn("Error when trying to read list of applications: ", err);
						}
						else
						{
							all_apps = info;
							message.reply("I've now memorized the current list of applications. :)");
							console.log("Application list read into memory via DM command.");
						}
					});
				}
				else
				{
					message.reply("I'm unable to access the list of applications right now. :(");
					console.error("Application list was NOT found (triggered by command).");
				}
			}
			else if(is_admin && param1 == "reloadconfig")
			{
				// Example of an admin-only command.
				let temp = require("./config.json");
				for(var i in config)
					delete config[i];
				for(var i in temp)
					config[i] = temp[i];
				message.reply("'config.json' has been reloaded.");
				console.log("config.json reloaded via admin command.");
			}
			else
			{
				// Default response to any !dnd message that isn't covered above.
				message.reply("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. :)");
			}
		}
	}
	catch(x)
	{
		console.error(x);
	}
});

if(config.token == null)
	console.error("Bot token not specified in config.json; specify the token with the 'token' property.");
else if(config.prefix == null)
	console.error("Prefix not specified in config.json; specify the prefix with the 'prefix' property.");
else if(!Array.isArray(config.channel_ids))
	console.error("Channel IDs not specified in config.json; specify the valid channels by listing their IDs in an array with the 'channel_ids' property.");
else
{
	var doc = new GoogleSpreadsheet(config.google_sheet);
	client.login(config.token);
}

function findAppByHandle(handle, rowSet)
{
	if(rowSet.length == 0)
		return false;
	var i = Math.floor(rowSet.length/2);
	var comp = handle.toLowerCase().localeCompare(rowSet[i][config.handle_column].toLowerCase());
	if(comp < 0)
		return findAppByHandle(handle, rowSet.slice(0, i));
	else if(comp > 0)
		return findAppByHandle(handle, rowSet.slice(i, rowSet.length));
	else
	{
		return rowSet[i];
	}
}