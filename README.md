# Mooncord D&D
This bot is to assist members of MOONMOON_OW's subscriber Discord with joining Mooncord D&D games.

## For Public Users
The bot understands the following commands:
* __`!dnd`__ Directs the caller to the Mooncord D&D application form.
* __`!dnd app`__ Checks on the status of the caller's D&D application. Dungeon masters can @mention a user in this command to retreive the same information. Alternatively, they can type a username at the end of the command (which is not an @mention) to search for it instead. In either case, only one person's apps can be searched for at a time.
* __`!dnd lastrefresh`__ Displays the last time that the application list was refreshed.
* __`!dnd refresh`__ __DMs Only.__ Will refresh the application list. Any new apps submitted in between calls to this command won't be recognized. Unfortunately this is necessary with the current API to save time and bandwidth, however, this command will be run every hour on its own.
* __`!dnd shutdown`__ __Admins Only.__ Cleanly disconnects the bot from all APIs or other services that it is connected to before ending the process.

The bot does have an internal command cooldown to prevent it from being spammed.

## For Developers and Hosts
If you wish to host or develop this bot, follow the installation steps below, then the steps for the appropriate section.

### Installation
1. Install [Node.js](https://nodejs.org/en/download/). Make sure it is added to PATH or the below commands won't work without tweaks.
2. Clone this repository into a directory of your choice.
3. In that directory, run the command `npm install discord.js` to install the Discord API module.
4. In that directory, do one or both of the below options to install the necessary module to access the application list:
 * Run the command `npm install google-spreadsheet` to install the Google Drive API module.
 * Run the command `npm install mysql` to install the MySQL module. __Note: This is not yet used, so it's only needed if you are developing the bot and want to update the MySQL-related code.__
5. Setup the `config.json` file in that directory. If you have been provided with one, simply copy it into the directory and proceed to the [Host](#host) instructions. Otherwise, you'll need to follow the [Develop](#develop) instructions first.

### Develop
#### Creating a Bot Account
Approved hosts will have access to the actual Mooncord bot via the `config.json` file they should be provided. If you are not an approved host of the official bot, you'll need to set up your own bot. Follow these steps to do so:
1. [Create a Discord application.](https://discordapp.com/developers/applications) Make note of its Client ID.
2. Add a bot to your application and copy down its token for later. It does not require an OAuth2 code grant and probably should not be a public bot.
3. Have the bot join a server/guild of your choice that you have admin rights to and that you are going to use for testing. To do this, you must visit a specific URL, which will look like this: `https://discordapp.com/api/oauth2/authorize?client_id=<PASTE CLIENT ID HERE>&scope=bot`, replacing `<PASTE CLIENT ID HERE>` with the Client ID of your application from step 1.
4. The bot should now be shown in the user list of your server/guild.

#### Accessing a Google Spreadsheet
Approved hosts will have access to the actual application list via the `config.json` file they should be provided. Otherwise, if you want to test changes that you make to the bot's ability to read spreadsheets, you'll need to setup your own Google Spreadsheet and [allow the bot to access it](https://www.npmjs.com/package/google-spreadsheet#authentication). The JSON key file mentioned by the linked guide needs to be named `credentials.json` and placed in the same directory as the bot. In addition to a column for Discord handles as defined in `config.json`, there also needs to be a column for the date the app was submitted. That column must be named `timestamp` and be any human-readable date format.

#### Accessing MySQL
__Note: MySQL is not currently used for the applications, but might be in the future.__ Approved hosts will have access to the actual application list via the `config.json` file they should be provided. Otherwise, if you want to test changes that you make to the bot's ability to read MySQL, you'll need to setup your own database and use its details in a `config.json` of your own. In addition to a column for Discord handles as defined in `config.json`, there also needs to be a column for the date the app was submitted/changed. That column must be named `changed` and be a UNIX timestamp.

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
	"dm_role_id": "##################",
	
	"google_sheet": "google-spreadsheet-id",
	"sheet_id": "worksheet-id",
	"handle_column": "discordhandlecolumnheader",
	
	"mysql_host": "ip.or.hostname",
	"mysql_user": "mysql_user_name",
	"mysql_pass": "***********",
	"mysql_db": "mysql_database",
	"mysql_table": "applications_table",
	"mysql_column": "column_with_discord_handles"
}
```
The properties are as follows (any time an ID of something in Discord is mentioned, it is referring to the 18-digit number known as a "snowflake" in the Discord API):
* __`token`__: Your bot's token, as mentioned in the section about creating a bot.
* __`prefix`__: The text that any command must begin with in order for the bot to process it. For the live hosted bot, this must be `"!"`. However, if you are developing the live bot while the actual host is already running it, you should change this to something else so that user commands aren't duplicated on both machines. For example, you could change it to `"!test"`, and then commands would be run by typing `!testdnd` instead of `!dnd` for your development version.
* __`guild_id`__: The ID of the server/guild that the bot will operate in. This is optional, but if the bot is being used via direct message, it can only check if the message sender has the dungeon master role if the guild ID is specified here.
* __`channel_ids`__: An array of the IDs of any and all channels in which you want the bot to read and respond to commands. These are optional, but without them, the bot can only respond to direct messages.
* __`admin_ids`__: An array of user IDs for users who will be recognized as bot admins, preferably including your own Discord user ID. These are optional, but without them, you will not be able to use or test any admin-only commands.
* __`dm_role_id`__: The role ID that dungeon masters will be assigned. This is optional if you are just testing the bot by yourself, because if the bot recognizes you as an admin, you can use all DM commands without this. Otherwise, without this, DM-only commands won't work.
* __`google_sheet`__: _Only needed if using Google Sheets API_ The identifier of the Google Sheet that contains the list of applications. This is a long string of characters often found in the URL of the Google Sheet, ie. `"1IdR7hbgv-t1barrGEj659vyZ3jdbrz1-Thewrwm5vis"`.
* __`sheet_id`__: _Only needed if using Google Sheets API_ The identifier of the specific tab of the above Google Sheet that represents the list of applications. This is a shorter string of characters, ie. `"onqmyzf"`.
* __`handle_column`__: _Only needed if using Google Sheets API_ The column header of the column of the sheet that contains the Discord handle (ie. Name#1234). This should be the text in the header cell, but all lower case and with only letters and numbers (no spaces etc). For example, if the header cell contains "Discord Handle?", this value should be `"discordhandle"`.
* __`mysql_*`__: _Only needed if using MySQL_ Most should be self explanatory.
* __`mysql_table`__: _Only needed if using MySQL_ Table of the database that contains all of the applications.
* __`mysql_column`__: _Only needed if using MySQL_ Name of the column that contains Discord handles.

Obtaining the above IDs/identifiers in an easy way is unfortunately beyond the scope of this tutorial at this time. You could find the Discord IDs by doing a `console.log(message);` inside of the message event and examining the output. You could find the spreadsheet tab identifiers by doing a `console.log(info.worksheets);` inside the `doc.getInfo` function.

The bot should now be fully set up and ready to be hosted so that you can test your changes. See below for hosting instructions.

### Host
The official bot can only be hosted by approved members of Mooncord D&D. If you wish to host this bot, you should already know who to contact about it. You will need to be provided the correct `config.json` file. If you are a developer, see the [Develop](#develop) section for how to make your own.
1. (Optional) Pull the latest changes from GitHub.
2. Copy the latest `config.json` into the install directory. This should only be needed if you just installed the bot. It might be needed if you pulled the latest changes, depending on what was changed. It will also be needed if the bot's login token has changed.
3. Run the command `node dnd_bot.js` in the directory where it is installed.
4. Check the console every once in a while to see if any errors are being reported.
