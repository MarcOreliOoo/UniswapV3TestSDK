const ethers = require('ethers');
const Pool = require("@uniswap/v3-sdk");
const Token = require("@uniswap/sdk-core");
const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const abi  = [IUniswapV3PoolABI];
require('dotenv').config();



/**
 * We're gonna create a Pool refering the actual V3 Pool using the fetched data from the EVM, using the V3 SDK
 * The idea is to manipulate that model of the real pool to avoid continuially fetching pool data from the EVM
 * which can be time intensive and computationallyty costly
 * 
 * More information in the documentation : https://docs.uniswap.org/sdk/guides/creating-a-pool
 */

/**
 * #1 : Importing the Abi
 */
//Noeud mainnet via ID projet Infura
const rpcURL = `https://mainnet.infura.io/v3/${process.env.DB_INFURANODE}`;
const privateKey = Buffer.from(process.env.DB_PRIVKEY0, 'hex');
const provider = new ethers.providers.JsonRpcProvider(rpcURL);

//V3 pool we're trying to query
const poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";

console.log(typeof(IUniswapV3PoolABI));
//new instance of a "Contract" using ethers.js.
//This isn't a smart contract itself, but rather a local model of one that helps us move data around off-chain
const poolContract = new ethers.Contract(
	poolAddress,
	abi,
	provider
);


/**
 * #2 : Creating the interfaces for TS only
 *  
 */
/*interface Immutables {
	factory: string;
	token0: string;
	token1: string;
	fee: number;
	tickSpacing: number;
	maxLiquidityPerTick: ethers.BigNumber;
}

interface State {
	liquidity: ethers.BigNumber;
	sqrtPriceX96: ethers.BigNumber;
	tick: number;
	observationIndex: number;
	observationCardinality: number;
	observationCardinalityNext: number;
	feeProtocol: number;
	unlocked: boolean;
}
*/


/**
 * #3 : Fetching Immutable Data and State Data
 *  
 */
//Query EVM and return Chain Data
async function getPoolImmutables() {
	return [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
      	poolContract.factory(),
		poolContract.token0(),
		poolContract.token1(),
		poolContract.fee(),
		poolContract.tickSpacing(),
		poolContract.maxLiquidityPerTick(),
    ]);
}

async function getPoolState() {
	const [liquidity, slot] = await Promise.all([
		poolContract.liquidity(),
		poolContract.slot0(),
	]);

	return [liquidity,slot[0],slot[1],slot[2],slot[3],slot[4],slot[5],slot[6]];
}

getPoolImmutables().then((result) => {
	console.log("ok");
});

getPoolState().then((result) => {
	console.log(result);
})