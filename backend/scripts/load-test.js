/* eslint-disable */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // simulate ramp-up of traffic from 1 to 20 users over 30 seconds.
    { duration: '1m', target: 20 },  // stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api';

export default function () {
  const res = http.get(`${BASE_URL}/system/status`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'returns needsSetup field': (r) => r.body.includes('needsSetup'),
  });

  sleep(1);
}
