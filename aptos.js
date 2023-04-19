const aptos = require("aptos");
const { CheckToken, SetStats, ERROR_TEXT } = require("./utils/api");

const chain = 'aptos';

const NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const client = new aptos.AptosClient(NODE_URL);

const VALIDATOR_ADDRESS = '0xd7f20025a2e42f4d5b6b6366a711b36d9f694582ccad391736c13aae53440172';

// this variable is the key by which we can find out the balance by the address
const aptosCoin = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";

// 100000000 = 1 APT
const baseNum = 100000000;
// min amount for stake if user staking first once
const minAmount = 10;
// min amount for stake if user staked >= 10 APT
const lowerAmount = 0.1;

async function createAccount() {
    try {
        return new aptos.AptosAccount().toPrivateKeyObject();
    } catch (error) {
        throw new Error(error);
    }
}

async function importAccount(importPrivateKey) {
    try {
        const Uint8Array = aptos.HexString.ensure(importPrivateKey).toUint8Array();
        return new aptos.AptosAccount(Uint8Array).toPrivateKeyObject();
    } catch (error) {
        throw new Error(error);
    }
}

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
            active: (+balance[0] / baseNum),
            // one of `inactive` stake FOR each past observed lockup cycle (OLC) on the stake pool
            inactive: (+balance[1] / baseNum),
            // after UNLOCK, one of `pending_inactive` stake scheduled during this ongoing OLC
            pending_inactive: (+balance[2] / baseNum),
        };
    } catch (error) {
        throw new Error(error);
    }
}

async function getBalanceByAddress(address) {
    try {
        const resources = await client.getAccountResources(address);
        const accountResource = resources.find((r) => r.type === aptosCoin);

        return (accountResource.data.coin.value / baseNum);
    } catch (error) {
        throw new Error(error);
    }
}

async function signTransaction(privateKey, txnRequest) {
    try {
        const Uint8Array = aptos.HexString.ensure(privateKey).toUint8Array();
        const UserAccount = new aptos.AptosAccount(Uint8Array);

        const signedTxn = await client.signTransaction(UserAccount, txnRequest);
        const transactionRes = await client.submitTransaction(signedTxn);
        await client.waitForTransaction(transactionRes.hash);

        return transactionRes.hash;
    } catch (error) {
        throw new Error(error);
    }
}

async function sendTransfer(address, recipientAddress, amount) {
    try {
        const payload = {
            type: "entry_function_payload",
            function: "0x1::aptos_account::transfer",
            type_arguments: [],
            arguments: [recipientAddress, (+amount * baseNum).toFixed(0)],
        };
        return await client.generateTransaction(address, payload);
    } catch (error) {
        throw new Error(error);
    }
}

async function getMinAmountForStake(address) {
    try {
        const balance = await getStakeBalanceByAddress(address);

        if (minAmount - balance.active <= 0) {
            return lowerAmount;
        } else {
            return minAmount - balance.active;
        }
    } catch (error) {
        throw new Error(error);
    }
}

async function stake(token, address, amount) {
    if (await CheckToken(token)) {
        const MinAmountForStake = await getMinAmountForStake(address);
        if (+amount >= MinAmountForStake) {
            try {
                const payload = {
                    type: "entry_function_payload",
                    function: "0x1::delegation_pool::add_stake",
                    type_arguments: [],
                    arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
                };
                await SetStats(token, 'stake', amount, address, chain);

                return await client.generateTransaction(address, payload);
            } catch (error) {
                throw new Error(error);
            }
        } else {
            throw new Error(`Min Amount ${MinAmountForStake}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

async function reactivate(token, address, amount) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            try {
                const payload = {
                    type: "entry_function_payload",
                    function: "0x1::delegation_pool::reactivate_stake",
                    type_arguments: [],
                    arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
                };
                await SetStats(token, 'reactivate_stake', amount, address, chain);

                return await client.generateTransaction(address, payload);
            } catch (error) {
                throw new Error(error);
            }
        } else {
            throw new Error(`Min Amount ${minAmount}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

async function unlock(token, address, amount) {
    if (await CheckToken(token)) {
        const balance = await getStakeBalanceByAddress(address);
        if (balance.pending_inactive + (+amount) >= minAmount) {
            try {
                const payload = {
                    type: "entry_function_payload",
                    function: "0x1::delegation_pool::unlock",
                    type_arguments: [],
                    arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
                };
                await SetStats(token, 'unlock_stake', amount, address, chain);

                return await client.generateTransaction(address, payload);
            } catch (error) {
                throw new Error(error);
            }
        } else {
            throw new Error(`Min Amount ${minAmount - balance.pending_inactive}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

async function unstake(token, address, amount) {
    if (await CheckToken(token)) {
        const balance = await getStakeBalanceByAddress(address);
        if (balance.pending_inactive + (+amount) >= minAmount) {
            try {
                const payload = {
                    type: "entry_function_payload",
                    function: "0x1::delegation_pool::withdraw",
                    type_arguments: [],
                    arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
                };
                await SetStats(token, 'unstake', amount, address, chain);

                return await client.generateTransaction(address, payload);
            } catch (error) {
                throw new Error(error);
            }
        } else {
            throw new Error(`Min Amount ${minAmount - balance.pending_inactive}`);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

async function generateAndSign(Method, token, address, amount, privateKey) {
    try {
        const txnRequest = await Method(token, address, amount);
        return await signTransaction(privateKey, txnRequest);
    } catch (error) {
        throw new Error(error);
    }
}

async function createClient(NODE_URL) {
    try {
        return new aptos.AptosClient(NODE_URL);
    } catch (error) {
        throw new Error(error);
    }
}


module.exports = {
    // func
    createAccount,
    importAccount,
    getBalanceByAddress,
    sendTransfer,
    stake,
    reactivate,
    unlock,
    unstake,
    getStakeBalanceByAddress,
    createClient,
    signTransaction,
    getMinAmountForStake,
    generateAndSign,

    // const
    NODE_URL,
    aptosCoin,
    baseNum,
    minAmount,
    lowerAmount,
    VALIDATOR_ADDRESS,
}
