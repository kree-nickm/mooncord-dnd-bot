exports.run = function(message, args)
{
	// Define basic roll function.
	let rollDie = (die=20) => {
		return Math.floor(Math.random() * die) + 1; // Replace this with a "better" random function if you want.
	};
	
	// The regex for parsing the user command.
	let rexRoll = /(?<count>\d+)?d(?<size>\d+)/;
	let rexDropKeep = /(?<action>[dk])(?<which>[lh])?(?<count>\d+)/;
	let rexReroll = /(?<action>[r!])(?<once>o)?(?<compare>>|<|>=|<=|=)?(?<value>\d+)?/;
	
	let arg = args[0];//args.forEach((arg) => {
		let rollOutput = {
			total: 0,
			rolls: [],
			keepRolls: [],
			activeRolls: [],
			text: "",
		};
		let argLower = arg.toLowerCase();
		let matchRoll = argLower.match(rexRoll);
		//console.log("Roll Match:", matchRoll);
		if(matchRoll !== null && typeof(matchRoll) === "object" && matchRoll.groups !== null)
		{
			//console.log("Roll Groups:", matchRoll.groups);
			let diceCount = parseInt(matchRoll.groups.count);
			if(isNaN(diceCount))
				diceCount = 1;
			let diceSize = parseInt(matchRoll.groups.size);
			for(let i=0; i<diceCount; i++)
			{
				let roll = rollDie(diceSize);
				rollOutput.rolls.push(roll);
				rollOutput.keepRolls.push(true);
				rollOutput.activeRolls.push(roll);
			}
			
			// Now check for roll variations.
			let argVars = argLower.substr(matchRoll.index + matchRoll[0].length);
			
			// Handle ...d# ...dl# ...dh# ...k# ...kh# ...kl#
			let matchDropKeep = argVars.match(rexDropKeep);
			//console.log("Drop/Keep Match:", matchDropKeep);
			if(matchDropKeep !== null && typeof(matchDropKeep) === "object" && matchDropKeep.groups !== null)
			{
				//console.log("Drop/Keep Groups:", matchDropKeep.groups);
				let affectCount = parseInt(matchDropKeep.groups.count);
				let start = 0;
				let end = 0;
				if(matchDropKeep.groups.action === "d")
				{
					if(matchDropKeep.groups.which === "h")
					{
						start = rollOutput.activeRolls.length - affectCount;
						end = rollOutput.activeRolls.length;
					}
					else
					{
						start = 0;
						end = affectCount;
					}
				}
				else if(matchDropKeep.groups.action === "k")
				{
					if(matchDropKeep.groups.which === "l")
					{
						start = affectCount;
						end = rollOutput.activeRolls.length;
					}
					else
					{
						start = 0;
						end = rollOutput.activeRolls.length - affectCount;
					}
				}
				else
				{
					console.error("We're somehow in the drop/keep variation when neither 'd' nor 'k' was specified monkaS.");
				}
				rollOutput.activeRolls.sort((a,b) => {return a-b;});
				for(let i=start; i<end; i++)
				{
					for(let k=0; k<rollOutput.rolls.length; k++)
					{
						if(rollOutput.keepRolls[k] && rollOutput.rolls[k] === rollOutput.activeRolls[i])
						{
							rollOutput.keepRolls[k] = false;
							break;
						}
					}
				}
				rollOutput.activeRolls.splice(start, end-start);
			}
			
			// Handle ...r# ...ro# ...! ...r<# ...etc.
			let matchReroll = argVars.match(rexReroll);
			//console.log("Reroll Match:", matchReroll);
			if(matchReroll !== null && typeof(matchReroll) === "object" && matchReroll.groups !== null)
			{
				//console.log("Reroll Groups:", matchReroll.groups);
				let value = parseInt(matchReroll.groups.value);
				if(isNaN(value))
				{
					if(matchReroll.groups.action === "!")
						value = diceSize;
					else if(matchReroll.groups.action === "r")
						value = 1;
					else
						value = 0;
				}
				let length = rollOutput.rolls.length;
				for(let i=0; i<length; i++)
				{
					let reroll = false;
					if(rollOutput.keepRolls[i])
					{
						if(rollOutput.rolls[i] > value && matchReroll.groups.compare === ">")
						{
							reroll = true;
						}
						else if(rollOutput.rolls[i] >= value && matchReroll.groups.compare === ">=")
						{
							reroll = true;
						}
						else if(rollOutput.rolls[i] < value && matchReroll.groups.compare === "<")
						{
							reroll = true;
						}
						else if(rollOutput.rolls[i] <= value && matchReroll.groups.compare === "<=")
						{
							reroll = true;
						}
						else if(rollOutput.rolls[i] == value)
						{
							reroll = true;
						}
					}
					if(reroll)
					{
						// Remove current roll if not exploding.
						if(matchReroll.groups.action === "r")
						{
							rollOutput.keepRolls[i] = false;
							for(let k=0; k<rollOutput.activeRolls.length; k++)
							{
								if(rollOutput.activeRolls[k] === rollOutput.rolls[i])
								{
									rollOutput.activeRolls.splice(k, 1);
									break;
								}
							}
						}
						// Add a new roll.
						let roll = rollDie(diceSize);
						rollOutput.rolls.push(roll);
						rollOutput.keepRolls.push(true);
						rollOutput.activeRolls.push(roll);
						if(matchReroll.groups.once !== "o")
							length++;
					}
				}
			}
		}
		
		// Tally up the rolls and generate the output.
		for(let i=0; i<rollOutput.rolls.length; i++)
		{
			if(rollOutput.rolls.length < 100 && rollOutput.text !== "")
				rollOutput.text += "+";
			else if(rollOutput.rolls.length >= 100)
				rollOutput.text = "that's a lot of dice";
			if(rollOutput.keepRolls[i])
			{
				rollOutput.total += rollOutput.rolls[i];
				if(rollOutput.rolls.length < 100)
					rollOutput.text += "**"+ rollOutput.rolls[i] +"**";
			}
			else
			{
				if(rollOutput.rolls.length < 100)
					rollOutput.text += "~~"+ rollOutput.rolls[i] +"~~";
			}
		}
		console.log(rollOutput);
	//});
	message.reply("\n>>> __**"+ rollOutput.total +"**__ ("+ rollOutput.text +")");
	return true;
};
exports.help = {
	format: "#d#",
	short: "Roll some dice. Supports dropping dice, exploding dice, and rerolling dice. Doesn't support modifiers.",
	long: "Basic usage: 4d6\nDrop lowest 1: 4d6d1\nKeep lowest 1: 4d6kl1\nExplode on crit: 4d6!\nReroll 1s: 4d6r1",
};
