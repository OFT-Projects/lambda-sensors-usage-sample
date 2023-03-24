import { handlerPath } from '@libs/handler-resolver';

type IoTSqlVersion = "beta" | "2015-10-08" | "2016-03-23";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "tmsFunctionRole",
  events: [
    {
      iot: {
        sql: "SELECT * AS payload, topic() AS topic FROM '/+/tms'",
        sqlVersion: "2016-03-23" as IoTSqlVersion
      },
    },
  ],
};