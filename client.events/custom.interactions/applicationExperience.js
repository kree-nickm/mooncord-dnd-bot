exports.run = async function(interaction)
{
  let experience = parseInt(interaction.values[0]);
  if(experience)
  {
    // Update the application table.
    let app = await this.moonlightrpg.updateApp(interaction.user, {experience});
    response = { embeds: [await this.moonlightrpg.appToEmbed(app, interaction.fromGM)], ephemeral: true };
    response.embeds[0].description += "\nTo change any of these fields, visit "+ this.website +" and log in to manage your application.\nSome fields might support changes via Discord using `/application edit` commands.";
    await interaction.reply(response);
  }
  else
  {
    await interaction.reply({ content: `Invalid experience value "${experience}" given.`, ephemeral: true });
  }
  
  return true;
};
