const {CheckToken, ERROR_TEXT, SetStats} = require("./utils/api");
const {UnsetDecimal} = require("./utils/decimals");
const BigNumber = require('bignumber.js');
const axios = require('axios');

const API_URL = 'https://cosmos-rest.publicnode.com';
const VALIDATOR_ADDRESS = 'cosmosvaloper1tflk30mq5vgqjdly92kkhhq3raev2hnz6eete3';
const decimals = 6;
const minAmount = new BigNumber(0.01);
const defaultSource = '0'

const chain = 'cosmos';

const wrongTypeMessage = 'Wrong input type';

/** transition makes TX object
 * @param {string} address - Account blockchain address
 * @param {string} amount - Amount in ATOM
 * @param {string} typeUrl - type of message
 * @param {Object} value - message object
 * @param {string} memo - memo text
 * @param {string|null} token - auth API token
 * @param {string|null} action - action type
 * @param {string} gas - number of gas
 * @returns {Promise<object>} Promise object represents the unsigned TX object
 */
async function transition(address, amount, typeUrl, value, memo, token = null, action = null, gas = '250000') {
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const amountBN = new BigNumber(amount)

    const fee = {
        amount: [{
            denom: 'uatom',
            amount: '5000',
        }],
        gas: gas,
    };

    let msgData = null;

    if (amount) {
        msgData = {
            delegatorAddress: address,
            ...value,
            amount: {
                denom: 'uatom',
                amount: UnsetDecimal(amountBN, decimals).toString(10),
            },
        }
    } else {
        msgData = {
            delegatorAddress: address,
            ...value,
        }
    }

    try {
        const msg = {
            typeUrl: typeUrl,
            value: msgData,
        };

        if (token && action) {
            await SetStats(token, action, amount, address, msg.typeUrl, chain);
        }

        return {result: {address, msg, fee, memo}};
    } catch (error) {
        throw new Error(error);
    }
}

/** delegate (stake) funds
 * @param {string} token - Auth API token
 * @param {string} address - Account blockchain address (staker)
 * @param {string} amount - Amount of stake
 * @param {string} source - source value (partner identifier)
 * @returns {Promise<object>} Promise object represents the unsigned TX object
 */
async function delegate(token, address, amount, source = defaultSource) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const amountBN = new BigNumber(amount)
    if (amountBN.lt(minAmount)) {
        throw new Error(`Min Amount ${minAmount.toString()}`);
    }
    return await transition(
        address,
        amount,
        '/cosmos.staking.v1beta1.MsgDelegate',
        {validatorAddress: VALIDATOR_ADDRESS},
        'Staked by Source ' + source + ' with Everstake',
        token,
        'stake',
        '650000'
    );
}

/** redelegate funds from previous validator to a new one
 * @param {string} token - Auth API token
 * @param {string} address - Account blockchain address (staker)
 * @param {string} amount - Amount of stake
 * @param {string} validatorSrcAddress - previous validator address
 * @param {string} source - source value (partner identifier)
 * @returns {Promise<object>} Promise object represents the unsigned TX object
 */
async function redelegate(token, address, amount, validatorSrcAddress, source = defaultSource) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const amountBN = new BigNumber(amount)
    if (amountBN.lt(minAmount)) {
        throw new Error(`Min Amount ${minAmount.toString()}`);
    }
    return await transition(
        address,
        amount,
        '/cosmos.staking.v1beta1.MsgBeginRedelegate',
        {validatorSrcAddress: validatorSrcAddress, validatorDstAddress: VALIDATOR_ADDRESS},
        'Restaked by Source ' + source + ' with Everstake',
        token,
        'redelegate',
        '1000000',
    );
}

/** undelegate (unstake) funds from address
 * @param {string} token - Auth API token
 * @param {string} address - Account blockchain address (staker)
 * @param {string} amount - Amount of stake
 * @param {string} source - source value (partner identifier)
 * @returns {Promise<object>} Promise object represents the unsigned TX object
 */
async function undelegate(token, address, amount, source = defaultSource) {
    if (typeof (amount) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            return await transition(
                address,
                amount,
                '/cosmos.staking.v1beta1.MsgUndelegate',
                {validatorAddress: VALIDATOR_ADDRESS},
                'Unstaked by Source ' + source + ' with Everstake',
                token,
                'unstake',
                '750000'
            );
        } else {
            throw new Error(`Min Amount ${minAmount}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

/** withdrawRewards - withdraw rewards
 * @param {string} token - Auth API token
 * @param {string} address - Account blockchain address (staker)
 * @param {string} source - source value (partner identifier)
 * @returns {Promise<object>} Promise object represents the unsigned TX object
 */
async function withdrawRewards(token, address, source = defaultSource) {
    return await transition(
        address,
        '0',
        '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
        {delegatorAddress: address, validatorAddress: VALIDATOR_ADDRESS},
        'Withdraw Rewards by Source ' + source + ' with Everstake',
        token,
        null,
        '750000'
    );
}

/** getDelegations - list of delegations
 * @param {string} address - Account blockchain address (staker)
 * @returns {Promise<object>} Promise object with delegations
 */
async function getDelegations(address) {
    try {
        const delegatorArray = [];

        const delegatorResponse = await axios.get(`${API_URL}/cosmos/staking/v1beta1/delegations/${address}`);
        const delegator = delegatorResponse.data;

        const validatorResponse = await axios.get(`${API_URL}/cosmos/staking/v1beta1/delegators/${address}/validators`);
        const validator = validatorResponse.data;

        for (let i = 0; i < validator.validators.length; i++) {
            delegatorArray.push({
                ...delegator.delegation_responses[i], ...validator.validators[i]
            })
        }

        const unbindingResponse = await axios.get(`${API_URL}/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`);
        const unbonding = unbindingResponse.data.unbonding_responses;

        return {result: {delegations: delegatorArray, unbonding: unbonding}};
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
    delegate,
    redelegate,
    undelegate,
    withdrawRewards,
    getDelegations,
};
