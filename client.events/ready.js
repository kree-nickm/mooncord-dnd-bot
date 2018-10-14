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
		else if(this.config.dm_role_id == null)
			console.warn("\x1b[1mWarning:\x1b[0m DM role ID not specified in config.json; specify the ID of the DM role with the 'dm_role_id' property. Without this, the bot will not be able to identify dungeon masters.");
		else
		{
			var dm_role = mooncord_guild.roles.get(this.config.dm_role_id);
			if(dm_role == null)
				console.warn("\x1b[1mWarning:\x1b[0m The specified DM role ID was not found among the \x1b[1m%s\x1b[0m guild's roles. Without this, the bot will not be able to identify dungeon masters if a command is sent in a direct message.", mooncord_guild.name);
			else
			{
				this.dungeon_masters = dm_role.members;
				console.log("\x1b[1m%s\x1b[0m dungeon masters found.", this.dungeon_masters.size);
				// TODO: Have a command refresh this.
			}
		}
	}
	console.log("Mooncord D&D bot active.");
};
