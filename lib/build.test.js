'use strict';

const sharp = require('sharp');
const build = require('./build');
const parse = require('./parse');

let baseImage;

describe('build ico', () => {
  beforeAll(async () => {
    baseImage = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: {
          r: 255,
          g: 0,
          b: 0,
          alpha: 0.5,
        },
      },
    }).png().toBuffer();
  });
  it('should build from a png', async () => {
    const ico = await build(baseImage, { sizes: [16] });
    const data = await parse(ico);
    expect(data).toBeDefined();

    expect(data.header).toBeDefined();
    expect(data.header.imageType).toBe(1);
    expect(data.header.imageCount).toBe(1);

    expect(data.directory).toBeDefined();
    expect(data.directory).toBeInstanceOf(Array);
    expect(data.directory).toHaveLength(1);
    expect(data.directory[0].width).toBe(16);
    expect(data.directory[0].height).toBe(16);

    expect(data.images).toBeDefined();
    expect(data.images).toBeInstanceOf(Array);
    expect(data.images).toHaveLength(1);
  });
});
