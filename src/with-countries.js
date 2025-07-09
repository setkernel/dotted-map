import proj4 from 'proj4';
import inside from '@turf/boolean-point-in-polygon';
import DottedMapWithoutCountries from './without-countries';

// Import JSON data - webpack will handle this correctly
import geojsonWorld from './countries.geo.json';

const geojsonByCountry = geojsonWorld.features.reduce((countries, feature) => {
  countries[feature.id] = feature;
  return countries;
}, {});

const geojsonToMultiPolygons = (geojson) => {
  const coordinates = geojson.features.reduce(
    (poly, feature) =>
      poly.concat(
        feature.geometry.type === 'Polygon'
          ? [feature.geometry.coordinates]
          : feature.geometry.coordinates,
      ),
    [],
  );
  return { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates } };
};

const CACHE = {};

const DEFAULT_WORLD_REGION = {
  lat: { min: -56, max: 71 },
  lng: { min: -179, max: 179 },
};

const computeGeojsonBox = (geojson) => {
  const { type, features, geometry, coordinates } = geojson;
  if (type === 'FeatureCollection') {
    const boxes = features.map(computeGeojsonBox);
    return {
      lat: {
        min: Math.min(...boxes.map((box) => box.lat.min)),
        max: Math.max(...boxes.map((box) => box.lat.max)),
      },
      lng: {
        min: Math.min(...boxes.map((box) => box.lng.min)),
        max: Math.max(...boxes.map((box) => box.lng.max)),
      },
    };
  } else if (type == 'Feature') {
    return computeGeojsonBox(geometry);
  } else if (type === 'MultiPolygon') {
    return computeGeojsonBox({
      type: 'Polygon',
      coordinates: coordinates.flat(),
    });
  } else if (type == 'Polygon') {
    const coords = coordinates.flat();
    const latitudes = coords.map(([_lng, lat]) => lat);
    const longitudes = coords.map(([lng, _lat]) => lng);

    return {
      lat: {
        min: Math.min(...latitudes),
        max: Math.max(...latitudes),
      },
      lng: {
        min: Math.min(...longitudes),
        max: Math.max(...longitudes),
      },
    };
  } else {
    throw new Error(`Unknown geojson type ${type}`);
  }
};

const validateMapSettings = ({ height, width, countries, region, grid }) => {
  if (height <= 0 && width <= 0) {
    throw new Error('Either height or width must be positive');
  }

  if (
    height !== undefined &&
    (typeof height !== 'number' || height < 0 || height > 10000)
  ) {
    throw new Error('Height must be a number between 0 and 10000');
  }

  if (
    width !== undefined &&
    (typeof width !== 'number' || width < 0 || width > 10000)
  ) {
    throw new Error('Width must be a number between 0 and 10000');
  }

  if (countries && !Array.isArray(countries)) {
    throw new Error('Countries must be an array');
  }

  if (countries && countries.length > 0) {
    const validCountries = new Set(Object.keys(geojsonByCountry));
    const invalidCountries = countries.filter((c) => !validCountries.has(c));
    if (invalidCountries.length > 0) {
      throw new Error(`Invalid country codes: ${invalidCountries.join(', ')}`);
    }
  }

  if (grid && !['vertical', 'diagonal'].includes(grid)) {
    throw new Error('Grid must be "vertical" or "diagonal"');
  }

  if (region) {
    if (typeof region !== 'object' || !region.lat || !region.lng) {
      throw new Error('Region must have lat and lng properties');
    }

    if (
      typeof region.lat.min !== 'number' ||
      typeof region.lat.max !== 'number' ||
      typeof region.lng.min !== 'number' ||
      typeof region.lng.max !== 'number'
    ) {
      throw new Error('Region coordinates must be numbers');
    }

    if (region.lat.min >= region.lat.max || region.lng.min >= region.lng.max) {
      throw new Error('Region min values must be less than max values');
    }
  }
};

const getMap = ({
  height = 0,
  width = 0,
  countries = [],
  region,
  grid = 'vertical',
}) => {
  validateMapSettings({ height, width, countries, region, grid });

  if (height <= 0 && width <= 0) {
    throw new Error('height or width is required');
  }

  let geojson = geojsonWorld;
  if (countries.length > 0) {
    geojson = {
      type: 'FeatureCollection',
      features: countries.map((country) => geojsonByCountry[country]),
    };
    if (!region) {
      region = computeGeojsonBox(geojson);
    }
  } else if (!region) {
    region = DEFAULT_WORLD_REGION;
  }

  const poly = geojsonToMultiPolygons(geojson);

  const [X_MIN, Y_MIN] = proj4(proj4.defs('GOOGLE'), [
    region.lng.min,
    region.lat.min,
  ]);
  const [X_MAX, Y_MAX] = proj4(proj4.defs('GOOGLE'), [
    region.lng.max,
    region.lat.max,
  ]);
  const X_RANGE = X_MAX - X_MIN;
  const Y_RANGE = Y_MAX - Y_MIN;

  if (width <= 0) {
    width = Math.round((height * X_RANGE) / Y_RANGE);
  } else if (height <= 0) {
    height = Math.round((width * Y_RANGE) / X_RANGE);
  }

  const points = {};
  const ystep = grid === 'diagonal' ? Math.sqrt(3) / 2 : 1;

  for (let y = 0; y * ystep < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const localx = y % 2 === 0 && grid === 'diagonal' ? x + 0.5 : x;
      const localy = y * ystep;

      const pointGoogle = [
        (localx / width) * X_RANGE + X_MIN,
        Y_MAX - (localy / height) * Y_RANGE,
      ];
      const wgs84Point = proj4(
        proj4.defs('GOOGLE'),
        proj4.defs('WGS84'),
        pointGoogle,
      );

      if (inside(wgs84Point, poly)) {
        points[[x, y].join(';')] = { x: localx, y: localy };
      }
    }
  }

  return {
    points,
    X_MIN,
    Y_MIN,
    X_MAX,
    Y_MAX,
    X_RANGE,
    Y_RANGE,
    region,
    grid,
    height,
    width,
    ystep,
    poly, // include polygon data for avoidOuterPins feature
  };
};

export const getMapJSON = (props) => JSON.stringify(getMap(props));

const getCacheKey = ({
  height = 0,
  width = 0,
  countries = [],
  region,
  grid = 'vertical',
}) => {
  return [
    JSON.stringify(region),
    grid,
    height,
    width,
    JSON.stringify(countries),
  ].join(' ');
};

function DottedMap({ avoidOuterPins = false, ...args }) {
  const cacheKey = getCacheKey(args);

  if (!CACHE[cacheKey]) {
    CACHE[cacheKey] = getMap(args);
  }

  return new DottedMapWithoutCountries({
    avoidOuterPins,
    map: CACHE[cacheKey],
  });
}

export default DottedMap;
