module.exports = function(message)
{
	if(message.author.bot || !message.content.startsWith(this.config.prefix))
		return;
	//console.log(message);
	message.from_admin = Array.isArray(this.config.admin_ids) && this.config.admin_ids.indexOf(message.author.id) != -1;
	var args = message.content.substr(this.config.prefix.length).trim().split(/ +/g);
	var command = args.shift().toLowerCase();
	if(typeof(this.commands[command]) == "object" && (message.channel.type == "dm" || this.config.channel_ids.indexOf(message.channel.id) != -1))
	{
		message.from_dm = false;
		if(message.member)
			message.member.roles.forEach(function(v,k,m){
				for(var i=0; i<this.dm_roles.length; i++)
				{
					if(v.id == this.dm_roles[i].id)
						message.from_dm = true;
				}
			}, this);
		if(!(message.from_dm || message.from_admin))
		{
			// Yeah I know this doesn't need to be split up 'if' statements, but it's way easier to read this way.
			if(this.last_command.global != null && ((new Date())-this.last_command.global) < this.command_frequency.global)
				return;
			if(this.last_command.user[message.author.id] != null && ((new Date())-this.last_command.user[message.author.id]) < this.command_frequency.perUser)
				return;
		}
		this.appList.logChannel(message, null);
		if(typeof(this.commands[command].run) == "function")
		{
			this.commands[command].run.call(this, message, args);
		}
		else
		{
			var param1 = args.length ? args.shift().toLowerCase() : "";
			if(typeof(this.commands[command][param1]) == "object" && typeof(this.commands[command][param1].run) == "function")
				var success = this.commands[command][param1].run.call(this, message, args);
			else
				var success = false;
			if(!success)
			{
				args.unshift(param1);
				if(typeof(this.commands[command]['']) == "object" && typeof(this.commands[command][''].run) == "function")
					this.commands[command][''].run.call(this, message, args);
				else if(typeof(this.commands[command]['default']) == "object" && typeof(this.commands[command]['default'].run) == "function")
					this.commands[command]['default'].run.call(this, message, args);
			}
		}
		this.last_command.global = new Date();
		this.last_command.user[message.author.id] = new Date();
		if(message.channel.type != "dm")
			this.last_command.channel[message.channel.id] = new Date();
	}
};
