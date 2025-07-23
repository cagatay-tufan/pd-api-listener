const basicAuth = require('basic-auth');
require('dotenv').config();

const authenticate = (req, res, next) => {
    const user = basicAuth(req);

    const validUser = process.env.BASIC_AUTH_USER;
    const validPassword = process.env.BASIC_AUTH_PASS;

    if (!user || user.name !== validUser || user.pass !== validPassword) {
        res.set('WWW-Authenticate', 'Basic realm="401"');
        return res.status(401).send('Authentication required.');
    }

    next(); // Authenticated
};

module.exports = authenticate;