module.exports = function(info)
{
	console.warn((new Date()).toUTCString(), "\x1b[1mWarning:\x1b[0m %s", info);
};
