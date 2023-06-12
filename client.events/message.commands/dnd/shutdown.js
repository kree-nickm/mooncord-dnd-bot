exports.run = function(message, args)
{
	// This is preferable to just ctrl-C'ing in the console, because it explicitly shuts down the connections rather than having them time out eventually.
	if(message.from_admin)
	{
		let steps = 0;
		let totalSteps = 1;
		this.destroy().then(() => {
			console.log("["+(new Date()).toUTCString()+"]", "Discord client terminated by admin command.");
			steps++;
			if(steps === totalSteps)
				process.exit();
		});
		
		return true;
	}
	else
		return false;
};
exports.help = {
	//format: "",
	short: "Admins only. Shuts down the bot. It should automatically reboot.",
	//long: "",
};
