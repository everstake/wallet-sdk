const Web3 = require('web3');

const ABI_CONTRACT_ACCOUNTING = [{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"ZeroAddress","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Autocompound","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"RewardClaim","type":"event"},{"inputs":[],"name":"BEACON_AMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FEE_DENOMINATOR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"balance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"value","type":"address"}],"name":"setSuperAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"superAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"withdrawRequest","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdrawRequestQueueParams","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"poolFee","type":"uint256"},{"internalType":"address","name":"rewardsTreasury","type":"address"},{"internalType":"address","name":"withdrawTreasury","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"isAutocompound","type":"bool"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"interchangedAmount","type":"uint256"},{"internalType":"uint256","name":"activatedSlots","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"pendingBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"pendingBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"enum Enum.UserAccount","name":"userAccount","type":"uint8"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawPending","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"commonBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bool","name":"isAutocompound","type":"bool"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"withdrawFromPendingAmount","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimPoolFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getPoolFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"update","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"userPendingRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"feeValue","type":"uint256"}],"name":"setFee","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"autocompound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"autocompoundBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"fromAutocompoundToMain","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"fromMainToAutocompound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimWithdrawRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"closeValidatorsStat","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"stakeAmount","type":"uint256"}],"name":"setMinStakeAmount","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const ADDRESS_CONTRACT_ACCOUNTING = '0x995FC235f0051cDe7Cc53B6858D3688B96c3D915';

const ABI_CONTRACT_POOL = [{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"ZeroAddress","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"FeeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldGovernor","type":"address"},{"indexed":false,"internalType":"address","name":"newGovernor","type":"address"}],"name":"GovernorChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oldRewards","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"newRewards","type":"uint256"}],"name":"RewardsUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"StakeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"StakeCanceled","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"validator","type":"bytes"}],"name":"StakeDeposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"bytes","name":"validator","type":"bytes"}],"name":"TokensClaimed","type":"event"},{"inputs":[],"name":"BEACON_AMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"value","type":"address"}],"name":"setSuperAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"superAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"depositContract","type":"address"},{"internalType":"address","name":"accountingContract","type":"address"},{"internalType":"address","name":"withdrawTreasury","type":"address"},{"internalType":"address","name":"rewardsTreasury","type":"address"},{"internalType":"address","name":"poolGovernor","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"","type":"uint64"},{"internalType":"bool","name":"isAutocompound","type":"bool"}],"name":"stake","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"pendingBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"unstakeBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"enum Enum.UserAccount","name":"userAccount","type":"uint8"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"unstakePending","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bool","name":"isAutocompound","type":"bool"}],"name":"unstake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"pubkey","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"deposit_data_root","type":"bytes32"}],"internalType":"struct ValidatorList.DepositData[]","name":"pendingValidators","type":"tuple[]"}],"name":"setPendingValidators","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getPendingValidatorCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getPendingValidator","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getValidatorCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getValidator","outputs":[{"internalType":"bytes","name":"","type":"bytes"},{"internalType":"enum ValidatorList.ValidatorStatus","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"},{"components":[{"internalType":"bytes","name":"pubkey","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"deposit_data_root","type":"bytes32"}],"internalType":"struct ValidatorList.DepositData","name":"pendingValidator","type":"tuple"}],"name":"replacePendingValidator","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"markValidatorsAsExited","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"pause","type":"bool"}],"name":"pauseStaking","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"pause","type":"bool"}],"name":"pauseWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"governor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newGovernor","type":"address"}],"name":"setGovernor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"stakeAmount","type":"uint256"}],"name":"setMinStakeAmount","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const ADDRESS_CONTRACT_POOL = '0x839B9d0402002df0eDdBa66d1Fd96A6d2c8E5EF1';

const RPC_URL = 'https://rpc.sepolia.org';

const web3 = new Web3(RPC_URL);
const contract_accounting = new web3.eth.Contract(ABI_CONTRACT_ACCOUNTING, ADDRESS_CONTRACT_ACCOUNTING);
const contract_poll = new web3.eth.Contract(ABI_CONTRACT_POOL, ADDRESS_CONTRACT_POOL);

const minAmount = 0.1;
const baseGas = 500000;

// ===ACCOUNTING===

// Return total deposited and activated pool balance
async function balance() {
    try {
        const result = await contract_accounting.methods.balance().call()
        return { result: web3.utils.fromWei(result, 'ether') };
    } catch (error) {
        throw new Error(error);
    }
}

// Return pool pending balance. Always < 32 ETH
async function pendingBalance() {
    try {
        const result = await contract_accounting.methods.pendingBalance().call();
        return { result: web3.utils.fromWei(result, 'ether') };
    } catch (error) {
        throw new Error(error);
    }
}

// Return user pending balances. Common and Autocompound
async function pendingBalanceOf(address) {
    try {
        const result = await contract_accounting.methods.pendingBalanceOf(address).call();
        // TODO: uint256 Object
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Pool fee in bips (1/10000)
async function getPoolFee() {
    try {
        const result = await contract_accounting.methods.getPoolFee().call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Common active user balance
async function commonBalanceOf(address) {
    try {
        const result = await contract_accounting.methods.commonBalanceOf(address).call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Returns (bool) Claim user staking rewards
async function claim() {
    try {
        const result = await contract_accounting.methods.claim().call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Claim all autocompound user rewards and restake it into pool
async function autocompound() {
    try {
        const result = await contract_accounting.methods.autocompound().call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Return total user autocompound balance. Part of this balance could be in pending state after rewards autocompound
async function autocompoundBalanceOf(address) {
    try {
        const result = await contract_accounting.methods.autocompoundBalanceOf(address).call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Return info about withdraw requests queue. Totally alltime requested withdraw amount. Actual allowed for intercharge with deposits amount. Alltime withdraw treasury filled amount. Alltime claimed by users amount
async function withdrawRequestQueueParams() {
    try {
        const result = await contract_accounting.methods.withdrawRequestQueueParams().call();
        // TODO: uint256 Object
        // result
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Return user withdraw request info. Actual requested amount and amount ready for claim
async function withdrawRequest(address) {
    try {
        const result = await contract_accounting.methods.withdrawRequest(address).call();
        // TODO: uint256 Object
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Claim funds requested by withdraw
async function claimWithdrawRequest() {
    try {
        const result = await contract_accounting.methods.claimWithdrawRequest().call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Return number of expected to stop validators
async function closeValidatorsStat() {
    try {
        const result = await contract_accounting.methods.closeValidatorsStat().call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// ===POOL===

async function getPublicKey(privateKey) {
    const accounts = web3.eth.accounts.privateKeyToAccount(privateKey);
    return accounts.address;
}

async function sendTransaction(tx, privateKey) {
    try {
        let result = null;
        await web3.eth.accounts.signTransaction(tx, privateKey).then(async (signedTx) => {
            result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        });
        return { result: result.transactionHash }
    } catch (error) {
        throw new Error(error);
    }
}

// Stake funds into pool.
async function stake(privateKey, source, isAutocompound, amount) {
    if (+amount >= minAmount) {
        try {
            const publicKey = await getPublicKey(privateKey);

            const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
            // Create the transaction
            const tx = {
                'from': publicKey,
                'to': ADDRESS_CONTRACT_POOL,
                'value': amountWei,
                'gas': baseGas,
                'data': contract_poll.methods.stake(source, isAutocompound).encodeABI()
            };

            // Sign the transaction
            return await sendTransaction(tx, privateKey);
        } catch (err) {
            return err;
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
    }
}

// Unstake value from common or autocompound balance. Unstaked immediately if value <= pool pending balance or create withdraw request
// TODO: test
async function unstake(privateKey, value, isAutocompound) {
    if (+value >= minAmount) {
        try {
            const publicKey = await getPublicKey(privateKey);

            const amountWei = await web3.utils.toWei(value.toString(), 'ether');
            // Create the transaction
            const tx = {
                'from': publicKey,
                'value': amountWei,
                'to': ADDRESS_CONTRACT_POOL,
                'gas': baseGas,
                'data': contract_poll.methods.unstake(amountWei, isAutocompound).encodeABI()
            };

            // Sign the transaction
            return await sendTransaction(tx, privateKey);
        } catch (err) {
            return err;
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
    }
}

// Unstake pending amount from Common, Autocompound or Total(both accounts)
// TODO: test
async function unstakePending(privateKey, userAccount, amount) {
    if (+amount >= minAmount) {
        try {
            const publicKey = await getPublicKey(privateKey);

            const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
            // Create the transaction
            const tx = {
                'from': publicKey,
                'value': amountWei,
                'to': ADDRESS_CONTRACT_POOL,
                'gas': baseGas,
                'data': contract_poll.methods.unstakePending(userAccount, amount).encodeABI()
            };

            // Sign the transaction
            return await sendTransaction(tx, privateKey);
        } catch (err) {
            return err;
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
    }
}

// Return total pending balance. Common + autocompound
async function pendingBalanceOfPool(address) {
    try {
        const result = await contract_poll.methods.pendingBalanceOf(address).call();
        return { result: web3.utils.fromWei(result, 'ether') };
    } catch (error) {
        throw new Error(error);
    }
}

// Return total active balance. Common + autocompound
async function unstakeBalanceOf(address) {
    try {
        const result = await contract_poll.methods.unstakeBalanceOf(address).call();
        return { result: web3.utils.fromWei(result, 'ether') };
    } catch (error) {
        throw new Error(error);
    }
}

// Returns num of validators prepared for deposit
async function getPendingValidatorCount() {
    try {
        const result = await contract_poll.methods.getPendingValidatorCount().call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// By index return pending validator pubkey. List of pending validators is dinamic so ordering unstable
// TODO: fix
async function getPendingValidator(index) {
    try {
        const result = await contract_poll.methods.getPendingValidator(index).call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Return total num of known validators. Validator can be in one of statuses: pending, deposited, exited. Exited validators will be rewrited by new pending validators to optimize memory usage
async function getValidatorCount() {
    try {
        const result = await contract_poll.methods.getValidatorCount().call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}

// Return validator pubkey and status
async function getValidator(index) {
    try {
        const result = await contract_poll.methods.getValidator(index).call();
        return { result: result };
    } catch (error) {
        throw new Error(error);
    }
}


module.exports = {
    // accounting
    balance,
    pendingBalance,
    pendingBalanceOf,
    getPoolFee,
    commonBalanceOf,
    claim,
    autocompound,
    autocompoundBalanceOf,
    withdrawRequestQueueParams,
    withdrawRequest,
    claimWithdrawRequest,
    closeValidatorsStat,

    // pool
    stake,
    unstake,
    unstakePending,
    pendingBalanceOfPool,
    unstakeBalanceOf,
    getPendingValidatorCount,
    getPendingValidator,
    getValidatorCount,
    getValidator,
};
