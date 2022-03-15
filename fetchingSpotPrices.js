const ethers = require('ethers');
const { Pool } = require("@uniswap/v3-sdk");
const { Token }  = require("@uniswap/sdk-core");

const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const poolABI  = IUniswapV3PoolABI.abi;

require('dotenv').config();

// Noeud mainnet via ID projet Infura
const rpcURL = `https://mainnet.infura.io/v3/${process.env.DB_INFURANODE}`;
const privateKey = Buffer.from(process.env.DB_PRIVKEY0, 'hex');
const provider = new ethers.providers.JsonRpcProvider(rpcURL);



// pool address for DAI/USDC 0.05%
const poolAddress = "0x6c6bc977e13df9b0de53b251522280bb72383700";
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

async function main() {
	const [immutables, state] = await Promise.all([
		getPoolImmutables(),
		getPoolState(),
	]);

  	const DAI = new Token(1, immutables.token0, 18, "DAI", "Stablecoin");
	const USDC = new Token(1, immutables.token1, 18, "USDC", "USD Coin");
	
	const DAI_USDC_POOL = new Pool(
		DAI,
		USDC,
		immutables.fee,
		state.sqrtPriceX96.toString(),
		state.liquidity.toString(),
		state.tick
	  );
	  
	const token0Price = DAI_USDC_POOL.token0Price;
	const token1Price = DAI_USDC_POOL.token1Price;

	console.log("The DAI_USDC_POOL is", DAI_USDC_POOL);
	console.log("token0Price : ",token0Price);
	console.log("token1Price : ",token1Price);
}

main();