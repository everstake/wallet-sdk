const Web3 = require('web3');
const {CheckToken, ERROR_TEXT, SetStats} = require("./utils/api");

const ABI_CONTRACT_APPROVE = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"account","type":"address"}],"name":"isPauser","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renouncePauser","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"account","type":"address"}],"name":"addPauser","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"name","type":"string"},{"name":"symbol","type":"string"},{"name":"decimals","type":"uint8"},{"name":"totalSupply","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"}],"name":"PauserAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"account","type":"address"}],"name":"PauserRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"}];
const ADDRESS_CONTRACT_APPROVE = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0';

const ABI_CONTRACT_BUY = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"activeAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_minSharesToMint","type":"uint256"}],"name":"buyVoucher","outputs":[{"internalType":"uint256","name":"amountToDeposit","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"commissionRate_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"delegation","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address payable","name":"destination","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"drain","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"eventsHub","outputs":[{"internalType":"contract EventsHub","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"exchangeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getLiquidRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getRewardPerShare","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getTotalStake","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"initalRewardPerShare","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_validatorId","type":"uint256"},{"internalType":"address","name":"_stakingLogger","type":"address"},{"internalType":"address","name":"_stakeManager","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastCommissionUpdate_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"locked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"migrateIn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"migrateOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"minAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"restake","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"rewardPerShare","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"uint256","name":"maximumSharesToBurn","type":"uint256"}],"name":"sellVoucher","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"uint256","name":"maximumSharesToBurn","type":"uint256"}],"name":"sellVoucher_new","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"validatorStake","type":"uint256"},{"internalType":"uint256","name":"delegatedAmount","type":"uint256"},{"internalType":"uint256","name":"totalAmountToSlash","type":"uint256"}],"name":"slash","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"stakeManager","outputs":[{"internalType":"contract IStakeManager","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"stakingLogger","outputs":[{"internalType":"contract StakingInfo","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalStake_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"unbondNonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"unbonds","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"withdrawEpoch","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"unbonds_new","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"withdrawEpoch","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unlock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unstakeClaimTokens","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"unbondNonce","type":"uint256"}],"name":"unstakeClaimTokens_new","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bool","name":"_delegation","type":"bool"}],"name":"updateDelegation","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"validatorId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"validatorRewards_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"withdrawExchangeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"withdrawPool","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"withdrawRewards","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"withdrawShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];
const ADDRESS_CONTRACT_BUY = '0xF30Cf4ed712D3734161fDAab5B1DBb49Fd2D0E5c';

const RPC_URL = 'https://cloudflare-eth.com/'; // https://ethereum.publicnode.com

const minAmount = 1;
const baseGas = 500000;

const chain = 'polygon';

const web3 = new Web3(RPC_URL);
const contract_approve = new web3.eth.Contract(ABI_CONTRACT_APPROVE, ADDRESS_CONTRACT_APPROVE);
const contract_buy = new web3.eth.Contract(ABI_CONTRACT_BUY, ADDRESS_CONTRACT_BUY);

// help func
async function getTransactionCount(publicKey) {
    return await web3.eth.getTransactionCount(publicKey, 'latest');
}

// send Transaction
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

// is (bool) func
async function isTransactionLoading(hash) {
    try {
        const result = await web3.eth.getTransactionReceipt(hash);
        if (result && result.status) {
            return { result: false };
        } else {
            await isTransactionLoading(hash);
            return { result: true };
        }
    } catch (error) {
        throw new Error(error);
    }
}

// transact func
async function approve(address, amount) {
    if (+amount >= minAmount) {
        try {
            const result = contract_buy.methods.getTotalStake(address).call();
            if (+result[0] !== 0) {
                return { result: 'approve' };
            } else {
                const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
                const gasEstimate = await contract_approve.methods.approve(address, amountWei).estimateGas();

                // Create the transaction
                return {
                    'from': address,
                    'to': ADDRESS_CONTRACT_APPROVE,
                    'nonce': await getTransactionCount(address),
                    'gas': gasEstimate,
                    'data': contract_approve.methods.approve(address, amountWei).encodeABI()
                };
            }
        } catch (err) {
            return err;
        }
    } else {
        throw new Error(`Min Amount ${minAmount}`);
    }
}
async function delegate(token, address, amount) {
    if (await CheckToken(token)) {
        if (+amount >= minAmount) {
            try {
                const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
                const nonce = await web3.eth.getTransactionCount(address, 'latest');

                // Create the transaction
                const tx = {
                    'from': address,
                    'to': ADDRESS_CONTRACT_BUY,
                    'nonce': nonce,
                    'gas': baseGas,
                    'data': contract_buy.methods.buyVoucher(amountWei, 2456).encodeABI()
                };

                await SetStats(token, 'stake', amount, address, tx, chain);
                // Sign the transaction
                return tx;
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
async function undelegate(token, address, amount) {
    if (await CheckToken(token)) {
        try {
            const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
            const nonce = await web3.eth.getTransactionCount(address, 'latest');

            // Create the transaction
            const tx = {
                'from': address,
                'to': ADDRESS_CONTRACT_BUY,
                'nonce': nonce,
                'gas': baseGas,
                'data': contract_buy.methods.sellVoucher_new(amountWei, amountWei).encodeABI()
            };

            await SetStats(token, 'unstake', amount, address, tx, chain);

            return tx
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}
async function reward(address) {
    const nonce = await web3.eth.getTransactionCount(address, 'latest');

    // Create the transaction
    return {
        'from': address,
        'to': ADDRESS_CONTRACT_BUY,
        'nonce': nonce,
        'gas': baseGas,
        'data': contract_buy.methods.withdrawRewards().encodeABI()
    };
}
async function restake(address) {
    const nonce = await web3.eth.getTransactionCount(address, 'latest');

    // Create the transaction
    return {
        'from': address,
        'to': ADDRESS_CONTRACT_BUY,
        'nonce': nonce,
        'gas': baseGas,
        'data': contract_buy.methods.restake().encodeABI()
    };
}

// get func
async function getBalance(address) {
    try {
        const resp = await web3.eth.getBalance(address);
        return +web3.utils.fromWei(resp, "ether");
    } catch (error) {
        throw new Error(error);
    }
}
async function getReward(address) {
    try {
        const result = await contract_buy.methods.getLiquidRewards(address).call()
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}
async function getTotalDelegate(address) {
    try {
        const result = await contract_buy.methods.getTotalStake(address).call();
        return +web3.utils.fromWei(result[0], 'ether');
    } catch (error) {
        throw new Error(error);
    }
}
async function getUnbond(address) {
    try {
        const unbondNonces = await contract_buy.methods.unbondNonces(address).call();
        const result = await contract_buy.methods.unbonds_new(address, unbondNonces).call();
        return +web3.utils.fromWei(result[0], 'ether');
    } catch (error) {
        throw new Error(error);
    }
}
async function getUnbondNonces(address) {
    try {
        return await contract_buy.methods.unbondNonces(address).call();
    } catch (error) {
        throw new Error(error);
    }
}
async function getBalanceOf(address) {
    try {
        const result = await contract_approve.methods.balanceOf(address).call();
        return +web3.utils.fromWei(result, 'ether');
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = {
    isTransactionLoading,
    approve,
    delegate,
    undelegate,
    reward,
    restake,
    getReward,
    getTotalDelegate,
    getUnbond,
    getBalance,
    getBalanceOf,
    getUnbondNonces,
    sendTransaction,
    ABI_CONTRACT_APPROVE,
    ADDRESS_CONTRACT_APPROVE,
    ABI_CONTRACT_BUY,
    ADDRESS_CONTRACT_BUY
};
