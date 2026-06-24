export const MOCK_FLEET = [
  {
    robot_id: 1,
    name: "HD-001",
    operator: "Budi",
    status: "moving",
    battery_level: 82,
    fuel_level: 68,
    fuel_burn_rate: 4.2,
    speed: 18,
    score: 945,
    x_position: 30,
    y_position: 40,
    latitude: -1.2,
    longitude: 116.9,
    geoPosition: [-1.199, 116.901],
  },
  {
    robot_id: 2,
    name: "HD-002",
    operator: "Sarif",
    status: "idle",
    battery_level: 45,
    fuel_level: 22,
    fuel_burn_rate: 0.6,
    speed: 0,
    score: 710,
    x_position: 55,
    y_position: 60,
    latitude: -1.21,
    longitude: 116.91,
    geoPosition: [-1.202, 116.897],
  },
  {
    robot_id: 3,
    name: "HD-003",
    operator: "Agus",
    status: "alert",
    battery_level: 91,
    fuel_level: 87,
    fuel_burn_rate: 3.8,
    speed: 12,
    score: 892,
    x_position: 70,
    y_position: 25,
    latitude: -1.19,
    longitude: 116.92,
    geoPosition: [-1.209, 116.909],
  },
];

// Per-activity (per-cycle/trip) fuel consumption log — mock until backend tracks fuel
export const MOCK_FUEL_ACTIVITY = [
  { robot_id: 1, activity: "Loading A → Dumping B", liters: 3.1, distance_m: 410, efficiency: 0.76 },
  { robot_id: 1, activity: "Dumping B → Loading A", liters: 2.4, distance_m: 410, efficiency: 0.59 },
  { robot_id: 2, activity: "Idle at Loading A", liters: 0.6, distance_m: 0, efficiency: null },
  { robot_id: 3, activity: "Loading A → Dumping B", liters: 3.5, distance_m: 430, efficiency: 0.81 },
];

export const MOCK_LEADERBOARD = MOCK_FLEET.map((r, i) => ({
  rank: i + 1,
  operator: r.operator,
  score: r.score,
  trend: i === 0 ? "up" : i === 1 ? "down" : "up",
}));

export const MOCK_ALERTS = [
  {
    id: 1,
    robot_id: 3,
    level: "warning",
    message: "Obstacle detected near HD-003",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    robot_id: 2,
    level: "info",
    message: "HD-002 idle for 5 minutes",
    created_at: new Date().toISOString(),
  },
];

export function mergeFleetWithLive(liveByRobotName) {
  return MOCK_FLEET.map((mock) => {
    const live = liveByRobotName?.[mock.name];
    return live ? { ...mock, ...live } : mock;
  });
}
