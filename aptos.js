const aptos = require("aptos");
const { CheckToken, SetStats, ERROR_TEXT } = require("./utils/api");

const chain = 'aptos';

const NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const client = new aptos.AptosClient(NODE_URL);

const VALIDATOR_ADDRESS = '0xdb5247f859ce63dbe8940cf8773be722a60dcc594a8be9aca4b76abceb251b8e';

// this variable is the key by which we can find out the balance by the address
const aptosCoin = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";

// 100000000 = 1 APT
const baseNum = 100000000;
// min amount for stake if user staking first once
const minAmount = 10;
// min amount for stake if user staked >= 10 APT
const lowerAmount = 0.1;

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

async function sendTransfer(address, recipientAddress, amount) {
    try {
        return {
            type: "entry_function_payload",
            function: "0x1::aptos_account::transfer",
            type_arguments: [],
            arguments: [recipientAddress, (+amount * baseNum).toFixed(0)],
        };
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
                await SetStats(token, 'stake', amount, address, '', chain);
                return {
                    type: "entry_function_payload",
                    function: "0x1::delegation_pool::add_stake",
                    type_arguments: [],
                    arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
                };
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
        try {
            await SetStats(token, 'reactivate_stake', amount, address, '', chain);

            return {
                type: "entry_function_payload",
                function: "0x1::delegation_pool::reactivate_stake",
                type_arguments: [],
                arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
            };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

async function unlock(token, address, amount) {
    if (await CheckToken(token)) {
        try {
            await SetStats(token, 'unlock_stake', amount, address, '', chain);
            return {
                type: "entry_function_payload",
                function: "0x1::delegation_pool::unlock",
                type_arguments: [],
                arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
            };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

async function unstake(token, address, amount) {
    if (await CheckToken(token)) {
        try {
            await SetStats(token, 'unstake', amount, address, '', chain);
            return {
                type: "entry_function_payload",
                function: "0x1::delegation_pool::withdraw",
                type_arguments: [],
                arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
            };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(ERROR_TEXT);
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
    getBalanceByAddress,
    sendTransfer,
    stake,
    reactivate,
    unlock,
    unstake,
    getStakeBalanceByAddress,
    createClient,
    getMinAmountForStake,

    // const
    NODE_URL,
    aptosCoin,
    baseNum,
    minAmount,
    lowerAmount,
    VALIDATOR_ADDRESS,
}
