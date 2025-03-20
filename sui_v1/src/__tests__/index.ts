import { Sui } from '..';
import { WalletSDKError } from '../utils';
import {
  invalidGetStakeBalanceAddress,
  selectNetworErrorkFixture,
  selectNetworkSuccessFixture,
  stakeAmount,
} from '../__fixtures__';
import { SuiNetworkType } from '../types';

describe('selectNetwork', () => {
  selectNetworkSuccessFixture.forEach(({ description, args, result }) => {
    it(description, () => {
      const sui = new Sui(args.network as SuiNetworkType);

      expect(sui.validatorAddress).toBe(result.validatorAddress);

      const suiInstance = sui.selectNetwork(args.network as SuiNetworkType);

      expect(suiInstance.validatorAddress).toBe(result.validatorAddress);
    });
  });

  selectNetworErrorkFixture.forEach(({ description, args, error }) => {
    it(description, () => {
      expect(() =>
        new Sui().selectNetwork(args.network as SuiNetworkType),
      ).toThrow(error);
    });
  });
});

describe('stake', () => {
  stakeAmount.forEach(({ description, args, error }) => {
    it(description, async () => {
      const sui = new Sui();
      if (error.message) {
        const { message, code } = error;
        try {
          await sui.stake(args.amount);
        } catch (error) {
          const e = error as WalletSDKError;
          expect(e.message).toBe(message);
          expect(e.code).toBe(code);
        }
      } else {
        await expect(await sui.stake(args.amount)).not.toThrow();
      }
    });
  });
});

describe('getStakeBalanceByAddress', () => {
  invalidGetStakeBalanceAddress.forEach(({ description, args, error }) => {
    it(description, async () => {
      const errorMessage = error;
      const sui = new Sui();
      try {
        await sui.getStakeBalanceByAddress(args.address);
      } catch (error) {
        const e = error as WalletSDKError;
        expect(e.message).toBe(errorMessage);
      }
    });
  });
});
