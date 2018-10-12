# Mooncord D&D
This bot is to assist members of MOONMOON_OW's subscriber Discord with joining Mooncord D&D games.

## For Public Users
The bot understands the following commands:
* `!dnd` Directs the caller to the Mooncord D&D application form.
* `!dnd app` Checks on the status of the caller's D&D application. Dungeon masters can tag a user in this command to retreive the same information.

Most commands will work via direct message, but the bot can't currently verify if you are a dungeon master via direct message, so those commands will not.

## For Developers and Hosts
If you wish to host or develop this bot, follow the installation steps below, then the steps for the appropriate section.

### Installation
1. Install [Node.js](https://nodejs.org/en/download/). Make sure it is added to PATH or the below commands won't work without tweaks.
2. Clone this repository into a directory of your choice.
3. In that directory, run the command `npm install discord.js` to install the Discord API module.
4. In that directory, run the command `npm install google-spreadsheet` to install the Google Drive API module.
5. Setup the `config.json` file in that directory. If you have been provided with one, simply copy it into the directory and proceed to the [Host](#host) instructions. Otherwise, you'll need to follow the [Develop](#develop) instructions first.

### Develop
#### Creating a Bot Account
Approved hosts will have access to the actual Mooncord bot via the `config.json` file they should be provided. If you are not an approved host of the official bot, you'll need to set up your own bot. Follow these steps to do so:
1. [Create a Discord application.](https://discordapp.com/developers/applications) Make note of its Client ID.
2. Add a bot to your application and copy down its token for later. It does not require an OAuth2 code grant and probably should not be a public bot.
3. Have the bot join a server/guild of your choice that you have admin rights to and that you are going to use for testing. To do this, you must visit a specific URL, which will look like this: `https://discordapp.com/api/oauth2/authorize?client_id=<PASTE CLIENT ID HERE>&scope=bot`, replacing `<PASTE CLIENT ID HERE>` with the Client ID of your application from step 1.
4. The bot should now be shown in the user list of your server/guild.

#### Accessing a Google Spreadsheet
Approved hosts will have access to the actual application list via the `config.json` file they should be provided. Otherwise, if you want to test changes that you make to the bot's ability to read spreadsheets, you'll need to setup your own Google Spreadsheet and [allow the bot to access it](https://www.npmjs.com/package/google-spreadsheet#authentication). The JSON key file mentioned by the linked guide needs to be named `credentials.json` and placed in the same directory as the bot.

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
	"handle_column": "discordhandlecolumnheader"
}
```
The properties are as follows (any time an ID of something in Discord is mentioned, it is referring to the 18-digit number known as a "snowflake" in the Discord API):
* `token`: You bot's token, as mentioned in the section about creating a bot.
* `prefix`: Usually "!", this is the text that any command must begin with in order for the bot to process it.
* `guild_id`: The ID of the server/guild that the bot will operate in. This is optional, but if the bot is being used via direct message, it can only check if the message sender has the dungeon master role if the guild ID is specified here.
* `channel_ids`: An array of the IDs of any and all channels in which you want the bot to read and respond to commands.
* `admin_ids`: An array of user IDs for users who will be recognized as bot admins, preferably including your own Discord user ID. This is technically optional, but without it, you will not be able to use or test any admin-only commands.
* `dm_role_id`: The role ID that dungeon masters will be assigned. This is optional if you are just testing the bot by yourself, because if the bot recognizes you as an admin, you can use all DM commands without this.
* `google_sheet`: The identifier of the Google Sheet that contains the list of applications. This is a long string of characters often found in the URL of the Google Sheet, ie. "1IdR7hbgv-t1barrGEj659vyZ3jdbrz1-Thewrwm5vis".
* `sheet_id`: The identifier of the specific tab of the above Google Sheet that represents the list of applications. This is a shorter string of characters, ie. "onqmyzf".
* `handle_column`: The column header of the column of the sheet that contains the Discord handle (ie. Name#1234). This should be the text in the header cell, but all lower case and with only letters and number (no spaces etc). For example, if the header cell contains "Discord Handle?", this value should be "discordhandle".

Obtaining the above IDs/identifiers in an easy way is unfortunately beyond the scope of this tutorial at this time. You could find the Discord IDs by doing a `console.log(message);` inside of the message event and examining the output. You could find the spreadsheet tab identifiers by doing a `console.log(info.worksheets);` inside the `doc.getInfo` function.

The bot should now be fully set up and ready to be hosted so that you can test your changes. See below for hosting instructions.

### Host
The official bot can only be hosted by approved members of Mooncord D&D. If you wish to host this bot, you should already know who to contact about it. You will need to be provided the correct `config.json` file. If you are a developer, see the [Develop](#develop) section for how to make your own.
1. (Optional) Pull the latest changes from GitHub.
2. Copy the latest `config.json` into the install directory. This should only be needed if you just installed the bot. It might be needed if you pulled the latest changes, depending on what was changed. It will also be needed if the bot's login token has changed.
3. Run the command `node dnd_bot.js` in the directory where it is installed.
4. Check the console every once in a while to see if any errors are being reported.
