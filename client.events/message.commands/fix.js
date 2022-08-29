const math = require("mathjs");

exports.run = function(message, args)
{
   let type = args.shift();
   switch(type)
   {
      case "adverts":
         this.moonlightrpg.fixAdverts(message.author);
         break;
      //default:
      //   return false;
   }
   return true;
};

exports.help = {
   format: "fix adverts",
   short: "Fixes some problems detected with the Moonlight RPG web portal integration.",
   long: "Specify a type of potential problem as the argument to the 'fix' command. Valid options are:\n**adverts** - Find advertisements that the Moonlight RPG web portal did not properly track, and make it track them. Use this if you get the message that a problem occurred after posting a game.",
};
