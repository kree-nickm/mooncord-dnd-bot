exports.run = function(message, args)
{
	let response = "To submit an application to join a D&D game, go to "+ this.website +", connect your Discord account, then fill out the form. ";//+ this.emoji.moon2S;
	if(message.from_dm || message.from_admin)
		message.reply(response);
	else
		message.author.send(response);
	return true;
};
exports.help = {
	format: "dnd",
	short: "Posts a link to the application form.",
	//long: "",
};
