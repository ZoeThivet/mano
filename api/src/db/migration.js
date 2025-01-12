const { Op } = require("sequelize");
const Organisation = require("../models/organisation");
const Team = require("../models/team");
const Person = require("../models/person");
const User = require("../models/user");
const Place = require("../models/place");
const RelPersonPlace = require("../models/relPersonPlace");
const RelUserTeam = require("../models/relUserTeam");
const Structure = require("../models/structure");
const Action = require("../models/action");
const Comment = require("../models/comment");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");
const Report = require("../models/report");
const { capture } = require("../sentry");
// here you can write any data migration, not schema migrations
