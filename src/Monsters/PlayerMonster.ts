import { MonsterEquippedSkill, MonsterEquippedSkillById, MonsterStats } from "../../types/Monster";
import Base from "./Base";
import { PlayerMonsterConstructor } from "./types";

export default class PlayerMonster extends Base {

    onLoad;
    tokenId;

    constructor({ onLoad, onOffCooldown, tokenId }: PlayerMonsterConstructor) {
        super({ onOffCooldown });
        this.tokenId = tokenId;
        this.onLoad = onLoad;
        this.applyStats();
    }

    applyStats = async() => {
        let playerMonsterRes = await this.db.executeQueryForSingleResult<MonsterStats>(`
            SELECT 
                mb."name",
                CASE WHEN mt.is_shiny THEN mb.shiny_img_file ELSE mb.img_file END as img_file,
                attack,
                defense,
                hp,
                hp as hp_left,
                element_id,
                crit_chance,
                crit_multiplier,
                e.name as element_name,
                e.icon_file as element_file,
                'player' as type
            FROM monsters mt
            JOIN monster_base_metadata mb
            ON mt.monster_base_metadata_id = mb.id
            JOIN elements e
            ON mb.element_id = e.id
            WHERE mt.id = ${this.tokenId}`);

        if(!playerMonsterRes) {
            throw new Error("Unable to find player monster");
        }

        let playerMonsterEquippedSkills = await this.db.executeQueryForResults<MonsterEquippedSkill>(`
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
            FROM monster_equipped_skills mes
            JOIN monster_skills ms
            ON ms.id = mes.monster_skill_id
            JOIN monster_skill_effects mse
            ON mse.id = ms.effect_id
            JOIN elements e
            ON e.id = ms.element_id
            WHERE mes.monster_id = ${this.tokenId}`);

        if(!playerMonsterEquippedSkills || playerMonsterEquippedSkills.length === 0) {
            throw new Error("Cant find player skills");
        }

        let skills: MonsterEquippedSkillById = {};
        for(let playerMonsterEquippedSkill of playerMonsterEquippedSkills) {
            skills[playerMonsterEquippedSkill.id] = playerMonsterEquippedSkill;
        }

        this._applyStats(playerMonsterRes, skills);
        this.onLoad(this);
    }
}