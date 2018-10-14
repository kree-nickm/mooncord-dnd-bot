module.exports = function(message)
{
	if(message.author.bot || !message.content.startsWith(this.config.prefix))
		return;
	//console.log(message);
	message.from_admin = Array.isArray(this.config.admin_ids) && this.config.admin_ids.indexOf(message.author.id) != -1;
	var args = message.content.substr(this.config.prefix.length).trim().split(/ +/g);
	var command = args.shift().toLowerCase();
	if(command == "dnd" && (message.channel.type == "dm" || this.config.channel_ids.indexOf(message.channel.id) != -1))
	{
		message.from_dm = this.dungeon_masters != null && this.dungeon_masters.get(message.author.id) != null;
		if(!(message.from_dm || message.from_admin))
		{	// Yeah I know this doesn't need to be split up 'if' statements, but it's way easier to read this way.
			if(last_command.global != null && ((new Date())-last_command.global) < command_frequency.global)
				return;
			if(last_command.user[message.author.id] != null && ((new Date())-last_command.user[message.author.id]) < command_frequency.perUser)
				return;
		}
		process_command.call(this, message, args);
		last_command.global = new Date();
		last_command.user[message.author.id] = new Date();
		if(message.channel.type != "dm")
			last_command.channel[message.channel.id] = new Date();
	}
};

// ------------- The Work -------------
// The rate limit for commands (milliseconds). The bot will not respond faster than this unless it is a dungeon master or an admin making the command.
var command_frequency = {
	global: 1000, // This applies to all of this bot's messages everywhere. Ex. if two different people send commands, even in whisper, within this period, the second will be ignored.
	perUser: 5000, // This applies to an individual person's commands.
	perChannel: 30000, // This applies to individual channels. Though only DM commands go to the channel, which bypass the limit, so maybe this is useless.
};
var last_command = {
	user: {},
	channel: {},
};
// TODO: Detect if one person is spamming and ban them.
function process_command(message, args)
{
	// TODO: Emote codes below, but they might not work on a bot. If not, edit all the replies to get rid of them.
	// <:moon2T:284219508615413761> <:moon2S:496519208549613568> <:moon2N:497606808542642176> <:moon2PH:482219761699389450> <:moon2A:430810259620364309>
	var param1 = args.length ? args.shift().toLowerCase() : "";
	if(param1 == "app")
	{
		if(this.appList.ready)
		{
			if((message.from_dm || message.from_admin) && message.mentions.users.size)
			{
				var targetid = message.mentions.users.first().id;
				var handle = message.mentions.users.first().username +"#"+ message.mentions.users.first().discriminator
				var myself = false;
			}
			else
			{
				var targetid = message.author.id;
				var handle = message.author.username +"#"+ message.author.discriminator
				var myself = true;
			}
			this.appList.findAllAppsByHandle(handle, (function(apps){
				if(apps.length > 1)
				{
					if(myself)
						message.author.send("Woah, "+ apps.length +" applications were found with your Discord handle.");
					else
						message.reply("Woah, "+ apps.length +" applications were found for <@"+ targetid +">.");
				}
				else if(apps.length == 1)
				{
					// TODO: These are a little too set in stone.
					if(apps[0].changed)
						var time = (new Date(parseInt(apps[0].changed)*1000)).toDateString();
					else if(apps[0].timestamp)
						var time = (new Date(apps[0].timestamp)).toDateString();
					else
						var time = "... some day";
					if(myself)
						message.author.send("Your application has been found. It looks like you submitted it on "+ time +". <:moon2S:496519208549613568>");
					else
						message.reply("An application has been found for <@"+ targetid +">. It looks like it was submitted on "+ time +". <:moon2S:496519208549613568>");
				}
				else
				{
					if(myself)
						message.author.send("There doesn't seem to be an application for you. <:moon2N:497606808542642176>");
					else
						message.reply("There doesn't seem to be an application for <@"+ targetid +">. <:moon2N:497606808542642176>");
				}
			}).bind(this));
		}
		else
		{
			console.warn("Application list is not loaded for some reason.");
			message.reply("I'm unable to access the list of applications right now. <:moon2PH:482219761699389450> Ask a DM to !dnd refresh and that might fix it.");
		}
	}
	else if(param1 == "lastrefresh")
	{
		// TODO: This is probably only relavent for Google Sheets applications; I don't think MySQL will ever need to refresh. But we'll see.
		if(typeof(this.appList.loadApplications) == "function")
			message.author.send("The application list was last refreshed "+ Math.round(((new Date()) - last_refresh)/1000) +" seconds ago. <:moon2S:496519208549613568>");
		else
			message.author.send("The refresh command is not necessary with the current application list. The results should always be up to date. <:moon2S:496519208549613568>");
	}
	else if((message.from_dm || message.from_admin) && param1 == "refresh")
	{
		// TODO: This is probably only relavent for Google Sheets applications; I don't think MySQL will ever need to refresh.
		// TODO: This code is almost identical to the periodic_refresh() function; they could probably be combined.
		clearTimeout(refresh_timer);
		if(typeof(this.appList.loadApplications) == "function")
		{
			this.appList.loadApplications(function(success){
				if(success)
				{
					message.author.send("I've now memorized the current list of applications. <:moon2S:496519208549613568>");
					last_refresh = new Date();
				}
				else
					message.author.send("There was a problem when I tried to fetch the applications. <:moon2N:497606808542642176>");
				refresh_timer = setTimeout(periodic_refresh, refresh_frequency);
			});
		}
		else
			message.author.send("The refresh command is not necessary with the current application list. The results should always be up to date. <:moon2S:496519208549613568>");
	}
	else if(message.from_admin && param1 == "reloadconfig")
	{
		// TODO: Replace this with some commands that modify the values directly rather than just reloading the config.json file on the host computer.
		var temp = require("./config.json");
		for(var i in this.config)
			delete this.config[i];
		for(var i in temp)
			this.config[i] = temp[i];
		message.author.send("'config.json' has been reloaded. <:moon2N:497606808542642176>");
		console.log("config.json reloaded via admin command.");
	}
	else if(message.from_admin && param1 == "shutdown")
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
	}
	else
	{
		// Default response to any !dnd message that isn't covered above.
		if(message.from_dm || message.from_admin)
			message.reply("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. <:moon2S:496519208549613568>");
		else
			message.author.send("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. <:moon2S:496519208549613568>");
	}
}

var refresh_frequency = 3600000;
var last_refresh = new Date();
var refresh_timer = setTimeout(periodic_refresh, refresh_frequency);
function periodic_refresh()
{
	clearTimeout(refresh_timer);
	if(typeof(this.appList.loadApplications) == "function")
	{
		this.appList.loadApplications(function(success){
			if(success)
				last_refresh = new Date();
			refresh_timer = setTimeout(periodic_refresh, refresh_frequency);
		});
	}
}
