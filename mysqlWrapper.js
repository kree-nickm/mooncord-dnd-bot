const mysql = require("mysql");
const { Buffer } = require('node:buffer');

exports.Database = class {
  basicTypes = {
    'tinyint': "integer",
    'smallint': "integer",
    'mediumint': "integer",
    'int': "integer",
    'integer': "integer",
    'bigint': "bigint",
    'bit': "integer",
    'year': "integer",
    'decimal': "decimal",
    'numeric': "decimal",
    'float': "decimal",
    'double': "decimal",
    'binary': "binary",
    'varbinary': "binary",
    'tinyblob': "binary",
    'blob': "binary",
    'mediumblob': "binary",
    'longblob': "binary",
    'json': "json",
  };
  
  INDEX_KEY = "index ";
  
  constructor(mysql_host, mysql_user, mysql_pass, mysql_db)
  {
    this.mysql = mysql.createPool({
      host: mysql_host,
      user: mysql_user,
      password: mysql_pass,
      database: mysql_db,
    });
  }
  
  query()
  {
    let queryArgs = Array.prototype.slice.call(arguments);
    return new Promise((resolve,reject) => {
      queryArgs.push((err, results, fields) => {
        if(err)
          reject(err);
        else
        {
          if(Array.isArray(results))
            results.forEach(row => {
              for(let column in row)
              {
                if(row[column] instanceof Buffer)
                  row[column] = String(row[column]);
              }
            });
          resolve(results);
        }
      });
      this.mysql.query.apply(this.mysql, queryArgs);
    });
  }
  
  async init()
  {
    this.metadata = {};
    let columns = await this.query("SELECT TABLE_NAME,COLUMN_NAME,COLUMN_DEFAULT,DATA_TYPE,COLUMN_TYPE,COLUMN_KEY,EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME", this.mysql.config.connectionConfig.database);
    for(let row of columns)
    {
      if(!this.metadata[row['TABLE_NAME']])
        this.metadata[row['TABLE_NAME']] = [];
      if(!this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']])
        this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']] = [];
    
      this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']]['default'] = row['COLUMN_DEFAULT'];
      this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']]['type'] = row['DATA_TYPE'];
      this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']]['type_full'] = row['COLUMN_TYPE'];
      this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']]['type_basic'] = this.basicTypes[row['DATA_TYPE']] ?? "text";
      this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']]['key'] = row['COLUMN_KEY'];
      this.metadata[row['TABLE_NAME']][row['COLUMN_NAME']]['extra'] = row['EXTRA'];
    }
    for(let table in this.metadata)
    {
      let tableMeta = this.metadata[table];
      tableMeta[this.INDEX_KEY] = {};
      let indexes = await this.query("SHOW INDEX FROM ?? WHERE Non_unique=0", table);
      for(let row of indexes)
      {
        if(!tableMeta[this.INDEX_KEY][row['Key_name']])
          tableMeta[this.INDEX_KEY][row['Key_name']] = {};
        if(!tableMeta[this.INDEX_KEY][row['Key_name']][row['Seq_in_index']])
          tableMeta[this.INDEX_KEY][row['Key_name']][row['Seq_in_index']] = {};
        tableMeta[this.INDEX_KEY][row['Key_name']][row['Seq_in_index']]['column'] = row['Column_name'];
        tableMeta[this.INDEX_KEY][row['Key_name']][row['Seq_in_index']]['substr'] = row['Sub_part'];
      }
      //for(let tableRowMeta of tableMeta[this.INDEX_KEY])
      //  tableRowMeta.sort();
    }
  }
  
  buildWhereUnique(table, mysql_data)
  {
    let or_clause = [];
    for(let row of (Array.isArray(mysql_data)?mysql_data:[mysql_data]))
    {
      for(let index in this.metadata[table][this.INDEX_KEY])
      {
        let columns = Object.values(this.metadata[table][this.INDEX_KEY][index]);
        let and_clause = []; // This will build the union of all columns that are part of a multi-column index.
        for(let options of columns)
        {
          if(this.metadata[table][options['column']])
          {
            if(row[options['column']] !== undefined)
            {
              if(options['substr'])
                and_clause.push("LEFT(`"+ options['column'] +"`,"+ parseInt(options['substr']) +")=LEFT("+ this.smart_quote(table, options['column'], row[options['column']]) +","+ parseInt(options['substr']) +")");
              else
                and_clause.push("`"+ options['column'] +"`="+ this.smart_quote(table, options['column'], row[options['column']]));
            }
            else
            {
              // TODO use default values, but not if there's another unique index, in which case we need to get that row and use its values instead. Also have to factor in whether the column has a valid default value (for example, AUTO_INCREMENT columns will not).
              and_clause = null;
              break;
            }
          }
          else
          {
            console.warn("Invalid column '"+ options['column'] +"' is part of a column index in MySQL for table '"+ table +"'.");
          }
        }
        if(and_clause)
          or_clause.push("("+ and_clause.join(' AND ') +")");
      }
    }
    if(or_clause.length)
      return "("+ or_clause.join(' OR ') +")";
    else
      return "";
  }
  
  validateColumns(table, mysql_data)
  {
    let result = [];
    if(Array.isArray(mysql_data))
    {
      for(let i in mysql_data)
      {
        for(let column in mysql_data[i])
        {
          if(!this.metadata[table][column])
          {
            result.push(column);
            delete mysql_data[i][column];
          }
        }
      }
    }
    else
    {
      for(let column in mysql_data)
      {
        if(!this.metadata[table][column])
        {
          result.push(column);
          delete mysql_data[column];
        }
      }
    }
    return result;
  }
  
  buildInsertClause(table, mysql_data)
  {
    if(!Array.isArray(mysql_data))
      mysql_data = [mysql_data];
    let rows = [];
    for(let row of mysql_data)
    {
      let fields = [];
      for(let column in row)
      {
        fields.push(this.smart_quote(table, column, row[column]));
      }
      if(fields.length)
        rows.push("("+ fields.join(',') +")");
    }
    if(rows.length)
      return "(`"+ Object.keys(mysql_data[0]).join('`,`') +"`) VALUES"+ rows.join(',');
    else
      return "() VALUES()";
  }
  
	identifyChanges(table, current, previous)
	{
		let newCurrent = {};
		let newPrevious = {};
    for(let currentRow of current)
		{
			let foundPrevious = false;
      for(let previousRow of previous)
			{
				if(currentRow[this.metadata[table][this.INDEX_KEY]['PRIMARY'][1]['column']] == previousRow[this.metadata[table][this.INDEX_KEY]['PRIMARY'][1]['column']])
				{
					foundPrevious = true;
					let newCurrentRow = {};
					let newPreviousRow = {};
          for(let column in currentRow)
					{
            let value = currentRow[column];
						if(value != previousRow[column])
						{
							newCurrentRow[column] = value;
							newPreviousRow[column] = previousRow[column];
						}
					}
					if(Object.keys(newCurrentRow).length)
						newCurrent[currentRow[this.metadata[table][this.INDEX_KEY]['PRIMARY'][1]['column']]] = newCurrentRow;
					if(Object.keys(newPreviousRow).length)
						newPrevious[previousRow[this.metadata[table][this.INDEX_KEY]['PRIMARY'][1]['column']]] = newPreviousRow;
					break;
				}
			}
			if(!foundPrevious)
				newCurrent[currentRow[this.metadata[table][this.INDEX_KEY]['PRIMARY'][1]['column']]] = currentRow;
		}
    return {current:newCurrent, previous:newPrevious};
	}
  
  async insert(table, mysql_data, leave_cols, blameUser)
  {
    if(!this.metadata[table])
      throw new Exception("Failed to insert/update database: `"+ table +"` is not a valid table.");
    if(!mysql_data)
      throw new Exception("Failed to insert/update database: No data array specified.");
    let log = blameUser
      && this.metadata.changelog
      && Object.keys(this.metadata[table][this.INDEX_KEY].PRIMARY).length == 1
      && this.metadata[table][this.metadata[table][this.INDEX_KEY].PRIMARY[1].column].extra == "auto_increment";
    
    let invalid_cols = this.validateColumns(table, mysql_data);
    
    if(invalid_cols.length)
      console.warn(`The following invalid columns for table '${table}' were sent to [Database].insert(): ${invalid_cols.join(', ')}`);
    
    let unique_where = log ? this.buildWhereUnique(table, mysql_data) : undefined;
    
    let update_clause = leave_cols ? " ON DUPLICATE KEY UPDATE " + Object.keys(Array.isArray(mysql_data) ? mysql_data[0]: mysql_data)
        .filter(column => this.metadata[table][column] && !leave_cols.includes(column))
        .map(column => `${this.mysql.escapeId(column)}=VALUES(${this.mysql.escapeId(column)})`)
        .join(',') : "";
    
    // TODO if there are multiple indexes, and this insert causes a single row to combine two separate existing ones, weird stuff happens. MySQL strongly suggests that people not attempt that.
    let previous = unique_where ? await this.query("SELECT * FROM ?? WHERE "+ unique_where, [table]) : undefined;
    let insert_clause = this.buildInsertClause(table, mysql_data);
    
    // Note: ON DUPLICATE KEY UPDATE causes this to not return an actual count. For each row, it returns 1 for an insert or 2 for an update. For multiple rows, it returns the sum of those numbers.
    let response = await this.query("INSERT"+ (update_clause ? "" : " IGNORE") +" INTO ?? "+ insert_clause + update_clause, [table]);
    if(log && response.insertId)
    {
      //console.log(`Logging database update...`);
      let blame;
      let blameRow = await this.query("SELECT `index` FROM `dnd` WHERE `id`=?", blameUser.id);
      if(blameRow.length)
        blame = String(blameRow[0].index);
      else
        blame = blameUser.id;
      let lastInsertId = (await this.query("SELECT LAST_INSERT_ID() FROM ??", table))[0]['LAST_INSERT_ID()'];
      //console.log(`Last ID:`, lastInsertId);
      let affected_ids = [];
      if(previous?.length)
        for(let row of previous)
          affected_ids.push(row[this.metadata[table][this.INDEX_KEY]['PRIMARY'][1]['column']]);
      if(lastInsertId)
      {
        let num = (Array.isArray(mysql_data)?count(mysql_data):1) - affected_ids.length;
        for(let i=0; i<num; i++)
          affected_ids.push(i + lastInsertId);
      }
      //console.log(`New IDs:`, affected_ids);
      let current = await this.query("SELECT * FROM "+ table +" WHERE `"+ this.metadata[table][this.INDEX_KEY]['PRIMARY'][1]['column'] +"` IN ("+ affected_ids.join(',') +")");
      if(previous?.length)
        ({current, previous} = this.identifyChanges(table, current, previous));
      //console.log(`The update:`, {current, previous});
      this.insert("changelog", {
        'table': table,
        'timestamp': Math.round(Date.now()/1000),
        'data': JSON.stringify(current),
        'previous': JSON.stringify(previous),
        'blame': blame,
      });
    }
    return response;
  }
  
  smart_quote(table, k, v)
  {
    if(!this.metadata[table][k])
      return undefined;
    switch(this.metadata[table][k]['type_basic'])
    {
      case "integer":
        return parseInt(v);
      case "bigint":
        return BigInt(v);
      case "decimal":
        return parseFloat(v);
      case "binary":
        if(!v)
          return this.mysql.escape(v);
        else
          return "0x"+ this.ascii_to_hexa(v);
      case "json":
        if(typeof(v) == "object")
          return this.mysql.escape(JSON.stringify(v));
        else
          return this.mysql.escape(v);
      default:
        return this.mysql.escape(v);
    }
  }
  
  ascii_to_hexa(str)
  {
    let arr1 = [];
    for (let n = 0, l = str.length; n < l; n ++) 
    {
      let hex = Number(str.charCodeAt(n)).toString(16);
      arr1.push(hex);
    }
    return arr1.join('');
  }
};