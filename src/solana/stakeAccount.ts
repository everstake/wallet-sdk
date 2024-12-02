// Copied from https://github.com/igneous-labs/solana-stake-sdk
import { AccountInfo, ParsedAccountData } from '@solana/web3.js';
import { StakeAccount as Account } from './types/stakeAccount';
import { StakeState } from './constants';
import { create } from 'superstruct';
import BigNumber from 'bignumber.js';

export class ParseStakeAccountError extends Error {}

/**
 * The `StakeAccount` provides methods for interacting with the parsed Solana stake account.
 *
 * @property account - Parser account infop AccountInfo<Account>.
 * @throws ParseStakeAccountError if `account` is AccountInfo<Buffer> or if unable to parse account data
 */
export class StakeAccount {
  public account: AccountInfo<Account>;

  constructor({
    executable,
    owner,
    lamports,
    data,
    rentEpoch,
  }: AccountInfo<Buffer | ParsedAccountData>) {
    if (!('parsed' in data)) {
      throw new ParseStakeAccountError(
        'Raw AccountInfo<Buffer>, data not parsed',
      );
    }
    try {
      const parsedData = create(data.parsed, Account);

      this.account = {
        executable,
        owner,
        lamports,
        data: parsedData,
        rentEpoch,
      };
    } catch (e) {
      throw new ParseStakeAccountError((e as Error).message);
    }
  }

  /**
   * Check if lockup is in force
   * @param currEpoch current epoch.
   * @param currUnixTimestamp current unix timetamp.
   * @returns a bool type result.
   */
  public isLockupInForce(
    currEpoch: number,
    currUnixTimestamp: number,
  ): boolean {
    return (
      this.account.data.info.meta.lockup.unixTimestamp > currUnixTimestamp ||
      this.account.data.info.meta.lockup.epoch > currEpoch
    );
  }

  /**
   * Determins the current state of a stake account given the current epoch
   * @param currentEpoch
   * @returns `stakeAccount`'s stake state`string`
   */
  public stakeAccountState(currentEpoch: number): string {
    const {
      type,
      info: { stake },
    } = this.account.data;
    if (type !== 'delegated' || stake === null) {
      return StakeState.inactive;
    }
    const currentEpochBN = new BigNumber(currentEpoch);

    const activationEpoch = new BigNumber(stake.delegation.activationEpoch);
    const deactivationEpoch = new BigNumber(stake.delegation.deactivationEpoch);

    if (activationEpoch.gt(currentEpochBN)) {
      return StakeState.inactive;
    }
    if (activationEpoch.eq(currentEpochBN)) {
      // if you activate then deactivate in the same epoch,
      // deactivationEpoch === activationEpoch.
      // if you deactivate then activate again in the same epoch,
      // the deactivationEpoch will be reset to EPOCH_MAX
      if (deactivationEpoch.eq(activationEpoch)) return StakeState.inactive;

      return StakeState.activating;
    }
    // activationEpoch < currentEpochBN
    if (deactivationEpoch.gt(currentEpochBN)) return StakeState.active;
    if (deactivationEpoch.eq(currentEpochBN)) return StakeState.deactivating;

    return StakeState.deactivated;
  }
}
