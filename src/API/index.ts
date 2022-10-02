import * as chains from "../ChainConfigs";
import { chainConfigs } from "../ChainConfigs";
import DB from "../DB"
import { MonsterBaseMetadata } from "./types";
import { axiosCall, getRandomNumber, getHash, generateRandomNumberChar, getInsertQuery } from "../../utils";
import { AxiosResponse, AxiosRequestHeaders } from "axios";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env')});
import _ from "lodash";
import ContractCall from '../ContractCall';
import effectFile from '../../assets/effects/_effect_files.json';

const ETHEREUM_ADDRESS_LENGTH = 42;

const sanitizeAddress = (address: string) => {
    address = address.replace(/ /g, "");
    address = address.trim();

    if(address.length !== ETHEREUM_ADDRESS_LENGTH) {
        throw Error("Invalid Address");
    }

    if(address.substring(0, 2) !== '0x') {
        throw Error("Invalid Address");
    }

    return address;
}

export const getStarterStatus = async(address: string) => {
    let db = new DB();

    address = sanitizeAddress(address);

    let query = `SELECT * FROM claimed_addresses WHERE address = '${address}';`;
    let res = await db.executeQueryForResults(query);

    return res && res.length !== 0;
}

export const getStarterMonsters = async(chainId: string) => {
    let db = new DB();

    if(!chainConfigs.includes(chainId)) {
        throw Error("Invalid Chain");
    }

    let query = `
                    with starter_ids AS (
                        select chain_id, element_id, min(id) + element_id as monster_metadata_id
                        from monster_base_metadata
                        group by chain_id, element_id
                    )
                    select
                        md.id,
                        md.name,
                        e.id as element_id,
                        e.name as element_name,
                        img_file,
                        base_attack,
                        max_attack,
                        base_defense,
                        max_defense,
                        base_hp,
                        max_hp,
                        base_crit_chance,
                        max_crit_chance,
                        base_crit_multiplier,
                        max_crit_multiplier,
                        shiny_chance
                    from monster_base_metadata md
                    join elements e
                    on e.id = md.element_id
                    where chain_id='${chainId}' and md.id in (select monster_metadata_id from starter_ids)
                    order by element_id, md.id
                    limit 3`;
    let res = await db.executeQueryForResults<MonsterBaseMetadata>(query);
    return res? res : [];
}

export const insertClaimedAddress = async(address: string) => {
    let db = new DB();
    address = sanitizeAddress(address);
    let query = `insert into claimed_addresses (address) values ('${address}'); insert into player_locations (address) values ('${address}');`;
    await db.executeQuery(query);
}

export const moveAddressTo = async(address: string, areaId: number) => {
    if(!areaId) {
        throw Error("Invalid location");
    }

    let db = new DB();
    address = sanitizeAddress(address);
    let query = `update player_locations set area_id = ${areaId} where address = '${address}'`;
    await db.executeQuery(query);
}

export const getAddressArea = async(address: string) => {

    let db = new DB();
    address = sanitizeAddress(address);
    let query = `select area_id from player_locations where address = '${address}'`;
    return await db.executeQueryForSingleResult<{ area_id: number }>(query);

}

export const insertMonster = async(metadata: number, tokenId: string, tokenHash: string) => {
    //monsters
    const MIN_ATTACK = 30;
    const MAX_BASE_ATTACK = 40;
    const MAX_ATTACK = 50;
    const MIN_DEFENSE = 1;
    const MAX_BASE_DEFENSE = 5;
    const MAX_DEFENSE = 10;
    const MIN_HP = 800;
    const MAX_BASE_HP = 2000;
    const MAX_HP = 3000;
    const MIN_CRIT_CHANCE = 10;
    const MAX_BASE_CRIT_CHANCE = 30;
    const MAX_CRIT_CHANCE = 50;
    const MIN_CRIT_MULTIPLIER = 1.25;
    const MAX_BASE_CRIT_MULTIPLIER = 2;
    const MAX_CRIT_MULTIPLIER = 10;

    const db = new DB();
    const table = 'monsters';
    const columns = ['monster_base_metadata_id', 'token_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier', 'is_shiny', 'hash'];
    let values: any[][] = [];
    values.push([
        metadata,
        tokenId,
        getRandomNumber(MIN_ATTACK, MAX_ATTACK),
        getRandomNumber(MIN_DEFENSE, MAX_DEFENSE),
        getRandomNumber(MIN_HP, MAX_HP),
        getRandomNumber(MIN_CRIT_CHANCE, MAX_CRIT_CHANCE),
        getRandomNumber(MIN_CRIT_MULTIPLIER, MAX_CRIT_MULTIPLIER),
        getRandomNumber(0, 1, true) === 1? 'true' : 'false',
        tokenHash
    ]);

    const query = getInsertQuery(columns, values, table, true);
    return await db.executeQueryForSingleResult(query);
}

export const insertMonsterEquippedSkills = async(monsterId: number) => {
    const SEED_EQUIPPED_SKILL_COUNT = 4;

    let db = new DB();
    let table = 'monster_equipped_skills';
    let columns = ['monster_id', 'monster_skill_id'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    let skills: number[] = [];

    for(let j = 0; j < SEED_EQUIPPED_SKILL_COUNT; j++) {
        let skillId = 0;

        do {
            skillId = getRandomNumber(1, nEffects, true);
        } while(skills.includes(skillId));

        skills.push(skillId);
        values.push([monsterId, skillId]);
    }

    let query = getInsertQuery(columns, values, table, true);

    return await db.executeQueryForResults(query);
}

/**
 * Get nft info using moralis api
 * @date 2022-09-29
 * @param { string } chainId
 */
export const getAllNft = async(chainId: string) => {
    // get chain nft contract address
    const chain: any = _.find(chains, { id: chainId });

    if(_.isNil(chain) || !_.has(chain, 'nftContract')) {
        throw Error("Invalid Chain");
    }

    const headers: AxiosRequestHeaders =  {
        'accept': 'application/json',
        'X-API-Key': `${process.env.MORALIS}`
    };

    const config = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/nft/${chain.nftContract}`,
        params: {chain: chainId, format: 'decimal'},
        headers: headers
    }

    const data: any = await axiosCall(headers, config);

    return JSON.stringify(data.result);
}

/**
 * Generate next nft id & hash
 * @date 2022-09-29
 * @param { string } chainId
 */
export const getMintData = async (chainId: string) => {
    // get new id from mysql
    let db = new DB();

    // initiate ethers
    const etherCall = new ContractCall(chainId);
    let checkDB = false, checkContract = false;
    let tokenId;

    // check if token id claimed
    while(!checkDB || !checkContract) {
        // generate token between 16 ~ 32 chars
        tokenId = generateRandomNumberChar(16, 32);
        // checkDB for duplicated tokenId
        const query = `SELECT count(token_id) as count FROM monsters WHERE token_id = '${tokenId}';`;
        const res = await db.executeQueryForSingleResult(query);
        checkDB = Number(res.count) === 0 ? true : false;

        // checkContract
        const claimed = await etherCall.checkNftClaimed(tokenId);
        // if not a valid nextTokenId
        checkContract = claimed == 1 ? false : true;
    }

    // get next meta hash/id (unixtime + nextTokenId + random number salt)
    const salt = getRandomNumber(1, 1000, true);
    const hash = getHash(`${new Date().getTime()}_${tokenId}_${salt}`);

    // const returnData
    const mintData = {
        'id': tokenId,
        'hash': hash
    }

    return mintData;
}