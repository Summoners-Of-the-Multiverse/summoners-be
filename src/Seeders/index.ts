import { BSC, POLYGON, BSC_TEST, POLYGON_TEST } from '../ChainConfigs';
import monsterFile from '../../assets/sprites/_monster_sprite_files.json';
import effectFile from '../../assets/effects/_effect_files.json';
import skillIconsFile from '../../assets/skills/_skill_icon_files.json';
import DB from '../DB';

import { getInsertQuery, getRandomNumber, getHash } from '../../utils';
import _ from 'lodash';
import { insertClaimedAddress, moveAddressTo } from '../API';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env')});
import { MonsterBaseMetadata } from '../API/types';

const isTestnet = process.env.CHAIN_ENV === "testnet"
const SEED_MONSTER_COUNT = 100;
const SEED_EQUIPPED_SKILL_COUNT = 4;

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

//skills
const MIN_HITS = 2;
const MAX_HITS = 10;
const MIN_CD = 2;
const MAX_CD = 5;
const MIN_ACCURACY = 80;
const MAX_ACCURACY = 100;
const MIN_SKILL_MULTIPLIER = 0.5;
const MAX_SKILL_MULTIPLIER = 5;

//areas
const MAX_AREA_ID = 8;

export const seedMonsterMetadata = async() => {
    let db = new DB();
    let table = 'monster_base_metadata';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = [
        'chain_id',
        'element_id',
        'name',
        'img_file',
        'shiny_img_file',
        'shiny_chance',
        'base_attack',
        'max_attack',
        'base_defense',
        'max_defense',
        'base_hp',
        'max_hp',
        'base_crit_chance',
        'max_crit_chance',
        'base_crit_multiplier',
        'max_crit_multiplier',
    ];
    let values: any[][] = [];
    let nMonsters = monsterFile.file_names.length;
    const chainIds = isTestnet ? [BSC_TEST.id, POLYGON_TEST.id] : [BSC.id, POLYGON.id];

    for(let elementId = 1; elementId <= 4; elementId++) {
        for(let i = 0; i < nMonsters; i++) {
            let chainId = chainIds[i%chainIds.length];
            let {name, file} = monsterFile.file_names[i];

            //currently unused
            let shinyImageFile = file.replace(".png", "_shiny.png");
            let shinyChance = getRandomNumber(0, 5); //5% chance max
            let baseAttack = getRandomNumber(MIN_ATTACK, MAX_BASE_ATTACK);
            let maxAttack = getRandomNumber(MAX_BASE_ATTACK, MAX_ATTACK);
            let baseDefense = getRandomNumber(MIN_DEFENSE, MAX_BASE_DEFENSE);
            let maxDefense = getRandomNumber(MAX_BASE_DEFENSE, MAX_DEFENSE);
            let baseHp = getRandomNumber(MIN_HP, MAX_BASE_HP);
            let maxHp = getRandomNumber(MAX_BASE_HP, MAX_HP);
            let baseCritChance = getRandomNumber(MIN_CRIT_CHANCE, MAX_BASE_CRIT_CHANCE);
            let maxCritChance = getRandomNumber(MAX_BASE_CRIT_CHANCE, MAX_CRIT_CHANCE);
            let baseCritMultiplier = getRandomNumber(MIN_CRIT_MULTIPLIER, MAX_BASE_CRIT_MULTIPLIER);
            let maxCritMultiplier = getRandomNumber(MAX_BASE_CRIT_MULTIPLIER, MAX_CRIT_MULTIPLIER);

            values.push([
                chainId,
                elementId,
                name,
                file,
                shinyImageFile,
                shinyChance,
                baseAttack,
                maxAttack,
                baseDefense,
                maxDefense,
                baseHp,
                maxHp,
                baseCritChance,
                maxCritChance,
                baseCritMultiplier,
                maxCritMultiplier,
            ]);
        }
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch (e){
        console.log(e);
        return false;
    }
}

export const seedMonsterSkills = async() => {
    let db = new DB();
    let table = 'monster_skills';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['element_id', 'effect_id', 'name', 'hits', 'accuracy', 'cooldown', 'multiplier', 'icon_file'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let elementTypeId = getRandomNumber(1, 4, true); // type 1 - 4
        let effectId = i + 1; // reference current effect

        let skillName = effectFile.file_names[i].name;
        let hits = getRandomNumber(MIN_HITS, MAX_HITS, true);
        let accuracy = getRandomNumber(MIN_ACCURACY, MAX_ACCURACY, true);
        let cooldown = getRandomNumber(MIN_CD, MAX_CD, true);
        let multiplier = getRandomNumber(MIN_SKILL_MULTIPLIER, MAX_SKILL_MULTIPLIER);

        let iconFileIndex = getRandomNumber(0, skillIconsFile.file_names.length - 1, true);
        let iconFile = skillIconsFile.file_names[iconFileIndex];

        values.push([elementTypeId, effectId.toString(), skillName, hits, accuracy, cooldown, multiplier, iconFile]);
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch (e){
        console.log(e);
        return false;
    }
}

export const seedEffects = async() => {
    let db = new DB();
    let table = 'monster_skill_effects';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let effectColumns = ['asset_file'];
    let effectValues: any[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let assetFile = effectFile.file_names[i].effect_file;
        effectValues.push([assetFile]);
    }

    let query = getInsertQuery(effectColumns, effectValues, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedMonsters = async() => {
    let db = new DB();
    let table = 'monsters';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['monster_base_metadata_id', 'token_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier', 'is_shiny', 'hash'];
    let values: any[][] = [];
    let maxMonsterId = monsterFile.file_names.length * 4;

    // hardcoded token id for wallet
    const testerTokenId: any = [];

    for(let i = 0; i < SEED_MONSTER_COUNT; i++) {
        let monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
        let tokenId = i < testerTokenId.length ? testerTokenId[i] : (i + 1).toString();
        let attack = getRandomNumber(MIN_ATTACK, MAX_ATTACK);
        let defense = getRandomNumber(MIN_DEFENSE, MAX_DEFENSE);
        let hp = getRandomNumber(MIN_HP, MAX_HP);
        let crit_chance = getRandomNumber(MIN_CRIT_CHANCE, MAX_CRIT_CHANCE);
        let crit_multiplier = getRandomNumber(MIN_CRIT_MULTIPLIER, MAX_CRIT_MULTIPLIER);
        let isShiny = getRandomNumber(0, 1, true) === 1? 'true' : 'false';
        const salt = getRandomNumber(1, 1000, true);
        let hash = getHash(`${new Date().getTime()}_${tokenId}_${salt}`)
        values.push([monsterBaseMetadataId, tokenId, attack, defense, hp, crit_chance, crit_multiplier, isShiny, hash]);
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedMonsterEquippedSkills = async() => {
    let db = new DB();
    let table = 'monster_equipped_skills';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['monster_id', 'monster_skill_id'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < SEED_MONSTER_COUNT; i++) {
        let monsterId = (i + 1).toString();
        let skills: number[] = [];

        for(let j = 0; j < SEED_EQUIPPED_SKILL_COUNT; j++) {
            let skillId = 0;

            do {
                skillId = getRandomNumber(1, nEffects, true);
            } while(skills.includes(skillId));

            skills.push(skillId);
            values.push([monsterId, skillId]);
        }
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedAreas = async() => {
    let db = new DB();
    let table = 'areas';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['name'];
    let values = [
        ['Novice Village'],
        ['Haunted Forest'],
        ['Big Grassland'],
        ['Volcano Sideway'],
        ['Underworld'],
        ['Sunken City'],
        ['Island'],
        ['Sky City'],
    ];

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedAreaMonsters = async() => {
    let db = new DB();
    let table = 'area_monsters';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let chains = isTestnet ? [BSC_TEST.id, POLYGON_TEST.id] : [BSC.id, POLYGON.id] ;

    for(let chain of chains) {
        let monstersQuery = `select * from monster_base_metadata where chain_id = '${chain}' order by max_hp, max_attack, max_defense`;
        let monsterRes = await db.executeQueryForResults<MonsterBaseMetadata>(monstersQuery);

        if(!monsterRes) {
            return false;
        }

        let columns = ['monster_base_metadata_id', 'area_id', 'stat_modifier'];
        let values: any[][] = [];
        let numMonsters = monsterRes.length;

        for(let areaId = 1; areaId <= MAX_AREA_ID; areaId++) {
            // area per monster + if area id = 1 then add remainder
            let thisAreaNumMonter = Math.floor(numMonsters / MAX_AREA_ID) + (areaId === 1? numMonsters % MAX_AREA_ID : 0);
            for(let index = 0; index < thisAreaNumMonter; index++) {
                values.push([monsterRes[index].id, areaId, '1']);
            }
        }


        let query = getInsertQuery(columns, values, table);
        try {
            await db.executeQuery(query);
        }

        catch (e) {
            console.log('Error seeding area monsters');
            return false;
        }
    }
    console.log(`Seeded ${table}`);
    return true;
}

export const seedElementMultiplier = async() => {
    let db = new DB();
    let table = 'element_multipliers';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['element_id', 'target_element_id', 'multiplier'];
    let values = [
        ['1', '1', '0.5'],
        ['1', '2', '0.25'],
        ['1', '3', '2'],
        ['1', '4', '1'],

        ['2', '1', '2'],
        ['2', '2', '0.5'],
        ['2', '3', '0.25'],
        ['2', '4', '1'],

        ['3', '1', '0.25'],
        ['3', '2', '2'],
        ['3', '3', '0.5'],
        ['3', '4', '1'],

        ['4', '1', '1'],
        ['4', '2', '1'],
        ['4', '3', '1'],
        ['4', '4', '1'],
    ];

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedElements = async() => {
    let db = new DB();
    let table = 'elements';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['name', 'icon_file'];
    let values = [
        ['Grass', ''],
        ['Fire', ''],
        ['Water', ''],
        ['Chaos', ''],
    ];

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedPlayerEquippedMonsters = async(addresses: string[]) => {
    let db = new DB();
    let table = 'player_monsters';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }
    let columns = ['address', 'monster_id', 'chain_id'];
    let values: any[][] = [];
    let chains = isTestnet ? [BSC_TEST.id, POLYGON_TEST.id] : [BSC.id, POLYGON.id] ;

    let monsterIds: number[] = [];

    for(let address of addresses) {
        for(let chain of chains) {
            // 4 monsters for each chain for each address
            for(let i = 0; i < 4; i++){
                let monsterId = 0;
                do {
                    monsterId = getRandomNumber(1, 100, true);
                } while(monsterIds.includes(monsterId));

                monsterIds.push(monsterId);
                values.push([address.toLowerCase(), monsterId, chain]);
            }
        }
    }

    let query = getInsertQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedClaimedAddressAndArea = async() => {
    const addresses = JSON.parse(process.env.SEED_ADDRESSES!);

    // insert claim
    await Promise.all(_.map(addresses, async(ad, adIndex) => {
        await insertClaimedAddress(ad.toLowerCase());
        await moveAddressTo(ad.toLowerCase(), 1);
    }));
}