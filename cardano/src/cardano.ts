import { Blockchain } from '../../utils';
import { CardanoWeb3 } from 'cardano-web3-js';
import {
  BlockFrostAPI,
  BlockfrostServerError,
} from '@blockfrost/blockfrost-js';
import { ERROR_MESSAGES, POOLS_LIST_URL } from './constants';
import { DelegationEpoch, Network } from './types';
import { components } from '@blockfrost/openapi';
import { PaginationOptions } from '@blockfrost/blockfrost-js/lib/types';

/**
 * The `Cardano` class extends the `Blockchain` class and provides methods for
 * interacting with the Cardano network and BLOCKFROST API.
 *
 * @property network - specified cardano network.
 * @property paymentAddress - payment cardano address which related with staking address.
 * @property blockfrost - blockfrost base URL API according to network.
 * @property web3 - cardano web3 instance.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Ethereum class.
 *
 */
export class Cardano extends Blockchain {
  private readonly network: Network;
  private readonly paymentAddress: string;
  private blockfrost: BlockFrostAPI;
  private web3: CardanoWeb3;
  private pool: components['schemas']['pool'] | undefined;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(
    network: Network,
    paymentAddress: string,
    blockfrostProjectID: string,
  ) {
    super();
    this.network = network;
    this.paymentAddress = paymentAddress;
    this.blockfrost = new BlockFrostAPI({
      projectId: blockfrostProjectID,
      network: network,
    });
    this.web3 = new CardanoWeb3({ network: network });
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
  }

  /**
   * registerAndDelegateCborHexTx make a new unsigned transaction that contains
   * register stake account and delegation together.
   *
   * @returns Promise with cbor encoded hex data.
   */
  public async registerAndDelegateCborHexTx(): Promise<string> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    const state = await account.getState();
    const pool = await this.selectPool();
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    try {
      const tx_build = await this.web3
        .createTx()
        .setChangeAddress(account.__config.paymentAddress)
        .addInputs(state.utxos)
        .stake.register(account.__config.stakingAddress)
        .stake.delegateTo(account.__config.stakingAddress, pool.pool_id)
        .applyAndBuild();

      return tx_build.__tx.to_cbor_hex();
    } catch (error) {
      throw this.handleError('TX_BUILD', error);
    }
  }

  /**
   * delegateCborHexTx make a new unsigned transaction that contains delegation.
   *
   * @returns Promise with cbor encoded hex data.
   */
  public async delegateCborHexTx(): Promise<string> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    const state = await account.getState();
    const pool = await this.selectPool();
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    try {
      const tx_build = await this.web3
        .createTx()
        .setChangeAddress(account.__config.paymentAddress)
        .addInputs(state.utxos)
        .stake.delegateTo(account.__config.stakingAddress, pool.pool_id)
        .applyAndBuild();

      return tx_build.__tx.to_cbor_hex();
    } catch (error) {
      throw this.handleError('TX_BUILD', error);
    }
  }

  /**
   * delegateCborHexTx make a new unsigned transaction that contains registration.
   *
   * @returns Promise with cbor encoded hex data.
   */
  public async registerCborHexTx(): Promise<string> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    const state = await account.getState();
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    try {
      const tx_build = await this.web3
        .createTx()
        .setChangeAddress(account.__config.paymentAddress)
        .addInputs(state.utxos)
        .stake.register(account.__config.stakingAddress)
        .applyAndBuild();

      return tx_build.__tx.to_cbor_hex();
    } catch (error) {
      throw this.handleError('TX_BUILD', error);
    }
  }

  /**
   * delegateCborHexTx make a new unsigned transaction that contains stake deregister.
   * This tx returns 2 deposit ADA and returns all stake and claim rewards to payment address.
   *
   * @returns Promise with cbor encoded hex data
   */
  public async deregisterCborHexTx(): Promise<string> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    const state = await account.getState();
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    try {
      const tx_build = await this.web3
        .createTx()
        .setChangeAddress(account.__config.paymentAddress)
        .addInputs(state.utxos)
        .stake.deregister(account.__config.stakingAddress)
        .applyAndBuild();

      return tx_build.__tx.to_cbor_hex();
    } catch (error) {
      throw this.handleError('TX_BUILD', error);
    }
  }

  /**
   * withdrawRewardsCborHexTx make a new unsigned transaction that claim rewards.
   * Cardano has auto compound so no need to claim rewards to increase APR. It should be call when need to spend it.
   *
   * @returns Promise with cbor encoded hex data
   */
  public async withdrawRewardsCborHexTx(): Promise<string> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    const state = await account.getState();
    if (!account.__config.stakingAddress) {
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

    try {
      const tx_build = await this.web3
        .createTx()
        .setChangeAddress(account.__config.paymentAddress)
        .addInputs(state.utxos)
        .addOutputs([
          {
            address: account.__config.paymentAddress,
            value: unclaimed,
          },
        ])
        .stake.withdrawRewards(this.paymentAddress, unclaimed)
        .applyAndBuild();

      return tx_build.__tx.to_cbor_hex();
    } catch (error) {
      throw this.handleError('TX_BUILD', error);
    }
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
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
    const stakingAddress: string = account.__config.stakingAddress;

    try {
      return await this.blockfrost.accounts(stakingAddress);
    } catch (error) {
      if (error instanceof BlockfrostServerError && error.status_code === 404) {
        return undefined;
      }
      throw this.handleError('BLOCKFROST_STAKING_INFO', error);
    }
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
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
    const stakingAddress: string = account.__config.stakingAddress;

    try {
      return this.blockfrost.accountsRewards(stakingAddress, pagination);
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
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
    const stakingAddress: string = account.__config.stakingAddress;

    try {
      return this.blockfrost.accountsDelegations(stakingAddress, pagination);
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
        const p = await this.blockfrost.poolsById(poolID);
        pools.push(p as components['schemas']['pool']);
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

  private async getPoolIDs(): Promise<string[]> {
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
   * getDelegationEpoch gets an information about last delegation and how much time
   * need to stake become active.
   *
   * @returns Promise with delegation epoch info
   */
  public async getDelegationEpoch(): Promise<DelegationEpoch> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }
    const stakingAddress: string = account.__config.stakingAddress;

    const delegations =
      await this.blockfrost.accountsDelegations(stakingAddress);
    const latestDelegation = delegations[0]; // newest first

    // Get current epoch
    const latestEpoch = await this.blockfrost.epochsLatest();

    if (!latestDelegation) {
      return {
        stakeAddress: stakingAddress,
        status: 'never-delegated',
        currentEpoch: latestEpoch.epoch,
      };
    }

    const { pool_id, active_epoch } = latestDelegation;
    const hoursPerEpoch = this.getHoursPerEpoch();

    const currentEpoch = latestEpoch.epoch;
    const epochsUntilActive = Math.max(0, active_epoch - currentEpoch);
    const hoursUntilActive = epochsUntilActive * hoursPerEpoch;

    const epochsUntilRewards = Math.max(0, active_epoch + 2 - currentEpoch);
    const hoursUntilRewards = epochsUntilRewards * hoursPerEpoch;

    let status: string;
    if (epochsUntilActive > 0) {
      status = 'pending';
    } else {
      status = 'active';
    }

    return {
      stakeAddress: stakingAddress,
      delegatedPool: pool_id,
      currentEpoch,
      activeEpoch: active_epoch,
      status,
      epochsUntilActive,
      hoursUntilActive,
      epochsUntilRewards,
      hoursUntilRewards,
    };
  }

  private getHoursPerEpoch(): number {
    switch (this.network) {
      case 'mainnet':
        return 5 * 24;
      case 'preprod':
        return 5 * 24;
      case 'preview':
        return 24;
    }
  }
}
