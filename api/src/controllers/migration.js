const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Team = require("../models/team");
const User = require("../models/user");
const RelPersonPlace = require("../models/relPersonPlace");
const Action = require("../models/action");
const Person = require("../models/person");
const Place = require("../models/place");
const Consultation = require("../models/consultation");
const Treatment = require("../models/treatment");
const MedicalFile = require("../models/medicalFile");
const Comment = require("../models/comment");
const Passage = require("../models/passage");
const Report = require("../models/report");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { looseUuidRegex } = require("../utils");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");

router.put(
  "/:migrationName",
  passport.authenticate("user", { session: false }),
  validateEncryptionAndMigrations,
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.user.organisation);
      z.string().min(1).parse(req.params.migrationName);
    } catch (e) {
      const error = new Error(`Invalid request in migration: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });
    organisation.set({ migrating: true });
    await organisation.save();

    try {
      await sequelize.transaction(async (tx) => {
        if (req.params.migrationName === "passages-from-comments-to-table") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.commentIdsToDelete);
            z.array(
              z.object({
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.newPassages);
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.reportsToMigrate);
          } catch (e) {
            const error = new Error(`Invalid request in passages-from-comments-to-table migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const passage of req.body.newPassages) {
            await Passage.create({
              encrypted: passage.encrypted,
              encryptedEntityKey: passage.encryptedEntityKey,
              organisation: req.user.organisation,
            });
          }
          for (const _id of req.body.commentIdsToDelete) {
            const comment = await Comment.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (comment) await comment.destroy();
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.reportsToMigrate) {
            const report = await Report.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (report) {
              report.set({ encrypted, encryptedEntityKey });
              await report.save();
            }
          }
        }
        if (req.params.migrationName === "reports-from-real-date-to-date-id") {
          try {
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.reportsToMigrate);
          } catch (e) {
            const error = new Error(`Invalid request in reports-from-real-date-to-date-id migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.reportsToMigrate) {
            const report = await Report.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (report) {
              report.set({ encrypted, encryptedEntityKey });
              await report.save();
            }
          }
        }

        if (req.params.migrationName === "clean-reports-with-no-team-nor-date") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.reportIdsToDelete);
          } catch (e) {
            const error = new Error(`Invalid request in reports-from-real-date-to-date-id migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const _id of req.body.reportIdsToDelete) {
            await Report.destroy({ where: { _id, organisation: req.user.organisation }, transaction: tx });
          }
        }

        if (req.params.migrationName === "add-relations-to-db-models") {
          try {
            for (const encryptedAction of req.body.encryptedActions) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  person: z.string().regex(looseUuidRegex).optional(),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                  team: z.string().regex(looseUuidRegex),
                }).parse(encryptedAction);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedActions: ${e}`), {
                  extra: { encryptedAction, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedPassage of req.body.encryptedPassages) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  person: z.string().regex(looseUuidRegex).optional().nullable(),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                  team: z.string().regex(looseUuidRegex),
                }).parse(encryptedPassage);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedPassage: ${e}`), {
                  extra: { encryptedPassage, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedPerson of req.body.encryptedPersons) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                }).parse(encryptedPerson);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedPerson: ${e}`), {
                  extra: { encryptedPerson, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedPlace of req.body.encryptedPlaces) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                }).parse(encryptedPlace);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedPlace: ${e}`), {
                  extra: { encryptedPlace, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedTerritory of req.body.encryptedTerritories) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                }).parse(encryptedTerritory);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedTerritory: ${e}`), {
                  extra: { encryptedTerritory, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedReport of req.body.encryptedReports) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  team: z.string().regex(looseUuidRegex),
                }).parse(encryptedReport);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedReport: ${e}`), {
                  extra: { encryptedReport, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedTerritoryObservation of req.body.encryptedTerritoryObservations) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  territory: z.string().regex(looseUuidRegex),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                  team: z.string().regex(looseUuidRegex),
                }).parse(encryptedTerritoryObservation);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedTerritoryObservation: ${e}`), {
                  extra: { encryptedTerritoryObservation, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedRelPersonPlace of req.body.encryptedRelsPersonPlace) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  person: z.string().regex(looseUuidRegex),
                  place: z.string().regex(looseUuidRegex),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                }).parse(encryptedRelPersonPlace);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedRelPersonPlace: ${e}`), {
                  extra: { encryptedRelPersonPlace, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedComment of req.body.encryptedComments.filter((c) => Boolean(c.person))) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  team: z.string().regex(looseUuidRegex).optional(),
                  person: z.string().regex(looseUuidRegex).optional(),
                  action: z.string().regex(looseUuidRegex).optional(),
                  user: z.string().regex(looseUuidRegex).optional().nullable(),
                })
                  .refine((comment) => !!comment.person || !!comment.action)
                  .parse(encryptedComment);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedComment: ${e}`), {
                  extra: { encryptedComment, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            const {
              encryptedActions,
              encryptedComments,
              encryptedPassages,
              encryptedPersons,
              encryptedPlaces,
              encryptedRelsPersonPlace,
              encryptedReports,
              encryptedTerritories,
              encryptedTerritoryObservations,
            } = req.body;

            const teams = (await Team.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map((item) => item._id);
            const users = (await User.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map((item) => item._id);
            const persons = (await Person.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map((item) => item._id);
            const places = (await Place.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map((item) => item._id);
            const actions = (await Action.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map((item) => item._id);
            const territories = (await Territory.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map(
              (item) => item._id
            );

            for (const { encrypted, encryptedEntityKey, person, user, team, _id } of encryptedActions) {
              await Action.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  person: persons.includes(person) ? person : null,
                  user: users.includes(user) ? user : null,
                  team: teams.includes(team) ? team : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, person, action, user, team, _id } of encryptedComments) {
              await Comment.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  person: !!person && persons.includes(person) ? person : null,
                  action: !!action && actions.includes(action) ? action : null,
                  user: users.includes(user) ? user : null,
                  team: teams.includes(team) ? team : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, person, user, team, _id } of encryptedPassages) {
              await Passage.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  person: persons.includes(person) ? person : null,
                  user: users.includes(user) ? user : null,
                  team: teams.includes(team) ? team : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, user, _id } of encryptedPersons) {
              await Person.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  user: users.includes(user) ? user : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, user, _id } of encryptedPlaces) {
              await Place.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  user: users.includes(user) ? user : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, person, place, _id } of encryptedRelsPersonPlace) {
              await RelPersonPlace.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  person: persons.includes(person) ? person : null,
                  place: places.includes(place) ? place : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, team, _id } of encryptedReports) {
              await Report.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  team: teams.includes(team) ? team : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, user, _id } of encryptedTerritories) {
              await Territory.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  user: users.includes(user) ? user : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }

            for (const { encrypted, encryptedEntityKey, territory, user, team, _id } of encryptedTerritoryObservations) {
              await TerritoryObservation.update(
                {
                  encrypted,
                  encryptedEntityKey,
                  territory: territories.includes(territory) ? territory : null,
                  user: users.includes(user) ? user : null,
                  team: teams.includes(team) ? team : null,
                },
                { where: { _id, organisation: req.user.organisation }, transaction: tx }
              );
            }
          } catch (e) {
            const error = new Error(`Invalid request in add-relations-to-db-models migration: ${e}`);
            error.status = 400;
            throw error;
          }
        }

        if (req.params.migrationName === "add-relations-of-medical-data-to-db-models") {
          try {
            for (const encryptedConsultation of req.body.encryptedConsultations) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  person: z.string().regex(looseUuidRegex),
                  user: z.string().regex(looseUuidRegex).optional(),
                }).parse(encryptedConsultation);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedConsultation: ${e}`), {
                  extra: { encryptedConsultation, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedTreatment of req.body.encryptedTreatments) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  person: z.string().regex(looseUuidRegex),
                  user: z.string().regex(looseUuidRegex).optional(),
                }).parse(encryptedTreatment);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedTreatment: ${e}`), {
                  extra: { encryptedTreatment, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }

            for (const encryptedMedicalFile of req.body.encryptedMedicalFiles) {
              try {
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                  person: z.string().regex(looseUuidRegex),
                }).parse(encryptedMedicalFile);
              } catch (e) {
                capture(new Error(`Invalid request in add-relations-to-db-models encryptedMedicalFile: ${e}`), {
                  extra: { encryptedMedicalFile, version: req.headers.version },
                  user: req.user,
                });
                return res
                  .status(500)
                  .send({ ok: false, code: "SERVER_ERROR", error: "Désolé, une erreur est survenue, l'équipe technique est prévenue." });
              }
            }
          } catch (e) {
            const error = new Error(`Invalid request in add-relations-to-db-models migration: ${e}`);
            error.status = 400;
            throw error;
          }

          const { encryptedConsultations, encryptedMedicalFiles, encryptedTreatments } = req.body;

          const users = (await User.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map((item) => item._id);
          const persons = (await Person.findAll({ where: { organisation: req.user.organisation }, attributes: ["_id"] })).map((item) => item._id);

          for (const { encrypted, encryptedEntityKey, person, user, _id } of encryptedConsultations) {
            await Consultation.update(
              {
                encrypted,
                encryptedEntityKey,
                person: persons.includes(person) ? person : null,
                user: users.includes(user) ? user : null,
              },
              { where: { _id, organisation: req.user.organisation }, transaction: tx }
            );
          }

          for (const { encrypted, encryptedEntityKey, person, _id } of encryptedMedicalFiles) {
            await MedicalFile.update(
              {
                encrypted,
                encryptedEntityKey,
                person: persons.includes(person) ? person : null,
              },
              { where: { _id, organisation: req.user.organisation }, transaction: tx }
            );
          }

          for (const { encrypted, encryptedEntityKey, person, user, _id } of encryptedTreatments) {
            await Treatment.update(
              { encrypted, encryptedEntityKey, person: persons.includes(person) ? person : null, user: users.includes(user) ? user : null },
              { where: { _id, organisation: req.user.organisation }, transaction: tx }
            );
          }
        }

        organisation.set({
          migrations: [...(organisation.migrations || []), req.params.migrationName],
          migrating: false,
          migrationLastUpdateAt: new Date(),
        });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      organisation.set({ migrating: false });
      await organisation.save();
      return next(e);
    }
    return res.status(200).send({
      ok: true,
      organisation: {
        _id: organisation._id,
        name: organisation.name,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt,
        categories: organisation.categories,
        encryptionEnabled: organisation.encryptionEnabled,
        encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
        receptionEnabled: organisation.receptionEnabled,
        services: organisation.services,
        consultations: organisation.consultations,
        collaborations: organisation.collaborations,
        customFieldsObs: organisation.customFieldsObs,
        encryptedVerificationKey: organisation.encryptedVerificationKey,
        fieldsPersonsCustomizableOptions: organisation.fieldsPersonsCustomizableOptions,
        customFieldsPersonsSocial: organisation.customFieldsPersonsSocial,
        customFieldsPersonsMedical: organisation.customFieldsPersonsMedical,
        customFieldsMedicalFile: organisation.customFieldsMedicalFile,
        migrations: organisation.migrations,
        migrationLastUpdateAt: organisation.migrationLastUpdateAt,
      },
    });
  })
);

module.exports = router;
