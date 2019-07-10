exports.run = function(message, args)
{
	if(this.appList.ready && args.length > 0)
	{
		this.appList.updateRequest(message.author.id, args.join(" "), (function(response){
			var responseLines = [];
			var options = null;
			if(response.changedRows > 0)
			{
				responseLines.push("Your request has been updated. We will give it another look as soon as we can. "+ this.emoji.moon2S);
				options = {
					embed: {
						title: "Updated Request",
						description: response.row.description,
						timestamp: (new Date(parseInt(response.row.time)*1000)).toISOString(),
						url: this.website,
					}
				};
			}
			else if(response.changedRows < 0)
				responseLines.push("An error occurred processing that request. "+ this.emoji.moon2PH);
			else if(Array.isArray(response.row))
				responseLines.push("Your request was not updated because no changes were detected. "+ this.emoji.moon2N);
			else
				responseLines.push("You do not currently have an open request to find an application. "+ this.emoji.moon2N);
			message.author.send(responseLines.join(" "), options);
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
	format: "dnd updaterequest <request description>",
	short: "Allows you to create or update a request to have an old application found.",
	long: "Only use this command if you submitted an application on the old Google Forms application process, and the new system did not transfer that application over. This command will create or update a request to have your old application found, so that your new application reflects the original sugmission date (as well as any other missing fields).",
};
