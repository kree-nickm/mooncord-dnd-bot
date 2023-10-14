exports.run = function(message, args)
{
  var reply = {content:`This bot supports the following commands:`, /*ephemeral:true,*/ embeds:[{fields:[]}]};
  
  var addField = (function(string, command, uselong, commandName){
    var name = string;
    var value = "Type `"+ this.config.prefix +"help "+ string +"` for more information on this command.";
    if(typeof(command.run) == "function")
    {
      if(typeof(command.help) == "object")
      {
        if(Array.isArray(command.help.aliases) && command.help.primary !== commandName)
        {
          value = "This is an alias for `"+ this.config.prefix + command.help.primary +"`.";
        }
        else
        {
          if(typeof(command.help.format) == "string")
            name = command.help.format;
          if(typeof(command.help.short) == "string")
          {
            value = command.help.short;
            if(typeof(command.help.long) == "string")
            {
              if(uselong)
                value += " "+ command.help.long;
              else
                value += "\nType `"+ this.config.prefix +"help "+ string +"` for more information on this command.";
            }
          }
          else if(typeof(command.help.long) != "string")
            value = "No information is available on this command.";
        }
      }
      else
        value = "No information is available on this command.";
    }
    reply.embeds[0].fields.push({
      name: this.config.prefix + name,
      value: value
    });
  }).bind(this);
  
  var buildOptions = (function(cmdObject, subArgs){
    Object.keys(cmdObject).forEach(function(cmd){
      if(subArgs.length > 0 || cmd != "help")
        addField(subArgs.join(" ") + (subArgs.length?" ":"") + cmd, cmdObject[cmd], false, cmd);
    }, this);
  }).bind(this);
  
  var handleArguement = (function(argNum){
    var command = this.commands;
    var subArgs = [];
    var i;
    for(i=0; i<argNum; i++)
    {
      command = command[args[i]];
      subArgs.push(args[i]);
    }
    if(typeof(command.run) == "function")
    {
      addField(args.join(" "), command, true, args[i]);
    }
    else if(typeof(command[args[i]]) == "object")
    {
      handleArguement(argNum+1);
    }
    else
    {
      buildOptions(command, [args[0],args[1]]);
    }
  }).bind(this);
  
  if(args[0] != "help" && typeof(this.commands[args[0]]) == "object")
  {
    handleArguement(1);
  }
  else
  {
    buildOptions(this.commands, []);
  }
  message.author.send(reply);
  return true;
};
