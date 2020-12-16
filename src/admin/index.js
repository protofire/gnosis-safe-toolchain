const addOwnerWithThreshold = require('./add-owner-with-threshold')
const removeOwner = require('./remove-owner')
const swapOwner = require('./swap-owner')
const changeThreshold = require('./change-threshold')
const getThreshold = require('./get-threshold')
const getOwners = require('./get-owners')
const isOwner = require('./is-owner')

module.exports = (toolchain) => ({
  addOwnerWithThreshold: addOwnerWithThreshold(toolchain),
  removeOwner: removeOwner(toolchain),
  swapOwner: swapOwner(toolchain),
  changeThreshold: changeThreshold(toolchain),
  getThreshold: getThreshold(toolchain),
  getOwners: getOwners(toolchain),
  isOwner: isOwner(toolchain),
})
