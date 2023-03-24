import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDB, EventBridge, Lambda } from 'aws-sdk';
import { BatchWriteItemInput } from 'aws-sdk/clients/dynamodb';
import { PutRuleRequest, PutTargetsRequest } from 'aws-sdk/clients/cloudwatchevents';
import { AddPermissionRequest } from 'aws-sdk/clients/lambda';
import { v4 as uuidv4 } from 'uuid';

import { middyfy } from '@libs/lambda';

// PSU - Periodic State Update
interface IPSUPayload {    
  body: {
    psu: [
      {
        order: number;
        state_update: {
          components: ICSPayload[],
        },
      }
    ],
    schedule_expression: string;
  },
  pathParameters: {
    // MCI - Microcontroller Identificator
    mci: string;
  }
};

// CS - Component State
interface ICSPayload {
  component: string,
  value: number,
}

type APIGatewayPSUEvent = APIGatewayEvent & IPSUPayload;

const psuFunction = async (event: APIGatewayPSUEvent) => {
  try {
    event.body = JSON.parse(event.body);
    event.pathParameters = {
      mci: event.pathParameters["mci"],
    };

    console.info(`API request received from path "${event.path}".`);
    console.info(JSON.stringify(event.body));

    const ddb = new DynamoDB({apiVersion: '2012-08-10'});

    const orderId = uuidv4();
    let insertionDbError = false;

    const params: BatchWriteItemInput = {
      RequestItems: {
        'psu-table': []
      }
    };

    event.body.psu.map(su => {
      params.RequestItems['psu-table'].push({
        PutRequest: {
          Item: {
            'id' : {
              S: uuidv4(),
            },
            'mci' : {
              S: event.pathParameters.mci,
            },
            'order_id' : {
              S: orderId,
            },
            'order' : {
              N: (su.order).toString(),
            },
            'is_current' : {
              N: (0).toString(),
            },
            'state_update' : {
              S: JSON.stringify(su.state_update),
            },
          },
        },
      });
    });

    const response = (await ddb.batchWriteItem(params).promise()).$response;

    if (response.error) {
      console.error(response.error.message);
      insertionDbError = true;
    } else {
      console.info(`All state updates for microcontroller 
        "${event.pathParameters.mci}" inserted successfully.`);
    }

    if (!insertionDbError) {
      let insertionEbError = false;

      const eb = new EventBridge({
        apiVersion: '2015-10-07'
      });

      const params: PutRuleRequest = {
        Name: `rule-order-id_${orderId}`,
        RoleArn: process.env.ROLE_ARN_MCSU,
        ScheduleExpression: event.body.schedule_expression,
        State: 'ENABLED',
      };

      const response = (await eb.putRule(params).promise()).$response;

      if (response.error) {
        console.error(response.error.message);
        insertionDbError = true;
      } else {
        const params: PutTargetsRequest = {
          Rule: `rule-order-id_${orderId}`,
          Targets: [{
            Arn: process.env.ARN_MCSU,
            Id: uuidv4(),
          }]
        };
        
        const response = (await eb.putTargets(params).promise()).$response;

        if (response.error) {
          console.error(response.error.message);
        } else {
          const lambda = new Lambda();

          const params: AddPermissionRequest = {
            Action: "lambda:InvokeFunction",
            FunctionName: process.env.ARN_MCSU,
            Principal: "events.amazonaws.com",
            StatementId: uuidv4(),
            SourceArn: `${process.env.ARN_RULE_ORDER}/rule-order-id_${orderId}`
          };
          
          const response = (await lambda.addPermission(params).promise()).$response;

          if (response.error) {
            console.error(response.error.message);
          } else {
            console.info(`State updates for microcontroller
              "${event.pathParameters.mci}" scheduled successfully.`);

            return { statusCode: 200 }
          }
        }
      }

      if (insertionEbError) {
        let removalDbError = null;

        event.body.psu.map(async su => {
          const params = {
            TableName: 'psu-table',
            Key: {
              'order_id' : {
                S: orderId
              },
              'order' : {
                N: (su.order).toString()
              },
            },
          };

          const response = (await ddb.deleteItem(params).promise()).$response;

          if (response.error) {
            removalDbError = response.error.message;
            return;
          }
        });

        if (removalDbError) {
          console.error(removalDbError);
        } else {
          console.info(`All state updates for microcontroller 
            "${event.pathParameters.mci}" deleted due to EB error.`);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
  }

  return { statusCode: 400 }
};

export const main = middyfy(psuFunction);
