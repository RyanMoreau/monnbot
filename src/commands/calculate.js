const { Command } = require("@oclif/command");
const {cli} = require('cli-ux')
const ccxtpro = require ('ccxt.pro')
const numeral = require("numeral");
const colors = require('../utils/colors');
const keys = require('../utils/keys.json');

class PositionBuilder extends Command {
  run() {
    var main = (function* () {
      // Enqueue Readline Function (Mimics an ASYNC function.)
      var r = require("readline");
      var rl = r.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Questions
      console.log(
        `Lets ${colors.Bright}CALCULATE${colors.Reset} your position size:`
      );
      var coin = yield rl.question(
        `${colors.Bright}What Coin?: ${colors.Reset}`,
        (r) => main.next(r)
      );
      var size = yield rl.question(
        `${colors.Bright}Total Size in USD?: ${colors.Reset}`,
        (r) => main.next(r)
      );

      // Close the readline (AKA end the async function)
      rl.close();

      // Calculator Logic
      (async () => {
        let ftx = new ccxtpro.ftx();
        let markets = await ftx.load_markets();
        // Define empty array, if market exists push to array. If not, log to console.
        let availableMarkets = [];
        if (typeof markets[`${coin.toUpperCase()}/USD`] !== "undefined") {
          availableMarkets.push(markets[`${coin.toUpperCase()}/USD`]);
        } else {
          console.log(
            `${colors.Dim}USD Market Unavailable.${colors.Reset}`
          );
        }
        if (typeof markets[`${coin.toUpperCase()}-PERP`] !== "undefined") {
          availableMarkets.push(markets[`${coin.toUpperCase()}-PERP`]);
        } else {
          console.log(
            `${colors.FgBlack}Perpetual Market Unavailable.${colors.Reset}`
          );
        }
        if (
          typeof markets[`${coin.toUpperCase()}-${keys.fut}`] !== "undefined"
        ) {
          availableMarkets.push(markets[`${coin.toUpperCase()}-${keys.fut}`]);
        } else {
          console.log(
            `${colors.Dim}Future Market Unavailable.${colors.Reset}`
          );
        }

        let price = []
        let minTick = []
        availableMarkets.forEach((m) => {
          price.push(parseFloat(m.info.price));
          minTick.push(m.info.minProvideSize)
        });
        var highestPrice = price.reduce(function(a, b) {
            return Math.max(a, b)
        });        
        var highestMinTick = minTick.reduce(function(a, b) {
            return Math.max(a, b)
        });
        console.log('---------------')
        let totalCoins = size/highestPrice
        console.log(`Your ${colors.Bright}${coin.toUpperCase()}${colors.Reset} position should be:`)
        console.log(`${colors.Bright}Total Coin Size:${colors.Reset} ${totalCoins} (${numeral(size).format('$0, $0.00')} @ $${highestPrice})`)
        console.log(`${colors.Bright}Amount of Orders:${colors.Reset} ${parseFloat(totalCoins)/parseFloat(highestMinTick)/2}`)
        console.log(`Note: Orders are calculated with minimum tick. Feel free to increase this.`)
        cli.url('More Details', `https://mdnf.netlify.app/coin/${coin.toUpperCase()}`)
        process.exit()
      })();
    })();
    // Reset Function.
    main.next();
  }
}

// Descriptor
PositionBuilder.description = `Position Builder`;

// Export Command
module.exports = PositionBuilder;