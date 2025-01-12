import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith } from "./utils";
test.beforeAll(async () => {
  await populate();
});

test("Create custom fields filtered by team", async ({ page }) => {
  // Always use a new items
  const personName = nanoid();
  const territoryName = nanoid();
  const teamExcludeCustomFieldName = nanoid();
  const testPersonSocialField = nanoid();
  const testPersonMedicalField = nanoid();
  const testMedicalFileField = nanoid();
  const testConsultationField = nanoid();
  const testObsTerritoryField = nanoid();

  await loginWith(page, "admin4@example.org");

  /*

  Add a new team



  */

  await page.getByRole("link", { name: "Équipes" }).click();
  await expect(page).toHaveURL("http://localhost:8090/team");

  await page.getByRole("button", { name: "Créer une nouvelle équipe" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(teamExcludeCustomFieldName);

  await page.getByLabel("Non").check();

  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.locator(".Toastify__close-button").last().click();

  /*
  Add the custom fields
  */

  await page.getByRole("link", { name: "Organisation" }).click();

  await page.getByRole("button", { name: "Personnes suivies" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).first().click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(testPersonSocialField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Ajouter un champ" }).nth(1).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(testPersonMedicalField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Dossier Médical 🧑‍⚕️" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(testMedicalFileField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Consultations 🧑‍⚕️" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByLabel("Nom").fill(testConsultationField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Territoires" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(testObsTerritoryField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  /*
  Check that the fields exist and update their value
  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(personName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();
  await changeReactSelectValue(page, "team-selector-topBar", "Team Test - 4");

  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("dialog").getByText("Informations sociales").click();
  await page.getByLabel(testPersonSocialField).click();

  await page.getByRole("dialog").getByText("Informations médicales").click();
  await page.getByLabel(testPersonMedicalField).click();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.getByLabel(testMedicalFileField).click();
  await page.getByRole("button", { name: "🩺 Ajouter une consultation" }).click();
  await page.getByRole("textbox", { name: "Nom (facultatif)" }).fill("Consult");
  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
  await page.getByLabel(testConsultationField).click();
  await page.getByLabel(testConsultationField).fill("Super");
  await page.getByRole("button", { name: "Sauvegarder" }).click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");
  await page.getByRole("button", { name: "Créer un nouveau territoire" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(territoryName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByLabel(testObsTerritoryField).click();
  await page.getByLabel(testObsTerritoryField).fill("Magique");
  await clickOnEmptyReactSelect(page, "observation-select-team", teamExcludeCustomFieldName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();

  /*
  Restrict the fields to the team
  */

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Personnes suivies" }).click();

  await page.locator(`data-test-id=${testPersonSocialField}`).getByText("Toute l'organisation").click();

  await page.locator(`data-test-id=${testPersonSocialField}`).getByLabel(teamExcludeCustomFieldName).uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).nth(2).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.locator(`data-test-id=${testPersonMedicalField}`).getByText("Toute l'organisation").click();

  await page.locator(`data-test-id=${testPersonMedicalField}`).getByLabel(teamExcludeCustomFieldName).uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).nth(3).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Dossier Médical 🧑‍⚕️" }).click();

  await page.locator(`data-test-id=${testMedicalFileField}`).getByText("Toute l'organisation").click();

  await page.locator(`data-test-id=${testMedicalFileField}`).getByLabel(teamExcludeCustomFieldName).uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Consultations 🧑‍⚕️" }).click();

  await page.locator(`data-test-id=${testConsultationField}`).getByLabel("Toute l'organisation").uncheck();

  await page.locator(`data-test-id=${testConsultationField}`).getByLabel(teamExcludeCustomFieldName).uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).nth(1).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Territoires" }).click();

  await page.locator(`data-test-id=${testObsTerritoryField}`).getByText("Toute l'organisation").click();

  await page.locator(`data-test-id=${testObsTerritoryField}`).getByLabel(teamExcludeCustomFieldName).uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.locator(".Toastify__close-button").last().click();

  /*

  Test the restrictions on the fields
  Test with the allowed team



  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("cell", { name: personName }).click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("dialog").getByText("Informations sociales").click();
  await page.locator(`data-test-id=${testPersonSocialField}`).click();
  await page.getByRole("dialog").getByText("Informations médicales").click();
  await page.locator(`data-test-id=${testPersonMedicalField}`).click();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.locator(`data-test-id=${testMedicalFileField}`).click();
  await page.locator("tbody > tr > td:nth-child(5)").click();
  await page.locator(`data-test-id=${testConsultationField}`).click();

  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");

  await page.getByRole("cell", { name: territoryName }).click();

  await page.getByText(`${testObsTerritoryField}: Magique`).click();

  await page.locator(`data-test-id=${testObsTerritoryField}`).click();

  await page
    .locator('div[role="document"]:has-text("Modifier l\'observation×Nombre de personnes non connues hommes rencontréesNombre ")')
    .getByRole("button", { name: "Close" })
    .click();

  /*
  Test the restrictions on the fields
  Test with the unallowed team
  */

  await changeReactSelectValue(page, "team-selector-topBar", teamExcludeCustomFieldName);

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("cell", { name: personName }).click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("dialog").getByText("Informations sociales").click();
  await expect(page.locator(`data-test-id=${testPersonSocialField}`)).toBeHidden();
  await page.getByRole("dialog").getByText("Informations médicales").click();
  await expect(page.locator(`data-test-id=${testPersonMedicalField}`)).toBeHidden();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await expect(page.locator(`data-test-id=${testMedicalFileField}`)).toBeHidden();
  await page.locator("tbody > tr > td:nth-child(5)").click();
  await expect(page.locator(`data-test-id=${testConsultationField}`)).toBeHidden();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");

  await page.getByRole("cell", { name: territoryName }).click();

  await expect(page.getByText("Test champ perso observation: Magique")).toBeHidden();
  await page.getByText("Nombre de personnes non connues hommes rencontrées:").click();

  await expect(page.locator(`data-test-id=${testObsTerritoryField}`)).toBeHidden();

  await page
    .locator('div[role="document"]:has-text("Modifier l\'observation×Nombre de personnes non connues hommes rencontréesNombre ")')
    .getByRole("button", { name: "Close" })
    .click();
});
