module.exports = function(message)
{
	if(message.author.bot || !message.content.startsWith(this.config.prefix))
		return;
	//console.log(message);
	message.from_admin = Array.isArray(this.config.admin_ids) && this.config.admin_ids.indexOf(message.author.id) != -1;
	var args = message.content.substr(this.config.prefix.length).trim().split(/ +/g);
	var command = args.shift().toLowerCase();
	if(command == "dnd" && (message.channel.type == "dm" || this.config.channel_ids.indexOf(message.channel.id) != -1))
	{
		message.from_dm = this.dungeon_masters != null && this.dungeon_masters.get(message.author.id) != null;
		if(!(message.from_dm || message.from_admin))
		{	// Yeah I know this doesn't need to be split up 'if' statements, but it's way easier to read this way.
			if(this.last_command.global != null && ((new Date())-this.last_command.global) < this.command_frequency.global)
				return;
			if(this.last_command.user[message.author.id] != null && ((new Date())-this.last_command.user[message.author.id]) < this.command_frequency.perUser)
				return;
		}
		
		// TODO: Emote codes below, but they might not work on a bot. If not, edit all the replies to get rid of them.
		// <:moon2T:284219508615413761> <:moon2S:496519208549613568> <:moon2N:497606808542642176> <:moon2PH:482219761699389450> <:moon2A:430810259620364309>
		var param1 = args.length ? args.shift().toLowerCase() : "";
		if(this.commands.dnd[param1] != null)
			var success = this.commands.dnd[param1].run.call(this, message, args);
		else
			var success = false;
		if(!success)
			this.commands.dnd['default'].run.call(this, message, args);
		
		this.last_command.global = new Date();
		this.last_command.user[message.author.id] = new Date();
		if(message.channel.type != "dm")
			this.last_command.channel[message.channel.id] = new Date();
	}
};
