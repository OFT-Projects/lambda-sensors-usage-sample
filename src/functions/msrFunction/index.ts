import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "msrFunctionRole",
  events: [
    {
      http: {
        method: "POST",
        path: "msr/{mci}",
        cors: true    
      },
    },
  ],
};