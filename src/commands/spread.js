// SWAP BALANCES WITH ACCOUNT MARGIN.
const { Command, flags } = require("@oclif/command");
const {cli} = require('cli-ux')
const ccxtpro = require ('ccxt.pro')
const colors = require('../utils/colors');
const keys = require('../utils/keys.json');
const numeral = require('numeral')

class SpreadScalp extends Command {

  // Flag for Sub
  static flags = {
    type: flags.string({
      description: 'either uf, pf, pu. uf = usd/fut, pf = perp/fut, pu = perp/usd',
    }),
    future: flags.string({
      description: 'specify a futures contract',
    })
  };

  async run() {
    const { flags } = this.parse(SpreadScalp);

    // Specify Future
    let future = []
    if(flags.future) {
      future = flags.future
    } else {
      future = keys.fut
    }

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

    // Define Variables
    console.log(`You want to ${colors.FgMagenta}SCALP${colors.Reset} a spread. Lets create the order:`);
    let coin = await cli.prompt(`${colors.FgMagenta}What Coin?${colors.Reset}`)
    let sellMin = await cli.prompt(`${colors.FgMagenta}Minimum Sell${colors.Reset}`) // <=== Sell anything above this number. (SELL HIGH)
    let buyMin = await cli.prompt(`${colors.FgMagenta}Minimum Buy${colors.Reset}`) // <==== Buy anything below this number. (BUY LOW)
    let direction = await cli.prompt(`Buy or Sell? ${colors.FgMagenta}[b/s]${colors.Reset}`) // <== Set direction of scalper
    let agree = await cli.prompt(`${colors.FgMagenta}${direction === 'b' ? 'Buy' : 'Sell'}${colors.Reset} the ${colors.FgMagenta}${rangeType}${colors.Reset} spread of ${colors.FgMagenta}${coin.toUpperCase()}${colors.Reset}. ${direction === 'b' ? `Enter at ${colors.FgMagenta}${buyMin} and Take Profit at ${sellMin}. ${colors.Reset}` : `Enter at ${colors.FgMagenta}${sellMin} and Take Profit at ${buyMin}. ${colors.Reset}`}Correct? ${colors.FgYellow}[y/n] ${colors.Reset}`);

    // COUNTERS
    let getUpdate = 100 // <== Fetch Update Every X Loops
    let loop = 0
    let buys = 0
    let sells = 0
    let totalPosition = 0

    // FILLING STATUS
    let filling = true 
    
    // MIN TICK.
    let markets = await exchange.load_markets();
    let minTick = markets[`${coin.toUpperCase()}/USD`].info.minProvideSize

    if(agree === 'y') {
    while (filling) {
        try {
            // Log and Increment Time.
            console.log(`${colors.Dim}Listening for #${loop+1}...${colors.Reset}`)
            loop++

            let bid
            let ask
            // Get Markets
            if (rangeType === 'perp/usd') {
              const usd = await exchange.watchOrderBook (`${coin.toUpperCase()}/USD`, 1)
              const perp = await exchange.watchOrderBook (`${coin.toUpperCase()}-PERP`, 1)

              bid = (perp['bids'][0][0]-usd['asks'][0][0])/perp['bids'][0][0]*100
              ask = (perp['asks'][0][0]-usd['bids'][0][0])/perp['asks'][0][0]*100
            } else if(rangeType === 'perp/fut') {
              const perp = await exchange.watchOrderBook (`${coin.toUpperCase()}-PERP`, 1)
              const fut = await exchange.watchOrderBook (`${coin.toUpperCase()}-${keys.fut}`, 1)

              bid = (perp['bids'][0][0]-fut['asks'][0][0])/perp['bids'][0][0]*100
              ask = (perp['asks'][0][0]-fut['bids'][0][0])/perp['asks'][0][0]*100
            } else if(rangeType === 'usd/fut') {
              const usd = await exchange.watchOrderBook (`${coin.toUpperCase()}/USD`, 1)
              const fut = await exchange.watchOrderBook (`${coin.toUpperCase()}-${keys.fut}`, 1)

              bid = (usd['bids'][0][0]-fut['asks'][0][0])/usd['bids'][0][0]*100
              ask = (usd['asks'][0][0]-fut['bids'][0][0])/usd['asks'][0][0]*100
            }

            // Get Balance & Asset Price
            let account = await exchange.fetchBalance()
            let freeBalance = account['USD']['free']       
            // let price = parseFloat(fut['bids'][0]) + parseFloat(usd['asks'][0]) / 2

            // console.log(colors.BgGreen, colors.FgBlack, freeBalance, ` - `, totalPosition, colors.Reset)

            // Size = 10% Best Bid/Ask.
            // let bidSize = usd.bids[0][1] / 10
            // let askSize = usd.asks[0][1] / 10    
            // let orderSize = Math.min(bidSize, askSize) // <== Smallest size is used.
            // let newOrder = parseInt(orderSize * price)

            // Print Bid/Ask & Build Array
            console.log(`Buy: ${ask}`);
            console.log(`Sell: ${bid}`);


            // BUYS
            if(ask < buyMin ) { // <== Buy Low. newOrder for LIVE. 
                // if(freeBalance > totalPosition && minTick < newOrder) {
                    // totalPosition+=newOrder
                    console.log(`${colors.FgMagenta}Buy #${buys} Executed! ${colors.Reset}`);

                // } else {
                //   console.log(`${colors.FgMagenta}BUY. Small Order Or Minimal Balance${colors.Reset}`)
                // }
                buys++

                // if() {
                //   REDUCE ONLY ORDERS IF OPPOSITE DIRECTION
                // }

            } 
            
            // SELLS
            if(bid > sellMin) { // <== Sell High. newOrder for LIVE
                // if(freeBalance > totalPosition*-1 && minTick < newOrder) {
                    // totalPosition-=newOrder
                    console.log(`${colors.FgRed}Sell #${sells} Executed! ${colors.Reset}`);

                // } else {
                //   console.log(`${colors.FgMagenta}SELL. Small Order Or Minimal Balance${colors.Reset}`)
                // }
                sells++

                // if() {
                //   REDUCE ONLY ORDERS IF OPPOSITE DIRECTION
                // }

            }

            // Account Update Every 100 Loops.
            if(loop == getUpdate) {
                getUpdate+=100
                console.log(`${colors.FgCyan}Coin: ${coin} Min Sell: ${sellMin}, Min Buy: ${buyMin}${colors.Reset}`)
                console.log(`${colors.FgCyan}Breakdown - Buys: ${buys} & Sells: ${sells}${colors.Reset}`)
                // console.log(`${colors.FgCyan}Dollar Size: ${numeral(totalPosition).format('$0, $0.00')}${colors.Reset}`)
            }

            // Kill or Reset Process.
            // if(freeBalance < newBalance) { // <== DEVELOPMENT ONLY
            // // if(freeBalance < 1) { // <== PRODUCTION ONLY
            //     console.log('Done Filling.')
            //     filling = false 
            // }
 
        } catch (e) {
            console.log (colors.FgRed, e, colors.Reset)
            // throw e // uncomment to stop the loop on exceptions
        }
      }
    } else {
      console.log(`${colors.BgRed}${colors.FgBlack}Operation Aborted.${colors.Reset}`);
      process.exit();
  }

      process.exit()
  }
}

// Descriptor
SpreadScalp.description = `Spread Scalper.`;

// Export Command
module.exports = SpreadScalp;