const {
    Authorized,
    clusterApiUrl,
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    StakeProgram,
    Transaction,
    TransactionMessage,
    VersionedTransaction
} = require('@solana/web3.js');
const BigNumber = require('bignumber.js');

const {CheckToken, ERROR_TEXT, SetStats} = require("./utils/api");
const {SetDecimal} = require("./utils/decimals");

const chain = 'solana';
const minAmount = new BigNumber(10000000); // 0.01
const VALIDATOR_ADDRESS = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
const decimals = 9;

const wrongTypeMessage = 'Wrong input type';

let connection = null;

/** connect client
 * @returns {Promise<object>} Promise object - client connection
 */
async function connect() {
    try {
        connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    } catch (error) {
        throw new Error(error);
    }
}

/** createAccount - create account
 * @param {string} address - account blockchain address (staker)
 * @param {string} lamports - lamport amount
 * @returns {Promise<object>} Promise object account data
 */
async function createAccount(address, lamports) {
    if (typeof (lamports) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const lamportsBN = new BigNumber(lamports);
    if (lamportsBN.lt(minAmount)) {
        throw new Error(`Min Amount ${minAmount.toString()}`);
    }

    try {
        await connect();
        const publicKey = new PublicKey(address);
        const stakeAccount = Keypair.generate();

        const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
        const amountToStake = lamportsBN.add(new BigNumber(minimumRent));

        const createStakeAccountTx = StakeProgram.createAccount({
            authorized: new Authorized(publicKey, publicKey),
            fromPubkey: publicKey,
            lamports: amountToStake.toNumber(),
            stakePubkey: stakeAccount.publicKey,
        });
        const blockhash = await getBlockhash();
        createStakeAccountTx.recentBlockhash = await blockhash
        createStakeAccountTx.sign(stakeAccount);
        return {result: {createStakeAccountTx, stakeAccount: stakeAccount.publicKey.toString()}};
    } catch (error) {
        throw new Error(error);
    }
}

async function prepareTransaction(instructions, payer) {
    const blockhash = await getBlockhash();
    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
}

async function getBlockhash() {
    return await connection
        .getLatestBlockhash({commitment: 'max'})
        .then((res) => res.blockhash);
}

/** createAccount - create account
 * @param {string} token - auth API token
 * @param {string} address - account blockchain address (staker)
 * @param {string} lamports - lamport amount
 * @param {string} stakeAccount - stake account
 * @returns {Promise<object>} Promise object Tx
 */
async function delegate(token, address, lamports, stakeAccount) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    if (typeof (lamports) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const lamportsBN = new BigNumber(lamports)
    if (lamportsBN.lt(minAmount)) {
        throw new Error(`Min Amount ${minAmount.toString()}`);
    }

    try {
        await connect();
        const publicKey = new PublicKey(address);
        const stakeAccountPublicKey = new PublicKey(stakeAccount);

        const selectedValidatorPubkey = new PublicKey(VALIDATOR_ADDRESS);

        const delegateTx = StakeProgram.delegate({
            stakePubkey: stakeAccountPublicKey,
            authorizedPubkey: publicKey,
            votePubkey: selectedValidatorPubkey,
        });

        await SetStats(token, 'stake', SetDecimal(lamportsBN, decimals).toNumber(), address, delegateTx, chain);
        return {result: delegateTx};
    } catch (error) {
        throw new Error(error);
    }
}

/** deactivate - deactivate stake
 * @param {string} address - account blockchain address (staker)
 * @param {string} stakeAccountPublicKey - public key
 * @returns {Promise<object>} Promise object deactivation Tx
 */
async function deactivate(address, stakeAccountPublicKey) {
    try {
        await connect();

        const publicKey = new PublicKey(address);

        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const deactivateTx = StakeProgram.deactivate({
            stakePubkey: stakeAccount,
            authorizedPubkey: publicKey,
        });

        return {result: deactivateTx};
    } catch (error) {
        throw new Error(error);
    }
}

/** deactivate - deactivate stake
 * @param {string} token - auth API token
 * @param {string} address - account blockchain address (staker)
 * @param {string} stakeAccountPublicKey - public key
 * @param {string} stakeBalance - stake balace
 * @returns {Promise<object>} Promise object deactivation Tx
 */
async function withdraw(token, address, stakeAccountPublicKey, stakeBalance) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    const stakeBalanceBN = new BigNumber(stakeBalance);

    try {
        await connect();

        const publicKey = new PublicKey(address);
        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const withdrawTx = StakeProgram.withdraw({
            stakePubkey: stakeAccount,
            authorizedPubkey: publicKey,
            toPubkey: publicKey,
            lamports: stakeBalanceBN.toNumber(),
        });

        await SetStats(token, 'unstake', SetDecimal(stakeBalanceBN, decimals), address, withdrawTx, chain);
        return {result: withdrawTx};
    } catch (error) {
        throw new Error(error);
    }
}

/** getDelegations - list of delegations
 * @param {string} address - Account blockchain address (staker)
 * @returns {Promise<object>} Promise object with delegations
 */
async function getDelegations(address) {
    try {
        await connect();

        let accounts = [];

        accounts = await connection.getParsedProgramAccounts(new PublicKey("Stake11111111111111111111111111111111111111"), {
            filters: [
                {dataSize: 200},
                {memcmp: {offset: 44, bytes: address}},
            ],
        });

        return {result: accounts};
    } catch (error) {
        throw new Error(error);
    }
}

/** stake - list of delegations
 * @param {string} token - auth API token
 * @param {string} sender - account blockchain address (staker)
 * @param {string} lamports - lamport amount
 * @returns {Promise<object>} Promise object with Tx
 */
async function stake(token, sender, lamports) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    if (typeof (lamports) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const lamportsBN = new BigNumber(lamports)
    try {
        await connect();
        const senderPublicKey = new PublicKey(sender);
        const stakeAccount = Keypair.generate();
        const validatorPubkey = new PublicKey(VALIDATOR_ADDRESS);

        // Calculate how much we want to stake
        const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

        const tx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({microLamports: 50}),
            StakeProgram.createAccount({
                authorized: new Authorized(senderPublicKey, senderPublicKey),
                fromPubkey: senderPublicKey,
                lamports: lamportsBN.toNumber() + minimumRent,
                stakePubkey: stakeAccount.publicKey,
            }),
            StakeProgram.delegate({
                stakePubkey: stakeAccount.publicKey,
                authorizedPubkey: senderPublicKey,
                votePubkey: validatorPubkey,
            })
        );

        let versionedTX = await prepareTransaction(tx.instructions, senderPublicKey);
        versionedTX.sign([stakeAccount]);

        return {result: versionedTX};
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
    createAccount,
    delegate,
    deactivate,
    withdraw,
    getDelegations,
    stake,
};
