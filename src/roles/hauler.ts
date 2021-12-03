export function runHauler(creep: Creep) {
    if (creep.store.energy === 0) {
        const dropped_energy = creep.room.find(FIND_DROPPED_RESOURCES, { filter: (s: Resource) => s.resourceType === RESOURCE_ENERGY && s.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY) });
        if (dropped_energy.length > 0) {
            if (creep.pickup(dropped_energy[0]) === ERR_NOT_IN_RANGE) {
                creep.moveTo(dropped_energy[0]);
            }
        } else {
            const tombs = creep.room.find(FIND_TOMBSTONES, { filter: (tombstone: Tombstone) => tombstone.store.energy > 50 });
            if (tombs.length > 0) {
                if (creep.withdraw(tombs[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(tombs[0]);
                }
            } else {
                const containers = creep.room.find(FIND_STRUCTURES, { filter: (s: AnyStoreStructure) => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0 });
                if (creep.withdraw(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(containers[0]);
                }
            }
        }
    } else {
        var targets = creep.room.find(FIND_STRUCTURES,
            {
                filter: (structure: AnyStoreStructure) =>
                    (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_TOWER)
                    && structure.store
                    && structure.store.energy < structure.store.getCapacity(RESOURCE_ENERGY)
            });
        if (targets.length > 0) {
            const target = creep.pos.findClosestByPath(targets) as AnyStoreStructure;
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else {
            creep.moveTo(Game.spawns['SlickHome']);
        }
    }
};
