module.exports = function(info)
{
  console.error("["+(new Date()).toUTCString()+"]", "\x1b[31mError:\x1b[0m %s", info);
};
