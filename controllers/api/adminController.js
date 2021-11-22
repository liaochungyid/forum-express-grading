const db = require('../../models')
const Restaurant = db.Restaurant
const Category = db.Category

const adminService = require('../../services/adminService')

const adminController = {
  getRestaurants: (req, res) => {
    return adminService.getRestaurants(req, res, (data) => {
      res.json(data)
    })
  }
}

module.exports = adminController