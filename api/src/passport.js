const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const { SECRET } = require("./config");
const User = require("./models/user"); // load up the user model

module.exports = (app) => {
  const jwtStrategyOptions = {
    jwtFromRequest: (req) => {
      let token = ExtractJwt.fromAuthHeaderWithScheme("JWT")(req);
      if (!token) token = req.cookies.jwt;
      return token;
    },
    secretOrKey: SECRET,
  };

  passport.use(
    "user",
    new JwtStrategy(jwtStrategyOptions, async function (jwt, done) {
      try {
        const { _id } = jwt;
        const user = await User.findOne({ where: { _id } });
        if (user) {
          const t = await user.getTeams();
          const teams = t.map((t) => t.toJSON());
          return done(null, { ...user.toJSON(), teams });
        }
      } catch (e) {
        console.log("error passport", e);
      }
      return done(null, false);
    })
  );

  app.use(passport.initialize());
};
