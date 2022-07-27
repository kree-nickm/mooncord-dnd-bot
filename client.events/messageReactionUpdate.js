// Note: This is not a real Discord.Client event, but we call it manually so we can share code between adding and removing reactions.
module.exports = function(action, reaction, reactUser)
{
   let otheraction = (action=="added" ? "removed" : (action=="removed" ? "added" : null));
   if(otheraction == null)
      return;
   if(!reaction)
      return;
   if(!reactUser.bot && Array.isArray(this.moonlightrpg?.advertisements) && reaction._emoji?.id == this.moonlightrpg.advertReactEmoji)
   {
      for(let a in this.moonlightrpg.advertisements)
      {
         // Is the user reacting to this advertisement?
         if(reaction.message?.id == this.moonlightrpg.advertisements[a].message)
         {
            // Get the ignore list and temporarily add the GM to it.
            let ignore = [];
            if(Array.isArray(this.moonlightrpg.advertisements[a].ignorelist))
               ignore = [...this.moonlightrpg.advertisements[a].ignorelist];
            //ignore.push(this.moonlightrpg.advertisements[a].gm);
            // Is this user allowed to sign-up for this game?
            if(ignore.indexOf(reactUser.id) == -1)
            {
               console.log((new Date()).toUTCString(), `Valid Reaction Witnessed (${action})`, `Message:${reaction.message.id}`, `User:${reactUser.username}#${reactUser.discriminator}`);
               // Prevent users from spamming reactions by delaying the bot's function on a timer.
               let timerid = reaction.message.id;
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
                  console.log((new Date()).toUTCString(), `Reaction Timer Processing`, `Message:${timerid}`);
                  let gameRow = (await this.moonlightrpg.database.queryPromise("SELECT * FROM `games` WHERE `advertiseData`->'$.message'=?", reaction.message.id))[0];
                  let advertiseData = JSON.parse(gameRow.advertiseData);
                  let gameGM = await this.users.fetch(gameRow.dm);
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
                        for(let k in advertiseData.waitlist)
                        {
                           // Find the next person in line who still has a reaction.
                           if(this.moonlightrpg.timers[timerid].removed.indexOf(advertiseData.waitlist[k]) == -1)
                           {
                              let movedUserId = advertiseData.waitlist.splice(k, 1)[0];
                              let movedUser = await this.users.fetch(movedUserId);
                              advertiseData.signups.push(movedUserId);
                              gmMessageAdded.push(`${movedUser.username}#${movedUser.discriminator}`);
                           }
                        }
                     }
                     else if((i = advertiseData.waitlist.indexOf(userId)) != -1)
                     {
                        advertiseData.waitlist.splice(i, 1);
                     }
                     user.send({embeds:[{
                        title: "Sign-up Removal Confirmation",
                        description: `Your entry has been removed from the sign-up list for the game described below.`,
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
                     }
                     else
                     {
                        advertiseData.waitlist.push(userId);
                     }
                     user.send({embeds:[{
                        title: "Sign-up Confirmation",
                        description: `You have successfully signed up for the game described below. The GM will get in contact with you if you are selected to join their game.`,
                        fields: [
                           {name: "Game Master", value: `${gameGM.username}#${gameGM.discriminator}`},
                           {name: "Game Name", value: `${gameRow.group}`},
                        ]
                     }]});
                  }
                  let gmResponseFields = [
                     {name: "Game Name", value: `${gameRow.group}`},
                     {name: "Advertisement Message Link", value: `${reaction.message.url}`},
                     {name: "Game Management Link", value: `${this.website}manage`},
                  ];
                  if(gmMessageAdded.length)
                     gmResponseFields.push({name: "New Players", value: gmMessageAdded.join("\n")});
                  if(gmMessageRemoved.length)
                     gmResponseFields.push({name: "Removed Players", value: gmMessageRemoved.join("\n")});
                  gameGM.send({embeds:[{
                     title: "Sign-ups Changed",
                     description: `New players have reacted (or unreacted) to your game advertisement message.`,
                     fields: gmResponseFields,
                  }]});
                  // Update the database.
                  await this.moonlightrpg.database.queryPromise("UPDATE `games` SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(advertiseData), gameRow.index]);
                  advertiseData.game = gameRow.index;
                  advertiseData.gm = gameRow.dm;
                  this.moonlightrpg.advertisements[a] = advertiseData;
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
