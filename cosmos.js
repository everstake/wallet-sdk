import axios from "axios";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningStargateClient } from "@cosmjs/stargate";

const RPC_URL = 'https://rpc-cosmoshub-ia.cosmosia.notional.ventures';
const API_URL = 'https://api-cosmoshub-ia.cosmosia.notional.ventures';
const VALIDATOR_ADDRESS = 'cosmosvaloper1tflk30mq5vgqjdly92kkhhq3raev2hnz6eete3';
const BASE_NUM = 1000000;
const minAmount = 1;

let address = null;
let client = null;

// auth
export const auth = async (mnemonic) => {
    try {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);

        const [account] = await wallet.getAccounts();
        address = account.address;

        client = await SigningStargateClient.connectWithSigner(RPC_URL, wallet);
    } catch (error) {
        throw new Error(error);
    }
}

// send transition
export const transition = async (mnemonic, amount, typeUrl, value, gas = '200000') => {
    await auth(mnemonic);

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
            address, [msg], fee, ''
        );
        if (result.code !== undefined && result.code !== 0) {
            return (result.log || result.rawLog);
        } else {
            return result.transactionHash;
        }
    } catch (error) {
        throw new Error(error);
    }
}

// func stake
export const delegate = async (mnemonic, amount) => {
    if (+amount >= minAmount) {
        return await transition(mnemonic, amount, 'MsgDelegate', {validatorAddress: VALIDATOR_ADDRESS});
    } else {
        throw new Error(`ERROR: Min Amount ${minAmount}`);
    }
}
export const redelegate = async (mnemonic, amount, validatorSrcAddress) => {
    if (+amount >= minAmount) {
        return await transition(mnemonic, amount, 'MsgBeginRedelegate', {validatorSrcAddress: validatorSrcAddress, validatorDstAddress: VALIDATOR_ADDRESS}, '300000');
    } else {
        throw new Error(`ERROR: Min Amount ${minAmount}`);
    }
}
export const undelegate = async (mnemonic, amount) => {
    if (+amount >= minAmount) {
        return await transition(mnemonic, amount, 'MsgUndelegate', {validatorAddress: VALIDATOR_ADDRESS});
    } else {
        throw new Error(`ERROR: Min Amount ${minAmount}`);
    }
}
export const withdrawRewards = async (mnemonic) => {
    return await transition(mnemonic, false, 'MsgWithdrawDelegationReward', {validatorAddress: VALIDATOR_ADDRESS});
}

// info
export const getDelegations = async (address) => {
    try {
        const delegatorArray = [];
        const delegator = await axios.get(`${API_URL}/staking/delegators/${address}/delegations`);
        const validator = await axios.get(`${API_URL}/staking/delegators/${address}/validators`);
        for (let i = 0; i < validator.data.result.length; i++) {
            delegatorArray.push({
                ...delegator.data.result[i], ...validator.data.result[i]
            })
        };
        return delegatorArray;
    } catch (error) {
        throw new Error(error);
    }
}
