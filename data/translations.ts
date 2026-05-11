
import { Translations, Language, HelpSectionContent, TranslationContent, HelpModalContentStructureType, PostTreatmentContent, ExposureExplanationContent, HelpModalTranslatedStrings, CelebrationPageContent, LastSessionPageContent, AIChatContent, TherapistDashboardContent, PatientDetailContent } from '../types.ts';

// --- Help Modal Content Structure ---

// CATALAN
const fearOfFlyingContent_CA: HelpSectionContent = {
  titleKey: 'helpModal.fearOfFlying.title',
  content: [
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.prevalence.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.prevalence.textManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.whoIsAffected.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.whoIsAffected.textManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.whatIsIt.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.whatIsIt.introManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.whatIsIt.physiological.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.whatIsIt.physiological.textManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.whatIsIt.cognitive.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.whatIsIt.cognitive.textManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.whatIsIt.behavioral.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.whatIsIt.behavioral.textManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.howItStarts.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.howItStarts.textManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.howItIsMaintained.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.howItIsMaintained.textManual' },
    { type: 'subtitle', textKey: 'helpModal.fearOfFlying.howToSolve.title' },
    { type: 'paragraph', textKey: 'helpModal.fearOfFlying.howToSolve.textManual' },
  ],
};

const cafftInfoContent_CA: HelpSectionContent = {
    titleKey: 'helpModal.cafftInfo.title',
    content: [
        { type: 'subtitle', textKey: 'helpModal.cafftInfo.howItWorks.title' },
        { type: 'paragraph', textKey: 'helpModal.cafftInfo.howItWorks.textManual' },
        { type: 'subtitle', textKey: 'helpModal.cafftInfo.duration.title' },
        { type: 'paragraph', textKey: 'helpModal.cafftInfo.duration.textManual' },
        { type: 'subtitle', textKey: 'helpModal.cafftInfo.efficacy.title' },
        { type: 'paragraph', textKey: 'helpModal.cafftInfo.efficacy.textManual' },
        { type: 'subtitle', textKey: 'helpModal.cafftInfo.tasksBetweenSessions.title' },
        { type: 'paragraph', textKey: 'helpModal.cafftInfo.tasksBetweenSessions.textManual' },
    ]
};

const prospectusContent_CA: HelpSectionContent = {
    titleKey: 'helpModal.prospectus.title',
    content: [
        { type: 'subtitle', textKey: 'helpModal.prospectus.indications.title' },
        { type: 'paragraph', textKey: 'helpModal.prospectus.indications.textManual' },
        { type: 'subtitle', textKey: 'helpModal.prospectus.adverseEffects.title' },
        { type: 'paragraph', textKey: 'helpModal.prospectus.adverseEffects.textManual' },
        { type: 'subtitle', textKey: 'helpModal.prospectus.advantages.title' },
        { type: 'list', itemKeys: ['helpModal.prospectus.advantages.list'] },
        { type: 'subtitle', textKey: 'helpModal.cafftInfo.conditions.title' },
        { type: 'list', itemKeys: ['helpModal.cafftInfo.conditions.item1Manual', 'helpModal.cafftInfo.conditions.item2Manual', 'helpModal.cafftInfo.conditions.item3Manual', 'helpModal.cafftInfo.conditions.item4Manual'] },
        { type: 'subtitle', textKey: 'helpModal.cafftInfo.involvement.title' },
        { type: 'paragraph', textKey: 'helpModal.cafftInfo.involvement.textManual' },
        { type: 'list', itemKeys: ['helpModal.cafftInfo.involvement.list1', 'helpModal.cafftInfo.involvement.list2', 'helpModal.cafftInfo.involvement.list3'] },
    ]
};

const postTreatmentContent_CA: HelpSectionContent = {
    titleKey: 'helpModal.postTreatmentSection.title',
    content: [
        { type: 'paragraph', textKey: 'helpModal.postTreatmentSection.introManual' },
        { type: 'list', itemKeys: [
            'helpModal.postTreatmentSection.instructionItem1Manual', 
            'helpModal.postTreatmentSection.instructionItem2Manual', 
            'helpModal.postTreatmentSection.instructionItem3Manual', 
            'helpModal.postTreatmentSection.instructionItem4Manual', 
            'helpModal.postTreatmentSection.instructionItem5Manual', 
            'helpModal.postTreatmentSection.instructionItem6Manual'
        ] },
        { type: 'paragraph', textKey: 'helpModal.postTreatmentSection.nervousnessAdviceManual' },
    ]
};

const helpVideosContent_CA: HelpSectionContent = {
    titleKey: 'helpVideos.pageTitle',
    content: [
        { type: 'video_list' }
    ]
};

const therapistInfoContent_CA: HelpSectionContent = {
    titleKey: 'helpModal.therapistInfo.title',
    content: [
        { type: 'subtitle', textKey: 'helpModal.therapistInfo.evidenceTitle' },
        { type: 'paragraph', textKey: 'helpModal.therapistInfo.evidenceText' },
        { type: 'subtitle', textKey: 'helpModal.therapistInfo.mechanismTitle' },
        { type: 'paragraph', textKey: 'helpModal.therapistInfo.mechanismText' },
        { type: 'subtitle', textKey: 'helpModal.therapistInfo.metricsTitle' },
        { type: 'paragraph', textKey: 'helpModal.therapistInfo.rciExplanation' },
        { type: 'paragraph', textKey: 'helpModal.therapistInfo.slopeExplanation' },
        { type: 'subtitle', textKey: 'helpModal.therapistInfo.applicationTitle' },
        { type: 'paragraph', textKey: 'helpModal.therapistInfo.applicationText' },
        { type: 'subtitle', textKey: 'helpModal.therapistInfo.faqTitle' },
        { type: 'paragraph', textKey: 'helpModal.therapistInfo.faqText' },
    ]
};

const aiChatContent_CA: HelpSectionContent = {
    titleKey: 'helpModal.aiChatSection.title',
    content: [
        { type: 'ai_chat' }
    ]
};

const therapistAiChatContent_CA: HelpSectionContent = {
    titleKey: 'helpModal.therapistAiChatSection.title',
    content: [
        { type: 'ai_chat' }
    ]
};


// SPANISH
const fearOfFlyingContent_ES: HelpSectionContent = { ...fearOfFlyingContent_CA };
const cafftInfoContent_ES: HelpSectionContent = { ...cafftInfoContent_CA };
const prospectusContent_ES: HelpSectionContent = { ...prospectusContent_CA };
const postTreatmentContent_ES: HelpSectionContent = { ...postTreatmentContent_CA };
const helpVideosContent_ES: HelpSectionContent = { ...helpVideosContent_CA };
const therapistInfoContent_ES: HelpSectionContent = { 
    ...therapistInfoContent_CA,
    titleKey: 'helpModal.therapistInfo.title' 
};
const aiChatContent_ES: HelpSectionContent = { ...aiChatContent_CA };
const therapistAiChatContent_ES: HelpSectionContent = { ...therapistAiChatContent_CA };

// ENGLISH
const fearOfFlyingContent_EN: HelpSectionContent = { ...fearOfFlyingContent_CA };
const cafftInfoContent_EN: HelpSectionContent = { ...cafftInfoContent_CA };
const prospectusContent_EN: HelpSectionContent = { ...prospectusContent_CA };
const postTreatmentContent_EN: HelpSectionContent = { ...postTreatmentContent_CA };
const helpVideosContent_EN: HelpSectionContent = { ...helpVideosContent_CA };
const therapistInfoContent_EN: HelpSectionContent = { 
    ...therapistInfoContent_CA,
    titleKey: 'helpModal.therapistInfo.title' 
};
const aiChatContent_EN: HelpSectionContent = { ...aiChatContent_CA };
const therapistAiChatContent_EN: HelpSectionContent = { ...therapistAiChatContent_CA };

export const helpModalContentStructure: HelpModalContentStructureType = {
  [Language.CA]: {
    fearOfFlying: fearOfFlyingContent_CA,
    cafftInfo: cafftInfoContent_CA,
    prospectus: prospectusContent_CA,
    postTreatment: postTreatmentContent_CA,
    helpVideos: helpVideosContent_CA,
    technicalSection: {
      titleKey: 'helpModal.technicalSection.title',
      content: [
        { type: 'subtitle', textKey: 'helpModal.technicalSection.requirements.title' },
        { type: 'paragraph', textKey: 'helpModal.technicalSection.requirements.text' },
        { type: 'list', itemKeys: ['helpModal.technicalSection.requirements.list'] },
        { type: 'subtitle', textKey: 'helpModal.technicalSection.contraindications.title' },
        { type: 'paragraph', textKey: 'helpModal.technicalSection.contraindications.text' },
        { type: 'list', itemKeys: ['helpModal.technicalSection.contraindications.list'] },
      ]
    },
    aiChat: aiChatContent_CA,
    therapistAiChat: therapistAiChatContent_CA,
    therapistInfo: therapistInfoContent_CA,
  },
  [Language.ES]: {
    fearOfFlying: fearOfFlyingContent_ES,
    cafftInfo: cafftInfoContent_ES,
    prospectus: prospectusContent_ES,
    postTreatment: postTreatmentContent_ES,
    helpVideos: helpVideosContent_ES,
    technicalSection: {
      titleKey: 'helpModal.technicalSection.title',
      content: [
        { type: 'subtitle', textKey: 'helpModal.technicalSection.requirements.title' },
        { type: 'paragraph', textKey: 'helpModal.technicalSection.requirements.text' },
        { type: 'list', itemKeys: ['helpModal.technicalSection.requirements.list'] },
        { type: 'subtitle', textKey: 'helpModal.technicalSection.contraindications.title' },
        { type: 'paragraph', textKey: 'helpModal.technicalSection.contraindications.text' },
        { type: 'list', itemKeys: ['helpModal.technicalSection.contraindications.list'] },
      ]
    },
    aiChat: aiChatContent_ES,
    therapistAiChat: therapistAiChatContent_ES,
    therapistInfo: therapistInfoContent_ES,
  },
  [Language.EN]: {
    fearOfFlying: fearOfFlyingContent_EN,
    cafftInfo: cafftInfoContent_EN,
    prospectus: prospectusContent_EN,
    postTreatment: postTreatmentContent_EN,
    helpVideos: helpVideosContent_EN,
    technicalSection: {
      titleKey: 'helpModal.technicalSection.title',
      content: [
        { type: 'subtitle', textKey: 'helpModal.technicalSection.requirements.title' },
        { type: 'paragraph', textKey: 'helpModal.technicalSection.requirements.text' },
        { type: 'list', itemKeys: ['helpModal.technicalSection.requirements.list'] },
        { type: 'subtitle', textKey: 'helpModal.technicalSection.contraindications.title' },
        { type: 'paragraph', textKey: 'helpModal.technicalSection.contraindications.text' },
        { type: 'list', itemKeys: ['helpModal.technicalSection.contraindications.list'] },
      ]
    },
    aiChat: aiChatContent_EN,
    therapistAiChat: therapistAiChatContent_EN,
    therapistInfo: therapistInfoContent_EN,
  },
};


// --- Main Translations ---

const caTranslations: TranslationContent = {
    appName: "Tractament Assistit per Ordinador de la Por de Volar (CAFFT)",
    appNameShort: "CAFFT",
    common: {
        time: {
            ago: "fa {val} {unit}",
            year: "any",
            month: "mes",
            day: "dia",
            hour: "hora",
            minute: "minut",
            second: "segon",
            years: "anys",
            months: "mesos",
            days: "dies",
            hours: "hores",
            minutes: "minuts",
            seconds: "segons",
            session: "sessió",
            sessions: "sessions",
        }
    },
    informedConsent: {
        title: "Avaluació Inicial",
        dob: "Data de naixement",
        gender: "Sexe",
        genderMale: "Masculí",
        genderFemale: "Femení",
        genderOther: "Altres",
        occupation: "Ocupació",
        occupationStudent: "Estudiant universitari (grau, postgrau, màster, doctorat)",
        occupationPTAGS: "PTAGS",
        occupationPDI: "PDI",
        occupationOther: "Altre",
        source: "Com has conegut la Consulta de Benestar Psicològic?",
        sourceWeb: "Via Web",
        sourceUnitatMedica: "Servei de Prevenció (Unitat mèdica)",
        sourceNecessitats: "Oficina de Suport a Persones amb Necessitats Educatives",
        sourceProfesor: "Recomanació Professorat",
        sourceUser: "Recomanació d'un usuari",
        sourceFriend: "Recomanació un/a conegut/da",
        sourceOther: "Altres",
        consentDate: "Data Consentiment Informat",
        consentText: "Don el meu consentiment per al tractament de les meves dades de caràcter personal per part de l'Espai de Benetar Psicològic (EBP) de la Universitat de les Illes Balears (EBP-UIB), d'acord amb les següents condicions:\n\nL'EBP-UIB té tres objectius fonamentals: proporcionar un servei d'atenció psicològica, contribuir a la investigació en psicopatologia i psicologia clínica, i ajudar en la formació pràctica dels alumnes de grau de Psicologia i del Màster en Psicologia General Sanitària. En el meu cas, sol·licit una consulta d'atenció psicològica i, per tant, em comprometo a facilitar la informació, completar les proves i realitzar les tasques que em siguin requerides, per tal que els responsables de l'EAB-UIB puguin atendre la meva consulta de la millor manera possible.\n\nSom plenament conscient que:\na. Totes les dades seran tractades amb respecte a la meva intimitat i en conformitat amb la normativa vigent en protecció de dades.\nb. Tinc el dret d'accés, rectificació, oposició, supressió, portabilitat i limitació del tractament sobre les meves dades, i puc exercir aquests drets mitjançant una sol·licitud en qualsevol moment.\nc. Les meves dades poden ser utilitzades en treballs de caire científic, però en aquests casos sempre es garantirà el seu anonimat, i en cap cas no seran cedides a tercers sense el meu consentiment.\nd. La psicologia no és una ciència exacta i el tractament psicològic no assegura la millora. Durant el transcurs de la intervenció, és possible que experimenti malestar i alteracions de l'estat d'ànim. La meva participació en el protocol d'intervenció és totalment voluntària, i tinc la llibertat de retirar-me en qualsevol moment.",
        consentAcceptLabel: "Don el meu consentiment",
        studentsPresence: "Accept que per motius formatius pugui haver-hi estudiants presents durant les sessions d'assessorament psicològic.",
        legalText: "En compliment del que disposa el Reglament (UE) 2016/679 (RGPD) i la Llei Orgànica 3/2018, de 5 de desembre (LOPDGDD), us informem que les dades recollides seran incloses en un o més fitxers gestionats per la UIB al registre d'activitat de tractament habilitat a aquest efecte, la finalitat del qual és gestionar la vostra sol·licitud. Les dades sol·licitades són necessàries per complir amb la finalitat esmentada i, per tant, el fet de no obtenir-les impedeix aconseguir-la. La UIB és la responsable del tractament de les dades i, com a tal, us garanteix els drets d'accés, rectificació, oposició, supressió, portabilitat, limitació del tractament, i a no ser objecte de decisions individuals automatitzades quant a les dades facilitades i tractades. Per exercir els drets indicats s’haurà de dirigir per escrit a: Universitat de les Illes Balears, Secretaria General, a l’atenció de la delegada de protecció de dades, Ctra. de Valldemossa, km 7,5, 07122 Palma (Illes Balears) o a l'adreça de correu electrònic dpo@uib.es. També disposa del dret a reclamar davant de l'Autoritat de control a: https://www.aepd.es. De la mateixa manera, la UIB es compromet a respectar la confidencialitat de les vostres dades i a utilitzar-les de conformitat amb la finalitat per la qual van ser recollides.",
        conformityTitle: "Com a prova de conformitat, accept el present consentiment.",
        yes: "Sí",
        no: "No",
        select: "Tria..."
    },
    progress: {
        programTitle: "El Teu Procés CAFFT",
        intro: "Benvinguda",
        assessment_pre: "Avaluació",
        exposure: "Entrenament",
        assessment_post: "Resultats",
        complete: "Èxit"
    },
    nav: {
        home: "Inici",
        fearOfFlying: "La Por de Volar",
        cafftProgram: "Programa",
        qpviiEvaluation: "Avaluació",
        exposure: "Exposició",
        login: "Iniciar\u00A0Sessió",
        register: "Registra't",
        profile: "Perfil",
        logout: "Tancar Sessió",
        privacyPolicy: "Política de Privacitat",
        cafftIntro: "Inici",
        forgotPasswordLink: "Has oblidat la contrasenya?",
        evolution: "Evolució",
        exposureHierarchy: "Jerarquia d'Exposició",
        exposureExplanation: "Explicació de l'Exposició", 
        lastSession: "Sessió Final", 
        therapistDashboard: "Panell del Terapeuta",
        managerDashboard: "Panell de Gestor",
        superadminDashboard: "Panell de Superadministrador",
        patients: "Pacients",
        therapists: "Terapeutes",
        managers: "Gestors",
        therapistNotifications: "Notificacions",
        scientificEvidence: "Evidència Científica",
        feedback: "Feedback",
        helpCenter: "Ajuda",
        help: "Ajuda",
        addUser: "Afegir Usuari",
        addTherapist: "Afegir Terapeuta",
        save: "Guardar",
        cancel: "Cancel·lar",
    },
    home: {
        title: ["Tractament Assistit", "per Ordinador de la", "Por de Volar", "(CAFFT)"],
        subtitle: "Un programa de tractament autoaplicat per a la por de volar, basat en tècniques d'exposició i recolzat per dècades d'investigació a la Universitat de les Illes Balears.",
        firstEdition: "Primera Edició: 1999",
        version: "Versió 5.1",
        startButton: "Començar el Programa",
    },
    fearOfFlying: {
        title: "Què és la Por de Volar?",
        introduction: "La por de volar, o aerofòbia, és una de les fòbies específiques més comunes. Afecta un percentatge significatiu de la població i pot limitar la vida personal i professional de les persones.",
        prevalence: {
            title: "Prevalença a la Població",
            text: "S'estima que entre un 20% i un 40% de la població adulta experimenta algun nivell d'ansietat en volar. D'aquests, aproximadament un 6.5% pateix una fòbia clínica que els impedeix volar o ho fan amb gran malestar.",
            chartData: [
                { nameKey: "phobia", value: 6.5 },
                { nameKey: "discomfort", value: 33.5 },
                { nameKey: "noDiscomfort", value: 60 },
            ],
            phobia: "Fòbia Clínica",
            discomfort: "Malestar/Ansietat",
            noDiscomfort: "Sense Malestar",
        },
        whoIsAffected: {
            title: "Qui la Pateix?",
            text: "La por de volar pot afectar qualsevol persona, independentment de l'edat, gènere o professió. Sovint comença a l'edat adulta, de vegades després d'una experiència de vol normal. Factors com l'estrès, la paternitat/maternitat o la cobertura mediàtica d'incidents aeris poden actuar com a desencadenants.",
        },
        whatIsIt: {
            title: "Com es Manifesta?",
            text1: "L'aerofòbia es manifesta a través de tres components interrelacionats:",
            physiological: "Respostes Fisiològiques",
            physiological_desc: "Taquicàrdia, sudoració, tremolors, dificultat per respirar, marejos. Són reaccions del sistema nerviós autònom davant la percepció d'una amenaça.",
            cognitive: "Pensaments Catastrofistes",
            cognitive_desc: "Idees negatives i irracionals sobre el vol, com la por a un accident, a perdre el control, a patir un atac de pànic o a estar tancat.",
            behavioral: "Conductes d'Evitació",
            behavioral_desc: "L'acció d'evitar volar o realitzar 'conductes de seguretat' (beure alcohol, prendre medicació sense prescripció, comprovar constantment la tripulació) per intentar reduir l'ansietat.",
        },
        origins: {}, // Kept for consistency, can be populated later
    },
    cafftProgram: {
        title: "El Programa CAFFT",
        introduction: "El CAFFT (Computer Assisted Fear of Flying Treatment) és un programa de tractament psicològic dissenyat per investigadors de la Universitat de les Illes Balears per ajudar les persones a superar la seva por de volar.",
        specificInfo: {
            title: "Informació Específica",
            whatIsCAFFT: "Què és CAFFT?",
            whatIsCAFFT_desc: "És una teràpia d'exposició gradual, assistida per ordinador, que utilitza vídeos per simular les diferents fases d'un vol. Aquesta exposició controlada permet a l'usuari habituar-se als estímuls que li provoquen ansietat en un entorn segur.",
            howItWorks: "Com funciona?",
            howItWorks_desc: "El programa comença amb una avaluació de la por (QPV-II) per crear una 'jerarquia d'exposició' personalitzada. L'usuari s'exposa als vídeos d'aquesta jerarquia, valorant el seu malestar. Repeteix cada pas fins que l'ansietat disminueix, un procés conegut com a habituació.",
            onlineInterview: "Abans de començar, és necessari realitzar una avaluació psicològica per confirmar la idoneïtat del programa.",
        },
        linkToScientificFoundation: "Veure Fonaments Científics",
    },
    userGuide: {
        title: "Guia de l'Usuari",
        introduction: "Aquesta guia proporciona informació important sobre los requisits, l'ús i els avantatges del programa CAFFT.",
        requirements: {
            title: "Requisits",
            items: [],
            computer: "Ordinador amb connexió a Internet i navegador web actualitzat.",
            headphones: "Auriculars per a una experiència d'àudio immersiva.",
            skills: "Habilitats informàtiques bàsiques.",
        },
        beforeUse: {
            title: "Abans d'utilitzar el CAFFT",
            adverseEffects: "El tractament pot provocar efectes adversos temporals, similars als símptomes d'ansietat.",
            mostFrequent: ["Ansietat", "Inquietud", "Tensió muscular", "Preocupació", "Irritabilitat"],
            mostSerious: ["Pot produir-se un atac de pànic, tot i que és poc freqüent."],
            doNotUseIf: [
                "Estàs rebent un altre tractament psicològic per a la por de volar.",
                "Pateixes un trastorn psicòtic, bipolar o un trastorn greu de la personalitat.",
                "Tens epilèpsia fotosensible.",
                "Tens idees suïcides.",
            ],
        },
        howToUse: {
            title: "Com Utilitzar el Programa",
            text: "Segueix els passos indicats a l'aplicació: comença amb la introducció, completa l'avaluació QPV-II amb honestedat, i després segueix la teva jerarquia d'exposició personalitzada. És crucial que et quedis a cada pas fins que la teva ansietat es redueixi significativament abans de passar al següent.",
        },
        advantages: {
            title: "Avantatges del CAFFT",
            items: [
                "Eficàcia demostrada en estudis científics.",
                "Accessibilitat des de qualsevol lloc amb Internet.",
                "Anonimat i privacitat.",
                "Control total de l'usuari sobre el ritme del tractament.",
                "Cost-efectivitat en comparació amb teràpies tradicionals.",
                "Disponibilitat 24/7.",
                "Reducció de barreres geogràfiques.",
                "Basat en tècniques cognitivoconductuals, el tractament d'elecció per a les fòbies.",
            ],
        }
    },
    helpVideos: {
        title: "Vídeos d'Ajuda i Preguntes Freqüents",
        pageTitle: "Vídeos d'Ajuda",
        videos: [
            { titleKey: "q1", link: "https://www.youtube.com/watch?v=A3eIDb9_2Vo" },
            { titleKey: "q2", link: "https://www.youtube.com/watch?v=28y1fW0_hyY" },
            { titleKey: "q3", link: "https://www.youtube.com/watch?v=7X3H4Ase2y8" },
            { titleKey: "q4", link: "https://www.youtube.com/watch?v=vV239mzG3sM" },
        ],
        q1: "Per què és important l'exposició pura sense relaxació?",
        q2: "Què són les turbulències i per què no són perilloses?",
        q3: "Com mantenir la implicació durant els vídeos?",
        q4: "Què passa si sento molta ansietat durant un vídeo?",
        noVideos: "Actualment no hi ha vídeos d'ajuda disponibles.",
    },
    cafftIntroPage: {
        title: "Introducció al Programa CAFFT",
        welcomeMessage: "Benvingut/da, {username}!",
        explanationText: "Estàs a punt de començar un programa dissenyat per ajudar-te a superar la por de volar. Abans de començar, et recomanem veure aquest breu vídeo que explica els fonaments del tractament. Després, procediràs a la teva primera avaluació.",
        videoTitle: "Vídeo Introductori de CAFFT",
        proceedButton: "Entès, anar a l'Avaluació",
    },
    qpvii: {
        title: "Avaluació QPV-II",
        formTitle: "Qüestionari de Por de Volar (QPV-II)",
        instructions: "A continuació, trobaràs una llista de situacions relacionades amb volar. Si us plau, puntua d'1 (gens) a 9 (moltíssim) el grau de por, ansietat o malestar que et provocaria cada situació. És important que responguis a totes les preguntes.",
        nameLabel: "Nom o identificador",
        dateLabel: "Data de l'avaluació",
        scoreLabel: "Puntuació",
        submitButton: "Calcular Resultats",
        calculatingButton: "Calculant...",
        resultsTitle: "Resultats de la teva Avaluació",
        generalDiscomfortScore: "Molt de por en general",
        subPreparatiusScore: "Preparatius del viatge",
        subVicariScore: "Notícies i accidents",
        subVolScore: "Durant el vol",
        totalScore: "Puntuació Total",
        allFieldsRequiredError: "Si us plau, omple tots els camps i respon a totes les preguntes.",
        personName: "Persona avaluada",
        evaluationDate: "Data de l'avaluació",
        backToFormButton: "Tornar al Qüestionari",
        loginToSavePrompt: "Per desar els teus resultats i progrés, necessites iniciar sessió o registrar-te.",
        fillRandomlyButton: "Omplir aleatòriament (per a proves)",
        viewHierarchyButton: "Veure la meva Jerarquia d'Exposició",
        questions: {
            q0: "Quin grau de malestar, en general, li produeix el fet de volar amb avió?",
            q1: "A meitat de vol tenc la sensació que l'avió redueix velocitat i després torna a accelerar.",
            q2: "Anuncien que en uns minuts aterrarem i que per tant ens hem de cordar els cinturons de seguretat.",
            q3: "Dins l'avió mentres aquest està guanyant altura.",
            q4: "Durant el vol sent un renou de l'avió que sembla estrany.",
            q5: "L'avió accelera i not com comença a enlairar-se.",
            q6: "L'avió travessa una zona de niguls espessos i es mou un poc més amb les ràfegues de vent.",
            q7: "L'avió descendeix gradualment i s'aproxima a la pista d'aterratge.",
            q8: "Quan m'aixec el dematí, el dia que he d'agafar l'avió, veig que hauré de volar amb mal temps.",
            q9: "A la terminal de l'aeroport em dirigesc a treure la tarja d'embarcament.",
            q10: "En ple vol es nota com si l'avió tengués una lleugera caiguda o “passàs per un clot”.",
            q11: "En un moment del vol l'avió es mou molt.",
            q12: "Som a casa fent els preparatius per al viatge amb avió.",
            q13: "Som a la sala d'arribades de l'aeroport a rebre-hi uns familiars o amics.",
            q14: "Em dirigesc amb cotxe cap a l'aeroport per agafar l'avió.",
            q15: "Som a ca meva o a la feina i en uns minuts sortiré cap a l'aeroport.",
            q16: "M'assabent pels mitjans de comunicació que un avió ha patit un petit accident sense víctimes a un aeroport de l'estat espanyol.",
            q17: "M'assabent que he de fer un vol a la península o a una altra de les illes (per als “no illencs”, enteneu un vol d'una hora de durada com a màxim).",
            q18: "M'he cordat el cinturó de seguretat, l'avió comença a agafar velocitat, rodant per la pista, i not com comença a aixecar-se el morro de l'aparell iniciant l'enlairament.",
            q19: "En la maniobra d'aterratge, not com les rodes de l'avió contacten amb la superfície de la pista.",
            q20: "Not la frenada de l'avió durant l'aterratge.",
            q21: "Sent per la ràdio o llegesc en els diaris que un avió ha patit un greu accident amb víctimes mortals.",
            q22: "Assegut a la sala d'embarcament esperant que obrin la porta per pujar a l'avió.",
            q23: "Assegut al meu seient amb l'avió aturat esperant per iniciar el vol, observ la demostració de les mesures de seguretat que fan les hostesses de la companyia aèria.",
            q24: "Puig l'escaleta d'accés a l'avió o vaig caminant pel passadís elevat que em duu a l'avió.",
            q25: "Tot sembla tranquil però en ple vol se'ns indica la necessitat de cordar-nos el cinturó de seguretat.",
            q26: "Veig per TV les imatges d'una catàstrofe aèria.",
            q27: "Quan me'n vaig a colgar la nit anterior al vol.",
            q28: "Vaig per la carretera i veig un avió que s'enlaira de l'aeroport.",
            q29: "Mirant una pel·lícula apareix una escena del vol d'un avió.",
            q30: "Durant l'aterratge, mentres l'avió va frenant damunt la pista, sent que el meu cos se desplaça cap a endavant.",
        }
    },
    auth: {
        registerTitle: "Crear un Compte",
        loginTitle: "Iniciar Sessió",
        usernameLabel: "Nom d'usuari",
        emailLabel: "Correu electrònic",
        passwordLabel: "Contrasenya",
        confirmPasswordLabel: "Confirmar contrasenya",
        currentPasswordLabel: "Contrasenya actual",
        newPasswordLabel: "Nova contrasenya",
        consentLabel: "He llegit i accepto la",
        consentLinkText: "Política de Privacitat",
        registerButton: "Registrar-se",
        loginButton: "Iniciar Sessió",
        logoutButton: "Tancar Sessió",
        alreadyHaveAccount: "Ja tens un compte?",
        dontHaveAccount: "No tens un compte?",
        registrationSuccess: "Registre completat! Ara pots iniciar sessió.",
        loginSuccess: "Sessió iniciada amb èxit!",
        logoutSuccess: "Sessió tancada correctament.",
        fillAllFieldsError: "Si us plau, omple tots els camps.",
        passwordsDontMatchError: "Les contrasenyes no coincideixen.",
        registrationFailedError: "El registre ha fallat. Si us plau, torna a intentar-ho.",
        loginFailedError: "L'inici de sessió ha fallat. Comprova les teves dades.",
        usernameTakenError: "Aquest nom d'usuari ja existeix.",
        emailTakenError: "Aquest correu electrònic ja està registrat.",
        invalidCredentialsError: "Nom d'usuari o contrasenya incorrectes.",
        consentRequiredError: "Has d'acceptar la política de privacitat.",
        loading: "Carregant...",
        forgotPasswordTitle: "Recuperar Contrasenya",
        forgotPasswordInstructions: "Introdueix el teu correu electrònic i t'enviarem un enllaç per restablir la teva contrasenya.",
        sendResetLinkButton: "Enviar Enllaç",
        resetLinkSentSuccess: "Si l'adreça existeix, rebràs un correu en breu.",
        resetLinkSentError: "No s'ha pogut enviar el correu. Torna-ho a provar.",
        resetPasswordTitle: "Restablir Contrasenya",
        resetPasswordInstructions: "Introdueix la teva nova contrasenya.",
        resetPasswordButton: "Restablir Contrasenya",
        passwordResetSuccess: "Contrasenya actualitzada! Ara pots iniciar sessió.",
        passwordResetError: "No s'ha pogut restablir la contrasenya.",
        invalidOrExpiredTokenError: "L'enllaç no és vàlid o ha caducat.",
        changePasswordTitle: "Canviar Contrasenya",
        changePasswordButton: "Canviar Contrasenya",
        changePasswordSuccess: "Contrasenya canviada amb èxit.",
        changePasswordError: "La contrasenya actual és incorrecta.",
        passwordMinLengthError: "La contrasenya ha de tenir almenys 6 caràcters.",
    },
    privacyPolicy: {
        title: "Política de Privacitat",
        lastUpdated: "Última actualització: {date}",
        introduction: "Aquesta política de privacitat descriu com es recullen, utilitzen i protegeixen les teves dades personals quan utilitzes l'aplicació CAFFT.",
        dataCollectedHeader: "Dades que Recopilem",
        dataCollectedText: "Recopilem la informació que ens proporciones directament:",
        username: "Nom d'usuari: per identificar-te a l'aplicació.",
        emailAddress: "Adreça de correu electrònic: per a la recuperació de contrasenya i comunicacions.",
        hashedPassword: "Contrasenya xifrada: mai emmagatzemem la teva contrasenya en text pla.",
        qpviiResults: "Resultats del QPV-II i progrés d'exposició: per personalitzar el teu tractament i seguir la teva evolució.",
        consentStatus: "Estat del consentiment: per confirmar que has acceptat aquesta política.",
        howDataUsedHeader: "Com Utilitzem les teves Dades",
        howDataUsedText: "Utilitzem les teves dades exclusivament per:",
        accountManagement: "Gestionar el teu compte i el progrés dins del programa.",
        howDataUsedItem1: "Proporcionar-te una experiència de tractament personalitzada.",
        howDataUsedItem2: "Permetre't seguir la teva evolució al llarg del temps.",
        dataStorageHeader: "Emmagatzematge de Dades",
        dataStorageText: "Totes les dades es guarden localment al teu navegador mitjançant l'API de Web Storage. No s'envien a cap servidor extern.",
        userRightsHeader: "Els Teus Drets",
        userRightsText: "Pots esborrar totes les teves dades en qualsevol moment netejant les dades del lloc web al teu navegador.",
        userRightsGDPR: "D'acord amb el GDPR, tens dret a accedir, rectificar, esborrar i limitar el processament de les teves dades.",
        securityHeader: "Seguretat",
        securityText: "La teva contrasenya s'emmagatzema utilitzant un algorisme de hash segur (SHA-256).",
        contactHeader: "Contacte",
        contactText: "Si tens alguna pregunta sobre aquesta política de privacitat, contacta amb nosaltres a través del correu de l'Espai de Benestar Psicològic.",
        demoDisclaimer: "Aquesta és una aplicació de demostració i recerca. Tota la informació proporcionada es basa en contingut científic i clínic.",
    },
    profile: {
        title: "El Meu Perfil",
        welcome: "Benvingut/da, {username}!",
        qpviiHistoryTitle: "Historial d'Avaluacions QPV-II",
        evaluationOn: "Avaluació del {date}",
        totalScore: "Puntuació Total: {score}",
        changePasswordSectionTitle: "Canviar la Contrasenya",
        noHistory: "Encara no has completat cap avaluació.",
        notificationsSectionTitle: "Notificacions Push",
        notificationsDescription: "Configura com i quan vols rebre recordatoris sobre el teu procés terapèutic.",
        enableNotifications: "Activar notificacions al dispositiu",
        notificationTypes: {
            reminders: "Recordatoris d'activitat",
            newTasks: "Avisos de noves tasques",
            followUp: "Seguiment de l'evolució",
            general: "Missatges informatius",
        },
        frequency: {
            title: "Freqüència de les notificacions",
            daily: "Diària",
            weekly: "Setmanal",
        },
        timeRange: "Franja horària permesa",
        savePreferences: "Guardar preferències",
        consentWithdrawn: "Has retirat el consentiment per a les notificacions.",
        consentGiven: "Has donat el teu consentiment per rebre notificacions.",
        withdrawConsent: "Retirar consentiment",
        notificationConsentPrompt: "Vols rebre notificacions?",
        notificationConsentExplain: "Vols rebre recordatoris i avisos relacionats amb el teu procés terapèutic? Pots canviar aquesta preferència en qualsevol moment.",
        acceptButton: "Acceptar",
        declineButton: "Rebutjar",
    },
    exposureHierarchy: {
        pageTitle: "La Meva Jerarquia d'Exposició",
        introText: "Aquesta és la teva seqüència personalitzada d'exposició, basada en els teus resultats del QPV-II. Començaràs per la situació menys ansiògena i avançaràs gradualment. Pots començar el tractament quan estiguis a punt.",
        hierarchyLogicTitle: "Com s'ha calculat?",
        hierarchyLogicText: "L'ordre es determina calculant la mitjana d'ansietat de cada grup de situacions (Preparatius, Vol, Notícies) segons les teves respostes. S'ordenen de menor a major malestar per garantir una progressió segura.",
        videoSequenceTitle: "Seqüència de Vídeos",
        startExposureButton: "Començar Exposició",
        exitButton: "Tornar a l'Avaluació",
        videoItemTitle: "{index}. {title}",
        noVideosInSequence: "No s'ha pogut generar una seqüència de vídeos. Si us plau, torna a fer l'avaluació.",
    },
    exposure: {
        pageTitle: "Sessió d'Exposició",
        startExposureButton: "Començar Exposició",
        videoProgress: "Vídeo {current} de {total}",
        exposureComplete: "Seqüència d'exposició completada!",
        restartExposureButton: "Tornar a començar la seqüència",
        videoNotAvailable: "El vídeo no s'ha pogut carregar. Comprova la teva connexió o contacta amb el suport.",
        videoTagNotSupported: "El teu navegador no suporta l'etiqueta de vídeo.",
        downloadVideo: "Descarregar Vídeo",
        ev001_title: "Preparatius del Viatge",
        ev001_desc: "Simula els moments previs al viatge, com fer la maleta i planificar el trajecte a l'aeroport.",
        ev002_title: "Embarcament",
        ev002_desc: "Recorre l'entrada de l'aeroport, passa el control de seguretat i puja a l'avió.",
        ev003_title: "Enlairament",
        ev003_desc: "Experimenta la seqüència completa d'enlairament des de dins de l'avió.",
        ev004_title: "Durant el Vol",
        ev004_desc: "Observa l'exterior des de la finestra durant un vol tranquil.",
        ev005_title: "Aterratge",
        ev005_desc: "Viu la maniobra d'aproximació i aterratge des del teu seient.",
        ev006_title: "Notícies sobre Accidents",
        ev006_desc: "Afronta l'ansietat vicària escoltant o veient notícies sobre incidents aeris.",
        ev007_title: "Turbulències Fortes",
        ev007_desc: "Experimenta la sensació de turbulències fortes dins de l'avió en un entorn segur.",
        ev008_title: "Notícies d'Accidents (II)",
        ev008_desc: "Escenes addicionals sobre incidents aeris per aprofundir en l'habituació vicària.",
        discomfortRatingModalTitle: "Valora el teu Malestar",
        discomfortRatingInstruction: "En una escala d'1 a 10, quin ha estat el teu nivell màxim de por o malestar durant el vídeo '{videoTitle}'?",
        discomfortRatingSaveButton: "Guardar Valoració",
        discomfortRatingErrorNoSelection: "Si us plau, selecciona una valoració.",
        discomfortRatingMinLabel: "Gens de malestar",
        discomfortRatingMaxLabel: "Malestar extrem",
        progressionMessageSuccess: "Ben fet! Has reduït el teu malestar. Preparat/da per al següent pas.",
        progressionMessageLastVideoSuccess: "Excel·lent! Has completat l'últim vídeo de la teva jerarquia.",
        progressionMessageRetry: "Encara sents un malestar elevat ({current}). És normal. Per superar la por, necessitem que el teu aprenentatge s'estabilitzi mitjançant l'habituació: això s'aconsegueix repetint el vídeo sense evitar les sensacions d'ansietat fins que aquestes disminueixin de forma natural. Per això, et recomanem tornar a veure aquest mateix vídeo fins que el malestar baixi almenys a la meitat de la teva màxima puntuació ({max} -> {target}). L'objectiu ideal és arribar a un nivell de 2 o inferior per assegurar que l'aprenentatge és sòlid. Recorda implicar-te i no utilitzar tècniques de distracció.",
        finishExposureSessionButton: "Finalitzar Sessió d'Exposició",
        reviewSessionTitle: "Sessió de Repàs",
        finishReviewButton: "Finalitzar Repàs",
        logoutButton: "Sortir i guardar el progrés",
        logoutWarning: "La teva darrera valoració de malestar ha estat alta ({current}). Perquè la teràpia sigui efectiva i el teu cervell s'habituï, és crucial no interrompre l'exposició quan l'ansietat és elevada. Et recomanem continuar fins que el malestar disminueixi almenys a la meitat de la puntuació màxima (baixar de {max} a {target} o menys). L'objectiu òptim d'habituació és arribar a un nivell de 2. Vols sortir igualment?",
        continueExposure: "Continuar Exposició",
        videoLoadErrorTitle: "Error de Càrrega del Vídeo",
        videoLoadErrorBody: "No s'ha pogut carregar el vídeo. La causa més probable és que el fitxer no es troba a la ubicació esperada (public/videos_cafft/).",
        videoLoadErrorChecklist: "Si us plau, comprova que l'arxiu de vídeo existeix i que el format és compatible.",
        testWithDemoVideoButton: "Provar amb Vídeo Demo",
        simulateViewingButton: "Simular Visualització",
        sessionProgressTitle: "Progrés de la Sessió",
        videosCompleted: "Completats",
        ratingHistory: "Historial de Malestar",
        preparation: "Preparació",
        boarding: "Embarcament",
        takeoff: "Enlairament",
        inflight: "En Vol",
        landing: "Aterratge",
        accidents: "Accidents",
        psychoed: "Psicoeducació",
    },
    scientificFoundation: {
        title: "Fonaments Científics del CAFFT",
        introduction: "El programa CAFFT no és una solució arbitrària; està basat en dècades d'investigació en psicologia clínica i psicopatologia. La seva eficàcia s'ha validat mitjançant estudis rigorosos publicats en revistes científiques internacionals. A continuació, es presenten algunes de les publicacions clau que sustenten aquest tractament.",
        referencesTitle: "Publicacions de Referència",
    },
    evolution: {
        pageTitle: "La Meva Evolució",
        qpviiEvolutionChartTitle: "Evolució de les Puntuacions QPV-II",
        totalScoreEvolution: "Puntuació Total",
        malestarGeneralEvolution: "Malestar General",
        subPreparatiusEvolution: "Preparatius",
        subVicariEvolution: "Vicari",
        subVolEvolution: "Vol",
        noHistoryForChart: "Necessites almenys {count} avaluacions per veure la teva evolució.",
        preTreatment: "Pre-Tractament",
        postTreatment: "Post-Tractament",
        exposureTitle: "Historial d'Exposició",
        habituationExplanationTitle: "Què és l'Habituació?",
        habituationExplanationText: "L'habituació és un procés d'aprenentatge en què la teva resposta emocional (què sents, penses i fas) a un estímul (com un dels vídeos del programa) disminueix després d'una exposició repetida. En veure els vídeos diverses vegades, aprens que no hi ha una amenaça real, i la teva ansietat es redueix progressivament. Aquests gràfics mostren com el teu malestar baixa amb cada repetició.",
        noExposureData: "Encara no has realitzat cap sessió d'exposició.",
        intraSessionEvolution: "Evolució Intra-Sessió",
        sessionDate: "Sessió del {date}",
        videoAttemptsLabel: "Intents de Vídeo",
        videoCompleted: "Completat",
        videoNotCompleted: "No Completat",
        noDiscomfortRatingsRecorded: "No s'han registrat valoracions de malestar per a aquesta sessió.",
        sceneHabituationChartTitle: "Habituació: {sceneName}",
        scene_psychoed: "Psicoeducació",
        scene_preparation: "Preparació",
        scene_boarding: "Embarcament i Rodatge",
        scene_takeoff: "Enlairament",
        scene_inflight: "Vol",
        scene_landing: "Aterratge",
        scene_accidents: "Vicari (Accidents)",
        sceneExposureInstanceAxisLabel: "Intent",
        watchedVideoTooltipLabel: "Vídeo vist",
        finishProgramButton: "Finalitzar Programa",
        reviewScenesButton: "Repassar Escenes",
        reviewSessionLabel: "Repàs",
        finishSessionButton: "Finalitzar Sessió",
        sessionCompleteTitle: "Sessió Completada!",
        sessionCompleteText: "Has acabat amb èxit tots els vídeos de la teva jerarquia. Pots fer una avaluació final o repassar alguna escena.",
        reEvaluateButton: "Fer l'Avaluació Final",
        sessionPausedTitle: "Sessió Pausada",
        sessionPausedText: "Pots reprendre la teva sessió d'exposició quan vulguis.",
        resumeSessionButton: "Reprendre Sessió",
        logoutButton: "Sortir",
        goToHomeButton: "Tornar a l'Inici",
        rciTitle: "Indicador de Canvi Clínic (RCI)",
        rciExplanation: "L'Indicador de Canvi Fiable mostra si la teva millora és realment significativa des del punt de vista terapèutic.",
        rciMathInfo: "Càlcul basat en QPV-II: {pre} (pre) vs {post} (post)",
        rciStatusSignificant: "Canvi Significatiu Detectat",
        rciStatusNotSignificant: "Canvi en curs",
        rciLabel: "Resultat del Tractament",
        ratingAxisLabel: "Ansietat (0-10)",
        scoreAxisLabel: "Puntuació QPV-II",
        programCompleteSuccessMessage: "Has completat una fita important. Pots veure la teva evolució i després celebrar la finalització, repassar algunes escenes o finalitzar la sessió.",
        prePostComparisonTitle: "Comparativa Pre vs Post Tractament",
        differenceLabel: "Diferència",
        rciMissingDataMessage: "Es requereixen almenys dues avaluacions QPV-II (pre i post) per calcular l'Índex de Canvi Fiable (RCI).",
        globalEvolutionTitle: "Resum del Teu Progrés Terapèutic",
        totalSessions: "Sessions Totals",
        totalVideos: "Total Vídeos",
        globalHabituation: "Grau d'Habituació General",
        habituationStrength: "Força de l'Habituació",
        habituationStrengthExplanation: "Aquest valor indica l'efectivitat del teu aprenentatge: com més alt és, més ràpid i profundament estàs processant la por i reduint l'ansietat.",
        globalSceneTrendTitle: "Evolució de l'Ansietat per Escena",
        globalTrendExplanation: "Aquesta gràfica mostra com evoluciona la mitjana d'ansietat en cada escena a través de totes les sessions.",
        habituationProgressTitle: "Progrés de l'Habituació",
        habituationProgressExplanation: "Mostra la reducció del malestar (diferència entre l'inici i el final) aconseguida en cada sessió.",
        discomfortReduction: "Reducció del Malestar",
        averageDiscomfort: "Malestar Mitjà",
        habituationSlope: "Velocitat de millora",
        videosWatched: "Vídeos Vistos",
        sessionDetails: "Detalls de la Sessió",
        slopeImproving: "Millorant",
        slopeStable: "Estable",
        slopeWorsening: "Empitjorant",
        sceneHabitutationSummaryTitle: "Resum d'Habituació per Escena",
        detailedHabitutationTitle: "Evolució Detallada per Escena",
        sceneHabitutationSummaryExplanation: "Aquesta visualització agrupa totes les dades de malestar de cada escena per veure la teva habituació global a situacions específiques.",
        needMoreDataTitle: "Encara estem recollint dades",
        needMoreDataDesc: "Per mostrar estadístiques de progrés significatives i gràfiques de tendència, necessites completar almenys {count} sessions d'exposició amb valoracions de malestar.",
        habituation: "Habituació",
        habituationStatus: "Estat de l'Habituació",
        habituationProgress: "Progrés de l'Habituació",
        feedbackImproving: "T'estàs habituant, el malestar s'està reduint.",
        feedbackStable: "Vas bé, però cal practicar més. Continua exposant-te.",
        feedbackWorsening: "És important que ara no ho deixis. En cas de no millorar parla amb el teu terapeuta.",
    },
    onboarding: {
        stepCounter: "Pas {current} de {total}",
        startManual: "Fer el Recorregut",
        next: "Següent",
        prev: "Anterior",
        finish: "Finalitzar",
        step1: {
            title: "Benvingut al CAFFT",
            content: "Aquí comença el teu procés de superació. Des d'aquesta pàgina d'inici podràs accedir a la informació clau sobre el programa."
        },
        step2: {
            title: "Avaluació QPV-II",
            content: "El primer pas és conèixer el teu punt de partida. L'avaluació QPV-II ens ajuda a personalitzar el teu tractament."
        },
        step3: {
            title: "Jerarquia d'Exposició",
            content: "Aquí accediràs als vídeos d'exposició gradual. Afrontaràs escenes des de la preparació fins al vol real."
        },
        step4: {
            title: "La Teva Evolució",
            content: "Fes un seguiment visual del teu progrés. Aquí veuràs com redueixes l'ansietat sessió rere sessió."
        },
        step5: {
            title: "Centre d'Ajuda",
            content: "Aquí trobaràs tota la documentació i vídeos de suport per resoldre els teus dubtes sobre el programa."
        },
        step6: {
            title: "Assistent Virtual",
            content: "Sempre que tinguis dubtes, pots consultar el nostre assistent IA al botó de la cantonada inferior dreta."
        },
        therapist: {
            step1: { title: "Dashboard", content: "Aquí tens una visió general del progrés de tots els teus pacients de un cop d'ull." },
            step2: { title: "Gestió de Pacients", content: "Pots afegir nous pacients o gestionar les seves dades des d'aquí." },
            step3: { title: "Activitat Recent", content: "Monitoritza les últimes sessions realitzades pels teus pacients." },
            step4: { title: "Navegació", content: "Utilitza el menú lateral per accedir a la llista completa de pacients i les seves notificacions." },
            step5: { title: "Centre d'Ajuda", content: "Troba documentació clínica i guies d'usuari per resoldre dubtes ràpidament." },
            step6: { title: "Suport IA", content: "Tens l'assistent IA a mà per analitzar casos complexos o mètriques clíniques." }
        }
    },
    review: {
        pageTitle: "Selecció de Repàs",
        intro: "Selecciona les escenes que t'agradaria repassar. Això iniciarà una sessió d'exposició només amb els vídeos relacionats amb les teves seleccions.",
        startReview: "Començar Repàs",
        noSelectionError: "Has de seleccionar almenys una escena per repassar.",
    },
    helpModal: {
        modalTitle: "Centre d'Ajuda",
        tocTitle: "Continguts",
        searchPlaceholder: "Què necessites saber?",
        closeButton: "Tancar",
        disclaimer: "Orientacions. No substitueixen el criteri del teu terapeuta.",
        needMoreHelp: "Encara tens dubtes?",
        noResultsTitle: "Sense resultats",
        noResultsText: "Prova altres paraules o explora el menú lateral.",
        heroSubtitle: "Tot el que necessites saber sobre el programa CAFFT i com superar la teva por de volar de forma definitiva.",
        fullManualTitle: "Manual Clínic Complet",
        fullManualSubtitle: "Consulta o descàrrega el manual oficial en format Markdown.",
        fullManualMd: `
# Manual Clínic i Prospecte CAFFT 5.1
**Tractament Assistit per Ordinador de la Por de Volar (CAFFT)**
*Universitat de les Illes Balears (UIB)*

---

## 1. Introducció a la Por de Volar (Aerofòbia)

### 1.1 Prevalença i Impacte
La por de volar afecta aproximadament al **13% de la població adulta** en forma de fòbia clínica. Un **40%** addicional experimenta malestar significatiu. No és una malaltia, sinó una resposta de por apresa.

### 1.2 Els Tres Components de la Por
1.  **Component Fisiològic:** Taquicàrdia, sudoració, tremolors, hiperventilació.
2.  **Component Cognitiu:** Pensaments catastrofistes (*"l'avió caurà"*) i anticipació de la por.
3.  **Component Conductual:** Principalment l'**evitació**. No volar manté el problema.

---

## 2. El Programa CAFFT

### 2.1 Exposició Gradual i Habituació
El tractament es basa en l'**Exposició Pura**. Utilitzem vídeos realistes que simulen les fases del vol. El sistema crea una **jerarquia personalitzada**. L'objectiu és l'**Habituació**.

---

## 3. Guia de l'Usuari (Prospecte)

### 3.1 Condicions d'Ús
- **Lloc:** Tranquil, llum tènue.
- **Auriculars:** **ÚS OBLIGATORI**.
- **Volum:** Ajustar-lo a un nivell real.

### 3.2 Implicació Activa (Sense Muletes)
- **Honestedat:** Valori el seu malestar de forma sincera (0-10).
- **Prohibit:** No utilitzi tècniques de relaxació o distracció durant els vídeos. Actuen com a "muletes" que impedeixen l'aprenentatge real.

---

## 4. Instruccions per al Vol Real

- **Medicació:** NO prengui tranquil·litzants.
- **Alcohol:** NO consumeixi alcohol.
- **Nervis:** Accepta els nervis com a part de l'aprenentatge.
        `,
        fearOfFlying: {
            title: "1. Introducció a la Por de Volar",
            prevalence: {
                title: "A quanta gent afecta aquest problema?",
                textManual: "La por de volar és un problema molt més freqüent del que vostè segurament pensa. Es calcula que afecta prop d’un **13% del conjunt de la població adulta**. A més, moltes altres persones (prop d’un **40%**) experimenten un cert malestar quan han de volar, i només un **47%** de la població vola amb total tranquil·litat."
            },
            whoIsAffected: {
                title: "A quin tipus de persones afecta?",
                textManual: "Tothom pot tenir por de volar. Tenir por de volar no és cap malaltia, ni un símptoma de cap desequilibri personal o de ser un covard. No hi ha un perfil determinat de persones que tinguin més risc que altres, encara que pot afectar un poc més a dones i a persones que en general són nervioses o preocupadisses."
            },
            whatIsIt: {
                title: "En què consisteix la por de volar?",
                introManual: "L'aerofòbia no és un sentiment únic, sinó que es manifesta en tres components que s'alimenten entre ells:",
                physiological: {
                    title: "Component fisiològic: Les sensacions del cos",
                    textManual: "Aparició de sensacions físiques desagradables com que el **cor vagi molt ràpid (taquicàrdia)**, suor, tremolors, respiració ràpida (hiperventilació), nàusees o dolor de panxa. Com més por faci la situació, més intenses i nombroses seran aquestes sensacions."
                },
                cognitive: {
                    title: "Component cognitiu: El que pensem",
                    textManual: "Pensaments negatius i catastrofistes: *'l'avió podria caure'*, *'no podré sortir d'aquí'*, *'tindré un atac de cor i ningú em podrà ajudar'*, *'els altres es riuran de mi'*. També inclou l'**anticipació**: començar a patir dies abans del vol o simplement en fer la maleta."
                },
                behavioral: {
                    title: "Component conductual: El que fem",
                    textManual: "Principalment l'**evitació**: tractar de no anar amb avió, cancel·lar viatges, buscar excuses o utilitzar 'muletes' (alcohol, pastilles). També inclou evitar estímuls relacionats com veure pel·lícules d'avions o anar a l'aeroport."
                },
            },
            howItStarts: {
                title: "Com comença el problema?",
                textManual: "Pot tenir orígens diversos: haver viscut un vol amb fortes turbulències, rebre notícies d'accidents de forma repetida, veure familiars que pateixen volant o haver experimentat un atac de pànic o molèsties físiques intenses durant un vol previ."
            },
            howItIsMaintained: {
                title: "Com es manté el problema?",
                textManual: "El factor més important que manté la por és **l'evitació**. Quan evitem volar, sentim un alleujament immediat, i això 'educa' el nostre aprenentatge a creure que fugir és l'única manera d'estar segurs. Així, mai donem l'oportunitat a l'organisme per aprendre que l'avió és segur."
            },
            howToSolve: {
                title: "Com solucionar el problema?",
                textManual: "L'objectiu és l'**aprenentatge d'extinció**: rompre l'associació entre volar i l'ansietat. Això s'aconsegueix mitjançant l'**exposició gradual**: afrontar les situacions temudes poc a poc, sense fugir-ne, fins que el cos s'habitua i l'ansietat desapareix."
            }
        },
        cafftInfo: {
            title: "2. El Programa CAFFT",
            howItWorks: {
                title: "Com funciona?",
                textManual: "L'exposició a les situacions temudes serà gradual. El sistema confecciona una **jerarquia individualitzada** basada en el seu qüestionari QPV-II. Cada seqüència es presenta tantes vegades com sigui necessari fins que l'ansietat disminueixi significativament."
            },
            duration: {
                title: "Quant dura?",
                textManual: "La durada varia segons la persona. Es recomanen de **4 a 8 sessions** d'una hora. Amb 2 o 3 sessions setmanals es pot superar el problema en unes poques setmanes."
            },
            efficacy: {
                title: "És eficaç?",
                textManual: "Més del **70% de les persones tractades** aconsegueixen volar sense problemes. La investigació demostra que l'exposició és la millor manera de superar les fòbies."
            },
            conditions: {
                title: "Condicions Ambientals",
                item1Manual: "Seu còmodament en un lloc tranquil.",
                item2Manual: "Llum tènue i sense interrupcions.",
                item3Manual: "**Ús obligatori d'auriculars** (preferiblement que tapin tota l'orella).",
                item4Manual: "Ajusta el volum perquè el so sigui real i potent.",
            },
            involvement: {
                title: "Implicació de l'usuari",
                textManual: "Vostè ha de jugar un paper actiu. Intenti sentir-se com si l'estigués VIVINT (implicació).",
                list1: "Màxima concentració: No separi la vista de la pantalla.",
                list2: "No vulgui córrer: Indiqui honestament el grau de malestar.",
                list3: "No s'aturi: No finalitzi una sessió fins que l'ansietat hagi baixat almenys a la meitat.",
            },
            tasksBetweenSessions: {
                title: "Tasques entre sessions",
                textManual: "És necessari completar l'exposició amb situacions reals: anar a l'aeroport, mirar avions o llegir notícies sense evitar-les. Això normalitza les sensacions fora del programa informàtic."
            }
        },
        prospectus: {
            title: "3. Guia de l'Exposició (Prospecte)",
            indications: {
                title: "Indicacions",
                textManual: "Indicat per a adults amb fòbia específica tipus situacions (viatjar amb avió) o por de volar sense arribar a criteris de fòbia."
            },
            adverseEffects: {
                title: "Possibles efectes adversos",
                textManual: "Es pot experimentar ansietat durant l'exposició, cansament físic o psicològic, i dificultat per agafar el son. Aquests efectes són normals i formen part del procés d'habituació."
            },
            advantages: {
                title: "Avantatges d'utilitzar el CAFFT",
                list: [
                    "No haver d'esperar per al tractament.",
                    "Confidencialitat total.",
                    "Accessibilitat les 24h.",
                    "Seguiment dels seus propis avenços.",
                    "Supervisió professional a distància."
                ]
            }
        },
        postTreatmentSection: {
            title: "4. Instruccions per al Vol Real",
            introManual: "Un cop finalitzat el programa, es recomana realitzar un vol en un termini de 10 a 15 dies.",
            instructionItem1Manual: "NO prenguis tranquil·litzants ni abans ni durant el vol.",
            instructionItem2Manual: "NO ingereixis begudes alcohòliques.",
            instructionItem3Manual: "Seu allà on et toqui per atzar.",
            instructionItem4Manual: "Evita parlar de la por de volar els dies previs.",
            instructionItem5Manual: "Utilitza distractors naturals si vols (llegir, música), però no per fugir de l'ansietat.",
            instructionItem6Manual: "Accepta els nervis com a part de l'aprenentatge.",
            nervousnessAdviceManual: "Si et poses nerviós, pensa que és una oportunitat per aplicar l'habituació que has practicat amb el CAFFT.",
        },
        technicalSection: {
            title: "5. Informació Tècnica i Contraindicacions",
            requirements: {
                title: "Requisits",
                list: ["Ordinador amb connexió a Internet.", "Auriculars de qualitat.", "Navegador actualitzat."],
                text: "Necessites un ordinador amb connexió a Internet i auriculars que filtrin l'aire exterior per a una millor immersió."
            },
            contraindications: {
                title: "Contraindicacions",
                text: "No realitzis el CAFFT sense consultar un metge si:",
                list: ["Pateixes una malaltia cardíaca crònica.", "Estàs en tractament psiquiàtric o prenent psicofàrmacs.", "Estàs embarassada."]
            }
        },
        aiChatSection: {
            title: "Assistent Virtual IA",
        },
        therapistAiChatSection: {
            title: "Assistent Clínic IA",
        },
        therapistInfo: {
            title: "Informació Científica i Guia Clínica",
            evidenceTitle: "Fonamentació Científica i Evidència",
            evidenceText: "El CAFFT (**Computer-Assisted Fear of Flying Treatment**) és un programa d'exposició simulat que recrea situacions de vol mitjançant imatges i sons reals. Múltiples assajos controlats aleatoris (**Bornas et al., 2001, 2002, 2006; Tortella-Feliu et al., 2011; Botella-Arbona et al., 2004**) han demostrat:\n\n- **Eficàcia:** Reducció significativament major de la por de volar comparat amb llista d'espera.\n- **Equivalència:** Tan eficaç com la Realitat Virtual (**VRET**) i intervencions multicomponent més llargues.\n- **Manteniment:** Els èxits es mantenen en seguiments de **6 mesos i 1 any**.\n- **Taxa d'èxit:** Entre el **80% i el 90%** dels pacients milloren o es recuperen clínicament.",
            mechanismTitle: "Mecanismes de Funcionament",
            mechanismText: "El tractament divideix el viatge en etapes cronològiques (preparació, aeroport, enlairament, vol, aterratge) i afegeix una etapa sobre accidents per reduir l'ansietat catastròfica. El programa genera una jerarquia personalitzada basada en el **QPV-II**. **L'extinció** de la resposta de por s'aconsegueix mitjançant l'**habituació** per exposició repetida.",
            metricsTitle: "Interpretació de Mètriques",
            rciExplanation: "L'Índex de Canvi Fiable (**RCI**) indica si el canvi en el QPV-II entre pre i post és clínicament significatiu (**> 1.96**).",
            slopeExplanation: "El pendent d'habituació (**slope**) indica la velocitat d'habituació; un pendent negatiu pronunciat és senyal d'un procés d'extinció actiu.",
            applicationTitle: "Guia d'Aplicació Clínica",
            applicationText: "El terapeuta pot supervisar les sessions o permetre l'autoaplicació. És **CRUCIAL** que el pacient es mantingui '**implicat emocionalment**' (vivint la situació com a real).\n\n- **No relaxació:** Les tècniques de relaxació **NO** s'han d'usar durant l'exposició, ja que inhibeixen l'aprenentatge d'habituació.\n- **Criteri d'èxit:** Repetir cada seqüència fins que l'ansietat baixi a nivells baixos (**1-2** en una escala de 1 a 9).\n- **Vol de graduació:** Es recomana un vol real en els **15 dies** posteriors al tractament per consolidar l'aprenentatge.",
            faqTitle: "Resolució de Dubtes (FAQs)",
            faqText: "- **Funciona per a persones que eviten totalment?** Sí, els ajuda a habituar-se abans del vol real.\n- **És millor la Realitat Virtual?** L'evidència indica que el CAFFT és igual d'eficaç i molt més assequible i portable.\n- **Se'n pot fer un ús autònom?** Sí, versions **autoaplicades** han mostrat resultats similars quan hi ha un seguiment mínim per part del terapeuta.",
        }

    },
    postTreatment: {
        instructionsTitle: "4. Instruccions per al Vol Real",
        introManual: "Un cop finalitzat el programa, es recomana realitzar un vol en un termini de 10 a 15 dies.",
        instructionItem1Manual: "NO prenguis tranquil·litzants ni abans ni durant el vol.",
        instructionItem2Manual: "NO ingereixis begudes alcohòliques.",
        instructionItem3Manual: "Seu allà on et toqui per atzar.",
        instructionItem4Manual: "Evita parlar de la por de volar els dies previs.",
        instructionItem5Manual: "Utilitza distractors naturals si vols (llegir, música), però no per fugir de l'ansietat.",
        instructionItem6Manual: "Accepta els nervis com a part de l'aprenentatge.",
        nervousnessAdviceManual: "Si et poses nerviós, pensa que és una oportunitat per aplicar l'habituació que has practicat amb el CAFFT.",
        sessionTitle: "Pautes per al proper vol",
        introQuestion: "Què has de fer quan hagis de volar de veritat?",
        instructionItem1: "Arriba a l'aeroport amb temps suficient.",
        instructionItem2: "No evitis mirar els avions o la pista.",
        instructionItem3: "Recorda que l'ansietat és incòmoda però no perillosa: deixa que pugi i baixi sola.",
        instructionItem4: "No utilitzi tècniques de relaxació o respiració; actuen com a 'recursos de seguretat' que impedeixen l'habituació real.",
        instructionItem5: "No prengui alcohol ni fàrmacs per evitar l'ansietat, ja que inhibeixen l'aprenentatge de seguretat.",
        instructionItem6: "Mantingui l'atenció en el vol (implicació emocional) en lloc de distreure's.",
        instructionItem7: "Confia en la seguretat de l'avió.",
        instructionItem8: "Felicita't per cada pas que facis.",
        nervousnessAdvice: "És normal sentir una mica de nervis. No interpretis aquests nervis com un senyal de perill.",
    },
    exposureExplanation: {
        pageTitle: "Explicació de l'Exposició",
        introParagraph1: "Abans de començar, és important entendre per què fem això.",
        videoTitle: "Vídeo explicatiu",
        section1Title: "L'ansietat és una falsa alarma",
        section1Text: "El teu cos reacciona com si hi hagués un perill real, però en un avió comercial modern, el perill és extremadament baix. Estàs reentrenant la teva conducta i regulant les teves emocions.",
        section2Title: "Habituació i Extinció",
        section2SubtitleHabituation: "Habituació",
        section2TextHabituation: "L'habituació és un procés d'aprenentatge en què la teva resposta emocional (què sents, penses i fas) a un estímul (com un dels vídeos del programa) disminueix després d'una exposició repetida. En veure els vídeos diverses vegades, aprens que no hi ha una amenaça real, i la teva ansietat es redueix progressivament. Aquests gràfics mostren com el teu malestar baixa amb cada repetició.",
        section2SubtitleExtinction: "Extinció",
        section2TextExtinction: "Aprens que l'estímul (avió) no prediu perill.",
        section3Title: "Instruccions Clau (Exposició Pura)",
        section3Point1Active: "Mantingues la implicació: viu la situació com si fóra real.",
        section3Point2Stay: "No utilitzis tècniques de relaxació, respiració ni distraccions; impedeixen l'habituació.",
        section3Point3Rate: "No paris el vídeo ni tanquis els ulls fins que l'ansietat hagi baixat, almenys, a la meitat.",
        section3Point4Repeat: "La repetició sense 'ajudes temporals' és la clau de l'èxit.",
        section4Title: "Què esperar?",
        section4TextInitialAnxiety: "Al principi, l'ansietat pot ser alta.",
        section4TextGradualDecrease: "Amb el temps, anirà baixant.",
        section4TextTemporaryFluctuations: "Pot haver-hi dies millors i pitjors. És normal.",
        proceedButton: "Entès, vull començar",
    },
    celebration: {
        pageTitle: "Felicitats!",
        congratulations: "Enhorabona, {username}!",
        messageBody: "Has completat el programa CAFFT. Això és un gran pas cap a la superació de la teva por.",
        achievementsHeader: "Assoliments",
        achievement1: "Has completat tota la jerarquia d'exposició.",
        achievement2: "Has après a gestionar l'ansietat.",
        achievement3: "Estàs més preparat per volar.",
        nextStepsHeader: "Propers passos",
        nextStep1: "Planifica un vol real aviat.",
        nextStep2: "Repassa les pautes post-tractament.",
        nextStep3: "Si ho necessites, torna a utilitzar el programa.",
        returnHomeButton: "Tornar a l'inici",
        logoutButton: "Sortir",
        viewFlightInstructionsButton: "Veure pautes de vol",
    },
    lastSession: {
        pageTitle: "Sessió Finalitzada",
        pageSubtitle: "Has arribat al final de la teva jerarquia.",
        header: "Pautes per al futur",
        intro: "Aquí tens algunes recomanacions finals.",
        checklistItem1: "Repassa el que has après.",
        checklistItem2: "No t'autoexigeixis perfecció.",
        checklistItem3: "Vola quan puguis.",
        checklistItem4: "Accepta la incertesa.",
        checklistItem5: "Cuida el teu estrès general.",
        checklistItem6: "Recorda els teus èxits.",
        checklistItem7: "Mantén hàbits saludables.",
        checklistItem8: "Demana ajuda si recaus.",
        finalAdviceTitle: "Un últim consell",
        finalAdviceText: "La por pot tornar a aparèixer, però ara tens eines per afrontar-la.",
        actionsTitle: "Què vols fer ara?",
        reviewButton: "Repassar (si cal)",
        reviewButtonTooltip: "Torna a veure algunes escenes",
        reviewDoneButton: "Repàs completat",
        reviewDoneButtonTooltip: "Ja has fet el repàs",
        evaluationButton: "Avaluació Final",
        evaluationButtonTooltip: "Fes el QPV-II per veure el teu progrés final",
    },
    aiChat: {
        pageTitle: "Assistent IA",
        disclaimer: "Aquest és un assistent automàtic. La informació pot no ser exacta. En cas de dubte, consulta un professional.",
        initialMessage: ["Hola! Sóc {assistantName}, el teu co-terapeuta. En què puc ajudar-te avui?", "Hola {username}! Sóc {assistantName}. Com van els teus ànims avui?", "Hola! Sóc {assistantName}. Estic aquí per ajudar-te amb la teva por a volar. Què necessites?"],
        initialMessageCompleted: ["Hola, {username}! Sóc {assistantName}. He revisat el teu progrés i estic a punt per a les teves sessions d'exposició. Com et sents?", "Hola! Sóc {assistantName}. Vols que continuem amb les teves sessions d'exposició o prefereixes comentar algun dubte?", "Bones, {username}! Sóc {assistantName}. En què puc ajudar-te avui?"],
        inputPlaceholder: "Escriu aquí...",
        sendButton: "Enviar",
        systemInstruction: "Ets l'assistent expert del CAFFT (recerca UIB). REGLA CRÍTICA: Respostes molt BREUS, DIRECTES i NATURALS (màxim 1-2 frases). No demanis MAI coses que l'usuari ja ha fet (com el QPV-II si ja consta com a fet). Prioritza el text. Enllaços markdown (ex. [Exposició](/exposure), [Centre d'Ajuda](/help-center)) només si són el seguënt pas lògic. ESTAT ACTUAL QPV-II: {hasCompletedQPVII}. CONTEXT DEL PACIENT: {therapeuticContext}.",
        therapistSystemInstruction: "Ets l'Assistent de Suport Clínic per a terapeutes del programa CAFFT (Investigació de la UIB). El teu rol és ajudar als terapeutes a interpretar dades i optimitzar el procés, basant-te en l'evidència científica. MISSIONS: 1. Interpretar mètriques: RCI (Índex de Canvi Fiable, ha de ser > 1.96 per ser significatiu), pendents d'habituació (negatiu és bo) i tendències de SUDS. 2. Funcions de programari: Guia sobre [gestionar pacients](/therapist/patients), configurar [notificacions](/therapist/notifications) i interpretar la [jerarquia d'exposició](/therapist/dashboard). 3. Ajust Clínic: Suggereix ajustos basats en l'evidència (Bornas et al., 2001, 2006). Recorda la importància de l'exposició pura sense relaxació. REGLA CRÍTICA: Inclou sempre enllaços markdown rellevants. Màxim 4 frases tècniques.",
        therapistInitialMessage: "Hola, {username}. Com et puc ajudar avui en la gestió dels teus pacients o en el funcionament tècnic del CAFFT?",
        assistantNameTitle: "Com es diu el teu co-terapeuta?",
        assistantNamePlaceholder: "Escriu un nom...",
        genderNeutralSuggestions: ["Àlex", "Ari", "Dani", "Cris", "Mar", "Blau", "Llum", "Sol", "Eden", "Kai", "Ariel", "Sacha"],
        saveName: "Guardar",
        reconnectButton: "Reconnectar",
        connecting: "Conectant amb l'assistent...",
        changeName: "Canviar nom",
        moment: {
            pre: "El pacient encara no ha començat el tractament (fase d'informació o dubtes inicials).",
            during: "El pacient està realitzant les sessions d'exposició gradual.",
            maintenance: "El pacient ha completat el programa d'exposició i està pendent de realitzar el seu pròxim vol real.",
            post: "El pacient ja ha volat i està en fase de seguiment post-tractament.",
        },
        reminder: {
            emailSubject: "T'esperem al CAFFT",
            emailBody: "Hola {username}, fa uns dies que no realitzes cap sessió d'exposició. Recorda que la constància és la clau per superar la por. T'esperem quan estiguis a punt!",
            notificationSent: "S'ha enviat un recordatori al pacient.",
            webappMessage: "Hola {username}! Fa {days} dies que no realitzes cap sessió. Recorda que la clau de l'èxit és la pràctica constant. T'animem a fer una petita sessió avui!"
        },
        followUp: {
            firstSession: "Enhorabona per la teva primera sessió, {username}! Has fet el primer pas, el més difícil. Seguim endavant!",
            halfway: "Ja has completat la meitat del camí, {username}! Estàs demostrant una gran valentia. Aviat la por serà només un record.",
            reducedFear: "Increïble progrés, {username}! El teu nivell d'ansietat ha baixat clarament en les darreres sessions. Has passat de {firstSuds} a {latestSuds}. Estàs dominant la por!",
            mostDifficult: "Has superat un dels teus reptes més grans avui, {username}. Estic molt orgullós/osa de tu. Ets més fort/a del que pensaves!",
            maintenanceStarted: "Has arribat a la fase final, {username}! Ara només cal mantenir aquests èxits abans del teu pròxim vol. Ho tens a prop!",
        }
    },
    therapistDashboard: {
        pageTitle: "Tauler del Terapeuta",
        kpi: {
            title_overview: "Resum de Rendiment (KPIs)",
            total_patients: "Total Pacients",
            active_sessions: "Sessions Actives",
            completed_programs: "Programes Completats",
            avg_improvement: "Millora Mitjana (QPV-II)",
            avg_exposure_time: "Temps Exp. Mitjà",
            total_sessions: "Sessions Totals",
            sessions_rate: "Ràtio de Sessions",
            high_risk: "Pacients en Risc",
            inactive_patients: "Inactius (+3 dies)",
        },
        myPatientsTitle: "Els Meus Pacients",
        criticalAlertsTitle: "Alertes de Seguiment",
        search: "Cercar pacient...",
        addPatientButton: "Afegir Pacient",
        table: {
            name: "Nom",
            qpvii_latest: "QPV-II (L'últim)",
            rci: "RCI",
            significant_rci: "Significatiu",
            progress: "Progrés",
            last_active: "Última Activitat",
            status: "Estat",
            actions: "Accions",
            exposure_time: "Temps Exp.",
            remind: "Recordar",
            total_time: "Temps Total",
            sessions: "Sessions",
            last_session_slope: "Últim Pendent",
            habituation_status: "Estat Habit.",
            hierarchy_completed: "Jerarquia Superada",
            notifications: "Notíf.",
            onboarding_tour: "Recorregut",
        },
        tooltips: {
            toggleNotificationsOn: "Activar Notificacions",
            toggleNotificationsOff: "Desactivar Notificacions",
            toggleTourOn: "Activar Recorregut",
            toggleTourOff: "Desactivar Recorregut",
        },
        charts: {
            phaseDistribution: "Distribució per Fases",
            dailyActivity: "Activitat Diària (Últims 7 dies)",
            sessionsStarted: "Sessions Iniciades",
            sessionsCompleted: "Sessions Completades",
            evaluations: "Avaluacions QPV-II",
            actionsLabel: "accions",
            sessionsPerDay: "Sessions per Dia",
            discomfortTrend: "Tendència del Malestar",
        },
        patient_status: {
            new: "Nou",
            ready: "Llest",
            in_progress: "En curs",
            needs_review: "Revisió",
            completed: "Completat",
            stalled: "Estancat",
            dropping_out: "Risc d'Abandonament",
        },
        actionOptions: {
            viewDetails: "Veure Detalls",
            resetPassword: "Re. Contrasenya",
            deletePatient: "Esborrar",
        },
        noPatients: "No hi ha pacients registrats.",
        addPatientModal: {
            title: "Afegir Nou Pacient",
            usernameLabel: "Nom d'usuari",
            emailLabel: "Correu electrònic",
            passwordLabel: "Contrasenya inicial",
            createButton: "Crear Pacient",
            cancelButton: "Cancel·lar",
        },
        inviteModal: {
            title: "Afegir Nou Pacient",
            intro: "S'ha creat el pacient. Pots enviar-li aquesta invitació:",
            sendButton: "Enviar Email (Simulat)",
            copyButton: "Copiar Text",
            copiedButton: "Copiat!",
            closeButton: "Tancar",
        },
        inviteEmail: {
            subject: "Benvingut al programa CAFFT",
            body: "Hola {patientName},\n\nEl teu terapeuta {therapistName} t'ha convidat al programa CAFFT.\n\nCredencials d'accés:\nUsuari: {username}\nContrasenya: {password}\n\nAccedeix aquí: [URL_APP]",
        },
        deletePatientModal: {
            title: "Esborrar Pacient",
            confirmationText: "Estàs segur que vols esborrar el pacient {username}? Aquesta acció no es pot desfer.",
            deleteButton: "Esborrar",
            cancelButton: "Cancel·lar",
        },
        resetPasswordModal: {
            title: "Restablir Contrasenya per a {username}",
            newPasswordIs: "La nova contrasenya temporal és:",
            copyButton: "Copiar",
            copiedButton: "Copiat!",
            closeButton: "Tancar",
        },
        exportDataModal: {
            title: "Exportar Dades",
            anonymizeLabel: "Anonimitzar dades (Recomanat)",
            anonymizeTooltip: "Substitueix noms i IDs per codis genèrics per protegir la privacitat.",
            exportButton: "Exportar CSV",
            cancelButton: "Cancel·lar",
        },
        notificationsTitle: "Notificacions",
        reminders: {
            sendReminderButton: "Enviar Recordatori",
            reminderSentSuccess: "S'ha enviat el recordatori correctament.",
            inactivityBadge: "Inactiu ({days}d)",
            abandonmentRisk: "Risc d'abandonament prematur",
        },
        aiConsultationsTitle: "Consultes dels Pacients a l'IA Assistant",
        noAiConsultations: "Cap dels teus pacients ha realitzat encara cap consulta a l'IA assistant.",
        patientLabel: "Pacient",
        queryLabel: "Pregunta",
        newConsultation: "Nova Consulta",
        moreConsultations: "+ {count} més consultes al registre",
    },
    patientDetail: {
        pageTitle: "Detalls del Pacient: {username}",
        currentPlanTitle: "Pla Terapèutic Actual",
        basedOnEvaluation: "Basat en avaluació del {date}",
        hierarchyTitle: "Jerarquia d'Exposició",
        patientNotFound: "Pacient no trobat.",
        noEvaluationsFound: "No s'han trobat avaluacions.",
        sessionDetailsTitle: "Detall de Sessions i Seqüències",
        noExposureSessions: "Encara no s'han registrat sessions d'exposició.",
        recommendationsTitle: "Insights Clínics i Alertes",
        qpviiHistoryTitle: "Evolució QPV-II",
        communicationsTitle: "Comunicacions amb el Pacient",
        emailLogTitle: "Registre de Correos Enviats",
        noEmailsSent: "Encara no s'han enviat correus automàtics.",
        viewEmailButton: "Veure",
        emailModalTitle: "Contingut del Correu",
        closeButton: "Tancar",
        sessionDate: "Data de la Sessió",
        videosViewed: "Vídeos/Seqüències",
        avgDiscomfort: "Malestar Mitjà",
        habituationSlope: "Pendent d'Habituació",
        notificationsNotEnabled: "El pacient no ha activat les notificacions.",
        ratingHistory: "Historial de Valoracions",
        videoTitle: "Estímul / Vídeo",
        rating: "SUDS",
        session_time: "Durada de la Sessió",
        totalExposure_time: "Temps d'Exposició Acumulat",
        sequenceBreakdown: "Seqüència per Sessió",
        abandonmentWarning: "ABANDONAMENT ABANS D'HABITUAR",
        habituatedLabel: "Habituat",
        processingLabel: "Processant",
        emailType: {
            invitation: "Invitació",
            reminder: "Recordatori",
            follow_up: "Seguiment",
            reinforcement: "Reforç",
        },
        recommendations: {
            noExposureDataForRecommendations: "Dades d'exposició insuficients per generar recomanacions clíniques a mida.",
            noSignificantAlerts: "El progrés entra dins els paràmetres clínics esperats. Es produeix processament emocional.",
            stalledHabituation: "Reactivitat persistent a {sceneName}. Cal investigar possibles conductes de seguretat o resistència.",
            highExposureVolume: "Volum de pràctica excel·lent. Indica alta adherència al tractament.",
            effectiveHabituation: "Habituació molt efectiva. S'observa una reducció consistent del malestar.",
            dropoutRisk: "CRÍTICAL: El pacient abandona les seqüències abans d'una reducció significativa del SUDS. Risc de sensibilització.",
            irregularPractice: "Patró de pràctica irregular detectat. Considereu enviar un recordatori motivacional.",
        },
    },
    superadminDashboard: {
        allUsersTitle: "Tots els Usuaris",
        addUserButton: "Afegir Usuari",
        addNewUserTitle: "Afegir Nou Usuari",
        table: {
            user: "Usuari",
            role: "Rol",
            parent: "Superior",
            settings: "Configuració",
            actions: "Accions"
        },
        form: {
            username: "Nom d'usuari",
            email: "Correu electrònic",
            password: "Contrasenya",
            role: "Rol",
            assignToManager: "Assignar a un Gestor",
            none: "Cap"
        }
    },
    managerDashboard: {
        addTherapistButton: "Afegir Terapeuta",
        addNewTherapistTitle: "Afegir Nou Terapeuta",
        table: {
            therapist: "Terapeuta",
            viewPatients: "Veure Pacients"
        }
    },
    feedback: {
        pageTitle: "Feedback del Programa",
        ratingLabel: "Valoració",
        typeLabel: "Tipus de Comentari",
        types: {
            bug: "Error / Problema",
            improvement: "Millora Suggerida",
            testimonial: "Testimoni / Experiència",
            other: "Altre"
        },
        commentLabel: "Comentaris",
        commentPlaceholder: "Explica'ns més sobre la teva experiència o suggeriment...",
        submitButton: "Enviar Feedback",
        successMessage: "Gràcies pel teu feedback! Ens ajuda a millorar CAFFT.",
        errorMessage: "Hi ha hagut un error en enviar el feedback. Torna-ho a provar.",
        recentTestimonialsTitle: "Testimonis Recents",
        anonymousUser: "Usuari en pràctiques"
    },
    general: {
        readMore: "Llegir més",
        by: "per",
        help: "Ajuda",
        or: "o",
        confirmExit: "Confirmar sortida",
        cancel: "Cancel·lar",
        errorDetails: "Detalls de l'error",
        unknown: "Desconegut",
        none: "Cap",
        roles: {
            manager: "Manager",
            therapist: "Terapeuta",
            superadmin: "Superadmin",
            patient: "Pacient"
        }
    }
};

const esTranslations: TranslationContent = {
    ...caTranslations,
    appName: "Tratamiento Asistido por Ordenador del Miedo a Volar (CAFFT)",
    appNameShort: "CAFFT",
    common: {
        ...caTranslations.common,
        time: {
            ...caTranslations.common.time,
            ago: "hace {val} {unit}",
            year: "año",
            month: "mes",
            day: "día",
            hour: "hora",
            minute: "minuto",
            second: "segundo",
            years: "años",
            months: "meses",
            days: "días",
            hours: "horas",
            minutes: "minutos",
            seconds: "segundos",
            session: "sesión",
            sessions: "sesiones",
        }
    },
    progress: {
        programTitle: "Tu Proceso CAFFT",
        intro: "Bienvenida",
        assessment_pre: "Evaluación",
        exposure: "Entrenamiento",
        assessment_post: "Resultados",
        complete: "Éxito"
    },
    informedConsent: {
        title: "Evaluación Inicial",
        dob: "Fecha de nacimiento",
        gender: "Sexo",
        genderMale: "Masculino",
        genderFemale: "Femenino",
        genderOther: "Otros",
        occupation: "Ocupación",
        occupationStudent: "Estudiante universitario (grado, posgrado, máster, doctorado)",
        occupationPTAGS: "PTAGS",
        occupationPDI: "PDI",
        occupationOther: "Otro",
        source: "¿Cómo has conocido la Consulta de Bienestar Psicológico?",
        sourceWeb: "Vía Web",
        sourceUnitatMedica: "Servicio de Prevención (Unidad médica)",
        sourceNecessitats: "Oficina de Apoyo a Personas con Necesidades Educativas",
        sourceProfesor: "Recomendación Profesorado",
        sourceUser: "Recomendación de un usuario",
        sourceFriend: "Recomendación un/a conocido/a",
        sourceOther: "Otros",
        consentDate: "Fecha Consentimiento Informado",
        consentText: "Doy mi consentimiento para el tratamiento de mis datos de carácter personal por parte de el Espai de Benetar Psicològic (EBP) de la Universitat de les Illes Balears (EBP-UIB), de acuerdo con las siguientes condiciones:\n\nEl EBP-UIB tiene tres objetivos fundamentales: proporcionar un servicio de atención psicológica, contribuir a la investigación en psicopatología y psicología clínica, y ayudar en la formación práctica de los alumnos de grado de Psicología y del Máster en Psicología General Sanitaria. En mi caso, solicito una consulta de atención psicológica y, por tanto, me comprometo a facilitar la información, completar las pruebas y realizar las tareas que me sean requeridas, para que los responsables de el EAB-UIB puedan atender mi consulta de la mejor manera posible.\n\nSoy plenamente consciente de que:\na. Todos los datos serán tratados con respeto a mi intimidad y en conformidad con la normativa vigente en protección de datos.\nb. Tengo el derecho de acceso, rectificación, oposición, supresión, portabilidad y limitación del tratamiento sobre mis datos, y puedo ejercer estos derechos mediante una solicitud en cualquier momento.\nc. Mis datos pueden ser utilizados en trabajos de cariz científico, pero en estos casos siempre se garantizará su anonimato, y en ningún caso no serán cedidos a terceros sin mi consentimiento.\nd. La psicología no es una ciencia exacta y el tratamiento psicológico no asegura la mejora. Durante el transcurso de la intervención, es posible que experimente malestar y alteraciones de el estado de ánimo. Mi participación en el protocolo de intervención es totalmente voluntaria, y tengo la libertad de retirarme en cualquier momento.",
        consentAcceptLabel: "Doy mi consentimiento",
        studentsPresence: "Acepto que por motivos formativos pueda haber estudiantes presentes durante las sesiones de asesoramiento psicológico.",
        legalText: "En cumplimiento de lo que dispone el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre (LOPDGDD), os informamos que los datos recogidos serán incluidos en uno o más ficheros gestionados por la UIB al registro de actividad de tratamiento habilitado a tal efecto, la finalidad del cual es gestionar vuestra solicitud. Los datos solicitados son necesarios para cumplir con la finalidad mencionada y, por tanto, el hecho de no obtenerlos impide conseguirla. La UIB es la responsable del tratamiento de los datos y, como tal, os garantiza los derechos de acceso, rectificación, oposición, supresión, portabilidad, limitación del tratamiento, y a no ser objeto de decisiones individuales automatizadas en cuanto a los datos facilitados y tratados. Para ejercer los derechos indicados se tendrá que dirigir por escrito a: Universitat de les Illes Balears, Secretaria General, a la atención de la delegada de protección de datos, Ctra. de Valldemossa, km 7,5, 07122 Palma (Islas Baleares) o a la dirección de correo electrónico dpo@uib.es. También dispone del derecho a reclamar ante la Autoridad de control en: https://www.aepd.es. De la misma manera, la UIB se compromete a respetar la confidencialidad de sus datos y a utilizarlos de conformidad con la finalidad por la que fueron recogidos.",
        conformityTitle: "Como prueba de conformidad, acepto el presente consentimiento.",
        yes: "Sí",
        no: "No",
        select: "Elige..."
    },
    nav: { ...caTranslations.nav, home: "Inicio", fearOfFlying: "Miedo a Volar", cafftProgram: "Programa", qpviiEvaluation: "Evaluación", exposure: "Exposición", login: "Iniciar Sesión", register: "Registrarse", profile: "Perfil", logout: "Cerrar Sesión", privacyPolicy: "Política de Privacidad", cafftIntro: "Inicio", forgotPasswordLink: "¿Olvidaste la contraseña?", evolution: "Evolución", exposureHierarchy: "Jerarquía de Exposición", exposureExplanation: "Explicación de Exposición", lastSession: "Sesión Final", therapistDashboard: "Panel del Terapeuta", managerDashboard: "Panel de Gestor", superadminDashboard: "Panel de Superadministrador", patients: "Pacientes", therapists: "Terapeutas", managers: "Gestores", therapistNotifications: "Notificaciones", scientificEvidence: "Evidencia Científica", helpCenter: "Ayuda", help: "Ayuda", addUser: "Añadir Usuario", addTherapist: "Añadir Terapeuta", save: "Guardar", cancel: "Cancelar" },
    home: { 
        ...caTranslations.home, 
        title: ["Tratamiento Asistido", "por Ordenador del", "Miedo a Volar", "(CAFFT)"], 
        firstEdition: "Primera Edición: 1999",
        version: "Versión 5.1",
        startButton: "Empezar Programa" 
    },
    fearOfFlying: {
        title: "¿Qué es el Miedo a Volar?",
        introduction: "El miedo a volar, o aerofobia, es una de las fobias específicas más comunes. Afecta a un porcentaje significativo de la población y puede limitar la vida personal y profesional de las personas.",
        prevalence: {
            title: "Prevalencia en la Población",
            text: "Se estima que entre un 20% y un 40% de la población adulta experiencia algún nivel de ansiedad al volar. De estos, aproximadamente un 6.5% sufre una fobia clínica que les impide volar o lo hacen con gran malestar. (Tortella-Feliu & Fullana, 1999)",
            chartData: [
                { nameKey: "phobia", value: 6.5 },
                { nameKey: "discomfort", value: 33.5 },
                { nameKey: "noDiscomfort", value: 60 },
            ],
            phobia: "Fobia Clínica",
            discomfort: "Malestar/Ansiedad",
            noDiscomfort: "Sin Malestar",
        },
        whoIsAffected: {
            title: "¿Quién la Padece?",
            text: "El miedo a volar puede afectar a cualquier persona, independientemente de la edad, género o profesión. A menudo comienza en la edad adulta, a veces después de una experiencia de vuelo normal. Factores como el estrés, la paternidad/maternidad o la cobertura mediática de incidentes aéreos pueden actuar como desencadenantes.",
        },
        whatIsIt: {
            title: "¿Cómo se Manifiesta?",
            text1: "La aerofobia se manifiesta a través de tres componentes interrelacionados:",
            physiological: "Respuestas Fisiológicas",
            physiological_desc: "Taquicardia, sudoración, temblores, dificultad para respirar, mareos. Son reacciones del sistema nervioso autónomo ante la percepción de una amenaza.",
            cognitive: "Pensamientos Catastrofistas",
            cognitive_desc: "Ideas negativas e irracionales sobre el vuelo, como el miedo a un accidente, a perder el control, a sufrir un ataque de pánico o a estar encerrado.",
            behavioral: "Conductas de Evitación",
            behavioral_desc: "La acción de evitar volar o realizar 'conductas de seguridad' (beber alcohol, tomar medicación sin prescripción, comprobar constantemente a la tripulación) para intentar reducir la ansiedad.",
        },
        origins: {},
    },
    cafftProgram: {
        title: "El Programa CAFFT",
        introduction: "El CAFFT (Computer Assisted Fear of Flying Treatment) es un programa de tratamiento psicológico diseñado por investigadores de la Universidad de las Islas Baleares para ayudar a las personas a superar su miedo a volar.",
        specificInfo: {
            title: "Información Específica",
            whatIsCAFFT: "¿Qué es CAFFT?",
            whatIsCAFFT_desc: "Es una terapia de exposición gradual, asistida por ordenador, que utiliza vídeos para simular las diferentes fases de un vuelo. Esta exposición controlada permite al usuario habituarse a los estímulos que le provocan ansiedad en un entorno seguro.",
            howItWorks: "¿Cómo funciona?",
            howItWorks_desc: "El programa comienza con una evaluación del miedo (QPV-II) para crear una 'jerarquía de exposición' personalizada. El usuario se expone a los vídeos de esta jerarquía, valorando su malestar. Repite cada paso hasta que la ansiedad disminuye, un proceso conocido como habituación.",
            onlineInterview: "Antes de comenzar, es necesario realizar una evaluación psicológica para confirmar la idoneidad del programa.",
        },
        linkToScientificFoundation: "Ver Fundamentos Científicos",
    },
    userGuide: {
        ...caTranslations.userGuide,
        title: "Guía del Usuario",
        introduction: "Esta guía proporciona información importante sobre los requisitos, el uso y las ventajas del programa CAFFT.",
        requirements: {
            ...caTranslations.userGuide.requirements,
            title: "Requisitos",
            computer: "Ordenador con conexión a Internet y navegador web actualizado.",
            headphones: "Auriculares para una experiencia de audio inmersiva.",
            skills: "Habilidades informáticas básicas.",
        },
        beforeUse: {
            ...caTranslations.userGuide.beforeUse,
            title: "Antes de utilizar el CAFFT",
            adverseEffects: "El tratamiento puede provocar efectos adversos temporales, similares a los síntomas de ansiedad.",
            mostFrequent: ["Ansiedad", "Inquietud", "Tensión muscular", "Preocupación", "Irritabilidad"],
            mostSerious: ["Puede producirse un ataque de pánico, aunque es poco frecuente."],
            doNotUseIf: [
                "Estás recibiendo otro tratamiento psicológico para el miedo a volar.",
                "Padeces un trastorno psicótico, bipolar o un trastorno grave de la personalidad.",
                "Tienes epilepsia fotosensible.",
                "Tienes ideas suicidas.",
            ],
        },
        howToUse: {
            ...caTranslations.userGuide.howToUse,
            title: "Cómo Utilizar el Programa",
            text: "Sigue los pasos indicados en la aplicación: comienza con la introducción, completa la evaluación QPV-II con honestidad, y luego sigue tu jerarquía de exposición personalizada. Es crucial que te quedes en cada paso hasta que tu ansiedad se reduzca considerablemente (al menos a la mitad) antes de pasar al siguiente.",
        },
        advantages: {
            ...caTranslations.userGuide.advantages,
            title: "Ventajas del CAFFT",
            items: [
                "Eficacia demostrada en estudios científicos.",
                "Accesibilidad desde cualquier lugar con Internet.",
                "Anonimato y privacidad.",
                "Control total del usuario sobre el ritmo del tratamiento.",
                "Coste-efectividad en comparación con terapias tradicionales.",
                "Disponibilidad 24/7.",
                "Reducción de barreras geográficas.",
                "Basado en técnicas cognitivo-conductuales, el tratamiento de elección para las fobias.",
            ],
        }
    },
    postTreatment: {
        instructionsTitle: "4. Instrucciones para el Vuelo Real",
        introManual: "Una vez finalizado el programa, se recomienda realizar un vuelo en un plazo de 10 a 15 días.",
        instructionItem1Manual: "NO tomes tranquilizantes ni antes ni durante el vuelo.",
        instructionItem2Manual: "NO ingieras bebidas alcohólicas.",
        instructionItem3Manual: "Siéntate donde te toque por azar.",
        instructionItem4Manual: "Evita hablar del miedo a volar los días previos.",
        instructionItem5Manual: "Utiliza distractores naturales si quieres (leer, música), pero no para huir de la ansiedad.",
        instructionItem6Manual: "Acepta los nervios como parte del aprendizaje.",
        nervousnessAdviceManual: "Si te pones nervioso, piensa que es una oportunidad para aplicar la habituación que has practicado con el CAFFT.",
        sessionTitle: "Pautas para el próximo vuelo",
        introQuestion: "¿Qué debes hacer cuando tengas que volar de verdad?",
        instructionItem1: "Llega al aeropuerto con tiempo suficiente.",
        instructionItem2: "No evites mirar los aviones o la pista.",
        instructionItem3: "Recuerda que la ansiedad es incómoda pero no peligrosa: deja que suba y baje sola.",
        instructionItem4: "No utilices técnicas de relajación o respiración; actúan como 'recursos de seguridad' que impiden la habituación real.",
        instructionItem5: "No tomes alcohol ni fármacos para evitar la ansiedad, ya que inhiben el aprendizaje de seguridad.",
        instructionItem6: "Mantén la atención en el vuelo (implicación emocional) en lugar de distraerte.",
        instructionItem7: "Confía en la seguridad del avión.",
        instructionItem8: "Felicítate por cada paso que des.",
        nervousnessAdvice: "Es normal sentir un poco de nervios. No interpretes estos nervios como una señal de peligro.",
    },
    auth: {
        registerTitle: "Crear Cuenta",
        loginTitle: "Iniciar Sesión",
        usernameLabel: "Nombre de usuario",
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        confirmPasswordLabel: "Confirmar contraseña",
        currentPasswordLabel: "Contraseña actual",
        newPasswordLabel: "Nueva contraseña",
        consentLabel: "He leído y acepto la",
        consentLinkText: "Política de Privacidad",
        registerButton: "Registrarse",
        loginButton: "Iniciar Sesión",
        logoutButton: "Cerrar Sesión",
        alreadyHaveAccount: "¿Ya tienes cuenta?",
        dontHaveAccount: "¿No tienes cuenta?",
        registrationSuccess: "Registro completado. Ahora puedes iniciar sesión.",
        loginSuccess: "Sesión iniciada con éxito.",
        logoutSuccess: "Sesión cerrada correctamente.",
        fillAllFieldsError: "Por favor, rellena todos los campos.",
        passwordsDontMatchError: "Las contraseñas no coinciden.",
        registrationFailedError: "El registro ha fallado. Por favor, inténtalo de nuevo.",
        loginFailedError: "El inicio de sesión ha fallado. Comprueba tus datos.",
        usernameTakenError: "Este nombre de usuario ya existe.",
        emailTakenError: "Este correo electrónico ya está registrado.",
        invalidCredentialsError: "Nombre de usuario o contraseña incorrectos.",
        consentRequiredError: "Debes aceptar la política de privacidad.",
        loading: "Cargando...",
        forgotPasswordTitle: "Recuperar Contraseña",
        forgotPasswordInstructions: "Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.",
        sendResetLinkButton: "Enviar Enlace",
        resetLinkSentSuccess: "Si la dirección existe, recibirás un correo en breve.",
        resetLinkSentError: "No se ha podido enviar el correo. Inténtalo de nuevo.",
        resetPasswordTitle: "Restablecer Contraseña",
        resetPasswordInstructions: "Introduce tu nueva contraseña.",
        resetPasswordButton: "Restablecer Contraseña",
        passwordResetSuccess: "Contraseña actualizada. Ahora puedes iniciar sesión.",
        passwordResetError: "No se ha podido restablecer la contraseña.",
        invalidOrExpiredTokenError: "El enlace no es válido o ha caducado.",
        changePasswordTitle: "Cambiar Contraseña",
        changePasswordButton: "Cambiar Contraseña",
        changePasswordSuccess: "Contraseña cambiada con éxito.",
        changePasswordError: "La contraseña actual es incorrecta.",
        passwordMinLengthError: "La contraseña debe tener al menos 6 caracteres.",
    },
    profile: {
        ...caTranslations.profile,
        title: "Mi Perfil",
        welcome: "¡Bienvenido/a, {username}!",
        qpviiHistoryTitle: "Historial de Evaluaciones QPV-II",
        evaluationOn: "Evaluación del {date}",
        totalScore: "Puntuación Total: {score}",
        changePasswordSectionTitle: "Cambiar la Contraseña",
        noHistory: "Aun no has completado ninguna evaluación.",
        notificationsSectionTitle: "Notificaciones Push",
        notificationsDescription: "Configura cómo y cuándo quieres recibir recordatorios sobre tu proceso terapéutico.",
        enableNotifications: "Activar notificaciones en el dispositivo",
        notificationTypes: {
            reminders: "Recordatorios de actividad",
            newTasks: "Avisos de nuevas tareas",
            followUp: "Seguimiento de la evolución",
            general: "Mensajes informativos",
        },
        frequency: {
            title: "Frecuencia de las notificaciones",
            daily: "Diaria",
            weekly: "Semanal",
        },
        timeRange: "Franja horaria permitida",
        savePreferences: "Guardar preferencias",
        consentWithdrawn: "Has retirado el consentimiento para las notificaciones.",
        consentGiven: "Has dado tu consentimiento para recibir notificaciones.",
        withdrawConsent: "Retirar consentimiento",
        notificationConsentPrompt: "¿Quieres recibir notificaciones?",
        notificationConsentExplain: "¿Quieres recibir recordatorios y avisos relacionados con tu proceso terapéutico? Puedes cambiar esta preferencia en cualquier momento.",
        acceptButton: "Aceptar",
        declineButton: "Rechazar",
    },
    helpModal: {
        ...caTranslations.helpModal,
        modalTitle: "Centro de Ayuda",
        tocTitle: "Contenidos",
        searchPlaceholder: "¿Qué necesitas saber?",
        closeButton: "Cerrar",
        disclaimer: "Orientaciones. No sustituyen el criterio de tu terapeuta.",
        needMoreHelp: "¿Todavía tienes dudas?",
        noResultsTitle: "Sin resultados",
        noResultsText: "Prueba otras palabras o explora el menú lateral.",
        heroSubtitle: "Todo lo que necesitas saber sobre el programa CAFFT y cómo superar tu miedo a volar de forma definitiva.",
        fullManualTitle: "Manual Clínico Completo",
        fullManualSubtitle: "Consulta o descarga el manual oficial en formato Markdown.",
        fullManualMd: `
# Manual Clínico y Prospecto CAFFT 5.1
**Tratamiento Asistido por Ordenador del Miedo a Volar (CAFFT)**
*Universidad de las Islas Baleares (UIB)*

---

## 1. Introducción al Miedo a Volar (Aerofobia)

### 1.1 Prevalencia e Impacto
El miedo a volar afecta aproximadamente al **13% de la población adulta** en forma de fobia clínica. Un **40%** adicional experimenta malestar significativo. No es una enfermedad, sino una respuesta de miedo aprendida.

### 1.2 Los Tres Componentes del Miedo
1.  **Componente Fisiológico:** Taquicardia, sudoración, temblores, hiperventilación.
2.  **Componente Cognitivo:** Pensamientos catastrofistas (*"el avión caerá"*) y anticipación del miedo.
3.  **Componente Conductual:** Principalmente la **evitación**. No volar mantiene el problema.

---

## 2. El Programa CAFFT

### 2.1 Exposición Gradual y Habituación
El tratamiento se basa en la **Exposición Pura**. Utilizamos vídeos realistas que simulan las fases del vuelo. El sistema crea una **jerarquía personalizada**. El objetivo es la **Habituación**.

---

## 3. Guía del Usuario (Prospecto)

### 3.1 Condiciones de Uso
- **Lugar:** Tranquilo, luz tenue.
- **Auriculares:** **USO OBLIGATORIO**.
- **Volumen:** Ajustarlo a un nivel real.

### 3.2 Implicación Activa (Sin Ajudes Temporals)
- **Honestidad:** Valore su malestar de forma sincera (0-10).
- **Prohibido:** No utilice técnicas de relajación o distracción durante los vídeos. Actúan como "ajudes temporals" que impiden el aprendizaje real.

---

## 4. Instrucciones para el Vuelo Real

- **Medicación:** NO tome tranquilizantes.
- **Alcohol:** NO consuma alcohol.
- **Nervios:** Acepte los nervios como parte del aprendizaje.
        `,
        fearOfFlying: {
            title: "1. Introducción al Miedo a Volar",
            prevalence: {
                title: "¿A cuánta gente afecta este problema?",
                textManual: "El miedo a volar es un problema mucho más frecuente de lo que usted seguramente piensa. Se calcula que afecta a cerca de un **13% del conjunto de la población adulta**. Además, muchas otras personas (cerca de un **40%**) experimentan un cierto malestar cuando tienen que volar, y solo un **47%** de la población vuela con total tranquilidad."
            },
            whoIsAffected: {
                title: "¿A qué tipo de personas afecta?",
                textManual: "Todo el mundo puede tener miedo a volar. Tener miedo a volar no es ninguna enfermedad, ni un síntoma de ningún desequilibrio personal o de ser un cobarde. No hay un perfil determinado de personas que tengan más riesgo que otras, aunque puede afectar un poco más a mujeres y a personas que en general son nerviosas o preocupadizas."
            },
            whatIsIt: {
                title: "¿En qué consiste el miedo a volar?",
                introManual: "La aerofobia no es un sentimiento único, sino que se manifiesta en tres componentes que se alimenten entre sí:",
                physiological: {
                    title: "Componente fisiológico: Las sensaciones del cuerpo",
                    textManual: "Aparición de sensaciones físicas desagradables como que el **corazón vaya muy rápido (taquicardia)**, sudor, temblores, respiración rápida (hiperventilación), náuseas o dolor de barriga. Cuanto más miedo dé la situación, más intensas y numerosas serán estas sensaciones."
                },
                cognitive: {
                    title: "Componente cognitivo: Lo que pensamos",
                    textManual: "Pensamientos negativos y catastrofistas: *'el avión podría caer'*, *'no podré salir de aquí'*, *'tendré un ataque al corazón y nadie me podrá ayudar'*, *'los demás se reirán de mí'*. También incluye la **anticipación**: empezar a sufrir días antes del vuelo o simplemente al hacer la maleta."
                },
                behavioral: {
                    title: "Componente conductual: Lo que hacemos",
                    textManual: "Principalment la **evitación**: tratar de no ir en avión, cancelar viajes, buscar excusas o utilizar 'recursos de seguretat' (alcohol, pastillas). También incluye evitar estímulos relacionados como ver películas de aviones o ir al aeropuerto."
                },
            },
            howItStarts: {
                title: "¿Cómo comienza el problema?",
                textManual: "Puede tener orígenes diversos: haber vivido un vuelo con fuertes turbulencias, recibir noticias de accidentes de forma repetida, ver a familiares que sufren volando o haber experimentado un ataque de pánico o molestias físicas intensas durante un vuelo previo."
            },
            howItIsMaintained: {
                title: "¿Cómo se mantiene el problema?",
                textManual: "El factor más importante que mantiene el miedo es **la evitación**. Cuando evitamos volar, sentimos un alivio inmediato, y esto 'educa' nuestro aprendizaje a creer que huir es la única manera de estar seguros. Así, nunca damos la oportunidad al organismo para aprender que el avión es seguro."
            },
            howToSolve: {
                title: "¿Cómo solucionar el problema?",
                textManual: "El objetivo es el **aprendizaje de extinción**: romper la asociación entre volar y la ansiedad. Esto se logra mediante la **exposición gradual**: afrontar las situaciones temidas poco a poco, sin huir de ellas, hasta que el cuerpo se habitúa y la ansiedad desaparece."
            }
        },
        cafftInfo: {
            title: "2. El Programa CAFFT",
            howItWorks: {
                title: "¿Cómo funciona?",
                textManual: "La exposición a las situaciones temidas será gradual. El sistema confecciona una **jerarquía individualizada** basada en su cuestionario QPV-II. Cada secuencia se presenta tantas veces como sea necesario hasta que la ansiedad disminuya significativamente."
            },
            duration: {
                title: "¿Cuánto dura?",
                textManual: "La duración varía según la persona. Se recomiendan de **4 a 8 sesiones** de una hora. Con 2 o 3 sesiones semanales se puede superar el problema en unas pocas semanas."
            },
            efficacy: {
                title: "¿Es eficaz?",
                textManual: "Más del **70% de las personas tratadas** consiguen volar sin problemas. La investigación demuestra que la exposición es la mejor manera de superar las fobias."
            },
            conditions: {
                title: "Condiciones Ambientales",
                item1Manual: "Siéntese cómodamente en un lugar tranquilo.",
                item2Manual: "Luz tenue y sin interrupciones.",
                item3Manual: "**Uso obligatorio de auriculares** (preferiblemente que tapen toda la oreja).",
                item4Manual: "Ajuste el volumen para que el sonido sea real y potente.",
            },
            involvement: {
                title: "Implicación del usuario",
                textManual: "Usted debe jugar un papel activo. Intente sentirse como si lo estuviera VIVIENDO (implicación).",
                list1: "Máxima concentración: No separe la vista de la pantalla.",
                list2: "No quiera correr: Indique honestamente el grado de malestar.",
                list3: "No se detenga: No finalice una sesión hasta que la ansiedad haya bajado al menos a la mitad.",
            },
            tasksBetweenSessions: {
                title: "Tareas entre sesiones",
                textManual: "Es necesario completar la exposición con situaciones reales: ir al aeropuerto, mirar aviones o leer noticias sin evitarlas. Esto normaliza las sensaciones fuera del programa informático."
            }
        },
        prospectus: {
            title: "3. Guía de la Exposición (Prospecto)",
            indications: {
                title: "Indicaciones",
                textManual: "Indicado para adultos con fobia específica tipo situaciones (viajar en avión) o miedo a volar sin llegar a criterios de fobia."
            },
            adverseEffects: {
                title: "Posibles efectos adversos",
                textManual: "Se puede experimentar ansiedad durante la exposición, cansancio físico o psicológico, y dificultad para conciliar el sueño. Estos efectos son normales y forman parte del proceso de habituación."
            },
            advantages: {
                title: "Ventajas de utilizar el CAFFT",
                list: [
                    "No tener que esperar para el tratamiento.",
                    "Confidencialidad total.",
                    "Accesibilidad las 24h.",
                    "Seguimiento de sus propios avances.",
                    "Supervisión profesional a distancia."
                ]
            }
        },
        postTreatmentSection: {
            title: "4. Instrucciones para el Vuelo Real",
            introManual: "Una vez finalizado el programa, se recomienda realizar un vuelo en un plazo de 10 a 15 días.",
            instructionItem1Manual: "NO tome tranquilizantes ni antes ni durante el vuelo.",
            instructionItem2Manual: "NO ingiera bebidas alcohólicas.",
            instructionItem3Manual: "Siéntese donde le toque por azar.",
            instructionItem4Manual: "Evite hablar del miedo a volar los días previos.",
            instructionItem5Manual: "Utilice distractors naturales si quiere (leer, música), pero no para huir de la ansiedad.",
            instructionItem6Manual: "Acepte los nervios como parte del aprendizaje.",
            nervousnessAdviceManual: "Si se pone nervioso, piense que es una oportunidad para aplicar la habituación que ha practicado con el CAFFT.",
        },
        technicalSection: {
            title: "5. Información Técnica y Contraindicaciones",
            requirements: {
                title: "Requisitos",
                list: ["Ordenador con conexión a Internet.", "Auriculares de calidad.", "Navegador actualizado."],
                text: "Necesitas un ordenador con conexión a Internet y auriculares que filtren el aire exterior para una mejor inmersión."
            },
            contraindications: {
                title: "Contraindicaciones",
                text: "No realices el CAFFT sin consultar a un médico si:",
                list: ["Sufres alguna enfermedad cardíaca crónica.", "Estás en tratamiento psiquiátrico o tomando psicofármacos.", "Estás embarazada."]
            }
        },
        aiChatSection: {
            title: "Asistente Virtual IA",
        },
        therapistAiChatSection: {
            title: "Asistente Clínico IA",
        },
        therapistInfo: {
            title: "Información Científica y Guía Clínica",
            evidenceTitle: "Fundamentación Científica y Evidencia",
            evidenceText: "El CAFFT (**Computer-Assisted Fear of Flying Treatment**) es un programa de exposición simulada que recrea situaciones de vuelo mediante imágenes y sonidos reales. Múltiples ensayos controlados aleatorios (**Bornas et al., 2001, 2002, 2006; Tortella-Feliu et al., 2011; Botella-Arbona et al., 2004**) han demostrado:\n\n- **Eficacia:** Reducción significativamente mayor del miedo a volar comparado con lista de espera.\n- **Equivalencia:** Tan eficaz como la Realidad Virtual (**VRET**) e intervenciones multicomponente más largas.\n- **Mantenimiento:** Los éxitos se mantienen en seguimientos de **6 meses y 1 año**.\n- **Tasa de éxito:** Entre el **80% y el 90%** de los pacientes mejoran o se recuperan clínicamente.",
            mechanismTitle: "Mecanismos de Funcionamiento",
            mechanismText: "El tratamiento divide el viaje en etapas cronológicas (preparación, aeropuerto, despegue, vuelo, aterrizaje) y añade una etapa sobre accidentes para reducir la ansiedad catastrófica. El programa genera una jerarquía personalizada basada en el **QPV-II**. La **extinción** de la respuesta de miedo se logra mediante la **habituación** por exposición repetida.",
            metricsTitle: "Interpretación de Métricas",
            rciExplanation: "El Índice de Cambio Fiable (**RCI**) indica si el cambio en el QPV-II entre pre y post es clínicamente significativo (> 1.96).",
            slopeExplanation: "La pendiente de habituación (**slope**) indica la velocidad de habituación; una pendiente negativa pronunciada es señal de un proceso de extinción activo.",
            applicationTitle: "Guía de Aplicación Clínica",
            applicationText: "El terapeuta puede supervisar las sesiones o permitir la autoaplicación. Es **CRUCIAL** que el paciente se mantenga 'implicado' (viviendo la situación como real).\n\n- **Sin relajación:** Las técnicas de relajación **NO** deben usarse durante la exposición, ya que inhiben el aprendizaje de habituación.\n- **Criterio de éxito:** Repetir cada secuencia hasta que la ansiedad baje a niveles bajos (**1-2** en escala 1-9).\n- **Vuelo de graduación:** Se recomienda un vuelo real en los **15 días** posteriores al tratamiento para consolidar el aprendizaje.",
            faqTitle: "Resolución de Dudas (FAQs)",
            faqText: "- **¿Funciona para personas que evitan totalmente?** Sí, los ayuda a habituarse antes del vuelo real.\n- **¿Es mejor la Realidad Virtual?** La evidencia indica que el CAFFT es igual de eficaz y mucho más asequible y portable.\n- **¿Se puede hacer en casa?** Sí, versiones **autoaplicadas** han mostrado resultados similares cuando hay un seguimiento mínimo por parte del terapeuta.",
        }
    },
    managerDashboard: {
        addTherapistButton: "Añadir Terapeuta",
        addNewTherapistTitle: "Añadir Nuevo Terapeuta",
        table: {
            therapist: "Terapeuta",
            viewPatients: "Ver Pacientes"
        }
    },
    superadminDashboard: {
        allUsersTitle: "Todos los Usuarios",
        addUserButton: "Añadir Usuario",
        addNewUserTitle: "Añadir Nuevo Usuario",
        table: {
            user: "Usuario",
            role: "Rol",
            parent: "Superior",
            settings: "Configuración",
            actions: "Acciones"
        },
        form: {
            username: "Nombre de usuario",
            email: "Correo electrónico",
            password: "Contraseña",
            role: "Rol",
            assignToManager: "Asignar a un Gestor",
            none: "Ninguno"
        }
    },
    therapistDashboard: {
        ...caTranslations.therapistDashboard,
        kpi: {
            ...caTranslations.therapistDashboard.kpi,
            title_overview: "Resumen de Rendimiento (KPIs)",
            total_patients: "Total Pacientes",
            active_sessions: "Sesiones Activas",
            completed_programs: "Programas Completados",
            avg_improvement: "Mejora Media (QPV-II)",
            avg_exposure_time: "Tiempo Exp. Medio",
            total_sessions: "Sesiones Totales",
            sessions_rate: "Tasa de Sesiones",
            high_risk: "Pacientes en Riesgo",
            inactive_patients: "Inactivos (+3 días)",
        },
        criticalAlertsTitle: "Alertas de Seguimiento",
        table: {
            ...caTranslations.therapistDashboard.table,
            qpvii_latest: "QPV-II (Último)",
            rci: "RCI",
            significant_rci: "Significativo",
            remind: "Recordar",
            total_time: "Tiempo Total",
            sessions: "Sesiones",
            last_session_slope: "Última Pendiente",
            habituation_status: "Estado Habit.",
            notifications: "Notíf.",
            onboarding_tour: "Recorrido",
        },
        tooltips: {
            ...caTranslations.therapistDashboard.tooltips,
            toggleNotificationsOn: "Activar Notificaciones",
            toggleNotificationsOff: "Desactivar Notificaciones",
            toggleTourOn: "Activar Recorrido",
            toggleTourOff: "Desactivar Recorrido",
        },
        charts: {
            phaseDistribution: "Distribución por Fase",
            dailyActivity: "Actividad Diaria (Últimos 7 días)",
            sessionsStarted: "Sesiones Iniciadas",
            sessionsCompleted: "Sesiones Completadas",
            evaluations: "Evaluaciones QPV-II",
            actionsLabel: "acciones",
            sessionsPerDay: "Sesiones por Día",
            discomfortTrend: "Tendencia del Malestar",
        },
        patient_status: {
            new: "Nuevo",
            ready: "Listo",
            in_progress: "En Progreso",
            needs_review: "Revisión",
            completed: "Completado",
            stalled: "Estancado",
            dropping_out: "Riesgo de Abandono",
        },
        reminders: {
            sendReminderButton: "Enviar Recordatorio",
            reminderSentSuccess: "Se ha enviado el recordatorio correctamente.",
            inactivityBadge: "Inactivo ({days}d)",
            abandonmentRisk: "Riesgo de abandono prematuro",
        },
        aiConsultationsTitle: "Consultas de los Pacientes al IA Assistant",
        noAiConsultations: "Ninguno de tus pacientes ha realizado aún ninguna consulta al IA assistant.",
        patientLabel: "Paciente",
        queryLabel: "Pregunta",
        newConsultation: "Nueva Consulta",
        moreConsultations: "+ {count} más consultas en el registro",
    },
    patientDetail: {
        ...caTranslations.patientDetail,
        pageTitle: "Detalles del Paciente: {username}",
        currentPlanTitle: "Plan Terapéutico Actual",
        basedOnEvaluation: "Basado en evaluación del {date}",
        hierarchyTitle: "Jerarquía de Exposición",
        patientNotFound: "Paciente no encontrado.",
        noEvaluationsFound: "No se han encontrado evaluaciones.",
        sessionDetailsTitle: "Detalle de Sesiones y Secuencias",
        noExposureSessions: "Aún no se han registrado sesiones de exposición.",
        recommendationsTitle: "Insights Clínicos y Alertas",
        qpviiHistoryTitle: "Evolución QPV-II",
        communicationsTitle: "Comunicaciones con el Paciente",
        emailLogTitle: "Registro de Correos Enviados",
        noEmailsSent: "Aún no se han enviado correos automáticos.",
        viewEmailButton: "Ver",
        emailModalTitle: "Contenido del Correo",
        closeButton: "Cerrar",
        sessionDate: "Fecha de la Sesión",
        videosViewed: "Vídeos/Secuencias",
        avgDiscomfort: "Malestar Medio",
        habituationSlope: "Pendiente de Habituación",
        notificationsNotEnabled: "El paciente no ha activado las notificaciones.",
        ratingHistory: "Historial Valoraciones",
        videoTitle: "Estímulo / Vídeo",
        rating: "SUDS",
        session_time: "Tiempo Sesión",
        totalExposure_time: "Tiempo Total Exposición",
        sequenceBreakdown: "Secuencia por Sesión",
        abandonmentWarning: "ABANDONO ANTES DE HABITUAR",
        habituatedLabel: "Habituado",
        processingLabel: "Procesando",
        emailType: {
            invitation: "Invitación",
            reminder: "Recordatorio",
            follow_up: "Seguimiento",
            reinforcement: "Refuerzo",
        },
        recommendations: {
            noExposureDataForRecommendations: "Datos de exposición insuficientes para generar recomendaciones clínicas a medida.",
            noSignificantAlerts: "El progreso entra dentro de los parámetros clínicos esperados. Se produce procesamiento emocional.",
            stalledHabituation: "Reactividad persistente en {sceneName}. Conviene investigar posibles conductas de seguridad o resistencia.",
            highExposureVolume: "Volumen de práctica excelente. Indica alta adherencia al tratamiento.",
            effectiveHabituation: "Habituación muy efectiva. Se observa una reducción consistente del malestar.",
            dropoutRisk: "CRÍTICO: El paciente abandona las secuencias antes de una reducción significativa del SUDS. Riesgo de sensibilización.",
            irregularPractice: "Patrón de práctica irregular detectado. Considere enviar un recordatorio motivacional.",
        },
    },
    qpvii: {
        title: "Evaluación QPV-II",
        formTitle: "Cuestionario de Miedo a Volar (QPV-II)",
        instructions: "A continuación, encontrarás una lista de situaciones relacionadas con volar. Por favor, puntúa de 1 (nada) a 9 (muchísimo) el grado de miedo, ansiedad o malestar que te provocaría cada situación. Es importante que respondas a todas las preguntas.",
        nameLabel: "Nombre o identificador",
        dateLabel: "Fecha de la evaluación",
        scoreLabel: "Puntuación",
        submitButton: "Calcular Resultados",
        calculatingButton: "Calculando...",
        resultsTitle: "Resultados de tu Evaluación",
        generalDiscomfortScore: "Mucho miedo en general",
        subPreparatiusScore: "Preparativos del viaje",
        subVicariScore: "Noticias y accidentes",
        subVolScore: "Durante el vuelo",
        totalScore: "Puntuación Total",
        allFieldsRequiredError: "Por favor, rellena todos los campos y responde a todas las preguntas.",
        personName: "Persona evaluada",
        evaluationDate: "Fecha de la evaluación",
        backToFormButton: "Volver al Cuestionario",
        loginToSavePrompt: "Para guardar tus resultados y progreso, necesitas iniciar sesión o registrarte.",
        fillRandomlyButton: "Llenar aleatoriamente (para pruebas)",
        viewHierarchyButton: "Ver mi Jerarquía de Exposición",
        questions: {
            q0: "¿Qué grado de malestar, en general, le produce el hecho de volar en avión?",
            q1: "A mitad de vuelo tengo la sensación de que el avión reduce velocidad y después vuelve a acelerar.",
            q2: "Anuncian que en unos minutos aterrizaremos y que por tanto nos hemos de abrochar los cinturones de seguridad.",
            q3: "Dentro del avión mientras este está ganando altura.",
            q4: "Durante el vuelo oigo un ruido del avión que me parece extraño.",
            q5: "El avión acelera y noto cómo empieza a despegar.",
            q6: "El avión atraviesa una zona de nubes espesas y se mueve un poco más con las ráfagas de viento.",
            q7: "El avión desciende gradualmente y se aproxima a la pista de aterrizaje.",
            q8: "Cuando me levanto por la mañana, el día que tengo que coger el avión, veo que tendré que volar con mal tiempo.",
            q9: "En la terminal del aeropuerto me dirijo a sacar la tarjeta de embarque.",
            q10: "En pleno vuelo se nota como si el avión tuviera una ligera caída o “pasara por un bache”.",
            q11: "En un momento del vuelo el avión se mueve mucho.",
            q12: "Estoy en casa haciendo los preparativos para el viaje en avión.",
            q13: "Estoy en la sala de llegadas del aeropuerto a recibir a unos familiares o amigos.",
            q14: "Me dirijo en coche hacia el aeropuerto para coger el avión.",
            q15: "Estoy en mi casa o en el trabajo y en unos minutos saldré hacia el aeropuerto.",
            q16: "Me entero por los medios de comunicación de que un avión ha sufrido un pequeño accidente sin víctimas en un aeropuerto del estado español.",
            q17: "Me entero de que tengo que hacer un vuelo a la península o a otra de las islas (para los “no isleños”, entiendan un vuelo de una hora de duración como máximo).",
            q18: "Me he abrochado el cinturón de seguridad, el avión comienza a coger velocidad, rodando por la pista, y noto cómo empieza a levantarse el morro del aparato iniciando el despegue.",
            q19: "En la maniobra de aterrizaje, noto cómo las ruedas del avión contactan con la superficie de la pista.",
            q20: "Noto el frenazo del avión durante el aterrizaje.",
            q21: "Oigo por la radio o leo en los periódicos que un avión ha sufrido un grave accidente con víctimas mortales.",
            q22: "Sentado en la sala de embarque esperando que abran la puerta para subir al avión.",
            q23: "Sentado en mi asiento con el avión parado esperando para iniciar el vuelo, observo la demostración de las medidas de seguridad que hacen las azafatas de la compañía aérea.",
            q24: "Subo la escalerilla de acceso al avión o voy caminando por el pasillo elevado que me lleva al avión.",
            q25: "Todo parece tranquilo pero en pleno vuelo se nos indica la necesidad de abrocharnos el cinturón de seguridad.",
            q26: "Veo por TV las imágenes de una catástrofe aérea.",
            q27: "Cuando me voy a acostar la noche anterior al vuelo.",
            q28: "Voy por la carretera y veo un avión que despega del aeropuerto.",
            q29: "Mirando una película aparece una escena del vuelo de un avión.",
            q30: "Durante el aterrizaje, mientras el avión va frenando sobre la pista, siento que mi cuerpo se desplaza hacia adelante.",
        }
    },
    scientificFoundation: {
        title: "Fundamentos Científicos del CAFFT",
        introduction: "El programa CAFFT no es una solución arbitraria; está basado en décadas de investigación en psicología clínica y psicopatología. Su eficacia se ha validado mediante estudios rigurosos publicados en revistas científicas internacionales. A continuación, se presentan algunas de las publicaciones clave que sustentan este tratamiento.",
        referencesTitle: "Publicaciones de Referencia",
    },
    exposureHierarchy: {
        pageTitle: "Mi Jerarquía de Exposición",
        introText: "Esta es tu secuencia personalizada de exposición, basada en tus resultados del QPV-II. Comenzarás por la situación menos ansiógena y avanzarás gradualmente. Puedes comenzar el tratamiento cuando estés listo.",
        hierarchyLogicTitle: "¿Cómo se ha calculado?",
        hierarchyLogicText: "El orden se determina calculando la media de ansiedad de cada grupo de situaciones (Preparativos, Vuelo, Noticias) según tus respuestas. Se ordenan de menor a mayor malestar para garantizar una progresión segura.",
        videoSequenceTitle: "Secuencia de Vídeos",
        startExposureButton: "Comenzar Exposición",
        exitButton: "Volver a la Evaluación",
        videoItemTitle: "{index}. {title}",
        noVideosInSequence: "No se ha podido generar una secuencia de vídeos. Por favor, vuelve a realizar la evaluación.",
    },
    privacyPolicy: {
        title: "Política de Privacidad",
        lastUpdated: "Última actualización: {date}",
        introduction: "Esta política de privacidad describe cómo se recogen, utilizan y protegen tus datos personales cuando utilizas la aplicación CAFFT.",
        dataCollectedHeader: "Datos que Recopilamos",
        dataCollectedText: "Recopilamos la información que nos proporcionas directamente:",
        username: "Nombre de usuario: para identificarte en la aplicación.",
        emailAddress: "Dirección de correo electrónico: para la recuperación de contraseña y comunicaciones.",
        hashedPassword: "Contraseña cifrada: nunca almacenamos tu contraseña en texto plano.",
        qpviiResults: "Resultados del QPV-II y progreso de exposición: para personalizar tu tratamiento y seguir tu evolución.",
        consentStatus: "Estado del consentimiento: para confirmar que has aceptado esta política.",
        howDataUsedHeader: "Cómo Utilizamos tus Datos",
        howDataUsedText: "Utilizamos tus datos exclusivamente para:",
        accountManagement: "Gestionar tu cuenta y el progreso dentro del programa.",
        howDataUsedItem1: "Proporcionarte una experiencia de tratamiento personalizada.",
        howDataUsedItem2: "Permitirte seguir tu evolución a lo largo del tiempo.",
        dataStorageHeader: "Almacenamiento de Datos",
        dataStorageText: "Todos los datos se guardan localmente en tu navegador mediante la API de Web Storage. No se envían a ningún servidor externo.",
        userRightsHeader: "Tus Derechos",
        userRightsText: "Puedes borrar todos tus datos en cualquier momento limpiando los datos del sitio web en tu navegador.",
        userRightsGDPR: "De acuerdo con el GDPR, tienes derecho a acceder, rectificar, borrar y limitar el procesamiento de tus datos.",
        securityHeader: "Seguridad",
        securityText: "Tu contraseña se almacena utilizando un algoritmo de hash seguro (SHA-256).",
        contactHeader: "Contacto",
        contactText: "Si tienes alguna pregunta sobre esta política de privacidad, contacta con nosotros a través del correo del Espacio de Bienestar Psicológico.",
        demoDisclaimer: "Esta es una aplicación de demostración e investigación. Toda la información proporcionada se basa en contenido científico y clínico.",
    },
    exposure: {
        pageTitle: "Sesión de Exposición",
        startExposureButton: "Comenzar Exposición",
        videoProgress: "Vídeo {current} de {total}",
        exposureComplete: "¡Secuencia de exposición completada!",
        restartExposureButton: "Volver a empezar la secuencia",
        videoNotAvailable: "El vídeo no se ha podido cargar. Comprueba tu conexión o contacta con el soporte.",
        videoTagNotSupported: "Tu navegador no soporta la etiqueta de vídeo.",
        downloadVideo: "Descargar Vídeo",
        ev001_title: "Preparativos del Viaje",
        ev001_desc: "Simula los momentos previos al viaje, como hacer la maleta y planificar el trayecto al aeropuerto.",
        ev002_title: "Embarque",
        ev002_desc: "Recorre la entrada del aeropuerto, pasa el control de seguridad y sube al avión.",
        ev003_title: "Despegue",
        ev003_desc: "Experimenta la secuencia completa de despegue desde dentro del avión.",
        ev004_title: "Durante el Vuelo",
        ev004_desc: "Observa el exterior desde la ventana durante un vuelo tranquilo.",
        ev005_title: "Aterrizaje",
        ev005_desc: "Vive la maniobra de aproximación y aterrizaje desde tu asiento.",
        ev006_title: "Noticias sobre Accidentes",
        ev006_desc: "Afronta la ansiedad vicaria escuchando o viendo noticias sobre incidentes aéreos.",
        ev007_title: "Turbulencias Fuertes",
        ev007_desc: "Experimenta la sensación de turbulencias fuertes dentro del avión en un entorno seguro.",
        ev008_title: "Noticias de Accidentes (II)",
        ev008_desc: "Escenas adicionales sobre incidentes aéreos para profundizar en la habituación vicaria.",
        discomfortRatingModalTitle: "Valora tu Malestar",
        discomfortRatingInstruction: "En una escala de 1 a 10, ¿cuál ha sido tu nivel máximo de miedo o malestar durante el vídeo '{videoTitle}'?",
        discomfortRatingSaveButton: "Guardar Valoración",
        discomfortRatingErrorNoSelection: "Por favor, selecciona una valoración.",
        discomfortRatingMinLabel: "Nada de malestar",
        discomfortRatingMaxLabel: "Malestar extremo",
        progressionMessageSuccess: "¡Bien hecho! Has reducido tu malestar. Preparado/a para el siguiente paso.",
        progressionMessageLastVideoSuccess: "¡Excelente! Has completado el último vídeo de tu jerarquía.",
        progressionMessageRetry: "Aún sientes un malestar elevado ({current}). Es normal. Para superar el miedo, necesitamos que tu aprendizaje se estabilice mediante la habituación: esto se logra repitiendo el vídeo sin evitar las sensaciones de ansiedad hasta que estas disminuyan de forma natural. Por ello, te recomendamos volver a ver este mismo vídeo hasta que el malestar baje al menos a la mitad de tu máxima puntuación ({max} -> {target}). El objetivo ideal es llegar a un nivel de 2 o inferior para asegurar que el aprendizaje es sólido. Recuerda implicarte y no usar técnicas de distracción.",
        finishExposureSessionButton: "Finalizar Sesión de Exposición",
        reviewSessionTitle: "Sesión de Repaso",
        finishReviewButton: "Finalizar Repaso",
        logoutButton: "Salir y guardar el progreso",
        logoutWarning: "Tu última valoración de malestar ha sido alta ({current}). Para que la terapia sea efectiva y tu cerebro se habitúe, es crucial no interrumpir la exposición cuando la ansiedad es elevada. Te recomendamos continuar hasta que el malestar disminuya al menos a la mitad de la puntuación máxima (bajar de {max} a {target} o menos). El objetivo óptimo de habituación es llegar a un nivel de 2. ¿Quieres salir igualmente?",
        continueExposure: "Continuar Exposición",
        videoLoadErrorTitle: "Error de Carga del Vídeo",
        videoLoadErrorBody: "No se ha podido cargar el vídeo. La causa más probable es que el archivo no se encuentra en la ubicación esperada (public/videos_cafft/).",
        videoLoadErrorChecklist: "Por favor, comprueba que el archivo de vídeo existe y que el formato es compatible.",
        testWithDemoVideoButton: "Probar con Vídeo Demo",
        simulateViewingButton: "Simular Visualización",
        sessionProgressTitle: "Progreso de la Sesión",
        videosCompleted: "Completados",
        ratingHistory: "Historial de Malestar",
        preparation: "Preparación",
        boarding: "Embarque",
        takeoff: "Despegue",
        inflight: "En Vuelo",
        landing: "Aterrizaje",
        accidents: "Accidentes",
        psychoed: "Psicoeducación",
    },
    evolution: {
        pageTitle: "Mi Evolución",
        qpviiEvolutionChartTitle: "Evolución de las Puntuaciones QPV-II",
        totalScoreEvolution: "Puntuación Total",
        malestarGeneralEvolution: "Malestar General",
        subPreparatiusEvolution: "Preparativos",
        subVicariEvolution: "Vicario",
        subVolEvolution: "Vuelo",
        noHistoryForChart: "Necesitas al menos {count} evaluaciones para ver tu evolución.",
        preTreatment: "Pre-Tratamiento",
        postTreatment: "Post-Tratamiento",
        exposureTitle: "Historial de Exposición",
        habituationExplanationTitle: "¿Qué es la Habituación?",
        habituationExplanationText: "La habituación es un proceso de aprendizaje en el que tu respuesta emocional (qué sientes, piensas y haces) a un estímulo (como uno de los vídeos del programa) disminuye tras una exposición repetida. Al ver los vídeos varias veces, aprendes que no hay una amenaza real, y tu ansiedad se reduce progresivamente. Estos gráficos muestran cómo tu malestar baja con cada repetición.",
        noExposureData: "Aún no has realizado ninguna sesión de exposición.",
        intraSessionEvolution: "Evolución Intra-Sesión",
        sessionDate: "Sesión del {date}",
        videoAttemptsLabel: "Intentos de Vídeo",
        videoCompleted: "Completado",
        videoNotCompleted: "No Completado",
        noDiscomfortRatingsRecorded: "No se han registrado valoraciones de malestar para esta sesión.",
        sceneHabitutationSummaryTitle: "Resumen de Habituación por Escena",
        detailedHabitutationTitle: "Evolución Detallada por Escena",
        sceneHabitutationSummaryExplanation: "Esta visualización agrupa todos los datos de malestar de cada escena para ver tu habituación global a situaciones específicas.",
        finishProgramButton: "Finalizar Programa",
        reviewScenesButton: "Repasar Escenas",
        reviewSessionLabel: "Repaso",
        finishSessionButton: "Finalizar Sesión",
        sessionCompleteTitle: "¡Sesión Completada!",
        sessionCompleteText: "Has acabado con éxito todos los vídeos de tu jerarquía. Puedes hacer una evaluación final o repasar alguna escena.",
        reEvaluateButton: "Hacer la Evaluación Final",
        sessionPausedTitle: "Sesión Pausada",
        sessionPausedText: "Puedes retomar tu sesión de exposición cuando quieras.",
        resumeSessionButton: "Retomar Sesión",
        logoutButton: "Salir",
        goToHomeButton: "Volver al Inicio",
        rciTitle: "Indicador de Cambio Clínico (RCI)",
        rciExplanation: "El Indicador de Cambio Fiable muestra si tu mejora es realmente significativa desde el punto de vista terapéutico.",
        rciMathInfo: "Cálculo basado en QPV-II: {pre} (pre) vs {post} (post)",
        rciStatusSignificant: "Cambio Significativo Detectado",
        rciStatusNotSignificant: "Cambio en curso",
        rciLabel: "Resultado del Tratamiento",
        ratingAxisLabel: "Ansiedad (0-10)",
        scoreAxisLabel: "Puntuación QPV-II",
        programCompleteSuccessMessage: "Has completado un hito importante. Puedes ver tu evolución y después celebrar la finalización, repasar algunas escenas o finalizar la sesión.",
        prePostComparisonTitle: "Comparativa Pre vs Post Tratamiento",
        differenceLabel: "Diferencia",
        rciMissingDataMessage: "Se requieren al menos dos evaluaciones QPV-II (pre y post) para calcular el Índice de Cambio Fiable (RCI).",
        globalEvolutionTitle: "Resumen de tu Progreso Terapéutico",
        totalSessions: "Sesiones Totales",
        totalVideos: "Total Vídeos",
        globalHabituation: "Grado de Habituación General",
        habituationStrength: "Fuerza de la Habituación",
        habituationStrengthExplanation: "Este valor indica la efectividad de tu aprendizaje: cuanto más alto es, más rápido y profundamente estás procesando el miedo y reduciendo la ansiedad.",
        globalSceneTrendTitle: "Evolución de la Ansiedad por Escena",
        globalTrendExplanation: "Esta gráfica muestra cómo evoluciona la media de ansiedad en cada escena a través de todas las sesiones.",
        habituationProgressTitle: "Progreso de la Habituación",
        habituationProgressExplanation: "Muestra la reducción del malestar (diferencia entre el inicio y el final) conseguida en cada sesión.",
        discomfortReduction: "Reducción del Malestar",
        averageDiscomfort: "Malestar Medio",
        habituationSlope: "Velocidad de mejora",
        videosWatched: "Vídeos Vistos",
        sessionDetails: "Detalles de la Sesión",
        slopeImproving: "Mejorando",
        slopeStable: "Estable",
        slopeWorsening: "Empeorando",
        needMoreDataTitle: "Aún estamos recogiendo datos",
        needMoreDataDesc: "Para mostrar estadísticas de progreso significativas y gráficas de tendencia, necesitas completar al menos {count} sesiones de exposición con valoraciones de malestar.",
        habituation: "Habituación",
        habituationStatus: "Estado de la Habituación",
        habituationProgress: "Progreso de la Habituación",
        feedbackImproving: "Te estás habituando, el malestar se está reduciendo.",
        feedbackStable: "Vas bien, pero es necesario practicar más. Continúa exponiéndote.",
        feedbackWorsening: "Es importante no parar ahora. Si no mejoras, habla con tu terapeuta.",
        sceneHabituationChartTitle: "Habituación: {sceneName}",
        scene_psychoed: "Psicoeducación",
        scene_preparation: "Preparación",
        scene_boarding: "Embarque y Rodaje",
        scene_takeoff: "Despegue",
        scene_inflight: "Vuelo",
        scene_landing: "Aterrizaje",
        scene_accidents: "Vicario (Accidentes)",
        sceneExposureInstanceAxisLabel: "Intento",
        watchedVideoTooltipLabel: "Vídeo visto",
    },
    aiChat: {
        pageTitle: "Asistente IA",
        disclaimer: "Este es un asistente automático. La información puede no ser exacta. En caso de duda, consulta a un profesional.",
        initialMessage: ["¡Hola! Soy {assistantName}, tu co-terapeuta. ¿En qué puedo ayudarte hoy?", "¡Hola {username}! Soy {assistantName}. ¿Cómo están tus ánimos hoy?", "¡Hola! Soy {assistantName}. Estoy aquí para ayudarte con tu miedo a volar. ¿Qué necesitas?"],
        initialMessageCompleted: ["¡Hola, {username}! Soy {assistantName}. He revisado tu progreso y estoy listo para tus sesiones de exposición. ¿Cómo te sientes?", "¡Hola! Soy {assistantName}. ¿Quieres que continuemos con tus sesiones o prefieres comentar alguna duda?", "¡Buenas, {username}! Soy {assistantName}. ¿En qué puedo ayudarte hoy?"],
        inputPlaceholder: "Escribe aquí...",
        sendButton: "Enviar",
        systemInstruction: "Eres el asistente experto del CAFFT (investigación UIB). REGLA CRÍTICA: Respuestas muy BREVES, DIRECTAS y NATURALES (máximo 1-2 frases). No pidas NUNCA cosas que el usuario ya ha hecho (como el QPV-II si ya consta como hecho). Prioriza el texto. Enlaces markdown (ej. [Exposición](/exposure), [Centro de Ayuda](/help-center)) solo si son el siguiente paso lógico. ESTADO ACTUAL QPV-II: {hasCompletedQPVII}. CONTEXTO DEL PACIENTE: {therapeuticContext}.",
        therapistSystemInstruction: "Eres el Asistente de Soporte Clínico para terapeutas del programa CAFFT (Investigación de la UIB). Tu rol es ayudar a los terapeutas a interpretar datos y optimizar el proceso, basándote en la evidencia científica. MISIONES: 1. Interpretar métricas: RCI (valor > 1.96 para ser significativo), pendientes de habituación (negativo es bueno) y tendencias de SUDS. 2. Funciones de software: Guía sobre [gestión de pacientes](/therapist/patients), [notificaciones](/therapist/notifications) y [jerarquía de exposición](/therapist/dashboard). 3. Ajuste Clínico: Sugiere ajustes basados en la evidencia (Bornas et al., 2001, 2006). Recuerda la importancia de la exposición pura sin relajación. REGLA CRÍTICA: Incluye siempre enlaces markdown relevantes. Máximo 4 frases técnicas.",
        therapistInitialMessage: "Hola, {username}. ¿Cómo puedo ayudarte hoy en la gestión de tus pacientes o en el funcionamiento técnico del CAFFT?",
        assistantNameTitle: "¿Cómo se llama tu co-terapeuta?",
        assistantNamePlaceholder: "Escribe un nombre...",
        genderNeutralSuggestions: ["Álex", "Ari", "Dani", "Cris", "Ariel", "Sasha", "Noa", "Eden", "Kai", "Cruz", "Guadalupe", "Rosario", "Trinidad"],
        saveName: "Guardar",
        reconnectButton: "Reconectar",
        connecting: "Conectando con el asistente...",
        changeName: "Cambiar nombre",
        moment: {
            pre: "El paciente aún no ha comenzado el tratamiento (fase de información o dudas iniciales).",
            during: "El paciente está realizando las sesiones de exposición graduada.",
            maintenance: "El paciente ha completado el programa de exposición y está pendiente de realizar su próximo vuelo real.",
            post: "El paciente ya ha volado y está en fase de seguimiento post-tratamiento.",
        },
        reminder: {
            emailSubject: "Te echamos de menos en CAFFT",
            emailBody: "Hola {username}, hace unos días que no realizas ninguna sesión de exposición. Recuerda que la constancia es clave para superar el miedo. ¡Te esperamos!",
            notificationSent: "Se ha enviado un recordatorio al paciente.",
            webappMessage: "¡Hola {username}! Hace {days} días que no realizas ninguna sesión. Recuerda que la clave del éxito es la práctica constante. ¡Te animamos a hacer una pequeña sesión hoy!"
        },
        followUp: {
            firstSession: "¡Enhorabuena por tu primera sesión, {username}! Has dado el primer paso, el más difícil. ¡Sigamos adelante!",
            halfway: "¡Ya has completado la mitad del camino, {username}! Estás demostrando una gran valentía. Pronto el miedo será solo un recuerdo.",
            reducedFear: "¡Increíble progreso, {username}! Tu nivel de ansiedad ha bajado claramente en las últimas sesiones. Has pasado de {firstSuds} a {latestSuds}. ¡Estás dominando el miedo!",
            mostDifficult: "Has superado uno de tus mayores retos hoy, {username}. Estoy muy orgulloso/a de ti. ¡Eres más fuerte de lo que pensabas!",
            maintenanceStarted: "¡Has llegado a la fase final, {username}! Ahora solo queda mantener estos logros antes de tu próximo vuelo. ¡Lo tienes cerca!",
        }
    },
    onboarding: {
        stepCounter: "Paso {current} de {total}",
        startManual: "Hacer el Recorrido",
        next: "Siguiente",
        prev: "Anterior",
        finish: "Finalizar",
        step1: {
            title: "Bienvenido al CAFFT",
            content: "Aquí comienza tu proceso de superación. Desde esta página de inicio podrás acceder a la información clave sobre el programa."
        },
        step2: {
            title: "Evaluación QPV-II",
            content: "El primer paso es conocer tu punto de partida. La evaluación QPV-II nos ayuda a personalizar tu tratamiento."
        },
        step3: {
            title: "Jerarquía de Exposición",
            content: "Aquí accederás a los vídeos de exposición gradual. Afrontarás escenas desde la preparación hasta el vuelo real."
        },
        step4: {
            title: "Tu Evolución",
            content: "Haz un seguimiento visual de tu progreso. Aquí verás cómo reduces la ansiedad sesión tras sesión."
        },
        step5: {
            title: "Centro de Ayuda",
            content: "Aquí encontrarás toda la documentación y vídeos de soporte para resolver tus dudas sobre el programa."
        },
        step6: {
            title: "Asistente Virtual",
            content: "Siempre que tengas dudas, puedes consultar nuestro asistente IA en el botón de la esquina inferior derecha."
        },
        therapist: {
            step1: { title: "Dashboard", content: "Aquí tienes una visión general del progreso de todos tus pacientes de un vistazo." },
            step2: { title: "Gestión de Pacientes", content: "Puedes añadir nuevos pacientes o gestionar sus datos desde aquí." },
            step3: { title: "Actividad Reciente", content: "Monitoriza las últimas sesiones realizadas por tus pacientes." },
            step4: { title: "Navegación", content: "Utiliza el menú lateral para acceder a la lista completa de pacientes y sus notificaciones." },
            step5: { title: "Centro de Ayuda", content: "Encuentra documentación clínica y guías de usuario para resolver dudas rápidamente." },
            step6: { title: "Soporte IA", content: "Tienes el asistente IA a mano para analizar casos complejos o métricas clínicas." }
        }
    },
    cafftIntroPage: {
        title: "Introducción al Programa CAFFT",
        welcomeMessage: "¡Bienvenido/a, {username}!",
        explanationText: "Estás a punto de comenzar un programa diseñado para ayudarte a superar el miedo a volar. Antes de comenzar, te recomendamos ver este breve vídeo que explica los fundamentos del tratamiento. Después, procederás a tu primera evaluación.",
        videoTitle: "Vídeo Introductorio de CAFFT",
        proceedButton: "Entendido, ir a la Evaluación",
    },
    helpVideos: {
        title: "Vídeos de Ayuda y Preguntas Frecuentes",
        pageTitle: "Vídeos de Ayuda",
        videos: [
            { titleKey: "q1", link: "https://www.youtube.com/watch?v=A3eIDb9_2Vo" },
            { titleKey: "q2", link: "https://www.youtube.com/watch?v=28y1fW0_hyY" },
            { titleKey: "q3", link: "https://www.youtube.com/watch?v=7X3H4Ase2y8" },
            { titleKey: "q4", link: "https://www.youtube.com/watch?v=vV239mzG3sM" },
        ],
        q1: "¿Por qué es importante la exposición pura sin relajación?",
        q2: "¿Qué son las turbulencias y por qué no son peligrosas?",
        q3: "¿Cómo mantener la implicación durante los vídeos?",
        q4: "¿Qué pasa si siento mucha ansiedad durante un vídeo?",
        noVideos: "Actualmente no hay vídeos de ayuda disponibles.",
    },
    feedback: {
        pageTitle: "Feedback del Programa",
        ratingLabel: "Valoración",
        typeLabel: "Tipo de Comentario",
        types: {
            bug: "Error / Problema",
            improvement: "Mejora Sugerida",
            testimonial: "Testimonio / Experiencia",
            other: "Otro"
        },
        commentLabel: "Comentarios",
        commentPlaceholder: "Cuéntanos más sobre tu experiencia o sugerencia...",
        submitButton: "Enviar Feedback",
        successMessage: "¡Gracias por tu feedback! Nos ayuda a mejorar CAFFT.",
        errorMessage: "Hubo un error al enviar el feedback. Inténtalo de nuevo.",
        recentTestimonialsTitle: "Testimonios Recientes",
        anonymousUser: "Usuario en prácticas"
    },
    general: {
        readMore: "Leer más",
        by: "por",
        help: "Ayuda",
        or: "o",
        confirmExit: "Confirmar salida",
        cancel: "Cancelar",
        errorDetails: "Detalles del error",
        unknown: "Desconocido",
        none: "Ninguno",
        roles: {
            manager: "Manager",
            therapist: "Terapeuta",
            superadmin: "Superadmin",
            patient: "Paciente"
        }
    },
    exposureExplanation: {
        ...caTranslations.exposureExplanation,
        pageTitle: "Explicación de la Exposición",
        section1Text: "Tu cuerpo reacciona como si hubiera un peligro real, pero en un avión comercial moderno, el peligro es extremadamente bajo. Estás reentrenando tu conducta y regulando tus emociones.",
        section2TextHabituation: "La habituación es un proceso de aprendizaje en el que tu respuesta emocional (qué sientes, piensas y haces) a un estímulo (como uno de los vídeos del programa) disminuye tras una exposición repetida. Al ver los vídeos varias veces, aprendes que no hay una amenaza real, y tu ansiedad se reduce progresivamente. Estos gráficos muestran cómo tu malestar baja con cada repetición.",
        proceedButton: "Entendido, quiero empezar",
    },
    celebration: {
        pageTitle: "¡Felicidades!",
        congratulations: "¡Enhorabuena, {username}!",
        messageBody: "Has completado el programa CAFFT. Esto es un gran paso hacia la superación de tu miedo.",
        achievementsHeader: "Logros",
        achievement1: "Has completado toda la jerarquía de exposición.",
        achievement2: "Has aprendido a gestionar la ansiedad.",
        achievement3: "Estás más preparado para volar.",
        nextStepsHeader: "Próximos pasos",
        nextStep1: "Planifica un vuelo real pronto.",
        nextStep2: "Repasa las pautas post-tratamiento.",
        nextStep3: "Si lo necesitas, vuelve a utilizar el programa.",
        returnHomeButton: "Volver al inicio",
        logoutButton: "Salir",
        viewFlightInstructionsButton: "Ver pautas de vol",
    },
    lastSession: {
        pageTitle: "Sesión Finalizada",
        pageSubtitle: "Has llegado al final de tu jerarquía.",
        header: "Pautas para el futuro",
        intro: "Aquí tienes algunas recomendaciones finales.",
        checklistItem1: "Repasa lo que has aprendido.",
        checklistItem2: "No te autoexijas perfección.",
        checklistItem3: "Vuela cuando puedas.",
        checklistItem4: "Acepta la incertidumbre.",
        checklistItem5: "Cuida tu estrés general.",
        checklistItem6: "Recuerda tus éxitos.",
        checklistItem7: "Mantén hábitos saludables.",
        checklistItem8: "Pide ayuda si recaes.",
        finalAdviceTitle: "Un último consejo",
        finalAdviceText: "El miedo puede volver a aparecer, pero ahora tienes herramientas para afrontarlo.",
        actionsTitle: "¿Qué quieres hacer ahora?",
        reviewButton: "Repasar (si es necesario)",
        reviewButtonTooltip: "Vuelve a ver algunas escenas",
        reviewDoneButton: "Repaso completado",
        reviewDoneButtonTooltip: "Ya has hecho el repaso",
        evaluationButton: "Evaluación Final",
        evaluationButtonTooltip: "Haz el QPV-II para ver tu progreso final",
    },
};

const enTranslations: TranslationContent = {
    ...caTranslations,
    appName: "Computer Assisted Fear of Flying Treatment (CAFFT)",
    appNameShort: "CAFFT",
    common: {
        ...caTranslations.common,
        time: {
            ...caTranslations.common.time,
            ago: "{val} {unit} ago",
            year: "year",
            month: "month",
            day: "day",
            hour: "hour",
            minute: "min",
            second: "sec",
            years: "years",
            months: "months",
            days: "days",
            hours: "hours",
            minutes: "mins",
            seconds: "secs",
            session: "session",
            sessions: "sessions",
        }
    },
    home: {
        title: ["Computer Assisted", "Fear of Flying", "Treatment", "(CAFFT)"],
        subtitle: "A self-applied treatment program for fear of flying, based on exposure techniques and backed by decades of research at the University of the Balearic Islands.",
        firstEdition: "First Edition: 1999",
        version: "Version 5.1",
        startButton: "Start Program",
    },
    progress: {
        programTitle: "Your CAFFT Journey",
        intro: "Welcome",
        assessment_pre: "Assessment",
        exposure: "Training",
        assessment_post: "Results",
        complete: "Success"
    },
    informedConsent: {
        title: "Initial Evaluation",
        dob: "Date of Birth",
        gender: "Gender",
        genderMale: "Male",
        genderFemale: "Female",
        genderOther: "Other",
        occupation: "Occupation",
        occupationStudent: "University student (degree, postgraduate, master, doctorate)",
        occupationPTAGS: "PTAGS",
        occupationPDI: "PDI",
        occupationOther: "Other",
        source: "How did you hear about the Psychological Well-being Clinic?",
        sourceWeb: "Via Web",
        sourceUnitatMedica: "Prevention Service (Medical Unit)",
        sourceNecessitats: "Support Office for People with Educational Needs",
        sourceProfesor: "Teaching Staff Recommendation",
        sourceUser: "User Recommendation",
        sourceFriend: "Friend/Acquaintance Recommendation",
        sourceOther: "Other",
        consentDate: "Informed Consent Date",
        consentText: "I give my consent for the processing of my personal data by the Psychological Well-being Space (EBP) of the University of the Balearic Islands (EBP-UIB), according to the following conditions:\n\nThe EBP-UIB has three fundamental objectives: to provide a psychological care service, to contribute to research in psychopathology and clinical psychology, and to help in the practical training of Psychology degree students and the Master in General Health Psychology. In my case, I request a psychological care consultation and, therefore, I commit to provide the information, complete the tests and perform the tasks required of me, so that those responsible for the EAB-UIB can attend to my consultation in the best possible way.\n\nI am fully aware that:\na. All data will be treated with respect for my privacy and in accordance with current data protection regulations.\nb. I have the right to access, rectification, opposition, deletion, portability and limitation of the processing of my data, and I can exercise these rights by means of a request at any time.\nc. My data may be used in works of a scientific nature, but in these cases their anonymity will always be guaranteed, and in no case will they be transferred to third parties without my consent.\nd. Psychology is not an exact science and psychological treatment does not ensure improvement. During the course of the intervention, I may experience discomfort and shifts in mood. My participation in the intervention protocol is totally voluntary, and I am free to withdraw at any time.",
        consentAcceptLabel: "I give my consent",
        studentsPresence: "I accept that for training reasons students may be present during the psychological counseling sessions.",
        legalText: "In compliance with the provisions of Regulation (EU) 2016/679 (GDPR) and Organic Law 3/2018, of December 5 (LOPDGDD), we inform you that the data collected will be included in one or more files managed by the UIB in the processing activity record enabled for this purpose, the purpose of which is to manage your request. The data requested are necessary to fulfill the aforementioned purpose and, therefore, failure to obtain them prevents its achievement. The UIB is responsible for processing the data and, as such, guarantees your rights of access, rectification, opposition, deletion, portability, limitation of treatment, and not to be the subject of automated individual decisions regarding the data provided and processed. To exercise the indicated rights, you must write to: University of the Balearic Islands, General Secretariat, for the attention of the data protection officer, Ctra. de Valldemossa, km 7.5, 07122 Palma (Balearic Islands) or to the email address dpo@uib.es. You also have the right to claim before the control authority at: https://www.aepd.es. In the same way, the UIB commits to respect the confidentiality of your data and to use them in accordance with the purpose for which they were collected.",
        conformityTitle: "As proof of conformity, I accept this consent.",
        yes: "Yes",
        no: "No",
        select: "Select..."
    },
    nav: { ...caTranslations.nav, home: "Home", fearOfFlying: "Fear of Flying", cafftProgram: "Program", qpviiEvaluation: "Evaluation", exposure: "Exposure", login: "Login", register: "Register", profile: "Profile", logout: "Logout", privacyPolicy: "Privacy Policy", cafftIntro: "Home", forgotPasswordLink: "Forgot Password?", evolution: "Evolution", exposureHierarchy: "Exposure Hierarchy", exposureExplanation: "Exposure Explanation", lastSession: "Final Session", therapistDashboard: "Therapist Dashboard", managerDashboard: "Manager Dashboard", superadminDashboard: "Superadmin Dashboard", patients: "Patients", therapists: "Therapists", managers: "Managers", therapistNotifications: "Notifications", scientificEvidence: "Scientific Evidence", helpCenter: "Help", help: "Help", addUser: "Add User", addTherapist: "Add Therapist", save: "Save", cancel: "Cancel" },
    userGuide: {
        title: "User Guide",
        introduction: "This guide provides important information about requirements, usage, and advantages of the CAFFT program.",
        requirements: {
            title: "Requirements",
            computer: "Computer with Internet connection and updated web browser.",
            headphones: "Headphones for an immersive audio experience.",
            skills: "Basic computer skills.",
        },
        beforeUse: {
            title: "Before using CAFFT",
            adverseEffects: "Treatment may cause temporary adverse effects, similar to anxiety symptoms.",
            mostFrequent: ["Anxiety", "Restlessness", "Muscle tension", "Worry", "Irritability"],
            mostSerious: ["A panic attack may occur, although it is uncommon."],
            doNotUseIf: [
                "You are receiving another psychological treatment for fear of flying.",
                "You suffer from a psychotic, bipolar, or severe personality disorder.",
                "You have photosensitive epilepsy.",
                "You have suicidal thoughts.",
            ],
        },
        howToUse: {
            title: "How to Use the Program",
            text: "Follow the steps indicated in the application: start with the introduction, complete the QPV-II evaluation honestly, and then follow your personalized exposure hierarchy. It is crucial to stay at each step until your anxiety is significantly reduced (at least by half) before moving to the next one.",
        },
        advantages: {
            title: "Advantages of CAFFT",
            items: [
                "Effectiveness demonstrated in scientific studies.",
                "Accessibility from anywhere with Internet.",
                "Anonymity and privacy.",
                "Full user control over treatment pace.",
                "Cost-effectiveness compared to traditional therapies.",
                "24/7 availability.",
                "Reduction of geographical barriers.",
                "Based on cognitive-behavioral techniques, the treatment of choice for phobias.",
            ],
        }
    },
    postTreatment: {
        instructionsTitle: "4. Instructions for the Real Flight",
        introManual: "Once the program is finished, it is recommended to take a flight within 10 to 15 days.",
        instructionItem1Manual: "DO NOT take tranquilizers either before or during the flight.",
        instructionItem2Manual: "DO NOT consume alcoholic beverages.",
        instructionItem3Manual: "Sit wherever you are assigned by chance.",
        instructionItem4Manual: "Avoid talking about the fear of flying in the preceding days.",
        instructionItem5Manual: "Use natural distractors if you wish (reading, music), but not to escape from anxiety.",
        instructionItem6Manual: "Accept the nerves as part of the learning process.",
        nervousnessAdviceManual: "If you get nervous, think of it as an opportunity to apply the habituation you have practiced with CAFFT.",
        sessionTitle: "Guidelines for your next flight",
        introQuestion: "What should you do when you actually fly?",
        instructionItem1: "Arrive at the airport with plenty of time.",
        instructionItem2: "Do not avoid looking at planes or the runway.",
        instructionItem3: "Remember that anxiety is uncomfortable but not dangerous: let it rise and fall on its own.",
        instructionItem4: "Do not use relaxation or breathing techniques; they act as 'safety behaviors' that prevent real habituation.",
        instructionItem5: "Do not take alcohol or drugs to avoid anxiety, as they inhibit safety learning.",
        instructionItem6: "Maintain attention on the flight (emotional involvement) instead of distracting yourself.",
        instructionItem7: "Trust in the safety of the plane.",
        instructionItem8: "Congratulate yourself for each step you take.",
        nervousnessAdvice: "It is normal to feel a bit of nerves. Do not interpret these nerves as a danger sign.",
    },
    fearOfFlying: {
        title: "What is Fear of Flying?",
        introduction: "Fear of flying, or aerophobia, is one of the most common specific phobias. It affects a significant percentage of the population and can limit people's personal and professional lives.",
        prevalence: {
            title: "Prevalence in the Population",
            text: "It is estimated that between 20% and 40% of the adult population experiences some level of anxiety when flying. Of these, approximately 6.5% suffer from a clinical phobia that prevents them from flying or they do so with great distress. (Tortella-Feliu & Fullana, 1999)",
            chartData: [
                { nameKey: "phobia", value: 6.5 },
                { nameKey: "discomfort", value: 33.5 },
                { nameKey: "noDiscomfort", value: 60 },
            ],
            phobia: "Clinical Phobia",
            discomfort: "Malestar/Anxiety",
            noDiscomfort: "No Discomfort",
        },
        whoIsAffected: {
            title: "Who Suffer From It?",
            text: "Fear of flying can affect anyone, regardless of age, gender, or profession. It often begins in adulthood, sometimes after a normal flight experience. Factors such as stress, parenthood, or media coverage of aviation incidents can act as triggers.",
        },
        whatIsIt: {
            title: "How It Manifests?",
            text1: "Aerophobia manifests through three interrelated components:",
            physiological: "Physiological Responses",
            physiological_desc: "Tachycardia, sweating, tremors, difficulty breathing, dizziness. These are reactions of the autonomic nervous system to the perception of a threat.",
            cognitive: "Catastrophic Thoughts",
            cognitive_desc: "Negative and irrational ideas about the flight, such as fear of an accident, losing control, suffering a panic attack, or being trapped.",
            behavioral: "Avoidance Behaviors",
            behavioral_desc: "The action of avoiding flying or performing 'safety behaviors' (drinking alcohol, taking medication without a prescription, constantly checking the crew) to try to reduce anxiety.",
        },
        origins: {},
    },
    cafftProgram: {
        title: "The CAFFT Program",
        introduction: "CAFFT (Computer Assisted Fear of Flying Treatment) is a psychological treatment program designed by researchers at the University of the Balearic Islands to help people overcome their fear of flying.",
        specificInfo: {
            title: "Specific Information",
            whatIsCAFFT: "What is CAFFT?",
            whatIsCAFFT_desc: "It is a gradual exposure therapy, computer-assisted, that uses videos to simulate the different phases of a flight. This controlled exposure allows the user to habituate to the stimuli that cause anxiety in a safe environment.",
            howItWorks: "How does it work?",
            howItWorks_desc: "The program begins with a fear assessment (QPV-II) to create a personalized 'exposure hierarchy'. The user is exposed to the videos of this hierarchy, rating their discomfort. Each step is repeated until anxiety decreases, a process known as habituation.",
            onlineInterview: "Before starting, it is necessary to perform a psychological evaluation to confirm the suitability of the program.",
        },
        linkToScientificFoundation: "See Scientific Foundations",
    },
    managerDashboard: {
        addTherapistButton: "Add Therapist",
        addNewTherapistTitle: "Add New Therapist",
        table: {
            therapist: "Therapist",
            viewPatients: "View Patients"
        }
    },
    superadminDashboard: {
        allUsersTitle: "All Users",
        addUserButton: "Add User",
        addNewUserTitle: "Add New User",
        table: {
            user: "User",
            role: "Role",
            parent: "Parent",
            settings: "Settings",
            actions: "Actions"
        },
        form: {
            username: "Username",
            email: "Email",
            password: "Password",
            role: "Role",
            assignToManager: "Assign to Manager",
            none: "None"
        }
    },
    therapistDashboard: {
        ...caTranslations.therapistDashboard,
        kpi: {
            ...caTranslations.therapistDashboard.kpi,
            title_overview: "Performance Overview (KPIs)",
            total_patients: "Total Patients",
            active_sessions: "Active Sessions",
            completed_programs: "Completed Programs",
            avg_improvement: "Avg. Improvement (QPV-II)",
            avg_exposure_time: "Avg. Exp. Time",
            total_sessions: "Total Sessions",
            sessions_rate: "Sessions Rate",
            high_risk: "High Risk Patients",
            inactive_patients: "Inactive (+3 days)",
        },
        criticalAlertsTitle: "Follow-up Alerts",
        table: {
            ...caTranslations.therapistDashboard.table,
            qpvii_latest: "QPV-II (Latest)",
            rci: "RCI",
            significant_rci: "Significant",
            remind: "Remind",
            total_time: "Total Time",
            sessions: "Sessions",
            last_session_slope: "Last Slope",
            habituation_status: "Habit. Status",
            notifications: "Notif.",
            onboarding_tour: "Walkthrough",
        },
        tooltips: {
            ...caTranslations.therapistDashboard.tooltips,
            toggleNotificationsOn: "Enable Notifications",
            toggleNotificationsOff: "Disable Notifications",
            toggleTourOn: "Enable Walkthrough",
            toggleTourOff: "Disable Walkthrough",
        },
        charts: {
            phaseDistribution: "Phase Distribution",
            dailyActivity: "Daily Activity (Last 7 days)",
            sessionsStarted: "Sessions Started",
            sessionsCompleted: "Sessions Completed",
            evaluations: "QPV-II Evaluations",
            actionsLabel: "actions",
            sessionsPerDay: "Sessions per Day",
            discomfortTrend: "Discomfort Trend",
        },
        patient_status: {
            new: "New",
            ready: "Ready",
            in_progress: "In Progress",
            needs_review: "Review",
            completed: "Completed",
            stalled: "Stalled",
            dropping_out: "Risk of Dropout",
        },
        reminders: {
            sendReminderButton: "Send Reminder",
            reminderSentSuccess: "Reminder sent successfully.",
            inactivityBadge: "Inactive ({days}d)",
            abandonmentRisk: "Risk of early abandonment",
        },
        aiConsultationsTitle: "Patient AI Assistant Consultations",
        noAiConsultations: "None of your patients have made any consultations to the AI assistant yet.",
        patientLabel: "Patient",
        queryLabel: "Query",
        newConsultation: "New Consultation",
        moreConsultations: "+ {count} more consultations in the log",
    },
    patientDetail: {
        ...caTranslations.patientDetail,
        pageTitle: "Patient Details: {username}",
        currentPlanTitle: "Current Treatment Plan",
        basedOnEvaluation: "Based on evaluation from {date}",
        hierarchyTitle: "Exposure Hierarchy",
        noEvaluationsFound: "No evaluations found.",
        sessionDetailsTitle: "Detailed Sessions & Sequences",
        noExposureSessions: "No exposure sessions recorded yet.",
        recommendationsTitle: "Clinical Insights & Alerts",
        qpviiHistoryTitle: "QPV-II Progress History",
        communicationsTitle: "Patient Communications",
        emailLogTitle: "Sent Emails Log",
        noEmailsSent: "No automated emails sent yet.",
        viewEmailButton: "View",
        emailModalTitle: "Email Content",
        closeButton: "Close",
        sessionDate: "Session Date",
        videosViewed: "Videos/Sequences",
        avgDiscomfort: "Avg. Discomfort",
        habituationSlope: "Habituation Slope",
        notificationsNotEnabled: "Patient has not enabled notifications.",
        ratingHistory: "Rating History",
        videoTitle: "Stimulus / Video",
        rating: "SUDS",
        session_time: "Session Duration",
        totalExposure_time: "Cumulative Exposure Time",
        sequenceBreakdown: "Sequence per Session",
        abandonmentWarning: "ABANDONED BEFORE HABITUATION",
        habituatedLabel: "Habituated",
        processingLabel: "Processing",
        emailType: {
            invitation: "Invitation",
            reminder: "Reminder",
            follow_up: "Follow-up",
            reinforcement: "Reinforcement",
        },
        recommendations: {
            noExposureDataForRecommendations: "Insufficient exposure data to generate tailored clinical insights.",
            noSignificantAlerts: "Progress is within expected clinical parameters. Emotional processing is occurring.",
            stalledHabituation: "Persistent reactivity in {sceneName}. Investigate potential safety behaviors or resistance.",
            highExposureVolume: "Excellent practice volume. Indicates high treatment adherence.",
            effectiveHabituation: "Highly effective habituation. Consistent discomfort reduction observed.",
            dropoutRisk: "CRITICAL: Patient is abandoning sequences before significant SUDS reduction. Risk of sensitization.",
            irregularPractice: "Irregular practice pattern detected. Consider sending a motivational reminder.",
        },
    },
    qpvii: {
        title: "QPV-II Assessment",
        formTitle: "Fear of Flying Questionnaire (QPV-II)",
        instructions: "Below is a list of situations related to flying. Please rate from 1 (not at all) to 9 (very much) the degree of fear, anxiety or discomfort that each situation would cause you. It is important that you answer all questions.",
        nameLabel: "Name or identifier",
        dateLabel: "Assessment date",
        scoreLabel: "Score",
        submitButton: "Calculate Results",
        calculatingButton: "Calculating...",
        resultsTitle: "Results of your Assessment",
        generalDiscomfortScore: "General fear level",
        subPreparatiusScore: "Trip preparations",
        subVicariScore: "News and accidents",
        subVolScore: "During the flight",
        totalScore: "Total Score",
        allFieldsRequiredError: "Please fill in all fields and answer all questions.",
        personName: "Assessed person",
        evaluationDate: "Assessment date",
        backToFormButton: "Back to Questionnaire",
        loginToSavePrompt: "To save your results and progress, you need to login or register.",
        fillRandomlyButton: "Fill randomly (for testing)",
        viewHierarchyButton: "View my Exposure Hierarchy",
        questions: {
            q0: "How much discomfort, in general, does flying on a plane cause you?",
            q1: "In the middle of the flight I have the feeling that the plane slows down and then accelerates again.",
            q2: "They announce that in a few minutes we will land and that therefore we have to fasten our seatbelts.",
            q3: "Inside the plane while it is gaining altitude.",
            q4: "During the flight I hear a noise from the plane that seems strange to me.",
            q5: "The plane accelerates and I notice how it starts to take off.",
            q6: "The plane crosses a zone of thick clouds and moves a little more with the gusts of wind.",
            q7: "The plane descends gradually and approaches the runway.",
            q8: "When I wake up in the morning, the day I have to take the plane, I see that I will have to fly in bad weather.",
            q9: "At the airport terminal I go to get the boarding pass.",
            q10: "In mid-flight it feels as if the plane had a slight drop or “went through a pothole.”",
            q11: "At one point in the flight the plane moves a lot.",
            q12: "I am at home making preparations for the plane trip.",
            q13: "I am in the airport arrivals hall receiving relatives or friends.",
            q14: "I drive by car to the airport to take the plane.",
            q15: "I am at home or at work and in a few minutes I will leave for the airport.",
            q16: "I hear in the media that a plane has suffered a minor accident without victims at a Spanish airport.",
            q17: "I find out that I have to take a flight to the mainland or to another of the islands (for “non-islanders,” understand a flight of maximum one hour duration).",
            q18: "I have fastened my seatbelt, the plane starts to gain speed, taxiing down the runway, and I notice how the nose of the aircraft starts to lift, starting the takeoff.",
            q19: "In the landing maneuver, I notice how the wheels of the plane contact the surface of the runway.",
            q20: "I notice the plane braking during landing.",
            q21: "I hear on the radio or read in the newspapers that a plane has suffered a serious accident with fatalities.",
            q22: "Sitting in the boarding lounge waiting for them to open the door to board the plane.",
            q23: "Sitting in my seat with the plane stopped waiting to start the flight, I observe the demonstration of the safety measures given by the flight attendants of the airline.",
            q24: "I climb the access stairs to the plane or I walk through the elevated walkway that takes me to the plane.",
            q25: "Everything seems calm but in mid-flight we are indicated the need to fasten our seatbelts.",
            q26: "I see images of an air disaster on TV.",
            q27: "When I go to bed the night before the flight.",
            q28: "I am on the road and I see a plane taking off from the airport.",
            q29: "Watching a movie, a scene of a plane flying appears.",
            q30: "During landing, while the plane is braking on the runway, I feel my body moving forward.",
        }
    },
    scientificFoundation: {
        title: "Scientific Foundations of CAFFT",
        introduction: "The CAFFT program is not an arbitrary solution; it is based on decades of research in clinical psychology and psychopathology. Its efficacy has been validated through rigorous studies published in international scientific journals. Below are some of the key publications that support this treatment.",
        referencesTitle: "Reference Publications",
    },
    auth: {
        registerTitle: "Create Account",
        loginTitle: "Login",
        usernameLabel: "Username",
        emailLabel: "Email",
        passwordLabel: "Password",
        confirmPasswordLabel: "Confirm Password",
        currentPasswordLabel: "Current Password",
        newPasswordLabel: "New Password",
        consentLabel: "I have read and accept the",
        consentLinkText: "Privacy Policy",
        registerButton: "Register",
        loginButton: "Login",
        logoutButton: "Logout",
        alreadyHaveAccount: "Already have an account?",
        dontHaveAccount: "Don't have an account?",
        registrationSuccess: "Registration complete! You can now login.",
        loginSuccess: "Logged in successfully!",
        logoutSuccess: "Logged out successfully.",
        fillAllFieldsError: "Please fill in all fields.",
        passwordsDontMatchError: "Passwords do not match.",
        registrationFailedError: "Registration failed. Please try again.",
        loginFailedError: "Login failed. Check your credentials.",
        usernameTakenError: "Username already taken.",
        emailTakenError: "Email already registered.",
        invalidCredentialsError: "Invalid username or password.",
        consentRequiredError: "You must accept the privacy policy.",
        loading: "Loading...",
        forgotPasswordTitle: "Recover Password",
        forgotPasswordInstructions: "Enter your email and we will send you a link to reset your password.",
        sendResetLinkButton: "Send Link",
        resetLinkSentSuccess: "If the address exists, you will receive an email shortly.",
        resetLinkSentError: "Could not send email. Try again.",
        resetPasswordTitle: "Reset Password",
        resetPasswordInstructions: "Enter your new password.",
        resetPasswordButton: "Reset Password",
        passwordResetSuccess: "Password updated! You can now login.",
        passwordResetError: "Could not reset password.",
        invalidOrExpiredTokenError: "Invalid or expired token.",
        changePasswordTitle: "Change Password",
        changePasswordButton: "Change Password",
        changePasswordSuccess: "Password changed successfully.",
        changePasswordError: "Current password is incorrect.",
        passwordMinLengthError: "Password must be at least 6 characters.",
    },
    profile: {
        ...caTranslations.profile,
        title: "My Profile",
        welcome: "Welcome, {username}!",
        qpviiHistoryTitle: "QPV-II Assessment History",
        evaluationOn: "Evaluation on {date}",
        totalScore: "Total Score: {score}",
        changePasswordSectionTitle: "Change Password",
        noHistory: "You haven't completed any assessments yet.",
        notificationsSectionTitle: "Push Notifications",
        notificationsDescription: "Configure how and when you want to receive reminders about your therapeutic process.",
        enableNotifications: "Enable notifications on this device",
        notificationTypes: {
            reminders: "Activity reminders",
            newTasks: "New task alerts",
            followUp: "Evolution follow-up",
            general: "Informative messages",
        },
        frequency: {
            title: "Notification frequency",
            daily: "Daily",
            weekly: "Weekly",
        },
        timeRange: "Permitted time range",
        savePreferences: "Save preferences",
        consentWithdrawn: "You have withdrawn consent for notifications.",
        consentGiven: "You have given consent to receive notifications.",
        withdrawConsent: "Withdraw consent",
        notificationConsentPrompt: "Do you want to receive notifications?",
        notificationConsentExplain: "Would you like to receive reminders and alerts related to your therapeutic process? You can change this preference at any time.",
        acceptButton: "Accept",
        declineButton: "Decline",
    },
    exposureHierarchy: {
        pageTitle: "My Exposure Hierarchy",
        introText: "This is your personalized exposure sequence, based on your QPV-II results. You will start with the least anxiety-provoking situation and proceed gradually. You can start treatment when you are ready.",
        hierarchyLogicTitle: "How has it been calculated?",
        hierarchyLogicText: "The order is determined by calculating the average anxiety of each group of situations (Preparations, Flight, News) according to your answers. They are ordered from least to most discomfort to ensure safe progression.",
        videoSequenceTitle: "Video Sequence",
        startExposureButton: "Start Exposure",
        exitButton: "Back to Assessment",
        videoItemTitle: "{index}. {title}",
        noVideosInSequence: "Could not generate a video sequence. Please take the assessment again.",
    },
    privacyPolicy: {
        title: "Privacy Policy",
        lastUpdated: "Last updated: {date}",
        introduction: "This privacy policy describes how your personal data is collected, used, and protected when you use the CAFFT application.",
        dataCollectedHeader: "Data We Collect",
        dataCollectedText: "We collect information you provide to us directly:",
        username: "Username: to identify you in the application.",
        emailAddress: "Email address: for password recovery and communications.",
        hashedPassword: "Hashed password: we never store your password in plain text.",
        qpviiResults: "QPV-II results and exposure progress: to personalize your treatment and track your evolution.",
        consentStatus: "Consent status: to confirm that you have accepted this policy.",
        howDataUsedHeader: "How We Use Your Data",
        howDataUsedText: "We use your data exclusively to:",
        accountManagement: "Manage your account and progress within the program.",
        howDataUsedItem1: "Provide you with a personalized treatment experience.",
        howDataUsedItem2: "Allow you to track your evolution over time.",
        dataStorageHeader: "Data Storage",
        dataStorageText: "All data is saved locally in your browser using the Web Storage API. It is not sent to any external server.",
        userRightsHeader: "Your Rights",
        userRightsText: "You can delete all your data at any time by clearing the website data in your browser.",
        userRightsGDPR: "In accordance with GDPR, you have the right to access, rectify, delete and limit the processing of your data.",
        securityHeader: "Security",
        securityText: "Your password is stored using a secure hashing algorithm (SHA-256).",
        contactHeader: "Contact",
        contactText: "If you have any questions about this privacy policy, contact us through the Psychological Well-being Space email.",
        demoDisclaimer: "This is a demonstration and research application. All information provided is based on scientific and clinical content.",
    },
    exposure: {
        pageTitle: "Exposure Session",
        startExposureButton: "Start Exposure",
        videoProgress: "Video {current} of {total}",
        exposureComplete: "Exposure sequence complete!",
        restartExposureButton: "Start sequence again",
        videoNotAvailable: "Video could not be loaded. Please check your connection or contact support.",
        videoTagNotSupported: "Your browser does not support the video tag.",
        downloadVideo: "Download Video",
        ev001_title: "Trip Preparations",
        ev001_desc: "Simulates the moments before the trip, such as packing and planning the route to the airport.",
        ev002_title: "Boarding",
        ev002_desc: "Go through the airport entrance, pass security and board the plane.",
        ev003_title: "Takeoff",
        ev003_desc: "Experience the full takeoff sequence from inside the plane.",
        ev004_title: "During Flight",
        ev004_desc: "Observe the outside from the window during a calm flight.",
        ev005_title: "Landing",
        ev005_desc: "Experience the approach and landing maneuver from your seat.",
        ev006_title: "Accident News",
        ev006_desc: "Face vicarious anxiety by listening to or watching news about air incidents.",
        ev007_title: "Strong Turbulence",
        ev007_desc: "Experience the feeling of strong turbulence inside the plane in a safe environment.",
        ev008_title: "Accident News (II)",
        ev008_desc: "Additional scenes about air incidents to deepen vicarious habituation.",
        discomfortRatingModalTitle: "Rate your Discomfort",
        discomfortRatingInstruction: "On a scale of 1 to 10, what was your maximum level of fear or discomfort during the video '{videoTitle}'?",
        discomfortRatingSaveButton: "Save Rating",
        discomfortRatingErrorNoSelection: "Please select a rating.",
        discomfortRatingMinLabel: "No discomfort",
        discomfortRatingMaxLabel: "Extreme discomfort",
        progressionMessageSuccess: "Well done! You have reduced your discomfort. Ready for the next step.",
        progressionMessageLastVideoSuccess: "Excellent! You have completed the last video in your hierarchy.",
        progressionMessageRetry: "You still feel high discomfort ({current}). This is normal. To overcome your fear, we need your learning to stabilize through habituation: this is achieved by repeating the video without avoiding the sensations of anxiety until they decrease naturally. Therefore, we recommend watching this same video again until your discomfort drops to at least half of your maximum score ({max} -> {target}). The ideal goal is to reach a level of 2 or lower to ensure that the learning is solid. Remember to involve yourself and avoid using distraction techniques.",
        finishExposureSessionButton: "Finish Exposure Session",
        reviewSessionTitle: "Review Session",
        finishReviewButton: "Finish Review",
        logoutButton: "Logout and save progress",
        logoutWarning: "Your last discomfort rating was high ({current}). For the therapy to be effective and for your brain to habituate, it is crucial not to interrupt the exposure when anxiety is high. We recommend continuing until the discomfort decreases to at least half of the maximum score (down from {max} to {target} or less). The optimal habituation goal is to reach a level of 2. Do you want to exit anyway?",
        continueExposure: "Continue Exposure",
        videoLoadErrorTitle: "Video Loading Error",
        videoLoadErrorBody: "The video could not be loaded. The most likely cause is that the file is missing from the expected location (public/videos_cafft/).",
        videoLoadErrorChecklist: "Please check that the video file exists and the format is compatible.",
        testWithDemoVideoButton: "Try with Demo Video",
        simulateViewingButton: "Simulate Viewing",
        sessionProgressTitle: "Session Progress",
        videosCompleted: "Completed",
        ratingHistory: "Discomfort History",
        preparation: "Preparation",
        boarding: "Boarding",
        takeoff: "Takeoff",
        inflight: "In-flight",
        landing: "Landing",
        accidents: "Accidents",
        psychoed: "Psychoeducation",
    },
    evolution: {
        pageTitle: "My Evolution",
        qpviiEvolutionChartTitle: "Evolution of QPV-II Scores",
        totalScoreEvolution: "Total Score",
        malestarGeneralEvolution: "General Discomfort",
        subPreparatiusEvolution: "Preparations",
        subVicariEvolution: "Vicarious",
        subVolEvolution: "Flight",
        noHistoryForChart: "You need at least {count} assessments to see your evolution.",
        preTreatment: "Pre-Treatment",
        postTreatment: "Post-Treatment",
        exposureTitle: "Exposure History",
        habituationExplanationTitle: "What is Habituation?",
        habituationExplanationText: "Habituation is a learning process in which your emotional response (what you feel, think, and do) to a stimulus (such as one of the program's videos) decreases after repeated exposure. By watching the videos several times, you learn that there is no real threat, and your anxiety is progressively reduced. These charts show how your discomfort decreases with each repetition.",
        noExposureData: "You haven't performed any exposure sessions yet.",
        intraSessionEvolution: "Intra-Session Evolution",
        sessionDate: "Session of {date}",
        videoAttemptsLabel: "Video Attempts",
        videoCompleted: "Completed",
        videoNotCompleted: "Not Completed",
        noDiscomfortRatingsRecorded: "No discomfort ratings recorded for this session.",
        sceneHabitutationSummaryTitle: "Habituation Summary by Scene",
        detailedHabitutationTitle: "Detailed Evolution by Scene",
        sceneHabitutationSummaryExplanation: "This visualization groups data from all sessions to see your overall habituation to specific situations.",
        finishProgramButton: "Finish Program",
        reviewScenesButton: "Review Scenes",
        reviewSessionLabel: "Review",
        finishSessionButton: "Finish Session",
        sessionCompleteTitle: "Session Completed!",
        sessionCompleteText: "You have successfully finished all the videos in your hierarchy. You can take a final assessment or review a scene.",
        reEvaluateButton: "Take Final Assessment",
        sessionPausedTitle: "Session Paused",
        sessionPausedText: "You can resume your exposure session whenever you want.",
        resumeSessionButton: "Resume Session",
        logoutButton: "Logout",
        goToHomeButton: "Go to Home",
        rciTitle: "Clinical Change Indicator (RCI)",
        rciExplanation: "The Reliable Change Indicator shows if your improvement is truly significant from a therapeutic perspective.",
        rciMathInfo: "Calculation based on QPV-II: {pre} (pre) vs {post} (post)",
        rciStatusSignificant: "Significant Change Detected",
        rciStatusNotSignificant: "Change in Progress",
        rciLabel: "Treatment Result",
        ratingAxisLabel: "Anxiety (0-10)",
        scoreAxisLabel: "QPV-II Score",
        programCompleteSuccessMessage: "You have reached an important milestone. You can see your evolution and then celebrate the completion, review some scenes or finish the session.",
        prePostComparisonTitle: "Pre vs Post Treatment Comparison",
        differenceLabel: "Difference",
        rciMissingDataMessage: "At least two QPV-II assessments (pre and post) are required to calculate the Reliable Change Index (RCI).",
        globalEvolutionTitle: "Therapeutic Progress Summary",
        totalSessions: "Total Sessions",
        totalVideos: "Total Videos",
        globalHabituation: "Overall Habituation Progress",
        habituationStrength: "Habituation Strength",
        habituationStrengthExplanation: "This value indicates the effectiveness of your learning: the higher it is, the faster and more deeply you are processing fear and reducing anxiety.",
        globalSceneTrendTitle: "Anxiety Evolution by Scene",
        globalTrendExplanation: "This chart shows how the average anxiety in each scene evolves across all your sessions.",
        habituationProgressTitle: "Habituation Progress",
        habituationProgressExplanation: "Shows the anxiety reduction achieved in each session.",
        discomfortReduction: "Anxiety Reduction",
        averageDiscomfort: "Average Anxiety",
        habituationSlope: "Improvement Speed",
        videosWatched: "Videos Watched",
        sessionDetails: "Session Details",
        slopeImproving: "Improving",
        slopeStable: "Stable",
        slopeWorsening: "Worsening",
        needMoreDataTitle: "Still collecting data",
        needMoreDataDesc: "To show meaningful progress statistics and trend charts, you need to complete at least {count} exposure sessions with discomfort ratings.",
        habituation: "Habituation",
        habituationStatus: "Habituation Status",
        habituationProgress: "Habituation Progress",
        feedbackImproving: "You are habituating, the discomfort is reducing.",
        feedbackStable: "You're doing well, but more practice is needed. Keep exposing yourself.",
        feedbackWorsening: "It's important not to stop now. If you don't improve, talk to your therapist.",
        sceneHabituationChartTitle: "Habituation: {sceneName}",
        scene_psychoed: "Psychoeducation",
        scene_preparation: "Preparation",
        scene_boarding: "Boarding and Taxiing",
        scene_takeoff: "Takeoff",
        scene_inflight: "In Flight",
        scene_landing: "Landing",
        scene_accidents: "Vicarious (Accidents)",
        sceneExposureInstanceAxisLabel: "Attempt",
        watchedVideoTooltipLabel: "Video watched",
    },
    aiChat: {
        pageTitle: "AI Assistant",
        disclaimer: "This is an automated assistant. Information may not be accurate. If in doubt, consult a professional.",
        initialMessage: ["Hi! I'm {assistantName}, your co-therapist. How can I help you today?", "Hello {username}! I'm {assistantName}. How are you feeling today?", "Hi! I'm {assistantName}. I'm here to help you with your fear of flying. What do you need?"],
        initialMessageCompleted: ["Hello, {username}! I'm {assistantName}. I've reviewed your progress and I'm ready for your exposure sessions. How are you feeling?", "Hi! I'm {assistantName}. Should we continue with your exposure sessions or do you have any questions?", "Hello, {username}! I'm {assistantName}. How can I assist you today?"],
        inputPlaceholder: "Type here...",
        sendButton: "Send",
        systemInstruction: "You are the CAFFT expert assistant (UIB research). CRITICAL RULE: Very BRIEF, DIRECT, and NATURAL responses (max 1-2 sentences). NEVER ask for things the user has already done (like QPV-II if already completed). Prioritize text. Markdown links (e.g., [Exposure](/exposure), [Help Center](/help-center)) only if they are the logical next step. QPV-II CURRENT STATUS: {hasCompletedQPVII}. PATIENT CONTEXT: {therapeuticContext}.",
        therapistSystemInstruction: "You are the Clinical Support Assistant for therapists in the CAFFT program (UIB research). Your role is to help therapists interpret patient data and optimize the therapeutic process, based on scientific evidence. MISSIONS: 1. Interpret clinical metrics: RCI (> 1.96 for significance), habituation slopes, and SUDS trends. 2. Software features: Guide on [patient management](/therapist/patients), [notifications](/therapist/notifications), and [exposure hierarchy](/therapist/dashboard). 3. Clinical Adjustment: Suggest evidence-based adjustments (Bornas et al., 2001, 2006). Stress absolute pure exposure without relaxation. CRITICAL RULE: Always include markdown links where relevant. Maximum 4 technical sentences.",
        therapistInitialMessage: "Hello, {username}. How can I help you today with your patient management or the technical functioning of CAFFT?",
        assistantNameTitle: "What's the name of your co-therapist?",
        assistantNamePlaceholder: "Type a name...",
        genderNeutralSuggestions: ["Alex", "Sam", "Charlie", "Jamie", "Jordan", "Morgan", "Taylor", "Casey", "Riley", "Avery", "Quinn", "Rowan", "Robin", "Sky", "River", "Sage", "Phoenix", "Emerson", "Finley", "Drew"],
        saveName: "Save",
        reconnectButton: "Reconnect",
        connecting: "Connecting with assistant...",
        changeName: "Change name",
        moment: {
            pre: "The patient has not yet started treatment (information phase or initial doubts).",
            during: "The patient is currently performing graduated exposure sessions.",
            maintenance: "The patient has completed the exposure program and is waiting to take their next real flight.",
            post: "The patient has already flown and is in the post-treatment follow-up phase.",
        },
        reminder: {
            emailSubject: "We miss you at CAFFT",
            emailBody: "Hi {username}, it's been a few days since your last exposure session. Remember that consistency is key to overcoming fear. We look forward to seeing you!",
            notificationSent: "Reminder sent to patient.",
            webappMessage: "Hi {username}! It's been {days} days since your last session. Remember that constant practice is key to success. We encourage you to do a short session today!"
        },
        followUp: {
            firstSession: "Congratulations on your first session, {username}! You've taken the first step, the hardest one. Let's keep going!",
            halfway: "You've already completed half the way, {username}! You're showing great courage. Soon fear will be just a memory.",
            reducedFear: "Incredible progress, {username}! Your anxiety level has clearly dropped in recent sessions. You've gone from {firstSuds} to {latestSuds}. You're mastering the fear!",
            mostDifficult: "You've overcome one of your biggest challenges today, {username}. I'm very proud of you. You're stronger than you thought!",
            maintenanceStarted: "You've reached the final phase, {username}! Now you just need to maintain these achievements before your next flight. You're close!",
        }
    },
    onboarding: {
        stepCounter: "Step {current} of {total}",
        startManual: "Take the Walkthrough",
        next: "Next",
        prev: "Previous",
        finish: "Finish",
        step1: {
            title: "Welcome to CAFFT",
            content: "Your journey to overcoming fear of flying begins here. Access key information about the program from this home page."
        },
        step2: {
            title: "QPV-II Evaluation",
            content: "The first step is knowing your starting point. The QPV-II evaluation helps us personalize your treatment."
        },
        step3: {
            title: "Exposure Hierarchy",
            content: "Access your gradual exposure videos here. Face scenes from preparation to actual flight."
        },
        step4: {
            title: "Your Evolution",
            content: "Track your progress visually. See how you reduce anxiety session after session."
        },
        step5: {
            title: "Help Center",
            content: "Here you will find all the documentation and support videos to solve your doubts about the program."
        },
        step6: {
            title: "Virtual Assistant",
            content: "Whenever you have doubts, you can consult our AI assistant with the button in the bottom right corner."
        },
        therapist: {
            step1: { title: "Dashboard", content: "Here you have an overview of all your patients' progress at a glance." },
            step2: { title: "Patient Management", content: "You can add new patients or manage their data from here." },
            step3: { title: "Recent Activity", content: "Monitor the latest sessions performed by your patients." },
            step4: { title: "Navigation", content: "Use the sidebar menu to access the full list of patients and their notifications." },
            step5: { title: "Help Center", content: "Find clinical documentation and user guides to solve doubts quickly." },
            step6: { title: "AI Support", content: "You have the AI assistant at hand to analyze complex cases or clinical metrics." }
        }
    },
    cafftIntroPage: {
        title: "Introduction to the CAFFT Program",
        welcomeMessage: "Welcome, {username}!",
        explanationText: "You are about to start a program designed to help you overcome your fear of flying. Before starting, we recommend watching this short video that explains the foundations of the treatment. Then, you will proceed to your first evaluation.",
        videoTitle: "CAFFT Introductory Video",
        proceedButton: "Understood, go to Evaluation",
    },
    helpVideos: {
        title: "Help Videos and FAQ",
        pageTitle: "Help Videos",
        videos: [
            { titleKey: "q1", link: "https://www.youtube.com/watch?v=A3eIDb9_2Vo" },
            { titleKey: "q2", link: "https://www.youtube.com/watch?v=28y1fW0_hyY" },
            { titleKey: "q3", link: "https://www.youtube.com/watch?v=7X3H4Ase2y8" },
            { titleKey: "q4", link: "https://www.youtube.com/watch?v=vV239mzG3sM" },
        ],
        q1: "Why is pure exposure without relaxation important?",
        q2: "What is turbulence and why is it not dangerous?",
        q3: "How to maintain engagement during the videos?",
        q4: "What if I feel a lot of anxiety during a video?",
        noVideos: "Currently no help videos available.",
    },
    feedback: {
        pageTitle: "Program Feedback",
        ratingLabel: "Rating",
        typeLabel: "Comment Type",
        types: {
            bug: "Bug / Issue",
            improvement: "Suggested Improvement",
            testimonial: "Testimonial / Experience",
            other: "Other"
        },
        commentLabel: "Comments",
        commentPlaceholder: "Tell us more about your experience or suggestion...",
        submitButton: "Send Feedback",
        successMessage: "Thanks for your feedback! It helps us improve CAFFT.",
        errorMessage: "An error occurred while sending feedback. Please try again.",
        recentTestimonialsTitle: "Recent Testimonials",
        anonymousUser: "User in training"
    },
    general: {
        readMore: "Read more",
        by: "by",
        help: "Help",
        or: "or",
        confirmExit: "Confirm exit",
        cancel: "Cancel",
        errorDetails: "Error details",
        unknown: "Unknown",
        none: "None",
        roles: {
            manager: "Manager",
            therapist: "Therapist",
            superadmin: "Superadmin",
            patient: "Patient"
        }
    },
    exposureExplanation: {
        ...caTranslations.exposureExplanation,
        pageTitle: "Exposure Explanation",
        section1Title: "Anxiety is a False Alarm",
        section1Text: "Your body reacts as if there were a real danger, but in a modern commercial aircraft, the danger is extremely low. You are retraining your behavior and regulating your emotions.",
        section2Title: "Habituation and Extinction",
        section2TextHabituation: "Habituation is a learning process in which your emotional response (what you feel, think, and do) to a stimulus (such as one of the videos in the program) decreases after repeated exposure. By watching the videos multiple times, you learn that there is no real threat, and your anxiety gradually reduces. These graphs show how your discomfort drops with each repetition.",
        section3Title: "Key Instructions (Pure Exposure)",
        section3Point1Active: "Maintain involvement: experience the situation as if it were real.",
        section3Point2Stay: "Do not use relaxation, breathing techniques, or distractions; they prevent habituation.",
        section3Point3Rate: "Do not stop the video or close your eyes until the anxiety has dropped by at least half.",
        section3Point4Repeat: "Repetition without 'safety aids' is the key to success.",
        section4Title: "What to expect?",
        proceedButton: "Understood, I want to start",
    },
    celebration: {
        pageTitle: "Congratulations!",
        congratulations: "Congratulations, {username}!",
        messageBody: "You have completed the CAFFT program. This is a great step towards overcoming your fear.",
        achievementsHeader: "Achievements",
        achievement1: "You have completed the entire exposure hierarchy.",
        achievement2: "You have learned to manage anxiety.",
        achievement3: "You are more prepared to fly.",
        nextStepsHeader: "Next steps",
        nextStep1: "Plan a real flight soon.",
        nextStep2: "Review the post-treatment guidelines.",
        nextStep3: "If needed, use the program again.",
        returnHomeButton: "Return to Home",
        logoutButton: "Logout",
    },
    helpModal: {
        ...caTranslations.helpModal,
        modalTitle: "Help Center",
        tocTitle: "Contents",
        searchPlaceholder: "What do you need to know?",
        closeButton: "Close",
        disclaimer: "Guidelines. Do not replace your therapist's criteria.",
        needMoreHelp: "Still have doubts?",
        noResultsTitle: "No results",
        noResultsText: "Try other words or explore the side menu.",
        heroSubtitle: "Everything you need to know about the CAFFT program and how to overcome your fear of flying once and for all.",
        fullManualTitle: "Full Clinical Manual",
        fullManualSubtitle: "Consult or download the official manual in Markdown format.",
        fullManualMd: `
# Clinical Manual and Prospectus CAFFT 5.1
**Computer Assisted Fear of Flying Treatment (CAFFT)**
*University of the Balearic Islands (UIB)*

---

## 1. Introduction to Fear of Flying (Aerophobia)

### 1.1 Prevalence and Impact
Fear of flying affects approximately **13% of the adult population** as a clinical phobia. An additional **40%** experience significant discomfort. It is not a disease, but a learned fear response.

### 1.2 The Three Components of Fear
1.  **Physiological Component:** Tachycardia, sweating, tremors, hyperventilation.
2.  **Cognitive Component:** Catastrophic thoughts (*"the plane will fall"*) and anticipation of fear.
3.  **Behavioral Component:** Mainly **avoidance**. Not flying maintains the problem.

---

## 2. The CAFFT Program

### 2.1 Gradual Exposure and Habituation
The treatment is based on **Pure Exposure**. We use realistic videos that simulate flight phases. The system creates a **personalized hierarchy**. The goal is **Habituation**.

---

## 3. User Guide (Prospectus)

### 3.1 Conditions of Use
- **Place:** Quiet, dim light.
- **Headphones:** **MANDATORY USE**.
- **Volume:** Adjust it to a realistic level.

### 3.2 Active Involvement (No Safety Aids)
- **Honesty:** Rate your discomfort sincerely (0-10).
- **Prohibited:** Do not use relaxation or distraction techniques during videos. They act as "safety aids" that prevent real learning.

---

## 4. Instructions for the Real Flight

- **Medication:** DO NOT take tranquilizers.
- **Alcohol:** DO NOT consume alcohol.
- **Nerves:** Accept nerves as part of the learning process.
        `,
        fearOfFlying: {
            title: "1. Introduction to Fear of Flying",
            prevalence: {
                title: "How many people are affected by this problem?",
                textManual: "Fear of flying is a much more frequent problem than you probably think. It is estimated to affect about **13% of the total adult population**. Additionally, many other people (about **40%**) experience a certain discomfort when they have to fly, and only **47%** of the population flies with total peace of mind."
            },
            whoIsAffected: {
                title: "What kind of people are affected?",
                textManual: "Anyone can have a fear of flying. Fear of flying is not a disease, nor a symptom of any personal imbalance or being a coward. There is no specific profile of people who are more at risk than others, although it can affect women and people who are generally nervous or 'worry-prone' slightly more."
            },
            whatIsIt: {
                title: "What does fear of flying consist of?",
                introManual: "Aerophobia is not a single feeling, but manifests in three components that feed into each other:",
                physiological: {
                    title: "Physiological component: Body sensations",
                    textManual: "Appearance of unpleasant physical sensations such as a **racing heart (tachycardia)**, sweat, tremors, rapid breathing (hyperventilation), nausea, or stomach ache. The more fear the situation causes, the more intense and numerous these sensations will be."
                },
                cognitive: {
                    title: "Cognitive component: What we think",
                    textManual: "Negative and catastrophic thoughts: *'the plane could fall'*, *'I won't be able to get out of here'*, *'I'll have a heart attack and no one will be able to help me'*, *'others will laugh at me'*. It also includes **anticipation**: starting to suffer days before the flight or simply when packing the suitcase."
                },
                behavioral: {
                    title: "Behavioral component: What we do",
                    textManual: "Mainly **avoidance**: trying not to go by plane, canceling trips, looking for excuses, or using 'safety aids' (alcohol, pills). It also includes avoiding related stimuli such as watching plane movies or going to the airport."
                },
            },
            howItStarts: {
                title: "How does the problem start?",
                textManual: "It can have various origins: having lived through a flight with strong turbulence, receiving news of accidents repeatedly, seeing relatives who suffer while flying, or having experienced a panic attack or intense physical discomfort during a previous flight."
            },
            howItIsMaintained: {
                title: "How is the problem maintained?",
                textManual: "The most important factor that maintains fear is **avoidance**. When we avoid flying, we feel immediate relief, and this 'educates' our learning to believe that fleeing is the only way to be safe. Thus, we never give the organism the opportunity to learn that the plane is safe."
            },
            howToSolve: {
                title: "How to solve the problem?",
                textManual: "The goal is **extinction learning**: breaking the association between flying and anxiety. This is achieved through **gradual exposure**: facing the feared situations little by little, without fleeing from them, until the body habituates and the anxiety disappears."
            }
        },
        cafftInfo: {
            title: "2. The CAFFT Program",
            howItWorks: {
                title: "How does it work?",
                textManual: "Exposure to feared situations will be gradual. The system prepares an **individualized hierarchy** based on your QPV-II questionnaire. Each sequence is presented as many times as necessary until anxiety significantly decreases."
            },
            duration: {
                title: "How long does it last?",
                textManual: "The duration varies depending on the person. **4 to 8 sessions** of one hour are recommended. With 2 or 3 weekly sessions, the problem can be overcome in a few weeks."
            },
            efficacy: {
                title: "Is it effective?",
                textManual: "More than **70% of the treated people** manage to fly without problems. Research shows that exposure is the best way to overcome phobias."
            },
            conditions: {
                title: "Environmental Conditions",
                item1Manual: "Sit comfortably in a quiet place.",
                item2Manual: "Dim light and without interruptions.",
                item3Manual: "**Mandatory use of headphones** (preferably covering the whole ear).",
                item4Manual: "Adjust the volume so the sound is realistic and powerful.",
            },
            involvement: {
                title: "User involvement",
                textManual: "You must play an active role. Try to feel as if you are LIVING it (involvement).",
                list1: "Maximum concentration: Do not look away from the screen.",
                list2: "Don't rush: Honestly indicate the degree of discomfort.",
                list3: "Don't stop: Do not end a session until anxiety has dropped at least by half.",
            },
            tasksBetweenSessions: {
                title: "Tasks between sessions",
                textManual: "It is necessary to complete exposure with real situations: going to the airport, watching planes, or reading news without avoiding them. This normalizes sensations outside the computer program."
            }
        },
        prospectus: {
            title: "3. Exposure Guide (Prospectus)",
            indications: {
                title: "Indications",
                textManual: "Indicated for adults with specific situation-type phobia (traveling by plane) or fear of flying without reaching phobia criteria."
            },
            adverseEffects: {
                title: "Possible adverse effects",
                textManual: "Anxiety may be experienced during exposure, physical or psychological tiredness, and difficulty falling asleep. These effects are normal and part of the habituation process."
            },
            advantages: {
                title: "Advantages of using CAFFT",
                list: [
                    "No need to wait for treatment.",
                    "Total confidentiality.",
                    "24h accessibility.",
                    "Tracking of your own progress.",
                    "Remote professional supervision."
                ]
            }
        },
        postTreatmentSection: {
            title: "4. Instructions for the Real Flight",
            introManual: "Once the program is finished, it is recommended to take a flight within 10 to 15 days.",
            instructionItem1Manual: "DO NOT take tranquilizers either before or during the flight.",
            instructionItem2Manual: "DO NOT consume alcoholic beverages.",
            instructionItem3Manual: "Sit wherever you are assigned by chance.",
            instructionItem4Manual: "Avoid talking about the fear of flying in the preceding days.",
            instructionItem5Manual: "Use natural distractors if you wish (reading, music), but not to escape from anxiety.",
            instructionItem6Manual: "Accept the nerves as part of the learning process.",
            nervousnessAdviceManual: "If you get nervous, think of it as an opportunity to apply the habituation you have practiced with CAFFT.",
        },
        technicalSection: {
            title: "5. Technical Information and Contraindications",
            requirements: {
                title: "Requirements",
                list: ["Computer with Internet connection.", "High-quality headphones.", "Updated browser."],
                text: "You need a computer with an Internet connection and headphones that filter out external air for better immersion."
            },
            contraindications: {
                title: "Contraindications",
                text: "Do not perform CAFFT without consulting a doctor if:",
                list: ["You suffer from chronic heart disease.", "You are under psychiatric treatment or taking psychotropic drugs.", "You are pregnant."]
            }
        },
        aiChatSection: {
            title: "AI Assistant",
        },
        therapistAiChatSection: {
            title: "Clinical AI Assistant",
        },
        therapistInfo: {
            title: "Scientific Information and Clinical Guide",
            evidenceTitle: "Scientific Foundation and Evidence",
            evidenceText: "CAFFT (**Computer-Assisted Fear of Flying Treatment**) is a simulated exposure program that recreates flight situations using real images and sounds. Multiple randomized controlled trials (**Bornas et al., 2001, 2002, 2006; Tortella-Feliu et al., 2011; Botella-Arbona et al., 2004**) have demonstrated:\n\n- **Efficacy:** Significantly greater reduction in fear of flying compared to waiting list controls.\n- **Equivalence:** As effective as Virtual Reality Exposure Therapy (**VRET**) and longer multicomponent interventions.\n- **Maintenance:** Successes are maintained at **6-month and 1-year** follow-ups.\n- **Success Rate:** Between **80% and 90%** of patients improve or recover clinically.",
            mechanismTitle: "Mechanisms of Action",
            mechanismText: "The treatment divides the trip into chronological stages (preparation, airport, takeoff, flight, landing) and adds a stage on accidents to reduce catastrophic anxiety. The program generates a personalized hierarchy based on the **QPV-II**. **Extinction** of the fear response is achieved through **habituation** via repeated exposure.",
            metricsTitle: "Interpretation of Metrics",
            rciExplanation: "The Reliable Change Index (**RCI**) indicates whether the change in QPV-II between pre and post is clinically significant (> 1.96).",
            slopeExplanation: "The habituation **slope** indicates the speed of habituation; a steep negative slope is a sign of an active extinction process.",
            applicationTitle: "Clinical Application Guide",
            applicationText: "The therapist can supervise sessions or allow self-application. It is **CRUCIAL** that the patient remains 'implied' (experiencing the situation as real).\n\n- **No relaxation:** Relaxation techniques should **NOT** be used during exposure, as they inhibit habituation learning.\n- **Success criteria:** Repeat each sequence until anxiety drops to low levels (**1-2** on a 1-9 scale).\n- **Graduation flight:** A real flight is recommended within **15 days** after treatment to consolidate learning.",
            faqTitle: "Frequently Asked Questions (FAQs)",
            faqText: "- **Does it work for complete avoiders?** Yes, it helps them habituate before the real flight.\n- **Is Virtual Reality better?** Evidence indicates that CAFFT is equally effective and much more affordable and portable.\n- **Can it be used autonomously?** Yes, **self-applied** versions have shown similar results with minimal therapist follow-up.",
        }
    }
};

export const translations: Translations = {
    [Language.CA]: caTranslations,
    [Language.ES]: esTranslations,
    [Language.EN]: enTranslations,
};
