// Ideally, you'd start the bot in the morning by typing "whatsgoood" and it will show opportunities.

const { Command, flags } = require("@oclif/command");
const ccxtpro = require ('ccxt.pro');
var _ = require('underscore');
// const colors = require('../utils/colors');
// const {cli} = require('cli-ux')

class BinanceFTX extends Command {

  async run() {
    // Specify Arb Exchanges.
    const binance = new ccxtpro.binancecoinm ({ 
      options: {
        defaultType: 'delivery',
      }
    })
    const ftx = new ccxtpro.ftx ()

    // Fetch Markets for Above.
    let binanceMarkets = await binance.fetchMarkets()
    let ftxMarkets = await ftx.fetchMarkets()

    // Get Exchange Base Pairs.
    let binanceBase = [] 
    let ftxBase = []
    binanceMarkets.forEach(b => binanceBase.push(b.base))
    ftxMarkets.forEach(f => ftxBase.push(f.base))

    // Match Up Markets.
    var comparedCoins = binanceBase.filter(function(val) {
      return ftxBase.indexOf(val) != -1;
    })
    let arbCoins = _.uniq(comparedCoins, false) // <=== Remove Duplicates from created list.

    // Get Market Information.
    let coin = 0

    async function getArbs () {    
      await console.log(`Found ${arbCoins.length} Markets...`)

      for (const arbCoin of arbCoins) {
        coin++        
        console.log('-----------------------') // <=== Visual Formatting.
        console.log(`Coin #${coin}: ${arbCoin}`) // <== Display Coin Name & Counter.

        // Get Binance Prices.
        let binanceBook = await binance.watchOrderBook(`${arbCoin}/USD`, 5)
        let binanceBid = binanceBook.bids[0][0]
        let binanceAsk = binanceBook.asks[0][0]

        // Get FTX Prices.
        let FTXBook = await ftx.watchOrderBook(`${arbCoin}-PERP`, 5)
        let FTXbid = FTXBook.bids[0][0]
        let FTXAsk = FTXBook.asks[0][0]

        // BINANCE/FTX SPREADS
        console.log(`Bid Spread: ${(FTXbid-binanceAsk)/FTXbid*100}`)
        console.log(`Ask Spread: ${(FTXAsk-binanceBid)/FTXAsk*100}`)

      }
      process.exit()
    }
    getArbs()        
  }
}
// Descriptor
BinanceFTX.description = `Cross Exchange Arb.`;

// Export Command
module.exports = BinanceFTX;