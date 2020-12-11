const addOwnerWithThreshold = require('./add-owner-with-threshold')
const removeOwner = require('./remove-owner')

module.exports = (toolchain) => ({
  addOwnerWithThreshold: addOwnerWithThreshold(toolchain),
  removeOwner: removeOwner(toolchain),
})
