# Mooncord D&D
This bot is to assist members of MOONMOON_OW's subscriber Discord with joining Mooncord D&D games.

## For Public Users
The bot understands the following commands:
* __`!help`__ Describes all of the bot's capabilities, some of which may not be listed here.
* __`!dnd`__ Directs the caller to the Mooncord D&D application form.
* __`!dnd app`__ Checks on the status of the caller's D&D application. Dungeon masters can @mention a user in this command to retreive the same information. Alternatively, they can type a username at the end of the command (which is not an @mention) to search for it instead. In either case, only one person's apps can be searched for at a time.
* __`!dnd shutdown`__ __Admins Only.__ Cleanly disconnects the bot from all APIs or other services that it is connected to before ending the process.

The bot does have an internal command cooldown to prevent it from being spammed.

## For Developers and Hosts
If you wish to host or develop this bot, follow the installation steps below, then the steps for the appropriate section.

### Installation
1. Install [Node.js](https://nodejs.org/en/download/). Make sure it is added to PATH or the below commands won't work without tweaks.
2. Clone this repository into a directory of your choice.
3. In that directory, run the command `npm install` to automatically install all of the Node.js dependencies, including the Discord and MySQL APIs.
5. Setup the `config.json` file in that directory. If you have been provided with one, simply copy it into the directory and proceed to the [Host](#host) instructions. Otherwise, you'll need to follow the [Develop](#develop) instructions first. If no `config.json` is present, the bot will attempt to load the necessary configuration options from environment variables (using commas to separate the array values).

### Develop
#### Creating a Bot Account
Approved hosts will have access to the actual Mooncord bot via the `config.json` file they should be provided. If you are not an approved host of the official bot, you'll need to set up your own bot. Follow these steps to do so:
1. [Create a Discord application.](https://discordapp.com/developers/applications) Make note of its Client ID.
2. Add a bot to your application and copy down its token for later. It does not require an OAuth2 code grant and probably should not be a public bot.
3. Have the bot join a server/guild of your choice that you have admin rights to and that you are going to use for testing. To do this, you must visit a specific URL, which will look like this: `https://discordapp.com/api/oauth2/authorize?client_id=<PASTE CLIENT ID HERE>&scope=bot`, replacing `<PASTE CLIENT ID HERE>` with the Client ID of your application from step 1.
4. The bot should now be shown in the user list of your server/guild.

#### Accessing MySQL
Approved hosts will have access to the actual application list via the `config.json` file they should be provided. Otherwise, if you want to test changes that you make to the bot's ability to read MySQL, you'll need to setup your own database and use its details in a `config.json` of your own. In addition to a column for Discord handles as defined in `config.json`, there also needs to be a column for the date the app was submitted/changed. That column must be named `changed` and be a UNIX timestamp.

Additionally, the official bot must utilize a SocksConnection to access MySQL, because the official MySQL database requires IPs to be whitelisted, and the official bot host uses dynamic IPs. Using a SocksConnection allows the connection to be routed through static IPs. You can ignore this, and your bot will try to connect directly to MySQL, but then you won't be able to test any changes that affect that part of the bot. Unfortunately, I don't yet have a good description of how you can set that up yourself, other than going all-out and setting up a Heroku account, using Fixie Socks, and testing your bot with that.

#### config.json
Once the bot is in your desired server/guild and you have installed the files to your system as described above, you now need to set up the `config.json` file, assuming you have not already been provided with it. This file contains private information that allows you to connect to the bot as well as the application list. The official file is only given to approved hosts, but you can make your own for testing purposes. If you plan on developing a Discord bot, you should be familiar with JavaScript, and the proceeding instructions will assume as much.

Create a file in the same directory as the bot named `config.json`. The content should be something like below:
```json
{
	"token": "application-bot-secret-token",
	"prefix": "!",
	"guild_id": "##################",
	"channel_ids": ["##################","##################"],
	"admin_ids": ["##################","##################"],
	"dm_role_ids": ["##################"],
	
	"mysql_host": "ip.or.hostname",
	"mysql_user": "mysql_user_name",
	"mysql_pass": "***********",
	"mysql_db": "mysql_database",
	
	"socks_connection": "socks host"
}
```
The properties are as follows (any time an ID of something in Discord is mentioned, it is referring to the 18-digit number known as a "snowflake" in the Discord API):
* __`token`__: Your bot's token, as mentioned in the section about creating a bot.
* __`prefix`__: The text that any command must begin with in order for the bot to process it. For the live hosted bot, this must be `"!"`. However, if you are developing the live bot while the actual host is already running it, you should change this to something else so that user commands aren't duplicated on both machines. For example, you could change it to `"!test"`, and then commands would be run by typing `!testdnd` instead of `!dnd` for your development version.
* __`guild_id`__: The ID of the server/guild that the bot will operate in. This is optional, but if the bot is being used via direct message, it can only check if the message sender has the dungeon master role if the guild ID is specified here.
* __`channel_ids`__: An array of the IDs of any and all channels in which you want the bot to read and respond to commands. These are optional, but without them, the bot can only respond to direct messages.
* __`admin_ids`__: An array of user IDs for users who will be recognized as bot admins, preferably including your own Discord user ID. These are optional, but without them, you will not be able to use or test any admin-only commands.
* __`dm_role_ids`__: An array of the role IDs that dungeon masters will be assigned. This is optional if you are just testing the bot by yourself, because if the bot recognizes you as an admin, you can use all DM commands without this. Otherwise, without this, DM-only commands won't work.
* __`mysql_*`__: Most should be self explanatory.
* __`socks_connection`__: The string provided by the socks host for connecting to their service. Optional if not using SocksConnection.

Obtaining the above IDs/identifiers can usually be done by enabling Developer Mode in Discord (Found in User Settings > Appearance). With that, you can right-click various things in Discord (users, channels, servers, etc.) and select Copy ID to have the ID copied to your clipboard. If you can't find it that way, you could find the Discord IDs by doing a `console.log(message);` inside of the message event and examining the output.

The bot should now be fully set up and ready to be hosted so that you can test your changes. See below for hosting instructions.

### Host
The official bot can only be hosted by approved members of Mooncord D&D. If you wish to host this bot, you should already know who to contact about it. You will need to be provided the correct `config.json` file. If you are a developer, see the [Develop](#develop) section for how to make your own.
1. (Optional) Pull the latest changes from GitHub.
2. Copy the latest `config.json` into the install directory. This should only be needed if you just installed the bot. It might be needed if you pulled the latest changes, depending on what was changed. It will also be needed if the bot's login token has changed.
3. Run the command `npm start` in the directory where it is installed.
4. Check the console every once in a while to see if any errors are being reported.

The official bot uses Heroku. Our development pipeline admittedly still needs work, but if more developers are interested in helping out with coding the bot, we cna work on rectifying that.
