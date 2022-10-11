import { MonsterEquippedSkillById, MonsterStats } from "../../types/Monster";
import { cloneObj, getRandomChance, getRandomNumber} from "../../utils";
import DB from "../DB";
import PlayerMonster from "./PlayerMonster";
import { AttackRes, BaseMonsterConstructor } from "./types";

export default class Base {

    stats: MonsterStats = {
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
        type: "player",
    };
    skills: MonsterEquippedSkillById = {};

    db = new DB();

    onOffCooldown;

    isOnCooldown = false;
    statMultiplier = 1;
    hpMultiplier = 1;
    
    constructor({ onOffCooldown }: BaseMonsterConstructor) {
        this.onOffCooldown = onOffCooldown;
    }

    _applyStats = async (stats: MonsterStats, skills: MonsterEquippedSkillById) => {
        this.stats = stats;
        this.skills = skills;
    }

    _getCritMultiplier = () => {
        // logic -- chance of rolling true is the chance of hitting any number under statCritChance
        // as the chance of hitting that number out of 100 is equals to statCritChance
        let hasCrit = getRandomChance() <= this.stats.crit_chance;
        return hasCrit? this.stats.crit_multiplier : 1;
    }

    _getElementMultiplier = async(attackElementId: number, targetElementId: number) => {
        // OPTIMIZATION: just query once
        let res = await this.db.executeQueryForSingleResult<{ multiplier: number }>(`SELECT multiplier FROM element_multipliers WHERE element_id = ${attackElementId} AND target_element_id = ${targetElementId};`);
        return res?.multiplier ?? 1;
    }

    /**
     * Current stats
     */
    getStats = () => {
        return this.stats;
    }

    /**
     * Stats without wild / boss multiplier
     */
    getBaseStats = () => {
        let stats = cloneObj<MonsterStats>(this.stats);

        if(stats.type !== "player") {
            stats.attack = stats.attack / this.statMultiplier;
            stats.defense = stats.defense / this.statMultiplier;
            stats.hp = stats.hp / (this.hpMultiplier);
        }
        
        return stats;
    }

    getSkills = () => {
        return this.skills;
    }

    attack = async (target: Base, skillId: string, ignoreDeath = false) => {
        let attackRes: AttackRes = { attacks: [], cd: 0, totalDamage: 0, critDamage: 0, hits: 0, crit: 0, misses: 0 };
        if(this.isOnCooldown) {
            return attackRes;
        }

        let skill = this.skills[skillId];
        if(!skill) {
            throw Error("No skills selected!");
        }
        
        this.isOnCooldown = true;

        setTimeout(() => {
            this.isOnCooldown = false;
            this.onOffCooldown();
        }, skill.cooldown * 1000);

        //set cooldown
        attackRes.cd = skill.cooldown;

        if(target.stats.defense >= this.stats.attack) {
            //no damage
            attackRes.attacks.push({
                damage: 0,
                type: "immune",
                element_id: skill.element_id,
            });
            return attackRes;
        }

        let elementMultiplier = await this._getElementMultiplier(skill.element_id, target.stats.element_id);

        for(let i = 0; i < skill.hits; i++) {
            let damage = 0;
            let hit = getRandomChance() <= skill.accuracy;
            if(!hit) {
                //console.log(`${this.stats.name} missed!`);
                //console.log('\n');
                attackRes.attacks.push({
                    damage,
                    type: "miss",
                    element_id: skill.element_id,
                });
                attackRes.misses++;
                continue;
            }
            
            let critMultiplier = this._getCritMultiplier();
            let isCrit = critMultiplier > 1;
            damage = (this.stats.attack - target.stats.defense) * critMultiplier * elementMultiplier;
            attackRes.attacks.push({
                damage,
                type: isCrit? "crit" : "normal",
                element_id: skill.element_id,
            });
            attackRes.hits++;
            attackRes.totalDamage += damage;
            attackRes.critDamage += isCrit? damage : 0;
            attackRes.crit += isCrit? 1 : 0;

            target.receiveDamage(damage);

            //console.log(`${this.stats.name} used ${skill.name} and dealt ${damage.toFixed(2)} damage!${ isCrit? ' !!CRIT!!' : ''}`);

            let effectiveMessage = '';
            if(elementMultiplier > 1) {
                effectiveMessage = "It's super effective!";
            }

            else if(elementMultiplier < 1) {
                effectiveMessage = "It's not very effective";
            }

            if(effectiveMessage) {
                //console.log(effectiveMessage);
            }
            //console.log(`${target.stats.name} has ${target.stats.hp_left.toFixed(2)} hp left`);

            if(!ignoreDeath && target.isDead()) {
                //console.log(`${target.stats.name} died!`);
                break;
            }
            //console.log('\n');
        }

        return attackRes as AttackRes;
    }

    /**
     * For PvE purposes
     * @param playerMonsters array
     */
    attackPlayer = async(playerMonsters: PlayerMonster[]) => {
        if(this.isDead()) {
            return { totalDamage: 0, cd: 0 };
        }
        
        let skillIndex = getRandomNumber(0, Object.keys(this.skills).length - 1, true);
        let playerMonsterIndex = getRandomNumber(0, playerMonsters.length - 1, true);
        
        let target = playerMonsters[playerMonsterIndex];
        let skillId = Object.keys(this.skills)[skillIndex];
        
        let attackRes: AttackRes = await this.attack(target, skillId, true);
        return { totalDamage: attackRes.totalDamage, cd: attackRes.cd };
    }

    //mainly used for bosses and wild encounters
    //returns is dead
    receiveDamage = (incomingDamage: number) => {
        this.stats.hp_left -= incomingDamage;
    }

    isDead = () => {
        return this.stats.hp_left <= 0;
    }
}