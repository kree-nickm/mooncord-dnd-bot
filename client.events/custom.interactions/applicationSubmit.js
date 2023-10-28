exports.run = async function(interaction)
{
  let comments = interaction.fields.getTextInputValue('comments') ?? "";
  let app = await this.moonlightrpg.updateApp(interaction.user, {comments});
  response = { embeds: [await this.moonlightrpg.appToEmbed(app, interaction.fromGM)], ephemeral: true };
  response.embeds[0].description += "\nTo change any of these fields, visit "+ this.website +" and log in to manage your application.\nSome fields might support changes via Discord using `/application edit` commands.";
  await interaction.reply(response);
  
  return true;
};
