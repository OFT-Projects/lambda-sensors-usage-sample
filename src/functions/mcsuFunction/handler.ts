import { APIGatewayEvent, ScheduledEvent } from 'aws-lambda';
import { IotData, DynamoDB } from 'aws-sdk';
import { BatchStatementRequest, UpdateItemInput } from 'aws-sdk/clients/dynamodb';

import { middyfy } from '@libs/lambda';

// MCMU - Microcontroller Components Manual Update
interface IMCMUPayload {
  body: {
    state_update: {
      components: ICSPayload[],
    },
  },
  pathParameters: {
    // MCI - Microcontroller Identificator
    mci: string;
  }
};

// MCSU - Microcontroller Components State Update
interface IMCSUPayload {
  payload: {
    state_update: IStateUpdatePayload,
  },
  topic: string;
};

interface IStateUpdatePayload {
  components: ICSPayload[],
}

// PSU - Periodic State Update
interface IPSUTableRow {
  mci: string,
  state_update: IStateUpdatePayload,
  is_current: boolean,
  order_id: string,
  order: number,
  id: string,
}

// CS - Component State
interface ICSPayload {
  component: string,
  value: number,
}

type APIGatewayMCMUEvent = APIGatewayEvent & IMCMUPayload;

const mcsuFunction = async (event: APIGatewayMCMUEvent | ScheduledEvent) => {
  try {
    let mcsuPayload: IMCSUPayload;

    if (isAPIGatewayMCMUEvent(event)) {
      event.body = JSON.parse(event.body);
      event.pathParameters = {
        mci: event.pathParameters["mci"],
      };
  
      console.info(`API request received from path "${event.path}".`);
      console.info(JSON.stringify(event.body));
      
      mcsuPayload = {
        payload: {
          state_update: event.body.state_update
        },
        topic: `/${event.pathParameters.mci}/mcsu`,
      }

      console.log(mcsuPayload);
    } else {
      const ddb = new DynamoDB({
        apiVersion: '2012-08-10'
      });

      const orderId = event.resources[0].split('/')[1].split('_')[1];
      
      const params: BatchStatementRequest = {
        Statement: `select * from "psu-table" where order_id = '${orderId}'`,
      };

      const response = (await ddb.executeStatement(params).promise()).$response;

      if (response.error) {
        console.error(response.error.message);
      } else {
        const psuTableRows: IPSUTableRow[] = [];

        response.data['Items'].map((item: any) => {
          psuTableRows.push({
            id: item['id']['S'],
            is_current: Number(item['is_current']['N']) === 1,
            mci: item['mci']['S'],
            order: Number(item['order']['N']),
            order_id: item['order_id']['S'],
            state_update: JSON.parse(item['state_update']['S']) as IStateUpdatePayload
          });
        });
        
        let currentPSUTableRow: IPSUTableRow;
        let nextPSUTableRow: IPSUTableRow;

        psuTableRows.map(psuTableRow => {
          if (psuTableRow.is_current) {
            currentPSUTableRow = psuTableRow;
          }
        });

        if (currentPSUTableRow) {
          nextPSUTableRow = psuTableRows.find(tr => tr.order === currentPSUTableRow.order + 1);

          const params: UpdateItemInput = {
            TableName: 'psu-table',
            Key: {
              'id' : {
                S: currentPSUTableRow.id,
              },
            },
            UpdateExpression: 'set is_current = :x',
            ExpressionAttributeValues: {
              ':x' : {
                N: (0).toString(),
              },
            },
          };

          const updateResponse = (await ddb.updateItem(params).promise()).$response;

          if (updateResponse.error) {
            console.error(updateResponse.error);
          } else {
            console.info(`Current state update for microcontroller 
              "${currentPSUTableRow.mci}" set to 0.`);
          }
        }

        if (!nextPSUTableRow) {
          nextPSUTableRow = psuTableRows.find(tr => tr.order === 1);
        }
        
        const params: UpdateItemInput = {
          TableName: 'psu-table',
          Key: {
            'id' : {
              S: nextPSUTableRow.id,
            },
          },
          UpdateExpression: 'set is_current = :x',
          ExpressionAttributeValues: {
            ':x' : {
              N: (1).toString(),
            },
          },
        };

        const updateResponse = (await ddb.updateItem(params).promise()).$response;

        if (updateResponse.error) {
          console.error(updateResponse.error);
        } else {
          console.info(`New state update for microcontroller 
            "${nextPSUTableRow.mci}" set to 1.`);
        }

        mcsuPayload = {
          payload: {
            state_update: nextPSUTableRow.state_update,
          },
          topic: `/${nextPSUTableRow.mci}/mcsu`
        }
      }
    }

    if (mcsuPayload !== undefined) {
      if (mcsuPayload.payload.state_update.components.length > 0) {
        await publishMessage({
          topic: mcsuPayload.topic,
          payload: JSON.stringify(mcsuPayload.payload),
        });
        
        console.info(`IoT message published to topic "${mcsuPayload.topic}".`);
        console.info(JSON.stringify(mcsuPayload.payload));
      } else {
        console.info("No components state update.");
      }

      if (isAPIGatewayMCMUEvent(event)) {
        return { 
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
          }
        }
      }
    } else {
      console.error("No state update payload found");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }

  if (isAPIGatewayMCMUEvent(event)) {
    return { 
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      }
    }
  }
};

const isAPIGatewayMCMUEvent = (
  event: APIGatewayMCMUEvent | ScheduledEvent
  ): event is APIGatewayMCMUEvent => {
  return (<APIGatewayMCMUEvent>event).body !== undefined;
}

const publishMessage = async (params: IotData.PublishRequest) => {
  const iotData = new IotData({
    endpoint: process.env.IOT_DATA_ENDPOINT,
  });
    
  await iotData.publish(params).promise();
}

export const main = middyfy(mcsuFunction);
