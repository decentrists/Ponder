require('dotenv').config();
const Arweave = require('arweave');

const TAG_MAP = {
  categories: 'category',
  keywords: 'keyword',
};

async function delay(ms = 5000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async function seed(seeds, ms = 5000) {
  await delay(ms);
  const client = Arweave.init({
    host: 'localhost',
    port: 1984,
    protocol: 'http',
    timeout: 20000,
    logging: true,
  });

  const wallet = await client.wallets.generate();
  const address = await client.wallets.jwkToAddress(wallet);
  await client.api.get(`/mint/${address}/100000000000000000`);

  console.log(`Wallet at address ${address} created with 100000 AR.`);
  console.log('Begin seeding...');

  await Promise.all(seeds.podcasts
    .map(({ contents, tags }) => client.createTransaction({
      data:
       JSON.stringify(contents),
    }, wallet)
      .then(trx => {
        trx.addTag('Content-Type', 'application/json');
        trx.addTag('Unix-Time', Math.floor(Date.now() / 1000));
        trx.addTag(`${process.env.REACT_APP_TAG_PREFIX}-version`, process.env.REACT_APP_VERSION);
        Object.entries(tags)
          .reduce(
            (acc, [k, v]) => (['categories', 'keywords'].includes(k)
              ? [...acc, ...v.map(a => [TAG_MAP[k], a])]
              : [...acc, [k, v]]),
            [],
          )
          .forEach(([k, v]) => {
            trx.addTag(`${process.env.REACT_APP_TAG_PREFIX}-${k}`, v);
          });
        return client.transactions.sign(trx, wallet)
          .then(() => client.transactions.post(trx));
      })));
  console.log('Seeding successful!');
};
