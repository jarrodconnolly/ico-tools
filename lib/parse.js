'use strict';

const { rowBytes } = require('./utils');

const ICONDIR_IMAGE_TYPE = {
  1: 'ICO',
  2: 'CUR',
};

const BITMAP_COMPRESSION_TYPE = {
  0: 'BI_RGB',
  1: 'BI_RLE8',
  2: 'BI_RLE4',
  3: 'BI_BITFIELDS',
  4: 'BI_JPEG',
  5: 'BI_PNG',
  6: 'BI_ALPHABITFIELDS',
  11: 'BI_CMYK',
  12: 'BI_CMYKRLE8',
  13: 'BI_CMYKRLE4',
};

function parse(inputImageData) {
  let offset = 0;
  const data = {};

  // ICONDIR
  data.header = {};

  data.header.reserved = inputImageData.readUInt16LE(offset);
  if (data.header.reserved !== 0) {
    throw new Error(`Invalid. Field [reserved] at offset:${offset} must be 0`);
  }
  offset += 2;

  data.header.imageType = inputImageData.readUInt16LE(offset);
  if (data.header.imageType !== 1 && data.header.imageType !== 2) {
    throw new Error(`Invalid. Field [imageType] at offset:${offset} must be 1 or 2`);
  }
  data.header.imageTypeName = ICONDIR_IMAGE_TYPE[data.header.imageType];
  offset += 2;

  const imageCount = inputImageData.readUInt16LE(offset);
  data.header.imageCount = imageCount;
  offset += 2;

  data.directory = [];
  for (let i = 0; i < imageCount; i += 1) {
    // ICONDIRENTRY
    data.directory[i] = {};

    let imageWidth = inputImageData.readUInt8(offset);
    imageWidth = imageWidth === 0 ? 256 : imageWidth;
    data.directory[i].width = imageWidth;
    offset += 1;

    let imageHeight = inputImageData.readUInt8(offset);
    imageHeight = imageHeight === 0 ? 256 : imageHeight;
    data.directory[i].height = imageHeight;
    offset += 1;

    data.directory[i].paletteColourCount = inputImageData.readUInt8(offset);
    offset += 1;

    data.directory[i].reserved = inputImageData.readUInt8(offset);
    if (data.directory[i].reserved !== 0) {
      throw new Error(`Invalid. Field [reserved] at offset:${offset} must be 0`);
    }
    offset += 1;

    if (data.header.imageType === 1) {
      data.directory[i].colourPlanes = inputImageData.readUInt16LE(offset);
      offset += 2;

      data.directory[i].bpp = inputImageData.readUInt16LE(offset);
      offset += 2;
    } else if (data.header.imageType === 2) {
      data.directory[i].hotSpotHorizontal = inputImageData.readUInt16LE(offset);
      offset += 2;

      data.directory[i].hotSpotVertical = inputImageData.readUInt16LE(offset);
      offset += 2;
    }

    data.directory[i].imageSize = inputImageData.readUInt32LE(offset);
    offset += 4;

    data.directory[i].dataOffset = inputImageData.readUInt32LE(offset);
    offset += 4;
  }

  data.images = [];
  for (let i = 0; i < imageCount; i += 1) {
    data.images[i] = {};

    data.images[i].bitmapHeaderSize = inputImageData.readUInt32LE(offset);
    offset += 4;

    data.images[i].width = inputImageData.readInt32LE(offset);
    offset += 4;

    /*
      A bottom-up DIB, in which the origin lies at the lower-left corner.
      A top-down DIB, in which the origin lies at the upper-left corner.
      If the height of a DIB, as indicated by the Height member of the bitmap information header structure,
      is a positive value, it is a bottom-up DIB; if the height is a negative value, it is a top-down DIB.
      Top-down DIBs cannot be compressed.
     */
    data.images[i].height = inputImageData.readInt32LE(offset);
    offset += 4;

    data.images[i].colourPlanes = inputImageData.readUInt16LE(offset);
    offset += 2;

    data.images[i].bpp = inputImageData.readUInt16LE(offset);
    offset += 2;

    data.images[i].compressionMethod = inputImageData.readUInt32LE(offset);
    data.images[i].compressionMethodName = BITMAP_COMPRESSION_TYPE[data.images[i].compressionMethod];
    offset += 4;

    // the image size. This is the size of the raw bitmap data; a dummy 0 can be given for BI_RGB bitmaps.
    data.images[i].imageSize = inputImageData.readUInt32LE(offset);
    offset += 4;

    data.images[i].pelsPerMeterX = inputImageData.readInt32LE(offset);
    offset += 4;

    data.images[i].pelsPerMeterY = inputImageData.readInt32LE(offset);
    offset += 4;

    data.images[i].coloursUsed = inputImageData.readInt32LE(offset);
    offset += 4;

    data.images[i].coloursImportant = inputImageData.readInt32LE(offset);
    offset += 4;

    const maskSize = data.directory[i].height * rowBytes(data.directory[i].width);
    offset += data.images[i].imageSize + maskSize;
  }

  return data;
}

module.exports = parse;
