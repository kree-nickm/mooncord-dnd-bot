exports.run = function(message, args)
{
	if(message.from_dm || message.from_admin)
	{
		// TODO: This is probably only relavent for Google Sheets applications; I don't think MySQL will ever need to refresh.
		if(this.appList != null && typeof(this.appList.loadApplications) == "function")
		{
			this.periodic_refresh(function(success){
				if(success)
					message.author.send("I've now memorized the current list of applications. <:moon2S:496519208549613568>");
				else
					message.author.send("There was a problem when I tried to fetch the applications. <:moon2N:497606808542642176>");
			});
		}
		else
			message.author.send("The refresh command is not necessary with the current application list. The results should always be up to date. <:moon2S:496519208549613568>");
		return true;
	}
	else
		return false;
};
