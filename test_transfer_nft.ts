import {
  fetchRemarks,
  getRemarksFromBlocks,
  getLatestFinalizedBlock,
  Consolidator,
  Collection,
  NFT
} from "rmrk-tools";

import { 
  ApiPromise, 
  WsProvider 
} from "@polkadot/api";

import { 
  Keyring 
} from '@polkadot/keyring';

import { 
  u8aToHex 
} from "@polkadot/util";

const test1Mnemonic = 'start print thing cart puppy virus crystal hire level bottom gap garbage';
const test2Mnemonic = 'nephew ten camera assist six apology fix shuffle keen century ugly sweet';
const PREFIXES = ["0x726d726b", "0x524d524b"];

const delay = (ms: number) => {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const fetchNFTs = async (blockFrom: number, blockTo: number) => {
    try {
        const wsProvider = new WsProvider("wss://westend.api.onfinality.io/public-ws");
        const api = await ApiPromise.create({ provider: wsProvider });
        // console.log('Block from:', blockFrom, 'Block to:', blockTo)
        const remarkBlocks = await fetchRemarks(api, blockFrom, blockTo, ['']);
        if (remarkBlocks && remarkBlocks.length > 0) {
          const remarks = getRemarksFromBlocks(remarkBlocks, PREFIXES);
          const consolidator = new Consolidator();
          const { nfts, collections } = await consolidator.consolidate(remarks);
          console.log('Consolidated nfts:', nfts);
          console.log('Consolidated collections:', collections);
          return nfts
        }
        return {}
    } catch (error) {
        console.log(error)
    }
}

async function main() {
  const wsProvider = new WsProvider("wss://westend.api.onfinality.io/public-ws");
  const api = await ApiPromise.create({ provider: wsProvider });
  await api.isReadyOrError;

  const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });
  const pair1 = keyring.addFromUri(test1Mnemonic, { name: 'test1' }, 'sr25519');
  const pair2 = keyring.addFromUri(test2Mnemonic, { name: 'test2' }, 'sr25519');

  console.log('test1 address:', pair1.address);
  console.log('test2 address:', pair2.address);

  const blockFrom = await getLatestFinalizedBlock(api);

  const colSymbol = 'TEST';
  const colIdSubfix = Math.floor(Math.random() * 999999) as unknown as string;
  const colId = Collection.generateId(u8aToHex(pair1.publicKey), colSymbol) + colIdSubfix;
  const col = new Collection(
    0,
    9999,
    pair1.address,
    colSymbol,
    colId,
    "ipfs://ipfs/QmNRfqnxgPDzit4uJFn3uCoafNQinunwSZRRC9gRQ4ed3s"
  );
  // console.log(col)

  console.log("Creating collection", col.id);
  const hash1 = await api.tx.system.remark(col.create()).signAndSend(pair1);
  console.log("Collection created with hash", hash1.toHex());
  await delay(5000);

  const nft = new NFT( {
    block: 0,
    collection: col.id,
    symbol: 'NFT',
    transferable: 1,
    sn: '' + Math.floor(Math.random() * 999999) as unknown as string,
    metadata: "ipfs://ipfs/QmavoTVbVHnGEUztnBT2p3rif3qBPeCfyyUE5v4Z7oFvs4"
  } );
  // console.log(nft)

  console.log("Creating nft", nft.sn);
  const hash2 = await api.tx.system.remark(nft.mint()).signAndSend(pair1);
  console.log("NFT created with hash", hash2.toHex());
  await delay(5000);

  const blockTo1 = await getLatestFinalizedBlock(api);
  await delay(5000);
  const nfts = await fetchNFTs(blockFrom - 6, blockTo1 + 6);
  for (let key in nfts) {
    if (key.includes(col.id)) {
      const nft = new NFT({
        block: nfts[key].block,
        collection: nfts[key].collection,
        symbol: nfts[key].symbol,
        transferable: nfts[key].transferable,
        sn: nfts[key].sn,
        metadata: nfts[key].metadata
      });

      console.log("Sending nft", nft.getId());
      const utx = api.tx.system.remark(nft.send(pair2.address))
      console.log('Call hash:', utx.method.hash.toHex())
      const hash = await utx.signAndSend(pair1);
      console.log("NFT sent with hash", hash.toHex());
      await delay(5000);

      const blockTo2 = await getLatestFinalizedBlock(api);
      await delay(5000);
      await fetchNFTs(blockFrom - 6, blockTo2 + 6);

      break;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });