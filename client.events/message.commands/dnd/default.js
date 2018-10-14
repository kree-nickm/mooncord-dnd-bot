exports.run = function(message, args)
{
	if(message.from_dm || message.from_admin)
		message.reply("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. <:moon2S:496519208549613568>");
	else
		message.author.send("To submit an application to join a D&D game, go to https://goo.gl/forms/vLASDQVIjfGVMfTS2 and fill out the form. <:moon2S:496519208549613568>");
	return true;
};
