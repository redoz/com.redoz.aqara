

const { ZigBeeDevice } = require("homey-zigbeedriver");

import { CLUSTER, ZCLNode } from "zigbee-clusters";

import { AqaraOppleCluster } from './AqaraOppleCluster';

import { Device, FlowCardTriggerDevice } from 'homey'

const { debug } = require("zigbee-clusters");

debug(true);

enum Mode {
  Action = 0,
  Scene = 1
}

interface CubeRotateTriggerArgs {
  degrees: number
  direction: 'either' | 'clockwise' | 'counterclockwise'
}

interface CubeRotateTriggerState {
  degrees: number
}
interface CubeTapTriggerArgs {
  side?: "one" | "two" | "three" | "four" | "five" | "six"
}
interface CubeTapTriggerState {
  side: number
}
class CubeT1Pro extends ZigBeeDevice {

  private _cubeRotateTrigger?: FlowCardTriggerDevice;
  private _cubeShakeTrigger?: FlowCardTriggerDevice;
  private _cubeTapTrigger?: FlowCardTriggerDevice;

  private _mode?: Mode;

  async onNodeInit({ zclNode }: { zclNode: ZCLNode }) {
    this.enableDebug();
    this.debug(true);
    this.log('Initializing node...');
    if (this.isFirstInit()) {
      // without this the cube only uses the onOff cluster
      this.log("Configuring Cube to operate in Event mode...");
      var cluster = zclNode.endpoints[1].clusters[AqaraOppleCluster.NAME]!;
      await cluster.writeAttributes({ operation_mode: 1 });
      this.log("Reading mode attribute...");
      var result = await cluster.readAttributes(['mode']);
      this._mode = result.mode as number;
      await this.setSettings({
        mode: Mode[this._mode]
      });
      this.log("Cube successfully configured");
      // TODO can we fail the pairing operation if fails?
    } else {
      // should probably figure out how to work with Enums in typescript
      this._mode = this.getSettings().mode === "Action" ? Mode.Action : Mode.Scene;
    }

    // maintain the `mode` setting when it's changed on the device
    zclNode.endpoints[1].clusters.aqaraOpple?.on('attr.mode', async (mode: number) => {
      this._mode = mode;
      await this.setSettings({
        mode: Mode[this._mode]
      });
    })

    this._cubeRotateTrigger = this.homey.flow.getDeviceTriggerCard("cube_rotate");
    this._cubeRotateTrigger!.registerRunListener(async (args: CubeRotateTriggerArgs, state: CubeRotateTriggerState) => {
      if (Math.abs(state.degrees) < args.degrees)
        return false;

      if (args.direction === "clockwise")
        return state.degrees > 0;

      if (args.direction === "counterclockwise")
        return state.degrees < 0;

      return true;
    });

    this._cubeShakeTrigger = this.homey.flow.getDeviceTriggerCard("cube_shake");
    this._cubeShakeTrigger!.registerRunListener(async (_args, _state) => true);

    this._cubeTapTrigger = this.homey.flow.getDeviceTriggerCard("cube_tap");
    this._cubeTapTrigger!.registerRunListener(async (args: CubeTapTriggerArgs, state: CubeTapTriggerState) => {
      console.log("args.side", args.side)
      console.log("state.side", state.side)
      if (args.side === undefined)
        return true;

      switch (args.side) {
        case "one":
          return state.side === 1;
        case "two":
          return state.side === 2;
        case "three":
          return state.side === 3;
        case "four":
          return state.side === 4;
        case "five":
          return state.side === 5;
        case "six":
          return state.side === 6;
      }
    });

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


    zclNode.endpoints[2]
      .clusters.multistateInput!
      .on('attr.presentValue', this.multiStateInputHandler.bind(this));

    zclNode.endpoints[3]
      .clusters.analogInput!
      .on('attr.presentValue', this.triggerCubeRotate.bind(this));

    zclNode.endpoints[2]
      .clusters.aqaraOpple!
      .on('attr.presentValue', this.aqaraOppleInputHandler.bind(this));
  }

  async triggerCubeRotate(degrees: number) {
    console.log("Trigger cube rotate", { degrees });

    this._cubeRotateTrigger!
      .trigger(this as unknown as Device, { degrees }, { degrees })
      .then((arg: any) => this.log("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }

  async triggerCubeShake() {
    console.log("Trigger cube shake");

    this._cubeShakeTrigger!
      .trigger(this as unknown as Device, {}, {})
      .then((arg: any) => this.log("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }

  async triggerCubeTap(side: number) {
    console.log("Trigger cube tap");

    this._cubeTapTrigger!
      .trigger(this as unknown as Device, { side }, { side })
      .then((arg: any) => this.log("triggered: ", arg))
      .catch((arg: any) => this.error("error: ", arg))
  }


  async multiStateInputHandler(data: number) {
    var toSideBits = data & 0x07;
    var fromSideBits = (data >> 3) & 0x07;
    var commandBits = (data >> 6);

    var command;
    if (commandBits === 1) {
      // 90 degree flip
      command = "flip90"
      this.log("multiStateInputHandler", {
        data,
        command,
        from: fromSideBits + 1,
        to: toSideBits + 1,
      });
    } else if (commandBits == 2) {
      // 180 degree flip
      command = "flip180"
      this.log("multiStateInputHandler", {
        data,
        command,
        from: 7 - (toSideBits + 1),
        to: toSideBits + 1,
      });
    } else if (commandBits == 0 && fromSideBits === 0 && toSideBits === 0) {
      // shake
      command = "shake"
      this.log("multiStateInputHandler", {
        data,
        command
      });
      await this.triggerCubeShake();
    } else if (commandBits === 8) {
      // double tap
      command = "tap"
      let side = toSideBits + 1;
      this.log("multiStateInputHandler", {
        data,
        command,
        side
      });

      await this.triggerCubeTap(side)
    } else if (commandBits === 4) {
      // push
      command = "push"
      this.log("multiStateInputHandler", {
        data,
        command,
        side: toSideBits + 1
      });
    } else {
      command = "UNKNOWN"
      this.log("multiStateInputHandler", {
        data,
        commandBits,
        fromSideBits,
        toSideBits,
        command
      });
    }
  }



  aqaraOppleInputHandler(data: any) {
    this.log("aqaraOppleInputHandler")
  }

  /**
   * onInit is called when the device is initialized.
   */
  // async onInit() {
  //   this.log('MyDevice has been initialized');

  //   var node = await this.homey.zigbee.getNode(this);

  //   this.log("node", node);
  // }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
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
    this.log("MyDevice settings where changed");
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
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
