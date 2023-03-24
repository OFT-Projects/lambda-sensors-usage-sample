import { IoTEvent } from 'aws-lambda';

import { middyfy } from '@libs/lambda';

// TMS - Target Microcontroller Sensors
interface ITMSPayload {    
  payload: {
    target_sensors: ITSPayload[],
    current_state: {
      components: ICSPayload[],
    },
  },
  topic: string;
};

// TS - Target Sensor
interface ITSPayload {
  sensor: string,
  value: number,
}

// CS - Component State
interface ICSPayload {
  component: string,
  value: number,
}

type IoTTMSEvent = IoTEvent & ITMSPayload;

const tmsFunction = async (event: IoTTMSEvent) => {
  try {
    console.info(`IoT message received from topic "${event.topic}".`);
    console.info(JSON.stringify(event));
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
};

export const main = middyfy(tmsFunction);
