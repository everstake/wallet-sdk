const {
    Authorized,
    clusterApiUrl,
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    StakeProgram,
    Lockup,
    Transaction,
    TransactionMessage,
    VersionedTransaction,
    LAMPORTS_PER_SOL,
    TransactionInstruction
} = require('@solana/web3.js');

const BigNumber = require('bignumber.js');
const {parsedAccountInfoToStakeAccount, isLockupInForce, stakeAccountState, StakeState} = require("./solana_stake_account.js");
const {CheckToken, ERROR_TEXT, SetStats} = require("./utils/api");

const NETWORKS = {
	Mainnet: "mainnet-beta",
	Devnet: "devnet"
}

const chain = 'solana';
const minAmount = 10000000; // 0.01
const MAINNET_VALIDATOR_ADDRESS = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
const DEVNET_VALIDATOR_ADDRESS = 'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN';
let VALIDATOR_ADDRESS = MAINNET_VALIDATOR_ADDRESS;
let connection = null;
let rpcURL = clusterApiUrl("mainnet-beta");

/** connect client
 * @returns {Promise<object>} Promise object - client connection
 */
async function connect() {
    try {
        connection = new Connection(rpcURL, "confirmed");
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
async function createAccount(address, lamports, source = '0', lockupParams = Lockup.default) {
    try {
            await connect();
            const senderPublicKey = new PublicKey(address);

            const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

            const [createStakeAccountTx, stakeAccountPublicKey, externalSigners] = source === null 
            ? await createAccountTx(senderPublicKey, lamports + minimumRent, lockupParams) 
            : await createWithSeedTx(senderPublicKey, lamports + minimumRent, source, lockupParams);        

            const versionedTX = await prepareTransaction(createStakeAccountTx.instructions, senderPublicKey, externalSigners);
            return { result: { versionedTX, stakeAccount: stakeAccountPublicKey.toString() } };
    } catch (error) {
            throw new Error(error);
    }
}

async function createAccountTx(address, lamports, {unixTimestamp, epoch}) {
    const blockhash = await getBlockhash();
    const stakeAccount = Keypair.generate();
    let createStakeAccountTx = StakeProgram.createAccount({
        authorized: new Authorized(address, address),
        fromPubkey: address,
        lamports: lamports,
        stakePubkey: stakeAccount.publicKey,
        // SDK don't support custodian lockups
        lockup: new Lockup(unixTimestamp, epoch, PublicKey.default)
    });
    createStakeAccountTx.recentBlockhash = blockhash;
    createStakeAccountTx.sign(stakeAccount);

    return [createStakeAccountTx, stakeAccount.publicKey, [stakeAccount]]
}

async function createWithSeedTx(authorityPublicKey, lamports, source, {unixTimestamp, epoch}) {
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

            // SDK don't support custodian lockups
            lockup: new Lockup(unixTimestamp, epoch, PublicKey.default),

            seed: seed,
            lamports: lamports,
    }));
        
    return [createStakeAccountTx, stakeAccountPubkey, []]
}

async function split(authorityPublicKey, lamports, oldStakeAccountPubkey, source) {
    // TODO add support of default split
    // StakeProgram.split({
    //     stakePubkey: stakeAccountPublicKey,
    //     authorizedPubkey: senderPublicKey,
    //     votePubkey: validatorPubkey,
    // });
        
    // Format source to
    seed = formatSource(source);
   
    const newStakeAccountPubkey = await PublicKey.createWithSeed(
        authorityPublicKey,
        seed,
        StakeProgram.programId,
    );

    const splitStakeAccountTx = new Transaction().add(
        StakeProgram.splitWithSeed({
            stakePubkey: oldStakeAccountPubkey,
            authorizedPubkey: authorityPublicKey,
            splitStakePubkey: newStakeAccountPubkey,
            basePubkey: authorityPublicKey,
            seed: seed,
            lamports: lamports
        })
       );
        
    return [splitStakeAccountTx, newStakeAccountPubkey, []]
}

async function merge(authorityPublicKey, stakeAccount1, stakeAccount2) {
    const mergeStakeAccountTx = StakeProgram.merge({
        stakePubkey: stakeAccount1,
        sourceStakePubKey: stakeAccount2,
        authorizedPubkey: authorityPublicKey
    })

    return [mergeStakeAccountTx]
}

async function getBlockhash() {
    return await connection
        .getLatestBlockhash({commitment: 'max'})
        .then((res) => res.blockhash);
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

/** deactivate - deactivate stake account
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

        accounts = await connection.getParsedProgramAccounts(StakeProgram.programId, {
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

// TODO add summarised balances 
async function stakeBalances(address) {}

/** stake - list of delegations
 * @param {string} token - auth API token
 * @param {string} sender - account blockchain address (staker)
 * @param {number} lamports - lamport amount
 * @param {string | null} source - stake source
 * @returns {Promise<object>} Promise object with Versioned Tx
 */
async function stake(token, sender, lamports, source, lockupParams = Lockup.default) {
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
        ? await createAccountTx(senderPublicKey, lamports + minimumRent, lockupParams) 
        : await createWithSeedTx(senderPublicKey, lamports + minimumRent, source, lockupParams);

        const tx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({microLamports: 50}),
            createStakeAccountTx,
            StakeProgram.delegate({
                stakePubkey: stakeAccountPublicKey,
                authorizedPubkey: senderPublicKey,
                votePubkey: validatorPubkey,
            })
        );

        // cast instructions to correct JSON Serialization
        tx.instructions = tx.instructions.map((instruction) => {
            return new TransactionInstruction(instruction)
        })

        const versionedTX = await prepareTransaction(tx.instructions, senderPublicKey, externalSigners);

        await SetStats(token, 'stake', lamports / LAMPORTS_PER_SOL, sender, versionedTX, chain);

        return {result: versionedTX};
    } catch (error) {
        throw new Error(error);
    }
}


/** unstake - unstake
 * @param {string} token - auth API token
 * @param {string} sender - account blockchain address (staker)
 * @param {number} lamports - lamport amount
 * @param {string} source - stake source
 * @returns {Promise<object>} Promise object with Versioned Tx
 */
async function unstake(token, sender, lamports, source) {
    if (!await CheckToken(token)) {
        throw new Error(ERROR_TEXT);
    }
    
    try {
        const delegations = await getDelegations(sender);
       
        let stakeAccounts = delegations.result.map((delegationAcc) => {
            return {pubkey: delegationAcc.pubkey, account: parsedAccountInfoToStakeAccount(delegationAcc.account)};
        });

        const epochInfo = await connection.getEpochInfo();
        // Timestamp in seconds
        const tm = Date.now() / 1000 | 0;

        totalActiveStake = new BigNumber(0); 
        let activeStakeAccounts = stakeAccounts.filter((acc) => {
            let isActive = !(isLockupInForce(acc.account.data.info.meta,  epochInfo.epoch, tm) ||
            stakeAccountState(acc.account.data, epochInfo.epoch) !== StakeState.Active);
            if (isActive) totalActiveStake = totalActiveStake.plus(acc.account.data.info.stake.delegation.stake);
            return isActive
        });

        let lamportsBN = new BigNumber(lamports)
        if (totalActiveStake.lt(lamportsBN)) throw new Error('Active stake less than requested');

        // Desc sorting 
        activeStakeAccounts.sort(function(a, b){
            if (a.account.data.info.stake.delegation.stake.lte(b.account.data.info.stake.delegation.stake)) {
                return a;
            }

            return b;
        });

        let accountsToDeactivate = [];
        let accountsToSplit = [];
        let i = 0;
        while (lamportsBN.gt(new BigNumber(0)) && i < activeStakeAccounts.length) {
            const lBN = new BigNumber(lamports)
            const acc = activeStakeAccounts[i]; 
            let stakeAmount = new BigNumber(acc.account.data.info.stake.delegation.stake);

            // If reminder amount less than min stake amount stake account automatically become disabled
            if (stakeAmount.comparedTo(lBN) <= 0 || stakeAmount.minus(lBN).lt(new BigNumber (minAmount))) {   
                accountsToDeactivate.push(acc);
                lamportsBN = lamportsBN.minus(stakeAmount);
                i++;   
                continue;
            }
            
            accountsToSplit.push({account: acc, lamports: lamportsBN.toNumber()});
            break;
        }

        const senderPublicKey = new PublicKey(sender);

        var instructions = [ComputeBudgetProgram.setComputeUnitPrice({microLamports: 50})];
        for (var j in accountsToSplit) {
            const [tx, newStakeAccountPubkey] = await split(senderPublicKey, accountsToSplit[j].lamports, accountsToSplit[j].account.pubkey, source);
        
            const deactivateTx = StakeProgram.deactivate({
                stakePubkey: newStakeAccountPubkey,
                authorizedPubkey: senderPublicKey,
            });

            instructions.push(...tx.instructions, ...deactivateTx.instructions);
        }

        for (var j in accountsToDeactivate) {
            const deactivateTx = StakeProgram.deactivate({
                stakePubkey: accountsToDeactivate[j].pubkey,
                authorizedPubkey: senderPublicKey,
            });

            instructions.push(...deactivateTx.instructions);
        }

        // cast instructions to correct JSON Serialization
        instructions = instructions.map((instruction) => {
            return new TransactionInstruction(instruction)
        })
        
        const versionedTX = await prepareTransaction(instructions, senderPublicKey, []);

        await SetStats(token, 'unstake', lamports / LAMPORTS_PER_SOL, sender, versionedTX, chain);

        return {result: versionedTX};
    } catch (error) {
        throw new Error(error);
    }
}

async function claim(sender) {
    try {
        const delegations = await getDelegations(sender);
       
        let stakeAccounts = delegations.result.map((delegationAcc) => {
            return {pubkey: delegationAcc.pubkey, account: parsedAccountInfoToStakeAccount(delegationAcc.account)};
        });

        const epochInfo = await connection.getEpochInfo();
        // Timestamp in seconds
        const tm = Date.now() / 1000 | 0;

        totalClaimableStake = new BigNumber(0); 
        let deactivatedStakeAccounts = stakeAccounts.filter((acc) => {
            let isDeactivated = (!isLockupInForce(acc.account.data.info.meta,  epochInfo.epoch, tm) &&
            stakeAccountState(acc.account.data, epochInfo.epoch) === StakeState.Deactivated);

            if (isDeactivated) totalClaimableStake = totalClaimableStake.plus(acc.account.data.info.stake.delegation.stake);
            return isDeactivated
        });

        if (deactivatedStakeAccounts.length === 0) throw new Error('Nothing to claim');

        const senderPublicKey = new PublicKey(sender);
        var instructions = [ComputeBudgetProgram.setComputeUnitPrice({microLamports: 50})];
        for (var j in deactivatedStakeAccounts) {

            const withdrawTx = StakeProgram.withdraw({
                stakePubkey: deactivatedStakeAccounts[j].pubkey,
                authorizedPubkey: senderPublicKey,
                toPubkey: senderPublicKey,
                lamports: deactivatedStakeAccounts[j].account.lamports,
            });
            instructions.push(...withdrawTx.instructions);
        }

        // cast instructions to correct JSON Serialization
        instructions = instructions.map((instruction) => {
            return new TransactionInstruction(instruction)
        })
     
        const versionedTX = await prepareTransaction(instructions, senderPublicKey, []);

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

// TODO refactor to class with constructor
/** selectNetwork - select Solana network
 * @param {string} network - Network name
 * @param {string} url - RPC Node Url
 */
function selectNetwork(network, url) {
    switch (network) {
        case NETWORKS.Mainnet:
            rpcURL = url || clusterApiUrl(NETWORKS.Mainnet);
            VALIDATOR_ADDRESS = MAINNET_VALIDATOR_ADDRESS;
            break;
        case NETWORKS.Devnet:
            rpcURL = url || clusterApiUrl(NETWORKS.Devnet);
            VALIDATOR_ADDRESS = DEVNET_VALIDATOR_ADDRESS;
            break;
        default:
            throw new Error(`Unsupported network ${network}`);
    }
    
    return;
}

module.exports = {
    createAccount,
    delegate,
    deactivate,
    withdraw,
    getDelegations,
    stake,
    unstake,
    claim,
    selectNetwork,

    NETWORKS
};