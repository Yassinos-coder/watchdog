export interface HealthStatus {
  status: 'ok';
  service: 'watchdog-server';
  uptimeSeconds: number;
}

export interface ReadinessStatus {
  status: 'ok';
  database: 'up';
}
