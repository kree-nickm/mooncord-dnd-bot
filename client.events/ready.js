module.exports = function()
{
  // Check if the config file has all the options that the bot wants.
  if(!Array.isArray(this.config.channel_ids))
  {
    console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Channel IDs not specified in config.json; specify the valid channels by listing their IDs in an array with the 'channel_ids' property. Without this, the bot will only be able to respond to direct messages.");
    this.config.channel_ids = [];
  }
  if(!Array.isArray(this.config.admin_ids))
  {
    console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Admin IDs not specified in config.json; specify the admins by listing their IDs in an array with the 'admin_ids' property. Without this, the bot will not be able to identify admins.");
    this.config.admin_ids = [];
  }
  if(!this.config.guild_id)
  {
    console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Guild ID not specified in config.json; specify the ID of the Mooncord guild with the 'guild_id' property. Without this, the bot will not be able to identify game masters if a command is sent in a direct message.");
    this.config.guild_id = "";
  }
  else
  {
    var mooncord_guild = this.guilds.resolve(this.config.guild_id);
    if(!mooncord_guild?.id)
      console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m This bot does not appear to be a member of the specified Mooncord guild. Without this, the bot will not be able to identify game masters if a command is sent in a direct message.");
    else if(!Array.isArray(this.config.dm_role_ids))
    {
      console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m GM role IDs not specified in config.json; specify the ID of the GM roles with the 'dm_role_ids' property. Without this, the bot will not be able to identify game masters.");
      this.config.dm_role_ids = [];
    }
    else
    {
      this.dm_roles = [];
      for(var i in this.config.dm_role_ids)
      {
        var role = mooncord_guild.roles.resolve(this.config.dm_role_ids[i]);
        if(!role)
          console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m The specified GM role ID '%s' was not found among the \x1b[1m%s\x1b[0m guild's roles.", this.config.dm_role_ids[i], mooncord_guild.name);
        else
          this.dm_roles.push(role);
      }
    }
  }
  
  // Set this here for commands that refer back to it (could move it to the config file, but it probably doesn't matter).
  this.website = "https://moonlight-rpg.com/";
  this.moonlightrpg.advertReactEmoji = "588481240697536512";
  
  // Attempt to make the server emotes easier to access (for some reason, the bot doesn't seem to be able to use many emotes, so this isn't that useful).
  /*this.emoji = {};
  this.emojis.forEach((function(emoji){
    if(!emoji.deleted)
      this.emoji[emoji.name] = emoji.toString();
  }).bind(this));
  //console.log(this.emoji);*/
  
  // The rate limit for commands (milliseconds). Note: GMs and admins ignore ALL of the below. They still trigger cooldowns for others, but can always run commands regardless of when the last command happened.
  this.command_frequency = {
    global: 500, // This applies to all of this bot's messages everywhere, ie. if two different people send commands, even in whisper, within this period, the second one will be ignored.
    perUser: 5000, // This applies to an individual person's commands. A single normal user cannot execute commands more frequent than this.
    perChannel: 1000, // This applies to individual channels. The bot won't send messages to a single channel more frequent than this.
  };
  this.last_command = {
    user: {},
    channel: {},
  };
  // TODO: Detect if one person is spamming and ban them.
  this.moonlightrpg.timers = {};
  if(!this.config.signup_delay)
  {
    console.warn("["+(new Date()).toUTCString()+"]", "\x1b[1mWarning:\x1b[0m Signup delay not specified. Defaulting to 5 seconds.");
    this.config.signup_delay = 5000;
  }
    
  // Let the console know we're good to go.
  console.log("["+(new Date()).toUTCString()+"]", "Mooncord D&D bot active.");
  console.log("");
};
