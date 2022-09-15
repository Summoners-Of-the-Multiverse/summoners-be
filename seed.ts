import { seedAreaMonsters, seedAreas, seedEffects, seedElementMultiplier, seedElements, seedMonsterMetadata, seedMonsterEquippedSkills, seedMonsters, seedMonsterSkills } from './src/Seeders';

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

    console.log('Seed ended, press CTRL / CMD + C');
    return;
})();