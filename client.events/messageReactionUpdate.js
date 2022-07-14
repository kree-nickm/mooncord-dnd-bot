// Note: This is not a real Discord.Client event, but we call it manually so we can share code between adding and removing reactions.
module.exports = function(action, reaction, user)
{
   let otheraction = (action=="added" ? "removed" : (action=="removed" ? "added" : null));
   if(otheraction == null)
      return;
   if(!reaction)
      return;
   if(Array.isArray(this.moonlightrpg?.advertisements))
   {
      for(let advert of this.moonlightrpg.advertisements)
      {
         if(reaction.message?.id == advert.message && reaction._emoji?.id == this.moonlightrpg.advertReactEmoji)
         {
            // TODO: Also make sure it's not the GM or the bot.
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
            let already = this.moonlightrpg.timers[timerid][otheraction].indexOf(user.id);
            if(already != -1)
            {
               this.moonlightrpg.timers[timerid][otheraction].splice(already, 1);
            }
            else
            {
               this.moonlightrpg.timers[timerid][action].push(user.id);
            }
            
            // Either way, restart the timer.
            clearTimeout(this.moonlightrpg.timers[timerid].timeout);
            this.moonlightrpg.timers[timerid].timeout = setTimeout(async () => {
               //console.log("----- Reaction Processing -----");
               //console.log(reaction);
               //console.log("----- Reaction Users -----");
               //console.log(reaction.users.cache);
               //console.log("----- Reaction Timer Data -----");
               //console.log(this.moonlightrpg.timers[timerid]);
               let game = (await this.moonlightrpg.database.queryPromise("SELECT * FROM `games` WHERE `advertiseData`->'$.message'=?", reaction.message.id))[0];
               //console.log("----- Advert Game Row -----");
               //console.log(game);
               let advertiseData = JSON.parse(game.advertiseData);
               //console.log("----- Advert Data -----");
               //console.log(advertiseData);
               let GM = await this.users.fetch(game.dm);
               for(let uid of this.moonlightrpg.timers[timerid].removed)
               {
                  let uobj = await this.users.fetch(uid);
                  let i;
                  if((i = advertiseData.signups.indexOf(uid)) != -1)
                  {
                     advertiseData.signups.splice(i, 1);
                     GM.send(`One of your players, ${uobj}, in the game "${game.group}" has removed themselves from the sign-up list. You can check the advertisement here: ${reaction.message.url}`);
                     uobj.send(`You have removed yourself from ${GM}'s game, "${game.group}". The GM has been notified as well. Anyone on the waitlist has been notified that a slot has opened up.`);
                     for(let k in advertiseData.waitlist)
                     {
                        // We can't just take the next person, because what if they are about to be removed when we iterate through this.moonlightrpg.timers[timerid].removed? Pointless messages would get spammed, that's what.
                        if(this.moonlightrpg.timers[timerid].removed.indexOf(advertiseData.waitlist[k]) == -1)
                        {
                           let movedUserId = advertiseData.waitlist.splice(k, 1)[0];
                           let movedUser = await this.users.fetch(movedUserId);
                           advertiseData.signups.push(movedUserId);
                           GM.send(`However, ${movedUser}, a player from the waitlist for "${game.group}", has now been moved to the player list.`);
                           movedUser.send(`A player in ${GM}'s game, "${game.group}", has dropped out. Because you were first on the waitlist, you have now been added to the player list for that game. The GM has been notified as well and should get in touch iwth you when they are ready.`);
                        }
                     }
                  }
                  else if((i = advertiseData.waitlist.indexOf(uid)) != -1)
                  {
                     advertiseData.waitlist.splice(i, 1);
                     uobj.send(`You have been removed from the waitlist for ${GM}'s game, "${game.group}".`);
                  }
               }
               for(let uid of this.moonlightrpg.timers[timerid].added)
               {
                  if(advertiseData.signups.indexOf(uid) != -1 || advertiseData.waitlist.indexOf(uid) != -1)
                     continue;
                  let uobj = await this.users.fetch(uid);
                  if(advertiseData.signups.length < advertiseData.limit)
                  {
                     advertiseData.signups.push(uid);
                     GM.send(`A new player, ${uobj}, has been added to the sign-ups for your game, "${game.group}". You can check the advertisement here: ${reaction.message.url}`);
                     uobj.send(`You have successfully signed up for ${GM}'s game, "${game.group}". The GM has been notified as well and should get in touch with you when they are ready.`);
                  }
                  else
                  {
                     advertiseData.waitlist.push(uid);
                     uobj.send(`You attempted to sign up for ${GM}'s game, "${game.group}". However, the game has already reached its sign-up limit. You've been added to a waitlist in case anyone drops out of the game, and you'll be notified automatically if a spot opens up for you.`);
                  }
               }
               await this.moonlightrpg.database.queryPromise("UPDATE `games` SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(advertiseData), game.index]);
               /*this.moonlightrpg.database.queryPromise("UPDATE `games` SET `advertiseData`=? WHERE `index`=?", [JSON.stringify(advertiseData), game.index]).then(
                  result => console.log("Database updated:", result),
                  err => console.error("Error updating database:", err)
               );*/
               // TODO: Update client.moonlightrpg.advertisements ? idk, we're not really even using it past initialization.
               this.moonlightrpg.timers[timerid] = {
                  timeout: 0,
                  added: [],
                  removed: [],
               };
            }, 5000);
         }
      }
   }
};
