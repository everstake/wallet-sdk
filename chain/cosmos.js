const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const { SigningStargateClient } = require("@cosmjs/stargate");
const { CheckToken, ERROR_TEXT, SetStats } = require("../utils/api");

const RPC_URL = 'https://rpc-cosmoshub-ia.cosmosia.notional.ventures';
const API_URL = 'https://api-cosmoshub-ia.cosmosia.notional.ventures';
const VALIDATOR_ADDRESS = 'cosmosvaloper1tflk30mq5vgqjdly92kkhhq3raev2hnz6eete3';
const BASE_NUM = 1000000;
const minAmount = 0.01;

let address = null;
let client = null;

const chain = 'cosmos';

// auth
async function auth(privetKey) {
    try {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(privetKey);

        const [account] = await wallet.getAccounts();
        address = account.address;

        client = await SigningStargateClient.connectWithSigner(RPC_URL, wallet);
    } catch (error) {
        throw new Error(error);
    }
}

// send transition
async function transition(privetKey, amount, typeUrl, value, memo, token = null, action = null, gas = '250000') {
    await auth(privetKey);

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
        const result = await client.signAndBroadcast(
            address, [msg], fee, memo
        );
        if (result.code !== undefined && result.code !== 0) {
            return { error: (result.log || result.rawLog) };
        } else {
            if (token && action) {
                await SetStats(token, action, amount, address, result.transactionHash, chain);
            }
            return { result: result.transactionHash };
        }
    } catch (error) {
        throw new Error(error);
    }
}

// func stake
async function delegate(token, privetKey, amount) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            return await transition(
                privetKey,
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
async function redelegate(token, privetKey, amount, validatorSrcAddress) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            return await transition(
                privetKey,
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
async function undelegate(token, privetKey, amount) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            return await transition(
                privetKey,
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
async function withdrawRewards(privetKey) {
    return await transition(
        privetKey,
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

        const delegator = await fetch(`${API_URL}/staking/delegators/${address}/delegations`).then(response => response.json());
        const validator = await fetch(`${API_URL}/staking/delegators/${address}/validators`).then(response => response.json());

        for (let i = 0; i < validator.result.length; i++) {
            delegatorArray.push({
                ...delegator.result[i], ...validator.result[i]
            })
        };
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
