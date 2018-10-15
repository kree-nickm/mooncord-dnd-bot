exports.run = function(message, args)
{
	var response = "To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. <:moon2S:496519208549613568>";
	if(message.from_dm || message.from_admin)
		message.reply(response);
	else
		message.author.send(response);
	return true;
};
