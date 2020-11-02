'use strict';

function rowBytes(width) {
  // eslint-disable-next-line no-bitwise
  return ((((width) + 31) >> 5) << 2);
}

module.exports.rowBytes = rowBytes;
