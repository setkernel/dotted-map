const DottedMap = require('./index').default;
const { getMapJSON } = require('./index');

console.log('🧪 Enhanced Test Suite for dotted-map\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${description}: ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// === Basic Functionality Tests ===
console.log('📋 Basic Functionality Tests');

test('Creates map with valid parameters', () => {
  const map = new DottedMap({ height: 10, grid: 'diagonal' });
  assert(map !== null, 'Map should be created');
});

test('Creates map with width instead of height', () => {
  const map = new DottedMap({ width: 10, grid: 'vertical' });
  assert(map !== null, 'Map should be created with width');
});

test('Adds pin successfully', () => {
  const map = new DottedMap({ height: 10 });
  const pin = map.addPin({ lat: 0, lng: 0 });
  assert(pin.x !== undefined, 'Pin should have x coordinate');
  assert(pin.y !== undefined, 'Pin should have y coordinate');
});

test('Gets pin coordinates', () => {
  const map = new DottedMap({ height: 10 });
  const pin = map.getPin({ lat: 0, lng: 0 });
  assert(typeof pin.x === 'number', 'Pin x should be a number');
  assert(typeof pin.y === 'number', 'Pin y should be a number');
});

test('Generates SVG output', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  const svg = map.getSVG({ color: '#ff0000' });
  assert(svg.includes('<svg'), 'Should generate SVG');
  assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'Should have SVG namespace');
});

// === Cache Tests ===
console.log('\n⚡ Cache Performance Tests');

test('Cache works for identical parameters', () => {
  const start1 = Date.now();
  const map1 = new DottedMap({ height: 30, grid: 'diagonal' });
  const time1 = Date.now() - start1;
  
  const start2 = Date.now();
  const map2 = new DottedMap({ height: 30, grid: 'diagonal' });
  const time2 = Date.now() - start2;
  
  assert(time2 < time1 * 0.1, `Cache should be much faster: ${time1}ms vs ${time2}ms`);
});

test('Cache creates different maps for different parameters', () => {
  const map1 = new DottedMap({ height: 10, grid: 'diagonal' });
  const map2 = new DottedMap({ height: 10, grid: 'vertical' });
  
  const points1 = map1.getPoints();
  const points2 = map2.getPoints();
  
  // Points should be different due to different grid types
  assert(points1.length !== points2.length || 
         points1[0].x !== points2[0].x || 
         points1[0].y !== points2[0].y, 
         'Different parameters should create different maps');
});

// === Input Validation Tests ===
console.log('\n🛡️ Input Validation Tests');

test('Rejects negative height', () => {
  let threw = false;
  try {
    new DottedMap({ height: -1 });
  } catch (e) {
    threw = true;
    assert(e.message.includes('positive'), 'Should mention positive requirement');
  }
  assert(threw, 'Should throw for negative height');
});

test('Rejects invalid grid type', () => {
  let threw = false;
  try {
    new DottedMap({ height: 10, grid: 'invalid' });
  } catch (e) {
    threw = true;
    assert(e.message.includes('vertical'), 'Should mention valid grid types');
  }
  assert(threw, 'Should throw for invalid grid type');
});

test('Rejects invalid countries format', () => {
  let threw = false;
  try {
    new DottedMap({ height: 10, countries: 'USA' });
  } catch (e) {
    threw = true;
    assert(e.message.includes('array'), 'Should mention array requirement');
  }
  assert(threw, 'Should throw for non-array countries');
});

test('Rejects invalid country codes', () => {
  let threw = false;
  try {
    new DottedMap({ height: 10, countries: ['INVALID'] });
  } catch (e) {
    threw = true;
    assert(e.message.includes('Invalid country codes'), 'Should mention invalid codes');
  }
  assert(threw, 'Should throw for invalid country codes');
});

test('Accepts valid country codes', () => {
  const map = new DottedMap({ height: 10, countries: ['USA', 'FRA'] });
  assert(map !== null, 'Should accept valid country codes');
});

// === SVG Sanitization Tests ===
console.log('\n🔐 SVG Security Tests');

test('Sanitizes malicious color input', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  map.addPin({ lat: 0, lng: 0, svgOptions: { color: 'javascript:alert(1)' } });
  const svg = map.getSVG({ shape: 'circle' });
  assert(!svg.includes('javascript:'), 'Should not contain javascript:');
  assert(!svg.includes('alert'), 'Should not contain alert');
});

test('Sanitizes script tags in color', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  const svg = map.getSVG({ color: '<script>alert(1)</script>' });
  assert(!svg.includes('<script'), 'Should not contain script tags');
  assert(!svg.includes('alert'), 'Should not contain alert');
});

test('Allows valid hex colors', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  const svg = map.getSVG({ color: '#ff0000' });
  assert(svg.includes('#ff0000'), 'Should preserve valid hex colors');
});

test('Allows valid RGB colors', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  const svg = map.getSVG({ color: 'rgb(255, 0, 0)' });
  assert(svg.includes('rgb(255, 0, 0)'), 'Should preserve valid RGB colors');
});

test('Sanitizes invalid radius values', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  map.addPin({ lat: 0, lng: 0, svgOptions: { radius: 'invalid' } });
  const svg = map.getSVG({ shape: 'circle' });
  assert(svg.includes('r="0.5"'), 'Should fallback to default radius for invalid input');
});

// === Shape Generation Tests ===
console.log('\n🔵 Shape Generation Tests');

test('Generates circles correctly', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  const svg = map.getSVG({ shape: 'circle' });
  assert(svg.includes('<circle'), 'Should generate circle elements');
  assert(svg.includes('cx='), 'Should have cx attribute');
  assert(svg.includes('cy='), 'Should have cy attribute');
  assert(svg.includes('r='), 'Should have r attribute');
});

test('Generates hexagons correctly', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  const svg = map.getSVG({ shape: 'hexagon' });
  assert(svg.includes('<polygon'), 'Should generate polygon elements');
  assert(svg.includes('points='), 'Should have points attribute');
});

test('Defaults to circles for invalid shape', () => {
  const map = new DottedMap({ height: 5, width: 5 });
  const svg = map.getSVG({ shape: 'invalid' });
  assert(svg.includes('<circle'), 'Should fallback to circles for invalid shape');
});

// === Performance Tests ===
console.log('\n⚡ Performance Tests');

test('Handles moderate size maps efficiently', () => {
  const start = Date.now();
  const map = new DottedMap({ height: 50, width: 50 });
  const svg = map.getSVG({ shape: 'circle' });
  const elapsed = Date.now() - start;
  
  assert(elapsed < 1000, `50x50 map should be created in <1s, took ${elapsed}ms`);
  assert(svg.length > 0, 'Should generate non-empty SVG');
});

test('SVG output size is reasonable', () => {
  const map = new DottedMap({ height: 10, width: 10 });
  const svg = map.getSVG({ shape: 'circle' });
  const sizeKB = svg.length / 1024;
  
  assert(sizeKB < 50, `SVG should be <50KB for 10x10 map, was ${sizeKB.toFixed(1)}KB`);
});

// === JSON Export Tests ===
console.log('\n📤 JSON Export Tests');

test('getMapJSON exports valid JSON', () => {
  const jsonString = getMapJSON({ height: 5, width: 5 });
  assert(typeof jsonString === 'string', 'Should return string');
  
  const parsed = JSON.parse(jsonString);
  assert(parsed.points !== undefined, 'Should contain points');
  assert(parsed.width !== undefined, 'Should contain width');
  assert(parsed.height !== undefined, 'Should contain height');
});

test('Exported JSON can be used with DottedMapWithoutCountries', () => {
  const DottedMapWithoutCountries = require('./without-countries').default;
  const jsonString = getMapJSON({ height: 5, width: 5 });
  const mapData = JSON.parse(jsonString);
  
  const map = new DottedMapWithoutCountries({ map: mapData });
  const svg = map.getSVG({ shape: 'circle' });
  
  assert(svg.includes('<svg'), 'Should generate valid SVG from exported JSON');
});

// === Results Summary ===
console.log(`\n📊 Test Results Summary`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed > 0) {
  console.log('\n🚨 Some tests failed. Please review the issues above.');
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed! The library is working correctly.');
}