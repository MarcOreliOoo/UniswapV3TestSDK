const ethers = require('ethers');
const { Pool } = require("@uniswap/v3-sdk");
const { Route } = require("@uniswap/v3-sdk");
const { CurrencyAmount } = require("@uniswap/v3-sdk");
const { TradeType } = require("@uniswap/v3-sdk");
const { Trade } = require("@uniswap/v3-sdk");
const { Token }  = require("@uniswap/sdk-core");

const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const poolABI  = IUniswapV3PoolABI.abi;
const QuoterABI  = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const quoterABI  = QuoterABI.abi;

require('dotenv').config();

// Noeud mainnet via ID projet Infura
const rpcURL = `https://mainnet.infura.io/v3/${process.env.DB_INFURANODE}`;
const privateKey = Buffer.from(process.env.DB_PRIVKEY0, 'hex');
const provider = new ethers.providers.JsonRpcProvider(rpcURL);

console.log(CurrencyAmount);

/**
 * We're using the pool object to quote an estimated amount out for a trade, then creates a trade object that can be used to execute a swap.
 * More information in the documentation : https://docs.uniswap.org/sdk/guides/creating-a-trade
 */

//////////////
// I. Creation a pool
//////////////


// V3 pool we're trying to query
const poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";

// Creating a new instance of a "Contract" using ethers.js.
//This isn't a smart contract itself, but rather a local model of one that helps us move data around off-chain
const poolContract = new ethers.Contract(poolAddress, poolABI, provider);

//Query EVM and return Chain Data
async function getPoolImmutables() {	
	/*
	const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
		poolContract.factory(),
		poolContract.token0(),
		poolContract.token1(),
		poolContract.fee(),
		poolContract.tickSpacing(),
		poolContract.maxLiquidityPerTick(),
	]);
	let immutables = [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick].reduce((a, v) => ({ ...a, [a]: v}), { factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick });
	*/

	const myTab = await Promise.all([
		poolContract.factory(),
		poolContract.token0(),
		poolContract.token1(),
		poolContract.fee(),
		poolContract.tickSpacing(),
		poolContract.maxLiquidityPerTick(),
	]);
	
	let immutables = {};
	immutables.factory = myTab[0];
	immutables.token0 = myTab[1];
	immutables.token1 = myTab[2];
	immutables.fee = myTab[3];
	immutables.tickSpacing = myTab[4];
	immutables.maxLiquidityPerTick = myTab[5];
	
	return immutables;
}

//Return the state of the pool
async function getPoolState() {
	const [liquidity, slot] = await Promise.all([
		poolContract.liquidity(),
		poolContract.slot0()
	]);
	
	let aState = {}
	aState.liquidity = liquidity;
	aState.sqrtPriceX96 = slot.sqrtPriceX96;
	aState.tick = slot.tick;
	aState.observationIndex = slot.observationIndex;
	aState.observationCardinality = slot.observationCardinality;
	aState.observationCardinalityNext = slot.observationCardinalityNext;
	aState.feeProtocol = slot.feeProtocol;
	aState.unlocked = slot.unlocked;

	return aState;
}


//////////////
// II. Creation a quoter
//////////////

// From doc : "The quoter is a smart contract that retrieves estimated output or input amounts for a given swap type.
// This example creates an object in our javascript environment that models the quoter interface, which can be called to return a swap quote.

//quoterAddress
const quoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

//Creating a Quoter Contract Object
const quoterContract = new ethers.Contract(quoterAddress, quoterABI, provider);

// Using callStatic To Return A Quote - why is that ?
// TLDR the doc : the quoteExactInputSingle isn't a view function, hence, cost lots of gas. 
// we use callStatic from ethers.js to simulate that call (the change state is asked to the node with instruction to only simulate)
// Cf. doc for more information

/**
 *  Solidity function we call from callStatic 
 *  function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);
 */

const amountIn = 1500;

async function getQuoteExactInputSingle(immutables){
	const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
		immutables.token0,
		immutables.token1,
		immutables.fee,
		amountIn.toString(),
		0
	);
	return quotedAmountOut;
}

async function main() {
	const [immutables, state] = await Promise.all([
		getPoolImmutables(),
		getPoolState(),
	]);

	const TokenA = new Token(3, immutables.token0, 6, "USDC", "USD Coin");
	const TokenB = new Token(3, immutables.token1, 18, "WETH", "Wrapped Ether");

	const poolExample = new Pool(
		TokenA,
		TokenB,
		immutables.fee,
		state.sqrtPriceX96.toString(),
		state.liquidity.toString(),
		state.tick
	);

	// call the quoter contract to determine the amount out of a swap, given an amount in
	const quotedAmountOut = await getQuoteExactInputSingle(immutables);
	//console.log(quotedAmountOut);

	// create an instance of the route object in order to construct a trade object
	const swapRoute = new Route([poolExample], TokenA, TokenB);
	//console.log(swapRoute);

	// with the Route created, we want to create an unchecked trade instance

	/**
	 * Creates a trade without computing the result of swapping through the route. Useful when you have simulated the trade
	 * elsewhere and do not have any tick data
	 * @template TInput The input token, either Ether or an ERC-20
	 * @template TOutput The output token, either Ether or an ERC-20
	 * @template TTradeType The type of the trade, either exact in or exact out
	 * @param constructorArguments The arguments passed to the trade constructor
	 * @returns The unchecked trade
	*/

	
	const uncheckedTradeExample = await Trade.createUncheckedTrade({
		route: swapRoute,
		inputAmount: CurrencyAmount.fromRawAmount(TokenA, amountIn.toString()),
		outputAmount: CurrencyAmount.fromRawAmount(
			TokenB,
			quotedAmountOut.toString()
		),
		tradeType: TradeType.EXACT_INPUT,
	});

	// print the quote and the unchecked trade instance in the console
	console.log("The quoted amount out is", quotedAmountOut.toString());
	console.log("The unchecked trade object is", uncheckedTradeExample);

}
  
main();