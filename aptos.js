const aptos = require("aptos");

const NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1";
const NODE_URL_TESTNET = "https://fullnode.testnet.aptoslabs.com";
const client = new aptos.AptosClient(NODE_URL);

const VALIDATOR_ADDRESS = '0xe1ab9f21446fd96198b2f242237b33854e419a2182443a78f5ba89a65fec0b12';

// this variable is the key by which we can find out the balance by the address
const aptosCoin = "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>";

// 100000000 = 1 APT
const baseNum = 100000000;

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

async function getBalanceByAddress(address) {
    try {
        const resources = await client.getAccountResources(address);
        const accountResource = resources.find((r) => r.type === aptosCoin);

        return (accountResource.data.coin.value / baseNum);
    } catch (error) {
        throw new Error(error);
    }
}

async function sendTransfer(privateKey, recipientAddress, amount) {
    try {
        const Uint8Array = aptos.HexString.ensure(privateKey).toUint8Array();
        const UserAccount = new aptos.AptosAccount(Uint8Array);

        const payload = {
            type: "entry_function_payload",
            function: "0x1::aptos_account::transfer",
            type_arguments: [],
            arguments: [recipientAddress, (+amount * baseNum).toFixed(0)],
        };
        const txnRequest = await client.generateTransaction(UserAccount.address(), payload);
        const signedTxn = await client.signTransaction(UserAccount, txnRequest);
        const transactionRes = await client.submitTransaction(signedTxn);
        await client.waitForTransaction(transactionRes.hash);

        return transactionRes.hash;
    } catch (error) {
        throw new Error(error);
    }
}

async function stake(privateKey, amount) {
    try {
        // TODO: switch on mainnet
        const client = await createClient(NODE_URL_TESTNET);

        const Uint8Array = aptos.HexString.ensure(privateKey).toUint8Array();
        const UserAccount = new aptos.AptosAccount(Uint8Array);

        const payload = {
            type: "entry_function_payload",
            function: "0x1::delegation_pool::add_stake",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
        };
        const txnRequest = await client.generateTransaction(UserAccount.address(), payload);
        const signedTxn = await client.signTransaction(UserAccount, txnRequest);
        const transactionRes = await client.submitTransaction(signedTxn);
        await client.waitForTransaction(transactionRes.hash);

        return transactionRes.hash;
    } catch (error) {
        throw new Error(error);
    }
}

async function reactivateStake(privateKey, amount) {
    try {
        const client = await createClient(NODE_URL_TESTNET);

        const Uint8Array = aptos.HexString.ensure(privateKey).toUint8Array();
        const UserAccount = new aptos.AptosAccount(Uint8Array);

        const payload = {
            type: "entry_function_payload",
            function: "0x1::delegation_pool::reactivate_stake",
            type_arguments: [],
            arguments: [VALIDATOR_ADDRESS, (+amount * baseNum).toFixed(0)],
        };
        const txnRequest = await client.generateTransaction(UserAccount.address(), payload);
        const signedTxn = await client.signTransaction(UserAccount, txnRequest);
        const transactionRes = await client.submitTransaction(signedTxn);
        await client.waitForTransaction(transactionRes.hash);

        return transactionRes.hash;
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
    reactivateStake,
    createClient,

    // const
    NODE_URL,
    NODE_URL_TESTNET,
    aptosCoin,
    baseNum
}
