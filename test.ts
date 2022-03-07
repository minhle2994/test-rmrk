import { fetchRemarks, getRemarksFromBlocks, getLatestFinalizedBlock, Consolidator, NFT } from 'rmrk-tools';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { createTestPairs } from "@polkadot/keyring/testingPairs";

const wsProvider = new WsProvider('wss://westend.api.onfinality.io/public-ws');
// const wsProvider = new WsProvider('wss://kusama.api.onfinality.io/public-ws');

const PREFIXES = ["0x726d726b", "0x524d524b"];

const fetchAndConsolidate = async (blockFrom: number, blockTo: number) => {
    try {
        const api = await ApiPromise.create({ provider: wsProvider });
        console.log('Block from:', blockFrom, 'Block to:', blockTo)
        const remarkBlocks = await fetchRemarks(api, blockFrom, blockTo, ['']);
        if (remarkBlocks && remarkBlocks.length > 0) {
          const remarks = getRemarksFromBlocks(remarkBlocks, PREFIXES);
          const consolidator = new Consolidator();
          const { nfts, collections } = await consolidator.consolidate(remarks);
          console.log('Consolidated nfts:', nfts);
          console.log('Consolidated collections:', collections);

          for (let key in nfts) {
            if (key.includes('7c5e131ccf667e8a6b-TEST29434')) {
              const nft = new NFT({
                block: nfts[key].block,
                collection: nfts[key].collection,
                symbol: nfts[key].symbol,
                transferable: nfts[key].transferable,
                sn: nfts[key].sn,
                metadata: nfts[key].metadata
              });
              console.log(nft.getId())
            }
          }
          return nfts
        }

        // for(let i=blockFrom; i<=blockTo; i++) {
        //   console.log('Block from:', i, 'Block to:', i)
        //   const remarkBlocks = await fetchRemarks(api, i, i, ['']);
        //   if (remarkBlocks && remarkBlocks.length > 0) {
        //     const remarks = getRemarksFromBlocks(remarkBlocks, PREFIXES);
        //     const consolidator = new Consolidator();
        //     const { nfts, collections } = await consolidator.consolidate(remarks);
        //     console.log('Consolidated nfts:', nfts);
        //     console.log('Consolidated collections:', collections);
        //   }
        // }
        return {}
    } catch (error) {
        console.log(error)
    }
}


fetchAndConsolidate(9857150, 9857152)
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });