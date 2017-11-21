const express = require('express');
const config = require('./server/config/config');
const appMiddleware = require('./server/middleware/appMiddleware');
const error = require('./server/middleware/error');
const webhookRouter = require('./server/routes/webhookRoutes')
const webhookController = require('./server/controllers/webhookController')
const logger = require('./server/util/logger');

const app = express();

appMiddleware(app);

app.use('/', webhookRouter);

app.use(error);

webhookController.CreateWebhook();

const port = config.port;

var server = app.listen(port, () => {
  logger.info(`Server listening on port: ${port}`);
});

module.exports = server;