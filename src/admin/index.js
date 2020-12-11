const addOwnerWithThreshold = require('./add-owner-with-threshold')
const removeOwner = require('./remove-owner')
const swapOwner = require('./swap-owner')

module.exports = (toolchain) => ({
  addOwnerWithThreshold: addOwnerWithThreshold(toolchain),
  removeOwner: removeOwner(toolchain),
  swapOwner: swapOwner(toolchain),
})
