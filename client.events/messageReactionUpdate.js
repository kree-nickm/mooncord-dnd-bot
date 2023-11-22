// Note: This is not a real Discord.Client event, but we call it manually so we can share code between adding and removing reactions.
module.exports = async function(action, reaction, reactUser)
{
  let otheraction = (action=="added" ? "removed" : (action=="removed" ? "added" : null));
  if(otheraction == null)
    return;
  if(!reaction)
    return;
  if(!reactUser.bot && reaction._emoji?.id == this.moonlightrpg.advertReactEmoji)
  {
    // This is a moon2D20 reaction that isn't the bot's.
    console.log("["+(new Date()).toUTCString()+"]", `User ${reactUser.username} reacted with ${reaction._emoji.name}.`);
    let message = await reaction.message.fetch();
    if(message.author.id == this.user.id)
    {
      // This is a message posted by the bot.
      console.log("["+(new Date()).toUTCString()+"]", `User ${reactUser.username} reacted with ${reaction._emoji.name} to one of my messages (${message.id}) in channel #${message.channel.name}.`);
      // TODO: Any additional layer of validation would be nice. As it is, someone could spam D20 reactions on the bot and make it spam MySQL queries, which could have adverse effects on the server.
      let result = await this.moonlightrpg.database.query("SELECT * FROM `games` WHERE `advertiseData`->'$.message'=?", message.id);
      if(result.length)
      {
        // This is a reaction on a game advert.
        console.log("["+(new Date()).toUTCString()+"]", `This message is an advertisement for the game "${result[0].group}".`);
        let currentAdvertiseData = JSON.parse(result[0].advertiseData);
        
        // Check for admin status to enable debugging.
        reaction.fromAdmin = this.config.admin_ids.reduce((result, adminId) => result || reactUser.id == adminId, false);
        
        // Get the ignore list and temporarily add the GM to it. (Unless it's an admin; assume they are debugging.)
        let ignore = [];
        if(Array.isArray(currentAdvertiseData.ignore))
          ignore = [...currentAdvertiseData.ignore];
        if(!reaction.fromAdmin)
          ignore.push(result[0].dm);
        
        // Is this user allowed to sign-up for this game?
        if(ignore.indexOf(reactUser.id) == -1)
        {
          // Prevent users from spamming reactions by delaying the bot's function on a timer.
          let timerid = message.id;
          if(!this.moonlightrpg.timers[timerid])
          {
            this.moonlightrpg.timers[timerid] = {
              timeout: 0,
              added: [],
              removed: [],
            };
          }
          
          // If they just did the opposite action, then behave as though it never happened. Otherwise, make note of this action.
          let already = this.moonlightrpg.timers[timerid][otheraction].indexOf(reactUser.id);
          if(already != -1)
          {
            this.moonlightrpg.timers[timerid][otheraction].splice(already, 1);
          }
          else
          {
            // Final check to make sure they are allowed to sign up.
            /*let app = await this.moonlightrpg.getApp(user);
            app = await this.moonlightrpg.loadApp(app);
            if(app.active.length)
            {
              await reactUser.send({
                content: `You have attempted to sign up for a TTRPG game, however you are listed as already playing in an active game. We have a rule against a player being in multiple games outside of extenuating circumstances. If you believe there is an error, contact your most recent GM or any TTRPG Community Leader.`,
              });
              await reaction.users.remove(reactUser);
            }
            else
            {
              if(app.signedup.length)
              {
                await reactUser.send({
                  content: `You have signed up for multiple games. That's fine, but if you are selected to play in both of them, you will have to choose just one, because we have a rule against a player being in multiple games outside of extenuating circumstances.`,
                });
              }
              this.moonlightrpg.timers[timerid][action].push(reactUser.id);
            }*/
            
            // If bypassing the multi-game check.
            this.moonlightrpg.timers[timerid][action].push(reactUser.id);
          }
          
          // Either way, restart the timer.
          clearTimeout(this.moonlightrpg.timers[timerid].timeout);
          
          /*************************************************
          ** This is the actual handling of the reaction. **
          **  Everything before this is just validation.  **
          *************************************************/
          this.moonlightrpg.timers[timerid].timeout = setTimeout(async () =>
          {
            let gameRow = (await this.moonlightrpg.database.query("SELECT * FROM `games` WHERE `advertiseData`->'$.message'=?", message.id))[0];
            let advertiseData = JSON.parse(gameRow.advertiseData);
            let gameGM = await this.users.fetch(gameRow.dm);
            let sendOneGMMessage = false;
            let gmResponseFields = [
              {name: "Game Name", value: `${gameRow.group}`},
              {name: "Advertisement Message Link", value: `[Jump to Message](${message.url})`},
              {name: "Game Management Link", value: `${this.website}manage`},
            ];
            let gmMessageRemoved = [];
            let gmMessageAdded = [];
            
            // Remove players who removed their reaction.
            for(let userId of this.moonlightrpg.timers[timerid].removed)
            {
              let user = await this.users.fetch(userId);
              let i;
              if((i = advertiseData.signups.indexOf(userId)) != -1)
              {
                advertiseData.signups.splice(i, 1);
                gmMessageRemoved.push(`${user.username}`);
                if(!sendOneGMMessage)
                  await gameGM.send({embeds:[{
                    title: "Sign-ups Changed",
                    description: `A player, ${user.username}, has removed themselves from the sign-ups for your game, "${gameRow.group}."`,
                    fields: gmResponseFields,
                  }]});
                if(advertiseData.signups.length < advertiseData.limit)
                {
                  for(let k in advertiseData.waitlist)
                  {
                    // Find the next person in line who still has a reaction.
                    if(this.moonlightrpg.timers[timerid].removed.indexOf(advertiseData.waitlist[k]) == -1)
                    {
                      let movedUserId = advertiseData.waitlist.splice(k, 1)[0];
                      let movedUser = await this.users.fetch(movedUserId);
                      advertiseData.signups.push(movedUserId);
                      gmMessageAdded.push(`${movedUser.username}`);
                      // Note: The below message is defined twice. The second time is in the "reaction added: section.
                      if(!sendOneGMMessage)
                        await gameGM.send({embeds:[{
                          title: "Sign-ups Changed",
                          description: `A new player, ${user.username}, has been added to the sign-ups for your game, "${gameRow.group}." Player was previously on the waitlist. You can check the advertisement here: ${this.website}manage`,
                          fields: gmResponseFields,
                        }]});
                    }
                  }
                }
              }
              else if((i = advertiseData.waitlist.indexOf(userId)) != -1)
              {
                advertiseData.waitlist.splice(i, 1);
                gmMessageRemoved.push(`${user.username}`);
                if(!sendOneGMMessage)
                  await gameGM.send({embeds:[{
                    title: "Sign-ups Changed",
                    description: `A player, ${user.username}, has removed themselves from the waitlist for your game, "${gameRow.group}."`,
                    fields: gmResponseFields,
                  }]});
              }
              if(i != -1)
              {
                let userMsg = {embeds:[{
                  title: "Sign-up Removal Confirmation",
                  description: `You have successfully removed yourself from ${gameGM.username}'s game, "${gameRow.group}."`,
                  fields: [
                    {name: "Game Master", value: `${gameGM.username}`},
                    {name: "Game Name", value: `${gameRow.group}`},
                  ]
                }]};
                try { await user.send(userMsg); }
                catch(x) {
                  console.error("["+(new Date()).toUTCString()+"]", `Could not send confirmation (react removed) message to "${user.username}":`, userMsg, x);
                }
              }
            }
            
            // Add players who added their reaction.
            for(let userId of this.moonlightrpg.timers[timerid].added)
            {
              if(advertiseData.signups.indexOf(userId) != -1 || advertiseData.waitlist.indexOf(userId) != -1)
                continue;
              let user = await this.users.fetch(userId);
              
              // Add them to the sign-ups or wait list as needed, then queue the GM notification.
              if(advertiseData.signups.length < advertiseData.limit)
              {
                advertiseData.signups.push(userId);
                gmMessageAdded.push(`${user.username}`);
                if(!sendOneGMMessage)
                  await gameGM.send({embeds:[{
                    title: "Sign-ups Changed",
                    description: `A new player, ${user.username}, has been added to the sign-ups for your game, "${gameRow.group}." You can check the advertisement here: ${this.website}manage`,
                    fields: gmResponseFields,
                  }]});
              }
              else
              {
                advertiseData.waitlist.push(userId);
                // Newly added waitlist notification.
                gmMessageAdded.push(`${user.username}`);
                if(!sendOneGMMessage)
                  await gameGM.send({embeds:[{
                    title: "Waitlist Changed",
                    description: `A new player, ${user.username}, has been added to the waitlist for your game, "${gameRow.group}." You can check the advertisement here: ${this.website}manage`,
                    fields: gmResponseFields,
                  }]});
              }
              
              // Send the player a confirmation based on whether they have an app or not.
              let playerAppResult = await this.moonlightrpg.database.query("SELECT *,CAST(`id` AS CHAR) AS `id` FROM `dnd` WHERE `id`=? AND (`submitted`>0 OR `changed`>0)", userId);
              let userMsg = {embeds:[{
                title: "Sign-up Confirmation",
                fields: [
                  {name: "Game Master", value: `${gameGM.username}`},
                  {name: "Game Name", value: `${gameRow.group}`},
                ]
              }]};
              if(gameGM == user)
                userMsg.content = `This is a debugging message because you are signing up for your own game.`;
              if(playerAppResult.length || gameGM == user)
              {
                userMsg.embeds[0].description = `You have successfully signed up to ${gameGM.username}'s game, "${gameRow.group}." You have been added to a Wait List of prospective players, but the game's GM has the final say on who they add to their group and how they pick their players.`;
                try { await user.send(userMsg); }
                catch(x) {
                  console.error("["+(new Date()).toUTCString()+"]", `Could not send confirmation (react added; with app) message to "${user.username}":`, userMsg, x);
                  await gameGM.send({content:`An unknown error occurred when trying to send a confirmation message to ${user} (${user.username}). You'll have to confirm with them to let them know that you received their sign-up and/or ask them to fill out an application. Also mention in game masters chat that you got this message, so the devs can try to figure out what went wrong.`});
                }
              }
              if(!playerAppResult.length || gameGM == user)
              {
                userMsg.embeds[0].description = `Hey, you signed up to ${gameGM.username}'s game, but you don't have a Moonlight RPG player application. You have been added to a Wait List of prospective players, but you will need to fill out a player application before being added to the group to receive a Moonlight Player role. You can use the fields below to fill out some of the application. Otherwise, you can fill out a full application here: ${this.website}.`;
                userMsg.components = [
                  {
                    "type": 1,
                    "components": [
                      {
                        "type": 3,
                        "custom_id": "applicationExperience",
                        "options": [
                          {"label":"1 (No experience)", "value":"1"},
                          {"label":"2", "value":"2"},
                          {"label":"3", "value":"3"},
                          {"label":"4", "value":"4"},
                          {"label":"5", "value":"5"},
                          {"label":"6", "value":"6"},
                          {"label":"7", "value":"7"},
                          {"label":"8", "value":"8"},
                          {"label":"9", "value":"9"},
                          {"label":"10", "value":"10"},
                        ],
                        "placeholder": "TTRPG Experience Level",
                      },
                    ],
                  },
                  {
                    "type": 1,
                    "components": [
                      {
                        "type": 2,
                        "custom_id": "applicationModal",
                        "label": "Click For More Fields",
                        "style": 1,
                      },
                    ],
                  },
                ];
                try { await user.send(userMsg); }
                catch(x) {
                  console.error("["+(new Date()).toUTCString()+"]", `Could not send confirmation (react added; no app) message to "${user.username}":`, userMsg, x);
                  await gameGM.send({content:`An unknown error occurred when trying to send a confirmation message to ${user} (${user.username}). You'll have to confirm with them to let them know that you received their sign-up and/or ask them to fill out an application. Also mention in game masters chat that you got this message, so the devs can try to figure out what went wrong.`});
                }
              }
            }
            
            // If the GM notifications are being collected into a single message, do it here.
            if(sendOneGMMessage)
            {
              if(gmMessageRemoved.length)
                gmResponseFields.unshift({name: "Removed Players", value: gmMessageRemoved.join("\n")});
              if(gmMessageAdded.length)
                gmResponseFields.unshift({name: "New Players", value: gmMessageAdded.join("\n")});
              if(gmMessageRemoved.length || gmMessageAdded.length)
                await gameGM.send({embeds:[{
                  title: "Sign-ups Changed",
                  description: `New players have reacted (or unreacted) to your game advertisement message.`,
                  fields: gmResponseFields,
                }]});
            }
            
            // Update the database.
            await this.moonlightrpg.database.query("UPDATE `games` SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(advertiseData), gameRow.index]);
            this.moonlightrpg.timers[timerid] = {
              timeout: 0,
              added: [],
              removed: [],
            };
          }, this.config.signup_delay);
          /******************************
          ** End of reaction handling. **
          ******************************/
        }
        else
        {
          // Player was on ignore list.
        }
      }
    }
  }
};
