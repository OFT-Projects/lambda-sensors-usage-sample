import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "psuFunctionRole",
  events: [
    {
      http: {
        method: "POST",
        path: "psu/{mci}",
        cors: true    
      },
    },
  ],
};