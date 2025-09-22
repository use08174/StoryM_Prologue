const scene = {
  boot: "boot",
  main: "main",
} as const;

const tilemap = {
  town: "town",
  subway: "subway",
} as const;

const tileset = {
  subway: {
    name: "subway",
    image: "subway",
    extruded: false,
  },
  Terrains_and_Fences: {
    name: "Terrains_and_Fences",
    image: "Terrains_and_Fences",
    extruded: false,
  },
  City_Terrains: {
    name: "City_Terrains",
    image: "City_Terrains",
    extruded: false,
  },
  City_Props: {
    name: "City_Props",
    image: "City_Props",
    extruded: false,
  },
  Generic_Buildings: {
    name: "Generic_Buildings",
    image: "Generic_Buildings",
    extruded: false,
  },
  Floor_Modular_Buildings: {
    name: "Floor_Modular_Buildings",
    image: "Floor_Modular_Buildings",
    extruded: false,
  },
  Garage_Sales: {
    name: "Garage_Sales",
    image: "Garage_Sales",
    extruded: false,
  },
  Villas: {
    name: "Villas",
    image: "Villas",
    extruded: false,
  },
  Worksite: {
    name: "Worksite",
    image: "Worksite",
    extruded: false,
  },
  Shopping_Center_and_Markets: {
    name: "Shopping_Center_and_Markets",
    image: "Shopping_Center_and_Markets",
    extruded: false,
  },
  Vehicles: {
    name: "Vehicles",
    image: "Vehicles",
    extruded: false,
  },
  Camping: {
    name: "Camping",
    image: "Camping",
    extruded: false,
  },
  Hotel_and_Hospital: {
    name: "Hotel_and_Hospital",
    image: "Hotel_and_Hospital",
    extruded: false,
  },
  School: {
    name: "School",
    image: "School",
    extruded: false,
  },
  Swimming_Pool: {
    name: "Swimming_Pool",
    image: "Swimming_Pool",
    extruded: false,
  },
  Police_Station: {
    name: "Police_Station",
    image: "Police_Station",
    extruded: false,
  },
  Office: {
    name: "Office",
    image: "Office",
    extruded: false,
  },
  Garden: {
    name: "Garden",
    image: "Garden",
    extruded: false,
  },
  Fire_Station: {
    name: "Fire_Station",
    image: "Fire_Station",
    extruded: false,
  },
  Graveyard: {
    name: "Graveyard",
    image: "Graveyard",
    extruded: false,
  },
  Subway_and_Train_Station: {
    name: "Subway_and_Train_Station",
    image: "Subway_and_Train_Station",
    extruded: false,
  },
  Beach: {
    name: "Beach",
    image: "Beach",
    extruded: false,
  },
  Post_Office: {
    name: "Post_Office",
    image: "Post_Office",
    extruded: false,
  },
  Military_Base: {
    name: "Military_Base",
    image: "Military_Base",
    extruded: false,
  },

} as const;


export const key = {
  scene,
  tileset,
  tilemap,
} as const;
