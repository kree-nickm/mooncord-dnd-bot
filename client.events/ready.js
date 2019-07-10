module.exports = function()
{
	if(!Array.isArray(this.config.channel_ids))
		console.warn("\x1b[1mWarning:\x1b[0m Channel IDs not specified in config.json; specify the valid channels by listing their IDs in an array with the 'channel_ids' property. Without this, the bot will only be able to respond to direct messages.");
	if(!Array.isArray(this.config.admin_ids))
		console.warn("\x1b[1mWarning:\x1b[0m Admin IDs not specified in config.json; specify the admins by listing their IDs in an array with the 'admin_ids' property. Without this, the bot will not be able to identify admins.");
	if(this.config.guild_id == null)
		console.warn("\x1b[1mWarning:\x1b[0m Guild ID not specified in config.json; specify the ID of the Mooncord guild with the 'guild_id' property. Without this, the bot will not be able to identify dungeon masters if a command is sent in a direct message.");
	else
	{
		var mooncord_guild = this.guilds.get(this.config.guild_id);
		if(mooncord_guild == null)
			console.warn("\x1b[1mWarning:\x1b[0m This bot does not appear to be a member of the specified Mooncord guild. Without this, the bot will not be able to identify dungeon masters if a command is sent in a direct message.");
		else if(this.config.dm_role_ids == null)
			console.warn("\x1b[1mWarning:\x1b[0m DM role IDs not specified in config.json; specify the ID of the DM roles with the 'dm_role_ids' property. Without this, the bot will not be able to identify dungeon masters.");
		else
		{
			this.dm_roles = [];
			for(var i in this.config.dm_role_ids)
			{
				var role = mooncord_guild.roles.get(this.config.dm_role_ids[i]);
				if(role == null)
					console.warn("\x1b[1mWarning:\x1b[0m The specified DM role ID '%s' was not found among the \x1b[1m%s\x1b[0m guild's roles.", this.config.dm_role_ids[i], mooncord_guild.name);
				else
					this.dm_roles.push(role);
			}
		}
	}
	this.website = "http://www.moonlightdnd.com/";
	this.emoji = {};
	this.emojis.forEach((function(emoji){
		if(!emoji.deleted)
			this.emoji[emoji.name] = emoji.toString();
	}).bind(this));
	//console.log(this.emoji);
	// The rate limit for commands (milliseconds). The bot will not respond faster than this unless it is a dungeon master or an admin making the command.
	this.command_frequency = {
		global: 1000, // This applies to all of this bot's messages everywhere. Ex. if two different people send commands, even in whisper, within this period, the second one will be ignored.
		perUser: 5000, // This applies to an individual person's commands.
		perChannel: 30000, // This applies to individual channels. Though only DM commands go to the channel, which bypass the limit, so maybe this is useless.
	};
	this.last_command = {
		user: {},
		channel: {},
	};
	// TODO: Detect if one person is spamming and ban them.
	this.refresh_frequency = 3600000;
	this.last_refresh = new Date();
	this.periodic_refresh = function(callback){
		this.clearTimeout(this.refresh_timer);
		if(this.appList != null && typeof(this.appList.loadApplications) == "function")
		{
			this.appList.loadApplications((function(success){
				if(success)
					this.last_refresh = new Date();
				this.refresh_timer = this.setTimeout(this.periodic_refresh, this.refresh_frequency);
				if(typeof(callback) == "function")
					callback.call(this, success);
			}).bind(this));
		}
	};
	this.refresh_timer = this.setTimeout(this.periodic_refresh, this.refresh_frequency);
	console.log("Mooncord D&D bot active.");
};
