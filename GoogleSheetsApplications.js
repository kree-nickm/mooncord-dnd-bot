var GoogleSpreadsheet = require('google-spreadsheet');
var credentials = require("./credentials.json");
module.exports = function(spreadsheet_id, worksheet_id, handle_column)
{
	this.spreadsheet_id = spreadsheet_id;
	this.worksheet_id = worksheet_id;
	this.handle_column = handle_column;
	this.doc;
	this.sheet;
	this.all_apps;
	this.ready = false;
	this.loadApplications = function(callback)
	{
		if(this.sheet == null)
		{
			console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Cannot load application list because the worksheet was never loaded.");
			if(typeof(callback) == "function")
				callback(false);
		}
		else
		{
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
					console.log("GoogleSheetsApplications: Application list successfully read into memory.");
					if(typeof(callback) == "function")
						callback(true);
				}
			}).bind(this));
		}
	};
	this.findAppByHandle = function(handle, rowSet)
	{
		if(rowSet == null)
			rowSet = this.all_apps;
		if(rowSet == null)
			return false;
		if(rowSet.length == 0)
			return false;
		var i = Math.floor(rowSet.length/2);
		var comp = handle.toLowerCase().localeCompare(rowSet[i][this.handle_column].toLowerCase());
		if(comp < 0)
			return this.findAppByHandle(handle, rowSet.slice(0, i));
		else if(comp > 0)
			return this.findAppByHandle(handle, rowSet.slice(i, rowSet.length));
		else
			return rowSet[i];
	};
	
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
		this.doc = new GoogleSpreadsheet(this.spreadsheet_id);
		this.doc.useServiceAccountAuth(credentials, (function(err){
			if(err != null)
				console.error("\x1b[31mGoogleSheetsApplications Error:\x1b[0m Unable to authenticate with Google Sheets due to invalid credentials. %s", err.message);
			else
			{
				this.doc.getInfo((function(err,info){
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
								console.log("GoogleSheetsApplications: Application list found.");
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
