import { BSC, POLYGON } from '../ChainConfigs';
import monsterFile from '../../assets/sprites/_monster_sprite_files.json';
import effectFile from '../../assets/effects/_effect_files.json';
import DB from '../DB';
import { getInsertQuery, getRandomChance, getRandomNumber } from '../../utils';

const SEED_MONSTER_COUNT = 100;
const SEED_EQUIPPED_SKILL_COUNT = 4;
const SEED_AREA_MONSTER_COUNT = 30;

//monsters
const MIN_ATTACK = 30;
const MAX_BASE_ATTACK = 40;
const MAX_ATTACK = 50;
const MIN_DEFENSE = 1;
const MAX_BASE_DEFENSE = 5;
const MAX_DEFENSE = 10;
const MIN_HP = 500;
const MAX_BASE_HP = 750;
const MAX_HP = 1000;
const MIN_CRIT_CHANCE = 10;
const MAX_BASE_CRIT_CHANCE = 30;
const MAX_CRIT_CHANCE = 50;
const MIN_CRIT_MULTIPLIER = 1.25;
const MAX_BASE_CRIT_MULTIPLIER = 2;
const MAX_CRIT_MULTIPLIER = 10;

//skills
const MIN_HITS = 1;
const MAX_HITS = 10;
const MIN_CD = 5;
const MAX_CD = 60;
const MIN_ACCURACY = 60;
const MAX_ACCURACY = 100;
const MIN_SKILL_MULTIPLIER = 0.25;
const MAX_SKILL_MULTIPLIER = 5;

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

    for(let i = 0; i < nMonsters; i++) {
        let chainId = i < (nMonsters / 2)? BSC.id : POLYGON.id;
        let elementId = getRandomNumber(1, 4, true);
        let name = monsterFile.file_names[i];
        name = name.replace(/_/g, " ").replace(".png", "");

        let imageName = monsterFile.file_names[i];
        let imageFile = imageName.replace(".png", "_ori.png");
        let shinyImageFile = imageName.replace(".png", "_shiftA.png");
        let shinyChance = getRandomChance();
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
            imageFile, 
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

    let columns = ['element_id', 'effect_id', 'name', 'hits', 'accuracy', 'cooldown', 'multiplier'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let elementTypeId = getRandomNumber(1, 4, true); // type 1 - 4
        let effectId = i + 1; // reference current effect

        let skillName = effectFile.file_names[i].replace(/-/g, " ").replace(".gif", "");
        let hits = getRandomNumber(MIN_HITS, MAX_HITS, true);
        let accuracy = getRandomNumber(MIN_ACCURACY, MAX_ACCURACY, true);
        let cooldown = getRandomNumber(MIN_CD, MAX_CD, true);
        let multiplier = getRandomNumber(MIN_SKILL_MULTIPLIER, MAX_SKILL_MULTIPLIER);

        values.push([elementTypeId, effectId.toString(), skillName, hits, accuracy, cooldown, multiplier]);
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
        let assetFile = effectFile.file_names[i];
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

    let columns = ['monster_base_metadata_id', 'token_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier', 'is_shiny'];
    let values: any[][] = [];
    let maxMonsterId = monsterFile.file_names.length;

    for(let i = 0; i < SEED_MONSTER_COUNT; i++) {
        let monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
        let tokenId = (i + 1).toString();
        let attack = getRandomNumber(MIN_ATTACK, MAX_ATTACK);
        let defense = getRandomNumber(MIN_DEFENSE, MAX_DEFENSE);
        let hp = getRandomNumber(MIN_HP, MAX_HP);
        let crit_chance = getRandomNumber(MIN_CRIT_CHANCE, MAX_CRIT_CHANCE);
        let crit_multiplier = getRandomNumber(MIN_CRIT_MULTIPLIER, MAX_CRIT_MULTIPLIER);
        let isShiny = getRandomNumber(0, 1, true) === 1? 'true' : 'false';

        values.push([monsterBaseMetadataId, tokenId, attack, defense, hp, crit_chance, crit_multiplier, isShiny]);
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
        ['Sunken City'], 
        ['Underworld'], 
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

    let columns = ['monster_base_metadata_id', 'area_id', 'stat_modifier'];
    let values: any[][] = [];
    let maxMonsterId = monsterFile.file_names.length;
    let maxAreaId = 2;

    let currentAreaMonsters: {[areaId: string] : number[]} = {};

    for(let i = 0; i < SEED_AREA_MONSTER_COUNT; i++) {
        let monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
        let areaId = getRandomNumber(1, maxAreaId, true);

        if(!currentAreaMonsters || !currentAreaMonsters[areaId]) {
            currentAreaMonsters[areaId] = [];
        }

        while(currentAreaMonsters[areaId] && currentAreaMonsters[areaId].length > 0 && currentAreaMonsters[areaId].includes(monsterBaseMetadataId)) {
            monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
            areaId = getRandomNumber(1, maxAreaId, true);
        }
        
        console.log(currentAreaMonsters);
        currentAreaMonsters[areaId].push(monsterBaseMetadataId);
        let statModifier = getRandomNumber(2, 4);
        values.push([monsterBaseMetadataId, areaId, statModifier]);
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
    let chains = [BSC.id, POLYGON.id];

    let monsterIds: number[] = [];

    for(let address of addresses) {
        for(let chain of chains) {
            // 4 monsters for each chain for each address
            for(let i = 0; i < 4; i++){
                let monsterId = 0;
                do {
                    monsterId = getRandomNumber(1, 100, true);
                } while(monsterIds.includes(monsterId));
                values.push([address, monsterId, chain]);
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