import axios from "axios";
import admin from "firebase-admin";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import serviceAccount from "./serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

const client = axios.create({
  baseURL: "https://livemap.nexus.org.uk/departures/",
});

interface Platform {
  stopId: string;
  stopType: string;
  stopName: string;
}

interface StopDeparture {
  destination: string;
  scheduledDeparture: number;
  serviceNumber: string;
  serviceID: string;
  operator: {
    operatorCode: string;
  };
  stopAssets: [];
  departureOrArrival: "ARRIVAL";
  transportMode: string;
}

interface Response {
  status: "SUCCESS" | "ERROR";
  body: {
    stopDepartures: StopDeparture[];
  };
}

const monument: Platform = {
  stopId: "9400ZZTWMMT1",
  stopType: "",
  stopName: "",
};
const seaburn: Platform = {
  stopId: "9400ZZTWSBN2",
  stopName: "",
  stopType: "",
};

const coreRequest = async (platform: Platform) => {
  const now = new Date();
  const body = {
    ...platform,
    departureDate: now.toISOString(),
    clientTimeZoneOffsetInMS: 0,
    departureTime: now.toISOString(),
    departureOrArrival: "ARRIVAL",
    requestTime: "2022-12-14T21:10:28.589Z",
  };
  let t = now.toString();

  return (await client.post<Response>(now.toString(), body)).data;
};

const sendNotification = async (type: string, stops: StopDeparture[]) => {
  const title = `Upcoming ${type} metros`;
  const now = new Date();

  let body = "";
  if (stops.length === 0) {
    body = "No upcoming metros";
  } else {
    body = stops
      .map((stop) => ({
        ...stop,
        scheduledDeparture: new Date(stop.scheduledDeparture),
      }))
      .filter((stop) => stop.scheduledDeparture >= now)
      .map(
        (stop, i) =>
          `${i + 1}. ${stop.scheduledDeparture.toLocaleTimeString(
            "en-GB"
          )} to ${stop.destination}`
      )
      .join("\n");
  }

  console.log(body);

  const topic = "topic";
  const message: Message = {
    notification: {
      title,
      body,
    },
    topic: topic,
  };
  await admin.messaging().send(message);
};

const main = async (type: string) => {
  const stops = await coreRequest(type === "seaburn" ? seaburn : monument);
  if (stops.status !== "SUCCESS") {
    throw "aaaaaa";
  }

  await sendNotification(type, stops.body.stopDepartures);
};

const myArgs = process.argv.slice(2);
if (myArgs.length === 0 || !["seaburn", "monument"].includes(myArgs[0])) {
  throw "Invalid arguments";
}

main(myArgs[0])
  .then(() => {
    console.log("success");
  })
  .catch((e) => {
    console.error(e);
  });
