
export function runTower(tower: StructureTower) {
    if (Game.time % 1500 === 0) {
        Memory.repairFlip = true;
    }
    if (Memory.repairFlip) {
        if (Memory.curHealTarget) {
            const target = Game.getObjectById(Memory.curHealTarget);
            if (target && target.hits < target.hitsMax && target.hits < 3_000_000) {
                tower.repair(target);
            } else {
                Memory.curHealTarget = undefined;
            }
        } else {
            const targets = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.hits < structure.hitsMax / 2
                        && structure.structureType !== STRUCTURE_WALL;
                }
            });
            if (targets.length > 0) {
                Memory.curHealTarget = targets[0].id;
                console.log("repairing target at: " + targets[0].pos);
                tower.repair(targets[0]);
            } else {
                console.log("no repair target");
                Memory.repairFlip = false;
            }
        }
    }
}