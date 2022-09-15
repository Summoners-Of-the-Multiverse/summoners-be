import { Server, Socket } from "socket.io";
import { MonsterType } from "../../types/Monster";

export type BattleConstructor = {
    io: Server;
    client: Socket;
    address: string;
    areaId: number;
    chainId: string;
    type: MonsterType;

    //deletes battle
    onPromptDelete: () => void;
}

export type RoomEvent = {
    type: string;
    value: any;
}

export type SkillUsage = {
    [monsterId: number]: {
        [skillId: number]: {
            hit: number;
            miss: number;
            damage: number;
            crit_damage: number;
        }
    }
}