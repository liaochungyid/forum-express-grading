const helpers = require('../_helpers')

const db = require('../models')
const Restaurant = db.Restaurant
const Category = db.Category
const Comment = db.Comment
const User = db.User
const pageLimit = 10

const restController = {
  getRestaurants: (req, res) => {
    let offset = 0
    const whereQuery = {}
    let categoryId = ''
    if (req.query.page) {
      offset = (req.query.page - 1) * pageLimit
    }
    if (req.query.categoryId) {
      categoryId = Number(req.query.categoryId)
      whereQuery.CategoryId = categoryId
    }

    Restaurant.findAndCountAll({
      include: Category,
      where: whereQuery,
      offset: offset,
      limit: pageLimit
    }).then(result => {
      const page = Number(req.query.page) || 1
      const pages = Math.ceil(result.count / pageLimit)
      const totalPage = Array.from({ length: pages }).map((item, index) => index + 1)
      const prev = page - 1 < 1 ? 1 : page - 1
      const next = page + 1 > pages ? pages : page + 1

      const data = result.rows.map(r => ({
        ...r.dataValues,
        description: r.dataValues.description.substring(0, 50),
        categoryName: r.Category.name,
        isFavorited: helpers.getUser(req).FavoritedRestaurants.map(d => d.id).includes(r.id),
        isLiked: helpers.getUser(req).LikedRestaurants.map(d => d.id).includes(r.id)
      }))

      Category.findAll({
        raw: true,
        nest: true
      }).then(categories => {
        return res.render('restaurants', {
          restaurants: data,
          categories,
          categoryId,
          page,
          totalPage,
          prev,
          next
        })
      })
    })
  },
  getRestaurant: (req, res) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: [User] },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    }).then((restaurant) => {
      if (req.session.views) {
        if (!req.session.views.includes(req.params.id)) {
          req.session.views.push(req.params.id)
          restaurant.update({ viewCounts: restaurant.viewCounts + 1 })
        }
      } else {
        req.session.views = [req.params.id]
        restaurant.update({ viewCounts: restaurant.viewCounts + 1 })
      }

      return res.render('restaurant', {
        restaurant: restaurant.toJSON(),
        isFavorited: restaurant.FavoritedUsers.map(d => d.id).includes(helpers.getUser(req).id),
        isLiked: restaurant.LikedUsers.map(d => d.id).includes(helpers.getUser(req).id)
      })
    })
  },
  getFeeds: (req, res) => {
    return Promise.all([
      Restaurant.findAll({
        raw: true,
        nest: true,
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category]
      }), Comment.findAll({
        raw: true,
        nest: true,
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant]
      })
    ]).then(([restaurants, comments]) => {
      return res.render('feeds', {
        restaurants,
        comments
      })
    })
  },
  getDashBoard: (req, res) => {
    return Promise.all([
      Comment.count({ where: { RestaurantId: req.params.id } }),
      Restaurant.findByPk(req.params.id, {
        raw: true,
        nest: true,
        include: [Category]
      })
    ]).then(([CommentsCount, restaurant]) => {
      return res.render('dashboard', {
        CommentsCount,
        restaurant
      })
    })
  }
}

module.exports = restController