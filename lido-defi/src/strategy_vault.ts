/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';
import {
  BigNumberish,
  JsonRpcProvider,
  parseEther,
  formatEther,
  AbiCoder,
} from 'ethers';
import {
  DepositQueue,
  DepositQueue__factory,
  LazyOracle,
  LazyOracle__factory,
  Lido,
  Lido__factory,
  RedeemQueue,
  RedeemQueue__factory,
  ShareManager,
  ShareManager__factory,
  StvPool,
  StvPool__factory,
  VaultHub,
  VaultHub__factory,
  Wrapper,
  Wrapper__factory,
} from './typechain-types';
import { Blockchain } from '../../utils';
import { minBN, maxBN } from './utils';

import { NETWORK_ADDRESSES } from './constants';
import { ERROR_MESSAGES, ORIGINAL_ERROR_MESSAGES } from './constants/errors';
import type {
  VaultType,
  EthTransaction,
  PendingDepositRequest,
  ReportData,
  BalanceData,
} from './types';

export class StrategyVault extends Blockchain {
  public addressVault!: string;
  public addressOracle!: string;

  public contractVault!: StvPool;
  public contractLido!: Lido;
  public contractOracle!: LazyOracle;
  public contractVaultHub!: VaultHub;
  public contractWrapper!: Wrapper;
  public contractDepositQueue!: DepositQueue;
  public contractRedeemQueue!: RedeemQueue;
  public contractShareManager!: ShareManager;

  private rpc!: JsonRpcProvider;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = ORIGINAL_ERROR_MESSAGES;

  constructor(network: VaultType = 'mainnet', url?: string) {
    super();
    this.initializeNetwork(network, url);
  }

  public selectNetwork(network: VaultType, url?: string) {
    this.initializeNetwork(network, url);
  }

  private initializeNetwork(network: VaultType, url?: string): void {
    const networkAddresses = NETWORK_ADDRESSES[network];

    if (!networkAddresses) {
      this.throwError('NETWORK_NOT_SUPPORTED', network);
    }
    const providerUrl = url ?? networkAddresses.rpcUrl;
    this.rpc = new JsonRpcProvider(providerUrl);

    this.addressVault = networkAddresses.addressVault;
    this.addressOracle = networkAddresses.addressOracle;

    this.contractVault = StvPool__factory.connect(
      networkAddresses.addressVault,
      this.rpc,
    );
    this.contractLido = Lido__factory.connect(
      networkAddresses.addressLido,
      this.rpc,
    );
    this.contractOracle = LazyOracle__factory.connect(
      networkAddresses.addressOracle,
      this.rpc,
    );
    this.contractVaultHub = VaultHub__factory.connect(
      networkAddresses.addressVaultHub,
      this.rpc,
    );
    this.contractWrapper = Wrapper__factory.connect(
      networkAddresses.addressWrapper,
      this.rpc,
    );
    this.contractDepositQueue = DepositQueue__factory.connect(
      networkAddresses.addressDepositQueue,
      this.rpc,
    );
    this.contractRedeemQueue = RedeemQueue__factory.connect(
      networkAddresses.addressRedeemQueue,
      this.rpc,
    );
    this.contractShareManager = ShareManager__factory.connect(
      networkAddresses.addressShareManager,
      this.rpc,
    );
  }

  // onchain oracle report state
  private getLatestReportData(): Promise<ReportData> {
    return this.contractOracle.latestReportData();
  }

  /**
   * Updates the oracle report data on-chain.
   * Fetches the latest report from IPFS, finds the vault's data, and generates a Merkle proof.
   *
   * @param sender - User address initiating the transaction
   * @returns unsigned ETH transaction object for updateVaultData.
   */
  private async updateReportTx(
    sender: string,
    reportCid?: string,
  ): Promise<EthTransaction> {
    if (!this.isAddress(sender)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      if (!reportCid) {
        const info = await this.getLatestReportData();
        reportCid = info.reportCid;
      }
      const url = `https://ipfs.io/ipfs/${reportCid}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch report from IPFS: ${response.statusText}`,
        );
      }
      const report = await response.json();

      if (report.format !== 'standard-v1') {
        throw new Error(`Unsupported report format: ${report.format}`);
      }

      const vaultLower = this.contractVault.target.toString().toLowerCase();
      const vaultEntry = report.values.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (v: any) => v.value[0].toLowerCase() === vaultLower,
      );

      if (!vaultEntry) {
        throw new Error(
          `Vault ${this.contractVault.target} not found in report`,
        );
      }

      const proof = this.merkleProof(report.tree, vaultEntry.treeIndex);

      const populatedTx =
        await this.contractOracle.updateVaultData.populateTransaction(
          vaultEntry.value[0],
          vaultEntry.value[1],
          vaultEntry.value[2],
          vaultEntry.value[3],
          vaultEntry.value[4],
          vaultEntry.value[5],
          proof,
        );

      const gasConsumption = await this.rpc.estimateGas({
        ...populatedTx,
        from: sender,
      });

      return {
        from: sender,
        to: await this.contractOracle.getAddress(),
        value: 0n,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: populatedTx.data,
      };
    } catch (error) {
      throw this.handleError(
        'StrategyVault: oracle report update failed',
        error,
      );
    }
  }

  private merkleProof(tree: string[], leafIndex: number): string[] {
    const proof: string[] = [];
    let i = leafIndex;
    while (i > 0) {
      const sibling = i % 2 === 1 ? i + 1 : i - 1;
      const node = tree[sibling];
      if (node !== undefined) {
        proof.push(node);
      }
      i = Math.floor((i - 1) / 2);
    }

    return proof;
  }

  /**
   * Prepares the report transaction if needed
   *
   * @param sender - User address initiating the transaction
   * @returns unsigned ETH transaction object for updateVaultData or undefined if no need to update report.
   */
  public async prepareReportTx(
    sender: string,
  ): Promise<EthTransaction | undefined> {
    const isFresh = await this.contractVaultHub.isReportFresh(
      this.contractVault.target,
    );
    if (isFresh) {
      return;
    }

    return this.updateReportTx(sender);
  }

  /**
   * Fetches the user's detailed balance data from the strategy pool.
   *
   * @param address - The user's wallet address.
   * @returns A Promise that resolves to the BalanceData.
   */
  public async balance(address: string): Promise<BalanceData> {
    if (!this.isAddress(address)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    // ── Phase 1: Base state + Mellow contract addresses ───────────────────────
    // stethSharesOnBalance   = wstETH returned from strategy vault to proxy
    // totalMintedStethShares = stETH shares minted as user liability
    // strategyProxyAddress   = per-user proxy that holds funds on behalf of strategy
    // queue/manager addresses are stored in the vault contract itself
    const [stethSharesOnBalance, totalMintedStethShares, strategyProxyAddress] =
      await Promise.all([
        this.contractVault.wstethOf(address),
        this.contractVault.mintedStethSharesOf(address),
        this.contractVault.getStrategyCallForwarderAddress(address),
      ]);

    const MAX_UINT128 = 2n ** 128n - 1n;

    // ── Phase 2: Mellow earn-position data  ─────────────────────────────────
    const [
      depositRequest,
      claimableDepositInEarnShares,
      withdrawalRequests,
      balanceInEarnShares,
    ] = await Promise.all([
      this.contractDepositQueue.requestOf(strategyProxyAddress),
      this.contractDepositQueue.claimableOf(strategyProxyAddress),
      this.contractRedeemQueue.requestsOf(
        strategyProxyAddress,
        0n,
        MAX_UINT128,
      ),
      this.contractShareManager.balanceOf(strategyProxyAddress),
    ]);

    // depositRequest[0] = timestamp, depositRequest[1] = depositsInWsteth
    const depositsInWsteth = depositRequest[1];
    // if there is already a claimable deposit, the pending request is no longer in-flight
    const pendingDepositsInWsteth =
      claimableDepositInEarnShares > 0n ? 0n : depositsInWsteth;

    // preview Mellow LP shares → wstETH for vault balance and claimable deposit
    const [[, balanceInWsteth], [, claimableDepositInWsteth]] =
      await Promise.all([
        balanceInEarnShares > 0n
          ? this.contractVault.previewRedeem(balanceInEarnShares)
          : Promise.resolve([false, 0n] as [boolean, bigint]),
        claimableDepositInEarnShares > 0n
          ? this.contractVault.previewRedeem(claimableDepositInEarnShares)
          : Promise.resolve([false, 0n] as [boolean, bigint]),
      ]);

    // preview non-claimable withdrawal requests to get pending wstETH amount
    const previewedAssets = await Promise.all(
      withdrawalRequests.map(async (req) => {
        if (req.isClaimable) return req.assets;

        const [, preview] = await this.contractVault.previewRedeem(req.shares);

        return preview;
      }),
    );

    const pendingWithdrawalsInWsteth = previewedAssets.reduce(
      (acc, a) => acc + a,
      0n,
    );

    // these 3 values map to the params passed from use-earn-position → use-strategy-position
    const strategyDepositStethSharesOffset = pendingDepositsInWsteth;
    const strategyStethSharesBalance =
      balanceInWsteth + claimableDepositInWsteth;
    const strategyWithdrawalStethSharesOffset = pendingWithdrawalsInWsteth;

    // ── Phase 3: Liability / delegated shares arithmetic ──────────────────────
    // Total stETH shares the strategy claims to have (delegated + pending)
    const totalStrategyBalanceInStethShares =
      strategyDepositStethSharesOffset +
      strategyStethSharesBalance +
      strategyWithdrawalStethSharesOffset;

    // Signed difference: positive = profit, negative = loss
    const totalStethSharesDifference =
      totalStrategyBalanceInStethShares +
      stethSharesOnBalance -
      totalMintedStethShares;

    // Delegated shares = minted on behalf of user but not yet returned to proxy
    const totalStethSharesDelegated = maxBN(
      totalMintedStethShares - stethSharesOnBalance,
      0n,
    );

    // Vault shares that can be withdrawn to repay the delegated liability
    const totalStethSharesAvailableForReturn = minBN(
      strategyStethSharesBalance,
      totalStethSharesDelegated,
    );

    // Vault shares above delegated repayment (profit component)
    const strategyStethSharesExcess =
      strategyStethSharesBalance - totalStethSharesAvailableForReturn;

    // Pending return: withdrawal offset + any excess still in vault
    const stethSharesToRepayPendingFromStrategyVault = maxBN(
      strategyWithdrawalStethSharesOffset + strategyStethSharesExcess,
      0n,
    );

    // Shares that must be repaid from proxy-returned balance to unlock user ETH
    const stethSharesLiabilityToCover = maxBN(
      totalMintedStethShares - totalStrategyBalanceInStethShares,
      0n,
    );

    // How much of that liability can be covered by the returned balance
    const stethSharesToRepay = minBN(
      stethSharesOnBalance,
      stethSharesLiabilityToCover,
    );

    // ── Phase 4: Fetch share rate + wrapper reads in parallel ──────────────────
    // Mirrors LidoSDKShares.convertBatchSharesToSteth: fetch totalSupply once,
    // then do all shares↔eth conversions as local integer math.
    const absDiff =
      totalStethSharesDifference < 0n
        ? -totalStethSharesDifference
        : totalStethSharesDifference;

    const [
      proxyBalanceStvInEth,
      proxyUnlockedBalanceStvInEth,
      totalStethLiabilityInEth,
      totalStethSharesAvailableForReturnInEth,
      pendingUnlockFromStrategyVaultInEth,
      strategyDepositOffsetInLockedEth,
      totalShares,
      totalEther,
    ] = await Promise.all([
      this.contractWrapper.assetsOf(strategyProxyAddress),
      this.contractWrapper['unlockedAssetsOf(address,uint256)'](
        strategyProxyAddress,
        0n,
      ),
      this.contractWrapper.calcAssetsToLockForStethShares(
        totalMintedStethShares,
      ),
      this.contractWrapper.calcAssetsToLockForStethShares(
        totalStethSharesAvailableForReturn,
      ),
      this.contractWrapper.calcAssetsToLockForStethShares(
        stethSharesToRepayPendingFromStrategyVault,
      ),
      this.contractWrapper.calcAssetsToLockForStethShares(
        strategyDepositStethSharesOffset,
      ),
      this.contractLido.getTotalShares(),
      this.contractLido.getTotalPooledEther(),
    ]);

    // Off-chain replicas of StETH.getPooledEthByShares / getSharesByPooledEth
    const sharesToEth = (s: bigint) => (s * totalEther) / totalShares;
    const ethToShares = (e: bigint) => (e * totalShares) / totalEther;

    const strategyVaultStethExcess = sharesToEth(strategyStethSharesExcess);

    // Restore sign for profit/loss
    const totalStethDifference =
      totalStethSharesDifference < 0n
        ? -sharesToEth(absDiff)
        : sharesToEth(absDiff);

    // Mirrors: shares.convertToShares(await shares.convertToSteth(stethSharesToRepay))
    // StvStETHPool.sol:StvStETHPool.burnWsteth
    const stethSharesRepaidAfterWstethUnwrap = ethToShares(
      sharesToEth(stethSharesToRepay),
    );

    // Shares that will be rebalanced from locked ETH (cannot be repaid)
    const stethSharesToRebalance =
      stethSharesLiabilityToCover - stethSharesRepaidAfterWstethUnwrap;

    const withdrawableEthAfterRepay = await this.contractWrapper[
      'unlockedAssetsOf(address,uint256)'
    ](strategyProxyAddress, stethSharesRepaidAfterWstethUnwrap);

    const stethToRebalance = sharesToEth(stethSharesToRebalance);

    // ── Final calculations ───────────────────────────────────────────────────────

    // ETH currently locked to cover liability (capped by available proxy balance)
    const totalLockedEth = minBN(
      totalStethLiabilityInEth,
      proxyBalanceStvInEth - proxyUnlockedBalanceStvInEth,
    );

    // Total value = locked ETH + stETH profit/loss from delegation
    const totalUserValueInEth = proxyBalanceStvInEth + totalStethDifference;

    // Max ETH withdrawable from strategy vault (return delegated + excess profit)
    const totalEthToWithdrawFromStrategyVault =
      totalStethSharesAvailableForReturnInEth + strategyVaultStethExcess;

    // ETH release from proxy after repayment (already-unlocked, net of rebalancing)
    const totalEthToWithdrawFromProxy = maxBN(
      withdrawableEthAfterRepay - stethToRebalance,
      0n,
    );

    // Value still pending inside strategy vault (capped by locked ETH + excess)
    const totalValuePendingFromStrategyVaultInEth =
      minBN(pendingUnlockFromStrategyVaultInEth, totalLockedEth) +
      strategyVaultStethExcess;

    // ETH missing from locked to cover total liability; 0 when position is healthy
    const assetShortfallInEth = totalStethLiabilityInEth - totalLockedEth;

    return {
      proxyUnlockedBalanceEth: formatEther(proxyUnlockedBalanceStvInEth),
      totalUserValueInEth: formatEther(totalUserValueInEth),
      processableEth: formatEther(totalEthToWithdrawFromProxy),
      availableEth: formatEther(totalEthToWithdrawFromStrategyVault),
      pendingEth: formatEther(totalValuePendingFromStrategyVaultInEth),
      pendingDepositsEth: formatEther(strategyDepositOffsetInLockedEth),
      assetShortfallInEth: formatEther(assetShortfallInEth),
    };
  }

  /**
   * Deposits ETH to the strategy pool
   *
   * @param address - User address
   * @param amount - Deposit amount in ETH
   * @param referral - Optional referral address
   * @param wstethToMint - Minimum wstETH to mint (0 for default)
   * @param isSync - Whether to use the sync deposit queue or async deposit queue // TODO: Mellow params?
   * @param merkleProof - Optional Merkle proof for allowlist-enabled queues // TODO: Mellow params?
   *
   * @returns unsigned ETH transaction object.
   */
  public async deposit(
    address: string,
    amount: BigNumberish,
    isSync: boolean = false,
    merkleProof: string[] = [],
    referral: string = '0x0000000000000000000000000000000000000000',
  ): Promise<EthTransaction> {
    if (!this.isAddress(address) || !this.isAddress(referral)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    const amountWei = parseEther(amount.toString());

    const params = AbiCoder.defaultAbiCoder().encode(
      ['bool', 'bytes32[]'],
      [isSync, merkleProof],
    );

    try {
      const supplyParamsTuple = {
        isSync: isSync,
        merkleProof: merkleProof,
      };

      const previewResult = await this.contractVault.previewSupply(
        amountWei,
        address,
        supplyParamsTuple,
      );

      if (!previewResult.success || previewResult.shares.toString() === '0') {
        throw new Error(
          'Supply simulation failed: previewSupply returned false or 0 shares',
        );
      }

      const expectedShares = previewResult.shares;

      const capacityShares =
        await this.contractVault.remainingMintingCapacitySharesOf(
          address,
          amountWei,
        );

      const maxMintShares =
        expectedShares < capacityShares ? expectedShares : capacityShares;

      const populatedTx = await this.contractVault.supply.populateTransaction(
        referral,
        maxMintShares,
        params,
      );

      const gasConsumption = await this.rpc.estimateGas({
        ...populatedTx,
        from: address,
        value: amountWei,
      });

      return {
        from: address,
        to: this.addressVault,
        value: amountWei,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: populatedTx.data,
      };
    } catch (error) {
      throw this.handleError('DEPOSIT_ERROR', error);
    }
  }

  /**
   * Requests withdrawal from the strategy pool
   *
   * @param address - User address initiating the transaction
   * @param recipient - Recipient address of the withdrawal
   * @param stvToWithdraw - Amount of STV to withdraw
   * @param stethSharesToRebalance - Shares to rebalance in case of large strategy exits
   *
   * @returns unsigned ETH transaction object.
   */
  public async withdraw(
    address: string,
    recipient: string,
    stvToWithdraw: BigNumberish,
    stethSharesToRebalance: BigNumberish = '0',
  ): Promise<EthTransaction> {
    if (!this.isAddress(address) || !this.isAddress(recipient)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const populatedTx =
        await this.contractVault.requestWithdrawalFromPool.populateTransaction(
          recipient,
          stvToWithdraw.toString(),
          stethSharesToRebalance.toString(),
        );

      const gasConsumption = await this.rpc.estimateGas({
        ...populatedTx,
        from: address,
      });

      return {
        from: address,
        to: this.addressVault,
        value: 0n,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: populatedTx.data,
      };
    } catch (error) {
      throw this.handleError('WITHDRAW_ERROR', error);
    }
  }

  /**
   * Fetches the user's pending deposit requests
   *
   * @param address - User address
   * @returns A Promise that resolves to the user's PendingDepositRequest
   */
  public async pendingDepositRequests(
    address: string,
  ): Promise<PendingDepositRequest> {
    try {
      if (!this.isAddress(address)) {
        this.throwError('ADDRESS_FORMAT_ERROR');
      }
      const result = await this.contractVault.pendingDepositRequests(address);

      return {
        assets: result.assets.toString(),
        timestamp: result.timestamp.toString(),
        isClaimable: Boolean(result.isClaimable),
      };
    } catch (error) {
      throw this.handleError('PENDING_DEPOSIT_REQUESTS_ERROR', error);
    }
  }

  /**
   * Claims shares from the strategy pool.
   *
   * @param sender - User address initiating the transaction
   *
   * @returns unsigned ETH transaction object.
   */
  public async claim(sender: string): Promise<EthTransaction> {
    if (!this.isAddress(sender)) {
      this.throwError('ADDRESS_FORMAT_ERROR');
    }

    try {
      const populatedTx =
        await this.contractVault.claimShares.populateTransaction();

      const gasConsumption = await this.rpc.estimateGas({
        ...populatedTx,
        from: sender,
      });

      return {
        from: sender,
        to: this.addressVault,
        value: 0n,
        gasLimit: this.calculateGasLimit(gasConsumption),
        data: populatedTx.data,
      };
    } catch (error) {
      throw this.handleError('CLAIM_ERROR', error);
    }
  }

  private fromWeiToEther(amount: string | number | bigint): BigNumber {
    return new BigNumber(formatEther(amount));
  }

  private calculateGasLimit(gasConsumption: bigint): number {
    return new BigNumber(gasConsumption.toString())
      .plus(new BigNumber(220000)) // ETH_GAS_RESERVE fallback
      .toNumber();
  }

  private isAddress(address: string): boolean {
    return /^(0x)?([0-9a-f]{40})$/.test(address.toLowerCase());
  }
}
