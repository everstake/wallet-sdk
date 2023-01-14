import { Authorized, clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, StakeProgram} from "@solana/web3.js";
import bs58 from 'bs58';
import bip39 from 'bip39';

const minAmount = 0.0023;
const VALIDATOR_ADDRESS = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';

let connection = null;
let wallet = null;

// connect
async function connect(secretKey = null) {
    try {
        connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
        // connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        if (secretKey) {
            if (bip39.validateMnemonic(secretKey)) {
                wallet = Keypair.fromSeed(bip39.mnemonicToSeedSync(secretKey).slice(0, 32));
            } else if (typeof secretKey === 'object') {
                wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
            } else {
                wallet = Keypair.fromSecretKey(bs58.decode(secretKey));
            }
        }
    } catch (error) {
        throw new Error(error);
    }
}

async function delegate(secretKey, amount) {
    if (+amount >= minAmount) {
        try {
            await connect(secretKey);

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

            return await sendAndConfirmTransaction(connection, delegateTx, [wallet]);
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(`ERROR: Min Amount ${minAmount}`);
    }
}

async function deactivate(secretKey, stakeAccountPublicKey) {
    try {
        await connect(secretKey);

        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const deactivateTx = StakeProgram.deactivate({
            stakePubkey: stakeAccount,
            authorizedPubkey: wallet.publicKey,
        });

        return await sendAndConfirmTransaction(
            connection,
            deactivateTx,
            [wallet],
        );
    } catch (error) {
        throw new Error(error);
    }
}

async function withdraw(secretKey, stakeAccountPublicKey, stakeBalance) {
    try {
        await connect(secretKey);

        const stakeAccount = new PublicKey(stakeAccountPublicKey);

        const withdrawTx = StakeProgram.withdraw({
            stakePubkey: stakeAccount,
            authorizedPubkey: wallet.publicKey,
            toPubkey: wallet.publicKey,
            lamports: stakeBalance,
        });

        return await sendAndConfirmTransaction(connection, withdrawTx, [wallet]);
    } catch (error) {
        throw new Error(error);
    }
}

async function getDelegations(address) {
    try {
        await connect();

        const accounts = await connection.getParsedProgramAccounts(new PublicKey("Stake11111111111111111111111111111111111111"), {
            filters: [
                {dataSize: 200},
                {memcmp: {offset: 44, bytes: address}},
            ],
        });

        if (accounts.length) {
            return JSON.stringify(accounts);
        } else {
            return null;
        }
    } catch (error) {
        throw new Error(error);
    }
}

export {
    delegate,
    deactivate,
    withdraw,
    getDelegations,
};
