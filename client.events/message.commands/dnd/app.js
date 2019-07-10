exports.run = function(message, args)
{
	if(this.appList.ready)
	{
		if((message.from_dm || message.from_admin) && message.mentions.users.size)
		{
			var targetid = message.mentions.users.first().id;
			var myself = false;
		}
		else
		{
			var targetid = message.author.id;
			var myself = true;
		}
		this.appList.findAppByID(targetid, (function(results){
			var responseLines = [];
			if(results.length)
				responseLines.push("An application has been found for "+ (myself ? "you" : "<@"+ targetid +">") +", dated "+ (new Date(parseInt(results[0].submitted)*1000)).toDateString() +". "+ this.emoji.moon2S);
			else
				responseLines.push("There doesn't seem to be an application for "+ (myself ? "you" : "<@"+ targetid +">") +". "+ this.emoji.moon2N);
			if(myself)
				message.author.send(responseLines.join(" "));
			else
				message.reply(responseLines.join(" "));
		}).bind(this));
	}
	else
	{
		console.warn("Not connected to application database.");
		message.reply("I'm unable to access the list of applications right now. "+ this.emoji.moon2PH);
	}
	return true;
};
exports.help = {
	format: "dnd app [@handle]",
	short: "Checks if you currently have an application. Dungeon masters can mention a user to check on their application.",
	//long: "",
};
