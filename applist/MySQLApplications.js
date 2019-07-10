const mysql = require('mysql');
module.exports = function(host, user, password, database)
{
	this.ready = false;
	this.pool = mysql.createPool({connectionLimit:3,host:host,user:user,password:password,database:database});
	this.pool.query("SELECT COUNT(*) AS `count` FROM dnd", (function(err, results, fields){
		if(err != null)
			console.error("\x1b[31mMySQLApplications Error:\x1b[0m Error connecting to and/or running query on database. %s", err.message);
		else
		{
			this.ready = true;
			console.log("[MySQLApplications] Connected to database. %s applications found.", results[0].count);
		}
	}).bind(this));
	this.findAppByID = function(id, callback)
	{
		if(id == null || !this.ready)
		{
			if(typeof(callback) == "function")
				callback([]);
		}
		else
		{
			this.pool.query("SELECT * FROM dnd WHERE `id`=? AND `experience`>0", id, (function(err, results, fields){
				if(err)
				{
					console.error("\x1b[31mMySQLApplications Error:\x1b[0m Error connecting to and/or running query on database. %s", err.message);
					if(typeof(callback) == "function")
						callback([]);
				}
				else if(typeof(callback) == "function")
					callback(results);
			}).bind(this));
		}
	};
	this.confirmRequest = function(id, callback)
	{
		if(id == null || !this.ready)
		{
			if(typeof(callback) == "function")
				callback(-1);
		}
		else
		{
			this.pool.query("UPDATE app_merge_requests SET `status`='confirmed' WHERE `id`=?", id, (function(err, results, fields){
				if(err)
				{
					console.error("\x1b[31mMySQLApplications Error:\x1b[0m Error connecting to and/or running query on database. %s", err.message);
					if(typeof(callback) == "function")
						callback(-1);
				}
				else if(typeof(callback) == "function")
					callback(results.changedRows);
			}).bind(this));
		}
	};
	this.updateRequest = function(id, desc, callback)
	{
		if(id == null || !this.ready)
		{
			if(typeof(callback) == "function")
				callback({changedRows:-1});
		}
		else
		{
			this.pool.query("UPDATE app_merge_requests SET `status`='received',`description`=? WHERE `id`=?", [desc,id], (function(err, updateResults, fields){
				if(err)
				{
					console.error("\x1b[31mMySQLApplications Error:\x1b[0m Error connecting to and/or running query on database. %s", err.message);
					if(typeof(callback) == "function")
						callback({changedRows:-1});
				}
				else if(typeof(callback) == "function")
				{
					this.pool.query("SELECT * FROM app_merge_requests WHERE `id`=?", id, (function(err, selectResults, fields){
						if(err)
						{
							console.error("\x1b[31mMySQLApplications Error:\x1b[0m Error connecting to and/or running query on database. %s", err.message);
							if(typeof(callback) == "function")
								callback({changedRows:-1});
						}
						else if(typeof(callback) == "function")
							callback({changedRows:updateResults.changedRows, row:selectResults[0]});
					}).bind(this));
				}
			}).bind(this));
		}
	};
	this.shutdown = function(callback)
	{
		this.ready = false;
		this.pool.end(callback);
	};
}
