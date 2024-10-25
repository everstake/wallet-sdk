const {payments, networks, Transaction} = require('bitcoinjs-lib');
const {
    stakingTransaction,
    StakingScriptData,
    unbondingTransaction,
    withdrawEarlyUnbondedTransaction,
    withdrawTimelockUnbondedTransaction
} = require('btc-staking-ts');
const {SetStats} = require("./utils/api");

const chain = 'bitcoin';

const signetNetwork = 'signet'
const mainnetNetwork = 'mainnet'

const LOW_VALUE_UTXO_THRESHOLD = 10000;

class Babylon {
    constructor(network, publicKey, authToken) {
        switch (network) {
            case signetNetwork:
                this.network = networks.testnet
                this.finalityProviderPK = "bf68df67066633cba986c13a14a1edc34171884533ccb27f3ed26c8c93da1e83"
                this.stakingAPI = "https://staking-api.staging.babylonchain.io"
                this.mempoolAPI = "https://mempool.signet.babylonchain.io/signet"
                break
            case mainnetNetwork:
                this.network = networks.bitcoin
                this.finalityProviderPK = "5f61c6a51d91a8cf09f0edfb3d539a8749a0cab2829d52f7c6f028fed7455278"
                this.stakingAPI = "hhttps://staking-api.babylonlabs.io"
                this.mempoolAPI = "https://mempool.babylonlabs.io"
                break
            default:
                throw new Error('Unsupported network');
        }
        this.publicKey = publicKey;
        const {address} = payments.p2tr({
            internalPubkey: this.getPublicKeyNoCoord(),
            network: this.network,
        });
        this.address = address;
        this.token = authToken
    }

    /** stake - make stake tx
     * @param {number} amount  - Amount of stake (sats)
     * @param {number} feeRate - Fee rate
     * @returns {Promise<Object>} Promise with unsigned TX
     */
    async stake(amount, feeRate = 1) {
        const {
            timelockScript,
            unbondingScript,
            slashingScript,
            dataEmbedScript,
            unbondingTimelockScript,
        } = await this.getStakingData()

        const validation = await this.validateAddress(this.address);
        if (!validation.isvalid) {
            throw new Error('Invalid address');
        }

        const allUTXOs = await this.getUTXOsByAddress(this.address);
        const utxos = this.selectUTXOs(allUTXOs, 2, amount, feeRate)
        const filteredUTXOs = utxos.map((utxo) => {
            return {
                txid: utxo.txid,
                vout: utxo.vout,
                value: utxo.value,
                scriptPubKey: validation.scriptPubKey,
            }
        })
        const scripts = {
            timelockScript,
            unbondingScript,
            slashingScript,
            dataEmbedScript
        };
        await SetStats(this.token, 'stake', amount, this.address, '', chain);
        return stakingTransaction(
            scripts,
            amount,
            this.address,
            filteredUTXOs,
            this.network,
            feeRate,
            this.getPublicKeyNoCoord()
        )
    }

    /** unbonding - make unbonding tx
     * @param {string} stakingTxHash  - staking tx hash
     * @param {number} feeRate - Fee rate
     * @returns {Promise<Object>} Promise with unsigned TX
     */
    async unbonding(stakingTxHash, feeRate = 1) {
        const eligible = await this.getUnbondingEligibility(stakingTxHash)
        if (!eligible) {
            throw new Error('Unbonding not eligible');
        }

        const {
            timelockScript,
            unbondingScript,
            slashingScript,
            dataEmbedScript,
            unbondingTimelockScript,
        } = await this.getStakingData()

        const validation = await this.validateAddress(this.address);
        if (!validation.isvalid) {
            throw new Error('Invalid address');
        }

        const delegations = await this.getDelegations()
        const delegation = delegations.data.find(e => e.staking_tx_hash_hex === stakingTxHash)
        if (delegation === undefined) {
            throw new Error('delegation ' + stakingTxHash + ' not found');
        }

        const script = {
            unbondingScript,
            unbondingTimelockScript,
            timelockScript,
            slashingScript,
        }
        await SetStats(this.token, 'unbond', amount, this.address, '', chain);
        return unbondingTransaction(
            script,
            Transaction.fromHex(delegation.staking_tx.tx_hex),
            globalParams.unbonding_fee,
            this.network,
            delegation.staking_tx.output_index,
        );
    }

    /** withdrawEarlyUnbonded - make withdrawal tx
     * @param {string} stakingTxHash  - staking tx hash
     * @param {number} feeRate - Fee rate
     * @returns {Promise<Object>} Promise with unsigned TX
     */
    async withdrawEarlyUnbonded(stakingTxHash, feeRate = 1) {
        const {
            timelockScript,
            unbondingScript,
            slashingScript,
            dataEmbedScript,
            unbondingTimelockScript,
        } = this.getStakingData();

        const scripts = {
            unbondingTimelockScript,
            slashingScript,
        }

        const delegations = await this.getDelegations()
        const delegation = delegations.data.find(e => e.staking_tx_hash_hex === stakingTxHash)
        if (delegation === undefined) {
            throw new Error('delegation ' + stakingTxHash + ' not found');
        }

        await SetStats(this.token, 'withdraw', amount, this.address, '', chain);
        return withdrawEarlyUnbondedTransaction(
            scripts,
            Transaction.fromHex(delegation.unbonding_tx.tx_hex),
            this.address,
            this.network,
            feeRate,
        );
    }

    /** withdrawTimelockUnbonded - make withdrawal tx
     * @param {string} stakingTxHash  - staking tx hash
     * @param {number} feeRate - Fee rate
     * @returns {Promise<Object>} Promise with unsigned TX
     */
    async withdrawTimelockUnbonded(stakingTxHash, feeRate = 1) {
        const {
            timelockScript,
            unbondingScript,
            slashingScript,
            dataEmbedScript,
            unbondingTimelockScript,
        } = this.getStakingData();

        const scripts = {
            timelockScript,
            slashingScript,
            unbondingScript,
        }

        const delegations = await this.getDelegations()
        const delegation = delegations.data.find(e => e.staking_tx_hash_hex === stakingTxHash)
        if (delegation === undefined) {
            throw new Error('delegation ' + stakingTxHash + ' not found');
        }

        await SetStats(this.token, 'withdraw', amount, this.address, '', chain);
        return withdrawTimelockUnbondedTransaction(
            scripts,
            Transaction.fromHex(delegation.staking_tx.tx_hex),
            this.address,
            this.network,
            feeRate,
            delegation.staking_tx.output_index,
        );
    }

    /** getStakingData - returns prepared data to create staking txs
     * @returns {Promise<Object>} Promise with staking Data
     */
    async getStakingData() {
        const height = await this.getLatestHeight();
        const globalParamsVersions = await this.getGlobalParamsVersions();
        const globalParams = this.getCurrentGlobalParamsVersion(+height, globalParamsVersions);

        const covenantPks = globalParams.covenant_pks.map((pk) => Buffer.from(pk, "hex").subarray(1, 33));
        const magicBytes = Buffer.from(globalParams.tag, 'hex');
        const stakingTime = globalParams.max_staking_time;

        const stakingScriptData = new StakingScriptData(
            this.getPublicKeyNoCoord(),
            [Buffer.from(this.finalityProviderPK, 'hex')],
            covenantPks,
            globalParams.covenant_quorum,
            stakingTime,
            globalParams.unbonding_time,
            magicBytes,
        );
        return stakingScriptData.buildScripts();
    }

    /** getDelegations - return list of delegations
     * @param {string} paginationKey  - key need to pagination
     * @returns {Promise<Object>} Promise with a list of delegations
     */
    async getDelegations(paginationKey = '') {
        const url = this.stakingAPI + '/v1/staker/delegations?pagination_key=' + paginationKey + '&staker_btc_pk=' + this.getPublicKeyNoCoord().toString('hex');
        const response = await fetch(url);
        return await response.json();
    }

    getCurrentGlobalParamsVersion(height, versionedParams) {
        if (!versionedParams.length) {
            throw new Error("No global params versions found");
        }
        const sorted = [...versionedParams].sort(
            (a, b) => b.activation_height - a.activation_height,
        );

        for (let i = 0; i < sorted.length; i++) {
            const curr = sorted[i];
            let isApprochingNextVersion = false;
            let nextVersion;
            // Check if the current version is active at the given height
            if (curr.activation_height <= height) {
                // Check if the next version is approaching
                if (sorted[i - 1]) {
                    // Return the current version and whether the next version is approaching
                    if (sorted[i - 1].activation_height <= height + curr.confirmation_depth) {
                        isApprochingNextVersion = true;
                    }
                    nextVersion = sorted[i - 1];
                }
                // Return the current version if the next version is not approaching
                return curr
            }
        }
    }

    /** getGlobalParamsVersions - return list of global param versions
     * @returns {Promise<Object>} Promise with global versions
     */
    async getGlobalParamsVersions() {
        const response = await fetch(this.stakingAPI + '/v1/global-params');
        const params = await response.json();
        return params.data.versions
    }

    async getUTXOsByAddress() {
        const url = this.mempoolAPI + '/api/address/' + this.address + '/utxo';
        const response = await fetch(url);
        return await response.json();
    }

    /** validateAddress - stake address
     * @param {string} address  - bitcoin address
     * @returns {Promise<Object>} Promise with a validation result
     */
    async validateAddress(address) {
        const url = this.mempoolAPI + '/api/v1/validate-address/' + this.address;
        const response = await fetch(url);
        return await response.json();
    }

    getPublicKeyNoCoord() {
        return this.publicKey.subarray(1, 33);
    }

    selectUTXOs(utxos, outputNumber, amountNeeded, feeRate) {
        // Sort UTXOs by value (ascending)
        utxos.sort((a, b) => a.value - b.value);

        let selectedUtxos = [];
        let totalSelected = 0;

        // Accumulate UTXOs until we have enough to cover the amount + fees
        for (const utxo of utxos) {
            // 10k sats or less has less economic value which will add more cost to the transaction due to fees
            if (utxo.value < LOW_VALUE_UTXO_THRESHOLD) {
                continue;
            }
            selectedUtxos.push(utxo);
            totalSelected += utxo.value;

            const transactionSize = (selectedUtxos.length * 180) + (outputNumber * 34) + 10 + selectedUtxos.length + 40;
            const fee = transactionSize * feeRate;

            if (totalSelected >= amountNeeded + fee) {
                return selectedUtxos
            }
        }
        throw new Error('Insufficient UTXOs to cover the amount + fees');
    }

    async getLatestHeight() {
        const url = this.mempoolAPI + '/api/blocks/tip/height';
        const response = await fetch(url);
        return await response.text();
    }

    async getUnbondingEligibility(txHash) {
        const url = this.stakingAPI + '/v1/unbonding/eligibility?staking_tx_hash_hex=' + txHash;
        const response = await fetch(url);
        return response.status === 200;
    }

    /** sendUnbondingTx - send payload to unbond stake
     * @param {Object} payload  - unbonding payload data
     * @returns {Promise<Object>} Promise with unbonding result
     */
    async sendUnbondingTx(payload) {
        const response = await fetch(this.stakingAPI + '/v1/unbonding', {
            method: "POST",
            body: JSON.stringify(payload),
        });
        if (response.status !== 202) {
            const text = await response.text();
            throw new Error(`send Unbonding Tx failed. [status: ${response.status}] : ${text}]`);
        }
    }

    getStakingTerm(params, term) {
        let termWithFixed;
        if (params && params.min_staking_time === params.max_staking_time) {
            // if term is fixed, use the API value
            termWithFixed = params.min_staking_time;
        } else {
            // if term is not fixed, use the term from the input
            termWithFixed = term;
        }
        return termWithFixed;
    }
}


module.exports = {
    signetNetwork,
    mainnetNetwork,
    Babylon,
}