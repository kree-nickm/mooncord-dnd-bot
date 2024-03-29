exports.run = async function(interaction)
{
  let response = {};
  if(interaction.fromGM)
  {
    let games = await this.moonlightrpg.database.query("SELECT * FROM games WHERE dm=? AND ended=0", interaction.user.id);
    if(games.length)
    {
      response = { embeds: [], ephemeral: true };
      if(games.length > 10)
      {
        response.content = "You have more than 10 active games. To see all of them, you'll need to use the website.";
        games = games.slice(0,10);
      }
      for(let game of games)
      {
        response.embeds.push(await this.moonlightrpg.gameToEmbed(game));
      }
    }
    else
    {
      response = { content: `No active games found.`, ephemeral: true };
    }
  }
  else
  {
    response = { content: `Only GMs can use this command.`, ephemeral: true };
  }
  if(!interaction.replied)
    await interaction.reply(response);
  else
    console.warn(`Already replied to /mygames interaction.`);
  
  return true;
};

exports.data = {
  description: "(GMs Only) Give you a list of your active games.",
};
