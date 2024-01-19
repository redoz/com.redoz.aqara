import Homey, { FlowCardTriggerDevice } from 'homey';

export type ButtonAction = "press_once"
                         | "press_twice"
                         | "press_thrice"
                         | "press_five_times"
                         | "press_six_or_more_times"
                         | "press_and_hold" 
                         | "release_after_hold";

export interface ButtonPushTriggerState {
  action: ButtonAction
}

export class WirelessMiniSwitchT1Driver extends Homey.Driver {

  private _buttonPressedTrigger?: FlowCardTriggerDevice;
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    super.onInit();

    this._buttonPressedTrigger = this.homey.flow.getDeviceTriggerCard("main_button_pressed");
    this._buttonPressedTrigger.registerRunListener(async (args: any, state: ButtonPushTriggerState) => {
      return args.action === state.action;
    });

    this.log('WirelessMiniSwitchT1Driver has been initialized');
  }

  public async triggerOnButtonPressed(device : Homey.Device, state: ButtonPushTriggerState) {
    await this._buttonPressedTrigger!
      .trigger(device, undefined, state)
      .then(this.log)
      .catch(this.error);
  }
}

module.exports = WirelessMiniSwitchT1Driver;
