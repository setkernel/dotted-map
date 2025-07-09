import proj4 from 'proj4';
import inside from '@turf/boolean-point-in-polygon';

// SVG sanitization functions to prevent XSS
const sanitizeColor = (color) => {
  if (typeof color !== 'string') return '#000000';
  // Allow hex colors (#000, #000000), named colors, rgb(), rgba(), hsl(), hsla()
  const validColorRegex =
    /^(#[0-9A-Fa-f]{3,6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|transparent|currentColor|inherit|[a-zA-Z]+)$/;
  return validColorRegex.test(color.trim()) ? color.trim() : '#000000';
};

const sanitizeRadius = (radius) => {
  const num = parseFloat(radius);
  return isNaN(num) || num < 0 || num > 1000 ? 0.5 : num;
};

const sanitizeNumericValue = (value, fallback = 0) => {
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

function DottedMapWithoutCountries({ map, avoidOuterPins = false }) {
  const {
    points,
    X_MIN,
    Y_MAX,
    X_RANGE,
    Y_RANGE,
    region,
    grid,
    width,
    height,
    ystep,
    poly, // polygon data for avoidOuterPins feature
  } = map;

  const mapInstance = {
    addPin({ lat, lng, data, svgOptions }) {
      const pin = mapInstance.getPin({ lat, lng });
      const point = { ...pin, data, svgOptions };

      points[[point.x, point.y].join(';')] = point;

      return point;
    },
    getPin({ lat, lng }) {
      const [googleX, googleY] = proj4(proj4.defs('GOOGLE'), [lng, lat]);
      if (avoidOuterPins && poly) {
        const wgs84Point = proj4(proj4.defs('GOOGLE'), proj4.defs('WGS84'), [
          googleX,
          googleY,
        ]);
        if (!inside(wgs84Point, poly)) return;
      }
      let [rawX, rawY] = [
        (width * (googleX - X_MIN)) / X_RANGE,
        (height * (Y_MAX - googleY)) / Y_RANGE,
      ];
      const y = Math.round(rawY / ystep);
      if (y % 2 === 0 && grid === 'diagonal') {
        rawX -= 0.5;
      }
      const x = Math.round(rawX);
      let [localx, localy] = [x, Math.round(y) * ystep];
      if (y % 2 === 0 && grid === 'diagonal') {
        localx += 0.5;
      }

      const [localLng, localLat] = proj4(
        proj4.defs('GOOGLE'),
        proj4.defs('WGS84'),
        [
          (localx * X_RANGE) / width + X_MIN,
          Y_MAX - (localy * Y_RANGE) / height,
        ],
      );

      const pin = { x: localx, y: localy, lat: localLat, lng: localLng };

      return pin;
    },
    getPoints() {
      return Object.values(points);
    },
    getSVG({
      shape = 'circle',
      color = 'current',
      backgroundColor = 'transparent',
      radius = 0.5,
    }) {
      // Sanitize main parameters
      const sanitizedShape = ['circle', 'hexagon'].includes(shape)
        ? shape
        : 'circle';
      const sanitizedColor = sanitizeColor(color);
      const sanitizedBackgroundColor = sanitizeColor(backgroundColor);
      const sanitizedRadius = sanitizeRadius(radius);

      const getPoint = ({ x, y, svgOptions = {} }) => {
        // Sanitize coordinates and options
        const sanitizedX = sanitizeNumericValue(x, 0);
        const sanitizedY = sanitizeNumericValue(y, 0);
        const pointRadius = sanitizeRadius(
          svgOptions.radius || sanitizedRadius,
        );
        const pointColor = sanitizeColor(svgOptions.color || sanitizedColor);

        if (sanitizedShape === 'circle') {
          return `<circle cx="${sanitizedX}" cy="${sanitizedY}" r="${pointRadius}" fill="${pointColor}" />`;
        } else if (sanitizedShape === 'hexagon') {
          const sqrt3radius = Math.sqrt(3) * pointRadius;

          const polyPoints = [
            [sanitizedX + sqrt3radius, sanitizedY - pointRadius],
            [sanitizedX + sqrt3radius, sanitizedY + pointRadius],
            [sanitizedX, sanitizedY + 2 * pointRadius],
            [sanitizedX - sqrt3radius, sanitizedY + pointRadius],
            [sanitizedX - sqrt3radius, sanitizedY - pointRadius],
            [sanitizedX, sanitizedY - 2 * pointRadius],
          ];

          return `<polygon points="${polyPoints
            .map((point) => point.join(','))
            .join(' ')}" fill="${pointColor}" />`;
        }
      };

      return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: ${sanitizedBackgroundColor}">
        ${Object.values(points).map(getPoint).join('\n')}
      </svg>`;
    },
    image: {
      region,
      width,
      height,
    },
  };

  return mapInstance;
}

export default DottedMapWithoutCountries;
