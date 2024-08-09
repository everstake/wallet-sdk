import BigNumber from 'bignumber.js';
import { Ethereum } from '..';
import {
  claimWithdrawRequestErrorFixture,
  claimWithdrawRequestSuccessFixture,
  selectNetworErrorkFixture,
  selectNetworkSuccessFixture,
  stakeErrorFixture,
  stakeSuccessFixture,
  unstakeErrorFixture,
  unstakePendingErrorFixture,
  unstakePendingSuccessFixture,
  unstakeSuccessFixture,
} from '../__fixtures__';
import { NetworkType } from '../types';
import type { Contract } from 'web3-eth-contract';

describe('selectNetwork', () => {
  selectNetworkSuccessFixture.forEach(({ description, args, result }) => {
    it(description, () => {
      const ethereum = new Ethereum(args.network as NetworkType);
      const ethInstance = ethereum.selectNetwork(args.network as NetworkType);

      expect(ethInstance.addressContractPool).toBe(result.addressContractPool);
      expect(ethInstance.addressContractAccounting).toBe(
        result.addressContractAccounting,
      );
      expect(ethInstance.addressContractWithdrawTreasury).toBe(
        result.addressContractWithdrawTreasury,
      );
    });
  });

  selectNetworErrorkFixture.forEach(({ description, args, error }) => {
    it(description, () => {
      expect(() =>
        new Ethereum().selectNetwork(args.network as NetworkType),
      ).toThrow(error);
    });
  });
});

describe('unstakePending', () => {
  unstakePendingSuccessFixture.forEach(
    ({
      description,
      args,
      mockPendingBalance,
      mockMinStakeAmount,
      mockContractPool,
      result,
    }) => {
      it(description, async () => {
        const ethereum = new Ethereum(args.network as NetworkType);
        ethereum.pendingBalanceOf = jest
          .fn()
          .mockResolvedValue(new BigNumber(mockPendingBalance as string));
        ethereum.minStakeAmount = jest
          .fn()
          .mockResolvedValue(new BigNumber(mockMinStakeAmount as string));

        ethereum.contractPool = {
          methods: {
            unstakePending: jest.fn().mockReturnValue({
              estimateGas: jest
                .fn()
                .mockResolvedValue(mockContractPool.estimateGas),
              encodeABI: jest.fn().mockReturnValue(mockContractPool.encodeABI),
            }),
          },
        } as Contract;

        const transaction = await ethereum.unstakePending(
          args.address,
          args.amount,
        );

        expect(transaction).toStrictEqual(result);
      });
    },
  );

  unstakePendingErrorFixture.forEach(
    ({ description, args, mockPendingBalance, mockMinStakeAmount, error }) => {
      it(description, async () => {
        const ethereum = new Ethereum(args.network as NetworkType);

        ethereum.pendingBalanceOf = jest
          .fn()
          .mockResolvedValue(new BigNumber(mockPendingBalance as string));
        ethereum.minStakeAmount = jest
          .fn()
          .mockResolvedValue(new BigNumber(mockMinStakeAmount as string));

        await expect(
          ethereum.unstakePending(args.address, args.amount),
        ).rejects.toThrow(error);
      });
    },
  );
});

describe('claimWithdrawRequest', () => {
  claimWithdrawRequestSuccessFixture.forEach(
    ({ description, args, result }) => {
      it(description, async () => {
        const ethereum = new Ethereum(args.network as NetworkType);

        const tx = await ethereum.claimWithdrawRequest(args.address);
        const { gasLimit, ...rest } = tx;

        expect(gasLimit).toBeGreaterThan(0);
        expect(rest).toEqual(result);
      });
    },
  );

  claimWithdrawRequestErrorFixture.forEach(
    ({ description, args, mockRewards, error }) => {
      it(description, async () => {
        const ethereum = new Ethereum(args.network as NetworkType);

        ethereum.withdrawRequest = jest.fn().mockResolvedValue({
          requested: new BigNumber(mockRewards?.requested as string),
          readyForClaim: new BigNumber(mockRewards?.readyForClaim as string),
        });

        await expect(
          ethereum.claimWithdrawRequest(args.address),
        ).rejects.toThrow(error);
      });
    },
  );
});

describe('stake', () => {
  stakeSuccessFixture.forEach(({ description, args, result }) => {
    it(description, async () => {
      const ethereum = new Ethereum(args.network as NetworkType);

      ethereum.contractPool.methods.stake(args.source).estimateGas = jest
        .fn()
        .mockResolvedValue(result.mockGasConsumption);

      const tx = await ethereum.stake(args.address, args.amount, args.source);
      const { gasLimit, ...rest } = tx;

      expect(gasLimit).toBeGreaterThan(0);
      expect(rest).toEqual(result.expectedTx);
    });
  });

  stakeErrorFixture.forEach(({ description, args, error }) => {
    it(description, async () => {
      const ethereum = new Ethereum(args.network as NetworkType);

      await expect(
        ethereum.stake(args.address, args.amount as string, args.source),
      ).rejects.toThrow(error);
    });
  });
});

describe('unstake', () => {
  unstakeSuccessFixture.forEach(
    ({ description, args, mockedAutocompoundBalance, result }) => {
      it(description, async () => {
        const ethereum = new Ethereum(args.network as NetworkType);

        ethereum.autocompoundBalanceOf = jest
          .fn()
          .mockResolvedValue(new BigNumber(mockedAutocompoundBalance));

        const tx = await ethereum.unstake(args.address, args.amount);
        const { gasLimit, ...rest } = tx;

        expect(gasLimit).toBeGreaterThan(0);
        expect(rest).toEqual(result.expectedTx);
      });
    },
  );

  unstakeErrorFixture.forEach(
    ({ description, args, mockedAutocompoundBalance, error }) => {
      it(description, async () => {
        const ethereum = new Ethereum(args.network as NetworkType);

        ethereum.autocompoundBalanceOf = jest
          .fn()
          .mockResolvedValue(
            new BigNumber(mockedAutocompoundBalance as string),
          );

        await expect(
          ethereum.unstake(
            args.address,
            args.amount as string,
            args.allowedInterchangeNum,
            args.source,
          ),
        ).rejects.toThrow(error);
      });
    },
  );
});