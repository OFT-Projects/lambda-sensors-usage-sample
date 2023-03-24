import { APIGatewayEvent } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { CloudWatchLogs } from 'aws-sdk';
import { FilterLogEventsRequest } from 'aws-sdk/clients/cloudwatchlogs';

// MSR - Microcontroller State Recovery
interface IMSRPayload {
  pathParameters: {
    // MCI - Microcontroller Identificator
    mci: string;
  }
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

// TMS - Target Microcontroller Sensors
interface ITMSPayload { 
  target_sensors: ITSPayload[],
  current_state: {
    components: ICSPayload[],
  },
};

type APIGatewayMSREvent = APIGatewayEvent & IMSRPayload;

const msrFunction = async (event: APIGatewayMSREvent) => {
  try {
    console.info(`API request received from path "${event.path}".`);

    const cloudWatchLogs = new CloudWatchLogs();

    let tmsPayload: ITMSPayload;

    const params: FilterLogEventsRequest = {
      logGroupName: "/aws/lambda/lambda-sensors-usage-sample-dev-tmsFunction",
      startTime: Date.now() - 30000, // Current time less 30 seconds
      filterPattern: `{ $.topic = "/${event.pathParameters.mci}/tms" }`,
    }

    const response = (await cloudWatchLogs.filterLogEvents(params).promise()).$response;

    if (response.error) {
      console.error(response.error.message);
    } else {
      if (response.data) {
        const lastIndex = response.data.events.length - 1;

        if (lastIndex >= 0 && response.data.events[lastIndex] !== null) {
          const startIndex = response.data.events[lastIndex].message.indexOf("payload") + 9;
          const endIndex = response.data.events[lastIndex].message.indexOf("topic") - 2;
  
          tmsPayload = JSON.parse(response.data.events[lastIndex].message.substring(startIndex, endIndex)) as ITMSPayload;
        
          console.info("State successfully recovered from log.");
          console.info(JSON.stringify(tmsPayload));
    
          return { 
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Credentials": true,
            },
            body: JSON.stringify(tmsPayload)
          }

        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }

  return { 
    statusCode: 400,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    }
  }
};

export const main = middyfy(msrFunction);
