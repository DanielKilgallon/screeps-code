import { ErrorMapper } from 'utils/ErrorMapper';

import { runHarvester } from 'roles/harvester';
import { manageUpgraders } from 'managers/upgrade-manager';
import { managerHaulers } from 'managers/hauler-manager';
import { runBuilder } from 'roles/builder';
import { runTower } from 'roles/tower';
import { runLink } from 'roles/link';

import { Tools } from 'utils/tools';
import { cli } from 'utils/cli';

// import * as Profiler from "./utils/Profiler";

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
    repairFlip?: boolean;
    createRoad?: boolean;
  }

  interface maxCreep {
    maxHarvesterCount: Number;
    maxHaulerCount: Number;
    maxUpgraderCount: Number;
    maxBuilderCount: Number;
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
      cli: typeof cli;
    }
  }
}

console.log(`Code updated at game tick: ${Game.time}`);

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

// This line monkey patches the global prototypes.
global.cli = cli;
export const loop = ErrorMapper.wrapLoop(() => {
  const room = Game.rooms['E33N37'];
  // Game.rooms['E33N37'].energyAvailable
  // npm run push-main
  // npm run watch-main

  const maxCreeps: maxCreep = Tools.calculateRCL(room);
  // global.maxCreep = maxCreeps;

  const curHarvesterCount = Tools.getCreepsByRole(room, CreepRole.harvester);
  const curUpgraderCount = Tools.getCreepsByRole(room, CreepRole.upgrader);
  const curBuilderCount = Tools.getCreepsByRole(room, CreepRole.builder);
  const curHaulerCount = Tools.getCreepsByRole(room, CreepRole.hauler);

  // console.log(room.controller?.progressTotal);
  // console.log(Game.rooms['E33N37'].energyAvailable);
  // console.log(Tools.getCreepBodyCost(Tools.GenerateBodyFromPattern('[mc2]*', 5, Game.rooms['E33N37'].energyAvailable)));

  // this process collectively uses about 1 additional CPU from what I can tell... very expensive
  const harvesterBody = Tools.GenerateBodyFromPattern('m[w]*', MAX_REPEATBLE_BODY, room.energyAvailable);
  const validHarvester = Tools.validateMinimumCreepBody([MOVE, WORK], harvesterBody);

  const haulerBody = Tools.GenerateBodyFromPattern('[mc2]*', MAX_REPEATBLE_BODY, room.energyAvailable)
  const validHauler = Tools.validateMinimumCreepBody([MOVE, CARRY], haulerBody);

  const upgraderBody = Tools.GenerateBodyFromPattern('[m[wc2]]*', MAX_REPEATBLE_BODY, room.energyAvailable)
  const validUpgrader = Tools.validateMinimumCreepBody([MOVE, WORK, CARRY], upgraderBody);

  const builderBody = Tools.GenerateBodyFromPattern('[mwc2]*', 3, room.energyAvailable)
  const validBuilder = Tools.validateMinimumCreepBody([MOVE, WORK, CARRY], builderBody);

  if (curHarvesterCount.length < maxCreeps.maxHarvesterCount && validHarvester) {
    Game.spawns['SlickHome'].spawnCreep(harvesterBody, Tools.generateName("Harvester_"), { memory: { role: CreepRole.harvester, room: room.name } });
  } else if (curHaulerCount.length < maxCreeps.maxHaulerCount && validHauler) {
    Game.spawns['SlickHome'].spawnCreep(haulerBody, Tools.generateName("Hauler_"), { memory: { role: CreepRole.hauler, room: room.name } });
  } else if (curUpgraderCount.length < maxCreeps.maxUpgraderCount && validUpgrader) {
    Game.spawns['SlickHome'].spawnCreep(upgraderBody, Tools.generateName("Upgrader_"), { memory: { role: CreepRole.upgrader, room: room.name } });
  } else if (curBuilderCount.length < maxCreeps.maxBuilderCount && validBuilder) {
    Game.spawns['SlickHome'].spawnCreep(builderBody, Tools.generateName("Builder_"), { memory: { role: CreepRole.builder, room: room.name, prevState: CreepState.build, state: CreepState.harvest } });
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
  curHarvesterCount.map(runHarvester);
  managerHaulers(room);
  manageUpgraders(room);
  curBuilderCount.map(runBuilder);
  Tools.getTowers(room).map(runTower);
  Tools.getLinks(room).map(runLink);
});