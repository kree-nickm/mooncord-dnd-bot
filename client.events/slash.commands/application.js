const timeslots = ["All Day", "Most of the Day", "Afternoon", "Mid-day", "Morning", "Not Available"];

exports.run = async function(interaction)
{
  let isAdmin = this.config.admin_ids.reduce((result, adminId) => result || interaction.member.id == adminId, false);
  let isGM = isAdmin;
  for(let gmRole of this.config.dm_role_ids)
  {
    if(isGM)
      break;
   isGM = isGM || Boolean(await interaction.member.roles.resolve(gmRole));
  }
  let target = isGM ? (interaction.options.getUser("user") ?? interaction.user) : interaction.user;
  
  let response = {};
  let mode = interaction.options.getSubcommand();
  let edit = interaction.options.getSubcommandGroup();
  if(edit)
  {
    if(mode == "notes" && !isGM)
    {
      response = { content: `Only GMs can edit player notes.`, ephemeral: true };
    }
    else
    {
      // Parse the value.
      let value;
      if(["timezone_id","experience"].includes(mode))
        value = interaction.options.getInteger("value");
      else
        value = interaction.options.getString("value");
      
      // Make sure the user running the command has an app.
      await this.moonlightrpg.updateApp(interaction.user);
      
      // Update the application table.
      let app = await this.moonlightrpg.updateApp(target, {[mode]: value}, interaction.user);
      response = { content: `${target}'s '${mode}' is now '${app[mode]}' Updated application below:`, embeds: [await this.moonlightrpg.appToEmbed(app, isGM)], ephemeral: true };
    }
  }
  else
  {
    let app = (await this.moonlightrpg.database.query("SELECT *,CAST(`id` AS CHAR) AS `id` FROM `dnd` WHERE `id`=?", target.id))[0];
    if(app)
    {
      response = { embeds: [await this.moonlightrpg.appToEmbed(app, isGM)], ephemeral: true };
    }
    else
    {
      response = { content: `No application found for ${target}.`, ephemeral: true };
    }
  }
  if(!interaction.replied)
    await interaction.reply(response);
  else
    console.warn(`Already replied to /application interaction.`);
  
  return true;
};

let userOpt = {
  name: "user",
  description: "The other user whose application you want to edit.",
  type: 6,
};

exports.data = {
  description: "Access a Moonlight RPG application.",
  options: [
    {
      name: "view",
      description: "View a Moonlight RPG application.",
      type: 1,
      options: [
        userOpt,
      ],
    },
    {
      name: "edit",
      description: "Create/edit a Moonlight RPG application.",
      type: 2,
      options: [
        /*{
          name: "availability",
          description: "Edit Moonlight RPG player application: Availability",
          type: 1,
          options: [
            userOpt,
          ],
        },*/
        {
          name: "experience",
          description: "Edit Moonlight RPG player application: Experience with TTRPGs",
          type: 1,
          options: [
            {
              name: "value",
              description: "Experience with TTRPGs (1-10)",
              type: 4,
              min_value: 1,
              max_value: 10,
              required: true,
            },
            userOpt,
          ],
        },
        {
          name: "preferences",
          description: "Edit Moonlight RPG player application: Game Preferences",
          type: 1,
          options: [
            {
              name: "value",
              description: "Briefly describe your preferences for a TTRPG game",
              type: 3,
              required: true,
            },
            userOpt,
          ],
        },
        {
          name: "comments",
          description: "Edit Moonlight RPG player application: Other Comments",
          type: 1,
          options: [
            {
              name: "value",
              description: "Anything you think might be important for a GM to know about you",
              type: 3,
              required: true,
            },
            userOpt,
          ],
        },
        {
          name: "notes",
          description: "(GMs Only) Edit Moonlight RPG player application: GM Notes",
          type: 1,
          options: [
            {
              name: "value",
              description: "Notes about this player for other GMs",
              type: 3,
              required: true,
            },
            userOpt,
          ],
        },
      ],
    },
  ],
};
