import { BSC, POLYGON } from '../ChainConfigs';
import monsterFile from '../../assets/sprites/_monster_sprite_files.json';
import effectFile from '../../assets/effects/_effect_files.json';

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

export const getMonsterBaseMetadataSeeds = () => {
    let columns = [
        'chain_id', 
        'element_type_id',
        'name', 
        'img_file', 
        'shiny_img_file', 
        'shiny_chance', 
        'base_attack', 
        'max_attack', 
        'base_defence', 
        'max_defence', 
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
        let baseDefence = getRandomNumber(1, 5);
        let maxDefence = getRandomNumber(5, 20);
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
            baseDefence,
            maxDefence,
            baseHp,
            maxHp,
            baseCritChance,
            maxCritChance,
            baseCritMultiplier,
            maxCritMultiplier,
        ]);
    }

    return getSeedQuery(columns, values, 'monster_base_metadata');
}

export const getMonsterSkillSeeds = () => {
    let columns = ['element_type_id', 'effect_id', 'name', 'accuracy', 'cooldown', 'multiplier'];
    let values: string[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let elementTypeId = getRandomNumber(1, 4, true); // type 1 - 4
        let effectId = i + 1; // reference current effect

        let skillName = effectFile.file_names[i].replace(/-/g, " ").replace(/(.png)$/, "");
        let accuracy = getRandomChance();
        let cooldown = getRandomNumber(1, 60, true);
        let multiplier = getRandomNumber(0.5, 10);

        values.push([elementTypeId, effectId.toString(), skillName, accuracy, cooldown, multiplier]);
    }

    return getSeedQuery(columns, values, 'monster_skills');
}

export const getEffectSeeds = () => {
    let effectColumns = ['asset_file'];
    let effectValues: string[][] = [];
    let nEffects = effectFile.file_names.length;

    for(let i = 0; i < nEffects; i++) {
        let assetFile = effectFile.file_names[i];
        effectValues.push([assetFile]);
    }

    return getSeedQuery(effectColumns, effectValues, 'monster_skill_effects');
}

export const getMonsterSeeds = () => {
    let columns = ['monster_base_metadata_id', 'token_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier'];
    let values: string[][] = [];
    let maxMonsterId = monsterFile.file_names.length;

    for(let i = 0; i < 100; i++) {
        let monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
        let tokenId = i.toString();
        let attack = getRandomNumber(10, 20);
        let defense = getRandomNumber(1, 10);
        let hp = getRandomNumber(100, 200);
        let crit_chance = getRandomChance();
        let crit_multiplier = getRandomNumber(1, 5);

        values.push([monsterBaseMetadataId, tokenId, attack, defense, hp, crit_chance, crit_multiplier]);
    }

    return getSeedQuery(columns, values, 'monsters');
}

export const getAreaSeeds = () => {
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

    return getSeedQuery(columns, values, 'areas');
}

export const getAreaMonsterSeeds = () => {
    let columns = ['monster_base_metadata_id', 'area_id', 'stat_modifier'];
    let values: string[][] = [];
    let maxMonsterId = monsterFile.file_names.length;
    let maxAreaId = 2;

    let currentAreaMonsters: {[areaId: string] : string[]} = {};

    for(let i = 0; i < 30; i++) {
        let monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
        let areaId = getRandomNumber(1, maxAreaId, true);

        if(!currentAreaMonsters || !currentAreaMonsters[areaId]) {
            currentAreaMonsters[areaId] = [];
        }

        while(currentAreaMonsters[areaId] && currentAreaMonsters[areaId].length > 0 && currentAreaMonsters[areaId].includes(monsterBaseMetadataId)) {
            monsterBaseMetadataId = getRandomNumber(1, maxMonsterId, true);
            areaId = getRandomNumber(1, maxAreaId, true);
        }

        currentAreaMonsters[areaId].push(monsterBaseMetadataId);
        let statModifier = getRandomNumber(2, 4);
        values.push([monsterBaseMetadataId, areaId, statModifier]);
    }


    return getSeedQuery(columns, values, 'area_monsters');
}

export const getElementMultiplierSeeds = () => {
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

    return getSeedQuery(columns, values, 'element_multipliers');
}

export const getElementSeeds = () => {
    let columns = ['name', 'icon_file'];
    let values = [
        ['Grass', ''], 
        ['Fire', ''], 
        ['Water', ''], 
        ['Chaos', ''], 
    ];

    return getSeedQuery(columns, values, 'elements');
}