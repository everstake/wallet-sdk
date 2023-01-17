const {
    Authorized,
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    StakeProgram
} = require('@solana/web3.js');

const bs58 = require('bs58');
const bip39 = require('bip39');

const minAmount = 0.01;
const VALIDATOR_ADDRESS = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';

let connection = null;
let wallet = null;

// connect
async function connect(privetKey = null) {
    try {
        connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
        if (privetKey) {
            if (bip39.validateMnemonic(privetKey)) {
                wallet = Keypair.fromSeed(bip39.mnemonicToSeedSync(privetKey).slice(0, 32));
            } else if (typeof privetKey === 'object') {
                wallet = Keypair.fromSecretKey(Uint8Array.from(privetKey));
            } else {
                wallet = Keypair.fromSecretKey(bs58.decode(privetKey));
            }
        }
    } catch (error) {
        throw new Error(error);
    }
}

async function delegate(privetKey, amount) {
    if (+amount >= minAmount) {
        try {
            await connect(privetKey);

            const stakeAccount = Keypair.generate();

            const minimumRent = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
            const amountUserWantsToStake = +amount * LAMPORTS_PER_SOL;
            const amountToStake = minimumRent + amountUserWantsToStake;

            const createStakeAccountTx = StakeProgram.createAccount({
                authorized: new Authorized(wallet.publicKey, wallet.publicKey),
                fromPubkey: wallet.publicKey,
                lamports: amountToStake,
                stakePubkey: stakeAccount.publicKey,
            });
            await sendAndConfirmTransaction(connection, createStakeAccountTx, [wallet, stakeAccount]);

            const selectedValidatorPubkey = new PublicKey(VALIDATOR_ADDRESS);

            const delegateTx = StakeProgram.delegate({
                stakePubkey: stakeAccount.publicKey,
                authorizedPubkey: wallet.publicKey,
                votePubkey: selectedValidatorPubkey,
            });

            const delegateTxHash = await sendAndConfirmTransaction(connection, delegateTx, [wallet]);

            return { result: delegateTxHash };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
    }
}

async function deactivate(privetKey, stakeAccountPublicKey) {
    try {
        await connect(privetKey);

        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const deactivateTx = StakeProgram.deactivate({
            stakePubkey: stakeAccount,
            authorizedPubkey: wallet.publicKey,
        });

        const deactivateTxHash = await sendAndConfirmTransaction(
            connection,
            deactivateTx,
            [wallet],
        );

        return { result: deactivateTxHash };
    } catch (error) {
        throw new Error(error);
    }
}

async function withdraw(privetKey, stakeAccountPublicKey, stakeBalance) {
    try {
        await connect(privetKey);

        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const withdrawTx = StakeProgram.withdraw({
            stakePubkey: stakeAccount,
            authorizedPubkey: wallet.publicKey,
            toPubkey: wallet.publicKey,
            lamports: stakeBalance,
        });

        const withdrawTxHash = await sendAndConfirmTransaction(connection, withdrawTx, [wallet]);

        return { result: withdrawTxHash };
    } catch (error) {
        throw new Error(error);
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
    delegate,
    deactivate,
    withdraw,
    getDelegations,
};
