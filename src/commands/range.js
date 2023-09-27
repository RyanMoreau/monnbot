const { Command, flags } = require("@oclif/command");
const {cli} = require('cli-ux')
const ccxtpro = require ('ccxt.pro')
const colors = require('../utils/colors');
const keys = require('../utils/keys.json');

class RangeFinder extends Command {

  static flags = {
    type: flags.string({
      description: 'either uf, pf, pu. uf = usd/fut, pf = perp/fut, pu = perp/usd',
    }),
    future: flags.string({
      description: 'specify a futures contract',
    })
  };

  async run() {
    const { flags } = this.parse(RangeFinder); // <== Parse Flags
    const exchange = new ccxtpro.ftx ({ enableRateLimit: true, newUpdates: false }) // <== Get Exchange
    const sleep = (milliseconds) => { return new Promise(resolve => setTimeout(resolve, milliseconds)) } // <== Sleep Function

    // Process Market Type
    let rangeType
    if (flags.type === 'pu' || flags.type === 'PU') {
      rangeType = 'perp/usd';
    } else if(flags.type === 'pf' || flags.type === 'PF') {
      rangeType = 'perp/fut';
    } else if(flags.type === 'uf' || flags.type === 'UF') {
      rangeType = 'usd/fut';
    } else {
      console.log(`${colors.FgRed}Error: Missing or Invalid Type.${colors.Reset}`)
      process.exit()
    }

    console.log(rangeType)

    // Specify Future
    let future = []
    if(flags.future) {
      future = flags.future
    } else {
      future = keys.fut
    }
    
    // User Input
    console.log(`You Want The ${colors.FgMagenta}RANGE${colors.Reset} of ${colors.FgMagenta}${rangeType.toUpperCase()}${rangeType === 'perp/fut' ? `-${future}` : ''}${colors.Reset}. Lets create the order:`);
    let coin = await cli.prompt(`${colors.FgMagenta}What Coin?: ${colors.Reset}`)
    let iterations = await cli.prompt(`${colors.FgMagenta}Iterations: ${colors.Reset}`)
    let agree = await cli.prompt(`Capture the ${colors.FgMagenta}RANGE${colors.Reset} of ${colors.FgMagenta}${coin.toUpperCase()}${colors.Reset} for ${colors.FgMagenta}${iterations}${colors.Reset} iterations? ${colors.FgYellow}[y/n] ${colors.Reset}`)
    console.log(`${colors.FgCyan}Great! Lets get the range of ${coin.toUpperCase()}.${colors.Reset}`);

    // Range Function
    let time = 0 // <== Define the timer..
    const bidRange = []; // <== Define Bids
    const askRange = []; // <== Define Asks

      if(agree === "y") {
        while (time < iterations) {
            try {
              // Log and Increment Time
              console.log(`${colors.Dim}Listening for #${time+1}...${colors.Reset}`)
              time++

              // Create Bid/Ask Spread
              let bid
              let ask
              if (rangeType === 'perp/usd') {
                const usd = await exchange.watchOrderBook (`${coin.toUpperCase()}/USD`, 1)
                const perp = await exchange.watchOrderBook (`${coin.toUpperCase()}-PERP`, 1)

                bid = (perp['bids'][0][0]-usd['asks'][0][0])/perp['bids'][0][0]*100
                ask = (perp['asks'][0][0]-usd['bids'][0][0])/perp['asks'][0][0]*100
              } else if(rangeType === 'perp/fut') {
                const perp = await exchange.watchOrderBook (`${coin.toUpperCase()}-PERP`, 1)
                const fut = await exchange.watchOrderBook (`${coin.toUpperCase()}-${future}`, 1)

                bid = (perp['bids'][0][0]-fut['asks'][0][0])/perp['bids'][0][0]*100
                ask = (perp['asks'][0][0]-fut['bids'][0][0])/perp['asks'][0][0]*100
              } else if(rangeType === 'usd/fut') {
                const usd = await exchange.watchOrderBook (`${coin.toUpperCase()}/USD`, 1)
                const fut = await exchange.watchOrderBook (`${coin.toUpperCase()}-${future}`, 1)

                bid = (usd['bids'][0][0]-fut['asks'][0][0])/usd['bids'][0][0]*100
                ask = (usd['asks'][0][0]-fut['bids'][0][0])/usd['asks'][0][0]*100
              }

              // Print Bid/Ask & Build Array
              console.log(`Buy: ${ask}`);
              console.log(`Sell: ${bid}`);
              bidRange.push(bid);
              askRange.push(ask);

              await sleep(50)
          } catch (e) {
              console.log (colors.FgRed, e, colors.Reset)
              // throw e // uncomment to stop the loop on exceptions
          }
        }            

        // Print Bid/Ask
        console.log(`${colors.Dim}Process Complete.${colors.Reset}`)
        console.log(`${colors.FgMagenta}Total Data Points: ${colors.Reset} ${coin.toUpperCase()}, ${parseInt(bidRange.length)} Buys, ${parseInt(askRange.length)} Sells.`);

        // Bid Range (Output as SELL)
        bidRange.sort(function (a, b) { return a - b; }); // <== Sorts array from low to high
        console.log(`${colors.FgMagenta}Highest Sell:${colors.Reset} ${bidRange[bidRange.length - 1]}`);
        console.log(`${colors.FgMagenta}Average Sell:${colors.Reset} ${bidRange.reduce((a, b) => a + b) / parseInt(bidRange.length)}`);
        console.log(`${colors.FgMagenta}Lowest Sell:${colors.Reset} ${bidRange[0]}`);
        console.log(`${colors.Dim}-----------${colors.Reset}`);

        // Ask Range (Output as BUY)
        askRange.sort(function (a, b) { return a - b;}); // <== Sorts array from low to high
        console.log(`${colors.FgMagenta}Highest Buy:${colors.Reset} ${askRange[askRange.length - 1]}`);
        console.log(`${colors.FgMagenta}Average Buy:${colors.Reset} ${askRange.reduce((a, b) => a + b) / parseInt(askRange.length)}`);
        console.log(`${colors.FgMagenta}Lowest Buy:${colors.Reset} ${askRange[0]}`);

      } else {
        clearInterval(interval);
        console.log(`${colors.BgRed}${colors.FgBlack}Operation Aborted.${colors.Reset}`);
        process.exit();
      }
    process.exit()
  }
}

// Descriptor
RangeFinder.description = `Get Range Between 2 Assets`;

// Export Command
module.exports = RangeFinder;