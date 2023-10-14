module.exports = function(oldMessage, newMessage)
{
  if(newMessage.author?.id == this.user.id)
  {
    this.emit("ownMessageUpdate", newMessage);
    return;
  }
};
