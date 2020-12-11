const addOwnerWithThreshold = require('./add-owner-with-threshold')

module.exports = (toolchain) => ({
  addOwnerWithThreshold: addOwnerWithThreshold(toolchain),
})
