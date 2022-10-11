import {AxiosRequestHeaders} from "axios";
import * as chains from "../ChainConfigs";
import DB from "../DB"
import {
    axiosCall,
    getInsertQuery
} from "../../utils";
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
    path: path.join(__dirname, '../../.env')
});
import _ from "lodash";
import ContractCall from "../ContractCall";
import { bridgeLog } from "./types";
const isTestnet = process.env.CHAIN_ENV === "testnet";

/**
 * Get wallet's nft (on-chain) - haven't match with db record
 * @date 2022-10-03
 * @param { string } address
 * @param { string } chainId
 */
 export const getHolderNft = async (chainId: string, address:string) => {
    const chain: any = _.find(chains, {id: chainId});

    if (_.isNil(chain) || !_.has(chain, 'nftContract')) {
        // throw Error("Invalid Chain");
        return [];
    }

    const headers: AxiosRequestHeaders = {
        'accept': 'application/json',
        'X-API-Key': `${
            process.env.MORALIS
        }`
    };

    // store all tokens
    let tokens: any = [];
    let nextCursor = null;

    // erc721 contract (native token)
    // linker contract(bridged token)
    const contractAddresses = [chain.nftContract, chain.linkerContract];

    for (let index = 0; index < contractAddresses.length; index++) {
        const contract = contractAddresses[index];

        do {
            let config: any = {
                method: 'GET',
                url: `https://deep-index.moralis.io/api/v2/${ address }/nft`,
                params: {
                    chain: chainId,
                    format: 'decimal',
                    token_addresses: contract,
                    // limit: 10
                },
                headers: headers
            }

            // append next cursor if not empty
            if (!_.isNil(nextCursor)) {
                config.params['cursor'] = nextCursor;
            }

            const data: any = await axiosCall(headers, config);

            // merge all result
            if (!_.isNil(data)) {
                tokens = _.concat(tokens, data.result);

                // while next page still available
                nextCursor = data.cursor;
            }

        } while(!_.isNil(nextCursor));
    }

    return tokens;
}

export const getInventory = async (chainId: string, address:string) => {
    try {
        // get all token id (without pagination for now)
        // get all token from erc721 & linker
        let data = await getHolderNft(chainId, address);
        // const polygon = await getHolderNft('0x13881', address);

        // handle empty result
        if (_.isEmpty(data)) {
            return data;
        }

        const tokenIds = _.map(data, 'token_id');

        // https://github.com/ethers-io/ethers.js/issues/892
        // get token origin id (to detect cross chain token)
        // batch get original token id to search in db
        // const chain: any = _.find(chains, {id: chainId});
        const etherCall = new ContractCall(chainId);
        const tokensOrigin = await etherCall.checkBulkTokenOrigin(tokenIds);

        // map curr token id with origin token id (before bridge)
        let tokenMapping: {[key: string]: string} = {};
        let tokenOriginChain: {[key: string]: string} = {};
        // store token id without quote (for update monster_bridge_log)
        let tokenIdsRaw: string[] = [];

        // take token id only and form where query string
        let tokenIdsString = await Promise.all(
            _.map(tokensOrigin, async(tk, tkIndex) => {
                // map curr token <-> origin token
                const currId = tokenIds[tkIndex];

                switch (tk[0]) {
                    case 'Polygon':
                        tokenOriginChain[tk[1].toString()] = isTestnet ? chains.POLYGON_TEST.id : chains.POLYGON.id;
                        break;
                    case 'BNB Chain':
                        tokenOriginChain[tk[1].toString()] = isTestnet ? chains.BSC_TEST.id : chains.BSC.id;
                        break;
                    case 'Avalanche':
                        tokenOriginChain[tk[1].toString()] = isTestnet ? chains.AVAX_TEST.id : chains.AVAX.id;
                        break;
                    default:
                        break;
                }
                tokenMapping[tk[1].toString()] = currId;
                // const tokenOrigin = await etherCall.checkTokenOrigin(tk);
                // console.log(tokenOrigin);
                tokenIdsRaw.push(tk[1].toString());
                return `'${tk[1].toString()}'`;
            })
        );

        // update those bridged record if they found in this chain
        updateBridgeLog(tokenIdsRaw, chainId);

        // only select token_id that recorded in db
        // select mob data & equipped
        const db = new DB();

        // remove missing monsters from equipped
        const deleteEquippedQuery = `
            with missing_monsters as (
                select pm.id as missing_id
                from player_monsters pm
                join monsters m
                on m.id = pm.monster_id
                where lower(address) = lower('${address}')
                and   m.token_id not in ('${tokenIds.join("','")}')
            )
            delete from player_monsters
            where id in (select missing_id from missing_monsters)
        `;
        await db.executeQuery(deleteEquippedQuery);

        const mobQuery = `
            SELECT
                mob.id,
                mob.token_id,
                mob.attack,
                mob.defense,
                mob.hp,
                mob.crit_chance,
                mob.crit_multiplier,
                mob.is_shiny,
                CASE WHEN pmob.monster_id > 0 THEN 1 ELSE 0 END as equipped,
                mbm.name,
                mbm.img_file,
                e.name as element,
                e.id as element_id
            FROM monsters mob
            LEFT JOIN player_monsters pmob
            ON mob.id = pmob.monster_id
            LEFT JOIN monster_base_metadata mbm
            ON mob.monster_base_metadata_id = mbm.id
            LEFT JOIN elements e
            ON mbm.element_id = e.id
            WHERE mob.token_id IN (${_.join(tokenIdsString, ', ')})
        `;

        let mobRes: any = await db.executeQueryForResults(mobQuery);

        if (_.isEmpty(mobRes)) {
            return [];
        }

        // after filter chain and first query punya token id
        tokenIdsString = _.map(mobRes, tk => `'${tk.token_id}'`);
        // select mob skills
        const skillQuery = `
            SELECT
                mob.id,
                e.name as element,
                e.id as element_id,
                ms.name,
                ms.icon_file,
                ms.hits,
                ms.accuracy,
                ms.cooldown,
                (ms.multiplier * 100) as damage
            FROM monsters mob
            LEFT JOIN monster_equipped_skills mes
            ON mob.id = mes.monster_id
            LEFT JOIN monster_skills ms
            ON mes.monster_skill_id = ms.id
            LEFT JOIN elements e
            ON ms.element_id = e.id
            WHERE mob.token_id IN (${_.join(tokenIdsString, ', ')})
        `;

        let skillRes: any = await db.executeQueryForResults(skillQuery);
        // assign skills
        _.map(mobRes, (ms, index) => {
            mobRes[index].curr_token_id = tokenMapping[mobRes[index].token_id];
            mobRes[index].attack = mobRes[index].attack.toFixed(0);
            mobRes[index].defense = mobRes[index].defense.toFixed(0);
            mobRes[index].hp = mobRes[index].hp.toFixed(0);
            mobRes[index].crit_chance = mobRes[index].crit_chance.toFixed(0);
            mobRes[index].origin_chain = tokenOriginChain[mobRes[index].token_id];

            mobRes[index]['skills'] = _.filter(skillRes, {'id': ms.id });

            // remove unused id
            _.map(mobRes[index]['skills'], (currMs, currIndex) => {
                mobRes[index]['skills'][currIndex].hits = mobRes[index]['skills'][currIndex].hits.toFixed(0);
                mobRes[index]['skills'][currIndex].accuracy = mobRes[index]['skills'][currIndex].accuracy.toFixed(0);
                mobRes[index]['skills'][currIndex].cooldown = mobRes[index]['skills'][currIndex].cooldown.toFixed(0);
                mobRes[index]['skills'][currIndex].damage = mobRes[index]['skills'][currIndex].damage.toFixed(0);
                mobRes[index]['skills'][currIndex] = _.omit(mobRes[index]['skills'][currIndex], 'id');
            })
        });

        return mobRes;
    } catch(e) {
        // console.log(e);
        return [];
    }
}

export const equipMonster = async(chainId: string, address:string, monsterId: number) => {
    try {
        let db = new DB();
        let table = 'player_monsters';
        let checkerQuery = `SELECT COUNT(*) as count FROM ${table} WHERE chain_id = '${chainId}' AND address = '${address}'`;
        let checkerRes = await db.executeQueryForSingleResult<{count: number}>(checkerQuery);

        // check if mob in bridging state
        let checkBridgingQuery = `SELECT COUNT(id) as count FROM monster_bridge_log WHERE monster_id = ${monsterId} AND address = '${address}' AND status = 0;`
        let checkBridgingRes = await db.executeQueryForSingleResult<{count: number}>(checkBridgingQuery);

        if(
            (checkerRes && checkerRes.count >= 4) ||
            (checkBridgingRes && checkBridgingRes.count > 0)
        ) {
            // console.log(`Party full!`);
            return false;
        }

        let columns = ['address', 'monster_id', 'chain_id'];
        let values: any[][] = [];
        values.push([address, monsterId, chainId]);
        let query = getInsertQuery(columns, values, table);
        query = `${query.replace(';', '')} returning id;`;
        const result = await db.executeQueryForSingleResult(query);

        return true;
    }
    catch {
        return false;
    }
}

export const unequipMonster = async(chainId: string, address:string, monsterId: number) => {
    let db = new DB();
    let removeQuery = `DELETE FROM player_monsters WHERE chain_id = '${chainId}' AND address = '${address}' AND monster_id = ${monsterId}`;
    try {
        const result = await db.executeQueryForSingleResult(removeQuery);

        return true;
    }
    catch {
        return false;
    }
}

export const addBridgeLog = async(data: bridgeLog) => {
    let db = new DB();
    let table = 'monster_bridge_log';
    let columns = ['monster_id', 'token_id', 'address', 'from_chain_id', 'to_chain_id', 'tx_hash'];
    let values: any[][] = [];

    values.push([data['monster_id'], data['token_id'], data['address'], data['from_chain_id'], data['to_chain_id'], data['tx_hash']]);

    let query = getInsertQuery(columns, values, table);
    query = `${query.replace(';', '')} returning id;`;

    const result = await db.executeQueryForSingleResult(query);

    return true;
}

export const getBridgeLog = async(address:string, offset=0, limit=5) => {
    let db = new DB();
    let query = `SELECT * FROM monster_bridge_log WHERE address = '${address}' ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    const result = await db.executeQueryForResults(query);

    return result;
}

export const updateBridgeLog = async(tokenIds: string[], chainId: string) => {
    let db = new DB();
    let query = '';
    for (let token of tokenIds) {
        query += `UPDATE monster_bridge_log SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE token_id = '${token}' AND to_chain_id = '${chainId}' AND status = 0;`
    }
    const result = await db.executeQuery(query);
    return true;
}