import { Blockchain } from '../../utils';
import { CardanoWeb3 } from 'cardano-web3-js';
import {
  ERROR_MESSAGES,
  KOIOS_MAINNET,
  KOIOS_PREPROD,
  KOIOS_PREVIEW,
  POOLS_LIST_URL,
} from './constants';
import {
  AccountUpdates,
  DelegationEpoch,
  EpochReward,
  KoiosPoolInfo,
  Network,
  StakeAddressInfo,
  StakeHistory,
  Tip,
} from './types';

/**
 * The `Cardano` class extends the `Blockchain` class and provides methods for
 * interacting with the Cardano network and KOIOS API.
 *
 * @property network - specified cardano network.
 * @property paymentAddress - payment cardano address which related with staking address.
 * @property koiosAPI - KOIOS base URL API according to network.
 * @property web3 - cardano web3 instance.
 * @property ORIGINAL_ERROR_MESSAGES - The original error messages for the Ethereum class.
 *
 */
export class Cardano extends Blockchain {
  private readonly network: Network;
  private readonly paymentAddress: string;
  private readonly koiosAPI: string;
  private web3: CardanoWeb3;

  protected ERROR_MESSAGES = ERROR_MESSAGES;
  protected ORIGINAL_ERROR_MESSAGES = {};

  constructor(network: Network, paymentAddress: string) {
    super();
    this.network = network;
    this.paymentAddress = paymentAddress;
    switch (network) {
      case 'preview':
        this.koiosAPI = KOIOS_PREVIEW;
        break;
      case 'preprod':
        this.koiosAPI = KOIOS_PREPROD;
        break;
      case 'mainnet':
        this.koiosAPI = KOIOS_MAINNET;
        break;
      default:
        throw new Error(`network ${network} not available`);
    }
    this.web3 = new CardanoWeb3({ network: network });
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
    const poolID = await this.selectPool();
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    try {
      const tx_build = await this.web3
        .createTx()
        .setChangeAddress(account.__config.paymentAddress)
        .addInputs(state.utxos)
        .stake.register(account.__config.stakingAddress)
        .stake.delegateTo(account.__config.stakingAddress, poolID)
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
    const poolID = await this.selectPool();
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    try {
      const tx_build = await this.web3
        .createTx()
        .setChangeAddress(account.__config.paymentAddress)
        .addInputs(state.utxos)
        .stake.delegateTo(account.__config.stakingAddress, poolID)
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
   * getStakeInfo gets info about stake using payment account. Info fetches
   * from KOIOS API.
   *
   * @returns Promise with stake info
   */
  public async getStakeInfo(): Promise<StakeAddressInfo> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    let accountInfos: StakeAddressInfo[];
    try {
      const res = await fetch(`${this.koiosAPI}/account_info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _stake_addresses: [account.__config.stakingAddress],
        }),
      });
      accountInfos = (await res.json()) as StakeAddressInfo[];
    } catch (error) {
      throw this.handleError('KOIOS_API', error);
    }

    if (
      !accountInfos ||
      accountInfos.length === 0 ||
      accountInfos[0] === undefined
    ) {
      throw this.throwError('NO_KOIOS_STAKING_INFO');
    }

    return accountInfos[0];
  }

  /**
   * getRewardHistory gets rewards history using current payment account and
   * according staking address. Info fetches from KOIOS API.
   *
   * @param epoch  - optional param to specify needed epoch.
   *
   * @returns Promise with stake reward history
   */
  public async getRewardHistory(
    epoch: number | undefined,
  ): Promise<EpochReward[]> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    let body: string;
    if (epoch === undefined) {
      body = JSON.stringify({
        _stake_addresses: [account.__config.stakingAddress],
      });
    } else {
      body = JSON.stringify({
        _stake_addresses: [account.__config.stakingAddress],
        _epoch_no: epoch,
      });
    }

    try {
      const res = await fetch(`${this.koiosAPI}/account_reward_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      return (await res.json()) as EpochReward[];
    } catch (error) {
      throw this.handleError('KOIOS_API', error);
    }
  }

  /**
   * getStakeHistory gets stake history using current payment account and
   * according staking address. Info fetches from KOIOS API.
   *
   * @returns Promise with stake history
   */
  public async getStakeHistory(): Promise<StakeHistory[]> {
    const account = this.web3.account.fromAddress(this.paymentAddress);
    if (!account.__config.stakingAddress) {
      throw this.throwError('NO_STAKING_ADDRESS');
    }

    try {
      const res = await fetch(`${this.koiosAPI}/account_stake_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _stake_addresses: [account.__config.stakingAddress],
        }),
      });

      return (await res.json()) as StakeHistory[];
    } catch (error) {
      throw this.handleError('KOIOS_API', error);
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
  ): Promise<KoiosPoolInfo[]> {
    try {
      const res = await fetch(`${this.koiosAPI}/pool_info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _pool_bech32_ids: poolBech32IDs }),
      });

      return (await res.json()) as KoiosPoolInfo[];
    } catch (error) {
      throw this.handleError('KOIOS_API', error);
    }
  }

  private async selectPool(): Promise<string> {
    const poolIDs = await this.getPoolIDs();
    const poolsInfos = await this.getPoolsInfos(poolIDs);
    const poolWithLowestSaturation = poolsInfos.reduce((min, current) => {
      if (current.live_saturation === null) {
        return min;
      }
      if (min.live_saturation === null) {
        return current;
      }

      return current.live_saturation < min.live_saturation ? current : min;
    });

    return poolWithLowestSaturation.pool_id_bech32;
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
          resolve([
            'pool12q7fskmv767qv8yn7mvcxj5azam9cdg0lpm3cajjqr2rqxc7y6a',
            'pool1gxhg7rr092n25gw2jw3es4773ds3g2t88wgr8guqh5tv7sg38fz',
            'pool1p79majfcn554nkl88auu5njmprfsx9jdkv29rtltkn44y2h04qy',
            'pool1et0z8df6yy5fj7hnfht5mswg6dcvf58ndmy0aq0a98j22ulksx6',
          ]),
        );
      case 'preprod':
        return new Promise<string[]>((resolve) =>
          resolve([
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

    let accountUpdates: AccountUpdates[];
    try {
      const res = await fetch(`${this.koiosAPI}/account_updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _stake_addresses: [account.__config.stakingAddress],
        }),
      });

      accountUpdates = (await res.json()) as AccountUpdates[];
    } catch (error) {
      throw this.handleError('KOIOS_API', error);
    }

    const updates = accountUpdates[0]?.updates;
    if (!updates || updates.length === 0) {
      throw this.throwError('NO_KOIOS_DELEGATION_FOUND');
    }

    // Find the most recent delegation event
    const lastDelegation = updates
      .filter((u) => u.action_type === 'delegation_pool')
      .pop();
    if (!lastDelegation) {
      throw this.throwError('NO_KOIOS_DELEGATION_FOUND');
    }

    const targetEpoch = lastDelegation.epoch_no; // Epoch when this delegation applies

    // Fetch current epoch
    let tipData: Tip[];
    try {
      const tipRes = await fetch(`${this.koiosAPI}/tip`);
      tipData = (await tipRes.json()) as Tip[];
    } catch (error) {
      throw this.handleError('KOIOS_API', error);
    }
    if (!tipData || tipData.length === 0 || tipData[0] === undefined) {
      throw this.throwError('KOIOS_EPOCH');
    }

    const currentEpoch = tipData[0].epoch_no;

    const epochsRemaining = targetEpoch - currentEpoch;
    const hoursPerEpoch = this.getHoursPerEpoch();
    const hoursRemaining = epochsRemaining * hoursPerEpoch;

    return {
      stakeAddress: account.__config.stakingAddress,
      currentEpoch,
      targetEpoch,
      epochsRemaining,
      hoursRemaining,
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
