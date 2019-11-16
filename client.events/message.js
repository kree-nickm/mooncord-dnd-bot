module.exports = function(message)
{
	if(message.author.bot || !message.content.startsWith(this.config.prefix))
		return;
	message.from_admin = Array.isArray(this.config.admin_ids) && this.config.admin_ids.indexOf(message.author.id) != -1;
	//if(message.from_admin) console.log(message);
	var args = message.content.substr(this.config.prefix.length).trim().split(/ +/g);
	var command = args.shift().toLowerCase();
	if(typeof(this.commands[command]) == "object" && (message.channel.type == "dm" || this.config.channel_ids.indexOf(message.channel.id) != -1))
	{
		// Determine game master status.
		message.from_dm = false;
		if(message.member)
			message.member.roles.forEach(function(v,k,m){
				for(var i=0; i<this.dm_roles.length; i++)
				{
					if(v.id == this.dm_roles[i].id)
						message.from_dm = true;
				}
			}, this);
		
		// Spam protection.
		if(!(message.from_dm || message.from_admin))
		{
			if(this.last_command.global != null && ((new Date())-this.last_command.global) < this.command_frequency.global)
				return;
			if(this.last_command.user[message.author.id] != null && ((new Date())-this.last_command.user[message.author.id]) < this.command_frequency.perUser)
				return;
		}
		
		// Log to MySQL (rework this in future).
		//this.appList.logChannel(message, null);
		
		// Run the specified command using its stored function, or the default if the command is unknown.
		if(typeof(this.commands[command].run) == "function")
		{
			this.commands[command].run.call(this, message, args);
		}
		else
		{
			// TODO: Make recursive, because the command definitions are already recursive.
			var param1 = args.length ? args.shift().toLowerCase() : "";
			if(typeof(this.commands[command][param1]) == "object" && typeof(this.commands[command][param1].run) == "function")
				var success = this.commands[command][param1].run.call(this, message, args);
			else
				var success = false;
			
			// If command fails, run the default.
			if(!success)
			{
				args.unshift(param1);
				if(typeof(this.commands[command]['']) == "object" && typeof(this.commands[command][''].run) == "function")
					this.commands[command][''].run.call(this, message, args);
				else if(typeof(this.commands[command]['default']) == "object" && typeof(this.commands[command]['default'].run) == "function")
					this.commands[command]['default'].run.call(this, message, args);
			}
		}
		
		// Save most recent command timestamp for spam protection.
		this.last_command.global = new Date();
		this.last_command.user[message.author.id] = new Date();
		if(message.channel.type != "dm")
			this.last_command.channel[message.channel.id] = new Date();
	}
};
