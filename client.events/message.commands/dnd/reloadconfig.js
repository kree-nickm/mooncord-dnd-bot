exports.run = function(message, args)
{
	if(message.from_admin)
	{
		// TODO: Replace this with some commands that modify the values directly rather than just reloading the config.json file on the host computer.
		var temp = require("./config.json");
		for(var i in this.config)
			delete this.config[i];
		for(var i in temp)
			this.config[i] = temp[i];
		message.author.send("'config.json' has been reloaded. <:moon2N:497606808542642176>");
		console.log("config.json reloaded via admin command.");
		return true;
	}
	else
		return false;
};
