const timeslots = ["All Day", "Most of the Day", "Afternoon", "Mid-day", "Morning", "Not Available"];

exports.run = async function(interaction)
{
  let t = interaction.options.getUser("user");
  let target = interaction.fromGM ? (t ?? interaction.user) : interaction.user;
  if(!interaction.fromGM && t && t != interaction.user)
  {
    await interaction.reply({ content: `Only GMs can access another user's application.`, ephemeral: true });
    return false;
  }
  await interaction.deferReply({ ephemeral: true });
  
  let response = {};
  let mode = interaction.options.getSubcommand();
  let edit = interaction.options.getSubcommandGroup();
  if(edit)
  {
    if(mode == "notes" && !interaction.fromGM)
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
      await this.moonlightrpg.updateApp(interaction.user, undefined, undefined, false);
      
      // Update the application table.
      let app = await this.moonlightrpg.updateApp(target, {[mode]: value}, interaction.user);
      response = { content: `${target}'s '${mode}' is now '${app[mode]}' Updated application below:`, embeds: [await this.moonlightrpg.appToEmbed(app, interaction.fromGM)], ephemeral: true };
    }
  }
  else
  {
    let app = await this.moonlightrpg.getApp(target);
    if(app)
    {
      response = { embeds: [await this.moonlightrpg.appToEmbed(app, interaction.fromGM)], ephemeral: true };
    }
    else
    {
      response = { content: `No application found for ${target}.`, ephemeral: true };
    }
  }
  await interaction.followUp(response);
  
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
