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
      console.log((new Date()).toUTCString(), `User ${reactUser.username}#${reactUser.discriminator} reacted with ${reaction._emoji.name}.`);
      let message = await reaction.message.fetch();
      if(message.author.id == this.user.id)
      {
         console.log((new Date()).toUTCString(), `User ${reactUser.username}#${reactUser.discriminator} reacted with ${reaction._emoji.name} to one of my messages (${message.id}) in channel #${message.channel.name}.`);
         // TODO: Any additional layer of validation would be nice. As it is, someone could spam D20 reactions on the bot and make it spam MySQL queries, which could have adverse effects on the server.
         let result = await this.moonlightrpg.database.queryPromise("SELECT * FROM `games` WHERE `advertiseData`->'$.message'=?", message.id);
         if(result.length)
         {
            console.log((new Date()).toUTCString(), `This message is an advertisement for the game "${result[0].group}".`);
            let currentAdvertiseData = JSON.parse(result[0].advertiseData);
            
            // Get the ignore list and temporarily add the GM to it.
            let ignore = [];
            if(Array.isArray(currentAdvertiseData.ignore))
               ignore = [...currentAdvertiseData.ignore];
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
                  this.moonlightrpg.timers[timerid][action].push(reactUser.id);
               }
               
               // Either way, restart the timer.
               clearTimeout(this.moonlightrpg.timers[timerid].timeout);
               this.moonlightrpg.timers[timerid].timeout = setTimeout(async () =>
               {
                  // The actual handling of adding/removing people from the sign-ups/waitlist.
                  let gameRow = (await this.moonlightrpg.database.queryPromise("SELECT * FROM `games` WHERE `advertiseData`->'$.message'=?", message.id))[0];
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
                        gmMessageRemoved.push(`${user.username}#${user.discriminator}`);
                        if(!sendOneGMMessage)
                           gameGM.send({embeds:[{
                              title: "Sign-ups Changed",
                              description: `A player, ${user.username}#${user.discriminator}, has removed themselves from the wait list for your game, "${gameRow.group}."`,
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
                                 gmMessageAdded.push(`${movedUser.username}#${movedUser.discriminator}`);
                                 // Note: The below message is defined twice. The second time is in the "reaction added: section.
                                 if(!sendOneGMMessage)
                                    gameGM.send({embeds:[{
                                       title: "Sign-ups Changed",
                                       description: `A new player, ${user.username}#${user.discriminator}, has been added to the sign-ups for your game, "${gameRow.group}." You can check the advertisement here: ${this.website}manage`,
                                       fields: gmResponseFields,
                                    }]});
                              }
                           }
                        }
                     }
                     else if((i = advertiseData.waitlist.indexOf(userId)) != -1)
                     {
                        advertiseData.waitlist.splice(i, 1);
                     }
                     if(i != -1)
                        user.send({embeds:[{
                           title: "Sign-up Removal Confirmation",
                           description: `You have successfully removed yourself from ${gameGM.username}#${gameGM.discriminator}'s game, "${gameRow.group}."`,
                           fields: [
                              {name: "Game Master", value: `${gameGM.username}#${gameGM.discriminator}`},
                              {name: "Game Name", value: `${gameRow.group}`},
                           ]
                        }]});
                  }
                  
                  // Add players who added their reaction.
                  for(let userId of this.moonlightrpg.timers[timerid].added)
                  {
                     if(advertiseData.signups.indexOf(userId) != -1 || advertiseData.waitlist.indexOf(userId) != -1)
                        continue;
                     let user = await this.users.fetch(userId);
                     if(advertiseData.signups.length < advertiseData.limit)
                     {
                        advertiseData.signups.push(userId);
                        gmMessageAdded.push(`${user.username}#${user.discriminator}`);
                        if(!sendOneGMMessage)
                           gameGM.send({embeds:[{
                              title: "Sign-ups Changed",
                              description: `A new player, ${user.username}#${user.discriminator}, has been added to the sign-ups for your game, "${gameRow.group}." You can check the advertisement here: ${this.website}manage`,
                              fields: gmResponseFields,
                           }]});
                     }
                     else
                     {
                        advertiseData.waitlist.push(userId);
                     }
                     let playerAppResult = await this.moonlightrpg.database.queryPromise("SELECT * FROM `dnd` WHERE `id`=? AND (`submitted`>0 OR `changed`>0)", userId);
                     let description = "";
                     if(playerAppResult.length)
                        description = `You have successfully signed up to ${gameGM.username}#${gameGM.discriminator}'s game, "${gameRow.group}." You have been added to a Wait List of prospective players, but the game's GM has the final say on who they add to their group and how they pick their players.`;
                     else
                        description = `Hey, you signed up to ${gameGM.username}#${gameGM.discriminator}'s game, but you don't have a Moonlight RPG player application. You have been added to a Wait List of prospective players, but you will need to fill out a player application before being added to the group to receive a Moonlight Player role. Filling out a player application does not guarantee you a spot in the game or affect your odds of being chosen by the game's GM. You can fill out an application here: ${this.website}.`;
                     user.send({embeds:[{
                        title: "Sign-up Confirmation",
                        description,
                        fields: [
                           {name: "Game Master", value: `${gameGM.username}#${gameGM.discriminator}`},
                           {name: "Game Name", value: `${gameRow.group}`},
                        ]
                     }]});
                  }
                  if(sendOneGMMessage)
                  {
                     if(gmMessageRemoved.length)
                        gmResponseFields.unshift({name: "Removed Players", value: gmMessageRemoved.join("\n")});
                     if(gmMessageAdded.length)
                        gmResponseFields.unshift({name: "New Players", value: gmMessageAdded.join("\n")});
                     if(gmMessageRemoved.length || gmMessageAdded.length)
                        gameGM.send({embeds:[{
                           title: "Sign-ups Changed",
                           description: `New players have reacted (or unreacted) to your game advertisement message.`,
                           fields: gmResponseFields,
                        }]});
                  }
                  
                  // Update the database.
                  await this.moonlightrpg.database.queryPromise("UPDATE `games` SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(advertiseData), gameRow.index]);
                  this.moonlightrpg.timers[timerid] = {
                     timeout: 0,
                     added: [],
                     removed: [],
                  };
               }, this.config.signup_delay);
            }
         }
      }
   }
};
