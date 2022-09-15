import { MonsterEquippedSkillById, MonsterStats } from "../../types/Monster";
import { getRandomChance} from "../../utils";
import DB from "../DB";
import { BaseMonsterConstructor } from "./types";

export default class Base {

    stats: MonsterStats = {
        name: "",
        img_file: "",
        attack: 0,
        defense: 0,
        hp: 0,
        element_id: 0,
        element_file: "",
        element_name: "",
        crit_chance: 0,
        crit_multiplier: 0,
        is_shiny: false
    };
    skills: MonsterEquippedSkillById = {};

    db = new DB();

    onReady: () => void = () => {};
    onCooldown: () => void = () => {};

    isOnCooldown = false;
    
    constructor({ onReady, onCooldown }: BaseMonsterConstructor) {
        this.onReady = onReady;
        this.onCooldown = onCooldown;
    }

    _applyStats = async (stats: MonsterStats, skills: MonsterEquippedSkillById) => {
        this.stats = stats;
        this.skills = skills;
        this.onReady();
    }

    _getCritMultiplier = () => {
        // logic -- chance of rolling true is the chance of hitting any number under statCritChance
        // as the chance of hitting that number out of 100 is equals to statCritChance
        let hasCrit = getRandomChance() <= this.stats.crit_chance;
        return hasCrit? this.stats.crit_multiplier : 1;
    }

    _getElementMultiplier = async(attackElementId: number, targetElementId: number) => {
        let res = await this.db.executeQueryForSingleResult<{ multiplier: number }>(`SELECT multiplier FROM element_multipliers WHERE element_id = ${attackElementId} AND target_element_id = ${targetElementId};`);
        return res?.multiplier ?? 1;
    }

    getStats = () => {
        return this.stats;
    }

    getSkills = () => {
        return this.skills;
    }

    attack = async (target: Base, skillId: string) => {
        if(this.isOnCooldown) {
            return;
        }

        let skill = this.skills[skillId];
        this.isOnCooldown = true;

        setTimeout(() => {
            this.isOnCooldown = false;
            this.onCooldown();
        }, skill.cooldown * 1000);

        if(target.stats.defense >= this.stats.attack) {
            //no damage
            return;
        }

        let elementMultiplier = await this._getElementMultiplier(skill.element_id, target.stats.element_id);
        let attacks: number [] = [];

        for(let i = 0; i < skill.hits; i++) {
            let damage = 0;
            let hit = getRandomChance() <= skill.accuracy;
            if(!hit) {
                console.log(`${this.stats.name} missed!`);
                console.log('\n');
                attacks.push(damage);
                continue;
            }
            
            let critMultiplier = this._getCritMultiplier();
            damage = (this.stats.attack - target.stats.defense) * critMultiplier * elementMultiplier;
            attacks.push(damage);
            target.receiveDamage(damage);

            console.log(`${this.stats.name} used ${skill.name} and dealt ${damage.toFixed(2)} damage!${ critMultiplier > 1? ' !!CRIT!!' : ''}`);

            let effectiveMessage = '';
            if(elementMultiplier > 1) {
                effectiveMessage = "It's super effective!";
            }

            else if(elementMultiplier < 1) {
                effectiveMessage = "It's not very effective";
            }

            if(effectiveMessage) {
                console.log(effectiveMessage);
            }
            console.log(`${target.stats.name} has ${target.stats.hp.toFixed(2)} hp left`);

            if(target.isDead()) {
                console.log(`${target.stats.name} died!`);
                break;
            }
            console.log('\n');
        }

        return attacks;
    }

    //mainly used for bosses and wild encounters
    //returns is dead
    receiveDamage = (incomingDamage: number) => {
        this.stats.hp = this.stats.hp - incomingDamage;
    }

    isDead = () => {
        return this.stats.hp <= 0;
    }
}