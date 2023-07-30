const { Cluster, ZCLDataTypes } = require("zigbee-clusters");

// Define the cluster attributes
const ATTRIBUTES = {
    operation_mode: {
        id: 0x009,
        type: ZCLDataTypes.uint8,
        manufacturerId: 0x115f,
    },
    mode: {
        id: 0x0148,
        type: ZCLDataTypes.uint8,
        manufacturerId: 0x115f,
    },
    side: {
        id: 0x0149,
        type: ZCLDataTypes.uint8,
        manufacturerId: 0x115f,
    }
};

// Define the cluster commands (with potential required arguments)
const COMMANDS = {
    // toggleMode: { 
    //     id: 0,
    //     args: {
    //         mode: ZCLDataTypes.uint8
    //     }
    //  },
    // toggle: { id: 2 },
    // onWithTimedOff: {
    //     id: 66,
    //     // Optional property that can be used to implement two commands with the same id but different directions. Both commands must have a direction property in that case. See lib/clusters/iasZone.js as example.
    //     // direction: Cluster.DIRECTION_SERVER_TO_CLIENT
    //     args: {
    //         onOffControl: ZCLDataTypes.uint8, // Use the `ZCLDataTypes` object to specify types
    //         onTime: ZCLDataTypes.uint16,
    //         offWaitTime: ZCLDataTypes.uint16,
    //     },
    // },
};

// Implement the OnOff cluster by extending `Cluster`
export class AqaraOppleCluster extends Cluster {
    static get ID() {
        return 0xFCC0; // The cluster id
    }

    static get NAME() {
        return "aqaraOpple"; // The cluster name
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES; // Returns the defined attributes
    }

    static get COMMANDS() {
        return COMMANDS; // Returns the defined commands
    }
}

// Add the cluster to the clusters that will be available on the `ZCLNode`
Cluster.addCluster(AqaraOppleCluster);

