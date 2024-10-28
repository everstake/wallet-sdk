const { Web3 } = require('web3');
const { CheckToken, ERROR_TEXT, SetStats } = require("./utils/api");
const BigNumber = require('bignumber.js');

const ABI_CONTRACT_APPROVE = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "account", "type": "address" }], "name": "isPauser", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [], "name": "renouncePauser", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "account", "type": "address" }], "name": "addPauser", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "spender", "type": "address" }, { "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "name": "success", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": false, "inputs": [{ "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "inputs": [{ "name": "name", "type": "string" }, { "name": "symbol", "type": "string" }, { "name": "decimals", "type": "uint8" }, { "name": "totalSupply", "type": "uint256" }], "payable": false, "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "account", "type": "address" }], "name": "Paused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "name": "account", "type": "address" }], "name": "Unpaused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "account", "type": "address" }], "name": "PauserAdded", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "account", "type": "address" }], "name": "PauserRemoved", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }];
const ADDRESS_CONTRACT_APPROVE = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0';
const ADDRESS_CONTRACT_APPROVE_POL = '0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6';

const ADDRESS_CONTRACT_STAKING = '0x5e3Ef299fDDf15eAa0432E6e66473ace8c13D908';

const ABI_CONTRACT_STAKING = [{ "constant": true, "inputs": [], "name": "currentEpoch", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }];

const ABI_CONTRACT_BUY = [{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[{"internalType":"bool","name":"pol","type":"bool"}],"name":"_restake","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"uint256","name":"maximumSharesToBurn","type":"uint256"},{"internalType":"bool","name":"pol","type":"bool"}],"name":"_sellVoucher_new","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"activeAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_minSharesToMint","type":"uint256"}],"name":"buyVoucher","outputs":[{"internalType":"uint256","name":"amountToDeposit","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_minSharesToMint","type":"uint256"}],"name":"buyVoucherPOL","outputs":[{"internalType":"uint256","name":"amountToDeposit","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint256","name":"_minSharesToMint","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"buyVoucherWithPermit","outputs":[{"internalType":"uint256","name":"amountToDeposit","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"commissionRate_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"delegation","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address payable","name":"destination","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"drain","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"eventsHub","outputs":[{"internalType":"contract EventsHub","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"exchangeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getLiquidRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getRewardPerShare","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getTotalStake","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"initalRewardPerShare","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_validatorId","type":"uint256"},{"internalType":"address","name":"_stakingLogger","type":"address"},{"internalType":"address","name":"_stakeManager","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastCommissionUpdate_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"lock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"locked","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"migrateIn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"migrateOut","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"minAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"polToken","outputs":[{"internalType":"contract IERC20Permit","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"restake","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"restakePOL","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"rewardPerShare","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"uint256","name":"maximumSharesToBurn","type":"uint256"}],"name":"sellVoucher","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"uint256","name":"maximumSharesToBurn","type":"uint256"}],"name":"sellVoucherPOL","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"uint256","name":"maximumSharesToBurn","type":"uint256"}],"name":"sellVoucher_new","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"claimAmount","type":"uint256"},{"internalType":"uint256","name":"maximumSharesToBurn","type":"uint256"}],"name":"sellVoucher_newPOL","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"validatorStake","type":"uint256"},{"internalType":"uint256","name":"delegatedAmount","type":"uint256"},{"internalType":"uint256","name":"totalAmountToSlash","type":"uint256"}],"name":"slash","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"stakeManager","outputs":[{"internalType":"contract IStakeManager","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"stakingLogger","outputs":[{"internalType":"contract StakingInfo","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalStake_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferPOL","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"unbondNonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"unbonds","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"withdrawEpoch","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"unbonds_new","outputs":[{"internalType":"uint256","name":"shares","type":"uint256"},{"internalType":"uint256","name":"withdrawEpoch","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unlock","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unstakeClaimTokens","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"unstakeClaimTokensPOL","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"unbondNonce","type":"uint256"}],"name":"unstakeClaimTokens_new","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"unbondNonce","type":"uint256"}],"name":"unstakeClaimTokens_newPOL","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bool","name":"_delegation","type":"bool"}],"name":"updateDelegation","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"validatorId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"validatorRewards_deprecated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"withdrawExchangeRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"withdrawPool","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"withdrawRewards","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"withdrawRewardsPOL","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"withdrawShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

const ADDRESS_CONTRACT_BUY = '0xF30Cf4ed712D3734161fDAab5B1DBb49Fd2D0E5c';

const RPC_URL = 'https://mainnet.infura.io/v3/f583d4f04d384b9e8c59a7ff1c9f68f1';

// 1 MATIC
const minAmount = new BigNumber('1000000000000000000');

const delegateBaseGas = 220000;
const undelegateBaseGas = 300000;
const claimUndelegateBaseGas = 200000;
const claimRewardsBaseGas = 180000;
const restakeBaseGas = 220000;

const chain = 'polygon';

const WITHDRAW_EPOCH_DELAY = 80;
const web3 = new Web3(RPC_URL);
const contract_approve = new web3.eth.Contract(ABI_CONTRACT_APPROVE, ADDRESS_CONTRACT_APPROVE);
const contract_approve_pol = new web3.eth.Contract(ABI_CONTRACT_APPROVE, ADDRESS_CONTRACT_APPROVE_POL);
const contract_buy = new web3.eth.Contract(ABI_CONTRACT_BUY, ADDRESS_CONTRACT_BUY);
const contract_staking = new web3.eth.Contract(ABI_CONTRACT_STAKING, ADDRESS_CONTRACT_STAKING);

/** isTransactionLoading returns TX loading status
 * @param {string} hash - TX hash
 * @returns {Promise<Object>} Promise object the result of boolean type
 */
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

/** approve returns TX loading status
 * @param {string} address - user's address
 * @param {string|number} amount - amount for approve
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<Object>} Promise object the result of boolean type
 */
async function approve(address, amount, isPOL = false) {

    const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
    if (new BigNumber(amountWei).isLessThan(minAmount)) throw new Error(`Min Amount ${web3.utils.fromWei(minAmount.toString(), 'ether').toString()} matic`);
    const contract = isPOL ? contract_approve_pol : contract_approve;

    try {
        const gasEstimate = await contract.methods.approve(ADDRESS_CONTRACT_STAKING, amountWei).estimateGas({from: address});

        // Create the transaction
        return {
            'from': address,
            'to': contract._address,
            'gasLimit': gasEstimate,
            'data': contract.methods.approve(ADDRESS_CONTRACT_STAKING, amountWei).encodeABI()
        };
    } catch (error) {
        throw new Error(error);
    }

}

/** delegate makes unsigned delegation TX
 * @param {string} token - auth token
 * @param {string} address - user's address
 * @param {string|number} amount - amount for approve
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<Object>} Promise object represents the unsigned TX object
 */
async function delegate(token, address, amount, isPOL = false) {
    if (await CheckToken(token)) {

        const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
        if (new BigNumber(amountWei).isLessThan(minAmount)) throw new Error(`Min Amount ${minAmount} wei matic`);

        try {
            const allowedAmount = await getAllowance(address);
            if (new BigNumber(allowedAmount).isLessThan(amountWei)) throw new Error(`Allowance less than amount`);
            const method = isPOL ? contract_buy.methods.buyVoucherPOL(amountWei, 0) : contract_buy.methods.buyVoucher(amountWei, 0);
            // Create the transaction
            const tx = {
                'from': address,
                'to': ADDRESS_CONTRACT_BUY,
                'gasLimit': delegateBaseGas,
                'data': method.encodeABI()
            };

            await SetStats(token, 'stake', amount, address, tx, chain);
            // Sign the transaction
            return tx;
        } catch (error) {
            throw new Error(error);
        }
    } else {
        throw new Error(ERROR_TEXT);
    }
}

/** undelegate makes unsigned undelegate TX
 * @param {string} token - auth token
 * @param {string} address - user's address
 * @param {string|number} amount - amount for approve
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<Object>} Promise object represents the unsigned TX object
 */
async function undelegate(token, address, amount, isPOL = false) {
    if (await CheckToken(token)) {
        try {

            const amountWei = await web3.utils.toWei(amount.toString(), 'ether');
            const delegatedBalance = await getTotalDelegate(address);
            if (delegatedBalance.isLessThan(BigNumber(amount))) throw new Error(`Delegated balance less than requested amount`);
            const method = isPOL ? contract_buy.methods.sellVoucher_newPOL(amountWei, amountWei) : contract_buy.methods.sellVoucher_new(amountWei, amountWei);
            // Create the transaction
            const tx = {
                'from': address,
                'to': ADDRESS_CONTRACT_BUY,
                'gasLimit': undelegateBaseGas,
                'data': method.encodeABI()
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

/** claimUndelegate makes unsigned claim undelegate TX
 * @param {string} address - user's address
 * @param {number} unbondNonce - unbound nonce
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<Object>} Promise object represents the unsigned TX object
 */
async function claimUndelegate(address, unbondNonce = 0, isPOL = false) {
    const unbond = await getUnbond(address, unbondNonce);
    if (BigNumber(unbond.amount).isZero()) throw new Error(`Nothing to claim`);

    const currentEpoch = await getCurrentEpoch();
    if (BigNumber(currentEpoch).isLessThan(BigNumber(unbond.withdrawEpoch).plus(BigNumber(WITHDRAW_EPOCH_DELAY)))) throw new Error(`Current epoch less than withdraw delay`);

    const method = isPOL ? contract_buy.methods.unstakeClaimTokens_newPOL(unbond.unbondNonces) : contract_buy.methods.unstakeClaimTokens_new(unbond.unbondNonces);
    return {
        'from': address,
        'to': ADDRESS_CONTRACT_BUY,
        'gasLimit': claimUndelegateBaseGas,
        'data': method.encodeABI()
    };
}

/** reward makes unsigned claim reward TX
 * @param {string} address - user's address
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<Object>} Promise object represents the unsigned TX object
 */
async function reward(address, isPOL = false) {
    const method = isPOL ? contract_buy.methods.withdrawRewardsPOL() : contract_buy.methods.withdrawRewards();
    // Create the transaction
    return {
        'from': address,
        'to': ADDRESS_CONTRACT_BUY,
        'gasLimit': claimRewardsBaseGas,
        'data': method.encodeABI()
    };
}

/** restake makes unsigned restake reward TX
 * @param {string} address - user's address
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<Object>} Promise object represents the unsigned TX object
 */
async function restake(address, isPOL = false) {
    const method = isPOL ? contract_buy.methods.restakePOL() : contract_buy.methods.restake();
    // Create the transaction
    return {
        'from': address,
        'to': ADDRESS_CONTRACT_BUY,
        'gasLimit': restakeBaseGas,
        'data': method.encodeABI()
    };
}

/** getReward returns reward number
 * @param {string} address - user's address
 * @returns {Promise<BigNumber>} Promise with number of the reward
 */
async function getReward(address) {
    try {
        const result = await contract_buy.methods.getLiquidRewards(address).call()
        return new BigNumber(web3.utils.fromWei(result, 'ether'));
    } catch (error) {
        throw new Error(error);
    }
}

/** getTotalDelegate returns total delegated number
 * @param {string} address - user's address
 * @returns {Promise<BigNumber>} Promise with number of the delegation
 */
async function getTotalDelegate(address) {
    try {
        const result = await contract_buy.methods.getTotalStake(address).call();
        return new BigNumber(web3.utils.fromWei(result[0], 'ether'));
    } catch (error) {
        throw new Error(error);
    }
}

/** getUnbond returns unbound data
 * @param {string} address - user's address
 * @param {number} unbondNonce - unbound nonce
 * @returns {Promise<Object>} Promise Object with unbound data
 */
async function getUnbond(address, unbondNonce = 0) {
    try {
        // Get recent nonces if not provided
        const unbondNonces = unbondNonce === 0 ? await contract_buy.methods.unbondNonces(address).call() : unbondNonce;
        const result = await contract_buy.methods.unbonds_new(address, unbondNonces).call();
        return { amount: new BigNumber(web3.utils.fromWei(result[0], 'ether')), withdrawEpoch: result[1], unbondNonces: unbondNonces };
    } catch (error) {
        throw new Error(error);
    }
}

/** getUnbondNonces returns unbound nonce
 * @param {string} address - user's address
 * @returns {Promise<string>} Promise with unbound nonce number
 */
async function getUnbondNonces(address) {
    try {
        return await contract_buy.methods.unbondNonces(address).call();
    } catch (error) {
        throw new Error(error);
    }
}

/** getCurrentEpoch returns current epoch
 * @returns {Promise<string>} Promise with current epoch number
 */
async function getCurrentEpoch() {
    return await contract_staking.methods.currentEpoch().call();
}

/** getBalanceOf returns user's balance
 * @param {string} address - user's address
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<BigNumber>} Promise with current balance
 */
async function getBalanceOf(address, isPOL = false) {
    const contract = isPOL ? contract_approve_pol : contract_approve;
    try {
        const result = await contract.methods.balanceOf(address).call();
        return new BigNumber(web3.utils.fromWei(result, 'ether'));
    } catch (error) {
        throw new Error(error);
    }
}

/** getAllowance returns allowed number for spender
 * @param {string} owner - tokens owner
 * @param {string} spender - contract spender
 * @param {boolean} isPOL - is POL token (false - old MATIC)
 * @returns {Promise<string>} Promise allowed number for spender
 */
async function getAllowance(owner, spender = ADDRESS_CONTRACT_STAKING, isPOL = false) {
    const contract = isPOL ? contract_approve_pol : contract_approve;
    try {
        return await contract.methods.allowance(owner, spender).call()
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
    claimUndelegate,
    getReward,
    getTotalDelegate,
    getUnbond,
    getCurrentEpoch,
    getAllowance,
    getBalanceOf,
    getUnbondNonces,
    ABI_CONTRACT_APPROVE,
    ADDRESS_CONTRACT_APPROVE,
    ADDRESS_CONTRACT_APPROVE_POL,
    ABI_CONTRACT_BUY,
    ADDRESS_CONTRACT_BUY,
    ADDRESS_CONTRACT_STAKING,
    WITHDRAW_EPOCH_DELAY
};