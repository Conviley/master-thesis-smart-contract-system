const routes = require('next-routes')()

routes.add('/trips/:address', '/trips/show')

module.exports = routes
