import { Apps } from '@vtex/api'
import axios from "axios";

const appConfig = async (vtex: any, allowSensitiveInfo: Boolean) => {
  const apps = new Apps(vtex)
  let data
  try {
      data = await apps.getAppSettings('storeido.store-locator')
  } catch (err) {
      console.error(`[SETTINGS] - Error getting settings: ${err}`)
  }

  console.log("data", data);
  const r = {
    defaultLat: data.defaultLat,
    defaultLng: data.defaultLng,
    visibleTags: data.visibleTags
  }

  if (allowSensitiveInfo) {
    return data
  }

  return r
}

const getPickupsRequest = async (vtex: any) => {
  let allStores
  const config = await appConfig(vtex, true) //get store appKey and token

  console.log("config", config); //debug here

  try {
    const url = `http://${vtex.account}.myvtex.com/api/logistics/pvt/configuration/pickuppoints/_search?an=${vtex.account}&page=1&pageSize=100`

    allStores = (await axios({
      url: url,
      method: "GET",
      headers: {
        "Cache-Control": "no-store, no-cache",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Vtex-Api-AppKey": config.appKey,
        "X-Vtex-Api-AppToken": config.appToken,
        "Proxy-Authorization": vtex.authToken,
        "X-Vtex-Use-Https": true,
        "X-Vtex-Proxy-To": url
      }
    })).data

  } catch (e) {
    console.error("deu erro.");
    console.error("error", e);
  }

  console.log("allStores", allStores);

  return (allStores && allStores.items) ? allStores.items : []
}

const getPickups = async (_: any, __: any, ctx: any) => {
  return await getPickupsRequest(ctx.vtex);
}

const getAppSettings = async (_: any, __: any, ctx: any) => {
  return await appConfig(ctx.vtex, false)
}

export {
  getPickups,
  getAppSettings
};
