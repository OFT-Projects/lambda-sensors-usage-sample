import type { AWS } from '@serverless/typescript';

import mcsuFunction from '@functions/mcsuFunction';
import msrFunction from '@functions/msrFunction';
import psuFunction from '@functions/psuFunction';
import tmsFunction from '@functions/tmsFunction';

const serverlessConfiguration: AWS = {
  service: 'lambda-sensors-usage-sample',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    }
  },
  functions: { mcsuFunction, msrFunction, psuFunction, tmsFunction },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
  resources: {
    Resources: {
      psuTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName : "id",
              KeyType : "HASH"
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "psu-table"
        }
      },
      tmsFunctionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "tmsFunctionRole",
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              { 
                Effect: "Allow",
                Principal: {
                  Service: [
                    "lambda.amazonaws.com"
                  ],
                },
                Action: "sts:AssumeRole"
              } 
            ] 
          },
          Policies: [
            {
              PolicyName: "tmsFunctionPolicy",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: "Allow",
                    Action: [ 
                      "logs:*",  
                    ],
                    Resource: "*"
                  }
                ]
              }
            }
          ]
        }
      },
      msrFunctionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "msrFunctionRole",
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              { 
                Effect: "Allow",
                Principal: {
                  Service: [
                    "lambda.amazonaws.com"
                  ],
                },
                Action: "sts:AssumeRole"
              } 
            ] 
          },
          Policies: [
            {
              PolicyName: "msrFunctionPolicy",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: "Allow",
                    Action: [ 
                      "logs:*",
                    ],
                    Resource: "*"
                  }
                ]
              }
            }
          ]
        }
      },
      psuFunctionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "psuFunctionRole",
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              { 
                Effect: "Allow",
                Principal: {
                  Service: [
                    "lambda.amazonaws.com"
                  ],
                },
                Action: "sts:AssumeRole"
              } 
            ] 
          },
          Policies: [
            {
              PolicyName: "psuFunctionPolicy",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: "Allow",
                    Action: [ 
                      "iot:*",
                      "logs:*",
                      "dynamodb:*", 
                      "events:*", 
                      "iam:*", 
                      "lambda:*",
                    ],
                    Resource: "*"
                  }
                ]
              }
            }
          ]
        }
      },
      mcsuFunctionRole: {
        Type: "AWS::IAM::Role",
        Properties: {
          RoleName: "mcsuFunctionRole",
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              { 
                Effect: "Allow",
                Principal: {
                  Service: [
                    "lambda.amazonaws.com",
                    "events.amazonaws.com"
                  ],
                },
                Action: [
                  "sts:AssumeRole"
                ]
              }
            ] 
          },
          Policies: [
            {
              PolicyName: "mcsuFunctionPolicy",
              PolicyDocument: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Effect: "Allow",
                    Action: [ 
                      "iot:*",
                      "logs:*",
                      "dynamodb:*", 
                    ],
                    Resource: "*"
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
};

module.exports = serverlessConfiguration;
