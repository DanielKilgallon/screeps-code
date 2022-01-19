export class Tools {
  static getTowers(room: Room): StructureTower[] {
    return room.find(FIND_STRUCTURES, { filter: (structure: Structure) => { return structure.structureType == STRUCTURE_TOWER; } });
  }
  static getLinks(room: Room): StructureLink[] {
    return room.find(FIND_STRUCTURES, { filter: (structure: Structure) => { return structure.structureType == STRUCTURE_LINK; } });
  }
  static getCreepsByRole(room: Room, role: string): Creep[] {
    return room.find(FIND_MY_CREEPS).filter((creep: Creep) => { return creep.memory.role == role && creep.room.name === room.name; });
  }
  static getSourceSpots(room: Room): Source[] {
    return room.find(FIND_SOURCES);
  }
  static getSourceAdjacentContainers(room: Room): StructureContainer[] {
    let result: StructureContainer[] = [];
    room.find(FIND_SOURCES).filter((source: Source) => {
      (source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (structure: StructureContainer) => structure.structureType === STRUCTURE_CONTAINER }) as StructureContainer[]).forEach((container: StructureContainer) => {
        result.push(container);
      });
    });
    return result;
  }
  static getCreepBodyCost(body: BodyPartConstant[]): number {
    let cost = 0;
    for (let i = 0; i < body.length; i++) {
      cost += BODYPART_COST[body[i]];
    }
    return cost;
  }
  static validateMinimumCreepBody(minimumparts: BodyPartConstant[], parts: BodyPartConstant[]): boolean {
    let result = true;
    minimumparts.forEach((part: BodyPartConstant) => {
      if (!parts.includes(part)) {
        result = false;
      }
    });
    return result;
  }
  static generateName(prefix: string): string {
    return prefix.concat(Game.time.toString().slice(-4));
  }
  static rolePatterns: { [roleName: string]: string } = {
    worker: "[wmc]11[mww]5mw",
    filler: "[mcc]8",
    foot: "[mcw]*",
    hauler: "[mcc]8",
    labrador: "[mcc]8",
    miner: "mw6cw4m",
    mineralHauler: "[mcc]8",
    mineralMiner: "[mwwww]10",
    peacekeeper: "mamamamrmrmamamamrmrmamamamhmh",
    remoteHauler: "[cmc]",
    remoteMiner: "w2cmw4m3w4m",
    reserver: "[lm]5",
    scout: "m",
    upgrader: "[mwcwmw]8",
    manager: "c16",
    quickFiller: "c4"
  };
  static calculateRCL(room: Room): maxCreep {
    switch (room.controller?.level) {
      case 1:
        return {
          maxHarvesterCount: 1,
          maxHaulerCount: 1,
          maxUpgraderCount: 1,
          maxBuilderCount: 1
        }
      case 2:
        Memory.createRoad = true;
        return {
          maxHarvesterCount: 1,
          maxHaulerCount: 1,
          maxUpgraderCount: 2,
          maxBuilderCount: 2
        }
      case 3:
        return {
          maxHarvesterCount: 1,
          maxHaulerCount: 1,
          maxUpgraderCount: 2,
          maxBuilderCount: 1
        }
      case 4:
        return {
          maxHarvesterCount: 1,
          maxHaulerCount: 1,
          maxUpgraderCount: 2,
          maxBuilderCount: 2
        }
      case 5:
        return {
          maxHarvesterCount: 1,
          maxHaulerCount: 1,
          maxUpgraderCount: 2,
          maxBuilderCount: 2
        }
      case 6:
        return {
          maxHarvesterCount: 1,
          maxHaulerCount: 1,
          maxUpgraderCount: 3,
          maxBuilderCount: 1
        }
      default:
        return {
          maxHarvesterCount: 1,
          maxHaulerCount: 1,
          maxUpgraderCount: 1,
          maxBuilderCount: 1
        }
    }
  }



  /**
  * original by kaiskye
  * ported to TS by antonn
  * copied shamelessly here.
  * 
  * Original: https://github.com/antonnyst/screeps-typescript/blob/master/src/utils/CreepBodyGenerator.ts
  *
  * Generates a list of body parts to spawn a creep with by following a
  * regex-like pattern to decide which parts to try spawning and fitting in as
  * many parts as possible for the given amount of energy.
  *
  * Pattern examples:
  *
  *   'mah'        1 MOVE, 1 ATTACK, and 1 HEAL part
  *   'mw4a'       1 MOVE part, 4 WORK parts, and 1 ATTACK part
  *   'm*'         As many MOVE parts as will fit
  *   'w*m*t*'     As many WORK parts as will fit, then as many MOVE parts as
  *                  will fit, then as many TOUGH parts as will fit
  *   'm[wc]*'     1 MOVE part, then alternate between WORK and CARRY parts
  *                  until one doesn't fit
  *   '[mw3]*'     1 MOVE part for every 3 WORK parts, until one doesn't fit
  *   'm3[arh]*t*' 3 MOVE parts, then cycle between ATTACK, RANGED_ATTACK,
  *                  and HEAL until one doesn't fit, then as many TOUGH
  *                  parts as will fit
  *   '[m[wc]2]*'  Cycle between MOVE, WORK, CARRY, WORK, CARRY until one
  *                  doesn't fit
  */
  static GenerateBodyFromPattern(pattern: string, MAX_LIMIT: number = 999, energy: number): BodyPartConstant[] {
    const parts: { [index: string]: BodyPartConstant } = {
      a: ATTACK,
      c: CARRY,
      h: HEAL,
      l: CLAIM,
      m: MOVE,
      r: RANGED_ATTACK,
      t: TOUGH,
      w: WORK
    };
    const result: BodyPartConstant[] = [];
    const stack: any = [];
    let i: number = 0;
    let repeat: number = 0;
    let depleted: boolean = false;
    while (i < pattern.length && energy > 0 && result.length < 50) {
      const c: string = pattern[i];
      if (c === "*" || (parseInt(c, 10) >= 0 && parseInt(c, 10) <= 9)) {
        const top = stack.pop();
        if (top === undefined) {
          break;
        }
        let count: number = 0;
        while (i < pattern.length && parseInt(pattern[i], 10) >= 0 && parseInt(pattern[i], 10) <= 9) {
          count = count * 10 + parseInt(pattern[i], 10);
          i++;
        }
        if (c === "*") {
          count = MAX_LIMIT;
          i++;
        }
        if (depleted === false && top[1] < count - 1) {
          i = top[0];
          repeat = top[1] + 1;
        } else {
          repeat = 0;
          if (stack.length === 0) {
            depleted = false;
          }
        }
        stack.push(top);
        continue;
      }
      stack.pop();
      if (c === "[") {
        stack.push([i, repeat]);
        stack.push(null);
      }
      if (c in parts) {
        if (!depleted) {
          const cost = BODYPART_COST[parts[c]];
          if (energy >= cost) {
            result.push(parts[c]);
            energy -= cost;
          } else {
            depleted = true;
          }
        }
        stack.push([i, repeat]);
      }
      repeat = 0;
      i++;
    }
    return result;
  }
}
