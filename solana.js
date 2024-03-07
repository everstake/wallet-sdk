const {
    Authorized,
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    StakeProgram
} = require('@solana/web3.js');

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

            return { result: createStakeAccountTx, stakeAccount: stakeAccount.publicKey.toString() };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
    }
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
                {dataSize: 200},
                {memcmp: {offset: 44, bytes: address}},
            ],
        });

        return { result: accounts };
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
};
