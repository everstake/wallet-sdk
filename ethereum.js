const Web3 = require('web3');

const ABI_CONTRACT_ACCOUNTING = [{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"InvalidParam","type":"error"},{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"InvalidValue","type":"error"},{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"ZeroValue","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"round","type":"uint256"}],"name":"ActivateRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"AddWithdrawRequest","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Autocompound","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"int256","name":"","type":"int256"}],"name":"ChangeExpectValidatorsToStop","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"ClaimPoolFee","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"ClaimWithdrawRequest","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"DepositPending","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"FeeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldGovernor","type":"address"},{"indexed":false,"internalType":"address","name":"newGovernor","type":"address"}],"name":"GovernorChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"InterchangeDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"InterchangeWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"superAdmin","type":"address"}],"name":"SetSuperAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"rewarderBalance","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"reward","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"fee","type":"uint256"}],"name":"Update","type":"event"},{"inputs":[],"name":"BEACON_AMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"FEE_DENOMINATOR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"governor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"value","type":"address"}],"name":"setSuperAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"superAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"poolFee","type":"uint256"},{"internalType":"address","name":"rewardsTreasury","type":"address"},{"internalType":"address","name":"withdrawTreasury","type":"address"},{"internalType":"address","name":"accountingGovernor","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"depositToPendingValue","type":"uint256"}],"name":"deposit","outputs":[{"internalType":"uint256","name":"interchangedAmount","type":"uint256"},{"internalType":"uint256","name":"activatedSlots","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"balance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingDepositedBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"autocompoundBalanceOf","outputs":[{"internalType":"uint256","name":"autocompoundBalance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"depositedBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"pendingDepositedBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"pendingBalanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawPending","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"withdraw","outputs":[{"internalType":"uint256","name":"withdrawFromPendingAmount","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimPoolFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getPoolFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"update","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"feeValue","type":"uint256"}],"name":"setFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"autocompound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"pendingRestakedRewards","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"pendingRestakedRewardOf","outputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"restakedRewardOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdrawRequestQueueParams","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"staker","type":"address"}],"name":"withdrawRequest","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimWithdrawRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"readyforAutocompoundRewardsAmount","outputs":[{"internalType":"uint256","name":"unclaimedReward","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"closeValidatorsStat","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"stakeAmount","type":"uint256"}],"name":"setMinRestakeAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"activatedValidatorNum","type":"uint256"}],"name":"activateValidators","outputs":[],"stateMutability":"nonpayable","type":"function"}];
let ADDRESS_CONTRACT_ACCOUNTING = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';

const ABI_CONTRACT_POOL = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"InvalidAmount","type":"error"},{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"InvalidParam","type":"error"},{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"InvalidValue","type":"error"},{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"Paused","type":"error"},{"inputs":[{"internalType":"string","name":"field","type":"string"}],"name":"ZeroValue","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldGovernor","type":"address"},{"indexed":false,"internalType":"address","name":"newGovernor","type":"address"}],"name":"GovernorChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"","type":"bool"}],"name":"PauseStaking","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"","type":"bool"}],"name":"PauseWithdraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"oldPendingValidatorPubKey","type":"bytes"},{"indexed":false,"internalType":"bytes","name":"newPendingValidatorPubKey","type":"bytes"}],"name":"PendingValidatorReplaced","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"Restake","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"SetMinStakeAmount","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"superAdmin","type":"address"}],"name":"SetSuperAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"StakeActivated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"uint64","name":"source","type":"uint64"}],"name":"StakeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"StakeCanceled","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"validator","type":"bytes"}],"name":"StakeDeposited","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"staker","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"},{"indexed":false,"internalType":"uint64","name":"source","type":"uint64"}],"name":"Unstake","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes","name":"validator","type":"bytes"}],"name":"ValidatorMarkedAsExited","type":"event"},{"inputs":[],"name":"BEACON_AMOUNT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"governor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"value","type":"address"}],"name":"setSuperAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"superAdmin","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"depositContract","type":"address"},{"internalType":"address","name":"accountingContract","type":"address"},{"internalType":"address","name":"withdrawTreasury","type":"address"},{"internalType":"address","name":"rewardsTreasury","type":"address"},{"internalType":"address","name":"poolGovernor","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint64","name":"source","type":"uint64"}],"name":"stake","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"unstakePending","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint16","name":"allowedInterchangeNum","type":"uint16"},{"internalType":"uint64","name":"source","type":"uint64"}],"name":"unstake","outputs":[{"internalType":"uint256","name":"unstakeFromPendingValue","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"activateStake","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"activatedSlots","type":"uint256"}],"name":"restake","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"pubkey","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"deposit_data_root","type":"bytes32"}],"internalType":"struct ValidatorList.DepositData[]","name":"pendingValidators","type":"tuple[]"}],"name":"setPendingValidators","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getPendingValidatorCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getPendingValidator","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getValidatorCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getValidator","outputs":[{"internalType":"bytes","name":"","type":"bytes"},{"internalType":"enum ValidatorList.ValidatorStatus","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"},{"components":[{"internalType":"bytes","name":"pubkey","type":"bytes"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"bytes32","name":"deposit_data_root","type":"bytes32"}],"internalType":"struct ValidatorList.DepositData","name":"pendingValidator","type":"tuple"}],"name":"replacePendingValidator","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num","type":"uint256"}],"name":"markValidatorsAsExited","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"index","type":"uint256"}],"name":"markValidatorAsExited","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"reorderPending","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"pause","type":"bool"}],"name":"pauseStaking","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"pause","type":"bool"}],"name":"pauseWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newGovernor","type":"address"}],"name":"setGovernor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"minStakeAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"stakeAmount","type":"uint256"}],"name":"setMinStakeAmount","outputs":[],"stateMutability":"nonpayable","type":"function"}]
let ADDRESS_CONTRACT_POOL = '0xD523794C879D9eC028960a231F866758e405bE34';

let RPC_URL = 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1';

let web3 = new Web3(RPC_URL);
let contract_accounting = new web3.eth.Contract(ABI_CONTRACT_ACCOUNTING, ADDRESS_CONTRACT_ACCOUNTING);
let contract_pool = new web3.eth.Contract(ABI_CONTRACT_POOL, ADDRESS_CONTRACT_POOL);

const UINT16_MAX = 65535|0; // asm type annotation

const minAmount = 0.1;
const baseGas = 500000;
const gasReserve = 120000;
const notRewardsMessage = 'Not active rewards for claim';

// ===ACCOUNTING===

/** Return total deposited and activated pool balance */
async function balance() {
    try {
        const result = await contract_accounting.methods.balance().call()
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return pool pending balance. Always < 32 ETH */
async function pendingBalance() {
    try {
        const result = await contract_accounting.methods.pendingBalance().call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return pool pending deposited balance. Balance deposited into Beacon deposit contract but validators still not active */
async function pendingDepositedBalance() {
    try {
        const result = await contract_accounting.methods.pendingDepositedBalance().call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return pool restaked rewards which in pending status */
async function pendingRestakedRewards() {
    try {
        const result = await contract_accounting.methods.pendingRestakedRewards().call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return pool unclaimed rewards amount which can be restaked */
async function readyforAutocompoundRewardsAmount() {
    try {
        const result = await contract_accounting.methods.readyforAutocompoundRewardsAmount().call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return user pending balance. */
async function pendingBalanceOf(address) {
    try {
        const result = await contract_accounting.methods.pendingBalanceOf(address).call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return user pending deposited balance. Balance which deposited into validator but not active yet. Pending deposited balance can't be unstake till validator activation */
async function pendingDepositedBalanceOf(address) {
    try {
        const result = await contract_accounting.methods.pendingDepositedBalanceOf(address).call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}


/** Return user active origin deposited balance */
async function depositedBalanceOf(address) {
    try {
        const result = await contract_accounting.methods.depositedBalanceOf(address).call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return user restaked rewards in pending state */
async function pendingRestakedRewardOf(address) {
    try {
        const result = await contract_accounting.methods.pendingRestakedRewardOf(address).call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Return total user restaked rewards. Include rewards in pending state */
async function restakedRewardOf(address) {
    try {
        const result = await contract_accounting.methods.restakedRewardOf(address).call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/** Pool fee in bips (1/10000) */
async function getPoolFee() {
    try {
        const result = await contract_accounting.methods.getPoolFee().call();
        return (+result / 10000);
    } catch (error) {
        throw new Error(error);
    }
}

/** Claim all pool rewards and restake it into pool */
async function autocompound(address) {
    try {
        const rewards = await readyforAutocompoundRewardsAmount();
        const gasConsumption = await contract_accounting.methods.autocompound().estimateGas({from: address});
        if (rewards !== 0) {
            return {
                'from': address,
                'to': ADDRESS_CONTRACT_ACCOUNTING,
                'value': 0,
                'gas': gasConsumption + gasReserve,
                'data': contract_accounting.methods.autocompound().encodeABI()
            };
        } else {
            return notRewardsMessage;
        }
    } catch (error) {
        throw new Error(error);
    }
}

/** Return total user autocompound balance. Part of this balance could be in pending state after rewards autocompound */
async function autocompoundBalanceOf(address) {
    try {
        const result = await contract_accounting.methods.autocompoundBalanceOf(address).call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

/**
 * Return info about withdraw requests queue.
 * Totally alltime requested withdraw amount.
 * Actual allowed for intercharge with deposits amount.
 * Alltime withdraw treasury filled amount.
 * Alltime claimed by users amount
 */

async function withdrawRequestQueueParams() {
    try {
        const result = await contract_accounting.methods.withdrawRequestQueueParams().call();
        return {
            // Totally alltime requested withdraw amount.
            withdrawRequested: +web3.utils.fromWei(result[0], 'ether'),
            // Actual allowed for interchange with deposits amount.
            interchangeAllowed: +web3.utils.fromWei(result[1], 'ether'),
            // Alltime withdraw treasury filled amount.
            filled: +web3.utils.fromWei(result[2], 'ether'),
            // Alltime claimed by users amount
            claimed: +web3.utils.fromWei(result[3], 'ether'),
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** Return user withdraw request info. Actual requested amount and amount ready for claim */
async function withdrawRequest(address) {
    try {
        const result = await contract_accounting.methods.withdrawRequest(address).call();
        return {
            requested: +web3.utils.fromWei(result[0], 'ether'),
            readyForClaim: +web3.utils.fromWei(result[1], 'ether'),
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** Claim funds requested by withdraw */
async function claimWithdrawRequest(address) {
    try {
        const rewards = await withdrawRequest(address);
        const gasConsumption = await contract_accounting.methods.claimWithdrawRequest().estimateGas({from: address});

        if (rewards.readyForClaim === rewards.requested) {
            return {
                'from': address,
                'to': ADDRESS_CONTRACT_ACCOUNTING,
                'value': 0,
                'gas': gasConsumption + gasReserve,
                'data': contract_accounting.methods.claimWithdrawRequest().encodeABI()
            };
        } else {
            return notRewardsMessage;
        }
    } catch (error) {
        throw new Error(error);
    }
}

/** Return number of expected to stop validators */
async function closeValidatorsStat() {
    try {
        return await contract_accounting.methods.closeValidatorsStat().call();
    } catch (error) {
        throw new Error(error);
    }
}

// ===POOL===
/** Stake funds into pool. */
async function stake(address, amount, source = '0') {
    if (+amount >= minAmount) {
        try {
            const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
            const gasConsumption = await contract_pool.methods.stake(source).estimateGas({from: address, value: amountWei});

            // Create the transaction
            return {
                'from': address,
                'to': ADDRESS_CONTRACT_POOL,
                'value': amountWei,
                'gas': gasConsumption + gasReserve,
                'data': contract_pool.methods.stake(source).encodeABI()
            };
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
    }
}

/** Unstake value from active autocompound balance. 
 * allowedInterchangeNum is max allowed number interchanges with pending stakers. 
 * Unstaked immediately if value <= pool pending balance or create withdraw request. 
 * Interchange disallowed as default
*/
async function unstake(address, amount, allowedInterchangeNum = 0, source = '0') {
    try {
        const amountWei = await web3.utils.toWei(amount.toString(), 'ether');

        let balance = await autocompoundBalanceOf(address);
        // Check for type overflow
        if (allowedInterchangeNum > UINT16_MAX) {
            allowedInterchangeNum = UINT16_MAX;
        }
        
        const gasConsumption = await contract_pool.methods.unstake(amountWei, allowedInterchangeNum, source).estimateGas({from: address});   

        if (balance >= +amount) {
            // Create the transaction
            return {
                'from': address,
                'value': 0,
                'to': ADDRESS_CONTRACT_POOL,
                'gas': gasConsumption + gasReserve,
                'data': contract_pool.methods.unstake(amountWei, allowedInterchangeNum, source).encodeABI()
            };
        } else {
            throw new Error(`Max Amount For Unstake ${balance}`);
        }
    } catch (error) {
        throw new Error(error);
    }
}

/** Simulate unstake tx and return amount of instant unstake. 
 * Required to compare evaluation of allowedInterchangeNum param
*/
async function simulateUnstake(address, amount, allowedInterchangeNum = 1, source = '0') {
    try {
        const amountWei = await web3.utils.toWei(amount.toString(), 'ether');

        let balance = await autocompoundBalanceOf(address);
        // Check for type overflow
        if (allowedInterchangeNum > UINT16_MAX) {
            allowedInterchangeNum = UINT16_MAX;
        }

        if (balance >= +amount) {
            return await contract_pool.methods.unstake(amountWei, allowedInterchangeNum, source).call({from: address});
        } else {
            throw new Error(`Max Amount For Unstake ${balance}`);
        }
    } catch (error) {
        throw new Error(error);
    }
}

/** Unstake pending amount from Autocompound */
async function unstakePending(address, amount) {
    let pendingBalance = await pendingBalanceOf(address);
    if (+amount <= pendingBalance) {
        try {

            pendingBalance -= +amount;    
            if (pendingBalance > 0) {
                const minStake = await minStakeAmount();
                if (pendingBalance < minStake) {
                    throw new Error(`Pending balance less than min stake amount ${minStake}`);
                }
            }

            const amountWei = await web3.utils.toWei(amount.toString(), 'ether');  
            const gasConsumption = await contract_pool.methods.unstakePending(amountWei).estimateGas({from: address});

            // Create the transaction
            return  {
                'from': address,
                'value': 0,
                'to': ADDRESS_CONTRACT_POOL,
                'gas': gasConsumption + gasReserve,
                'data': contract_pool.methods.unstakePending(amountWei).encodeABI()
            };
        } catch (err) {
            return err;
        }
    } else {
        throw new Error(`Amount gt than pending balance ${pendingBalance}`);
    }
}

/** Activate pending stake by interchange with withdraw request. */
async function activateStake() {
    try {
        const gasAmount = await contract_pool.methods.activateStake().estimateGas({from: address});

        // Create the transaction
        return {
            'from': address,
            'to': ADDRESS_CONTRACT_POOL,
            'value': 0,
            'gas': gasAmount + gasReserve,
            'data': contract_pool.methods.activateStake().encodeABI()
        };
    } catch (error) {
        throw new Error(error);
    }
}

/** Returns num of validators prepared for deposit */
async function getPendingValidatorCount() {
    try {
        return await contract_pool.methods.getPendingValidatorCount().call();
    } catch (error) {
        throw new Error(error);
    }
}

/** By index return pending validator pubkey. List of pending validators is dinamic so ordering unstable */
async function getPendingValidator(index) {
    try {
        return await contract_pool.methods.getPendingValidator(index).call();
    } catch (error) {
        throw new Error(error);
    }
}

/** Return total num of known validators. Validator can be in one of statuses: pending, deposited, exited. Exited validators will be rewrited by new pending validators to optimize memory usage */
async function getValidatorCount() {
    try {
        return await contract_pool.methods.getValidatorCount().call();
    } catch (error) {
        throw new Error(error);
    }
}


/** Return validator pubkey and status */
async function getValidator(index) {
    try {
        const result = await contract_pool.methods.getValidator(index).call();
        return {
            pubkey: result[0],
            status: result[1] === '0' ? 'unknown' : result[1] === '1' ? 'pending' : 'deposited',
        }
    } catch (error) {
        throw new Error(error);
    }
}

/** Return minimal user single stake amount */
async function minStakeAmount() {
    try {
        const result = await contract_pool.methods.minStakeAmount().call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

function selectNetwork(network) {
    switch (network) {
        case 'mainnet':
            RPC_URL = 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1';
            ADDRESS_CONTRACT_ACCOUNTING = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';
            ADDRESS_CONTRACT_POOL = '0xD523794C879D9eC028960a231F866758e405bE34';
            break;
        case 'holesky':
            RPC_URL = 'https://ethereum-holesky.publicnode.com';
            ADDRESS_CONTRACT_ACCOUNTING = '0x624087DD1904ab122A32878Ce9e933C7071F53B9';
            ADDRESS_CONTRACT_POOL = '0xAFA848357154a6a624686b348303EF9a13F63264';
            break;
        case 'goerli':    
            RPC_URL = 'https://eth-goerli.public.blastapi.io';
            ADDRESS_CONTRACT_ACCOUNTING = '0x6e95818C2Dde3d87406F5C5d0A759d9372053a94';
            ADDRESS_CONTRACT_POOL = '0x1F28aD3B3e26192a09c1248D4092c692c32f8Ec0';
            break;   
        default:
            throw new Error(`Unsupported network ${network}`);
    }

    web3 = new Web3(RPC_URL);
    contract_accounting = new web3.eth.Contract(ABI_CONTRACT_ACCOUNTING, ADDRESS_CONTRACT_ACCOUNTING);
    contract_pool = new web3.eth.Contract(ABI_CONTRACT_POOL, ADDRESS_CONTRACT_POOL);

    return {address_accounting: ADDRESS_CONTRACT_ACCOUNTING, address_pool: ADDRESS_CONTRACT_POOL};
}

module.exports = {
    // accounting
    balance,
    pendingBalance,
    pendingDepositedBalance,
    pendingRestakedRewards,
    readyforAutocompoundRewardsAmount,
    pendingBalanceOf,
    pendingDepositedBalanceOf,
    depositedBalanceOf,
    pendingRestakedRewardOf,
    restakedRewardOf,
    autocompoundBalanceOf,
    getPoolFee,
    autocompound,    
    withdrawRequestQueueParams,
    withdrawRequest,
    claimWithdrawRequest,
    closeValidatorsStat,

    // pool
    stake,
    unstake,
    simulateUnstake,
    unstakePending,
    activateStake,
    getPendingValidatorCount,
    getPendingValidator,
    getValidatorCount,
    getValidator,
    minStakeAmount,

    // help
    selectNetwork,
    ABI_CONTRACT_ACCOUNTING,
    ADDRESS_CONTRACT_ACCOUNTING,
    ABI_CONTRACT_POOL,
    ADDRESS_CONTRACT_POOL,
    contract_accounting,
    contract_pool,
};
