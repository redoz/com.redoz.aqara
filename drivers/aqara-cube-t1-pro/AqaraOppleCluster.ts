const { Cluster, ZCLDataTypes, ZCLDataType } = require("zigbee-clusters");

import { DataType } from '@athombv/data-types';

// id: number,
// shortName: string,
// length: number,
// toBuf: ToBuffer,
// fromBuf: FromBuffer,
// ...args: unknown[]
// interface AqaraOppleDeviceInfoAttribute {
//     id: number,
//     name?: string,
//     value: any
// }

export enum AqaraOppleDeviceInfoAttribute {
    BatteryVoltage = 1,
    Rssi = 5,
    OperationMode = 155
}

export interface AqaraOppleLifelineReport {
    [key: string | number]: any;
}

const AqaraOppleLifelineAttributeType = new ZCLDataType(
    NaN,
    'AqaraOppleLifelineAttribute',
    -3,
    () => { throw new Error('Not supported') },
    (buffer: Buffer, index: number, returnLength: boolean) => {
        const origIndex = index;

        // id: 8 bits
        // type: 8 bits
        // value: 8*n bits

        // while (index < buffer.length) {

        // Read the attribute id of this custom attribute-in-an-attribute (first byte)
        var id: number = ZCLDataTypes.uint8.fromBuffer(buffer, index);
        index += ZCLDataTypes.uint8.length;

        // Read the ZCL data type of this custom attribute-in-an-attribute (second byte)
        var dataTypeId: number = ZCLDataTypes.uint8.fromBuffer(buffer, index);
        index += ZCLDataTypes.uint8.length;

        console.log("Lifeline attribute", {id, dataTypeId});

        var dataType: any = Object.values(ZCLDataTypes).find(type => (type as any).id === dataTypeId);

        // console.log("data types: ", Object.values(ZCLDataTypes).map(x => (x as any).id));
        // Abort if no valid data type was found
        if (!dataType) throw new TypeError(`Invalid type (${dataTypeId}) for attribute: ${id}`);

        // eslint-disable-next-line no-mixed-operators
        var name = AqaraOppleDeviceInfoAttribute[id] ?? id.toString(10);


        // Parse the value from the buffer using the DataType
        const entry = dataType.fromBuffer(buffer, index, true);

        let value;
        if (dataType.length > 0) {
            index += DataType.length;
            value = entry;
            // result[attributeId] = entry;
            // result[attributeName] = entry;
        } else {
            // result[attributeId] = entry.result;
            // result[attributeName] = entry.result;
            index += entry.length;
            value = entry.result;
        }

        let result : {name: string, id: number, value: any} = {
            id,
            name,
            value
        }
        
        // }

        if (returnLength) {
            return { result, length: index - origIndex };
        }
        return result;
    });


const AqaraOppleLifelineReportType = new ZCLDataType(
    NaN,
    'AqaraOppleLifelineReport',
    -1,
    () => { throw new Error('Not supported') },
    (buffer: Buffer, index: number, returnLength: boolean) => {
        console.log("AqaraOppleLifelineReportType", buffer)
        let { result, length } = ZCLDataTypes.buffer8.fromBuffer(buffer, index, true);
        console.log("buffer8", result)
        let attrs = ZCLDataTypes.Array0(AqaraOppleLifelineAttributeType).fromBuffer(result, 0) as { id: number, name: string, value: any }[];
        let ret = attrs.reduce((r, { id, name, value }) => Object.assign(r, { [name]: value, [id]: value }), {});
        if (returnLength) {
            return { ret, length };
        }
        return ret;
    });

// Define the cluster attributes
const ATTRIBUTES = {
    operation_mode: { // event or command
        id: 0x009,
        type: ZCLDataTypes.uint8,
        manufacturerId: 0x115f,
    },
    mode: { // scene or action
        id: 0x0148,
        type: ZCLDataTypes.uint8,
        manufacturerId: 0x115f,
    },
    side: {
        id: 0x0149,
        type: ZCLDataTypes.uint8,
        manufacturerId: 0x115f,
    },
    lifeline: {
        id: 0x00F7,
        type: AqaraOppleLifelineReportType,
        manufacturerId: 0x115f,
    }
};

// Define the cluster commands (with potential required arguments)
const COMMANDS = {
};

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

