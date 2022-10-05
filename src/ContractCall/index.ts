import { ethers, Contract } from "ethers";
import * as chains from "../ChainConfigs";
import _ from "lodash";
import { ChainConfig } from "../ChainConfigs/types";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env')});
import ERC721 from '../abi/Sotm721.json';
import NftLinker from '../abi/SotmNftLinker.json';

export default class ContractCall {
    provider: ethers.providers.JsonRpcProvider;
    batchProvider: ethers.providers.JsonRpcBatchProvider;
    chainConfig: ChainConfig;
    signer: ethers.Wallet;
    batchSigner: ethers.Wallet;
    erc721: Contract;
    ntfLinker: Contract;
    batchNtfLinker: Contract;

    constructor(chainId: string) {
        // get chain nft contract address
        const chain: any = _.find(chains, { id: chainId });

        this.chainConfig = chain;
        this.provider = new ethers.providers.JsonRpcProvider(chain.rpc);
        this.signer = new ethers.Wallet(`${process.env.PRIVATE_KEY}`, this.provider);
        this.erc721 = new ethers.Contract(chain.nftContract, ERC721.abi, this.signer);
        this.ntfLinker = new ethers.Contract(chain.linkerContract, NftLinker.abi, this.signer);
        this.batchProvider = new ethers.providers.JsonRpcBatchProvider(chain.rpc);
        this.batchSigner = new ethers.Wallet(`${process.env.PRIVATE_KEY}`, this.batchProvider);
        this.batchNtfLinker = new ethers.Contract(chain.linkerContract, NftLinker.abi, this.batchSigner);
    }

    checkNftClaimed = async(tokenId: string) => {
        return await this.erc721.isClaimed(tokenId);
    }

    checkTokenOrigin = async(token: string) => {
        return this.ntfLinker.safeGetOriginalData(token);
    }

    checkBulkTokenOrigin = async(tokens: string[]) => {
        // Queue some new things...
        let promises: any = [];

        _.map(tokens, (tk, tkIndex) => {
            promises.push(this.batchNtfLinker.safeGetOriginalData(tk));
        })

        // This line won't complete until the 10 above calls are complete, all of which will be sent as a single batch
        const results = await Promise.all(promises);

        return results;
    }
}