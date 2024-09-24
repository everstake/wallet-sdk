const { CheckToken, ERROR_TEXT, SetStats } = require("./utils/api");
const axios = require('axios');

const API_URL = 'https://cosmos-rest.publicnode.com';
const VALIDATOR_ADDRESS = 'cosmosvaloper1tflk30mq5vgqjdly92kkhhq3raev2hnz6eete3';
const BASE_NUM = 1000000;
const minAmount = 0.01;

const chain = 'cosmos';

// send transition
async function transition(address, amount, typeUrl, value, memo, token = null, action = null, gas = '250000') {
    const fee = {
        amount: [{
            denom: 'uatom',
            amount: '2000',
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
                amount: (+amount * BASE_NUM).toString(),
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
            typeUrl: `/cosmos.staking.v1beta1.${typeUrl}`,
            value: msgData,
        };

        if (token) {
            await SetStats(token, action, amount, address, msg.typeUrl, chain);
        }

        return { result: { address, msg, fee, memo } };
    } catch (error) {
        throw new Error(error);
    }
}

// func stake
async function delegate(token, address, amount) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            return await transition(
                address,
                amount,
                'MsgDelegate',
                {validatorAddress: VALIDATOR_ADDRESS},
                'Staked with Wallet SDK by Everstake',
                token,
                'stake',
            );
        } else {
            throw new Error(`Min Amount ${minAmount}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}
async function redelegate(token, address, amount, validatorSrcAddress) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            return await transition(
                address,
                amount,
                'MsgBeginRedelegate',
                {validatorSrcAddress: validatorSrcAddress, validatorDstAddress: VALIDATOR_ADDRESS},
                'Redelegated with Wallet SDK by Everstake',
                token,
                'redelegate',
                '300000',
            );
        } else {
            throw new Error(`Min Amount ${minAmount}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}
async function undelegate(token, address, amount) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            return await transition(
                address,
                amount,
                'MsgUndelegate',
                {validatorAddress: VALIDATOR_ADDRESS},
                'Undelegated with Wallet SDK by Everstake',
                token,
                'unstake'
            );
        } else {
            throw new Error(`Min Amount ${minAmount}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}
async function withdrawRewards(address) {
    return await transition(
        address,
        false,
        'MsgWithdrawDelegationReward',
        {validatorAddress: VALIDATOR_ADDRESS},
        'Withdraw Rewards with Wallet SDK by Everstake',
    );
}

// info
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
        return { result: delegatorArray };
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
