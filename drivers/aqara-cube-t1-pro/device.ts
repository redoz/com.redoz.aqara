

const { ZigBeeDevice } = require("homey-zigbeedriver");

import { CLUSTER, ZCLNode } from "zigbee-clusters";

import { AqaraOppleCluster } from './AqaraOppleCluster';

import { Device, FlowCardTriggerDevice } from 'homey'

const { debug } = require("zigbee-clusters");

debug(true);


class CubeT1Pro extends ZigBeeDevice {

  private _cubeRotated? : FlowCardTriggerDevice;

  async onNodeInit({ zclNode }: { zclNode: ZCLNode }) {
    this.enableDebug();
    this.debug(true);
    this.log('Initializing node...');
    if (this.isFirstInit()) {
      // without this the cube only uses the onOff cluster
      this.log("Configuring Cube to operate in Event mode...");
      await zclNode.endpoints[1].clusters[AqaraOppleCluster.NAME]!.writeAttributes({ operation_mode: 1 });
      this.log("Cube successfully configured");
      // TODO can we fail the pairing operation if fails?
    }

    this._cubeRotated = this.homey.flow.getDeviceTriggerCard("cube_rotated");

    this._cubeRotated!.registerRunListener(async (args, state) => {
      return true;
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

    // zclNode.endpoints[3]
    //   .clusters.analogInput!.configureReporting({
    //     'presentValue': {
    //       // rely on device defaults: https://athombv.github.io/node-homey-zigbeedriver/global.html#AttributeReportingConfiguration
    //       minInterval: 0xFFFF,
    //       maxInterval: 0,
    //     }
    //   });

    // zclNode.endpoints[3]
    //   .clusters.analogInput!
    //   .on('attr.presentValue', this.analogInputHandler.bind(this));


    zclNode.endpoints[3]
      .clusters.analogInput!
      .on('attr.presentValue', this.triggerCubeRotated);

    zclNode.endpoints[2]
      .clusters.aqaraOpple!
      .on('attr.presentValue', this.aqaraOppleInputHandler.bind(this));

    // zclNode.endpoints[1]
    //   .clusters[CLUSTER.ANALOG_INPUT.NAME]!
    //   .on('attr.presentValue', this.analogInputHandler.bind(this));


  }

  triggerCubeRotated = async (degrees: number) => {
    var arrayOfCardArgumnets : {
      degrees: number, 
      direction: "either"|"clockwise"|"counterclockwise" 
    }[] = await this._cubeRotated!.getArgumentValues(this as unknown as Device);

    for (let instance = 0; instance < arrayOfCardArgumnets.length; instance++) {
      const cardArgs = arrayOfCardArgumnets[instance];
      
      this.log("args", cardArgs);
      // only if the degrees requirement is met
      console.log("degrees", degrees);

      if (Math.abs(degrees) < cardArgs.degrees)
        return;

      if (cardArgs.direction === "clockwise" && degrees < 0)
        return

      if (cardArgs.direction === "counterclockwise" && degrees > 0)
        return

      this._cubeRotated!
        .trigger(this as unknown as Device, {"degrees": degrees}, {})
        .then((arg:any) => this.log("triggered: ", arg))
        .catch((arg:any) => this.error("error: ", arg))
    }
  }

  multiStateInputHandler(data: any) {
    this.log("multiStateInputHandler")
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
