// Note: This is not a real Discord.Client event, but we call it manually to keep the messaging event code cleaner.
module.exports = function(message)
{
   let to, content;
   if(message.channel.type == "DM")
      to = message.channel.recipient.username +"#"+ message.channel.recipient.discriminator;
   else
      to = "#"+ message.channel.name;
   if(message.embeds.length == 0)
      content = message.content;
   else
      content = message.embeds[0].description;
   console.log((new Date()).toUTCString(), `I just sent a message to ${to} with content:`, content);
};
