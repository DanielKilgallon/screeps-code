import { Tools } from "utils/tools";

export function manageUpgraders(room: Room): void {

    // handles road generation
    if (Memory.createRoad) {
        const controllerPosition: RoomPosition = room.controller?.pos || new RoomPosition(0, 0, room.name);
        const containers = room.find(FIND_STRUCTURES, {
            filter: (structure: AnyStoreStructure) => { return (structure.structureType == STRUCTURE_CONTAINER) }
        });
        if (containers.length > 0) {
            const container = containers[0];

            // from container to controller
            const path = container.pos.findPathTo(controllerPosition, { ignoreCreeps: true });
            path.slice(0, -3).map(pos => {
                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            });

            // from spawn to container
            const spawn = room.find(FIND_MY_SPAWNS)[0];
            spawn.pos.findPathTo(container.pos, { ignoreCreeps: true }).map(pos => {
                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            });

            // from container to extensions
            const extensions = room.find(FIND_MY_STRUCTURES, {
                filter: (structure: AnyStructure) => { return (structure.structureType == STRUCTURE_EXTENSION) }
            });
            extensions.map(extension => {
                extension.pos.findPathTo(container.pos, { ignoreCreeps: true }).map(pos => {
                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                });
            });
        }


        Memory.createRoad = false;
    }

    Tools.getCreepsByRole(room, CreepRole.upgrader).map((creep: Creep) => {
        if (creep.store.energy > 0) {
            if (creep.room.controller && creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        } else if (creep.store.energy === 0) {
            var sources = creep.room.find(FIND_STRUCTURES, {
                filter: (structure: AnyStoreStructure) => { return (structure.structureType == STRUCTURE_CONTAINER) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0 }
            });
            if (creep.withdraw(sources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0]);
            }
        }
    });
}