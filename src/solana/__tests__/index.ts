import { Cluster } from '@solana/web3.js';
import { Solana } from '../';

describe('Solana', () => {
  it('should create a new Solana instance', () => {
    const solana = new Solana();
    expect(solana).toBeInstanceOf(Solana);
  });

  it('should call handleError if the connection fails', () => {
    expect(() => new Solana('wrong-cluster' as Cluster)).toThrow(
      'An error occurred while connecting to the network',
    );
  });
});
