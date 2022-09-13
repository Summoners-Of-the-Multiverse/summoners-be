import DB from './src/DB';
import dotenv from 'dotenv';
import path from 'path';
import { seedAreaMonsters, seedAreas, seedEffects, seedElementMultiplier, seedElements, seedMonsterMetadata, seedMonsterEquippedSkills, seedMonsters, seedMonsterSKills } from './src/Seeders';

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
    await seedMonsterMetadata(db);
    await seedMonsterSKills(db);
    await seedEffects(db);
    await seedMonsters(db);
    await seedAreas(db);
    await seedAreaMonsters(db);
    await seedElements(db);
    await seedElementMultiplier(db);
    await seedMonsterEquippedSkills(db);

    console.log('Seed ended, press CTRL / CMD + C');
    return;
})();