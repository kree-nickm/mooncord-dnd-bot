const GoogleSpreadsheet = require('google-spreadsheet');
const fs = require("fs");
var credentials;
if(fs.existsSync("../credentials.json"))
{
	credentials = require("../credentials.json");
}
else
{
	console.log("credentials.json not found, attempting to use environment variables.");
	credentials = JSON.parse(process.env.credentials);
}
module.exports = function(spreadsheet_id, worksheet_id, handle_column)
{
	this.spreadsheet_id = spreadsheet_id;
	this.worksheet_id = worksheet_id;
	this.handle_column = handle_column;
	this.ready = false;
	
	/**
	* Sets this.all_apps to the latest application list loaded from Google Sheets.
	* @param function(boolean) callback When loadApplications finishes its thing, it will call callback with an argument of true if the list was loaded, or false if it was not.
	* @returns boolean True if this function at least attempted to load the application list, or false if it couldn't even attempt to do so because the Google Sheet was never loaded.
	*/
	this.loadApplications = function(callback)
	{
		if(this.sheet == null)
		{
			console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Cannot load application list because the worksheet was never loaded.");
			if(typeof(callback) == "function")
				callback(false);
			return false;
		}
		else
		{
			// Note: The rows MUST be sorted by handle, because we use a binary search to find handles.
			this.sheet.getRows({orderby:this.handle_column}, (function(err,info){
				if(err != null)
				{
					console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Unable to read list of applications: ", err);
					if(typeof(callback) == "function")
						callback(false);
				}
				else if(!Array.isArray(info) || !info.length)
				{
					console.warn("\x1b[1mGoogleSheetsApplications Warning:\x1b[0m No applications found.");
					if(typeof(callback) == "function")
						callback(false);
				}
				else if(info[0][this.handle_column] == null)
				{
					console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Invalid column specified for Discord handles: \x1b[1m%s\x1b[0m", this.handle_column);
					if(typeof(callback) == "function")
						callback(false);
				}
				else
				{
					this.all_apps = info;
					this.ready = true;
					console.log("[GoogleSheetsApplications] Application list successfully read into memory.");
					if(typeof(callback) == "function")
						callback(true);
				}
			}).bind(this));
			return true;
		}
	};
	
	/**
	* Performs a binary search and returns the array index (of this.all_apps) of the given Discord handle.
	* @param string handle The Discord handle to search against. Can be just a username if you are searching for username only.
	* @param array rowSet The array of rows to search. Should only be used when called recursively.
	* @returns int The index of the given handle, or -1 if it wasn't found in this.all_apps.
	*/
	this.findAppIdByHandle = function(handle, rowSet)
	{
		if(handle == null)
			return -1;
		else
			handle = handle.toString();
		if(rowSet == null)
			rowSet = this.all_apps;
		if(rowSet == null)
			return -1;
		if(rowSet.length == 0)
			return -1;
		var i = Math.floor(rowSet.length/2);
		var comp = handle.toLowerCase().localeCompare(rowSet[i][this.handle_column].toLowerCase());
		if(comp < 0)
			return this.findAppIdByHandle(handle, rowSet.slice(0, i));
		else if(comp > 0)
		{
			var result = this.findAppIdByHandle(handle, rowSet.slice(i+1));
			if(result > -1)
				return result + i + 1;
			else
				return -1;
		}
		else
			return i;
	};
	this.findAppByHandle = function(handle)
	{
		var i = this.findAppIdByHandle(handle);
		if(i > -1)
			return this.all_apps[i];
		else
			return false;
	};
	this.findAllAppsByHandle = function(handle, callback)
	{
		var i = this.findAppIdByHandle(handle);
		if(i > -1)
		{
			handle = handle.toLowerCase();
			while(i > 0 && this.all_apps[i-1][this.handle_column].toLowerCase() == handle)
				i--;
			var result = [];
			while(i < this.all_apps.length && this.all_apps[i][this.handle_column].toLowerCase() == handle)
			{
				result.push(this.all_apps[i]);
				i++;
			}
			callback(result);
		}
		else
			callback([]);
	};
	
	/**
	* Constructor code.
	*/
	if(this.spreadsheet_id == null)
		console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m No Google Sheets identifier specified.");
	else if(this.worksheet_id == null)
		console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m No worksheet identifier specified.");
	else if(this.handle_column == null)
		console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m No handle column identifier specified.");
	else if(credentials == null || typeof(credentials) != "object")
		console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m No credentials specified.");
	else
	{
		var doc = new GoogleSpreadsheet(this.spreadsheet_id);
		doc.useServiceAccountAuth(credentials, (function(err){
			if(err != null)
				console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Unable to authenticate with Google Sheets due to invalid credentials. %s", err.message);
			else
			{
				doc.getInfo((function(err,info){
					if(err != null)
						console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Unable to fetch data from Google Sheet: \x1b[1m%s\x1b[0m; Sheet ID or credentials may be invalid.\n\x1b[1m--- BEGIN ERROR RESPONSE ---\x1b[0m\n%s\n\x1b[1m--- END ERROR RESPONSE ---\x1b[0m", this.spreadsheet_id, err);
					else
					{
						//console.log(info.worksheets);
						this.sheet = null;
						for(var i in info.worksheets)
						{
							if(info.worksheets[i].id == this.worksheet_id)
							{
								this.sheet = info.worksheets[i];
								console.log("[GoogleSheetsApplications] Application list found.");
								break;
							}
						}
						if(this.sheet == null)
							console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Application list was not found using worksheet ID: \x1b[1m%s\x1b[0m", this.worksheet_id);
						else
							this.loadApplications();
					}
				}).bind(this));
			}
		}).bind(this));
	}
}
