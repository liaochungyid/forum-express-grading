const helpers = require('../_helpers')

const fs = require('fs')
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const db = require('../models')
const Restaurant = db.Restaurant
const User = db.User
const Category = db.Category

const adminService = require('../services/adminService')

const adminController = {
  getRestaurants: (req, res) => {
    adminService.getRestaurants(req, res, (data) => {
      return res.render('admin/restaurants', data)
    })
  },


  createRestaurant: (req, res) => {
    Category.findAll({
      raw: true,
      nest: true
    }).then((categories) => {
      return res.render('admin/create', { categories })
    })
  },
  postRestaurant: (req, res) => {
    adminService.postRestaurant(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_message', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('/admin/restaurants')
    })
  },
  getRestaurant: (req, res) => {
    adminService.getRestaurant(req, res, (data) => {
      return res.render('admin/restaurant', data)
    })
  },

  editRestaurant: (req, res) => {
    Category.findAll({
      raw: true,
      nest: true
    }).then((categories) => {
      return Restaurant
        .findByPk(req.params.id)
        .then(restaurant => {
          return res.render('admin/create', {
            categories,
            restaurant: restaurant.toJSON()
          })
        })
    })

  },
  putRestaurant: (req, res) => {
    adminService.putRestaurant(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_message', data.message)
        return res.redirect('back')
      }
      req.flash('success_messages', data.message)
      return res.redirect('/admin/restaurants')
    })
  },
  deleteRestaurant: (req, res) => {
    adminService.deleteRestaurant(req, res, (data) => {
      if (data['status'] === 'success') {
        return res.redirect('/admin/restaurants')
      }
    })
  },
  getUsers: (req, res) => {
    return User.findAll({ raw: true }).then(users => {
      return res.render('admin/users', { users: users })
    })
  },

  toggleAdmin: (req, res) => {
    // if (helpers.getUser(req).id === Number(req.params.id)) {
    //   req.flash('error_messages', '無法變更自己的權限')
    //   return res.redirect('back')
    // }

    return User.findByPk(req.params.id)
      .then((user) => {
        if (user.name === 'admin') {
          req.flash('error_messages', '禁止變更管理者權限')
          res.redirect('back')
        } else {
          user.update({
            isAdmin: !user.isAdmin
          }).then((user) => {
            req.flash('success_messages', '使用者權限變更成功')
            res.redirect('/admin/users')
          })
        }
      })
  }
}

module.exports = adminController