const { getFullnodeUrl, SuiClient } = require("@mysten/sui.js/client");
const { SUI_SYSTEM_STATE_OBJECT_ID } = require("@mysten/sui.js/utils");
const { TransactionBlock } = require("@mysten/sui.js/transactions")

const client = new SuiClient({url: getFullnodeUrl('mainnet')});

const VALIDATOR_ADDRESS = '0xbba318294a51ddeafa50c335c8e77202170e1f272599a2edc40592100863f638';

// 1000000000 = 1 SUI
const baseNum = 1000000000;
// min amount for stake
const minAmountForStake = 1;

async function getStakeBalanceByAddress(address) {
    try {
        return await client.getStakes({ owner: address });
    } catch (error) {
        throw new Error(error);
    }
}

async function getBalanceByAddress(address) {
    try {
      const balance = await client.getBalance({
        owner: address,
      });

      return balance.totalBalance;
    } catch (error) {
        throw new Error(error);
    }
}

async function sendTransfer(recipientAddress, amount) {
    try {
        const txb = new TransactionBlock();

        const coin = txb.splitCoins(txb.gas, [+amount * baseNum]);

        txb.transferObjects([coin], recipientAddress);

        return txb;
    } catch (error) {
        throw new Error(error);
    }
}

async function stake(amount) {
    if (+amount >= minAmountForStake) {
        try {
            const tx = new TransactionBlock();
            const stakeCoin = tx.splitCoins(tx.gas, [amount * baseNum]);
            tx.moveCall({
                target: '0x3::sui_system::request_add_stake',
                arguments: [
                    tx.sharedObjectRef({
                        objectId: SUI_SYSTEM_STATE_OBJECT_ID,
                        initialSharedVersion: 1,
                        mutable: true,
                    }),
                    stakeCoin,
                    tx.pure(VALIDATOR_ADDRESS),
                ],
            });
            return tx;
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(`Min Amount ${minAmountForStake}`);
    }
}

async function unstake(stakedSuiId) {
    try {
        const tx = new TransactionBlock();
        tx.moveCall({
            target: '0x3::sui_system::request_withdraw_stake',
            arguments: [tx.object(SUI_SYSTEM_STATE_OBJECT_ID), tx.object(stakedSuiId)],
        });
        return tx;
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
    // func
    getBalanceByAddress,
    sendTransfer,
    stake,
    unstake,
    getStakeBalanceByAddress,
    minAmountForStake,

    // const
    baseNum,
    VALIDATOR_ADDRESS,
}
