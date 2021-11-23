const db = require('../models')
const Category = db.Category

const categoryController = {
  getCategories: (req, res, cb) => {
    return Category.findAll({
      raw: true,
      nest: true
    }).then(categories => {
      if (req.params.id) {
        Category.findByPk(req.params.id)
          .then((category) => {
            return res.render('admin/categories', {
              categories: categories,
              category: category.toJSON()
            })
          })
      } else {
        cb({ categories: categories })
      }
    })
  },
  postCategory: (req, res, cb) => {
    if (!req.body.name) {
      return cb({ status: 'error', message: 'name didn\'t exist' })
    } else {
      return Category.create({
        name: req.body.name
      })
        .then((category) => {
          return cb({ status: 'success', message: '' })
        })
    }
  },
  putCategory: (req, res, cb) => {
    if (!req.body.name) {
      return cb({ status: 'error', message: 'name didn\'t exist' })
    } else {
      return Category.findByPk(req.params.id)
        .then((category) => {
          category.update(req.body)
            .then((category) => {
              return cb({ status: 'success', message: '' })
            })
        })
    }
  },
  deleteCategory: (req, res, cb) => {
    return Category.findByPk(req.params.id)
      .then((category) => {
        category.destroy()
          .then((category) => {
            cb({ status: 'success', message: '' })
          })
      })
  }
}
module.exports = categoryController