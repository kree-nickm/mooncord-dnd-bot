exports.run = function(message, args)
{
	if(this.appList.ready)
	{
		this.appList.confirmRequest(message.author.id, (function(changedRows){
			var responseLines = [];
			if(changedRows > 0)
				responseLines.push("Your application is confirmed. Thanks! "+ this.emoji.moon2S);
			else if(changedRows < 0)
				responseLines.push("An error occurred processing that request. "+ this.emoji.moon2PH);
			else
				responseLines.push("You do not currently have an open request to find an application. "+ this.emoji.moon2N);
			message.author.send(responseLines.join(" "));
		}).bind(this));
	}
	else
	{
		console.warn("Not connected to application database.");
		message.reply("I'm unable to access the Mooncord D&D database right now. "+ this.emoji.moon2PH);
	}
	return true;
};
exports.help = {
	//format: "",
	short: "Closes out a request that you have made to have an old application found.",
	long: "Only usable if you have an open request to have an old application found from the old Google Forms process. This will mark the request as confirmed. If your application was found, use this command so that the powers that be know that everything is resolved. If your application was not found, use this if you no longer wish to have it found, or if you don't think it's possible.",
};
