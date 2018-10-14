exports.run = function(message, args)
{
	if(this.appList.ready)
	{
		if((message.from_dm || message.from_admin) && message.mentions.users.size)
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
		this.appList.findAllAppsByHandle(handle, (function(apps){
			if(apps.length > 1)
			{
				if(myself)
					message.author.send("Woah, "+ apps.length +" applications were found with your Discord handle.");
				else
					message.reply("Woah, "+ apps.length +" applications were found for <@"+ targetid +">.");
			}
			else if(apps.length == 1)
			{
				// TODO: These are a little too set in stone.
				if(apps[0].changed)
					var time = (new Date(parseInt(apps[0].changed)*1000)).toDateString();
				else if(apps[0].timestamp)
					var time = (new Date(apps[0].timestamp)).toDateString();
				else
					var time = "... some day";
				if(myself)
					message.author.send("Your application has been found. It looks like you submitted it on "+ time +". <:moon2S:496519208549613568>");
				else
					message.reply("An application has been found for <@"+ targetid +">. It looks like it was submitted on "+ time +". <:moon2S:496519208549613568>");
			}
			else
			{
				if(myself)
					message.author.send("There doesn't seem to be an application for you. <:moon2N:497606808542642176>");
				else
					message.reply("There doesn't seem to be an application for <@"+ targetid +">. <:moon2N:497606808542642176>");
			}
		}).bind(this));
	}
	else
	{
		console.warn("Application list is not loaded for some reason.");
		message.reply("I'm unable to access the list of applications right now. <:moon2PH:482219761699389450> Ask a DM to !dnd refresh and that might fix it.");
	}
	return true;
};
