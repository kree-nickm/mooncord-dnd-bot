module.exports = async function(interaction)
{
  interaction.fromAdmin = this.config.admin_ids.reduce((result, adminId) => result || interaction.user.id == adminId, false);
  interaction.fromGM = interaction.fromAdmin;
  
  if(interaction.guildId == this.config.guild_id)
  {
    for(let gmRole of this.config.dm_role_ids)
    {
      if(interaction.fromGM)
        break;
      interaction.fromGM = interaction.fromGM || Boolean(await interaction.member.roles.resolve(gmRole));
    }
  }
  
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
  else if(interaction.customId)
  {
    if(typeof(this.customInteractions[interaction.customId]) == "object" && typeof(this.customInteractions[interaction.customId].run) == "function")
    {
      return this.customInteractions[interaction.customId].run.call(this, interaction);
    }
    else
    {
      console.log(`Can't find "${interaction.customId}" in:`, this.customInteractions);
      if(interaction.isRepliable())
        await interaction.reply({ content: "This doesn't seem to do anything.", ephemeral: true });
    }
  }
  else
  {
    console.log("Unknown Interaction:", interaction);
  }
  return false;
};
