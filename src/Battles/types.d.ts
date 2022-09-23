import { Server, Socket } from "socket.io";
import { Battle } from ".";
import { MonsterType } from "../../types/Monster";

export type BattleConstructor = {
    io: Server;
    socket: Socket;
    address: string;
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