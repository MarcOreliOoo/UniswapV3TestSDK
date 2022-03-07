const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();


module.exports = {
	// See <http://truffleframework.com/docs/advanced/configuration>
	// to customize your Truffle configuration!
	contracts_build_directory: path.join(__dirname, "client/src/contracts"),

	/**
	* Networks define how you connect to your ethereum client and let you set the
	* defaults web3 uses to send transactions. If you don't specify one truffle
	* will spin up a development blockchain for you on port 9545 when you
	* run `develop` or `test`. You can ask a truffle command to use a specific
	* network from the command line, e.g
	*
	* $ truffle test --network <network-name>
	*/

	networks: {
		develop: {
			port: 7545
		},
		rinkeby: {
			provider: function() {
				return new HDWalletProvider(`${process.env.DB_MNEMONIC}`, `https://rinkeby.infura.io/v3/${process.env.DB_INFURANODE}`)
			},
			network_id: 4
		},
		ropsten: {
			provider: function() {
				return new HDWalletProvider(`${process.env.DB_MNEMONIC}`, `https://ropsten.infura.io/v3/${process.env.DB_INFURANODE}`)
			},
			network_id: 3,
			gas: 5500000        // Ropsten has a lower block limit than mainnet
		}
	},

	compilers: {
		solc: {
			version: "0.8.11",    // Fetch exact version from solc-bin (default: truffle's version)
			// docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
			settings: {          // See the solidity docs for advice about optimization and evmVersion
				optimizer: {
					enabled: false,
					runs: 200
				},
		  //  evmVersion: "byzantium"
			}
		}
	  }
};