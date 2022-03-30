import client from './client';

export async function createNewDevWallet() {
  const wallet = await client.wallets.generate();
  await mintDevTokens(await getWalletAddress(wallet));
  return wallet;
}

export async function getWalletAddress(wallet) {
  return client.wallets.jwkToAddress(wallet);
}

async function mintDevTokens(walletAddress, numTokens = '100000000000000000') {
  client.api.get(`/mint/${walletAddress}/${numTokens}`);
}
