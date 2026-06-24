export const MINE_CENTER = [-1.2, 116.9];

export const MINE_BOUNDARY_GEOJSON = {
  type: "Feature",
  properties: { name: "Berau Mine Pit" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [116.886, -1.188],
        [116.902, -1.184],
        [116.916, -1.192],
        [116.918, -1.206],
        [116.908, -1.216],
        [116.892, -1.214],
        [116.882, -1.202],
        [116.886, -1.188],
      ],
    ],
  },
};

export const HAUL_ROAD_GEOJSON = {
  type: "Feature",
  properties: { name: "Main Haul Road" },
  geometry: {
    type: "LineString",
    coordinates: [
      [116.892, -1.204],
      [116.897, -1.198],
      [116.903, -1.196],
      [116.91, -1.2],
      [116.913, -1.207],
    ],
  },
};

export const WAYPOINTS = [
  { name: "Loading Point A", position: [-1.204, 116.892] },
  { name: "Dumping Point B", position: [-1.207, 116.913] },
];

export const ROBOT_GEO_POSITIONS = {
  "HD-001": [-1.199, 116.901],
  "HD-002": [-1.202, 116.897],
  "HD-003": [-1.209, 116.909],
};
