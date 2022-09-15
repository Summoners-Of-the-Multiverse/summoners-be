import { Server, Socket } from "socket.io";
import { MonsterEquippedSkillById, MonsterStats, MonsterType } from "../../types/Monster";
import { getInsertQuery, getUTCDatetime } from "../../utils";
import DB from "../DB";
import { BossMonster, getPlayerMonsters, getRandomAreaMonsterBaseMetadataId, PlayerMonster, WildMonster } from "../Monsters";
import { BattleConstructor, RoomEvent, SkillUsage } from "./types";

const BATTLE_DELAY = 5; // 5 seconds delay for wild/boss battles

export class Battle {
    io: Server;
    client: Socket;
    room: string;
    battle_id: number = 0;

    encounter: BossMonster | WildMonster | undefined;
    playerMonsters: { [id: number]: PlayerMonster } = {};
    playerMonsterCount: number = 0;
    address: string;
    areaId: number;
    chainId: string;
    type: MonsterType;

    skillUsage: SkillUsage = {};

    encounterReady: boolean = false;
    playerReady: boolean = false;
    playerCumulativeHp: number = 0;

    onPromptDelete;

    db = new DB();

    constructor({ io, client, address, areaId, chainId, type, onPromptDelete }: BattleConstructor) {
        this.io = io;
        this.client = client;
        this.room = `battle_${address}`;

        this.address = address;
        this.areaId = areaId;
        this.chainId = chainId;
        this.type = type;

        this._joinRoom();
        this._getEncounter();
        this._listenToRoomDestruction();
        this.onPromptDelete = onPromptDelete;
    }

    /**
     * Emits events to this room
     * 
     * @param event 
     * @param value 
     */
    _emitEvent = (event: string, value: any) => {
        this.io.to(this.room).emit(event, value);
    }

    //puts client into battle room
    _joinRoom = async() => {
        if(this.io.sockets.adapter.rooms.get(this.room)) {
            throw new Error("There is an ongoing battle");
        }

        this.client.join(this.room);
    }

    _destroyRoom = () => {
        this.io.in(this.room).socketsLeave(this.room);
    }

    /**
     * Triggers when player leaves room or battle ended
     */
    _listenToRoomDestruction = () => {
        this.io.sockets.adapter.on('delete-room', async(room) => {
            if(room === this.room) {
                /** log battle */
                let columns = ['pve_battle_id', 'skill_id', 'monster_id', 'total_damage_dealt', 'crit_damage_dealt', 'hits', 'misses'];
                let values: any[][] = [];

                if(Object.keys(this.skillUsage).length === 0){
                    //no battle occured
                    return;
                }
                
                for(const [monsterId, skills] of Object.entries(this.skillUsage)) {
                    if(Object.keys(skills).length === 0) {
                        continue;
                    }

                    for(const [skillId, stats] of Object.entries(skills)) {
                        values.push([this.battle_id, skillId, monsterId, stats.damage, stats.crit_damage, stats.hit, stats.miss]);
                    }
                }

                if(values.length === 0) {
                    //no battle occured
                    return;
                }

                let query = getInsertQuery(columns, values, 'pve_battle_skills_used');
                await this.db.executeQuery(query);
                this.onPromptDelete();
            }
        });
    }

    _listenToRoomEvents = () => {
        this.io.on(this.room, async({ type, value }: RoomEvent) => {
            switch(type) {
                case "player_attack":
                    //player attack
                    let monsterId = value.id;
                    let skillId = value.skill_id;
                    let playerMonster = this.playerMonsters[monsterId];

                    if(!playerMonster) {
                        //dont throw error to make sure battle doesn't break
                        return;
                    }

                    let attackRes = await playerMonster.attack(this.encounter!, skillId);
                    if(!attackRes) {
                        //on cooldown
                        return;
                    }

                    let { attacks, hits, misses, totalDamage, critDamage } = attackRes;
                    this._emitEvent('encounter_damage_received', attacks);
                    
                    if(!this.skillUsage[monsterId]) {
                        this.skillUsage[monsterId] = {};
                    }

                    if(!this.skillUsage[monsterId][skillId]) {
                        this.skillUsage[monsterId][skillId] = {
                            hit: 0,
                            miss: 0,
                            damage: 0,
                            crit_damage: 0,
                        };
                    }

                    this.skillUsage[monsterId][skillId].hit += hits;
                    this.skillUsage[monsterId][skillId].miss += misses;
                    this.skillUsage[monsterId][skillId].damage += totalDamage;
                    this.skillUsage[monsterId][skillId].crit_damage += critDamage;

                    if(this.encounter!.isDead()) {
                        this._sendWinMessage();
                        this.endBattle();
                        return;
                    }

                    break;
                default:
                    break;
            }
        });
    }

    _sendBattleStats = () => {
        this._emitEvent('end_battle_skill_usage', this.skillUsage);
        this._emitEvent('end_battle_encounter_hp', this.encounter!.stats.hp);
    }

    _sendLoseMessage = () => {
        this._emitEvent('battle_lost', 'true');
    }

    _sendWinMessage = () => {
        this._emitEvent('battle_won', 'true');
    }

    _onEncounterLoad = () => {
        this.encounterReady = true;
        if(this.playerReady) {
            this._start();
        }
    }

    //encounter attack
    _onEncounterOffCooldown = async() => {
        // attack random player monster
        let totalDamage = await this.encounter!.attackPlayer(Object.values(this.playerMonsters));
        this.playerCumulativeHp -= totalDamage;
        this._emitEvent('encounter_hit', totalDamage);

        if(this.playerCumulativeHp < 0) {
            this._sendLoseMessage();
            this.endBattle();
        }
    }

    _onPlayerMonsterLoad = () => {
        this.playerReady = true;
        if(this.encounterReady) {
            this._start();
        }
    }

    _onPlayerMonsterOffCooldown = (id: number) => {
        this._emitEvent("player_monster_off_cd", id.toString());
    }

    _getPlayerMonsters = async() => {
        let monsterIds = await getPlayerMonsters(this.address, this.chainId);
        if(!monsterIds || monsterIds.length === 0) {
            throw new Error("Unable to get player monsters");
        }

        this.playerMonsterCount = monsterIds.length;

        monsterIds.forEach(id => {
            let playerMonster = new PlayerMonster({ onOffCooldown: () => this._onPlayerMonsterOffCooldown(id), onLoad: this._onPlayerMonsterLoad, tokenId: id });
            this.playerMonsters[id] = playerMonster;
            this.playerCumulativeHp += playerMonster.stats.hp;
        });
    }

    _getEncounter = async() => {
        let randomMonsterMetadataId = await getRandomAreaMonsterBaseMetadataId(this.areaId, this.chainId);
        if(!randomMonsterMetadataId) {
            throw new Error("Unable to get monster metadata");
        }

        switch(this.type) {
            case "boss":
                this.encounter = new BossMonster({ onOffCooldown: this._onEncounterOffCooldown, onLoad: this._onEncounterLoad, metadataId: randomMonsterMetadataId });
                break;
            case "wild":
                this.encounter = new WildMonster({ onOffCooldown: this._onEncounterOffCooldown, onLoad: this._onEncounterLoad, metadataId: randomMonsterMetadataId });
                break;
            default:
                throw new Error("Unknown type");
        }
    }

    /**
     * Starts the battle.
     * Sends all required info like player monsters and encounter
     */
    _start = async() => {
        let now = getUTCDatetime();
        let columns = ['address', 'status', 'time_start'];
        let values: any[][] = [[this.address, 0, now]];

        let query = getInsertQuery(columns, values, 'pve_battles', true);
        let ret = await this.db.executeQueryForSingleResult<{ id: number }>(query);
        if(!ret || !ret.id) {
            throw new Error("Unable to create session");
        }
        this.battle_id = ret.id;

        let playerMonsters: { [id: string]: MonsterStats } = {};
        let playerMonsterSkills: {[id: string]: MonsterEquippedSkillById } = {};
        for(const[monsterId, playerMonster] of Object.entries(this.playerMonsters)) {
            playerMonsters[monsterId] = playerMonster.getStats();
            playerMonsterSkills[monsterId] = playerMonster.getSkills();
        }

        this._emitEvent('battle_start', {
            playerMonsters,
            playerMonsterSkills,
            encounter: this.encounter!.getStats()
        });

        setTimeout(() => {
            this._onEncounterOffCooldown();
        }, BATTLE_DELAY * 1000);
    }

    /**
     * Triggers when the battle ended.
     */
    endBattle = () => {
        this._sendBattleStats();
        this._destroyRoom();
    }
}