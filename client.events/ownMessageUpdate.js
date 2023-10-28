// Note: This is not a real Discord.Client event, but we call it manually to keep the messaging event code cleaner.
module.exports = function(message)
{
  let to;
  if(message.guild)
    to = "#"+ message.channel.name;
  else
    to = message.channel.recipient.username;
  
  let msg = {};
  if(message.content?.length)
    msg.content = message.content;
  if(message.embeds?.length)
  {
    msg.embeds = message.embeds.map(embed => {
      let emb = {};
      if(embed.title?.length)
        emb.title = embed.title;
      else if(embed.description?.length)
        emb.description = embed.description;
      if(embed.fields?.length)
        emb.fields = embed.fields.length;
      return emb;
    });
  }
  if(message.components?.length)
    msg.components = "yes";
  
  console.log("["+(new Date()).toUTCString()+"]", `I just sent a message to ${to}:`, msg);
};
