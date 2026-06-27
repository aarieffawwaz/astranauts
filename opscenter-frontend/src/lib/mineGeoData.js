// Berau Mine Pit — Binungan, Kec. Sambaliung, Kab. Berau, Kalimantan Timur.
// Site location per pamapersada.com/en/our-project (BRCB/BRCG). North of equator — positive lat.
// Coordinates calibrated against the actual Esri World_Imagery pit terrain
// (the open-pit excavation visible in satellite tiles sits ~0.048° west and
// ~0.056° north of the originally hand-typed guesses — without this shift the
// boundary/waypoints render over plain forest instead of over the real pit).
export const MINE_CENTER = [2.1063, 117.4022];

export const MINE_BOUNDARY_GEOJSON = {
  type: "Feature",
  properties: { name: "Berau Mine Pit" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [117.3882, 2.1183],
        [117.4042, 2.1223],
        [117.4182, 2.1143],
        [117.4202, 2.1003],
        [117.4102, 2.0903],
        [117.3942, 2.0923],
        [117.3842, 2.1043],
        [117.3882, 2.1183],
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
      [117.3942, 2.1023],
      [117.3992, 2.1083],
      [117.4052, 2.1103],
      [117.4122, 2.1063],
      [117.4152, 2.0993],
    ],
  },
};

export const WAYPOINTS = [
  { name: "Loading Point A", position: [2.1023, 117.3942] },
  { name: "Dumping Point B", position: [2.0993, 117.4152] },
];

export const ROBOT_GEO_POSITIONS = {
  "HD-001": [2.1073, 117.4032],
  "HD-002": [2.1043, 117.3992],
  "HD-003": [2.0973, 117.4112],
};
