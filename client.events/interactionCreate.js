module.exports = function(interaction)
{
  console.log("Interaction:", this, interaction);
  if(interaction.isChatInputCommand())
  {
    if(typeof(this.slashCmds[interaction.commandName]) == "object" && typeof(this.slashCmds[interaction.commandName].run) == "function")
    {
      return this.slashCmds[interaction.commandName].run.call(this, interaction);
    }
    else
    {
      console.log(`Can't find "${interaction.commandName}" in:`, this.slashCmds);
      interaction.reply({ content: "Unable to find the code to run for this command.", ephemeral: true });
      return false;
    }
  }
  else
    return false;
};
