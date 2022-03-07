const ethers = require('ethers');
require('dotenv').config();

//Noeud mainnet via ID projet Infura
const rpcURL = `https://mainnet.infura.io/v3/${process.env.DB_INFURANODE}`;
const privateKey = Buffer.from(process.env.DB_PRIVKEY0, 'hex');
const provider = new ethers.providers.JsonRpcProvider(rpcURL);

//V3 pool we're trying to query
const poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";

//interface for the functions of the pool contract that we'll be calling
const poolImmutablesAbi = [
  "function factory() external view returns (address)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function tickSpacing() external view returns (int24)",
  "function maxLiquidityPerTick() external view returns (uint128)",
];

//new instance of a "Contract" using ethers.js.
//This isn't a smart contract itself, but rather a local model of one that helps us move data around off-chain
const poolContract = new ethers.Contract(
  poolAddress,
  poolImmutablesAbi,
  provider
);

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

getPoolImmutables().then((result) => {
	console.log(result);
});