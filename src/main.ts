import { ErrorMapper } from 'utils/ErrorMapper';
import { runHarvester } from 'roles/harvester';
import { runUpgrader } from 'roles/upgrader';
import { runBuilder } from 'roles/builder';
import { runHauler } from 'roles/hauler';
import { runTower } from 'roles/tower';

import { Tools } from 'tools';

import * as Profiler from "./utils/Profiler";

const maxHarvesterCount = 1;
const maxHaulerCount = 1;
const maxUpgraderCount = 1;
const maxBuilderCount = 1;

const MAX_REPEATBLE_BODY = 5;

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    curHealTarget?: Id<Structure>;
  }

  const enum CreepState {
    harvest = 'harvest',
    build = 'build',
    repair = 'repair'
  }

  const enum CreepRole {
    harvester = 'harvester',
    builder = 'builder',
    upgrader = 'upgrader',
    hauler = 'hauler'
  }

  interface CreepMemory {
    upgrading?: boolean;
    state?: CreepState;
    prevState?: CreepState;
    curTarget?: Id<Structure>;
    role: CreepRole;
    room: string;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
      Tools: Tools;
      Profiler: Profiler;
    }
  }
}

console.log(`Code updated at game tick: ${Game.time}`);

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

// This line monkey patches the global prototypes.
global.Profiler = Profiler.init();
global.Tools = Tools;
export const loop = ErrorMapper.wrapLoop(() => {
  const room = Game.rooms['E33N37'];
  // Game.rooms['E33N37'].energyAvailable
  // npm run push-main
  // npm run watch-main

  const curHarvesterCount = Tools.getCreepsByRole(CreepRole.harvester).length;
  const curUpgraderCount = Tools.getCreepsByRole(CreepRole.upgrader).length;
  const curBuilderCount = Tools.getCreepsByRole(CreepRole.builder).length;
  const curHaulerCount = Tools.getCreepsByRole(CreepRole.hauler).length;

  // console.log(Tools.getSourceAdjacentContainers(room));
  // console.log(Tools.GenerateBodyFromPattern('m[w]*', 5, Game.rooms['E33N37'].energyAvailable));

  if (curHarvesterCount < maxHarvesterCount) {
    Game.spawns['SlickHome'].spawnCreep(Tools.GenerateBodyFromPattern('m[w]*', MAX_REPEATBLE_BODY, room.energyCapacityAvailable), Tools.generateName("Harvester_"), { memory: { role: CreepRole.harvester, room: room.name } });
  } else if (curHaulerCount < maxHaulerCount) {
    Game.spawns['SlickHome'].spawnCreep(Tools.GenerateBodyFromPattern('[mc2]*', MAX_REPEATBLE_BODY, room.energyCapacityAvailable), Tools.generateName("Hauler_"), { memory: { role: CreepRole.hauler, room: room.name } });
  } else if (curUpgraderCount < maxUpgraderCount) {
    Game.spawns['SlickHome'].spawnCreep(Tools.GenerateBodyFromPattern('[mwc2]*', MAX_REPEATBLE_BODY, room.energyCapacityAvailable), Tools.generateName("Upgrader_"), { memory: { role: CreepRole.upgrader, room: room.name } });
  } else if (curBuilderCount < maxBuilderCount) {
    Game.spawns['SlickHome'].spawnCreep(Tools.GenerateBodyFromPattern('[mwc2]*', MAX_REPEATBLE_BODY, room.energyCapacityAvailable), Tools.generateName("Builder_"), { memory: { role: CreepRole.builder, room: room.name, prevState: CreepState.build, state: CreepState.harvest } });
  }

  // automatically delete memory of missing creeps
  if (Game.time % 1500 === 0) {
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
        console.log('Clearing non-existing creep from memory: ', name);
      }
    }
  }

  // generate free money
  if (Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel();
  }

  // perform role functions
  Tools.getCreepsByRole('harvester').map(runHarvester);
  Tools.getCreepsByRole('hauler').map(runHauler);
  Tools.getCreepsByRole('upgrader').map(runUpgrader);
  Tools.getCreepsByRole('builder').map(runBuilder);
  Tools.getTowers(Game.rooms['E33N37']).map(runTower);
});
