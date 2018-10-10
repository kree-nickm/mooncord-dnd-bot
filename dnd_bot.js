const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
/*
config.json should be saved in the same directory as this file and contain something like this:
{
	"token": "application-bot-secret-token",
	"prefix": "!",
	"channel_ids": ["##################","##################"],
	"admin_ids": ["##################","##################"],
	"dm_role_id": "##################"
}
*/

client.on("ready", () => {
	if(!Array.isArray(config.admin_ids))
		console.warn("Admin IDs not specified in config.json; specify the admins by listing their IDs in an array with the 'admin_ids' property.");
	if(config.dm_role_id == null)
		console.warn("DM role ID not specified in config.json; specify the ID of the DM role with the 'dm_role_id' property.");
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
			// TODO: Determine if someone who sends a direct message has the dungeon master role.
			let is_dm = message.member != null && Array.isArray(message.member._roles) && message.member._roles.indexOf(config.dm_role_id) != -1;
			if(param1 == "app")
			{
				// TODO: Query the app list for the app of the message author.
				// TODO: Allow a DM to tag someone with this command and get their app the same way.
				message.reply("Yes.");
			}
			else if((is_dm || is_admin) && param1 == "dm")
			{
				// Example of a DM-only command (admins can use them as well).
				message.reply("DM");
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
			}
			else
			{
				// Default response to any !dnd message that isn't covered above.
				message.reply("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form.");
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
	client.login(config.token);
