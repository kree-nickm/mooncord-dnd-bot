exports.run = function(message, args)
{
	if(message.from_admin)
	{
		// This is preferable to just ctrl-C'ing in the console when MySQL is in use, because it explicitly shuts down the connections rather than having them time out eventually.
		var steps = 0;
		if(typeof(this.appList.shutdown) == "function")
		{
			this.appList.shutdown(function(){
				console.log("MySQL connections terminated by admin command.");
				steps++;
				if(steps == 2)
					process.exit();
			});
		}
		else
			steps++;
		this.destroy().then(function(){
			console.log("Discord client terminated by admin command.");
			steps++;
			if(steps == 2)
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
