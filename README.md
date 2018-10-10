# Mooncord D&D
This bot is to assist members of MOONMOON_OW's subscriber Discord with joining Mooncord D&D games.

## For Public Users
The bot understands the following commands:
* `!dnd` Directs the caller to the Mooncord D&D application form.
* `!dnd app` Checks on the status of the caller's D&D application. Dungeon masters can tag a user in this command to retreive the same information.

## For Developers and Hosts
If you wish to host or develop this bot, follow the installation steps below, then the steps for the appropriate section.

### Installation
1. Install [Node.js](https://nodejs.org/en/download/). Make sure it is added to PATH or the below commands won't work without tweaks.
2. Clone this repository into a directory of your choice.
3. In that directory, run the command `npm install discord.js` to install the Discord module.
4. Setup the `config.json` file in that directory. See one of the options below for details.

### Develop
If you are not an approved host of the official bot, you'll need to create your own bot. Follow these steps to do so:
1. [Create a Discord application.](https://discordapp.com/developers/applications) Make note of its Client ID.
2. Add a bot to your application and copy down its token for later. It does not require an OAuth2 code grant and probably should not be a public bot.
3. Have the bot join a server/guild of your choice that you have admin rights to and that you are going to use for testing. To do this, you must visit a specific URL, which will look like this: `https://discordapp.com/api/oauth2/authorize?client_id=<PASTE CLIENT ID HERE>&scope=bot`, replacing `<PASTE CLIENT ID HERE>` with the Client ID of your application from step 1.
4. The bot should now be shown in the user list of your server/guild.

Once the bot is in your desired server and you have installed the files to your system as described above, you now need to set up the `config.json` file, assuming you have not already been provided with it. If you plan on developing a Discord bot, you should be familiar with JavaScript, and the proceeding instructions will assume as much.
1. `dnd_bot.js` should have an example `config.json` at the top inside of a comment. Paste the JSON code into a new file in the same directory, named `config.json`.
2. In the `token` property, paste your bot's token that was mentioned above.
3. The `channel_ids` property should be an array of the IDs of any and all channels in which you want the bot to read and respond to commands (IDs are 18-digit numbers).
4. The `admin_ids` property is an array of user IDs for users who will be recognized as bot admins, preferably including your Discord user ID (again this is an 18-digit number, not your username or anything like that). This is technically optional, but without it, you will not be able to use or test any admin-only commands.
5. The `dm_role_id` property should contain the role ID that dungeon masters will be assigned (another 18-digit number). This is optional if you are just testing the bot by yourself, because if the bot recognizes you as an admin, you can use all DM commands without this.

Obtaining the above IDs in an easy way is unfortunately beyond the scope of this tutorial at this time. I found them by navigating the Discord API using the bot. You could find them by `console.log`ing the object inside the `message` event and examining the output.

The bot should now be fully set up and ready to be hosted so that you can test your changes. See below for hosting instructions.

### Host
The official bot can only be hosted by approved members of Mooncord D&D. If you wish to host this bot, you should already know who to contact about it. You will need to be provided the correct `config.json` file. If you are a developer, see the Develop section for how to make your own.
1. (Optional) Pull the latest changes from GitHub.
2. Copy the latest `config.json` into the install directory. This should only be needed if you just installed the bot. It might be needed if you pulled the latest changes, depending on what was changed. It will also be needed if the bot's login token has changed.
3. Run the command `node dnd_bot.js` in the directory where it is installed.
4. Check the console every once in a while to see if any errors are being reported.
