const { Command, flags } = require("@oclif/command");
const {cli} = require('cli-ux')
const ccxtpro = require ('ccxt.pro')
const colors = require('../utils/colors');
const keys = require('../utils/keys.json');

class ShortPU extends Command {

  // Flag for Sub
  static flags = {
    sub: flags.string(),
  };

  async run() {
    const { flags } = this.parse(ShortPU);
    const exchange = new ccxtpro.ftx ({
        verbose: false,
        apiKey: keys.key,
        secret: keys.secret,
        enableRateLimit: true,
        options: {
          createMarketBuyOrderRequiresPrice: false,
          createMarketSellOrderRequiresPrice: false,
        },        
    }) // <== Get Exchange
    if (flags.sub != null) {
      exchange.headers = {
        "FTX-SUBACCOUNT": flags.sub,
      };
      console.log(`${colors.FgYellow}${flags.sub} subaccount active${colors.Reset}`);
    } // <== Flag for Sub.

    const sleep = (milliseconds) => { return new Promise(resolve => setTimeout(resolve, milliseconds)) } // <== Sleep Function

    // User Input
    console.log(`You chose to ${colors.FgRed}SELL${colors.Reset} the spread of ${colors.FgRed}PERP/USD${colors.Reset}. Lets create the order:`);
    let coin = await cli.prompt(`${colors.FgRed}What Coin?${colors.Reset}`)
    let totalSize = await cli.prompt(`${colors.FgRed}Total Size${colors.Reset}`)
    let orders = await cli.prompt(`${colors.FgRed}Amount of Orders${colors.Reset}`)
    let minspread = await cli.prompt(`${colors.FgRed}Minimum Spread Requirement${colors.Reset}`);
    let agree = await cli.prompt(`${colors.FgRed}SELL${colors.Reset} the spread of ${colors.FgRed}${coin.toUpperCase()}${colors.Reset} above ${colors.FgRed}${minspread}${colors.Reset}, Each leg will be ${colors.FgRed}${parseInt(totalSize / 2)} coins${colors.Reset}, split across ${colors.FgRed}${orders} orders${colors.Reset}? ${colors.FgYellow}[y/n] ${colors.Reset}`);

    // ShortPU Function
    let time = 0 // <== Define the timer..
    let loop = 0 // <== Count the loops..
    let size = totalSize / 2
    const askRange = []; // <== Define Asks..

      if(agree === "y") {
        while (time < orders) {
            try {
              // Log and Increment Time, delay loop for 50ms.
              console.log(`${colors.Dim}Listening for #${loop+1}...${colors.Reset}`)
              loop++

              // Get Markets
              const usd = await exchange.watchOrderBook (`${coin.toUpperCase()}/USD`, 1)
              const perp = await exchange.watchOrderBook (`${coin.toUpperCase()}-PERP`, 1)
              
              // Create Bid/Ask Spread
              let bid = (perp['bids'][0][0]-usd['asks'][0][0])/perp['bids'][0][0]*100
              let ask = (perp['asks'][0][0]-usd['bids'][0][0])/perp['asks'][0][0]*100

              // Print Bid/Ask & Build Array
              console.log(`Sell: ${bid}`);
              console.log(`Buy: ${ask}`);

              // Execute Orders
              if(bid > minspread) {
                time++ // <== Increment Order Counter
                askRange.push(bid);
                // Build The Order
                const toShort = `${coin.toUpperCase()}-PERP`;
                const toLong  = `${coin.toUpperCase()}/USD`;
                const amount  = size / orders;
                // Send To FTX
                exchange.createMarketSellOrder(toShort, amount);
                exchange.createMarketBuyOrder(toLong, amount);
                // Log Order
                console.log(`${colors.FgRed}Order #${time} Executed! ${colors.Reset}`);
                await sleep(500)
              }

          } catch (e) {
              console.log (colors.FgRed, e, colors.Reset)
              // throw e // uncomment to stop the loop on exceptions
          }
        }            

        // Fill Log
        askRange.sort(function (a, b) { return a - b;}); // <== Sorts array from low to high
        console.log(`${colors.Dim}-----------${colors.Reset}`);
        console.log(`${colors.FgCyan}Order Complete @ ${new Date().toLocaleString()}!${colors.Reset}`);
        console.log(`${colors.FgRed}Account: Sold ${coin} in ${colors.Reset} ${flags.sub ? flags.sub : 'Main' }`);        
        console.log(`${colors.FgRed}Highest Fill:${colors.Reset} ${askRange[askRange.length - 1]}`);
        console.log(`${colors.FgRed}Average Fill:${colors.Reset} ${askRange.reduce((a, b) => a + b) / parseInt(askRange.length)}`);
        console.log(`${colors.FgRed}Lowest Fill:${colors.Reset} ${askRange[0]}`);
        console.log(`${colors.Dim}Note: Screenshot this for your journal.${colors.Reset}`)
      } else {
        console.log(`${colors.BgRed}${colors.FgBlack}Operation Aborted.${colors.Reset}`);
        process.exit();
      }
    process.exit()
  }
}

// Descriptor
ShortPU.description = `Sell Spread of PERP/USD`;

// Export Command
module.exports = ShortPU;