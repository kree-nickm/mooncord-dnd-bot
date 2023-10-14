module.exports = async function(interaction)
{
  if(interaction.isChatInputCommand() && interaction.guildId == this.config.guild_id)
  {
    if(typeof(this.slashCmds[interaction.commandName]) == "object" && typeof(this.slashCmds[interaction.commandName].run) == "function")
    {
      return this.slashCmds[interaction.commandName].run.call(this, interaction);
    }
    else
    {
      console.log(`Can't find "${interaction.commandName}" in:`, this.slashCmds);
      await interaction.reply({ content: "Unable to find the code to run for this command.", ephemeral: true });
      return false;
    }
  }
  else
  {
    console.log("Interaction:", this, interaction);
    return false;
  }
};
