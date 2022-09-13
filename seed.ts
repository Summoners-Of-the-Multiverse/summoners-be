import DB from './src/DB';
import dotenv from 'dotenv';
import path from 'path';
import { getAreaMonsterSeeds, getAreaSeeds, getEffectSeeds, getElementMultiplierSeeds, getElementSeeds, getMonsterBaseMetadataSeeds, getMonsterSeeds, getMonsterSkillSeeds } from './src/Seeders';

dotenv.config({ path: path.join(__dirname, '.env')});

const DB_USER = process.env.DB_USER ?? "";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
const DB_HOST = process.env.DB_HOST ?? "";
const DB_PORT = process.env.DB_PORT ?? "5432";
const DB_NAME = process.env.DB_NAME ?? "";

let db = new DB({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT),
    database: DB_NAME,
});

(async() => {
    let checkerQuery = `SELECT COUNT(*) as count FROM areas`;
    let checkerRes = await db.executeQueryForResults<{ count: number }>(checkerQuery);

    if(checkerRes && checkerRes.length > 0 && checkerRes[0].count > 0) {
        console.error('Already Seeded');
        return;
    }

    let monsterMetadataSeed = getMonsterBaseMetadataSeeds();
    await db.executeQuery(monsterMetadataSeed);
    console.log('Seeded monster metadata');

    let monsterSkillSeed = getMonsterSkillSeeds();
    await db.executeQuery(monsterSkillSeed);
    console.log('Seeded monster skills');
    
    let effectSeed = getEffectSeeds();
    await db.executeQuery(effectSeed);
    console.log('Seeded monster skill effects');
    
    let monsterSeed = getMonsterSeeds();
    await db.executeQuery(monsterSeed);
    console.log('Seeded monsters');
    
    let areaSeed = getAreaSeeds();
    await db.executeQuery(areaSeed);
    console.log('Seeded areas');
    
    let areaMonsterSeed = getAreaMonsterSeeds();
    await db.executeQuery(areaMonsterSeed);
    console.log('Seeded area monsters');
    
    let elementSeed = getElementSeeds();
    await db.executeQuery(elementSeed);
    console.log('Seeded elements');
    
    let elementMultiplierSeed = getElementMultiplierSeeds();
    await db.executeQuery(elementMultiplierSeed);
    console.log('Seeded element multipliers');
    

    console.log('Seed ended, press CTRL / CMD + C');
    return;
})();