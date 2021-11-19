const helpers = require('../_helpers')

const fs = require('fs')
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const bcrypt = require('bcryptjs')
const db = require('../models')
const { getRestaurant } = require('./restController')
const user = require('../models/user')
const User = db.User
const Comment = db.Comment
const Restaurant = db.Restaurant
const Favorite = db.Favorite
const Like = db.Like
const Followship = db.Followship

const userController = {
  getUser: (req, res) => {
    return Promise.all([
      User.findByPk(req.params.id, {
        raw: true,
        nest: true
      }),
      Comment.findAll({
        where: { UserId: req.params.id },
        include: [Restaurant],
        raw: true,
        nest: true
      })
    ]).then(([user, comments]) => {
      if (!user) {
        req.flash('無此用戶！')
        return req.redirect('back')
      }

      return res.render('profile', {
        user,
        comments,
        count: comments.length ? comments.length : 0
      })
    })
  },
  editUser: (req, res) => {
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      req.flash('warning_mssage', '不可編輯他人資料')
      return res.redirect(`/users/${helpers.getUser(req).id}`)
    }

    return User.findByPk(req.params.id, { raw: true, nest: true })
      .then((user) => {
        res.render('edit', { user })
      })
  },
  putUser: (req, res) => {
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      req.flash('warning_mssage', '不可編輯他人資料')
      return res.redirect(`/users/${helpers.getUser(req).id}`)
    }
    if (!req.body.name) {
      console.log(req.body)
      req.flash('error_messages', "name didn't exist")
      return res.redirect('back')
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
                req.flash('success_messages', '使用者資料編輯成功')
                res.redirect(`/users/${helpers.getUser(req).id}`)
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
            req.flash('success_messages', '使用者資料編輯成功')
            res.redirect(`/users/${req.params.id}`)
          })
        })
    }
  },
  signUpPage: (req, res) => {
    return res.render('signup')
  },
  signUp: (req, res) => {
    // confirm password
    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', '兩次密碼輸入不同！')
      return res.redirect('/signup')
    } else {
      // confirm unique user
      User.findOne({ where: { email: req.body.email } }).then(user => {
        if (user) {
          req.flash('error_messages', '信箱重複！')
          return res.redirect('/signup')
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          }).then(user => {
            req.flash('success_messages', '成功註冊帳號！')
            return res.redirect('/signin')
          })
        }
      })
    }
  },
  signInPage: (req, res) => {
    return res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },
  removeFavorite: (req, res) => {
    return Favorite.destroy({
      where: {
        userId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    }).then((favorite) => {
      return res.redirect('back')
    })
  },
  addLike: (req, res) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },
  removeLike: (req, res) => {
    return Like.destroy({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    }).then((deletedLike) => {
      return res.redirect('back')
    })
  },
  getTopUser: (req, res) => {
    return User.findAll({
      include: [{ model: User, as: 'Followers' }]
    }).then((users) => {
      users = users.map((user) => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length,
        isFollowed: helpers.getUser(req).Followings.map(d => d.id).includes(user.id)
      }))

      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)

      return res.render('topUser', { users })
    })
  },
  addFollowing: (req, res) => {
    return Followship.create({
      followerId: helpers.getUser(req).id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return res.redirect('back')
      })
  },

  removeFollowing: (req, res) => {
    return Followship.destroy({
      where: {
        followerId: helpers.getUser(req).id,
        followingId: req.params.userId
      }
    }).then((followship) => {
      return res.redirect('back')
    })

  }
}

module.exports = userController