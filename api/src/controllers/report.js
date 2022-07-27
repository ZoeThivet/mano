const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");
const { catchErrors } = require("../errors");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const Report = require("../models/report");

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.enum(["true", "false"])).parse(req.query.withDeleted);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.after);
    } catch (e) {
      const error = new Error(`Invalid request in report get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = { where: { organisation: req.user.organisation } };

    const total = await Report.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Report.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "team", "createdAt", "updatedAt", "deletedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
        team: z.string().regex(looseUuidRegex),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in report creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const data = await Report.create(
      {
        organisation: req.user.organisation,
        encrypted: req.body.encrypted,
        encryptedEntityKey: req.body.encryptedEntityKey,
        team: req.body.team,
      },
      { returning: true }
    );
    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        encrypted: data.encrypted,
        encryptedEntityKey: data.encryptedEntityKey,
        organisation: data.organisation,
        team: data.team,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
      z.string().parse(req.body.team);
    } catch (e) {
      const error = new Error(`Invalid request in report put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const report = await Report.findOne(query);
    if (!report) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey, team } = req.body;
    report.set({
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
      team: team,
    });
    await report.save();
    return res.status(200).send({
      ok: true,
      data: {
        _id: report._id,
        encrypted: report.encrypted,
        encryptedEntityKey: report.encryptedEntityKey,
        organisation: report.organisation,
        team: report.team,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        deletedAt: report.deletedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      const error = new Error(`Invalid request in report delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const report = await Report.findOne(query);
    if (!report) return res.status(200).send({ ok: true });

    await report.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
