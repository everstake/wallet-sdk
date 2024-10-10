const aptos = require("aptos");
const {CheckToken, SetStats, ERROR_TEXT} = require("./utils/api");
const BigNumber = require("bignumber.js");
const {UnsetDecimal, SetDecimal} = require("./utils/decimals");

const chain = 'aptos';

const NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const client = new aptos.AptosClient(NODE_URL);

const VALIDATOR_ADDRESS = '0xdb5247f859ce63dbe8940cf8773be722a60dcc594a8be9aca4b76abceb251b8e';

// this variable is the key by which we can find out the balance by the address
const aptosCoin = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";

const decimal = 8
// 100000000 = 1 APT
const baseNum = 100000000;
// min amount for stake if user staking first once
const minAmount = 11;
// min amount for stake if user staked >= 10 APT
const lowerAmount = 0.1;

const wrongTypeMessage = 'Wrong input type';

/** getStakeBalanceByAddress - get stake by address
 * @param {string} address - address
 * @returns {Promise<object>} Promise object with balances
 */
async function getStakeBalanceByAddress(address) {
    try {
        const payload = {
            function: "0x1::delegation_pool::get_stake",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS, address],
        };

        const balance = await client.view(payload);

        return {
            // after STAKE, one of `active` + `pending_active` stake
            active: SetDecimal(new BigNumber(balance[0].toString()), decimal).toString(),
            // one of `inactive` stake FOR each past observed lockup cycle (OLC) on the stake pool
            inactive: SetDecimal(new BigNumber(balance[1].toString()), decimal).toString(),
            // after UNLOCK, one of `pending_inactive` stake scheduled during this ongoing OLC
            pending_inactive: SetDecimal(new BigNumber(balance[2].toString()), decimal).toString(),
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** getLockupSecs - get lockup durations in sec
 * @returns {Promise<string>} Promise number of louckup in seconds
 */
async function getLockupSecs() {
    try {
        const payload = {
            function: "0x1::stake::get_remaining_lockup_secs",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS],
        };
        const result = await client.view(payload);
        return result[0]
    } catch (error) {
        throw new Error(error);
    }
}

/** getBalanceByAddress - get balance by address
 * @param {string} address - address
 * @returns {Promise<string>} Promise object with balance
 */
async function getBalanceByAddress(address) {
    try {
        const resources = await client.getAccountResources(address);
        const accountResource = resources.find((r) => r.type === aptosCoin);

        return SetDecimal(new BigNumber(accountResource.data.coin.value.toString()), decimal).toString();
    } catch (error) {
        throw new Error(error);
    }
}

/** sendTransfer - send amount to recipient
 * @param {string} address - from address
 * @param {string} recipientAddress - recipient Address
 * @param {string} amount - amount of transfer
 * @returns {Promise<object>} Promise object with tx message
 */
async function sendTransfer(address, recipientAddress, amount) {
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const amountBN = new BigNumber(amount)
    try {
        return {
            type: "entry_function_payload",
            function: "0x1::aptos_account::transfer",
            type_arguments: [],
            arguments: [recipientAddress, SetDecimal(amountBN, decimal).toString()],
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** getMinAmountForStake - get min amount for stake
 * @param {string} address - staker address
 * @returns {Promise<string>} Promise with min number
 */
async function getMinAmountForStake(address) {
    try {
        const balance = await getStakeBalanceByAddress(address);

        if (new BigNumber(minAmount).minus(balance.active).lte(0)) {
            return lowerAmount.toString()
        } else {
            return new BigNumber(minAmount).minus(balance.active).toString()
        }
    } catch (error) {
        throw new Error(error);
    }
}

/** stake - make stake tx
 * @param {string} token - Auth API token
 * @param {string} address - staker address
 * @param {string} amount - Amount of stake
 * @returns {Promise<Object>} Promise with TX payload
 */
async function stake(token, address, amount) {
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    const amountBN = new BigNumber(amount)
    const balance = await getStakeBalanceByAddress(address);
    const active = new BigNumber(balance.active);
    const activeAfter = active.plus(amountBN);
    if (activeAfter.lt(minAmount)) {
        throw new Error(`active stake should be more than ${minAmount.toString()}`);
    }
    try {
        await SetStats(token, 'stake', amount, address, '', chain);
        return {
            type: "entry_function_payload",
            function: "0x1::delegation_pool::add_stake",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS, UnsetDecimal(amountBN, decimal).toString()],
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** reactivate - make reactivate tx
 * @param {string} token - Auth API token
 * @param {string} address - staker address
 * @param {string} amount - Amount of stake
 * @returns {Promise<Object>} Promise with reactivated TX payload
 */
async function reactivate(token, address, amount) {
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    const amountBN = new BigNumber(amount)
    const balance = await getStakeBalanceByAddress(address);
    const active = new BigNumber(balance.active);
    const activeAfter = active.plus(amountBN);
    if (activeAfter.lt(minAmount) && !activeAfter.isEqualTo(0)) {
        throw new Error(`active stake should be more than ${minAmount.toString()}`);
    }
    const pending = new BigNumber(balance.pending_inactive);
    const pendingAfter = pending.minus(amountBN);
    if (pendingAfter.lt(minAmount) && !pendingAfter.isEqualTo(0)) {
        throw new Error(`pending inactive stake should be more than ${minAmount.toString()}`);
    }
    try {
        await SetStats(token, 'reactivate_stake', amount, address, '', chain);

        return {
            type: "entry_function_payload",
            function: "0x1::delegation_pool::reactivate_stake",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS, UnsetDecimal(amountBN, decimal).toString()],
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** unlock - make unlock tx
 * @param {string} token - Auth API token
 * @param {string} address - staker address
 * @param {string} amount - Amount of stake
 * @returns {Promise<Object>} Promise with unlocked TX payload
 */
async function unlock(token, address, amount) {
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    const amountBN = new BigNumber(amount)
    const balance = await getStakeBalanceByAddress(address);
    const active = new BigNumber(balance.active);
    const activeAfter = active.minus(amountBN);
    if (activeAfter.lt(minAmount) && !activeAfter.isEqualTo(0)) {
        throw new Error(`active stake should be more than ${minAmount.toString()}`);
    }
    const pending = new BigNumber(balance.pending_inactive);
    const pendingAfter = pending.plus(amountBN);
    if (pendingAfter.lt(minAmount) && !pendingAfter.isEqualTo(0)) {
        throw new Error(`pending inactive stake should be more than ${minAmount.toString()}`);
    }
    try {
        await SetStats(token, 'unlock_stake', amount, address, '', chain);
        return {
            type: "entry_function_payload",
            function: "0x1::delegation_pool::unlock",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS, UnsetDecimal(amountBN, decimal).toString()],
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** unstake - make unstake tx
 * @param {string} token - Auth API token
 * @param {string} address - staker address
 * @param {string} amount - Amount of stake
 * @returns {Promise<Object>} Promise with unstake TX payload
 */
async function unstake(token, address, amount) {
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    const amountBN = new BigNumber(amount);
    const balance = await getStakeBalanceByAddress(address);
    const inactive = new BigNumber(balance.inactive);
    if (inactive.lt(amountBN)) {
        throw new Error(`not enough inactive balance. You have ${inactive.toString()} APT`);
    }
    try {
        await SetStats(token, 'unstake', amount, address, '', chain);
        return {
            type: "entry_function_payload",
            function: "0x1::delegation_pool::withdraw",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS, UnsetDecimal(amountBN, decimal).toString()],
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** createClient - create client instance
 * @param {string} NODE_URL - base url of node API
 * @returns {Promise<Object>} Promise with unlocked TX payload
 */
async function createClient(NODE_URL) {
    try {
        return new aptos.AptosClient(NODE_URL);
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
    // func
    getBalanceByAddress,
    sendTransfer,
    stake,
    reactivate,
    unlock,
    unstake,
    getStakeBalanceByAddress,
    createClient,
    getMinAmountForStake,
    getLockupSecs,

    // const
    NODE_URL,
    aptosCoin,
    baseNum,
    minAmount,
    lowerAmount,
    VALIDATOR_ADDRESS,
}
