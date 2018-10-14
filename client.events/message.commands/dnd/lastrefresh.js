exports.run = function(message, args)
{
	// TODO: This is probably only relavent for Google Sheets applications; I don't think MySQL will ever need to refresh. But we'll see.
	if(typeof(this.appList.loadApplications) == "function")
		message.author.send("The application list was last refreshed "+ Math.round(((new Date()) - this.last_refresh)/1000) +" seconds ago. <:moon2S:496519208549613568>");
	else
		message.author.send("The refresh command is not necessary with the current application list. The results should always be up to date. <:moon2S:496519208549613568>");
	return true;
};
