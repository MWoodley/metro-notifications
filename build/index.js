"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccountKey_json_1 = __importDefault(require("./serviceAccountKey.json"));
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccountKey_json_1.default),
});
const client = axios_1.default.create({
    baseURL: "https://livemap.nexus.org.uk/departures/",
});
const monument = {
    stopId: "9400ZZTWMMT1",
    stopType: "",
    stopName: "",
};
const seaburn = {
    stopId: "9400ZZTWSBN2",
    stopName: "",
    stopType: "",
};
const coreRequest = (platform) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const body = Object.assign(Object.assign({}, platform), { departureDate: now.toISOString(), clientTimeZoneOffsetInMS: 0, departureTime: now.toISOString(), departureOrArrival: "ARRIVAL", requestTime: "2022-12-14T21:10:28.589Z" });
    let t = now.toString();
    return (yield client.post(now.toString(), body)).data;
});
const sendNotification = (type, stops) => __awaiter(void 0, void 0, void 0, function* () {
    const title = `Upcoming ${type} metros`;
    const now = new Date();
    let body = "";
    if (stops.length === 0) {
        body = "No upcoming metros";
    }
    else {
        body = stops
            .map((stop) => (Object.assign(Object.assign({}, stop), { scheduledDeparture: new Date(stop.scheduledDeparture) })))
            .filter((stop) => stop.scheduledDeparture >= now)
            .map((stop, i) => `${i + 1}. ${stop.scheduledDeparture.toLocaleTimeString("en-GB")} to ${stop.destination}`)
            .join("\n");
    }
    console.log(body);
    const topic = "topic";
    const message = {
        notification: {
            title,
            body,
        },
        topic: topic,
    };
    yield firebase_admin_1.default.messaging().send(message);
});
const main = (type) => __awaiter(void 0, void 0, void 0, function* () {
    const stops = yield coreRequest(type === "seaburn" ? seaburn : monument);
    if (stops.status !== "SUCCESS") {
        throw "aaaaaa";
    }
    yield sendNotification(type, stops.body.stopDepartures);
});
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
//# sourceMappingURL=index.js.map