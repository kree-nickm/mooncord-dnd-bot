module.exports = async function(interaction)
{
  if(interaction.guildId == this.config.guild_id)
  {
    if(interaction.isChatInputCommand())
    {
      if(typeof(this.slashCmds[interaction.commandName]) == "object" && typeof(this.slashCmds[interaction.commandName].run) == "function")
      {
        return this.slashCmds[interaction.commandName].run.call(this, interaction);
      }
      else
      {
        console.log(`Can't find "${interaction.commandName}" in:`, this.slashCmds);
        await interaction.reply({ content: "Unable to find the code to run for this command.", ephemeral: true });
      }
    }
    else
    {
      console.log("Interaction:", this, interaction);
    }
  }
  return false;
};
