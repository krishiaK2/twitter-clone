const router = new require('express').Router();
const passport = require('./config/passport');
const { distanceInWords } = require('date-fns');
const db = require('./config/database');
const { flash } = require('./middlewares');
const { query } = require('./utils');

router.use(flash);
router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.get('/', async (req, res) => {
    if (req.user) {
        const getAllTweetsQuery = await query('08-get-all-tweets.sql');
        let tweets = await db.query(getAllTweetsQuery);
        tweets = await Promise.all(tweets.rows.map(tweet => (
            new Promise(async (resolve, reject) => {
                const getUsersWithEmailQuery = await query('03-get-users-with-email.sql', { email: tweet.user_email });
                const users = await db.query(getUsersWithEmailQuery);

                tweet.user = users.rows[0];
                tweet.user.avatar = 'static/images/default-avatar.png';
                tweet.created_at = distanceInWords(new Date(tweet.created_at), new Date());
                resolve(tweet);
            })
        )));
        const context = { tweets };
        res.render('feed.html', context);
    } else {
        res.render('landing.html');
    }
});

router.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/',
        failureFlash: 'Invalid user credentials.'
    }),

    (req, res) => {
        if (req.body.remember) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // expire in 30 days
        } else {
            req.session.cookie.expires = false; // expire at the end of session
        }
        res.redirect('/');
    }
);

router.post('/signup', async (req, res) => {
    const getUsersWithEmailQuery = await query('03-get-users-with-email.sql', { email: req.body.email });
    const users = await db.query(getUsersWithEmailQuery);
    if (users.rows.length > 0) {
        req.flash('signupError', 'Email is already in use.');
        return res.redirect('/');
    }

    const user = {
        fullname: req.body.fullname,
        username: req.body.fullname.replace(/\s+/g, '').toLowerCase(),
        email: req.body.email,
        password: req.body.password
    };
    const insertUserQuery = await query('04-insert-user.sql', user);
    await db.query(insertUserQuery);

    req.login(user, (err) => res.redirect('/'));
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

router.post('/tweets', async (req, res) => {
    const createTweetQuery = await query('07-insert-tweet.sql', {
        body: req.body.tweet,
        user: req.user.email
    });
    await db.query(createTweetQuery);

    res.redirect('/');
});

router.delete('/tweets/:id', async (req, res) => {
    const deleteTweetQuery = await query('09-delete-tweet-with-id.sql', { id: req.params.id });
    await db.query(deleteTweetQuery);

    res.redirect('/');
});

module.exports = router;
