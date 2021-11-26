const helpers = require('../_helpers')

const fs = require('fs')
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

const userService = {
  getUser: (req, res, cb) => {
    return Promise.all([
      User.findByPk(req.params.id, {
        include: [
          { model: User, as: 'Followers' },
          { model: User, as: 'Followings' },
          { model: Restaurant, as: 'FavoritedRestaurants' }
        ]
      }),
      Comment.findAll({
        where: { UserId: req.params.id },
        include: [Restaurant],
        raw: true,
        nest: true
      })
    ]).then(([user, comments]) => {
      if (!user) {
        return cb({ status: 'error', message: '無此用戶！' })
      }

      return cb({
        user: user.toJSON(),
        comments,
        commentsCount: comments.length ? comments.length : 0,
        followingsCount: user.Followings.length ? user.Followings.length : 0,
        followersCount: user.Followers.length ? user.Followers.length : 0,
        FavRestCount: user.FavoritedRestaurants.length ? user.FavoritedRestaurants.length : 0
      })
    })
  },
  editUser: (req, res, cb) => {
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      return cb({ status: 'error', message: '不可編輯他人資料' })
    }

    return User.findByPk(req.params.id, { raw: true, nest: true })
      .then((user) => {
        cb({ user })
      })
  },
  putUser: (req, res, cb) => {
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      return cb({ status: 'error', message: '不可編輯他人資料' })
    }
    if (!req.body.name) {
      return cb({ status: 'error', message: "name didn't exist" })
    }

    const { file } = req
    if (file) {
      imgur.setClientID(IMGUR_CLIENT_ID);
      imgur.upload(file.path, (err, img) => {
        return User.findByPk(req.params.id)
          .then((user) => {
            user.update({
              name: req.body.name,
              email: req.body.email,
              image: file ? img.data.link : user.image
            })
              .then((user) => {
                cb({ status: 'error', message: '使用者資料編輯成功' })
              })
          })
      })
    } else {
      return User.findByPk(req.params.id)
        .then((user) => {
          user.update({
            name: req.body.name,
            email: req.body.email,
            image: user.image
          }).then((user) => {
            cb({ status: 'success', message: '使用者資料編輯成功' })
          })
        })
    }
  },
  signUp: (req, res, cb) => {
    // confirm password
    if (req.body.passwordCheck !== req.body.password) {
      cb({ status: 'error', message: '兩次密碼輸入不同！' })
    } else {
      // confirm unique user
      User.findOne({ where: { email: req.body.email } }).then(user => {
        if (user) {
          cb({ status: 'error', message: '信箱重複！' })
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          }).then(user => {
            cb({ status: 'success', message: '成功註冊帳號！' })
          })
        }
      })
    }
  },
  addFavorite: (req, res, cb) => {
    return Favorite.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        cb({ status: 'success', message: '' })
      })
  },
  removeFavorite: (req, res, cb) => {
    return Favorite.destroy({
      where: {
        userId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    }).then((favorite) => {
      cb({ status: 'success', message: '' })
    })
  },
  addLike: (req, res, cb) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        cb({ status: 'success', message: '' })
      })
  },
  removeLike: (req, res, cb) => {
    return Like.destroy({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    }).then((deletedLike) => {
      cb({ status: 'success', message: '' })
    })
  },
  getTopUser: (req, res, cb) => {
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    }).then((users) => {
      users = users.map((user) => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: helpers.getUser(req).Followings.map(d => d.id).includes(user.id)
      }))

      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)

      cb({ users })
    })
  },
  addFollowing: (req, res, cb) => {
    return Followship.create({
      followerId: helpers.getUser(req).id,
      followingId: req.params.userId
    })
      .then((followship) => {
        cb({ status: 'success', message: '' })
      })
  },
  removeFollowing: (req, res, cb) => {
    return Followship.destroy({
      where: {
        followerId: helpers.getUser(req).id,
        followingId: req.params.userId
      }
    }).then((followship) => {
      cb({ status: 'success', message: '' })
    })
  }
}

module.exports = userService