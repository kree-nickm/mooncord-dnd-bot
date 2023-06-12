const math = require("mathjs");

exports.run = function(message, args)
{
  //console.log("------------------------");
  // Define basic roll function.
  let rollDie = die => Math.floor(Math.random() * die) + 1;
  
  // The regex for parsing the user command.
  let rexRoll = /\b(?<base>(?<count>\d+)?d(?<size>\d+))(?:[dk][lh]?\d+|[re!]o?(?:>=|<=|>|<|=)?\d*|t(?:>=|<=|>|<|=)?\d+)*\b/;
  let rexDropKeep = /(?<action>[dk])(?<which>[lh])?(?<count>\d+)/;
  let rexReroll = /(?<action>[re!])(?<once>o)?(?<compare>>=|<=|>|<|=)?(?<value>\d+)?/;
  let rexTarget = /(?<action>t)(?<compare>>=|<=|>|<|=)?(?<value>\d+)/;
  
  // Take the string that defines a roll, execute it, and return an object with the relavent data.
  let doRoll = function(string, offset=0)
  {
    //console.log("----------------");
    string = string.substr(offset).toLowerCase();
    let matchRoll = string.match(rexRoll);
    //console.log("["+(new Date()).toUTCString()+"]", "Roll Match:", matchRoll);
    if(matchRoll !== null && typeof(matchRoll) === "object" && matchRoll.groups !== undefined)
    {
      //console.log("["+(new Date()).toUTCString()+"]", "Roll Groups:", matchRoll.groups);
      let rollOutput = {
        total: 0,
        successes: -1,
        rolls: [],
        keepRolls: [],
        activeRolls: [],
        text: "",
        errors: [],
        matchIndex: matchRoll.index + offset,
        matchString: matchRoll[0],
      };
      
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
      let variations = string.substring(matchRoll.index + matchRoll.groups.base.length, matchRoll.index + matchRoll[0].length);
      
      // Handle ...d# ...dl# ...dh# ...k# ...kh# ...kl#
      let matchDropKeep = variations.match(rexDropKeep);
      //console.log("["+(new Date()).toUTCString()+"]", "Drop/Keep Match:", matchDropKeep);
      if(matchDropKeep !== null && typeof(matchDropKeep) === "object" && matchDropKeep.groups !== undefined)
      {
        //console.log("["+(new Date()).toUTCString()+"]", "Drop/Keep Groups:", matchDropKeep.groups);
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
          console.error("["+(new Date()).toUTCString()+"]", "We're somehow in the drop/keep variation when neither 'd' nor 'k' was specified monkaS.");
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
      
      // Handle ...r# ...ro# ...e ...! ...r<# ...etc.
      let rerollError = "";
      let matchReroll = variations.match(rexReroll);
      //console.log("["+(new Date()).toUTCString()+"]", "Reroll Match:", matchReroll);
      if(matchReroll !== null && typeof(matchReroll) === "object" && matchReroll.groups !== undefined)
      {
        //console.log("["+(new Date()).toUTCString()+"]", "Reroll Groups:", matchReroll.groups);
        let value = parseInt(matchReroll.groups.value);
        if(isNaN(value))
        {
          if(matchReroll.groups.action === "e" || matchReroll.groups.action === "!")
            value = diceSize;
          else if(matchReroll.groups.action === "r")
            value = 1;
        }
        
        // Check to see if the roll formula will reroll infinitely, e.g. #d1e1, #d6e>0
        if(diceSize == 1)
          rerollError = "Cannot reroll a 1-sided die.";
        else if(matchReroll.groups.compare === ">" && value < 1 ||
                matchReroll.groups.compare === ">=" && value <= 1 ||
                matchReroll.groups.compare === "<" && value > diceSize ||
                matchReroll.groups.compare === "<=" && value >= diceSize
        )
          rerollError = "Reroll formula would match every roll.";
        
        if(!rerollError)
        {
          let length = rollOutput.rolls.length;
          for(let i=0; i<length; i++)
          {
            if(rollOutput.keepRolls[i] && (
              rollOutput.rolls[i] > value && matchReroll.groups.compare === ">" ||
              rollOutput.rolls[i] >= value && matchReroll.groups.compare === ">=" ||
              rollOutput.rolls[i] < value && matchReroll.groups.compare === "<" ||
              rollOutput.rolls[i] <= value && matchReroll.groups.compare === "<=" ||
              rollOutput.rolls[i] === value && (matchReroll.groups.compare === "=" || matchReroll.groups.compare === undefined)
            ))
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
        else
          rollOutput.errors.push(rerollError);
      }
      
      // Handle ...t#
      let matchTarget = variations.match(rexTarget);
      let targetValue = undefined;
      //console.log("["+(new Date()).toUTCString()+"]", "Target Match:", matchTarget);
      if(matchTarget !== null && typeof(matchTarget) === "object" && matchTarget.groups !== undefined)
      {
        //console.log("["+(new Date()).toUTCString()+"]", "Target Groups:", matchTarget.groups);
        targetValue = parseInt(matchTarget.groups.value);
        rollOutput.successes = 0;
      }
      
      // Tally up the rolls and generate the output.
      for(let i=0; i<rollOutput.rolls.length; i++)
      {
        if(rollOutput.rolls.length < 100 && rollOutput.text !== "")
          rollOutput.text += "+";
        else if(rollOutput.rolls.length >= 100)
          rollOutput.text = "*that's a lot of dice*";
        if(rollOutput.keepRolls[i])
        {
          if(!isNaN(targetValue))
          {
            if(
              rollOutput.rolls[i] > targetValue && matchTarget.groups.compare === ">" ||
              rollOutput.rolls[i] >= targetValue && (matchTarget.groups.compare === ">=" || matchTarget.groups.compare === undefined) ||
              rollOutput.rolls[i] < targetValue && matchTarget.groups.compare === "<" ||
              rollOutput.rolls[i] <= targetValue && matchTarget.groups.compare === "<=" ||
              rollOutput.rolls[i] === targetValue && matchTarget.groups.compare === "="
            )
            {
              rollOutput.successes++;
              if(rollOutput.rolls.length < 100)
                rollOutput.text += "**"+ rollOutput.rolls[i] +"**";
            }
            else if(rollOutput.rolls.length < 100)
              rollOutput.text += rollOutput.rolls[i];
              
          }
          else if(rollOutput.rolls.length < 100)
            rollOutput.text += "**"+ rollOutput.rolls[i] +"**";
          rollOutput.total += rollOutput.rolls[i];
        }
        else
        {
          if(rollOutput.rolls.length < 100)
            rollOutput.text += "~~"+ rollOutput.rolls[i] +"~~";
        }
      }
      return rollOutput;
    }
    else
      return null;
  }
  
  // END definitions. Actual execution starts here.
  let reply = "";
  let resultsArr = [];
  let lines = 0;
  // Recombine the args into the input string, strip spaces before/after mathmatical operators, and split the message up by commas.
  let inputArr = args.join(" ").replace(/\s*([-+\/*()%^,])\s*/g, "$1").split(",");
  inputArr.forEach(input => {
    let calc = input;
    let output = input;
    let offset = 0;
    let calcOffset = 0;
    let outputOffset = 0;
    let rollOutput = null;
    do {
      rollOutput = doRoll(input, offset);
      //console.log("-----------");
      //console.log("["+(new Date()).toUTCString()+"]", "Roll:", rollOutput);
      if(rollOutput !== null)
      {
        offset = rollOutput.matchIndex + rollOutput.matchString.length;
        //console.log("["+(new Date()).toUTCString()+"]", "New Offset:", offset);
        let value = rollOutput.successes>-1 ? rollOutput.successes : rollOutput.total;
        calc = calc.substring(0, rollOutput.matchIndex + calcOffset) + value.toString() + calc.substring(offset + calcOffset);
        calcOffset += value.toString().length - rollOutput.matchString.length;
        //console.log("["+(new Date()).toUTCString()+"]", "New Calc:", calc);
        //console.log("["+(new Date()).toUTCString()+"]", "New Calc Offset:", calcOffset);
        output = output.substring(0, rollOutput.matchIndex + outputOffset) +"("+ rollOutput.text +")"+ output.substring(offset + outputOffset);
        outputOffset += rollOutput.text.length - rollOutput.matchString.length + 2;
        //console.log("["+(new Date()).toUTCString()+"]", "New Output:", output);
        //console.log("["+(new Date()).toUTCString()+"]", "New Output Offset:", outputOffset);
      }
    } while(rollOutput !== null && offset < input.length);
    //console.log("----------------");
    
    // Done parsing rolls into numbers and text, now run the math.
    let result = null;
    try {
      result = math.evaluate(calc);
    }
    catch(x1) {
      // TODO: People love to input things without following the format and get here, so try to handle it a little more gracefully.
      //console.warn("["+(new Date()).toUTCString()+"]", "Couldn't parse expression:", calc);
      calc = calc.replace(/([^-0-9+\/* ().%^]).*/, "");
      //console.warn("["+(new Date()).toUTCString()+"]", "Trying: `"+ calc +"`");
      try {
        result = math.evaluate(calc);
      }
      catch(x2) {
        result = null;
        console.warn("["+(new Date()).toUTCString()+"]", "Still couldn't parse expression:", calc);
      }
    }
    // Format the result.
    if(result || result === 0)
      result = "__**"+ result +"**__";
    else if(resultsArr.length === 0)
      result = "*unable to calculate*";
    // If result is null, assume a comma is just being used in a sentence, not to separate rolls
    if(result)
    {
      if(output.length > 500)
        output = "*(too much text)*";
      reply += "\n> "+ result +" : "+ output;
      resultsArr.push(result);
      lines++;
    }
    else
    {
      reply += ", "+ output;
    }
  });
  if(lines < 20 && reply.length < 1900)
    message.reply(reply);
  else
    message.reply("\n> "+ resultsArr.join(", ") +" *(too many dice/results to print full rolls)*");
  
  return true;
};
exports.help = {
  format: "r #d#",
  short: "Roll some dice. Supports dropping dice, exploding dice, and rerolling dice, as well as some amount of math.",
  long: "Basic usage: 4d6\nDrop lowest 1: 4d6d1\nKeep lowest 1: 4d6kl1\nExplode on crit: 4d6!\nReroll 1s: 4d6r1",
  aliases: ["roll"],
};
