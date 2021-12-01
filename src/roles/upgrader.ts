export function runUpgrader(creep: Creep) {

    if (creep.memory.upgrading && creep.store.energy == 0) {
        creep.memory.upgrading = false;
        creep.say('harvesting');
    }
    if (!creep.memory.upgrading && creep.store.energy == creep.store.getCapacity()) {
        creep.memory.upgrading = true;
        creep.say('upgrading');
    }

    if (creep.memory.upgrading) {
        if (creep.room.controller && creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    }
    else {
        var sources = creep.room.find(FIND_STRUCTURES, {
            filter: (structure: AnyStoreStructure) => { return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0 }
        });
        if (creep.withdraw(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0]);
        }
    }
};
