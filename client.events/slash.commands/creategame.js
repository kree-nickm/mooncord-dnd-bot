exports.run = async function(interaction)
{
  let response = {};
  if(interaction.fromGM)
  {
    let group = interaction.options.getString("name");
    let system = interaction.options.getString("system");
    let time = interaction.options.getString("time");
    let created = await this.moonlightrpg.database.insert("games", {dm:interaction.user.id, group, system, time, started:Math.round(Date.now()/1000), players:[], advertiseData:null}, null, interaction.user);
    let game = (await this.moonlightrpg.database.query("SELECT * FROM games WHERE `index`=?", created.insertId))[0];
    if(game)
    {
      response = { content: `To edit your game further, add players, configure an advertisement, etc. use /editgame and include either the game index or name given below.
If you forget either, you can use /mygames to list all of your active games.`, embeds: [await this.moonlightrpg.gameToEmbed(game)], ephemeral: true };
    }
    else
    {
      response = { content: `An error occurred, and the game was not created.`, ephemeral: true };
    }
  }
  else
  {
    response = { content: `Only GMs can create games.`, ephemeral: true };
  }
  if(!interaction.replied)
    await interaction.reply(response);
  else
    console.warn(`Already replied to /creategame interaction.`);
  
  return true;
};

exports.data = {
  description: "(GMs Only) Create a new TTRPG game.",
  options: [
    {
      name: "name",
      description: "Name of the game or group",
      type: 3,
      required: true,
    },
    {
      name: "system",
      description: "System the game uses",
      type: 3,
      required: true,
    },
    {
      name: "time",
      description: "What day and time the game will be played",
      type: 3,
      required: true,
    },
  ],
};
