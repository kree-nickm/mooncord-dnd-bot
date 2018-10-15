const mysql = require('mysql');
module.exports = function(host, user, password, database, table, column)
{
	this.table = table;
	this.column = column;
	this.ready = false;
	this.pool = mysql.createPool({connectionLimit:3,host:host,user:user,password:password,database:database});
	this.pool.query("SELECT "+ this.pool.escapeId(this.column) +" FROM "+ this.pool.escapeId(this.table) + " LIMIT 0,1", (function(err, results, fields){
		if(err != null)
			console.error("\x1b[31mMySQLApplications Error:\x1b[0m Error connecting to and/or running query on database. %s", err.message);
		else
		{
			this.ready = true;
			console.log("[MySQLApplications] Connected to database.");
		}
	}).bind(this));
	this.findAllAppsByHandle = function(handle, callback)
	{
		if(handle == null)
		{
			if(typeof(callback) == "function")
				callback([]);
		}
		else
		{
			this.pool.query("SELECT * FROM "+ this.pool.escapeId(this.table) + " WHERE "+ this.pool.escapeId(this.column) +" = ?", handle, (function(err, results, fields){
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
	this.shutdown = function(callback)
	{
		this.ready = false;
		this.pool.end(callback);
	};
}
