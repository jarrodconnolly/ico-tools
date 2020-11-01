'use strict';

const sharp = require('sharp');

let debug = false;
function debugLog(message) {
  if (debug === true) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}

async function loadInputImage(inputImageData) {
  const inputImage = sharp(inputImageData);
  const inputImageMeta = await inputImage.metadata();

  const {
    width,
    height,
    format,
  } = inputImageMeta;

  if (format !== 'png') {
    throw new Error('Base image must be PNG format');
  }

  const depth = (inputImageMeta.depth === 'uchar') ? 8 : 0;
  if (depth === 0) {
    throw new Error(`Unsupported input image depth: ${inputImageMeta.depth}`);
  }
  inputImageMeta.bpp = inputImageMeta.channels * depth;

  debugLog(`Input Image - Width: ${width} Height: ${height} Format: ${format}`);
  return { inputImage, inputImageMeta };
}

async function resizeImages(inputImage, sizes) {
  const promises = [];

  sizes.forEach((size) => {
    promises.push(
      inputImage
        .clone()
        .resize({ height: size, width: size })
        .raw()
        .toBuffer()
        .then((data) => ({
          data,
          height: size,
          width: size,
        })),
    );
  });

  return Promise.all(promises);
}

function rowBytes(width) {
  // eslint-disable-next-line no-bitwise
  return ((((width) + 31) >> 5) << 2);
}

async function buildIcoData(images, inputImageMeta) {
  const ICO_HEADER_SIZE = 6;
  const ICO_DIRECTORY_SIZE = 16;
  const ICO_BITMAP_SIZE = 40;

  const buffers = [];
  const numberOfImages = images.length;
  let dataOffset = 0;

  // write ico file header (ICONDIR - https://en.wikipedia.org/wiki/ICO_(file_format))
  const header = Buffer.alloc(ICO_HEADER_SIZE);
  header.writeUInt16LE(0, 0); // Reserved. Must always be 0.
  header.writeUInt16LE(1, 2); // Specifies image type: 1 for icon (.ICO) image
  header.writeUInt16LE(numberOfImages, 4); // Specifies number of images in the file.
  buffers.push(header);

  // update offset to first image data
  dataOffset += header.length;
  dataOffset += (images.length * ICO_DIRECTORY_SIZE);

  // write ico directory header for each file (ICONDIRENTRY - https://en.wikipedia.org/wiki/ICO_(file_format))
  const { bpp } = inputImageMeta;
  const directoryEntries = [];
  const imageData = [];
  images.forEach((image) => {
    const imageSize = image.data.length;
    const maskSize = image.height * rowBytes(image.width);
    const dibSize = imageSize + ICO_BITMAP_SIZE + maskSize;
    const directoryEntry = Buffer.alloc(ICO_DIRECTORY_SIZE);
    directoryEntry.writeUInt8(image.width, 0); // image width in pixels
    directoryEntry.writeUInt8(image.height, 1); // image height in pixels
    directoryEntry.writeUInt8(0, 2); //  number of colors in the color palette (0 no palette)
    directoryEntry.writeUInt8(0, 3); // Reserved. Should be 0
    directoryEntry.writeUInt16LE(1, 4); // Specifies color planes
    directoryEntry.writeUInt16LE(bpp, 6); // Specifies bits per pixel
    directoryEntry.writeUInt32LE(dibSize, 8); // Specifies the size of the image's data in bytes
    directoryEntry.writeUInt32LE(dataOffset, 12); // Offset of data from the beginning of the file
    directoryEntries.push(directoryEntry);

    // update offset to next image data
    dataOffset += dibSize;

    const size = image.data.length;
    // write image header (Windows BITMAPINFOHEADER)
    // https://en.wikipedia.org/wiki/BMP_file_format)
    // https://docs.microsoft.com/en-us/windows/win32/wmdm/-bitmapinfoheader
    const imageHeader = Buffer.alloc(ICO_BITMAP_SIZE);
    imageHeader.writeUInt32LE(ICO_BITMAP_SIZE, 0); // size of this header, in bytes (40)
    imageHeader.writeInt32LE(image.width, 4); // bitmap width in pixels (signed integer)
    imageHeader.writeInt32LE(image.height * 2, 8); // biHeight - bitmap height in pixels (signed integer)
    imageHeader.writeUInt16LE(1, 12); // biPlanes - number of color planes (must be 1)
    imageHeader.writeUInt16LE(bpp, 14); // biBitCount - bits per pixel
    imageHeader.writeUInt32LE(0, 16); // compression method being used (0 BI_RGB none)
    imageHeader.writeUInt32LE(size, 20); // size of the raw bitmap data (This may be set to zero for BI_RGB)
    imageHeader.writeInt32LE(0, 24); // biXPelsPerMeter
    imageHeader.writeInt32LE(0, 28); // biYPelsPerMeter
    imageHeader.writeUInt32LE(0, 32); // biClrUsed - number of colors in the color palette
    imageHeader.writeUInt32LE(0, 36); // biClrImportant - number of important colors used, or 0 when every color is important
    imageData.push(imageHeader);

    // write pixel data in BGRA format
    const bmpFormatImage = Buffer.alloc(image.data.length);
    const bytesPerRow = (image.width * (bpp / 8));
    for (let y = image.height - 1; y >= 0; y -= 1) {
      const yOffset = y * bytesPerRow;
      const yDown = (image.height - 1 - y) * bytesPerRow;
      for (let x = 0; x < bytesPerRow; x += 4) {
        bmpFormatImage[x + yDown] = image.data[x + yOffset + 2];
        bmpFormatImage[x + yDown + 1] = image.data[x + yOffset + 1];
        bmpFormatImage[x + yDown + 2] = image.data[x + yOffset];
        bmpFormatImage[x + yDown + 3] = image.data[x + yOffset + 3];
      }
    }
    imageData.push(bmpFormatImage);

    // TODO: not calculating mask correctly yet
    const mask = Buffer.alloc(maskSize, 0);
    imageData.push(mask);
  });

  const entries = Buffer.concat(directoryEntries);
  const data = Buffer.concat(imageData);
  buffers.push(entries, data);

  return Buffer.concat(buffers);
}

async function build(inputImageData, opts) {
  const defaultOptions = {
    sizes: [16, 32, 48],
    debug: false,
  };
  const options = { ...defaultOptions, ...opts };
  debug = options.debug;

  const { inputImage, inputImageMeta } = await loadInputImage(inputImageData);

  const resizedImages = await resizeImages(inputImage, options.sizes);

  return buildIcoData(resizedImages, inputImageMeta);
}

module.exports = build;
