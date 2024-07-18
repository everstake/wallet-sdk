const {
    Authorized,
    clusterApiUrl,
    ComputeBudgetProgram,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    StakeProgram,
    Transaction,
    TransactionMessage,
    VersionedTransaction
} = require('@solana/web3.js');
const bs58 = require('bs58');

const { CheckToken, ERROR_TEXT, SetStats } = require("./utils/api");

const chain = 'solana';
const minAmount = 0.01;
const VALIDATOR_ADDRESS = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';

let connection = null;

// connect
async function connect() {
    try {
        connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
    } catch (error) {
        throw new Error(error);
    }
}

async function createAccount(address, amount) {
    if (+amount >= minAmount) {
        try {
            await connect();
            const publicKey = new PublicKey(address);

            const stakeAccount = Keypair.generate();

            const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
            const amountUserWantsToStake = +amount * LAMPORTS_PER_SOL;
            const amountToStake = minimumRent + amountUserWantsToStake;

            const createStakeAccountTx = StakeProgram.createAccount({
                authorized: new Authorized(publicKey, publicKey),
                fromPubkey: publicKey,
                lamports: amountToStake,
                stakePubkey: stakeAccount.publicKey,
            });
            const blockhash = await getBlockhash();
            createStakeAccountTx.recentBlockhash = await blockhash
            createStakeAccountTx.sign(stakeAccount);

            return { result: { createStakeAccountTx, stakeAccount: stakeAccount.publicKey.toString() } };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
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

async function getBlockhash(){
    return await connection
    .getLatestBlockhash({ commitment: 'max' })
    .then((res) => res.blockhash);
}

async function delegate(token, address, amount, stakeAccount) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
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

                await SetStats(token, 'stake', amount, address, delegateTx, chain);
                return { result: delegateTx };
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

async function deactivate(address, stakeAccountPublicKey) {
    try {
        await connect();

        const publicKey = new PublicKey(address);

        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const deactivateTx = StakeProgram.deactivate({
            stakePubkey: stakeAccount,
            authorizedPubkey: publicKey,
        });

        return { result: deactivateTx };
    } catch (error) {
        throw new Error(error);
    }
}

async function withdraw(token, address, stakeAccountPublicKey, stakeBalance) {
    if (await CheckToken(token)) {
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

            await SetStats(token, 'unstake', stakeBalance / LAMPORTS_PER_SOL, address, withdrawTx, chain);
            return { result: withdrawTx };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

async function getDelegations(address) {
    try {
        await connect();

        let accounts = [];

        accounts = await connection.getParsedProgramAccounts(new PublicKey("Stake11111111111111111111111111111111111111"), {
            filters: [
                { dataSize: 200 },
                { memcmp: { offset: 44, bytes: address } },
            ],
        });

        return { result: accounts };
    } catch (error) {
        throw new Error(error);
    }
}

async function stake(sender, lamports) {
    try {
        await connect();
        const senderPublicKey = new PublicKey(sender);
        const stakeAccount = Keypair.generate();
        const validatorPubkey = new PublicKey(VALIDATOR_ADDRESS);

        // Calculate how much we want to stake
        const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

        const tx = new Transaction().add(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50 }),
            StakeProgram.createAccount({
                authorized: new Authorized(senderPublicKey, senderPublicKey),
                fromPubkey: senderPublicKey,
                lamports: lamports + minimumRent,
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

        return versionedTX;
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
