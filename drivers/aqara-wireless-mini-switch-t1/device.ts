const { ZigBeeDevice } = require("homey-zigbeedriver");

import { CLUSTER, ZCLNode } from "zigbee-clusters";

import { AqaraOppleCluster, AqaraOppleDeviceInfoAttribute, AqaraOppleLifelineReport } from '../../shared/AqaraOppleCluster';

import { ButtonAction, WirelessMiniSwitchT1Driver } from './driver';
import Homey from 'homey';

const { debug } = require("zigbee-clusters");

debug(true);

class WirelessMiniSwitchT1 extends ZigBeeDevice {


  /**
   * onInit is called when the device is initialized.
   */
  // async onInit() {
  //   this.log('WirelessMiniSwitchT1 has been initialized');
  // }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('WirelessMiniSwitchT1 has been added');
  }


  async onNodeInit({ zclNode }: { zclNode: ZCLNode }) {

    this.enableDebug();
    this.debug(true);

    this.log('Initializing node...');


    if (this.isFirstInit()) {
      this.debug("Configuring switch...");
      var cluster = zclNode.endpoints[1].clusters[AqaraOppleCluster.NAME]!;
      await cluster.writeAttributes({ operation_mode: 1 });
      this.debug("Switch successfully configured");
    }

    zclNode.endpoints[1].clusters.multistateInput!.on('attr.presentValue', this.multiStateInputHandler.bind(this));


      // TODO can we fail the pairing operation if fails?
    // } else {
    //   // should probably figure out how to work with Enums in typescript
    //   this._mode = this.getSettings().mode === "Action" ? Mode.Action : Mode.Scene;
    // }

    // // maintain the `mode` setting when it's changed on the device
    // zclNode.endpoints[1].clusters.aqaraOpple?.on('attr.mode', async (mode: number) => {
    //   this._mode = mode;
    //   await this.setMode(mode);
    // })
    
    // zclNode.endpoints[2].clusters.aqaraOpple?.on('attr.side', this.sideUpHandler.bind(this));

    zclNode.endpoints[1].clusters.aqaraOpple!.on('attr.lifeline', this.aparaOppleLifelineHandler.bind(this));
      
    // zclNode.endpoints[2].clusters.multistateInput!.on('attr.presentValue', this.multiStateInputHandler.bind(this));

    // zclNode.endpoints[3].clusters[AqaraAnalogInputCluster.NAME]!.on('attr.presentValue', this.triggerCubeRotate.bind(this));

    // zclNode.endpoints[3].clusters[AqaraAnalogInputCluster.NAME]!.on('attr.side', this.sideUpHandler.bind(this));

    // zclNode.endpoints[3]
    //   .clusters[AqaraAnalogInputCluster.NAME]!
    //   .on('attr.unknown_0x010b', async (value: number) => {
        
    //     this.debug("unknown_0x010b", value);
    //   });
    this.log('Node initialized');
  }

  async multiStateInputHandler(data: number) {
    let device : Homey.Device = this as unknown as Homey.Device;
     this.driver.ready().then(async () => {
      this.log("WAHOOO");
      let action : ButtonAction 
      
      switch (data) {
        case 1:
          action = "press_once";
          break;

        case 2:
          action = "press_twice";
          break;

        case 3:
          action = "press_thrice";
          break;

        case 5:
          action = "press_five_times";
          break;

        case 6:
          action = "press_six_or_more_times";
          break;

        case 0:
          action = "press_and_hold";
          break;

        case 255:
          action = "release_after_hold";
          break;
        
        default:
          this.log("Unknown message: " + data)
          return;
      }
        
      
      await (this.driver as WirelessMiniSwitchT1Driver).triggerOnButtonPressed(device, {action});
    });

    this.debug("multiStateInputHandler", {
      data
    });
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
    this.log("WirelessMiniSwitchT1 settings where changed");
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name: string) {
    this.log('WirelessMiniSwitchT1 was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('WirelessMiniSwitchT1 has been deleted');
  }

}

module.exports = WirelessMiniSwitchT1;
