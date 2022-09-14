import { BSC, POLYGON } from '../ChainConfigs';
import monsterFile from '../../assets/sprites/_monster_sprite_files.json';
import effectFile from '../../assets/effects/_effect_files.json';
import DB from '../DB';

const SEED_MONSTER_COUNT = 100;
const SEED_EQUIPPED_SKILL_COUNT = 4;
const SEED_AREA_MONSTER_COUNT = 30;



const getRandomChance = () => {
    return getRandomNumber(0, 100);
}

const getRandomNumber = (min: number, max: number, isInteger = false) => {
    let rand = min + (Math.random() * (max - min));
    if(isInteger) {
        rand = Math.round(rand);
    }
    return rand.toString();
}

const getSeedQuery = (columns: string[], values: string[][], table: string, schema: string = "public") => {
    let columnString = columns.join(",");
    let valueString = "";

    for(let value of values) {
        valueString +=  "('" + value.join("','") + "'),";
    }

    //remove last comma
    valueString = valueString.substring(0, valueString.length - 1);

    return `INSERT INTO ${schema}.${table} (${columnString}) VALUES ${valueString};`;
}

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
        'element_type_id',
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
    let values: string[][] = [];
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
        let baseAttack = getRandomNumber(1, 5);
        let maxAttack = getRandomNumber(5, 20);
        let baseDefense = getRandomNumber(1, 5);
        let maxDefense = getRandomNumber(5, 20);
        let baseHp = getRandomNumber(1, 5);
        let maxHp = getRandomNumber(5, 20);
        let baseCritChance = getRandomNumber(1, 5);
        let maxCritChance = getRandomNumber(5, 20);
        let baseCritMultiplier = getRandomNumber(1, 1.1);
        let maxCritMultiplier = getRandomNumber(1.1, 5);

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

    let query = getSeedQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}

export const seedMonsterSKills = async() => {
    let db = new DB();
    let table = 'monster_skills';
    let checkerQuery = `SELECT COUNT(*) as count FROM ${table}`;
    let checkerRes = await db.executeQueryForResults<{count: number}>(checkerQuery);

    if(checkerRes && checkerRes[0].count > 0) {
        console.log(`${table} already seeded! Skipping..`);
        return;
    }

    let columns = ['element_type_id', 'effect_id', 'name', 'hits', 'accuracy', 'cooldown', 'multiplier'];
    let values: string[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let elementTypeId = getRandomNumber(1, 4, true); // type 1 - 4
        let effectId = i + 1; // reference current effect

        let skillName = effectFile.file_names[i].replace(/-/g, " ").replace(".gif", "");
        let hits = getRandomNumber(1, 10, true);
        let accuracy = getRandomChance();
        let cooldown = getRandomNumber(1, 60, true);
        let multiplier = getRandomNumber(0.5, 10);

        values.push([elementTypeId, effectId.toString(), skillName, hits, accuracy, cooldown, multiplier]);
    }

    let query = getSeedQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
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
    let effectValues: string[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let assetFile = effectFile.file_names[i];
        effectValues.push([assetFile]);
    }

    let query = getSeedQuery(effectColumns, effectValues, table);
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
    let values: string[][] = [];
    let maxMonsterId = monsterFile.file_names.length;

    for(let i = 0; i < SEED_MONSTER_COUNT; i++) {
        let monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
        let tokenId = (i + 1).toString();
        let attack = getRandomNumber(10, 20);
        let defense = getRandomNumber(1, 10);
        let hp = getRandomNumber(100, 200);
        let crit_chance = getRandomChance();
        let crit_multiplier = getRandomNumber(1, 5);
        let isShiny = getRandomNumber(0, 1, true) == '1'? 'true' : 'false';

        values.push([monsterBaseMetadataId, tokenId, attack, defense, hp, crit_chance, crit_multiplier, isShiny]);
    }

    let query = getSeedQuery(columns, values, table);
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
    let values: string[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < SEED_MONSTER_COUNT; i++) {
        let monsterId = (i + 1).toString();
        let skills: string[] = [];

        for(let j = 0; j < SEED_EQUIPPED_SKILL_COUNT; j++) {
            let skillId = "";

            do {
                skillId = getRandomNumber(1, nEffects, true);
            } while(skills.includes(skillId));

            values.push([monsterId, skillId]);
        }
    }

    let query = getSeedQuery(columns, values, table);
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

    let query = getSeedQuery(columns, values, table);
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
    let values: string[][] = [];
    let maxMonsterId = monsterFile.file_names.length;
    let maxAreaId = 2;

    let currentAreaMonsters: {[areaId: string] : string[]} = {};

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


    let query = getSeedQuery(columns, values, table);
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

    let columns = ['element_type_id', 'against_element_type_id', 'multiplier'];
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

    let query = getSeedQuery(columns, values, table);
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

    let query = getSeedQuery(columns, values, table);
    try {
        await db.executeQuery(query);
        console.log(`Seeded ${table}`);
        return true;
    }

    catch {
        return false;
    }
}