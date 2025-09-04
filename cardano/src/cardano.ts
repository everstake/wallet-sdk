import { Blockchain } from '../../utils';
import { BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
  ERROR_MESSAGES,
  MAINNET_DREP,
  POOLS_LIST_URL,
  PREPROD_DREP,
  PREVIEW_DREP,
} from './constants';
import { Network, StakeActivation } from './types';
import { components } from '@blockfrost/openapi';
import { PaginationOptions } from '@blockfrost/blockfrost-js/lib/types';

import {
  BlockfrostProvider,
  DRep,
  MeshTxBuilder,
  MeshWallet,
} from '@meshsdk/core';

/**
 * The `Cardano` class extends the `Blockchain` class and provides methods for
 * interacting with the Cardano network and BLOCKFROST API.
 *
 * @property network - specified cardano network.
 * @property provider - blockfrost API provider according to network.
 * @property wallet - cardano MeshJS Wallet instance.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Ethereum class.
 *
 */
export class Cardano extends Blockchain {
  private readonly network: Network;
  private pool: components['schemas']['pool'] | undefined;

  public provider: BlockfrostProvider;
  private wallet: MeshWallet;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(
    network: Network,
    baseAddress: string,
    blockfrostProjectID: string,
  ) {
    super();
    this.network = network;
    this.provider = new BlockfrostProvider(blockfrostProjectID);
    this.wallet = new MeshWallet({
      networkId: network === 'mainnet' ? 1 : 0,
      fetcher: this.provider,
      submitter: this.provider,
      key: { type: 'address', address: baseAddress },
    });
  }

  /**
   * init method must be called after the instance is created.
   *
   * @returns Promise void
   */
  public async init() {
    await this.wallet.init();
  }

  /**
   * getStakeInfo gets info about stake using payment account. Info fetches
   * from BLOCKFROST API.
   *
   * @returns Promise with stake info or undefined if account is empty
   */
  public async getStakeInfo(): Promise<
    components['schemas']['account_content'] | undefined
  > {
    try {
      return await this.provider.get(
        '/accounts/' + this.wallet.addresses.rewardAddressBech32,
      );
    } catch (error) {
      if (error instanceof BlockfrostServerError && error.status_code === 404) {
        return undefined;
      }
      throw this.handleError('BLOCKFROST_STAKING_INFO', error);
    }
  }

  /**
   * stakeTx it is universal method which includes register stake account, delegation
   * and voting for DRep in one Tx. DRep is optional, constant by default.
   *
   * @returns Promise with encoded hex data.
   */
  public async stakeTx(dRepID?: DRep): Promise<string> {
    if (!this.wallet.addresses.baseAddressBech32) {
      throw this.throwError('INIT');
    }
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    const stakeInfo = await this.getStakeInfo();
    if (!stakeInfo) {
      throw this.throwError('BLOCKFROST_STAKING_INFO');
    }

    if (stakeInfo.pool_id !== null) {
      throw this.throwError('ALREADY_STAKED');
    }

    const txBuilder = new MeshTxBuilder({
      fetcher: this.provider,
      verbose: true,
    });

    if (!stakeInfo.active) {
      txBuilder.registerStakeCertificate(
        this.wallet.addresses.rewardAddressBech32,
      );
    }

    if (!stakeInfo.drep_id) {
      txBuilder.voteDelegationCertificate(
        dRepID == undefined ? { dRepId: this.getDRep() } : dRepID,
        this.wallet.addresses.rewardAddressBech32,
      );
    }

    const utxos = await this.wallet.getUtxos();
    const pool = await this.selectPool();

    return await txBuilder
      .delegateStakeCertificate(
        this.wallet.addresses.rewardAddressBech32,
        pool.pool_id,
      )
      .selectUtxosFrom(utxos)
      .changeAddress(this.wallet.addresses.baseAddressBech32)
      .complete();
  }

  /**
   * delegateTx make a new unsigned transaction that contains delegation.
   * It can be used for redelegation.
   *
   * @returns Promise with encoded hex data.
   */
  public async delegateTx(): Promise<string> {
    if (!this.wallet.addresses.baseAddressBech32) {
      throw this.throwError('INIT');
    }
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    const txBuilder = new MeshTxBuilder({
      fetcher: this.provider,
      verbose: true,
    });

    const utxos = await this.wallet.getUtxos();
    const pool = await this.selectPool();

    return await txBuilder
      .delegateStakeCertificate(
        this.wallet.addresses.rewardAddressBech32,
        pool.pool_id,
      )
      .selectUtxosFrom(utxos)
      .changeAddress(this.wallet.addresses.baseAddressBech32)
      .complete();
  }

  /**
   * voteDRep make a new unsigned transaction that vote for DRep.
   *
   * @returns Promise with encoded hex data.
   */
  public async voteDRep(dRepID: DRep): Promise<string> {
    if (!this.wallet.addresses.baseAddressBech32) {
      throw this.throwError('INIT');
    }
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    const txBuilder = new MeshTxBuilder({
      fetcher: this.provider,
      verbose: true,
    });

    const utxos = await this.wallet.getUtxos();

    return await txBuilder
      .voteDelegationCertificate(
        dRepID,
        this.wallet.addresses.rewardAddressBech32,
      )
      .selectUtxosFrom(utxos)
      .changeAddress(this.wallet.addresses.baseAddressBech32)
      .complete();
  }

  /**
   * delegateTx make a new unsigned transaction that contains registration.
   *
   * @returns Promise with encoded hex data.
   */
  public async registerTx(): Promise<string> {
    if (!this.wallet.addresses.baseAddressBech32) {
      throw this.throwError('INIT');
    }
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    const txBuilder = new MeshTxBuilder({
      fetcher: this.provider,
      verbose: true,
    });

    const utxos = await this.wallet.getUtxos();

    return await txBuilder
      .registerStakeCertificate(this.wallet.addresses.rewardAddressBech32)
      .selectUtxosFrom(utxos)
      .changeAddress(this.wallet.addresses.baseAddressBech32)
      .complete();
  }

  /**
   * delegateTx make a new unsigned transaction that contains stake deregister.
   * This tx returns 2 deposit ADA and returns all stake and claim rewards to payment address.
   *
   * @returns Promise with encoded hex data
   */
  public async deregisterTx(): Promise<string> {
    if (!this.wallet.addresses.baseAddressBech32) {
      throw this.throwError('INIT');
    }
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    const txBuilder = new MeshTxBuilder({
      fetcher: this.provider,
      verbose: true,
    });

    const utxos = await this.wallet.getUtxos();

    return await txBuilder
      .deregisterStakeCertificate(this.wallet.addresses.rewardAddressBech32)
      .selectUtxosFrom(utxos)
      .changeAddress(this.wallet.addresses.baseAddressBech32)
      .complete();
  }

  /**
   * withdrawRewardsTx make a new unsigned transaction that claim rewards.
   * Cardano has auto compound so no need to claim rewards to increase APR. It should be call when need to spend it.
   *
   * @returns Promise with encoded hex data
   */
  public async withdrawRewardsTx(): Promise<string> {
    if (!this.wallet.addresses.baseAddressBech32) {
      throw this.throwError('INIT');
    }
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    const stakeInfo = await this.getStakeInfo();
    if (stakeInfo === undefined) {
      throw this.throwError('NO_BLOCKFROST_DELEGATION_FOUND');
    }
    if (stakeInfo?.rewards_sum === undefined) {
      throw this.throwError('NO_REWARDS_YET');
    }

    const unclaimed =
      BigInt(stakeInfo.rewards_sum) - BigInt(stakeInfo.withdrawals_sum);
    if (unclaimed <= 0n) {
      throw this.throwError('NO_REWARDS_YET');
    }

    const txBuilder = new MeshTxBuilder({
      fetcher: this.provider,
      verbose: true,
    });

    const utxos = await this.wallet.getUtxos();

    return await txBuilder
      .withdrawal(
        this.wallet.addresses.rewardAddressBech32,
        unclaimed.toString(),
      )
      .selectUtxosFrom(utxos)
      .changeAddress(this.wallet.addresses.baseAddressBech32)
      .complete();
  }

  /**
   * getRewardHistory gets rewards history using current payment account and
   * according staking address. Info fetches from BLOCKFROST API.
   *
   * @param pagination - optional params for ordering and pagination
   *
   * @returns Promise with stake reward history
   */
  public async getRewardHistory(
    pagination: PaginationOptions,
  ): Promise<components['schemas']['account_reward_content']> {
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
    const stakingAddress: string = this.wallet.addresses.rewardAddressBech32;

    const url =
      '/accounts/' +
      stakingAddress +
      '/rewards?' +
      this.paginationToQuery(pagination);

    try {
      return this.provider.get(url);
    } catch (error) {
      throw this.handleError('BLOCKFROST_API', error);
    }
  }

  /**
   * getDelegations gets delegations history using current payment account and
   * according staking address. Info fetches from BLOCKFROST API.
   *
   * @returns Promise with delegations history
   */
  public async getDelegations(
    pagination: PaginationOptions,
  ): Promise<components['schemas']['account_delegation_content']> {
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
    const stakingAddress: string = this.wallet.addresses.rewardAddressBech32;

    const url =
      '/accounts/' +
      stakingAddress +
      '/delegations?' +
      this.paginationToQuery(pagination);

    try {
      return this.provider.get(url);
    } catch (error) {
      throw this.handleError('BLOCKFROST_API', error);
    }
  }

  /**
   * getPoolsInfos gets info about list of staking pools (stats, identity, meta)
   *
   * @param poolBech32IDs - list of bec32 pool addresses
   *
   * @returns Promise with pool infos
   */
  public async getPoolsInfos(
    poolBech32IDs: string[],
  ): Promise<components['schemas']['pool'][]> {
    try {
      const pools: components['schemas']['pool'][] = [];

      for (const poolID of poolBech32IDs) {
        const p: components['schemas']['pool'] = await this.provider.get(
          '/pools/' + poolID,
        );
        pools.push(p);
      }

      return pools;
    } catch (error) {
      throw this.handleError('BLOCKFROST_API', error);
    }
  }

  /**
   * selectPool gets info about selected pool.
   * First call of selectPool methods select the lowest saturation, it takes somme time.
   **
   * @returns Promise with pool infos
   */
  public async selectPool(): Promise<components['schemas']['pool']> {
    if (this.pool !== undefined) {
      return this.pool;
    }

    const poolIDs = await this.getPoolIDs();
    const poolsInfos = await this.getPoolsInfos(poolIDs);

    this.pool = poolsInfos.reduce((min, current) => {
      return current.live_saturation < min.live_saturation ? current : min;
    });

    return this.pool;
  }

  /**
   * getPoolIDs fetches list of internal pools.
   **
   * @returns Promise with pool IDs
   */
  public async getPoolIDs(): Promise<string[]> {
    switch (this.network) {
      case 'mainnet':
        try {
          const res = await fetch(POOLS_LIST_URL);

          return (await res.json()) as string[];
        } catch (error) {
          throw this.handleError('FETCH_POOL_LIST', error);
        }
      case 'preview':
        return new Promise<string[]>((resolve) =>
          // random pools ID for tests
          resolve([
            'pool1gxhg7rr092n25gw2jw3es4773ds3g2t88wgr8guqh5tv7sg38fz',
            'pool1p79majfcn554nkl88auu5njmprfsx9jdkv29rtltkn44y2h04qy',
            'pool1et0z8df6yy5fj7hnfht5mswg6dcvf58ndmy0aq0a98j22ulksx6',
          ]),
        );
      case 'preprod':
        return new Promise<string[]>((resolve) =>
          resolve([
            // random pools ID for tests
            'pool1wf9j0stckxueuxtrkupzug7463el4mdwz3fwxwlsdr98q9292s8',
            'pool1yaap4p67ltp79m5na7s8qarszyz5d6n7ltqxlmf2apzsxmxlwzq',
            'pool1cpfq9p6f04yde2ms2ey4qmuj56t2wfkye5kj3adjsqgpk9re3zs',
          ]),
        );
    }
  }

  /**
   * isInternalPoolDelegation check if current delegation is to internal pool.
   **
   * @returns Promise with boolean value.
   */
  public async isInternalPoolDelegation(): Promise<boolean> {
    const poolIDs = await this.getPoolIDs();
    const stake = await this.getStakeInfo();
    if (!stake) {
      return false;
    }
    const poolID = poolIDs.find((poolID) => {
      return poolID === stake.pool_id ? poolID : undefined;
    });

    return poolID !== undefined;
  }

  /**
   * getStakeActivation gets an information about last delegation and how much time
   * need to stake become active.
   *
   * @returns Promise with delegation epoch info
   */
  public async getStakeActivation(): Promise<StakeActivation> {
    if (!this.wallet.addresses.rewardAddressBech32) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
    const stakingAddress: string = this.wallet.addresses.rewardAddressBech32;

    const latest: components['schemas']['epoch_content'] =
      await this.provider.get('/epochs/latest');

    const delegations: components['schemas']['account_delegation_content'] =
      await this.provider.get(
        `/accounts/${stakingAddress}/delegations?order=desc`,
      );
    if (
      !delegations ||
      delegations.length === 0 ||
      delegations[0] === undefined
    ) {
      return {
        stakeAddress: stakingAddress,
        delegatedPool: '',
        currentEpoch: Number(latest.epoch),
        activeEpoch: Number(latest.epoch),
        epochsUntilActive: 0,
        hoursUntilActive: 0,
        epochsUntilRewards: 0,
        hoursUntilRewards: 0,
        status: 'no-delegation',
      };
    }

    const { pool_id, active_epoch } = delegations[0];
    const activeEpoch = active_epoch;

    const currentEpoch = latest.epoch;
    const now = Math.floor(Date.now() / 1000); // UNIX seconds
    const secLeftInEpoch = Math.max(0, latest.end_time - now);

    const secondsUntilEpoch = (target: number): number => {
      const gap = target - currentEpoch;
      if (gap <= 0) return 0;
      if (gap === 1) return secLeftInEpoch;

      return secLeftInEpoch + (gap - 1) * (latest.end_time - latest.start_time);
    };

    const epochsUntilActive = Math.max(0, activeEpoch - currentEpoch);
    const hoursUntilActive = Math.round(secondsUntilEpoch(activeEpoch) / 3600);

    const firstRewardsEpoch = activeEpoch + 2;
    const epochsUntilRewards = Math.max(0, firstRewardsEpoch - currentEpoch);
    const hoursUntilRewards = Math.round(
      secondsUntilEpoch(firstRewardsEpoch) / 3600,
    );

    const status = epochsUntilActive > 0 ? 'pending' : 'active';

    return {
      stakeAddress: stakingAddress,
      delegatedPool: pool_id,
      currentEpoch,
      activeEpoch,
      epochsUntilActive,
      hoursUntilActive,
      epochsUntilRewards,
      hoursUntilRewards,
      status,
    };
  }

  /**
   * getDRep return default DRep
   *
   * @returns DRepID string
   */
  public getDRep(): string {
    switch (this.network) {
      case 'mainnet':
        return MAINNET_DREP;
      case 'preview':
        return PREVIEW_DREP;
      case 'preprod':
        return PREPROD_DREP;
    }
  }

  private paginationToQuery(p: PaginationOptions): string {
    return Object.entries(p)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      )
      .join('&');
  }
}
