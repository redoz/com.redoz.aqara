

const { ZigBeeDevice } = require("homey-zigbeedriver");

import { CLUSTER, ZCLNode } from "zigbee-clusters";

import { AqaraOppleCluster, AqaraOppleDeviceInfoAttribute, AqaraOppleLifelineReport } from '../../shared/AqaraOppleCluster';

import { AqaraAnalogInputCluster } from './AqaraAnalogInputCluster';

import { Device, FlowCardTriggerDevice } from 'homey'

// const { debug } = require("zigbee-clusters");

// debug(true);

enum Mode {
  Action = 0,
  Scene = 1
}

interface CubeRotateTriggerArgs {
  degrees: number
  direction: 'either' | 'clockwise' | 'counterclockwise'
  side?: Side
}

interface CubeRotateTriggerState {
  degrees: number
  side: number
}
type Side = "one" | "two" | "three" | "four" | "five" | "six"

function sideEquals(arg: Side, state: number) {
  switch (arg) {
    case "one":
      return state === 1;
    case "two":
      return state === 2;
    case "three":
      return state === 3;
    case "four":
      return state === 4;
    case "five":
      return state === 5;
    case "six":
      return state === 6;
  }
}
interface CubeTapTriggerArgs {
  side?: Side
}
interface CubeTapTriggerState {
  side: number
}

interface CubeFlipTriggerArgs {
  fromSide?: Side
  toSide?: Side
}
interface CubeFlipTriggerState {
  fromSide: number
  toSide: number
}
interface CubePushTriggerArgs {
  side?: Side
}
interface CubePushTriggerState {
  side: number
}

class CubeT1Pro extends ZigBeeDevice {

  private _cubeRotateTrigger?: FlowCardTriggerDevice;
  private _cubeShakeTrigger?: FlowCardTriggerDevice;
  private _cubeTapTrigger?: FlowCardTriggerDevice;
  private _cubeFlipTrigger?: FlowCardTriggerDevice;
  private _cubePushTrigger?: FlowCardTriggerDevice;
  private _cubePickUpTrigger?: FlowCardTriggerDevice;
  private _cubeThrowTrigger?: FlowCardTriggerDevice;
  private _cubeMotionAfterInactivityTrigger?: FlowCardTriggerDevice;

  private _mode?: Mode;


  async onNodeInit({ zclNode }: { zclNode: ZCLNode }) {

    // this.enableDebug();
    // this.debug(true);
    this.log('Initializing node...');

    this._cubeRotateTrigger = this.homey.flow.getDeviceTriggerCard("cube_rotate");
    this._cubeRotateTrigger!.registerRunListener(async (args: CubeRotateTriggerArgs, state: CubeRotateTriggerState) => {
      // this.log("args", {degree: args.degrees, side: args.side, direction: args.direction})
      // this.log("state", state)
      var ret = true;
      if (args.side && !sideEquals(args.side, state.side))
        ret = false;
      else if (Math.abs(state.degrees) < args.degrees)
        ret = false;
      else if (args.direction === "clockwise")
        ret = state.degrees > 0;
      else if (args.direction === "counterclockwise")
        ret = state.degrees < 0;

      // this.log("triggered", ret);
      return ret;
    });

    this._cubeShakeTrigger = this.homey.flow.getDeviceTriggerCard("cube_shake");
    this._cubeShakeTrigger!.registerRunListener(async (_args, _state) => true);

    this._cubeTapTrigger = this.homey.flow.getDeviceTriggerCard("cube_tap");
    this._cubeTapTrigger!.registerRunListener(async (args: CubeTapTriggerArgs, state: CubeTapTriggerState) => {
      if (args.side === undefined)
        return true;

      return sideEquals(args.side, state.side);
    });

    this._cubeFlipTrigger = this.homey.flow.getDeviceTriggerCard("cube_flip");
    this._cubeFlipTrigger!.registerRunListener(async (args: CubeFlipTriggerArgs, state: CubeFlipTriggerState) => {
      if (args.fromSide !== undefined && !sideEquals(args.fromSide, state.fromSide))
        return false;

      if (args.toSide !== undefined && !sideEquals(args.toSide, state.toSide))
        return false;

      return true;
    });

    this._cubePushTrigger = this.homey.flow.getDeviceTriggerCard("cube_push");
    this._cubePushTrigger!.registerRunListener(async (args: CubePushTriggerArgs, state: CubePushTriggerState) => {
      if (args.side === undefined)
        return true;

      return sideEquals(args.side, state.side);
    });

    this._cubePickUpTrigger = this.homey.flow.getDeviceTriggerCard("cube_pick_up");
    this._cubePickUpTrigger!.registerRunListener(async (_args, _state) => true);

    this._cubeThrowTrigger = this.homey.flow.getDeviceTriggerCard("cube_throw");
    this._cubeThrowTrigger!.registerRunListener(async (_args, _state) => true);

    this._cubeMotionAfterInactivityTrigger = this.homey.flow.getDeviceTriggerCard("cube_motion_after_inactivity");
    this._cubeMotionAfterInactivityTrigger!.registerRunListener(async (_args, _state) => true);

    // triggers:
    // Mode change
    // Scene Mode
    //   Rotate    
    //   Shake
    //   Pick up
    //   Hold
    //   Side up
    //   Inactivity

    // Action Mode
    //   Push
    //   Rotate
    //   Pick up and tap twice
    //   Flip 90 degrees
    //   Flip 180 degrees
    //   Shake
    //   Inactivity


    if (this.isFirstInit()) {
      // without this the cube only uses the onOff cluster
      this.debug("Configuring Cube to operate in Event mode...");
      var cluster = zclNode.endpoints[1].clusters[AqaraOppleCluster.NAME]!;
      await cluster.writeAttributes({ operation_mode: 1 });
      this.debug("Reading mode attribute...");
      var result = await cluster.readAttributes(['mode']);
      this._mode = result.mode as number;
      await this.setSettings({
        mode: Mode[this._mode]
      });
      this.debug("Cube successfully configured");
      // TODO can we fail the pairing operation if fails?
    } else {
      // should probably figure out how to work with Enums in typescript
      this._mode = this.getSettings().mode === "Action" ? Mode.Action : Mode.Scene;
    }

    // maintain the `mode` setting when it's changed on the device
    zclNode.endpoints[1].clusters.aqaraOpple?.on('attr.mode', async (mode: number) => {
      this._mode = mode;
      await this.setMode(mode);
    })
    
    zclNode.endpoints[2].clusters.aqaraOpple?.on('attr.side', this.sideUpHandler.bind(this));

    zclNode.endpoints[1].clusters.aqaraOpple!.on('attr.lifeline', this.aparaOppleLifelineHandler.bind(this));
      
    zclNode.endpoints[2].clusters.multistateInput!.on('attr.presentValue', this.multiStateInputHandler.bind(this));

    zclNode.endpoints[3].clusters[AqaraAnalogInputCluster.NAME]!.on('attr.presentValue', this.triggerCubeRotate.bind(this));

    zclNode.endpoints[3].clusters[AqaraAnalogInputCluster.NAME]!.on('attr.side', this.sideUpHandler.bind(this));

    // zclNode.endpoints[3]
    //   .clusters[AqaraAnalogInputCluster.NAME]!
    //   .on('attr.unknown_0x010b', async (value: number) => {
        
    //     this.debug("unknown_0x010b", value);
    //   });
    this.log('Node initialized');
  }

  async triggerCubeRotate(degrees: number) {
    this.debug("Trigger cube rotate", { degrees });

    // we _should_ always have this
    var side = this.getCapabilityValue('cube_side_up') ?? 0;
    this._cubeRotateTrigger!
      .trigger(this as unknown as Device, { degrees, side }, { degrees, side })
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }

  async triggerCubeShake() {
    this.debug("Trigger cube shake");

    this._cubeShakeTrigger!
      .trigger(this as unknown as Device, {}, {})
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }

  async triggerCubeTap(side: number) {
    this.debug("Trigger cube tap");

    this._cubeTapTrigger!
      .trigger(this as unknown as Device, { side }, { side })
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))

    this.setCapabilityValue('cube_side_up', side).catch(this.error);
  }

  async triggerCubeFlip(fromSide: number | undefined, toSide: number) {
    if (fromSide === undefined) {
      fromSide = this.getCapabilityValue('cube_side_up');
    }
    if (fromSide === toSide)
      return;

    this.debug("Trigger cube flip");
    this._cubeFlipTrigger!
      .trigger(this as unknown as Device, { fromSide, toSide }, { fromSide, toSide })
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))

    this.setCapabilityValue('cube_side_up', toSide).catch(this.error);
  }

  async triggerCubePush(side: number) {
    this.debug("Trigger cube push");

    this._cubePushTrigger!
      .trigger(this as unknown as Device, { side }, { side })
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))

    this.setCapabilityValue('cube_side_up', side).catch(this.error);
  }

  async triggerCubePickUp() {
    this.debug("Trigger cube pick-up");

    this._cubePickUpTrigger!
      .trigger(this as unknown as Device, {}, {})
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }

  async triggerCubeThrow() {
    this.debug("Trigger cube throw");

    this._cubeThrowTrigger!
      .trigger(this as unknown as Device, {}, {})
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }

  async triggerCubeMotionAfterInactivity() {
    this.debug("Trigger cube motion");

    this._cubeMotionAfterInactivityTrigger!
      .trigger(this as unknown as Device, {}, {})
      .then((arg: any) => this.debug("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }

  async setMode(mode: Mode) {
    await this.setSettings({
      mode: Mode[mode]
    });
  }

  async sideUpHandler(side: number) {
    side += 1; // sides are 0 indexed from the device
    this.debug("side up", side);
    await this.triggerCubeFlip(undefined, side);
  }

  async multiStateInputHandler(data: number) {
    var toSideBits = data & 0x07;
    var fromSideBits = (data >> 3) & 0x07;
    var eventBits = (data >> 6);

    if (data === 1) {
      // throw

      this.debug("multiStateInputHandler", {
        data,
        event: "throw"
      });
      await this.triggerCubeThrow();
    }
    else if (data === 2) {
      // activity after one minute of inactivity
      this.debug("multiStateInputHandler", {
        data,
        event: "activityAfterInactivity"
      });
      await this.triggerCubeMotionAfterInactivity();
    } else if (data === 4) {
      // pick up

      // this can only happen in scene mode
      await this.setMode(Mode.Scene);

      // pick up
      this.debug("multiStateInputHandler", {
        data,
        event: "pickUp"
      });
      await this.triggerCubePickUp();
    } else if (eventBits === 16) {
      // side up

      // this can only happen in scene mode
      await this.setMode(Mode.Scene);

      let toSide = toSideBits + 1;
      this.debug("multiStateInputHandler", {
        data,
        event: "sideUp"
      });
      await this.triggerCubeFlip(undefined, toSide);
    } else if (eventBits === 1) {
      // 90 degree flip

      // this can only happen in action mode
      await this.setMode(Mode.Action);

      let fromSide = fromSideBits + 1;
      let toSide = toSideBits + 1;
      this.debug("multiStateInputHandler", {
        data,
        event: "flip90",
        fromSide,
        toSide
      });
      await this.triggerCubeFlip(fromSide, toSide);
    } else if (eventBits == 2) {
      // 180 degree flip

      // this can only happen in action mode
      await this.setMode(Mode.Action);

      let toSide = toSideBits + 1;
      let fromSide = 7 - toSide;
      this.debug("multiStateInputHandler", {
        data,
        event: "flip180",
        fromSide,
        toSide
      });
      await this.triggerCubeFlip(fromSide, toSide);
    } else if (eventBits == 0 && fromSideBits === 0 && toSideBits === 0) {
      // shake
      this.debug("multiStateInputHandler", {
        data,
        event: "shake"
      });
      await this.triggerCubeShake();
    } else if (eventBits === 8) {
      // double tap

      // this can only happen in action mode
      await this.setMode(Mode.Action);

      let side = toSideBits + 1;
      this.debug("multiStateInputHandler", {
        data,
        event: "tap",
        side
      });
      await this.triggerCubeTap(side)
    } else if (eventBits === 4) {
      // push
      let side = toSideBits + 1;
      this.debug("multiStateInputHandler", {
        data,
        event: "push",
        side
      });
      await this.triggerCubePush(side)
    } else {
      this.debug("multiStateInputHandler", {
        data,
        eventBits,
        fromSideBits,
        toSideBits,
        event: "UNKNOWN"
      });
    }
  }

  aparaOppleLifelineHandler(data: AqaraOppleLifelineReport) {
    if (data[AqaraOppleDeviceInfoAttribute.OperationMode]) {
      this.setMode(data[AqaraOppleDeviceInfoAttribute.OperationMode]);
    }
    if (data[AqaraOppleDeviceInfoAttribute.BatteryVoltage]) {
      var batteryVoltage = data[AqaraOppleDeviceInfoAttribute.BatteryVoltage];
      var percentage = Math.min(1, Math.abs((batteryVoltage - 2000) / 1000)) * 100;
      
      this.setCapabilityValue('measure_battery', percentage);
    }
    this.debug("aparaOppleLifelineHandler", data)
  }

  /**
   * onInit is called when the device is initialized.
   */
  // async onInit() {
  //   this.debug('MyDevice has been initialized');

  //   var node = await this.homey.zigbee.getNode(this);

  //   this.debug("node", node);
  // }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.debug('MyDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: { [key: string]: boolean | string | number | undefined | null };
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<string | void> {
    this.debug("MyDevice settings where changed");
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.debug('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.debug('MyDevice has been deleted');
  }

}

module.exports = CubeT1Pro;

/*


"ids": {
  "modelId": "lumi.remote.cagl02",
  "manufacturerName": "LUMI"
},
"endpoints": {
  "ieeeAddress": "54:ef:44:10:00:7a:3b:ed",
  "networkAddress": 1947,
  "modelId": "lumi.remote.cagl02",
  "manufacturerName": "LUMI",
  "swBuildId": "2019",
  "capabilities": {
    "type": "Buffer",
    "data": [
      128
    ]
  },
  "endpointDescriptors": [
    {
      "status": "SUCCESS",
      "nwkAddrOfInterest": 1947,
      "_reserved": 18,
      "endpointId": 1,
      "applicationProfileId": 260,
      "applicationDeviceId": 259,
      "applicationDeviceVersion": 0,
      "_reserved1": 1,
      "inputClusters": [
        0,
        3,
        6
      ],
      "outputClusters": [
        0,
        3
      ]
    }
  ],
  "touchlinkGroupIds": [],
  "extendedEndpointDescriptors": {
    "1": {
      "clusters": {
        "basic": {
          "attributes": [
            {
              "acl": [
                "readable"
              ],
              "id": 0,
              "name": "zclVersion",
              "value": 3
            },
            {
              "acl": [
                "readable"
              ],
              "id": 1,
              "name": "appVersion",
              "value": 25
            },
            {
              "acl": [
                "readable"
              ],
              "id": 2,
              "name": "stackVersion",
              "value": 2
            },
            {
              "acl": [
                "readable"
              ],
              "id": 3,
              "name": "hwVersion",
              "value": 1
            },
            {
              "acl": [
                "readable"
              ],
              "id": 4,
              "name": "manufacturerName",
              "value": "LUMI"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 5,
              "name": "modelId",
              "value": "lumi.remote.cagl02"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 6,
              "name": "dateCode"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 7,
              "name": "powerSource",
              "value": "battery"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 8,
              "name": "appProfileVersion",
              "value": 255
            },
            {
              "acl": [
                "readable"
              ],
              "id": 9
            },
            {
              "acl": [
                "readable"
              ],
              "id": 10
            },
            {
              "acl": [
                "readable"
              ],
              "id": 11
            },
            {
              "acl": [
                "readable"
              ],
              "id": 13
            },
            {
              "acl": [
                "readable"
              ],
              "id": 16384,
              "name": "swBuildId",
              "value": "2019"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ],
          "commandsGenerated": [],
          "commandsReceived": [
            "factoryReset"
          ]
        },
        "identify": {
          "attributes": [
            {
              "acl": [
                "readable",
                "writable"
              ],
              "id": 0,
              "name": "identifyTime",
              "value": 0
            },
            {
              "acl": [
                "readable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ],
          "commandsGenerated": [
            "identifyQuery.response"
          ],
          "commandsReceived": [
            "identify",
            "identifyQuery",
            "triggerEffect"
          ]
        },
        "onOff": {}
      },
      "bindings": {
        "basic": {
          "attributes": [
            {
              "acl": [
                "readable"
              ],
              "id": 0,
              "name": "zclVersion",
              "value": 3
            },
            {
              "acl": [
                "readable"
              ],
              "id": 1,
              "name": "appVersion",
              "value": 25
            },
            {
              "acl": [
                "readable"
              ],
              "id": 2,
              "name": "stackVersion",
              "value": 2
            },
            {
              "acl": [
                "readable"
              ],
              "id": 3,
              "name": "hwVersion",
              "value": 1
            },
            {
              "acl": [
                "readable"
              ],
              "id": 4,
              "name": "manufacturerName",
              "value": "LUMI"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 5,
              "name": "modelId",
              "value": "lumi.remote.cagl02"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 6,
              "name": "dateCode"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 7,
              "name": "powerSource",
              "value": "battery"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 8,
              "name": "appProfileVersion",
              "value": 255
            },
            {
              "acl": [
                "readable"
              ],
              "id": 9
            },
            {
              "acl": [
                "readable"
              ],
              "id": 10
            },
            {
              "acl": [
                "readable"
              ],
              "id": 11
            },
            {
              "acl": [
                "readable"
              ],
              "id": 13
            },
            {
              "acl": [
                "readable"
              ],
              "id": 16384,
              "name": "swBuildId",
              "value": "2019"
            },
            {
              "acl": [
                "readable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ],
          "commandsGenerated": [],
          "commandsReceived": [
            "factoryReset"
          ]
        },
        "identify": {
          "attributes": [
            {
              "acl": [
                "readable",
                "writable"
              ],
              "id": 0,
              "name": "identifyTime",
              "value": 0
            },
            {
              "acl": [
                "readable"
              ],
              "id": 65533,
              "name": "clusterRevision",
              "value": 1
            }
          ],
          "commandsGenerated": [
            "identifyQuery.response"
          ],
          "commandsReceived": [
            "identify",
            "identifyQuery",
            "triggerEffect"
          ]
        }
      }
    }
  }
}

*/
