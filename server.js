const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const morgan = require('morgan');
const config = require('./config');
const authRoutes = require('./routes/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(morgan('dev'));

app.use('/', authRoutes);

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('dashboard', { user: req.user });
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
