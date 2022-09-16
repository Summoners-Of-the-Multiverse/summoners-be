import { MonsterBaseMetadata, MonsterEquippedSkill, MonsterEquippedSkillById, MonsterStats } from "../../types/Monster";
import { getRandomChance, getRandomNumber } from "../../utils";
import Base, { bossHpMultiplier, bossMultiplier } from "./Base";
import { MonsterConstructor } from "./types";

export default class BossMonster extends Base {

    onLoad;
    metadataId;

    constructor({ onLoad, onOffCooldown, metadataId }: MonsterConstructor) {
        super({ onOffCooldown });
        this.metadataId = metadataId;
        this.onLoad = onLoad;
        this.applyStats();
    }

    applyStats = async() => {
        //boss or wild
        //get metadata
        let metadata = await this.db.executeQueryForSingleResult<MonsterBaseMetadata>(`
            SELECT 
                mb.*,
                e.name as element_name,
                e.icon_file as element_file
            FROM monster_base_metadata mb
            JOIN elements e
            ON e.id = mb.element_id
            WHERE mb.id = ${this.metadataId}
        `);

        if(!metadata) {
            throw new Error("Cant find metadata");
        }

        let {
            name,
            shiny_chance,
            element_id,
            img_file,
            shiny_img_file,
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
            element_file,
            element_name,
        } = metadata;

        let isShiny = getRandomChance() <= shiny_chance;
        let stats: MonsterStats = {
            name: "",
            img_file: "",
            attack: 0,
            defense: 0,
            hp: 0,
            hp_left: 0,
            element_id: 0,
            element_file: "",
            element_name: "",
            crit_chance: 0,
            crit_multiplier: 0,
            is_shiny: false,
            type: "boss",
        };

        stats.name = name;
        stats.img_file = isShiny? shiny_img_file : img_file;
        stats.is_shiny = isShiny;
        stats.element_id = element_id;
        stats.element_file = element_file;
        stats.element_name = element_name;
        stats.attack = getRandomNumber(base_attack, max_attack, true) * bossMultiplier;
        stats.defense = getRandomNumber(base_defense, max_defense, true) * bossMultiplier;
        stats.hp = getRandomNumber(base_hp, max_hp, true) * bossMultiplier * bossHpMultiplier;
        stats.hp_left = stats.hp;
        stats.crit_chance = getRandomNumber(base_crit_chance, max_crit_chance, true);
        stats.crit_multiplier = getRandomNumber(base_crit_multiplier, max_crit_multiplier);

        let allSkillsQuery = `
            SELECT 
                ms.id,
                ms.name,
                e.name as element_name,
                e.icon_file as element_file,
                hits,
                accuracy,
                cooldown,
                multiplier,
                asset_file as effect_file
            FROM monster_skills ms
            JOIN monster_skill_effects mse
            ON mse.id = ms.effect_id
            JOIN elements e
            ON e.id = ms.element_id`;
        let allSkillsRes = await this.db.executeQueryForResults<MonsterEquippedSkill>(allSkillsQuery);

        if(!allSkillsRes || allSkillsRes.length === 0) {
            throw new Error("Cant find skills");
        }

        let skills: MonsterEquippedSkillById = {};

        //get 4 random skills
        for(let j = 0; j < 4; j++) {
            let skillId = -1;

            do {
                skillId = getRandomNumber(1, allSkillsRes.length - 1, true); // cause it's index
            } while(skills[skillId] && allSkillsRes[skillId]);
            
            skills[skillId] = allSkillsRes[skillId];
        }

        this._applyStats(stats, skills);
        this.onLoad(this);
    }
}