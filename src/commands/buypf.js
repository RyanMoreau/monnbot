const { Command, flags } = require("@oclif/command");
const {cli} = require('cli-ux')
const ccxtpro = require ('ccxt.pro')
const colors = require('../utils/colors');
const keys = require('../utils/keys.json');

class LongPF extends Command {

  // Flag for Sub
  static flags = {
    sub: flags.string(),
    future: flags.string({
      description: 'specify a futures contract',
    })
  };

  async run() {
    const { flags } = this.parse(LongPF);

    // Specify Future
    let future = []
    if(flags.future) {
      future = flags.future
    } else {
      future = keys.fut
    }

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
    console.log(`You chose to ${colors.FgGreen}BUY${colors.Reset} the spread of ${colors.FgGreen}PERP/FUT-${future}${colors.Reset}. Lets create the order:`);
    let coin = await cli.prompt(`${colors.FgGreen}What Coin?${colors.Reset}`)
    let totalSize = await cli.prompt(`${colors.FgGreen}Total Size${colors.Reset}`)
    let orders = await cli.prompt(`${colors.FgGreen}Amount of Orders${colors.Reset}`)
    let minspread = await cli.prompt(`${colors.FgGreen}Minimum Spread Requirement${colors.Reset}`);
    let agree = await cli.prompt(`${colors.FgGreen}BUY${colors.Reset} the spread of ${colors.FgGreen}${coin.toUpperCase()}${colors.Reset} below ${colors.FgGreen}${minspread}${colors.Reset}, Each leg will be ${colors.FgGreen}${parseFloat(totalSize / 2)} coins${colors.Reset}, split across ${colors.FgGreen}${orders} orders${colors.Reset}? ${colors.FgYellow}[y/n] ${colors.Reset}`);

    // LongPF Function
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
              const fut = await exchange.watchOrderBook (`${coin.toUpperCase()}-${future}`, 1)
              const perp = await exchange.watchOrderBook (`${coin.toUpperCase()}-PERP`, 1)
              
              // Create Bid/Ask Spread
              let bid = (perp['bids'][0][0]-fut['asks'][0][0])/perp['bids'][0][0]*100
              let ask = (perp['asks'][0][0]-fut['bids'][0][0])/perp['asks'][0][0]*100

              // Print Bid/Ask & Build Array
              console.log(`Buy: ${ask}`);
              console.log(`Sell: ${bid}`);

              // Execute Orders
              if(ask < minspread) {
                time++ // <== Increment Order Counter
                askRange.push(ask);
                // Build The Order
                const toLong = `${coin.toUpperCase()}-PERP`;
                const toShort = `${coin.toUpperCase()}-${future}`;
                const amount = size / orders;
                // Send To FTX
                exchange.createMarketBuyOrder(toLong, amount);
                exchange.createMarketSellOrder(toShort, amount);
                // Log Order
                console.log(`${colors.FgGreen}Order #${time} Executed! ${colors.Reset}`);
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
        console.log(`${colors.FgGreen}Account: Bought ${coin} in ${colors.Reset} ${flags.sub ? flags.sub : 'Main' }`);        
        console.log(`${colors.FgGreen}Highest Fill:${colors.Reset} ${askRange[askRange.length - 1]}`);
        console.log(`${colors.FgGreen}Average Fill:${colors.Reset} ${askRange.reduce((a, b) => a + b) / parseInt(askRange.length)}`);
        console.log(`${colors.FgGreen}Lowest Fill:${colors.Reset} ${askRange[0]}`);
        console.log(`${colors.Dim}Note: Screenshot this for your journal.${colors.Reset}`)
      } else {
        console.log(`${colors.BgRed}${colors.FgBlack}Operation Aborted.${colors.Reset}`);
        process.exit();
      }
    process.exit()
  }
}

// Descriptor
LongPF.description = `Buy Spread of PERP/FUT`;

// Export Command
module.exports = LongPF;