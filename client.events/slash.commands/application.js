const timeslots = ["All Day", "Most of the Day", "Afternoon", "Mid-day", "Morning", "Not Available"];

exports.run = async function(interaction)
{
  let isAdmin = this.config.admin_ids.reduce((acc, cur) => acc || interaction.member.id == cur, false);
  let isGM = isAdmin || this.config.dm_role_ids.reduce((acc, cur) => acc || !!interaction.member.roles.resolve(cur), false);
  let target = isGM ? (interaction.options.getUser("user") ?? interaction.user) : interaction.user;
  
  let playerAppResult = await this.moonlightrpg.database.queryPromise("SELECT * FROM `dnd` WHERE `id`=?", target.id);
  
  let mode = interaction.options.getSubcommand();
  let edit = interaction.options.getSubcommandGroup();
  if(edit)
  {
    if(playerAppResult.length)
    {
      if(mode == "notes" && !isGM)
      {
        interaction.reply({ content: `Only GMs can edit player notes.`, ephemeral: true });
      }
      else
      {
        // Parse the value.
        let value;
        if(["timezone_id","experience"].includes(mode))
          value = interaction.options.getInteger("value");
        else
          value = interaction.options.getString("value");
        
        if(playerAppResult?.[0]?.[mode] == value)
        {
          interaction.reply({ content: `${target}'s '${mode}' is already '${value}'`, ephemeral: true });
        }
        else
        {
          // Update the application table.
          let mysqlData = {
            id: target.id,
            [mode]: value,
            changed: Math.round(Date.now()/1000),
          };
          let updateClause = Object.keys(mysqlData).map(key => this.moonlightrpg.database.escapeId(key)).map(key => `${key}=VALUES(${key})`).join(",");
          let queryResult = await this.moonlightrpg.database.queryPromise("INSERT INTO dnd SET ? ON DUPLICATE KEY UPDATE " + updateClause, [mysqlData]);
          
          // Update the changelog table.
          let blame;
          if(target == interaction.user)
          {
            blame = String(playerAppResult[0].index);
          }
          else
          {
            let myAppResult = await this.moonlightrpg.database.queryPromise("SELECT `index` FROM `dnd` WHERE `id`=?", interaction.user.id);
            if(myAppResult.length)
              blame = String(myAppResult[0].index);
            else
              blame = interaction.user.id;
          }
          delete mysqlData.id;
          let changeData = {
            table: "dnd",
            timestamp: Math.round(Date.now()/1000),
            data: JSON.stringify({[playerAppResult[0].index]:mysqlData}),
            previous: JSON.stringify({[playerAppResult[0].index]:{changed:playerAppResult[0].changed, [mode]:playerAppResult[0][mode]}}),
            blame,
          };
          let logResult = await this.moonlightrpg.database.queryPromise("INSERT INTO changelog SET ?", [changeData]);
          
          // Reply.
          interaction.reply({ content: `${target}'s '${mode}' is now '${value}'`, ephemeral: true });
        }
      }
    }
    else
      interaction.reply({ content: `No application found for ${target}. In order to edit fields on this application, one must first be created on the website: ${this.website}`, ephemeral: true });
  }
  else
  {
    if(playerAppResult.length)
    {
      let message = {
        embeds: [
          {
            title: `Moonlight RPG Player Application`,
            description: `For ${target}`,
            fields: [
              {name: `Submitted On`, value: `<t:${playerAppResult[0].submitted}:D>`, inline:true},
              {name: `Last Changed`, value: `<t:${playerAppResult[0].changed}:D>`, inline:true},
              {name: `Experience`, value: playerAppResult[0].experience, inline:true},
              {name: `Timezone`, value: this.moonlightrpg.timezones.find(tz => tz.index == playerAppResult[0].timezone_id)?.label},
              {name: `Sunday Availability`, value: playerAppResult[0].sunday, inline:true},
              {name: `Monday Availability`, value: playerAppResult[0].monday, inline:true},
              {name: `Tuesday Availability`, value: playerAppResult[0].tuesday, inline:true},
              {name: `Wednesday Availability`, value: playerAppResult[0].wednesday, inline:true},
              {name: `Thursday Availability`, value: playerAppResult[0].thursday, inline:true},
              {name: `Friday Availability`, value: playerAppResult[0].friday, inline:true},
              {name: `Saturday Availability`, value: playerAppResult[0].saturday, inline:true},
              {name: `Preferences`, value: playerAppResult[0].preferences},
              {name: `Comments`, value: playerAppResult[0].comments},
            ],
          },
        ],
        ephemeral: true,
      };
      if(isGM)
        message.embeds[0].fields.push({name: `Notes`, value: playerAppResult[0].notes});
      interaction.reply(message);
    }
    else
    {
      interaction.reply({ content: `No application found for ${target}.`, ephemeral: true });
    }
  }
  
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
