exports.run = function(message, args)
{
	var options = {embed:{fields:[]}};
	
	var addField = (function(string, command, uselong){
		var name = string;
		var value = "Type `!help "+ string +"` for more information on this command.";
		if(typeof(command.run) == "function")
		{
			if(typeof(command.help) == "object")
			{
				if(typeof(command.help.format) == "string")
					name = command.help.format;
				if(typeof(command.help.short) == "string")
				{
					value = command.help.short;
					if(typeof(command.help.long) == "string")
					{
						if(uselong)
							value += " "+ command.help.long;
						else
							value += "\nType `!help "+ string +"` for more information on this command.";
					}
				}
				else if(typeof(command.help.long) != "string")
					value = "No information is available on this command.";
			}
			else
				value = "No information is available on this command.";
		}
		options.embed.fields.push({
			name: this.config.prefix + name,
			value: value
		});
	}).bind(this);
	
	var buildOptions = (function(cmdObject, subArgs){
		Object.keys(cmdObject).forEach(function(cmd){
			if(subArgs.length > 0 || cmd != "help")
				addField(subArgs.join(" ") + (subArgs.length?" ":"") + cmd, cmdObject[cmd], false);
		}, this);
	}).bind(this);
	
	var handleArguement = (function(argNum){
		var command = this.commands;
		var subArgs = [];
		var i;
		for(i=0; i<argNum; i++)
		{
			command = command[args[i]];
			subArgs.push(args[i]);
		}
		if(typeof(command.run) == "function")
		{
			addField(args.join(" "), command, true);
		}
		else if(typeof(command[args[i]]) == "object")
		{
			handleArguement(argNum+1);
		}
		else
		{
			buildOptions(command, [args[0],args[1]]);
		}
	}).bind(this);
	
	if(args[0] != "help" && typeof(this.commands[args[0]]) == "object")
	{
		handleArguement(1);
	}
	else
	{
		buildOptions(this.commands, []);
	}
	message.author.send("This bot supports the following commands:", options);
	return true;
};
