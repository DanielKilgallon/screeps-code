let repairFlip = false;
export function runTower(tower: StructureTower) {
    if (Game.time % 1500 === 0) {
        repairFlip = true;
    }
    if (repairFlip) {
        if (Memory.curHealTarget) {
            const target = Game.getObjectById(Memory.curHealTarget);
            if (target && target.hits < target.hitsMax) {
                tower.repair(target);
            } else {
                Memory.curHealTarget = undefined;
            }
        } else {
            const targets = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < structure.hitsMax / 2);
                }
            });
            if (targets.length > 0) {
                Memory.curHealTarget = targets[0].id;
                console.log("repairing target at: " + targets[0].pos);
                tower.repair(targets[0]);
            } else {
                console.log("no repair target");
                repairFlip = false;
            }
        }
    }
}