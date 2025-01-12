const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    // Check if constraint Report_organisation_team_date_key exists.
    const [results] = await sequelize.query(
      `SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'Report' AND indexname = 'Report_organisation_team_date_key');`
    );
    if (!results[0].exists) {
      await sequelize.query(`alter table "mano"."Report" add constraint "Report_organisation_team_date_key" unique (organisation, team, "date");`);
    }
  } catch (e) {
    capture(e);
  }
};
