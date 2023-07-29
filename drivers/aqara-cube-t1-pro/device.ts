

const { ZigBeeDevice } = require("homey-zigbeedriver");

// const { MultistateInputCluster } = require("zigbee-clusters");
import { CLUSTER, ZCLNode } from "zigbee-clusters";


import { AqaraOppleCluster } from './AqaraOppleCluster';

const { debug } = require("zigbee-clusters");

debug(true);


class CubeT1Pro extends ZigBeeDevice {


  async onNodeInit({ zclNode }: { zclNode: ZCLNode }) {
    this.enableDebug();
    this.debug(true);
    this.log('On NOde init has been initialized');
    var cluster = zclNode.endpoints[1].clusters[AqaraOppleCluster.NAME];
    if (this.isFirstInit()) {
      // without this the cube only uses the onOff cluster
      await cluster!.writeAttributes({ operation_mode: 1 });
    }



    zclNode.endpoints[2]
      .clusters.multistateInput!
      .on('attr.presentValue', this.multiStateInputHandler.bind(this));

    // zclNode.endpoints[3]
    // .clusters.analogInput!
    // .on('attr.presentValue', this.analogInputHandler.bind(this));

    // zclNode.endpoints[2]
    // .clusters.aqaraOpple!
    // .on('attr.presentValue', this.analogInputHandler.bind(this));

    // zclNode.endpoints[1]
    //   .clusters[CLUSTER.ANALOG_INPUT.NAME]!
    //   .on('attr.presentValue', this.analogInputHandler.bind(this));
  }

  multiStateInputHandler(data: any) {
    this.log("multiStateInputHandler")
  }

  analogInputHandler(data: any) {
    this.log("analogInputHandler")
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
