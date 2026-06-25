// Berau Mine Pit — Binungan, Kec. Sambaliung, Kab. Berau, Kalimantan Timur.
// Site location per pamapersada.com/en/our-project (BRCB/BRCG). North of equator — positive lat.
export const MINE_CENTER = [2.05, 117.45];

export const MINE_BOUNDARY_GEOJSON = {
  type: "Feature",
  properties: { name: "Berau Mine Pit" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [117.436, 2.062],
        [117.452, 2.066],
        [117.466, 2.058],
        [117.468, 2.044],
        [117.458, 2.034],
        [117.442, 2.036],
        [117.432, 2.048],
        [117.436, 2.062],
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
      [117.442, 2.046],
      [117.447, 2.052],
      [117.453, 2.054],
      [117.46, 2.05],
      [117.463, 2.043],
    ],
  },
};

export const WAYPOINTS = [
  { name: "Loading Point A", position: [2.046, 117.442] },
  { name: "Dumping Point B", position: [2.043, 117.463] },
];

export const ROBOT_GEO_POSITIONS = {
  "HD-001": [2.051, 117.451],
  "HD-002": [2.048, 117.447],
  "HD-003": [2.041, 117.459],
};
