import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
  __dirname,
  "../src/alicia/infrastructure/seed/catalog.seed.json",
);

/** Catálogo piloto Espírito Santo — ortopedia e neurocirurgia. Não inventar dados. */

const UNCONFIRMED = "__PENDING_VERIFICATION__";
const PUBLICATIONS_PLACEHOLDER =
  "Publicações ainda não listadas neste perfil.";

/** @type {import("../src/alicia/infrastructure/import/import-types.ts").CatalogImportPayload} */
const payload = {
  doctors: [
    {
      id: "victor-marchezi-cobe",
      name: "Dr. Victor Marchezi Cobe",
      specialty: "Ortopedia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
      whoTheyAre:
        "Ortopedista com atuação em cirurgia do quadril na Grande Vitória.",
      trajectory:
        "Formação em Medicina pela Universidade Federal do Espírito Santo (UFES), residência em Ortopedia e Traumatologia no Hospital Municipal Miguel Couto (RJ) e especialização em cirurgia do quadril no Instituto Nacional de Traumatologia e Ortopedia (INTO).",
      graduation: {
        institution: "Universidade Federal do Espírito Santo (UFES)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital Municipal Miguel Couto (HMMC)",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
      ],
      fellowships: [
        {
          institution: "Instituto Nacional de Traumatologia e Ortopedia (INTO)",
          program: "Cirurgia do quadril",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
      ],
      practiceAreas: ["Cirurgia do quadril", "Ortopedia e traumatologia", "Artroplastia"],
      institutions: [
        {
          name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Meridional",
          role: "Ortopedista",
          city: "Vila Velha",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 11.596", type: "Registro profissional" },
          { name: "RQE 9.880", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. Victor Cobe (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://drvictorcobe.com.br/",
          },
          {
            name: "ICOT — corpo clínico (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://icotortopedia.com.br/corpo-clinico/victor-marchezi-cobe/",
          },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "joao-donatelli",
      name: "Dr. João Donatelli",
      specialty: "Ortopedia",
      location: { lat: -20.3085, lng: -40.3082, city: "Vitória", state: "ES" },
      mainInstitution: "Hospital Bento Ferreira",
      whoTheyAre:
        "Ortopedista com atuação em cirurgia do ombro e cotovelo na região metropolitana de Vitória.",
      trajectory:
        "Graduação pela Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM), residência no Hospital do Servidor Público Estadual de São Paulo (IAMSPE) e especialização no Instituto do Cérebro de Paulo Niemeyer (IFOR).",
      graduation: {
        institution: "Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital do Servidor Público Estadual de São Paulo (IAMSPE)",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Instituto do Cérebro de Paulo Niemeyer (IFOR)",
          program: "Cirurgia do ombro e cotovelo",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      practiceAreas: ["Cirurgia do ombro", "Cirurgia do cotovelo", "Ortopedia esportiva"],
      institutions: [
        { name: "Hospital Bento Ferreira", role: "Ortopedista", city: "Vitória", state: "ES" },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 14.738", type: "Registro profissional" },
          { name: "TEOT 18.141", type: "Título de especialista" },
          {
            name: "Site oficial — Dr. João Donatelli (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.joaodonatelli.com.br/",
          },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
          { name: "Hospital Bento Ferreira", type: "Instituição" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "charles-takasaki",
      name: "Dr. Charles Takasaki",
      specialty: "Ortopedia",
      location: { lat: -20.3155, lng: -40.3128, city: "Vitória", state: "ES" },
      mainInstitution: "Hospital Bento Ferreira",
      whoTheyAre:
        "Ortopedista com atuação em pé e tornozelo em Vitória e Vila Velha.",
      trajectory:
        "Graduação pela Universidade Federal do Espírito Santo (UFES) em 2003, residência no Hospital Municipal Miguel Couto (HMMC) em 2006 e especialização no Hospital do Servidor Público Estadual de São Paulo (IAMSPE) em 2009.",
      graduation: {
        institution: "Universidade Federal do Espírito Santo (UFES)",
        program: "Medicina",
        period: "2003",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital Municipal Miguel Couto (HMMC)",
          program: "Ortopedia e Traumatologia",
          period: "2006",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
      ],
      fellowships: [
        {
          institution: "Hospital do Servidor Público Estadual de São Paulo (IAMSPE)",
          program: "Cirurgia do pé e tornozelo",
          period: "2009",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      practiceAreas: ["Pé e tornozelo", "Trauma do pé", "Artroscopia"],
      institutions: [
        { name: "Hospital Bento Ferreira", role: "Ortopedista", city: "Vitória", state: "ES" },
        { name: "CLIVIT", role: "Ortopedista", city: "Vitória", state: "ES" },
        { name: "Clínica Médica XV de Novembro", role: "Ortopedista", city: "Vila Velha", state: "ES" },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 7.681", type: "Registro profissional" },
          { name: "RQE 6.842", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. Charles Takasaki (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.charlestakasaki.com.br/",
          },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
          { name: "Hospital Bento Ferreira", type: "Instituição" },
        ],
        unverifiedFields: ["Produção científica"],
      },
    },
    {
      id: "rodrigo-miranda",
      name: "Dr. Rodrigo Miranda Vieira",
      specialty: "Ortopedia",
      location: { lat: -20.3297, lng: -40.2925, city: "Vila Velha", state: "ES" },
      mainInstitution: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
      whoTheyAre:
        "Ortopedista com atuação em pé e tornozelo na Grande Vitória.",
      trajectory:
        "Formação em Medicina pela Universidade Federal do Espírito Santo (UFES) em 2012, residência em Ortopedia e Traumatologia no Hospital Municipal Dr. Cármino Caricchio (HMCC – Tatuapé) entre 2013 e 2016 e subespecialização em Medicina e Cirurgia do Tornozelo e Pé no IOT-FM-USP entre 2016 e 2017, conforme Instituto Capixaba de Ortopedia e Traumatologia (ICOT).",
      graduation: {
        institution: "Universidade Federal do Espírito Santo (UFES)",
        program: "Medicina",
        period: "2012",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital Municipal Dr. Cármino Caricchio (HMCC – Tatuapé)",
          program: "Ortopedia e Traumatologia",
          period: "2013-2016",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution:
            "Instituto de Ortopedia e Traumatologia do Hospital das Clínicas da Faculdade de Medicina da USP (IOT-FM-USP)",
          program: "Medicina e Cirurgia do Tornozelo e Pé",
          period: "2016-2017",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      practiceAreas: ["Pé e tornozelo", "Ortopedia e traumatologia", "Consulta ortopédica"],
      institutions: [
        {
          name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Meridional",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 11.604", type: "Registro profissional" },
          { name: "RQE 10.023", type: "Registro de qualificação de especialista" },
          {
            name: "ICOT — corpo clínico Rodrigo Miranda Vieira (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://icotortopedia.com.br/corpo-clinico/rodrigo-miranda-vieira/",
          },
          {
            name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)",
            type: "Sociedade médica",
          },
          {
            name: "Associação Brasileira de Medicina e Cirurgia do Tornozelo e Pé (ABTPé)",
            type: "Sociedade médica",
          },
        ],
        unverifiedFields: ["Produção científica"],
      },
    },
    {
      id: "francisco-de-carvalho",
      name: "Dr. Francisco José de Carvalho",
      specialty: "Ortopedia",
      location: { lat: -20.3188, lng: -40.2865, city: "Vitória", state: "ES" },
      mainInstitution: "Consultório de Ortopedia e Cirurgia do Joelho",
      whoTheyAre:
        "Ortopedista com atuação em cirurgia do joelho na região de Vitória.",
      trajectory:
        "Residência em Ortopedia e Traumatologia no Hospital Municipal Miguel Couto (HMMC) entre 2000 e 2003, título de especialista (TEOT) pela Sociedade Brasileira de Ortopedia e Traumatologia (SBOT) em 2003 e especialização em Cirurgia do Joelho no Instituto Nacional de Traumatologia e Ortopedia (INTO) entre 2003 e 2004, conforme site oficial.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital Municipal Miguel Couto (HMMC)",
          program: "Ortopedia e Traumatologia",
          period: "2000-2003",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
      ],
      fellowships: [
        {
          institution: "Instituto Nacional de Traumatologia e Ortopedia (INTO)",
          program: "Cirurgia do joelho",
          period: "2003-2004",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
      ],
      practiceAreas: ["Cirurgia do joelho", "Ortopedia", "Procedimentos minimamente invasivos"],
      institutions: [
        {
          name: "Consultório de Ortopedia e Cirurgia do Joelho",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 14.274", type: "Registro profissional" },
          { name: "RQE 9.316", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Quem sou (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://drfranciscocarvalho.com/quem-sou/",
          },
          {
            name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT) — TEOT",
            type: "Sociedade médica",
          },
          {
            name: "Sociedade Brasileira de Cirurgia do Joelho (SBCJ)",
            type: "Sociedade médica",
          },
        ],
        unverifiedFields: ["Graduação", "Produção científica"],
      },
    },
    {
      id: "diego-santanna-faria",
      name: "Dr. Diego Sant'Anna Faria",
      specialty: "Ortopedia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
      whoTheyAre:
        "Ortopedista com atuação em fixadores externos, alongamento e reconstrução óssea na Grande Vitória.",
      trajectory:
        "Formação em Medicina pela Faculdade Brasileira UNIVIX, residência em Ortopedia e Traumatologia no Hospital Municipal Dr. Mário Gatti (SP) e especialização em reconstrução e alongamento ósseo na Universidade Federal de São Paulo (UNIFESP).",
      graduation: {
        institution: "Faculdade Brasileira UNIVIX",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital Municipal Dr. Mário Gatti",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "Campinas",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Universidade Federal de São Paulo (UNIFESP)",
          program: "Reconstrução e alongamento ósseo",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      practiceAreas: [
        "Fixadores externos",
        "Alongamento ósseo",
        "Reconstrução óssea",
        "Ortopedia e traumatologia",
      ],
      institutions: [
        {
          name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 11.047", type: "Registro profissional" },
          { name: "RQE 10.017", type: "Registro de qualificação de especialista" },
          { name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)", type: "Instituição" },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "marcio-vieira-sanches-silva",
      name: "Dr. Marcio Vieira Sanches Silva",
      specialty: "Ortopedia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
      whoTheyAre:
        "Ortopedista pediátrico com atuação em Vitória, Vila Velha e instituições de referência da região.",
      trajectory:
        "Formação pela EMESCAM, residência no Hospital do Servidor Público Estadual de São Paulo (IAMSPE), especialização em ortopedia pediátrica na AACD e observação no Boston Children's Hospital (Harvard Medical School).",
      graduation: {
        institution: "Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital do Servidor Público Estadual de São Paulo (IAMSPE)",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Associação de Assistência à Criança Deficiente (AACD)",
          program: "Ortopedia pediátrica",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
        {
          institution: "Boston Children's Hospital (Harvard Medical School)",
          program: "Ortopedia pediátrica",
          verified: true,
          institutionCity: "Boston",
          institutionState: "EUA",
        },
      ],
      practiceAreas: ["Ortopedia pediátrica", "Ortopedia e traumatologia"],
      institutions: [
        {
          name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
          role: "Ortopedista pediátrico",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Estadual Infantil Nossa Senhora da Glória (HINSG)",
          role: "Coordenador de ortopedia pediátrica",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Estadual Infantil e Maternidade Alzir Bernardino Alves (HEIMABA)",
          role: "Ortopedista",
          city: "Vila Velha",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 11.449", type: "Registro profissional" },
          { name: "RQE 10.027", type: "Registro de qualificação de especialista" },
          { name: "TEOT 14.751", type: "Título de especialista" },
          { name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)", type: "Instituição" },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "leonardo-peixoto-pancini",
      name: "Dr. Leonardo Peixoto Pancini",
      specialty: "Ortopedia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
      whoTheyAre:
        "Ortopedista com atuação em cirurgia da mão e microcirurgia na Grande Vitória.",
      trajectory:
        "Graduação pela UFES em 2011, residência em Ortopedia e Traumatologia no Hospital Maria Amélia Lins e Hospital João XXIII (MG) e residência em Cirurgia da Mão no Hospital Ortopédico de Belo Horizonte (Dr. Pardini).",
      graduation: {
        institution: "Universidade Federal do Espírito Santo (UFES)",
        program: "Medicina",
        period: "2011",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Fundação Hospitalar do Estado de Minas Gerais – Hospital Maria Amélia Lins (HMAL)",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "Belo Horizonte",
          institutionState: "MG",
        },
        {
          institution: "Hospital Ortopédico de Belo Horizonte (Dr. Pardini)",
          program: "Cirurgia da mão",
          verified: true,
          institutionCity: "Belo Horizonte",
          institutionState: "MG",
        },
      ],
      fellowships: [],
      practiceAreas: ["Cirurgia da mão", "Microcirurgia", "Ortopedia e traumatologia"],
      institutions: [
        {
          name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 11.137", type: "Registro profissional" },
          { name: "RQE 10.347", type: "Registro de qualificação de especialista" },
          { name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)", type: "Instituição" },
          { name: "Sociedade Brasileira de Cirurgia da Mão (SBCM)", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Produção científica"],
      },
    },
    {
      id: "gustavo-henrique-pereira-salomao",
      name: "Dr. Gustavo Henrique Pereira Salomão",
      specialty: "Ortopedia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
      whoTheyAre:
        "Ortopedista com atuação em cirurgia do joelho na Grande Vitória.",
      trajectory:
        "Graduação pela UFES em 2012, residência em Ortopedia e Traumatologia no Hospital da Baleia (Belo Horizonte) e subespecialização em cirurgia do joelho no Hospital Biocor.",
      graduation: {
        institution: "Universidade Federal do Espírito Santo (UFES)",
        program: "Medicina",
        period: "2012",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Fundação Benjamin Guimarães – Hospital da Baleia",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "Belo Horizonte",
          institutionState: "MG",
        },
      ],
      fellowships: [
        {
          institution: "Hospital Biocor",
          program: "Cirurgia do joelho",
          verified: true,
          institutionCity: "Belo Horizonte",
          institutionState: "MG",
        },
      ],
      practiceAreas: ["Cirurgia do joelho", "Ortopedia e traumatologia"],
      institutions: [
        {
          name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 14.590", type: "Registro profissional" },
          { name: "RQE 9.567", type: "Registro de qualificação de especialista" },
          { name: "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)", type: "Instituição" },
          { name: "Sociedade Brasileira de Cirurgia do Joelho (SBCJ)", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "gustavo-nascimento-ottoni",
      name: "Dr. Gustavo Nascimento Ottoni",
      specialty: "Ortopedia",
      location: { lat: -20.1245, lng: -40.3075, city: "Serra", state: "ES" },
      mainInstitution: "Hospital Metropolitano",
      whoTheyAre:
        "Ortopedista com atuação na Serra e na região metropolitana de Vitória, conforme registros do Hospital Metropolitano.",
      trajectory:
        "Consta como ortopedista no corpo clínico do Hospital Metropolitano (Serra). A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Ortopedia e traumatologia"],
      institutions: [
        {
          name: "Hospital Metropolitano",
          role: "Ortopedista",
          city: "Serra",
          state: "ES",
        },
        {
          name: "Clínica APS Metropolitana",
          role: "Ortopedista",
          city: "Serra",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 11.371", type: "Registro profissional" },
          { name: "RQE 7.264", type: "Registro de qualificação de especialista" },
          { name: "Hospital Metropolitano", type: "Instituição" },
          { name: "Clínica APS Metropolitana", type: "Instituição" },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "iann-alas-pavan",
      name: "Dr. Iann Alas Pavan",
      specialty: "Ortopedia",
      location: { lat: -20.2639, lng: -40.4165, city: "Cariácica", state: "ES" },
      mainInstitution: "Hospital Meridional",
      whoTheyAre:
        "Ortopedista especialista em coluna vertebral e tratamento da dor, com atuação em Cariacica e Vitória.",
      trajectory:
        "Atua no CEO Meridional (Cariacica) e em consultório em Vitória, conforme registros do site oficial. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: [
        "Cirurgia da coluna vertebral",
        "Tratamento da dor",
        "Ortopedia e traumatologia",
      ],
      institutions: [
        {
          name: "Hospital Meridional",
          role: "Ortopedista",
          city: "Cariácica",
          state: "ES",
        },
        {
          name: "Consultório – Enseada do Suá",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 15.392", type: "Registro profissional" },
          { name: "RQE 13.597", type: "Registro de qualificação de especialista" },
          { name: "Site oficial – Dr. Iann Alas Pavan", type: "Instituição" },
          { name: "Hospital Meridional", type: "Instituição" },
          { name: "Rede Meridional – Cariacica/ES", type: "Instituição" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "lucas-loss-possatti",
      name: "Dr. Lucas Loss Possatti",
      specialty: "Neurocirurgia",
      location: { lat: -20.1286, lng: -40.3078, city: "Serra", state: "ES" },
      mainInstitution: "Instituto Neurológico do Espírito Santo (INEST)",
      whoTheyAre:
        "Neurocirurgião com atuação em tumores, base de crânio e neurocirurgia vascular. Integra a equipe do Instituto Neurológico do Espírito Santo (INEST).",
      trajectory:
        "Graduação pela Universidade Federal do Espírito Santo (UFES), residência no Conjunto Hospitalar do Mandaqui (SP) e especializações na Harvard Medical School e no Brigham and Women's Hospital.",
      graduation: {
        institution: "Universidade Federal do Espírito Santo (UFES)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Conjunto Hospitalar do Mandaqui",
          program: "Neurocirurgia",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Harvard Medical School",
          program: "Neurocirurgia",
          verified: true,
          institutionCity: "Boston",
          institutionState: "EUA",
        },
        {
          institution: "Brigham and Women's Hospital",
          program: "Cirurgia de base de crânio",
          verified: true,
          institutionCity: "Boston",
          institutionState: "EUA",
        },
      ],
      practiceAreas: [
        "Neurocirurgia oncológica",
        "Base de crânio",
        "Neurocirurgia vascular",
        "Hidrocefalia",
      ],
      institutions: [
        {
          name: "Instituto Neurológico do Espírito Santo (INEST)",
          role: "Neurocirurgião",
          city: "Serra",
          state: "ES",
        },
        {
          name: "Hospital Meridional",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 8.605", type: "Registro profissional" },
          { name: "RQE 7.132", type: "Registro de qualificação de especialista" },
          { name: "Instituto Neurológico do Espírito Santo (INEST)", type: "Instituição" },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
          { name: "EMESCAM – corpo docente", type: "Instituição" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "andre-faria-teixeira",
      name: "Dr. André Faria Junho Teixeira",
      specialty: "Neurocirurgia",
      location: { lat: -20.3155, lng: -40.3128, city: "Vitória", state: "ES" },
      mainInstitution: "Instituto de Neurocirurgia",
      whoTheyAre:
        "Neurocirurgião integrante do Instituto de Neurocirurgia, com atuação em Vitória e na região metropolitana.",
      trajectory:
        "Consta no corpo clínico do Instituto de Neurocirurgia e em registros públicos de estabelecimentos de saúde. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia"],
      institutions: [
        {
          name: "Instituto de Neurocirurgia",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Unimed Vitória",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Santa Rita",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 13.224", type: "Registro profissional" },
          { name: "RQE 8.443", type: "Registro de qualificação de especialista" },
          {
            name: "Instituto de Neurocirurgia (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.institutoneurocirurgia.com.br/",
          },
          {
            name: "Site médico — formação (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://andreteixeira.site.med.br/index.asp?PageName=formacao",
          },
          { name: "CNES – Instituto de Neurocirurgia", type: "Registro público" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "paulo-melo-jacques",
      name: "Dr. Paulo de Melo Jacques",
      specialty: "Neurocirurgia",
      location: { lat: -20.2639, lng: -40.4165, city: "Cariácica", state: "ES" },
      mainInstitution: "Hospital Meridional",
      whoTheyAre:
        "Neurocirurgião com atuação em Cariacica, Vitória e Serra, conforme registros do Hospital Meridional e do Hospital Estadual Central (HEC).",
      trajectory:
        "Consta no corpo clínico do Hospital Meridional e em referência ao HEC. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia"],
      institutions: [
        {
          name: "Hospital Meridional",
          role: "Neurocirurgião",
          city: "Cariácica",
          state: "ES",
        },
        {
          name: "Hospital Estadual Central (HEC)",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 2.446", type: "Registro profissional" },
          { name: "RQE 459", type: "Registro de qualificação de especialista" },
          { name: "RQE 460", type: "Registro de qualificação de especialista" },
          { name: "Hospital Meridional", type: "Instituição" },
          { name: "Hospital Estadual Central (HEC)", type: "Instituição" },
          {
            name: "Publicação científica — Arquivos Brasileiros de Neurocirurgia (2018)",
            type: "Produção científica",
            url: "https://doi.org/10.1055/s-0038-1672507",
          },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "fabrizio-borges-scardino",
      name: "Dr. Fabrizio Borges Scardino",
      specialty: "Neurocirurgia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Hospital Meridional",
      whoTheyAre:
        "Neurocirurgião com atuação em neurocirurgia, coluna vertebral e tratamento da dor na Grande Vitória. Coordena o serviço de neurocirurgia do Hospital Meridional.",
      trajectory:
        "Residência em Neurocirurgia no Hospital do Servidor Público Estadual de São Paulo (HSPE-SP), mestrado em Ciências da Saúde no IAMSPE-SP, pós-graduação em Dor na USP e estágio no Barrow Neurological Institute (EUA).",
      graduation: {
        institution:
          "Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Hospital do Servidor Público Estadual de São Paulo (HSPE-SP)",
          program: "Neurocirurgia",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Instituto de Assistência Médica ao Servidor Público Estadual de São Paulo (IAMSPE-SP)",
          program: "Mestrado em Ciências da Saúde – Cirurgia da coluna vertebral",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
        {
          institution: "Universidade de São Paulo (USP)",
          program: "Pós-graduação em Dor",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
        {
          institution: "Barrow Neurological Institute (BNI)",
          program: "Estágio em neurocirurgia",
          verified: true,
          institutionCity: "Phoenix",
          institutionState: "EUA",
        },
      ],
      practiceAreas: [
        "Neurocirurgia",
        "Cirurgia da coluna vertebral",
        "Neuro-oncologia",
        "Tratamento da dor",
      ],
      institutions: [
        {
          name: "Hospital Meridional",
          role: "Coordenador do serviço de neurocirurgia",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Consultório – Praia do Canto",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Consultório – Praia da Costa",
          role: "Neurocirurgião",
          city: "Vila Velha",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 7.461", type: "Registro profissional" },
          { name: "RQE 5.587", type: "Registro de qualificação de especialista" },
          { name: "RQE 8.043", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. Fabrizio Scardino (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://drfabrizioscardino.wixsite.com/site",
          },
          {
            name: "Neuroicon — equipe Dr. Fabrizio Scardino (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://neuroicon.com.br/index.php/team/dr-fabrizio-scardino/",
          },
          { name: "Hospital Meridional", type: "Instituição" },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "maria-laura-menezes",
      name: "Dra. Maria Laura Bezerra de Menezes",
      specialty: "Neurocirurgia",
      location: { lat: -20.3297, lng: -40.2925, city: "Vila Velha", state: "ES" },
      mainInstitution: "Hospital Estadual Infantil Nossa Senhora da Glória (HINSG)",
      whoTheyAre:
        "Neurocirurgiã com atuação em Vitória e Vila Velha, conforme registros públicos de vínculos hospitalares e consultório.",
      trajectory:
        "Consta como neurocirurgiã em hospitais da região metropolitana e em consultório na Praia da Costa. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia"],
      institutions: [
        {
          name: "Hospital Estadual Infantil Nossa Senhora da Glória (HINSG)",
          role: "Neurocirurgiã",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Consultório – Praia da Costa",
          role: "Neurocirurgiã",
          city: "Vila Velha",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 6.144", type: "Registro profissional" },
          { name: "RQE 1.363", type: "Registro de qualificação de especialista" },
          {
            name: "CliniGuia — vínculos profissionais ES (consultado em 2026-07-22)",
            type: "Registro público",
            url: "https://cliniguia.com/profissionais/maria-laura-bezerra-de-menezes-201549770410000/",
          },
          { name: "Hospital Estadual Infantil Nossa Senhora da Glória (HINSG)", type: "Instituição" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "ulysses-caus-batista",
      name: "Dr. Ulysses Caus Batista",
      specialty: "Neurocirurgia",
      location: { lat: -20.1245, lng: -40.3075, city: "Serra", state: "ES" },
      mainInstitution: "Hospital Metropolitano",
      whoTheyAre:
        "Neurocirurgião e neurorradiologista intervencionista com atuação em Vitória, Vila Velha e Serra. Coordena o serviço de neurologia, neurocirurgia e neurorradiologia intervencionista do Hospital Meridional Serra.",
      trajectory:
        "Neurocirurgião formado pela UNICAMP e neurorradiologista intervencionista formado pela Beneficência Portuguesa de São Paulo, conforme registros do site oficial. A graduação em Medicina ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Campinas",
        institutionState: "SP",
      },
      residency: [
        {
          institution: "Universidade Estadual de Campinas (UNICAMP)",
          program: "Neurocirurgia",
          verified: true,
          institutionCity: "Campinas",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Beneficência Portuguesa de São Paulo",
          program: "Neurorradiologia intervencionista",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      practiceAreas: [
        "Neurocirurgia",
        "Neurorradiologia intervencionista",
        "Cirurgia da coluna vertebral",
        "Neurocirurgia vascular",
      ],
      institutions: [
        {
          name: "Hospital Metropolitano",
          role: "Coordenador de neurologia, neurocirurgia e neurorradiologia intervencionista",
          city: "Serra",
          state: "ES",
        },
        {
          name: "Hospital Meridional",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Clínica Médica XV de Novembro",
          role: "Neurocirurgião",
          city: "Vila Velha",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 10.289", type: "Registro profissional" },
          { name: "RQE 10.507", type: "Registro de qualificação de especialista" },
          { name: "RQE 10.508", type: "Registro de qualificação de especialista" },
          { name: "Site oficial – Dr. Ulysses Batista", type: "Instituição" },
          { name: "Hospital Metropolitano", type: "Instituição" },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Graduação", "Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "bruno-victor-da-costa",
      name: "Dr. Bruno Victor da Costa",
      specialty: "Neurocirurgia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Hospital Meridional",
      whoTheyAre:
        "Neurocirurgião com atuação em neurocirurgia oncológica e cirurgia da coluna vertebral na Grande Vitória.",
      trajectory:
        "Graduação em Medicina pela Universidade Presidente Antônio Carlos (UNIPAC-JF), mestrado em cirurgia pela Universidade Federal de Minas Gerais (UFMG) e atuação prévia no Hospital João XXIII e no Hospital Metropolitano Odilon Behrens (Belo Horizonte), onde foi preceptor da residência de neurocirurgia. Atua em Vitória desde 2024.",
      graduation: {
        institution: "Universidade Presidente Antônio Carlos (UNIPAC-JF)",
        program: "Medicina",
        verified: true,
        institutionCity: "Juiz de Fora",
        institutionState: "MG",
      },
      residency: [],
      fellowships: [
        {
          institution: "Universidade Federal de Minas Gerais (UFMG)",
          program: "Mestrado em cirurgia – tumores hipofisários",
          verified: true,
          institutionCity: "Belo Horizonte",
          institutionState: "MG",
        },
      ],
      practiceAreas: [
        "Neurocirurgia oncológica",
        "Cirurgia da coluna vertebral",
        "Tumores cerebrais",
        "Hérnia de disco",
      ],
      institutions: [
        {
          name: "Hospital Meridional",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Santa Rita",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 21.286", type: "Registro profissional" },
          { name: "RQE 14.804", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. Bruno Victor (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://drbrunovictor.com.br/",
          },
          {
            name: "Hospital Belo Horizonte — corpo clínico (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://hospitalbelohorizonte.com.br/convenios/",
          },
          {
            name: "Repositório UFMG — dissertação de mestrado (consultado em 2026-07-22)",
            type: "Instituição formadora",
            url: "https://www.medicina.ufmg.br/defesa-de-dissertacao-avaliacao-dos-aspectos-da-imagem-de-ressonancia-magnetica-e-resultados-da-hipofisectomia-transesfenoidal-endoscopica-em-pacientes-acromegalicos/",
          },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
          { name: "Hospital Meridional", type: "Instituição" },
        ],
        unverifiedFields: ["Residência", "Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "leonardo-henrique-rodrigues",
      name: "Dr. Leonardo Henrique da Silva Rodrigues",
      specialty: "Neurocirurgia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Hospital Meridional",
      whoTheyAre:
        "Neurocirurgião com atuação em técnicas minimamente invasivas para doenças do cérebro e da coluna vertebral na Grande Vitória.",
      trajectory:
        "Formação pela Santa Casa de Misericórdia de São Paulo, especializações na Santa Casa de São Paulo e na Universidade de Wisconsin (EUA) em neurocirurgia vascular e base de crânio.",
      graduation: {
        institution: "Santa Casa de Misericórdia de São Paulo",
        program: "Medicina",
        verified: true,
        institutionCity: "São Paulo",
        institutionState: "SP",
      },
      residency: [
        {
          institution: "Santa Casa de Misericórdia de São Paulo",
          program: "Neurocirurgia",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Universidade de Wisconsin",
          program: "Neurocirurgia vascular e base de crânio",
          verified: true,
          institutionCity: "Madison",
          institutionState: "EUA",
        },
      ],
      practiceAreas: [
        "Neurocirurgia",
        "Neurocirurgia vascular",
        "Base de crânio",
        "Cirurgia da coluna vertebral",
      ],
      institutions: [
        {
          name: "Hospital Meridional",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Consultório – Praia do Canto",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 13.200", type: "Registro profissional" },
          { name: "RQE 13.455", type: "Registro de qualificação de especialista" },
          { name: "Site oficial – Dr. Leonardo Rodrigues", type: "Instituição" },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
          { name: "Hospital Meridional", type: "Instituição" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "alexandre-teixeira-dos-santos",
      name: "Dr. Alexandre Teixeira dos Santos",
      specialty: "Neurocirurgia",
      location: { lat: -20.3155, lng: -40.3128, city: "Vitória", state: "ES" },
      mainInstitution: "Instituto de Neurocirurgia",
      whoTheyAre:
        "Neurocirurgião integrante do Instituto de Neurocirurgia, com atuação em Vitória e Vila Velha.",
      trajectory:
        "Consta no corpo clínico do Instituto de Neurocirurgia e em registros públicos de estabelecimentos de saúde. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia", "Cirurgia da coluna vertebral"],
      institutions: [
        {
          name: "Instituto de Neurocirurgia",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
        {
          name: "Hospital Unimed Vitória",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 7.671", type: "Registro profissional" },
          { name: "RQE 6.818", type: "Registro de qualificação de especialista" },
          {
            name: "Instituto de Neurocirurgia (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.institutoneurocirurgia.com.br/",
          },
          { name: "CNES – Instituto de Neurocirurgia", type: "Registro público" },
          { name: "Hospital Unimed Vitória", type: "Instituição" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "derval-de-paula-pimentel",
      name: "Dr. Derval de Paula Pimentel",
      specialty: "Neurocirurgia",
      location: { lat: -20.1286, lng: -40.3078, city: "Serra", state: "ES" },
      mainInstitution: "Instituto Neurológico do Espírito Santo (INEST)",
      whoTheyAre:
        "Neurocirurgião com atuação na Grande Vitória, conforme registros do Instituto Neurológico do Espírito Santo (INEST) e vínculos hospitalares públicos.",
      trajectory:
        "Consta como neurocirurgião no INEST e em hospitais da região metropolitana. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia"],
      institutions: [
        {
          name: "Instituto Neurológico do Espírito Santo (INEST)",
          role: "Neurocirurgião",
          city: "Serra",
          state: "ES",
        },
        {
          name: "Hospital Estadual Central (HEC)",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 5.023", type: "Registro profissional" },
          { name: "RQE 655", type: "Registro de qualificação de especialista" },
          {
            name: "ICEPI-ES — caderno programa neurocirurgia 2024 (consultado em 2026-07-22)",
            type: "Instituição formadora",
            url: "https://app.wiki.saude.es.gov.br/icepi/residencia/residencia-medica/neurocirurgia/caderno_programa_neurocirurgia_2024.pdf",
          },
          { name: "Instituto Neurológico do Espírito Santo (INEST)", type: "Instituição" },
          { name: "Hospital Estadual Central (HEC)", type: "Instituição" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "paulo-cesar-mariano-henrique",
      name: "Dr. Paulo César Mariano Henrique",
      specialty: "Neurocirurgia",
      location: { lat: -20.2972, lng: -40.2958, city: "Vitória", state: "ES" },
      mainInstitution: "Centro de Tratamento de Dor e Parkinson",
      whoTheyAre:
        "Neurocirurgião com atuação em cirurgia da coluna, dor crônica e neurocirurgia funcional em Vitória.",
      trajectory:
        "Graduação em Medicina pela Universidade Federal do Espírito Santo (UFES), residência em Neurocirurgia pela Santa Casa de São Paulo e especialização em Dor pela Universidade de São Paulo (USP).",
      graduation: {
        institution: "Universidade Federal do Espírito Santo (UFES)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Santa Casa de Misericórdia de São Paulo",
          program: "Neurocirurgia",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      fellowships: [
        {
          institution: "Universidade de São Paulo (USP)",
          program: "Especialização em Dor",
          verified: true,
          institutionCity: "São Paulo",
          institutionState: "SP",
        },
      ],
      practiceAreas: [
        "Neurocirurgia",
        "Cirurgia da coluna vertebral",
        "Dor crônica",
        "Cirurgia endoscópica da coluna",
      ],
      institutions: [
        {
          name: "Centro de Tratamento de Dor e Parkinson",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 7.712", type: "Registro profissional" },
          { name: "RQE 4.872", type: "Registro de qualificação de especialista" },
          { name: "RQE 3.388", type: "Registro de qualificação de especialista" },
          { name: "Site oficial – Dr. Paulo Mariano", type: "Instituição" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "paulo-henrique-rebuli",
      name: "Dr. Paulo Henrique Rebuli",
      specialty: "Ortopedia",
      location: { lat: -20.6736, lng: -40.5029, city: "Guarapari", state: "ES" },
      mainInstitution: "Policlínica Endocenter",
      whoTheyAre:
        "Ortopedista e traumatologista especialista em cirurgia do joelho, com atendimento em Guarapari e na Grande Vitória.",
      trajectory:
        "Formado em Medicina pela Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM), com residência em Ortopedia e Traumatologia pelo Vila Velha Hospital e especialização em cirurgia do joelho pela Santa Casa de Misericórdia de Vitória.",
      graduation: {
        institution: "Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Vila Velha Hospital",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "Vila Velha",
          institutionState: "ES",
        },
      ],
      fellowships: [
        {
          institution: "Santa Casa de Misericórdia de Vitória",
          program: "Cirurgia do joelho",
          verified: true,
          institutionCity: "Vitória",
          institutionState: "ES",
        },
      ],
      practiceAreas: [
        "Cirurgia do joelho",
        "Ortopedia e traumatologia",
        "Traumatologia esportiva",
      ],
      institutions: [
        {
          name: "Policlínica Endocenter",
          role: "Ortopedista",
          city: "Guarapari",
          state: "ES",
        },
        {
          name: "Centro Ortopédico de Vitória (COV)",
          role: "Ortopedista",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 15.723", type: "Registro profissional" },
          { name: "RQE 12.832", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. Paulo Rebuli (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://drpaulorebuli.com.br/",
          },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
          { name: "Sociedade Brasileira de Cirurgia do Joelho (SBCJ)", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "luciano-pontes-lobo",
      name: "Dr. Luciano Pontes Lobo",
      specialty: "Neurocirurgia",
      location: { lat: -20.6736, lng: -40.5029, city: "Guarapari", state: "ES" },
      mainInstitution: "Policlínica Endocenter",
      whoTheyAre:
        "Neurocirurgião com atuação em Guarapari e na região metropolitana, conforme registros de vínculos hospitalares.",
      trajectory:
        "Consta como neurocirurgião na Policlínica Endocenter (Guarapari), no Hospital Estadual Jayme Santos Neves e no Hospital Meridional. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Guarapari",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia", "Cirurgia da coluna vertebral"],
      institutions: [
        {
          name: "Policlínica Endocenter",
          role: "Neurocirurgião",
          city: "Guarapari",
          state: "ES",
        },
        {
          name: "Hospital Estadual Jayme Santos Neves",
          role: "Neurocirurgião",
          city: "Serra",
          state: "ES",
        },
        {
          name: "Hospital Meridional",
          role: "Neurocirurgião",
          city: "Vitória",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 6.042", type: "Registro profissional" },
          { name: "RQE 4.829", type: "Registro de qualificação de especialista" },
          {
            name: "Policlínica Endocenter — Guarapari (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.catalogo.med.br/medicos/em-guarapari-es/policlinica-endocenter-e836249.htm",
          },
          { name: "Hospital Estadual Jayme Santos Neves", type: "Instituição" },
          { name: "Hospital Meridional", type: "Instituição" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "fabiano-da-silva-bortot",
      name: "Dr. Fabiano da Silva Bortot",
      specialty: "Ortopedia",
      location: { lat: -19.3945, lng: -40.0643, city: "Linhares", state: "ES" },
      mainInstitution: "Hospital Geral de Linhares",
      whoTheyAre:
        "Ortopedista e traumatologista com atuação no Hospital Geral de Linhares.",
      trajectory:
        "Consta como ortopedista no Hospital Geral de Linhares. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Linhares",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Ortopedia e traumatologia"],
      institutions: [
        {
          name: "Hospital Geral de Linhares",
          role: "Ortopedista",
          city: "Linhares",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 8.817", type: "Registro profissional" },
          { name: "RQE 7.611", type: "Registro de qualificação de especialista" },
          { name: "Hospital Geral de Linhares", type: "Instituição" },
          {
            name: "Hospital Geral de Linhares — endereço profissional (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.doctoralia.com.br/fabiano-da-silva-bortot/ortopedista-traumatologista/linhares",
          },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "floriano-schwanz-filho",
      name: "Dr. Floriano Schwanz Filho",
      specialty: "Neurocirurgia",
      location: { lat: -19.3945, lng: -40.0643, city: "Linhares", state: "ES" },
      mainInstitution: "Consultório — Linhares",
      whoTheyAre:
        "Neurocirurgião com atuação em Linhares, conforme registro profissional no CRM-ES.",
      trajectory:
        "Graduado em Medicina pela Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM), conforme registro público do CRM-ES. Residência e especializações adicionais ainda estão em verificação.",
      graduation: {
        institution: "Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)",
        program: "Medicina",
        verified: true,
        institutionCity: "Vitória",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia", "Cirurgia da coluna vertebral"],
      institutions: [
        {
          name: "Consultório — Av. João Felipe Calmon",
          role: "Neurocirurgião",
          city: "Linhares",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 5.114", type: "Registro profissional" },
          { name: "RQE 688", type: "Registro de qualificação de especialista" },
          {
            name: "Registro público CRM-ES — graduação EMESCAM (consultado em 2026-07-22)",
            type: "Registro profissional",
            url: "https://idoutor.com/medico/es/floriano-schwanz-filho-5114",
          },
          {
            name: "Consultório — Av. João Felipe Calmon, 1262, Linhares (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.doctoralia.com.br/floriano-schwanz-filho-2/neurocirurgiao-neurologista/linhares",
          },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "andre-bergamin",
      name: "Dr. André Bergamin",
      specialty: "Ortopedia",
      location: { lat: -19.5383, lng: -40.6309, city: "Colatina", state: "ES" },
      mainInstitution: "Consultório — Colatina",
      whoTheyAre:
        "Ortopedista especialista em cirurgia do pé e tornozelo e cirurgia do trauma, com atendimento em Colatina.",
      trajectory:
        "Formado em Medicina pela Faculdade de Medicina de Campos (RJ), com residência em Ortopedia e Traumatologia pelo Hospital Municipal Miguel Couto (HMMC), residência em cirurgia do trauma pelo HMMC e residência em pé e tornozelo pelo Hospital Municipal Lourenço Jorge (RJ).",
      graduation: {
        institution: "Faculdade de Medicina de Campos (RJ)",
        program: "Medicina",
        verified: true,
        institutionCity: "Campos dos Goytacazes",
        institutionState: "RJ",
      },
      residency: [
        {
          institution: "Hospital Municipal Miguel Couto (HMMC)",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
        {
          institution: "Hospital Municipal Miguel Couto (HMMC)",
          program: "Cirurgia do trauma (fraturas)",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
        {
          institution: "Hospital Municipal Lourenço Jorge",
          program: "Pé e tornozelo",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
      ],
      fellowships: [],
      practiceAreas: [
        "Cirurgia do pé e tornozelo",
        "Ortopedia e traumatologia",
        "Cirurgia do trauma",
      ],
      institutions: [
        {
          name: "Consultório — Colatina",
          role: "Ortopedista",
          city: "Colatina",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 11.559", type: "Registro profissional" },
          { name: "RQE 8.885", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. André Bergamin (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.drandrebergamin.com/",
          },
          {
            name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT) — TEOT 13.926",
            type: "Sociedade médica",
          },
          {
            name: "Hospital Municipal Lourenço Jorge — residência pé e tornozelo",
            type: "Instituição formadora",
          },
        ],
        unverifiedFields: ["Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "petterson-giostri-ferrari",
      name: "Dr. Petterson Giostri Ferrari",
      specialty: "Neurocirurgia",
      location: { lat: -19.5383, lng: -40.6309, city: "Colatina", state: "ES" },
      mainInstitution: "Clínica CEONCO",
      whoTheyAre:
        "Neurocirurgião com atuação em Colatina, conforme registros de vínculos hospitalares e clínicos na região.",
      trajectory:
        "Consta como neurocirurgião na Clínica CEONCO e no Hospital Unimed Noroeste Capixaba, em Colatina. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Colatina",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia", "Neurocirurgia pediátrica", "Cirurgia da coluna vertebral"],
      institutions: [
        {
          name: "Clínica CEONCO",
          role: "Neurocirurgião",
          city: "Colatina",
          state: "ES",
        },
        {
          name: "Hospital Unimed Noroeste Capixaba",
          role: "Neurocirurgião",
          city: "Colatina",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 8.784", type: "Registro profissional" },
          { name: "RQE 5.483", type: "Registro de qualificação de especialista" },
          {
            name: "CliniGuia — vínculos profissionais Colatina (consultado em 2026-07-22)",
            type: "Registro público",
            url: "https://cliniguia.com/profissionais/petterson-giostri-ferrari-980016000238806/",
          },
          { name: "Clínica CEONCO", type: "Instituição" },
          { name: "Hospital Unimed Noroeste Capixaba", type: "Instituição" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "rodrigo-turra-perrone",
      name: "Dr. Rodrigo Turra Perrone",
      specialty: "Ortopedia",
      location: {
        lat: -20.8489,
        lng: -41.1128,
        city: "Cachoeiro de Itapemirim",
        state: "ES",
      },
      mainInstitution: "Consultório — Cachoeiro de Itapemirim",
      whoTheyAre:
        "Ortopedista e traumatologista com foco em cirurgia do joelho, saúde óssea e ortopedia esportiva em Cachoeiro de Itapemirim.",
      trajectory:
        "Residência em Ortopedia e Traumatologia pela Santa Casa de Vitória, especialização em cirurgia do joelho no Hospital IFOR (rede D'Or) e especialização em traumatologia esportiva pela Faculdade de Medicina do ABC (FMABC). A graduação ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Cachoeiro de Itapemirim",
        institutionState: "ES",
      },
      residency: [
        {
          institution: "Santa Casa de Misericórdia de Vitória",
          program: "Ortopedia e Traumatologia",
          verified: true,
          institutionCity: "Vitória",
          institutionState: "ES",
        },
      ],
      fellowships: [
        {
          institution: "Hospital IFOR (rede D'Or)",
          program: "Cirurgia do joelho",
          verified: true,
          institutionCity: "Rio de Janeiro",
          institutionState: "RJ",
        },
        {
          institution: "Faculdade de Medicina do ABC (FMABC)",
          program: "Traumatologia esportiva",
          verified: true,
          institutionCity: "Santo André",
          institutionState: "SP",
        },
      ],
      practiceAreas: [
        "Cirurgia do joelho",
        "Ortopedia esportiva",
        "Osteoporose",
        "Sarcopenia",
      ],
      institutions: [
        {
          name: "Consultório — Cachoeiro de Itapemirim",
          role: "Ortopedista",
          city: "Cachoeiro de Itapemirim",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 13.632", type: "Registro profissional" },
          { name: "RQE 13.993", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. Rodrigo Perrone (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://drrodrigoperrone.com.br/",
          },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
          { name: "Sociedade Brasileira de Cirurgia do Joelho (SBCJ)", type: "Sociedade médica" },
        ],
        unverifiedFields: ["Graduação", "Períodos de formação", "Produção científica"],
      },
    },
    {
      id: "diego-loureiro-carvalho",
      name: "Dr. Diego Loureiro Carvalho",
      specialty: "Neurocirurgia",
      location: {
        lat: -20.8489,
        lng: -41.1128,
        city: "Cachoeiro de Itapemirim",
        state: "ES",
      },
      mainInstitution: "Santa Casa de Misericórdia de Cachoeiro de Itapemirim",
      whoTheyAre:
        "Neurocirurgião com atuação em Cachoeiro de Itapemirim, conforme registros públicos de vínculos profissionais.",
      trajectory:
        "Consta como neurocirurgião na Santa Casa de Misericórdia de Cachoeiro de Itapemirim e em consultório na cidade. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Cachoeiro de Itapemirim",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia"],
      institutions: [
        {
          name: "Santa Casa de Misericórdia de Cachoeiro de Itapemirim",
          role: "Neurocirurgião",
          city: "Cachoeiro de Itapemirim",
          state: "ES",
        },
        {
          name: "Dr. Clinic Neurocirurgia e Dermatologia",
          role: "Neurocirurgião",
          city: "Cachoeiro de Itapemirim",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 10.414", type: "Registro profissional" },
          { name: "RQE 9.639", type: "Registro de qualificação de especialista" },
          {
            name: "CliniGuia — vínculos profissionais ES (consultado em 2026-07-22)",
            type: "Registro público",
            url: "https://cliniguia.com/profissionais/diego-loureiro-carvalho-980016287686931/",
          },
          { name: "Santa Casa de Misericórdia de Cachoeiro de Itapemirim", type: "Instituição" },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "allison-venturini",
      name: "Dr. Allison Venturini",
      specialty: "Ortopedia",
      location: { lat: -18.7163, lng: -39.8589, city: "São Mateus", state: "ES" },
      mainInstitution: "Consultório — São Mateus",
      whoTheyAre:
        "Ortopedista e traumatologista com atuação em dor musculoesquelética e cirurgia do quadril em São Mateus.",
      trajectory:
        "Ortopedista com atuação em São Mateus, membro da Sociedade Brasileira de Ortopedia e Traumatologia (TEOT 16.579) e cirurgião de quadril registrado na SBQN (SA1007). A formação acadêmica institucional detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "São Mateus",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: [
        "Ortopedia e traumatologia",
        "Cirurgia do quadril",
        "Tratamento da dor",
        "Infiltrações articulares",
      ],
      institutions: [
        {
          name: "Consultório — São Mateus",
          role: "Ortopedista",
          city: "São Mateus",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 13.051", type: "Registro profissional" },
          { name: "RQE 12.087", type: "Registro de qualificação de especialista" },
          {
            name: "Site oficial — Dr. Allison Venturini (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://drallisonventurini.com.br/",
          },
          {
            name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT) — TEOT 16.579",
            type: "Sociedade médica",
          },
          { name: "Sociedade Brasileira de Cirurgia do Quadril (SBQN) — SA1007", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "jose-luiz-silva-neves",
      name: "Dr. José Luiz Silva Neves",
      specialty: "Neurocirurgia",
      location: { lat: -18.7163, lng: -39.8589, city: "São Mateus", state: "ES" },
      mainInstitution: "Hospital Doutor Roberto Arnizaut Silvares",
      whoTheyAre:
        "Neurocirurgião com atuação em São Mateus, conforme registros profissionais e vínculos hospitalares na região norte do estado.",
      trajectory:
        "Consta como neurocirurgião no Hospital Doutor Roberto Arnizaut Silvares e em consultório em São Mateus. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "São Mateus",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia"],
      institutions: [
        {
          name: "Hospital Doutor Roberto Arnizaut Silvares",
          role: "Neurocirurgião",
          city: "São Mateus",
          state: "ES",
        },
        {
          name: "Consultório — Centro Médico São Mateus",
          role: "Neurocirurgião",
          city: "São Mateus",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 2.683", type: "Registro profissional" },
          { name: "RQE 508", type: "Registro de qualificação de especialista" },
          { name: "Hospital Doutor Roberto Arnizaut Silvares", type: "Instituição" },
          {
            name: "Consultório — R. Dr. Arlindo Sodré, 522, São Mateus (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.doctoralia.com.br/neurocirurgiao/sao-mateus",
          },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "bruno-lameiras-de-souza",
      name: "Dr. Bruno Lameiras de Souza",
      specialty: "Ortopedia",
      location: { lat: -19.82, lng: -40.2734, city: "Aracruz", state: "ES" },
      mainInstitution: "Fundação Hospital Maternidade São Camilo",
      whoTheyAre:
        "Ortopedista e traumatologista com atuação no Hospital São Camilo em Aracruz.",
      trajectory:
        "Consta como ortopedista na Fundação Hospital Maternidade São Camilo, em Aracruz. A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Aracruz",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Ortopedia e traumatologia", "Trauma ortopédico"],
      institutions: [
        {
          name: "Fundação Hospital Maternidade São Camilo",
          role: "Ortopedista",
          city: "Aracruz",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 6.740", type: "Registro profissional" },
          { name: "RQE 3.763", type: "Registro de qualificação de especialista" },
          {
            name: "Hospital São Camilo — serviços de ortopedia (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.hospitalsaocamilo.org.br/servicos/",
          },
          {
            name: "Fundação Hospital Maternidade São Camilo — Aracruz (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.catalogo.med.br/doutor/bruno-lameiras-de-souza-1761587.htm",
          },
          { name: "Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
    {
      id: "marcos-roberto-reis-dos-santos",
      name: "Dr. Marcos Roberto Reis dos Santos",
      specialty: "Neurocirurgia",
      location: { lat: -19.82, lng: -40.2734, city: "Aracruz", state: "ES" },
      mainInstitution: "Consultório — Aracruz",
      whoTheyAre:
        "Neurocirurgião com consultório em Aracruz e vínculos hospitalares na região norte do Espírito Santo.",
      trajectory:
        "Consta com endereço profissional em Aracruz e vínculo no Hospital Doutor Roberto Arnizaut Silvares (São Mateus). A formação acadêmica detalhada ainda está em verificação.",
      graduation: {
        institution: UNCONFIRMED,
        program: "Medicina",
        verified: false,
        institutionCity: "Aracruz",
        institutionState: "ES",
      },
      residency: [],
      fellowships: [],
      practiceAreas: ["Neurocirurgia"],
      institutions: [
        {
          name: "Consultório — Aracruz",
          role: "Neurocirurgião",
          city: "Aracruz",
          state: "ES",
        },
        {
          name: "Hospital Doutor Roberto Arnizaut Silvares",
          role: "Neurocirurgião",
          city: "São Mateus",
          state: "ES",
        },
      ],
      scientificProductionPlaceholder: PUBLICATIONS_PLACEHOLDER,
      transparency: {
        lastUpdated: "2026-07-22",
        sources: [
          { name: "CRM-ES 6.235", type: "Registro profissional" },
          { name: "RQE 5.731", type: "Registro de qualificação de especialista" },
          {
            name: "Consultório — R. Professor Lobo, 479, Aracruz (consultado em 2026-07-22)",
            type: "Instituição",
            url: "https://www.catalogo.med.br/medicos/neurocirurgioes/em-aracruz-es/",
          },
          { name: "Hospital Doutor Roberto Arnizaut Silvares", type: "Instituição" },
          { name: "Sociedade Brasileira de Neurocirurgia", type: "Sociedade médica" },
        ],
        unverifiedFields: [
          "Graduação",
          "Residência",
          "Especializações adicionais",
          "Períodos de formação",
          "Produção científica",
        ],
      },
    },
  ],
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${payload.doctors.length} doctors to ${outputPath}`);
