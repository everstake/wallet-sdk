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
    VersionedTransaction,
    LAMPORTS_PER_SOL,
    TransactionInstruction
} = require('@solana/web3.js');

const {CheckToken, ERROR_TEXT, SetStats} = require("./utils/api");

const chain = 'solana';
const minAmount = 10000000; // 0.01
const VALIDATOR_ADDRESS = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';

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
 * @param {number} lamports - lamport amount
 * @param {string | null} source - stake source
 * @returns {Promise<object>} Promise object Tx
 */
async function createAccount(address, lamports, source = '0') {
    try {
            await connect();
            const senderPublicKey = new PublicKey(address);

            const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

            const [createStakeAccountTx, stakeAccountPublicKey, externalSigners] = source === null 
            ? await createAccountTx(senderPublicKey, lamports + minimumRent) 
            : await createWithSeedTx(senderPublicKey, lamports + minimumRent, source);        

            const versionedTX = await prepareTransaction(createStakeAccountTx.instructions, senderPublicKey, externalSigners);
            return { result: { versionedTX, stakeAccount: stakeAccountPublicKey.toString() } };
    } catch (error) {
            throw new Error(error);
    }
}

async function createAccountTx(address, lamports) {
    const blockhash = await getBlockhash();
    const stakeAccount = Keypair.generate();
    let createStakeAccountTx = StakeProgram.createAccount({
        authorized: new Authorized(address, address),
        fromPubkey: address,
        lamports: lamports,
        stakePubkey: stakeAccount.publicKey,
    });
    createStakeAccountTx.recentBlockhash = blockhash;
    createStakeAccountTx.sign(stakeAccount);

    return [createStakeAccountTx, stakeAccount.publicKey, [stakeAccount]]
}

async function createWithSeedTx(authorityPublicKey, lamports, source) {
    
    // Format source to
    seed = formatSource(source);
   
    const stakeAccountPubkey = await PublicKey.createWithSeed(
        authorityPublicKey,
        seed,
        StakeProgram.programId,
    );

    const createStakeAccountTx = new Transaction().add(
        StakeProgram.createAccountWithSeed({
            authorized: new Authorized(authorityPublicKey, authorityPublicKey),
            fromPubkey: authorityPublicKey,
            basePubkey: authorityPublicKey,
            stakePubkey: stakeAccountPubkey,

            seed: seed,
            lamports: lamports,
    }));
        
    return [createStakeAccountTx, stakeAccountPubkey, []]
}

/** createAccount - create account
 * @param {string} token - auth API token
 * @param {string} address - account blockchain address (staker)
 * @param {number} lamports - lamport amount
 * @param {string} stakeAccount - stake account pubKey
 * @returns {Promise<object>} Promise object Tx
 */
async function delegate(token, address, lamports, stakeAccount) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    if (lamports < minAmount) {
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

        // cast instructions to correct JSON Serialization
        delegateTx.instructions = delegateTx.instructions.map((instruction) => {
            return new TransactionInstruction(instruction)
        })
        
        await SetStats(token, 'stake', lamports / LAMPORTS_PER_SOL, address, delegateTx, chain);

        const versionedTX = await prepareTransaction(delegateTx.instructions, publicKey, []);
        return { result: versionedTX };
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

        // cast instructions to correct JSON Serialization
        deactivateTx.instructions = deactivateTx.instructions.map((instruction) => {
            return new TransactionInstruction(instruction)
        })

        const versionedTX = await prepareTransaction(deactivateTx.instructions, publicKey, []);
        return {result: versionedTX};
    } catch (error) {
        throw new Error(error);
    }
}

function formatSource(source) {
    if (typeof (source) !== 'string') {
        throw new Error(wrongTypeMessage);
    }
    const timestamp = new Date().getTime();

    source = `everstake ${source}:${timestamp}`;

    return source;
}

/** deactivate - deactivate stake
 * @param {string} token - auth API token
 * @param {string} address - account blockchain address (staker)
 * @param {string} stakeAccountPublicKey - public key
 * @param {number} stakeBalance - stake balace
 * @returns {Promise<object>} Promise object deactivation Tx
 */
async function withdraw(token, address, stakeAccountPublicKey, stakeBalance) {
    try {
        await connect();

        const publicKey = new PublicKey(address);
        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const withdrawTx = StakeProgram.withdraw({
            stakePubkey: stakeAccount,
            authorizedPubkey: publicKey,
            toPubkey: publicKey,
            lamports: stakeBalance,
        });

        // cast instructions to correct JSON Serialization
        withdrawTx.instructions = withdrawTx.instructions.map((instruction) => {
            return new TransactionInstruction(instruction)
        })

        await SetStats(token, 'unstake', stakeBalance / LAMPORTS_PER_SOL, address, withdrawTx, chain);
        const versionedTX = await prepareTransaction(withdrawTx.instructions, publicKey, []);

        return {result: versionedTX};
    } catch (error) {
        throw new Error(error);
    }
}

/** getDelegations - list of delegations
 * @param {any} address - Account blockchain address (staker)
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
 * @param {number} lamports - lamport amount
 * @param {string | null} source - stake source
 * @returns {Promise<object>} Promise object with Versioned Tx
 */
async function stake(token, sender, lamports, source) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    try {
        await connect();
        const senderPublicKey = new PublicKey(sender);
        const validatorPubkey = new PublicKey(VALIDATOR_ADDRESS);

        // Calculate how much we want to stake
        const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

        const [createStakeAccountTx, stakeAccountPublicKey, externalSigners] = source === null 
        ? await createAccountTx(senderPublicKey, lamports + minimumRent) 
        : await createWithSeedTx(senderPublicKey, lamports + minimumRent, source);

        const tx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({microLamports: 50}),
            createStakeAccountTx,
            StakeProgram.delegate({
                stakePubkey: stakeAccountPublicKey,
                authorizedPubkey: senderPublicKey,
                votePubkey: validatorPubkey,
            })
        );

        const versionedTX = await prepareTransaction(tx.instructions, senderPublicKey, externalSigners);

        await SetStats(token, 'stake', lamports / LAMPORTS_PER_SOL, sender, versionedTX, chain);

        return {result: versionedTX};
    } catch (error) {
        throw new Error(error);
    }
}

async function prepareTransaction(instructions, payer, externalSigners) {
    const blockhash = await getBlockhash();
    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions
    }).compileToV0Message();

    let tx = new VersionedTransaction(messageV0);

    if (externalSigners.length > 0) {
        tx.sign(externalSigners); 
    }
    
    return tx;
}

async function getBlockhash(){
    return await connection
    .getLatestBlockhash({ commitment: 'max' })
    .then((res) => res.blockhash);
}

module.exports = {
    createAccount,
    delegate,
    deactivate,
    withdraw,
    getDelegations,
    stake,
};