const PRIORITY = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_EXTENSION, STRUCTURE_STORAGE, STRUCTURE_WALL, STRUCTURE_RAMPART, STRUCTURE_ROAD];

export function runBuilder(creep: Creep) {

    if (Game.time % 1500 === 0) {
        console.log("repairing");
        creep.memory.prevState = CreepState.harvest;
        creep.memory.state = CreepState.repair;
    }

    switch (creep.memory.state) {
        case CreepState.harvest:
            if (creep.store.energy === creep.store.getCapacity()) {
                creep.memory.state = creep.memory.prevState;
            } else {
                harvestEnergy(creep);
            }
            break;
        case CreepState.build:
            if (creep.store.energy === 0) {
                creep.memory.prevState = creep.memory.state;
                creep.memory.state = CreepState.harvest;
            } else {
                build(creep);
            }
            break;
        case CreepState.repair:
            if (creep.store.energy === 0) {
                creep.memory.prevState = creep.memory.state;
                creep.memory.state = CreepState.harvest;
            } else {
                repair(creep);
            }
            break;
        default:
            console.log("builder: " + creep.name + " accidentally has no state");
            creep.memory.prevState = CreepState.harvest;
            creep.memory.state = CreepState.build;
    }
};

function repair(creep: Creep) {
    if (creep.memory.curTarget) {
        const target = Game.getObjectById(creep.memory.curTarget);
        if (target && target.hits < target.hitsMax) {
            if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else {
            creep.memory.curTarget = undefined;
        }
    } else {
        const targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.hits < structure.hitsMax / 2
                    && structure.structureType != STRUCTURE_WALL);
            }
        });
        if (targets.length > 0) {
            creep.memory.curTarget = targets[0].id;
            console.log("repairing target at: " + targets[0].pos);
            if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets[0]);
            }
        } else {
            console.log("no repair target");
            creep.memory.prevState = CreepState.build;
            creep.memory.state = CreepState.harvest;
        }
    }
}

function build(creep: Creep) {
    const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    type priTarget = {
        element: ConstructionSite;
        priority: number;
    };
    var prioritizedTarget: priTarget = { element: targets[0], priority: 100 };
    if (targets.length) {
        for (const target of targets) {
            const spot = PRIORITY.findIndex((struct: string) => struct == target.structureType);
            if (spot >= 0) {
                if (spot < prioritizedTarget.priority) {
                    prioritizedTarget.element = target;
                    prioritizedTarget.priority = spot;
                }
            } else {
                Memory.log = 'please add: ' + target.structureType + ' to priority array.';
                console.log('please add: ' + target.structureType + ' to priority array.');
            }
        }

        if (prioritizedTarget.element && creep.build(prioritizedTarget.element) == ERR_NOT_IN_RANGE) {
            creep.moveTo(prioritizedTarget.element, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
}

function harvestEnergy(creep: Creep) {
    const dropped_energy = creep.room.find(FIND_DROPPED_RESOURCES, { filter: (s: Resource) => s.resourceType === RESOURCE_ENERGY && s.amount > creep.store.getFreeCapacity(RESOURCE_ENERGY) });
    if (dropped_energy.length > 0) {
        if (creep.pickup(dropped_energy[0]) === ERR_NOT_IN_RANGE) {
            creep.moveTo(dropped_energy[0]);
        }
    } else {
        var sources = creep.room.find(FIND_STRUCTURES, {
            filter: (structure: AnyStoreStructure) => { return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.energy > 0 }
        });
        if (creep.withdraw(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0]);
        }
    }
}

