import {
  getPickups,
  getAppSettings
} from "./resolvers";

import { Service, IOClients } from "@vtex/api";

export default new Service<IOClients>({
  graphql: {
    resolvers: {
      Query: {
        getPickups,
        getAppSettings
      }
    }
  }
});
