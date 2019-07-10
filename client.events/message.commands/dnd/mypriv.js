exports.run = function(message, args)
{
	if(message.from_dm && message.from_admin)
		message.reply("You are both an admin and a DM.");
	else if(message.from_admin)
		message.reply("You are an admin.");
	else if(message.from_dm)
		message.reply("You are a DM.");
	else
		message.author.send("You have no special privelidges.");
	return true;
};
exports.help = {
	//format: "",
	short: "Checks on your permission levels as far as running bot commands.",
	//long: "",
};
