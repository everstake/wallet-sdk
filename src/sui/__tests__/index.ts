import { Sui } from '..';

async function main() {
  const suicli = new Sui('testnet');
  const pk = process.env.SUI_PK;

  const depTx = await suicli.stake('1');

  console.log(depTx);
}

main();
