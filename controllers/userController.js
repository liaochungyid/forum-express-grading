const userService = require('../services/userService')

const userController = {
  getUser: (req, res) => {
    userService.getUser(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return req.redirect('back')
      }

      return res.render('profile', data)
    })
  },
  editUser: (req, res) => {
    userService.editUser(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }

      return res.render('edit', data)
    })
  },
  putUser: (req, res) => {
    userService.putUser(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('back')
      }

      req.flash('success_messages', data.message)
      return res.redirect(`/users/${req.params.id}`)
    })
  },
  signUpPage: (req, res) => {
    return res.render('signup')
  },
  signUp: (req, res) => {
    userService.signUp(req, res, (data) => {
      if (data.status === 'error') {
        req.flash('error_messages', data.message)
        return res.redirect('/signup')
      }

      req.flash('success_messages', data.message)
      return res.redirect('/signin')
    })
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
    userService.addFavorite(req, res, (data) => {
      if (data.status === 'success') {
        return res.redirect('back')
      }
    })
  },
  removeFavorite: (req, res) => {
    userService.removeFavorite(req, res, (data) => {
      if (data.status === 'success') {
        return res.redirect('back')
      }
    })
  },
  addLike: (req, res) => {
    userService.addLike(req, res, (data) => {
      if (data.status === 'success') {
        return res.redirect('back')
      }
    })
  },
  removeLike: (req, res) => {
    userService.removeLike(req, res, (data) => {
      if (data.status === 'success') {
        return res.redirect('back')
      }
    })
  },
  getTopUser: (req, res) => {
    userService.getTopUser(req, res, (data) => {
      return res.render('topUser', data)
    })
  },
  addFollowing: (req, res) => {
    userService.addFollowing(req, res, (data) => {
      if (data.status === 'success') {
        return res.redirect('back')
      }
    })
  },
  removeFollowing: (req, res) => {
    userService.removeFollowing(req, res, (data) => {
      if (data.status === 'success') {
        return res.redirect('back')
      }
    })
  }
}

module.exports = userController