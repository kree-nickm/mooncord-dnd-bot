exports.run = function(message, args)
{
	if(this.appList.ready)
	{
		// Note: Sometimes @mentions don't get converted into actual mentions and instead just show up as normal text (like if you @ yourself in a DM to the bot). In that case the bot will see it as an argument, not a mention, and do a plain username search. Not sure if this is something we should account for, or just tell dungeon masters not to do it (since only dungeon masters can access other people's apps in the first place).
		if((message.from_dm || message.from_admin) && message.mentions.users.size)
		{
			var targetid = message.mentions.users.first().id;
			var handle = message.mentions.users.first().username +"#"+ message.mentions.users.first().discriminator;
			var username = message.mentions.users.first().username;
			var myself = false;
		}
		else if((message.from_dm || message.from_admin) && args.length)
		{
			var targetid = null;
			var handle = null;
			var username = args.join(" ");
			var myself = false;
		}
		else
		{
			var targetid = message.author.id;
			var handle = message.author.username +"#"+ message.author.discriminator;
			var username = message.author.username;
			var myself = true;
		}
		this.appList.findAllAppsByHandle(handle, (function(handleApps){
			this.appList.findAllAppsByHandle(username, (function(usernameApps){
				var responseLines = [];
				if(targetid != null)
				{
					if(handleApps.length > 1)
					{
						responseLines.push("Woah, "+ handleApps.length +" applications were found for "+ (myself ? "your Discord handle" : "<@"+ targetid +">") +".");
						for(var i in handleApps)
							responseLines.push("One dated "+ getTimeString(handleApps[i]) +".");
					}
					else if(handleApps.length == 1)
						responseLines.push("An application has been found for "+ (myself ? "your Discord handle" : "<@"+ targetid +">") +", dated "+ getTimeString(handleApps[0]) +".");
					else
						responseLines.push("There doesn't seem to be an application for "+ (myself ? "your Discord handle" : "<@"+ targetid +">") +". <:moon2N:497606808542642176>");
				}
				if(usernameApps.length > 1)
				{
					responseLines.push((targetid == null ? "" : "However, ") + usernameApps.length +" applications were found with the username `"+ username +"` without the `#` part.");
					for(var i in usernameApps)
						responseLines.push("One dated "+ getTimeString(usernameApps[i]) +".");
				}
				else if(usernameApps.length == 1)
					responseLines.push((targetid == null ? "A" : "However, a") +"n application was found with the username `"+ username +"` without the `#` part, dated "+ getTimeString(usernameApps[0]) +".");
				else if(targetid == null)
					responseLines.push("There doesn't seem to be an application with the username `"+ username +"` without the `#` part. <:moon2N:497606808542642176>");
				if(myself)
					message.author.send(responseLines.join(" "));
				else
					message.reply(responseLines.join(" "));
			}).bind(this));
		}).bind(this));
	}
	else
	{
		console.warn("Application list is not loaded for some reason.");
		message.reply("I'm unable to access the list of applications right now. <:moon2PH:482219761699389450> Ask a DM to `!dnd refresh` and that might fix it.");
	}
	return true;
};

// TODO: Move this to a more clean location.
var getTimeString = function(app){
	// TODO: These are a little too set-in-stone.
	if(app.changed)
		return (new Date(parseInt(app.changed)*1000)).toDateString();
	else if(app.timestamp)
		return (new Date(app.timestamp)).toDateString();
	else
		return "... some day";
};
