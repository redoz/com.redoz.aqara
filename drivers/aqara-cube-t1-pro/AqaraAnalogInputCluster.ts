const { Cluster, ZCLDataTypes, AnalogInputCluster } = require("zigbee-clusters");

// Define the cluster attributes
const ATTRIBUTES = {
    ... AnalogInputCluster.ATTRIBUTES,
    side: { 
        id: 0x0149,
        type: ZCLDataTypes.uint8,
        manufacturerId: 0x115f,
    },
    unknown_0x010b: {
        id: 0x010b,
        type: ZCLDataTypes.uint16,
        manufacturerId: 0x115f,
    }
};

// Define the cluster commands (with potential required arguments)
const COMMANDS = {
    ... AnalogInputCluster.COMMANDS
};

export class AqaraAnalogInputCluster extends AnalogInputCluster {
    static get ID() {
        return 0x000C; // The cluster id
    }

    static get NAME() {
        return "aqaraAnalogInput"; // The cluster name
    }

    static get ATTRIBUTES() {
        return ATTRIBUTES; // Returns the defined attributes
    }

    static get COMMANDS() {
        return COMMANDS; // Returns the defined commands
    }
}

// Add the cluster to the clusters that will be available on the `ZCLNode`
Cluster.addCluster(AqaraAnalogInputCluster);

