// Lasttest för att visa autoscaling (HPA). Kör med:
//   BASE_URL=https://api.<domän> k6 run deploy/loadtest/load.js
// Under testet ökar antalet backend-pods: kubectl -n eventplan get hpa -w
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8081";
// Bara för lokal test mot k3d/Traefik, där routing sker på Host-headern
const params = __ENV.HOST_HEADER ? { headers: { Host: __ENV.HOST_HEADER } } : {};

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "2m", target: 150 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/events`, params);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(0.1);
}
