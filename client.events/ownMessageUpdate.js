// Note: This is not a real Discord.Client event, but we call it manually to keep the messaging event code cleaner.
module.exports = function(message)
{
   let client = this;
   //console.log("Bot Message:", message);
   if(message.embed?.fields?.length > 0) // Determine if this is likely to be an advert message before doing a database query to verify it.
   {
      this.moonlightrpg.database.query("SELECT * FROM games WHERE `advertiseData`->'$.message'=?", message.id, function(err, results, fields){
         if(err)
            console.error(err);
         else
         {
            // Advert message was just posted by a GM using the website. Need to add the advertisement to client.moonlightrpg.advertisements now.
            console.log(results);
            if(results.length)
            {
               let data = JSON.parse(results[0].advertiseData);
               data.game = results[0].index;
               data.gm = results[0].dm;
               let found = client.moonlightrpg.advertisements.findIndex((element) => {return element.message == message.id;});
               if(found != -1)
                  client.moonlightrpg.advertisements[found] = data;
               else
                  client.moonlightrpg.advertisements.push(data);
               console.log(client.moonlightrpg.advertisements);
            }
         }
      });
   }
};
