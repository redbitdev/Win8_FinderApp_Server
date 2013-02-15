var express = require('express')
  , routes = require('./routes')
  , userRepo = require('./model/user')
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , util = require('util')
  , hogan = require('hogan-express')
  , WindowsLiveStrategy = require('passport-windowslive').Strategy;

// get key at dev.live.com
var WINDOWS_LIVE_CLIENT_ID = "SET-YOUR-ID"
var WINDOWS_LIVE_CLIENT_SECRET = "SET-YOUR-SECRET";
var strategy = new WindowsLiveStrategy({
    clientID: WINDOWS_LIVE_CLIENT_ID,
    clientSecret: WINDOWS_LIVE_CLIENT_SECRET,
    callbackURL: "http://YOUR-AZURE-WEBSITE-NAME.azurewebsites.net/auth/windowslive/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      userRepo.getByLiveId(profile.id,function(error, user){

        if(error) {
          return done(error, null); 
        }
        if(user) {
          return done(null, user);
        }

        userRepo.add(profile, function(err, usr) {
          return done(null, usr);
        });
      });
    });
  }
);

passport.serializeUser(function(user, done) {
  console.log(user);
  //done(null, user.liveId);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(strategy);


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.engine('mustache', hogan);
  app.set('view engine', 'mustache');
  app.set('layout',  __dirname + '/views/layout');
  app.use(express.errorHandler());
  app.use(express.logger('tiny'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
});

app.get('/auth/windowslive',
  passport.authenticate('windowslive', { scope: ['wl.signin', 'wl.basic'] }),
  function(req, res){
    console.log('not called');
    // this function will not be called.
  });

app.get('/auth/windowslive/callback', 
  passport.authenticate('windowslive', { failureRedirect: '/login' }),
  function(req, res) {

  console.log('Here I Am');
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout(); 
  res.redirect('/');
});

app.get('/', ensureAuthenticated, routes.index);
app.get('/login', routes.login);
app.get('/upload', ensureAuthenticated, routes.upload);
app.get('/add', ensureAuthenticated, routes.add);
app.get('/view/:tableName', ensureAuthenticated, routes.view);
app.get('/map/:tableName', ensureAuthenticated, routes.map);
app.get('/api/tables', routes.tables);
app.get('/api/data/:tableName.:format?', routes.select);
app.post('/upload', ensureAuthenticated, routes.uploadPost);
app.get('/debug-user', function(req, res) { return res.json(req.user);});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
  //return next()
}
