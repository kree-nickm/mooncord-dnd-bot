module.exports = async function(packet)
{
   // This needs to be here because for some dumb reason the normal messageReactionRemove event will not fire on reactions that were present before this bot instance started up, under any circumstance, no matter what you do (other than this).
   // Another stupid bug that is probably related, the MessageReaction.count property will not decrement if such a reaction is removed, so it will pretty much always be inaccurate.
   if(packet.t == "MESSAGE_REACTION_REMOVE")
   {
      if(Array.isArray(this.moonlightrpg?.advertisements))
      {
         for(let advert of this.moonlightrpg.advertisements)
         {
            if(packet.d.message_id == advert.message && packet.d.emoji.id == this.moonlightrpg.advertReactEmoji)
            {
               let channel = await this.channels.fetch(packet.d.channel_id);
               let message = await channel.messages.fetch(packet.d.message_id);
               let reaction = message.reactions.resolve(this.moonlightrpg.advertReactEmoji);
               let user = await this.users.fetch(packet.d.user_id);
               this.emit("messageReactionUpdate", "removed", reaction, user);
            }
         }
      }
   }
};
