exports.run = function(interaction)
{
  interaction.reply({ content: "I mean, it doesn't do anything...", ephemeral: true });
  console.log(interaction);
  return true;
};

exports.data = {
  description: "does nothing lmao",
};
