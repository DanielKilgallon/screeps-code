import { Tools } from "utils/tools";

export function managerHaulers(room: Room): void {

    Tools.getCreepsByRole(room, CreepRole.hauler).map((creep: Creep) => {
        if (creep.store.energy === 0) {
            const dropped_energy = creep.room.find(FIND_DROPPED_RESOURCES, { filter: (s: Resource) => s.resourceType === RESOURCE_ENERGY && s.amount > 50 });
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
                    const containers = creep.room.find(FIND_STRUCTURES, { filter: (s: AnyStoreStructure) => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 50 });
                    if (containers.length > 0) {
                        if (creep.withdraw(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(containers[0]);
                        }
                    } else {
                        const storage = creep.room.find(FIND_STRUCTURES, { filter: (s: AnyStoreStructure) => s.structureType === STRUCTURE_STORAGE && s.store.energy > 0 });
                        if (creep.withdraw(storage[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage[0]);
                        }
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
                var storage_targets = creep.room.find(FIND_STRUCTURES,
                    {
                        filter: (structure: AnyStoreStructure) =>
                            (structure.structureType == STRUCTURE_STORAGE)
                            && structure.store
                            && structure.store.energy < structure.store.getCapacity(RESOURCE_ENERGY)
                    });
                if (storage_targets.length > 0) {
                    const target = creep.pos.findClosestByPath(storage_targets) as AnyStoreStructure;
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                } else {
                    creep.moveTo(Game.spawns['SlickHome']);
                }
            }
        }
    });
}