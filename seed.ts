import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env')});

import { seedAreaMonsters, seedAreas, seedEffects, seedElementMultiplier, seedElements, seedMonsterMetadata, seedMonsterEquippedSkills, seedMonsters, seedMonsterSkills, seedPlayerEquippedMonsters, seedClaimedAddressAndArea } from './src/Seeders';

(async() => {
    await seedMonsterMetadata();
    await seedMonsterSkills();
    await seedEffects();
    await seedMonsters();
    await seedAreas();
    await seedAreaMonsters();
    await seedElements();
    await seedElementMultiplier();
    await seedMonsterEquippedSkills();
    await seedPlayerEquippedMonsters(JSON.parse(process.env.SEED_ADDRESSES!));
    await seedClaimedAddressAndArea();

    console.log('Seed ended, press CTRL / CMD + C');
    return;
})();