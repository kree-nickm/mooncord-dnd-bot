module.exports = function(reaction, user)
{
  this.emit("messageReactionUpdate", "added", reaction, user);
};
