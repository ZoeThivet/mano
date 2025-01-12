const personFields = [
  { name: "user", type: "text", label: "", encrypted: true, importable: false, filterable: false },
  { name: "name", type: "text", label: "Nom prénom ou Pseudonyme", encrypted: true, importable: true, filterable: true },
  { name: "otherNames", type: "text", label: "Autres pseudos", encrypted: true, importable: true, filterable: true },
  {
    name: "gender",
    type: "enum",
    label: "Genre",
    encrypted: true,
    importable: true,
    options: ["Aucun", "Homme", "Femme", "Homme transgenre", "Femme transgenre", "Non binaire", "Autre"],
    filterable: true,
  },
  { name: "birthdate", type: "date", label: "Date de naissance", encrypted: true, importable: true, filterable: true },
  { name: "description", type: "textarea", label: "Description", encrypted: true, importable: true, filterable: true },
  { name: "alertness", type: "boolean", label: "Personne très vulnérable", encrypted: true, importable: true, filterable: true },
  { name: "wanderingAt", type: "date", label: "En rue depuis le", encrypted: true, importable: true, filterable: true },
  {
    name: "personalSituation",
    type: "enum",
    label: "Situation personnelle",
    encrypted: true,
    importable: true,
    options: ["Aucune", "Homme isolé", "Femme isolée", "En couple", "Famille", "Famille monoparentale", "Mineur", "Autre"],
    filterable: true,
  },
  {
    name: "nationalitySituation",
    type: "enum",
    label: "Nationalité",
    encrypted: true,
    importable: true,
    options: ["Hors UE", "UE", "Française", "Apatride"],
    filterable: true,
  },
  { name: "hasAnimal", type: "yes-no", label: "Avec animaux", encrypted: true, importable: true, options: ["Oui", "Non"], filterable: true },
  { name: "structureSocial", type: "text", label: "Structure de suivi social", encrypted: true, importable: true, filterable: true },
  { name: "structureMedical", type: "text", label: "Structure de suivi médical", encrypted: true, importable: true, filterable: true },
  {
    name: "employment",
    type: "enum",
    label: "Emploi",
    encrypted: true,
    importable: true,
    options: ["DPH", "CDD", "CDDI", "CDI", "Interim", "Bénévolat", "Sans activité", "Étudiant", "Non déclaré", "Autre"],
    filterable: true,
  },
  { name: "address", type: "yes-no", label: "Hébergement", encrypted: true, importable: true, options: ["Oui", "Non"], filterable: true },
  {
    name: "addressDetail",
    type: "enum",
    label: "Type d'hébergement",
    encrypted: true,
    options: [
      "Logement",
      "Hébergement association",
      "Chez un tiers",
      "Mise à l'abri",
      "Logement accompagné",
      "Urgence",
      "Insertion",
      "Hôtel",
      "Autre",
    ],
    importable: true,
    filterable: true,
  },
  {
    name: "resources",
    type: "multi-choice",
    label: "Ressources",
    encrypted: true,
    importable: true,
    options: [
      "SANS",
      "ARE",
      "RSA",
      "AAH",
      "ADA",
      "ATA",
      "Retraite",
      "Salaire",
      "Allocation Chômage",
      "Indemnités journalières",
      "Mendicité",
      "Aide financière CCAS",
      "Revenus de Formations",
      "Pension d'invalidité",
      "Contrat d'engagement jeune",
      "Contrat jeune majeur",
      "Autre",
    ],
    filterable: true,
  },
  {
    name: "reasons",
    type: "multi-choice",
    label: "Motif de la situation en rue",
    encrypted: true,
    importable: true,
    options: [
      "Sortie d'hébergement",
      "Expulsion de logement/hébergement",
      "Départ du pays d'origine",
      "Départ de région",
      "Rupture familiale",
      "Perte d'emploi",
      "Sortie d'hospitalisation",
      "Problème de santé",
      "Sortie d'ASE",
      "Sortie de détention",
      "Rupture de soins",
      "Autre",
    ],
    filterable: true,
  },
  {
    name: "healthInsurances",
    type: "multi-choice",
    label: "Couverture(s) médicale(s)",
    encrypted: true,
    importable: true,
    options: ["Aucune", "Régime Général", "PUMa", "AME", "CSS", "Autre"],
    filterable: true,
  },

  { name: "phone", type: "text", label: "Téléphone", encrypted: true, importable: true, filterable: true },
  { name: "assignedTeams", type: "multi-choice", label: "Équipes en charge", encrypted: true, importable: true, filterable: false },
  { name: "_id", label: "", encrypted: false, importable: false, filterable: false },
  { name: "organisation", label: "", encrypted: false, importable: false, filterable: false },
  { name: "followedSince", type: "date", label: "Suivi(e) depuis le / Créé(e) le", encrypted: true, importable: true, filterable: true },
  { name: "createdAt", type: "date", label: "", encrypted: false, importable: false, filterable: false },
  { name: "updatedAt", type: "date", label: "", encrypted: false, importable: false, filterable: false },
  {
    name: "outOfActiveList",
    type: "yes-no",
    label: "Sortie de file active",
    encrypted: true,
    importable: false,
    options: ["Oui", "Non"],
    filterable: true,
  },
  { name: "outOfActiveListDate", type: "date", label: "Date de sortie de file active", encrypted: true, importable: false, filterable: true },
  { name: "documents", type: "files", label: "Documents", encrypted: true, importable: false, filterable: false },
  { name: "history", type: "history", label: "Historique", encrypted: true, importable: false, filterable: false },
];

const fieldsPersonsCustomizableOptions = [
  {
    name: "outOfActiveListReasons",
    type: "multi-choice",
    label: "Motifs de sortie de file active",
    options: [
      "Relai vers autre structure",
      "Hébergée",
      "Décès",
      "Incarcération",
      "Départ vers autre région",
      "Perdu de vue",
      "Hospitalisation",
      "Reconduite à la frontière",
      "Autre",
    ],
    showInStats: true,
    enabled: true,
  },
];

const defaultMedicalCustomFields = [
  {
    name: "consumptions",
    label: "Consommations",
    type: "multi-choice",
    options: [
      "Alcool",
      "Amphétamine/MDMA/Ecstasy",
      "Benzodiazépines",
      "Buprénorphine/Subutex",
      "Cocaïne",
      "Crack",
      "Cannabis",
      "Héroïne",
      "Lyrica",
      "Méthadone",
      "Moscantin/Skénan",
      "Tabac",
      "Tramadol",
    ],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: "vulnerabilities",
    label: "Vulnérabilités",
    type: "multi-choice",
    options: ["Pathologie chronique", "Psychologique", "Injecteur", "Handicap"],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: "caseHistoryTypes",
    label: "Catégorie d'antécédents",
    type: "multi-choice",
    options: [
      "Psychiatrie",
      "Neurologie",
      "Dermatologie",
      "Pulmonaire",
      "Gastro-enterologie",
      "Rhumatologie",
      "Cardio-vasculaire",
      "Ophtalmologie",
      "ORL",
      "Dentaire",
      "Traumatologie",
      "Endocrinologie",
      "Uro-gynéco",
      "Cancer",
      "Addiction alcool",
      "Addiction autres",
      "Hospitalisation",
    ],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: "caseHistoryDescription",
    label: "Informations complémentaires (antécédents)",
    type: "textarea",
    options: null,
    enabled: true,
    required: false,
    showInStats: true,
  },
];

module.exports = {
  personFields,
  fieldsPersonsCustomizableOptions,
  defaultMedicalCustomFields,
};
