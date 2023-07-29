declare module 'homey-zigbeedriver' {

    import { Device, ZigBeeNode } from 'homey';
    import { ZCLNode } from 'zigbee-clusters';

    declare class ZigBeeDevice extends Device {
        async onNodeInit(arg: { zclNode: ZCLNode, node : ZigBeeNode });
    }
}