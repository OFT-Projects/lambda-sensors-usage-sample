import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  role: "mcsuFunctionRole",
  events: [
    {
      http: {
        method: "POST",
        path: "mcsu/{mci}",
        cors: true,
      },
    },
  ],
};