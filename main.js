(async function () {
  const STORAGE_KEYS = {
    session: "inj-app-session",
  };
  const OFFER_ART_DB_NAME = "inj-offer-art-library";
  const OFFER_ART_STORE = "arts";
  const OFFER_CANVAS_FORMATS = {
    square: { label: "Quadrado", ratioLabel: "1:1", width: 1, height: 1 },
    story: { label: "Story", ratioLabel: "9:16", width: 9, height: 16 },
  };
  const OFFER_TEMPLATE_BACKGROUNDS = {
    square: "./assets/modelo-panfleto-oferta-quadrado.png",
    story: "./assets/modelo-panfleto-oferta-story.png",
  };

  const DATE_ASSIST_MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const FIRESTORE_COLLECTIONS = {
    patients: "patients",
    applications: "applications",
    bioRecords: "bioRecords",
    clinicalRecords: "clinicalRecords",
    doctors: "doctors",
    users: "users",
    pricingProducts: "pricingProducts",
    pricingSettings: "pricingSettings",
    pricingTabs: "pricingTabs",
    purchaseShortages: "purchaseShortages",
    purchaseOrders: "purchaseOrders",
  };

  const PUBLIC_OFFERS_BASE_URL = "https://farmaciaofertas.web.app/oferta";
  const SUPABASE_OFFERS_BUCKET = "offer-images";
  const MAX_ONLINE_OFFER_IMAGES = 12;
  const MAX_ONLINE_OFFER_SOURCE_BYTES = 15 * 1024 * 1024;
  const MAX_ONLINE_OFFER_GIF_BYTES = 3 * 1024 * 1024;
  const MAX_ONLINE_OFFER_UPLOAD_BYTES = 4 * 1024 * 1024;
  const ONLINE_OFFER_MAX_DIMENSION = 1920;
  const ONLINE_OFFER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

  const firebaseConfig = {
    apiKey: "AIzaSyDkDBW-ctRRP6liA5nkWdlgeNmFv4zW7xs",
    authDomain: "sistema-injetaveis.firebaseapp.com",
    projectId: "sistema-injetaveis",
    messagingSenderId: "34034319290",
    appId: "1:34034319290:web:0009cb3c35cf1301992783",
  };

  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const supabaseConfig = window.SUPABASE_CONFIG || {};
  const supabaseConfigured = Boolean(
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(supabaseConfig.url || "").replace(/\/$/, ""))
      && String(supabaseConfig.anonKey || "").length > 40
      && window.supabase?.createClient,
  );
  const supabaseClient = supabaseConfigured
    ? window.supabase.createClient(String(supabaseConfig.url).replace(/\/$/, ""), String(supabaseConfig.anonKey), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: "inj-offers-publisher-session",
      },
    })
    : null;
  const demoData = createDemoData();
  const seedUsers = getSeedUsers();
  const LEGACY_EAN_MEDICINE_LIBRARY = [
    {
      name: "Ablok Plus 50mg + 12,5mg, caixa com 30 comprimidos",
      ean: "7896241225127",
      aliases: "ablok plus atenolol clortalidona",
      leafletPath: "./bulas-medicamentos/ablok-plus-50mg-12-5mg-bula-profissional.pdf",
      sections: [
        { title: "Como funciona", content: "Ablok Plus® contém 2 ingredientes ativos, que reduzem a pressão arterial quando usados continuamente. O atenolol age preferencialmente sobre os receptores localizados no coração e na circulação. A clortalidona aumenta a quantidade de urina produzida pelos rins.\n\nO efeito de Ablok Plus® é mantido por no mínimo 24 horas após dose oral única diária." },
        { title: "Como usar", blocks: [
          { type: "text", content: "Ablok Plus® deve ser administrado por via oral, com água e de preferência no mesmo horário todos os dias.\n\nVocê não deve utilizar Ablok Plus® se estiver em jejum por tempo prolongado.\n\nAblok Plus® não deve ser partido ou mastigado.\n\nAblok Plus® deve ser administrado inteiro." },
          { type: "heading", content: "Posologia do Ablok Plus" },
          { type: "text", content: "A dose recomendada de Ablok Plus® 50/12,5 mg ou de Ablok Plus® 100/25 mg é de 1 comprimido ao dia, pois a maioria dos pacientes com pressão alta apresentará uma resposta satisfatória com essa dose. Há pouca ou nenhuma queda adicional na pressão arterial com o aumento de dose, mas, quando necessário, pode-se adicionar outro medicamento anti-hipertensivo, como um vasodilatador." },
          { type: "heading", content: "Idosos" },
          { type: "text", content: "Pacientes idosos podem iniciar a terapia com doses menores de Ablok Plus® 25/12,5 mg e aumentar progressivamente conforme a resposta clínica.\n\nPacientes idosos com hipertensão, que não respondem ao tratamento de baixas doses com único agente ou em casos em que as doses de ambos podem ser consideradas inapropriadas, devem apresentar uma resposta satisfatória com 1 comprimido ao dia de Ablok Plus® 50 mg/12,5 mg. Nos casos em que o controle da hipertensão não é alcançado, a adição de uma pequena dose de um terceiro agente, por exemplo, um vasodilatador, pode ser adequada." },
          { type: "heading", content: "Crianças" },
          { type: "text", content: "Não há experiência pediátrica com Ablok Plus® e, por esta razão, não é recomendado o uso em crianças." },
          { type: "heading", content: "Insuficiência Renal" },
          { type: "text", content: "É necessária cautela na administração em pacientes com insuficiência renal grave, podendo ser necessária uma redução na dose diária ou na frequência de administração das doses.\n\nAblok Plus® deve ser utilizado continuamente, a interrupção do tratamento deve ser feita gradualmente.\n\nSiga a orientação de seu médico, respeitando sempre os horários, as doses e a duração do tratamento.\n\nNão interrompa o tratamento sem o conhecimento do seu médico." },
        ] },
        { title: "Contraindicações", content: "Você não deve utilizar Ablok Plus® nas seguintes situações:\n\nAlergia ao atenolol, à clortalidona ou a qualquer um dos componentes da formulação.\n\nBatimentos lentos do coração (bradicardia).\n\nComprometimento importante da função do coração em bombear sangue aos tecidos (choque cardiogênico).\n\nPressão arterial baixa ou muito baixa (hipotensão).\n\nAlteração metabólica onde o pH do sangue é baixo (acidose metabólica).\n\nProblemas graves de circulação arterial periférica (nas extremidades).\n\nBloqueio cardíaco de segundo ou terceiro grau (tipo de arritmia que causa bloqueio de impulsos elétricos para o coração).\n\nSíndrome do nodo sinusal (doença no local de origem dos impulsos elétricos do coração).\n\nPortadores de feocromocitoma (tumor benigno da glândula adrenal ou suprarrenal) não tratado.\n\nInsuficiência cardíaca descompensada.\n\nDurante a gravidez ou amamentação.\n\nEste medicamento não deve ser utilizado por mulheres grávidas sem orientação médica. Informe imediatamente ao seu médico em caso de suspeita de gravidez." },
        { title: "Interação medicamentosa", content: "Você deve ter cuidado ao utilizar Ablok Plus® em conjunto com os seguintes medicamentos, pois o resultado do tratamento pode ser alterado:\n\nVerapamil, diltiazem, di-hidropirinas (como nifedipino), glicosídeos digitálicos (como por exemplo, digoxina, digitoxina), clonidina, disopiramida, amiodarona, agentes simpatomiméticos (como adrenalina), inibidores da prostaglandina sintetase (como ibuprofeno ou indometacina), lítio e anestésicos.\n\nPodem ocorrer alterações nos resultados de exames laboratoriais referentes aos níveis de transaminases (avaliação da função do fígado) e, muito raramente, alteração nos exames imunológicos (anticorpos antinucleares – ANA).\n\nInforme ao seu médico ou cirurgião-dentista se você está fazendo uso de algum outro medicamento.\n\nNão use medicamento sem o conhecimento do seu médico. Pode ser perigoso para a sua saúde." },
      ],
    },
    {
      name: "Acebrofilina Neo Química 5mg/mL, xarope infantil 120mL",
      ean: "7896714214115",
      aliases: "acebrofilina neo quimica xarope infantil expectorante",
      leafletPath: "./bulas-medicamentos/acebrofilina-neo-quimica-5mg-ml-bula-profissional.pdf",
      sections: [
        { title: "Como funciona", content: "Este medicamento apresenta em sua formulação um derivado de xantina e por isso possui ação broncodilatadora (dilatação dos brônquios), mucorreguladora (controle da quantidade de formação do muco) e expectorante (eliminação de catarro) melhorando a respiração e a expulsão das secreções presentes nos brônquios, contribuindo para a diminuição da falta de ar." },
        { title: "Como usar", blocks: [
          { type: "heading", content: "Adultos e crianças a partir de 12 anos de idade:" },
          { type: "table", headers: ["Idade", "Posologia", "Horário"], rows: [["Adultos e crianças a partir de 12 anos", "1 copo dosador (10mL) Xarope Adulto", "A cada 12 horas"]] },
          { type: "heading", content: "Crianças a partir de 2 anos de idade:" },
          { type: "table", headers: ["Idade", "Posologia", "Horário"], rows: [["Crianças de 6 a 12 anos", "1 copo dosador (10mL) Xarope Pediátrico", "A cada 12 horas"], ["Crianças de 3 a 6 anos", "½ copo dosador (5mL) Xarope Pediátrico", "A cada 12 horas"], ["Crianças de 2 a 3 anos", "2mg/kg de peso ao dia Xarope Pediátrico", "Dividido em duas administrações a cada 12 horas"]] },
          { type: "text", content: "A duração do tratamento deve ser estabelecida a critério médico, de acordo com a gravidade da doença.\n\nSiga a orientação de seu médico, respeitando sempre os horários, as doses e a duração do tratamento. Não interrompa o tratamento sem o conhecimento do seu médico." },
        ] },
        { title: "Contraindicações", content: "A acebrofilina é contraindicada àqueles que apresentarem hipersensibilidade aos componentes da formulação.\n\nEste medicamento é contraindicado para uso por portadores de doenças hepáticas e renais graves.\n\nEste medicamento é contraindicado para menores de 2 anos de idade." },
        { title: "Interação medicamentosa", blocks: [
          { type: "text", content: "O uso concomitante de acebrofilina com carbamazepina, fenobarbital, fenitoína e os sais de lítio pode levar a uma redução da efetividade da teofilina por aumentarem a sua metabolização hepática (feita pelo fígado).\n\nO uso concomitante de acebrofilina com antibióticos macrolídeos (eritromicina), algumas quinolonas como norfloxacino e ciprofloxacino, anti-histamínicos H2 (cimetidina, ranitidina, famotidina), alopurinol, diltiazem e ipriflavona pode retardar a eliminação da teofilina, aumentando o risco de intoxicação pela mesma.\n\nA intoxicação pode se desenvolver naqueles pacientes cujos níveis séricos (nível da substância no sangue) já são altos, a menos que a dosagem seja reduzida.\n\nPode ocorrer hipocalcemia (diminuição do potássio no sangue) com o uso concomitante de acebrofilina e salbutamol ou terbutalina. A frequência cardíaca também pode aumentar, principalmente com altas doses de teofilina.\n\nAlguns pacientes podem demonstrar uma diminuição significativa nos níveis de teofilina no sangue quando a acebrofilina é administrada concomitantemente a salbutamol ou isoprenalina (isoproterenol).\n\nOs níveis séricos (no sangue) da teofilina podem apresentar algum aumento, embora nenhuma toxicidade tenha sido relatada quando a acebrofilina é administrada concomitantemente a contraceptivos orais.\n\nA administração conjunta de acebrofilina e medicamentos alfa-adrenérgicos, como a efedrina, pode levar a um aumento das reações adversas, principalmente relacionadas com o sistema nervoso central e gastrointestinais.\n\nO uso de acebrofilina e produtos a base de Hypericum perforatum pode ocasionar uma redução na eficácia da teofilina.\n\nO uso com betabloqueadores seletivos não é totalmente contraindicado, porém recomenda-se cautela quando a essa associação." },
          { type: "heading", content: "Interações medicamento – alimento" },
          { type: "text", content: "A alimentação pode interferir na quantidade de acebrofilina no organismo.\n\nDietas ricas em proteínas (carnes, ovos, leite e derivados) diminuem a duração do efeito da acebrofilina.\n\nDietas ricas em carboidratos (açúcares, cereais, pães, massas, etc.) aumentam a duração do efeito da acebrofilina.\n\nInforme ao seu médico ou cirurgião-dentista se você está fazendo uso de algum outro medicamento.\n\nNão use medicamento sem o conhecimento do seu médico. Pode ser perigoso para a sua saúde." },
        ] },
      ],
    },
  ];

  const DEFAULT_MEDICINE_LIBRARY = [];
  const LABORATORY_SLUGS = new Set([
    "ache", "biolab", "cimed", "donaduzzi", "ems", "eurofarma", "germed", "medley",
    "neoquimica", "pharlab", "prati", "ranbaxy", "teuto", "uniao",
  ]);

  function laboratoryBaseSlug(medicine, sourceSlugs) {
    const slug = String(medicine.leafletPath || "").split("/").at(-1).replace(/\.pdf$/i, "").toLocaleLowerCase("pt-BR");
    const parts = slug.split("-");
    const laboratoryIndex = parts.findIndex((part) => LABORATORY_SLUGS.has(part));
    if (laboratoryIndex < 1) return "";
    const baseSlug = parts.slice(0, laboratoryIndex).join("-");
    return sourceSlugs.has(baseSlug) ? baseSlug : "";
  }

  let MEDICINE_LIBRARY = [];
  let MEDICINE_SEARCH_INDEX = [];
  let medicineDataLoadPromise = null;

  const MEDICINE_FORM_RULES = [
    { key: "pomada oftálmica", pattern: /\bpomada\s+oftálmica\b/i },
    { key: "colírio", pattern: /\b(?:colírio|oftálmic[oa]|solução\s+oftálmica|instilar)\b/i },
    { key: "gotas", pattern: /\b(?:gotas?|conta[- ]?gotas?)\b/i },
    { key: "comprimido", pattern: /\b(?:comprimidos?|tabletes?|drágeas?)\b/i },
    { key: "cápsula", pattern: /\b(?:cápsulas?)\b/i },
    { key: "xarope", pattern: /\b(?:xaropes?)\b/i },
    { key: "solução oral", pattern: /\bsolu(?:ção|cao)\s+oral\b/i },
    { key: "suspensão oral", pattern: /\bsuspens(?:ão|ao)\s+oral\b/i },
    { key: "creme", pattern: /\bcremes?\b/i },
    { key: "pomada", pattern: /\bpomadas?\b/i },
    { key: "spray", pattern: /\bsprays?\b/i },
    { key: "injetável", pattern: /\b(?:injetável|injetavel|injeção|injecao)\b/i },
    { key: "ampola", pattern: /\bampolas?\b/i },
    { key: "sachê", pattern: /\b(?:sachês?|envelopes?)\b/i },
    { key: "supositório", pattern: /\bsupositórios?\b/i },
  ];
  const ORAL_LIQUID_FORMS = new Set(["xarope", "solução oral", "suspensão oral"]);

  function medicineFormsInText(value) {
    return MEDICINE_FORM_RULES.filter((rule) => rule.pattern.test(String(value || ""))).map((rule) => rule.key);
  }

  function canonicalMedicineForm(value) {
    return medicineFormsInText(value)[0] || normalize(value).trim();
  }

  function medicineFormsAreCompatible(left, right) {
    const leftForm = canonicalMedicineForm(left);
    const rightForm = canonicalMedicineForm(right);
    if (!leftForm || !rightForm) return true;
    if (leftForm === rightForm) return true;
    if (new Set([leftForm, rightForm]).size === 2 && [leftForm, rightForm].every((form) => ["colírio", "gotas"].includes(form))) return true;
    if (new Set([leftForm, rightForm]).size === 2 && [leftForm, rightForm].every((form) => ["pomada oftálmica", "pomada"].includes(form))) return true;
    return ORAL_LIQUID_FORMS.has(leftForm) && ORAL_LIQUID_FORMS.has(rightForm);
  }

  function normalizedStrengthKey(value) {
    const match = normalize(value).replace(/,/g, ".").match(/(\d+(?:\.\d+)?)\s*(mcg|mg|g)(?:\s*\/\s*(ml|g))?(?![a-z])/i);
    if (!match) return normalize(value).replace(/\s/g, "");
    const multiplier = match[2] === "g" ? 1000 : match[2] === "mcg" ? 0.001 : 1;
    const amountInMg = Math.round(Number(match[1]) * multiplier * 1000) / 1000;
    return `${amountInMg}mg${match[3] ? `/${match[3]}` : ""}`;
  }

  function inferredPresentations(medicine) {
    const howToUse = medicine.sections.find((section) => section.title === "Como usar");
    const source = [howToUse?.content, ...(howToUse?.blocks || []).map((block) => block.content)].filter(Boolean).join("\n");
    const strengthMatches = [...source.matchAll(/\b\d+(?:[,.]\d+)?\s*(?:mcg|mg|g)(?:\s*\/\s*(?:mL|ml|g))?(?![a-z])/gi)];
    const inferred = [];
    const namedForms = medicineFormsInText(`${medicine.name} ${medicine.leafletPath || ""}`);

    strengthMatches.forEach((match, index) => {
      const nextIndex = strengthMatches[index + 1]?.index ?? source.length;
      const context = source.slice(match.index, Math.min(nextIndex, match.index + 72));
      const form = canonicalMedicineForm(context);
      if (!MEDICINE_FORM_RULES.some((rule) => rule.key === form)) return;
      if (namedForms.length && !namedForms.some((namedForm) => medicineFormsAreCompatible(namedForm, form))) return;
      const strength = match[0].replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ");
      inferred.push({ strength, form, label: `${strength} ${form}` });
    });

    return inferred;
  }

  function dosageContentForForm(content, form) {
    const source = String(content || "").trim();
    const targetForm = canonicalMedicineForm(form);
    if (!source || !targetForm) return source;
    const sourceForms = medicineFormsInText(source);
    if (!sourceForms.length) return source;
    if (!sourceForms.some((sourceForm) => medicineFormsAreCompatible(sourceForm, targetForm))) return "";

    let activeForms = [];
    return (source.match(/[^.!?\n]+[.!?]+|[^\n]+$/g) || [source]).filter((segment) => {
      let segmentForms = medicineFormsInText(segment);
      if (segmentForms.includes("colírio")) {
        segmentForms = segmentForms.filter((segmentForm) => segmentForm !== "gotas");
      } else if (segmentForms.includes("gotas")) {
        segmentForms = segmentForms.filter((segmentForm) => segmentForm !== "solução oral");
      }
      if (segmentForms.length) activeForms = segmentForms;
      return !activeForms.length || activeForms.some((activeForm) => medicineFormsAreCompatible(activeForm, targetForm));
    }).join(" ").trim();
  }

  function contentForStrength(content, strength) {
    const source = String(content || "").trim();
    if (!source || !strength) return source;
    const targetStrength = normalizedStrengthKey(strength);
    const sourceStrengths = [...source.matchAll(/\b\d+(?:[,.]\d+)?\s*(?:mcg|mg|g)(?:\s*\/\s*(?:ml|g))?(?![a-z])/gi)]
      .map((match) => normalizedStrengthKey(match[0]));
    if (!sourceStrengths.includes(targetStrength)) return source;

    let activeStrengths = [];
    return (source.match(/[^.!?\n]+[.!?]+|[^\n]+$/g) || [source]).filter((segment) => {
      const segmentStrengths = [...segment.matchAll(/\b\d+(?:[,.]\d+)?\s*(?:mcg|mg|g)(?:\s*\/\s*(?:ml|g))?(?![a-z])/gi)]
        .map((match) => normalizedStrengthKey(match[0]));
      if (segmentStrengths.length) activeStrengths = segmentStrengths;
      return !activeStrengths.length || activeStrengths.includes(targetStrength);
    }).join(" ").trim();
  }

  function sectionsForPresentation(medicine, presentation) {
    return medicine.sections.map((section) => {
      let blocks = section.blocks;
      if (section.title === "Como usar" && presentation.audience && section.syrupDosageSplit && blocks) {
        const expectedHeading = presentation.audience === "adult" ? "Xarope adulto" : "Xarope pediátrico";
        let reachedSyrupDosage = false;
        let includeCurrentGroup = false;
        blocks = blocks.filter((block) => {
          if (block.type === "heading" && ["Xarope adulto", "Xarope pediátrico"].includes(block.content)) {
            reachedSyrupDosage = true;
            includeCurrentGroup = block.content === expectedHeading;
            return includeCurrentGroup;
          }
          if (block.type === "heading" && block.content === "Outras apresentações") {
            includeCurrentGroup = false;
            return false;
          }
          return !reachedSyrupDosage || includeCurrentGroup;
        });
      }
      if (section.title === "Como usar" && presentation.form) {
        if (blocks?.length) {
          let headingForms = [];
          blocks = blocks.map((block) => {
            if (block.type === "heading") {
              const detectedForms = medicineFormsInText(block.content);
              if (detectedForms.length) headingForms = detectedForms;
              return headingForms.length && !headingForms.some((form) => medicineFormsAreCompatible(form, presentation.form))
                ? null
                : block;
            }
            const detectedForms = medicineFormsInText(block.content);
            const content = detectedForms.length
              ? dosageContentForForm(block.content, presentation.form)
              : headingForms.length && !headingForms.some((form) => medicineFormsAreCompatible(form, presentation.form))
                ? ""
                : block.content;
            if (detectedForms.length) headingForms = detectedForms;
            return content ? { ...block, content } : null;
          }).filter(Boolean);
        }
      }
      return {
        ...section,
        content: section.content
          ? contentForStrength(
            section.title === "Como usar" ? dosageContentForForm(section.content, presentation.form) : section.content,
            presentation.strength,
          )
          : section.content,
        blocks: blocks?.map((block) => (
          block.type === "text" ? { ...block, content: contentForStrength(block.content, presentation.strength) } : block
        )).filter((block) => block.type !== "text" || block.content),
      };
    });
  }

  function createMedicineVariants(medicine) {
    const medicineText = medicine.sections.map((section) => [section.content, ...(section.blocks || []).map((block) => block.content)].join(" ")).join(" ");
    const explicitNameForms = medicineFormsInText(`${medicine.name} ${medicine.leafletPath || ""}`);
    const inferredForm = explicitNameForms[0]
      || MEDICINE_FORM_RULES.find((rule) => rule.pattern.test(medicineText))?.key
      || "";
    const presentationsFromText = medicine.presentations?.length ? [] : inferredPresentations(medicine);
    const savedPresentations = medicine.presentations?.length
      ? medicine.presentations
      : presentationsFromText.length
        ? presentationsFromText
        : (medicine.strengths || []).map((strength) => ({ strength, form: "", label: strength }));
    const presentationOptions = savedPresentations
      .map((presentation) => ({
        ...presentation,
        form: presentation.form || inferredForm,
        label: [presentation.strength, presentation.form || inferredForm].filter(Boolean).join(" ") || presentation.label,
      })).filter((presentation) => (
        presentation.label
        && (!explicitNameForms.length || explicitNameForms.some((form) => medicineFormsAreCompatible(form, presentation.form)))
      ));
    const presentations = [...new Map(presentationOptions.map((presentation) => [
      `${normalizedStrengthKey(presentation.strength)}|${canonicalMedicineForm(presentation.form)}`,
      presentation,
    ])).values()];
    if (!presentations.length) {
      const namedForm = medicineFormsInText(`${medicine.name} ${medicine.leafletPath || ""}`)[0];
      return namedForm
        ? [{ ...medicine, sections: sectionsForPresentation(medicine, { strength: "", form: namedForm, label: namedForm }) }]
        : [medicine];
    }

    return presentations.map((presentation) => {
      const presentationMedicine = presentation.sourceMedicine || medicine;
      return {
        ...presentationMedicine,
        name: `${medicine.name} ${presentation.label}`,
        aliases: `${medicine.aliases || ""} ${presentation.label}`,
        sections: sectionsForPresentation(presentationMedicine, presentation),
      };
    });
  }

  async function ensureMedicineDataLoaded() {
    if (MEDICINE_SEARCH_INDEX.length) return;
    if (medicineDataLoadPromise) return medicineDataLoadPromise;

    medicineDataLoadPromise = (async () => {
      const payload = window.desktopMedicineData
        ? await window.desktopMedicineData.load()
        : null;
      const raiaMedicineLibrary = payload ? JSON.parse(payload.raia) : window.RAIA_MEDICINE_LIBRARY || [];
      const xlsxMedicineLibrary = payload ? JSON.parse(payload.xlsx) : window.XLSX_MEDICINE_LIBRARY || [];
      const eanMedicineAliases = payload ? JSON.parse(payload.aliases) : window.EAN_MEDICINE_ALIASES || {};
      const raiaSourceSlugs = new Set(raiaMedicineLibrary.map((medicine) => (
        String(medicine.leafletPath || "").split("/").at(-1).replace(/\.pdf$/i, "").toLocaleLowerCase("pt-BR")
      )));
      const canonicalBySlug = new Map();
      const laboratoryVariants = [];

      for (const medicine of raiaMedicineLibrary) {
        const baseSlug = laboratoryBaseSlug(medicine, raiaSourceSlugs);
        if (baseSlug) laboratoryVariants.push({ medicine, baseSlug });
        else canonicalBySlug.set(String(medicine.leafletPath || "").split("/").at(-1).replace(/\.pdf$/i, "").toLocaleLowerCase("pt-BR"), {
          ...medicine,
          presentations: [...(medicine.presentations || [])],
        });
      }
      for (const { medicine, baseSlug } of laboratoryVariants) {
        const baseMedicine = canonicalBySlug.get(baseSlug);
        if (!baseMedicine) continue;
        const presentations = medicine.presentations || (medicine.strengths || []).map((strength) => ({ strength, form: "", label: strength }));
        baseMedicine.presentations.push(...presentations.map((presentation) => ({ ...presentation, sourceMedicine: medicine })));
      }

      const defaultMedicineEans = new Set(DEFAULT_MEDICINE_LIBRARY.map((medicine) => medicine.ean));
      const defaultMedicineNames = new Set(DEFAULT_MEDICINE_LIBRARY.map((medicine) => medicine.name.toLocaleLowerCase("pt-BR")));
      const medicineSources = [
        ...DEFAULT_MEDICINE_LIBRARY,
        ...[...canonicalBySlug.values()].filter((medicine) => (
          !defaultMedicineEans.has(medicine.ean)
          && !defaultMedicineNames.has(String(medicine.name || "").toLocaleLowerCase("pt-BR"))
        )),
        ...xlsxMedicineLibrary,
      ];
      MEDICINE_LIBRARY = medicineSources.flatMap(createMedicineVariants);
      const medicineVariantsBySlug = new Map();
      const medicineSourcesBySlug = new Map();
      for (const medicine of medicineSources) {
        const medicineSlug = String(medicine.leafletPath || "").split("/").at(-1).replace(/\.pdf$/i, "").toLocaleLowerCase("pt-BR");
        medicineSourcesBySlug.set(medicineSlug, medicine);
      }
      for (const medicine of MEDICINE_LIBRARY) {
        const medicineSlug = String(medicine.leafletPath || "").split("/").at(-1).replace(/\.pdf$/i, "").toLocaleLowerCase("pt-BR");
        const variants = medicineVariantsBySlug.get(medicineSlug) || [];
        variants.push(medicine);
        medicineVariantsBySlug.set(medicineSlug, variants);
      }

      const groupedEanAliases = new Map();
      for (const alias of Object.values(eanMedicineAliases)) {
        const presentationKey = `${alias.candidateSlug}|${normalize(alias.strength).replace(/\s/g, "")}|${normalize(alias.form)}`;
        const aliases = groupedEanAliases.get(presentationKey) || [];
        aliases.push(alias);
        groupedEanAliases.set(presentationKey, aliases);
      }
      for (const aliases of groupedEanAliases.values()) {
        const alias = aliases[0];
        const variants = medicineVariantsBySlug.get(alias.candidateSlug) || [];
        if (!variants.length) continue;
        const wantedStrength = normalizedStrengthKey(alias.strength);
        const wantedForm = normalize(alias.form);
        const matchingVariant = variants.find((medicine) => {
          const presentation = normalize(`${medicine.name} ${medicine.aliases || ""}`);
          const variantStrengths = [...presentation.matchAll(/\b\d+(?:[,.]\d+)?\s*(?:mcg|mg|g)(?:\s*\/\s*(?:ml|g))?(?![a-z])/gi)]
            .map((match) => normalizedStrengthKey(match[0]));
          return (!wantedStrength || variantStrengths.includes(wantedStrength))
            && (!wantedForm || medicineFormsAreCompatible(presentation, wantedForm));
        });
        let targetMedicine = matchingVariant;
        if (!targetMedicine && (alias.strength || alias.form)) {
          const sourceMedicine = medicineSourcesBySlug.get(alias.candidateSlug) || variants[0];
          const presentationLabel = [String(alias.strength || "").toLocaleLowerCase("pt-BR"), alias.form].filter(Boolean).join(" ");
          const sourceName = normalize(sourceMedicine.name);
          const compatibleVariant = MEDICINE_LIBRARY.find((medicine) => {
            if (variants.includes(medicine)) return false;
            const variantName = normalize(medicine.name);
            const sameMedicine = variantName.includes(sourceName) || sourceName.includes(variantName.split(/\d/)[0].trim());
            if (!sameMedicine) return false;
            const variantStrengths = [...variantName.matchAll(/\b\d+(?:[,.]\d+)?\s*(?:mcg|mg|g)(?:\s*\/\s*(?:ml|g))?(?![a-z])/gi)]
              .map((match) => normalizedStrengthKey(match[0]));
            return (!wantedStrength || variantStrengths.includes(wantedStrength))
              && (!wantedForm || medicineFormsAreCompatible(variantName, wantedForm));
          });
          targetMedicine = {
            ...(compatibleVariant || sourceMedicine),
            name: `${sourceMedicine.name} ${presentationLabel}`.trim(),
            aliases: `${compatibleVariant?.aliases || ""} ${presentationLabel}`.trim(),
            sections: compatibleVariant?.sections || sectionsForPresentation(sourceMedicine, {
              strength: alias.strength,
              form: alias.form,
              label: presentationLabel,
            }),
          };
          MEDICINE_LIBRARY.push(targetMedicine);
          variants.push(targetMedicine);
        }
        targetMedicine ||= variants[0];
        const commercialAliases = aliases.flatMap((item) => [
          item.ean,
          item.commercialName,
          item.activeIngredient,
        ]).filter(Boolean).join(" ");
        targetMedicine.aliases = `${targetMedicine.aliases || ""} ${commercialAliases}`.trim();
      }

      MEDICINE_SEARCH_INDEX = MEDICINE_LIBRARY.map((medicine, index) => ({
        medicine,
        index,
        name: normalize(medicine.name),
        ean: normalize(medicine.ean),
        searchText: normalize(`${medicine.name} ${medicine.ean || ""} ${medicine.aliases || ""}`),
      }));
    })().catch((error) => {
      medicineDataLoadPromise = null;
      throw error;
    });

    return medicineDataLoadPromise;
  }
  const MAX_MEDICINE_RESULTS = 24;
  let medicineSearchTimer = 0;

  const state = {
    patients: [],
    applications: [],
    bioRecords: [],
    clinicalRecords: [],
    doctors: [],
    users: seedUsers.map((user) => ({ ...user })),
    currentUserId: loadSessionUser(),
    currentUser: null,
    search: "",
    currentBioPatientId: "",
    currentBioStep: 2,
    currentClinicalPatientId: "",
    currentClinicalKind: "",
    currentServicePatientId: "",
    currentHistoryPatientId: "",
    activeNav: "dashboard",
    sidebarOpen: false,
    reportPreviewEntries: [],
    editingPatientId: "",
    editingUserId: "",
    editingPricingProductId: "",
    pricingFormSource: "",
    activeDateInputId: "",
    datePickerMonth: new Date().getMonth(),
    datePickerYear: new Date().getFullYear(),
    pricingProducts: [],
    pricingSettings: createDefaultPricingSettings(),
    pricingTabs: [],
    purchaseShortages: [],
    purchaseOrders: [],
    activePricingTabId: "default",
    offerImageDataUrl: "",
    offerOriginalImageDataUrl: "",
    offerProcessedImageDataUrl: "",
    offerImageZoom: 100,
    offerImagePositionX: 0,
    offerImagePositionY: 0,
    offerShadowZoom: 100,
    offerShadowHeight: 100,
    offerShadowPositionX: 0,
    offerShadowPositionY: 0,
    offerTitleBandPositionX: 0,
    offerTitleBandPositionY: 0,
    offerPricesPositionX: 0,
    offerPricesPositionY: 0,
    offerTopTextPositionX: 0,
    offerTopTextPositionY: 0,
    offerNamePositionX: 0,
    offerNamePositionY: 0,
    offerDescriptionPositionX: 0,
    offerDescriptionPositionY: 0,
    offerOriginalPricePositionX: 0,
    offerOriginalPricePositionY: 0,
    offerDiscountPricePositionX: 0,
    offerDiscountPricePositionY: 0,
    offerCanvasFormat: "story",
    offerBackgroundRemoved: false,
    offerBackgroundProcessing: false,
    offerBackgroundRemovalVersion: 0,
    offerStockMessageEnabled: true,
    savedOfferArts: [],
    activeSavedOfferArtId: "",
    offerArtNameMode: "save",
    offerArtRenameId: "",
    supabaseSession: null,
    supabaseConnectionError: "",
    onlineOfferFiles: [],
    editingOnlineOffer: null,
    onlineOfferEditLoading: false,
    publishedOffers: [],
    onlineOffersLoading: false,
    onlineOffersPublishing: false,
    onlineOffersProcessingImages: false,
    onlineBackendReady: false,
    onlineBackendChecked: false,
    trierProducts: [],
    trierProductsSyncedAt: "",
    trierSyncError: "",
    selectedQuoteProduct: null,
    whatsappQuoteItems: [],
  };

  const elements = {
    patientsTable: document.getElementById("patients-table"),
    activityList: document.getElementById("activity-list"),
    monthlyApplications: document.getElementById("monthly-applications"),
    totalPatients: document.getElementById("total-patients"),
    nextAction: document.getElementById("next-action"),
    searchInput: document.getElementById("search-input"),
    sidebar: document.querySelector(".sidebar"),
    sidebarHandle: document.querySelector(".sidebar-handle"),
    patientModal: document.getElementById("patient-modal"),
    patientsModal: document.getElementById("patients-modal"),
    closePatients: document.getElementById("close-patients"),
    patientsSearch: document.getElementById("patients-search"),
    patientsList: document.getElementById("patients-list"),
    authScreen: document.getElementById("auth-screen"),
    loginForm: document.getElementById("login-form"),
    loginIdentifier: document.getElementById("login-identifier"),
    loginPassword: document.getElementById("login-password"),
    currentUserLabel: document.getElementById("current-user-label"),
    logoutButton: document.getElementById("logout-button"),
    topbarLogout: document.getElementById("topbar-logout"),
    openAccount: document.getElementById("open-account"),
    openMedicines: document.getElementById("open-medicines"),
    openChat: document.getElementById("open-chat"),
    openUsers: document.getElementById("open-users"),
    openDoctors: document.getElementById("open-doctors"),
    openPurchases: document.getElementById("open-purchases"),
    openPricing: document.getElementById("open-pricing"),
    openOfferSheet: document.getElementById("open-offer-sheet"),
    openOnlineOffers: document.getElementById("open-online-offers"),
    openWhatsappQuote: document.getElementById("open-whatsapp-quote"),
    patientForm: document.getElementById("patient-form"),
    historyModal: document.getElementById("history-modal"),
    closeHistory: document.getElementById("close-history"),
    historyAvatar: document.getElementById("history-avatar"),
    historyTitle: document.getElementById("history-title"),
    historySubtitle: document.getElementById("history-subtitle"),
    historyMeta: document.getElementById("history-meta"),
    historyStartDate: document.getElementById("history-start-date"),
    historyEndDate: document.getElementById("history-end-date"),
    historyFull: document.getElementById("history-full"),
    historySections: document.getElementById("history-sections"),
    registerModal: document.getElementById("register-modal"),
    closeRegister: document.getElementById("close-register"),
    reportForm: document.getElementById("report-form"),
    reportBy: document.getElementById("report-by"),
    reportType: document.getElementById("report-type"),
    reportPatientFilter: document.getElementById("report-patient-filter"),
    reportPatientSearch: document.getElementById("report-patient-search"),
    reportPatients: document.getElementById("report-patients"),
    reportServices: document.getElementById("report-services"),
    reportServicesToggle: document.getElementById("report-services-toggle"),
    reportServicesMenu: document.getElementById("report-services-menu"),
    reportSelectAllServices: document.getElementById("report-select-all-services"),
    reportStartDate: document.getElementById("report-start-date"),
    reportEndDate: document.getElementById("report-end-date"),
    reportClear: document.getElementById("report-clear"),
    reportResult: document.getElementById("report-result"),
    reportPreviewEmpty: document.getElementById("report-preview-empty"),
    reportPreviewButton: document.getElementById("report-preview-button"),
    patientDetailModal: document.getElementById("patient-detail-modal"),
    closeDetail: document.getElementById("close-detail"),
    detailAvatar: document.getElementById("detail-avatar"),
    detailTitle: document.getElementById("patient-detail-title"),
    detailSubtitle: document.getElementById("detail-subtitle"),
    detailBirth: document.getElementById("detail-birth"),
    detailSex: document.getElementById("detail-sex"),
    detailAddress: document.getElementById("detail-address"),
    bioModal: document.getElementById("bioimpedance-modal"),
    clinicalModal: document.getElementById("clinical-modal"),
    serviceModal: document.getElementById("service-launcher-modal"),
    medicinesModal: document.getElementById("medicines-modal"),
    chatModal: document.getElementById("chat-modal"),
    closeBio: document.getElementById("close-bio"),
    closeClinical: document.getElementById("close-clinical"),
    closeServiceModal: document.getElementById("close-service-launcher"),
    closeMedicines: document.getElementById("close-medicines"),
    closeChat: document.getElementById("close-chat"),
    bioAvatar: document.getElementById("bio-avatar"),
    bioTitle: document.getElementById("bio-title"),
    bioSubtitle: document.getElementById("bio-subtitle"),
    bioDate: document.getElementById("bio-date"),
    bioTime: document.getElementById("bio-time"),
    bioForm: document.getElementById("bio-form"),
    bioPrev: document.getElementById("bio-prev"),
    bioNext: document.getElementById("bio-next"),
    bioInterpret: document.getElementById("bio-interpret"),
    bioSave: document.getElementById("bio-save"),
    bioSavePrint: document.getElementById("bio-save-print"),
    bioResult: document.getElementById("bio-result"),
    bioResultCard: document.getElementById("bio-result-card"),
    clinicalAvatar: document.getElementById("clinical-avatar"),
    clinicalLabel: document.getElementById("clinical-label"),
    clinicalTitle: document.getElementById("clinical-title"),
    clinicalSubtitle: document.getElementById("clinical-subtitle"),
    clinicalDate: document.getElementById("clinical-date"),
    clinicalTime: document.getElementById("clinical-time"),
    clinicalForm: document.getElementById("clinical-form"),
    clinicalCancel: document.getElementById("clinical-cancel"),
    clinicalSaveBack: document.getElementById("clinical-save-back"),
    clinicalSavePrint: document.getElementById("clinical-save-print"),
    clinicalSave: document.getElementById("clinical-save"),
    professionalSignatureCanvas: document.getElementById("injectable-professional-signature-canvas"),
    patientSignatureCanvas: document.getElementById("injectable-patient-signature-canvas"),
    injectableHasNextDose: document.getElementById("injectable-has-next-dose"),
    injectableNextDateField: document.getElementById("injectable-next-date-field"),
    injectableNextTimeField: document.getElementById("injectable-next-time-field"),
    customDateInputs: Array.from(document.querySelectorAll(".custom-date-input")),
    customDatePicker: document.getElementById("custom-date-picker"),
    customDatePrev: document.getElementById("custom-date-prev"),
    customDateNext: document.getElementById("custom-date-next"),
    customDateMonth: document.getElementById("custom-date-month"),
    customDateYear: document.getElementById("custom-date-year"),
    customDateGrid: document.getElementById("custom-date-grid"),
    servicePatientSearch: document.getElementById("service-patient-search"),
    medicinesSearch: document.getElementById("medicines-search"),
    medicinesResults: document.getElementById("medicines-results"),
    chatMessages: document.getElementById("chat-messages"),
    chatForm: document.getElementById("chat-form"),
    chatInput: document.getElementById("chat-input"),
    servicePatientResults: document.getElementById("service-patient-results"),
    servicePatient: document.getElementById("service-patient"),
    serviceSearchPanel: document.getElementById("service-search-panel"),
    serviceContinue: document.getElementById("service-continue"),
    serviceChange: document.getElementById("service-change"),
    serviceClientName: document.getElementById("service-client-name"),
    serviceSelectedAvatar: document.getElementById("service-selected-avatar"),
    serviceSelectedName: document.getElementById("service-selected-name"),
    serviceSelectedCpf: document.getElementById("service-selected-cpf"),
    serviceConfirmedAvatar: document.getElementById("service-confirmed-avatar"),
    serviceConfirmedCpf: document.getElementById("service-confirmed-cpf"),
    serviceSteps: Array.from(document.querySelectorAll("[data-launcher-step]")),
    clinicalPanels: Array.from(document.querySelectorAll("[data-clinical-kind]")),
    bioStepNodes: Array.from(document.querySelectorAll(".bio-step")),
    bioPanels: Array.from(document.querySelectorAll("[data-bio-step]")),
    sidebarItems: Array.from(document.querySelectorAll("[data-nav]")),
    usersModal: document.getElementById("users-modal"),
    closeUsers: document.getElementById("close-users"),
    usersForm: document.getElementById("users-form"),
    usersFormSubtitle: document.getElementById("users-form-subtitle"),
    usersSubmitLabel: document.getElementById("users-submit-label"),
    cancelUserEdit: document.getElementById("cancel-user-edit"),
    userName: document.getElementById("user-name"),
    userCpf: document.getElementById("user-cpf"),
    userCrf: document.getElementById("user-crf"),
    userEmail: document.getElementById("user-email"),
    userPassword: document.getElementById("user-password"),
    userPasswordHelp: document.getElementById("user-password-help"),
    userRole: document.getElementById("user-role"),
    usersList: document.getElementById("users-list"),
    accountModal: document.getElementById("account-modal"),
    closeAccount: document.getElementById("close-account"),
    accountName: document.getElementById("account-name"),
    accountRole: document.getElementById("account-role"),
    accountEmail: document.getElementById("account-email"),
    accountCpf: document.getElementById("account-cpf"),
    accountCrf: document.getElementById("account-crf"),
    doctorsModal: document.getElementById("doctors-modal"),
    closeDoctors: document.getElementById("close-doctors"),
    doctorsForm: document.getElementById("doctors-form"),
    doctorName: document.getElementById("doctor-name"),
    doctorRegistry: document.getElementById("doctor-registry"),
    doctorUf: document.getElementById("doctor-uf"),
    doctorsList: document.getElementById("doctors-list"),
    searchDoctorByRegistry: document.getElementById("search-doctor-by-registry"),
    doctorLookupModal: document.getElementById("doctor-lookup-modal"),
    doctorLookupContinue: document.getElementById("doctor-lookup-continue"),
    purchasesModal: document.getElementById("purchases-modal"),
    closePurchases: document.getElementById("close-purchases"),
    purchasesTabs: Array.from(document.querySelectorAll("[data-purchases-tab]")),
    purchasesPanels: Array.from(document.querySelectorAll("[data-purchases-panel]")),
    shortageForm: document.getElementById("shortage-form"),
    shortageProduct: document.getElementById("shortage-product"),
    shortageQuantity: document.getElementById("shortage-quantity"),
    shortageDate: document.getElementById("shortage-date"),
    shortagesCount: document.getElementById("shortages-count"),
    shortagesList: document.getElementById("shortages-list"),
    orderForm: document.getElementById("order-form"),
    orderName: document.getElementById("order-name"),
    orderDate: document.getElementById("order-date"),
    orderPhone: document.getElementById("order-phone"),
    orderProduct: document.getElementById("order-product"),
    orderQuantity: document.getElementById("order-quantity"),
    ordersCount: document.getElementById("orders-count"),
    ordersList: document.getElementById("orders-list"),
    whatsappQuoteModal: document.getElementById("whatsapp-quote-modal"),
    closeWhatsappQuote: document.getElementById("close-whatsapp-quote"),
    trierStatus: document.getElementById("trier-status"),
    trierConfigToggle: document.getElementById("trier-config-toggle"),
    trierConfigForm: document.getElementById("trier-config-form"),
    trierApiBaseUrl: document.getElementById("trier-api-base-url"),
    trierApiToken: document.getElementById("trier-api-token"),
    trierConfigMessage: document.getElementById("trier-config-message"),
    trierConfigCancel: document.getElementById("trier-config-cancel"),
    trierConfigSave: document.getElementById("trier-config-save"),
    quoteProductForm: document.getElementById("quote-product-form"),
    quoteProductSearch: document.getElementById("quote-product-search"),
    quoteSearchResults: document.getElementById("quote-search-results"),
    quoteProductQuantity: document.getElementById("quote-product-quantity"),
    quoteProductPrice: document.getElementById("quote-product-price"),
    quoteAddProduct: document.querySelector(".quote-add-product"),
    quoteSelectedProduct: document.getElementById("quote-selected-product"),
    quoteProductsEmpty: document.getElementById("quote-products-empty"),
    quoteItems: document.getElementById("quote-items"),
    quoteCustomerName: document.getElementById("quote-customer-name"),
    quoteItemsCount: document.getElementById("quote-items-count"),
    quoteTotal: document.getElementById("quote-total"),
    sendWhatsappQuote: document.getElementById("send-whatsapp-quote"),
    copyWhatsappQuote: document.getElementById("copy-whatsapp-quote"),
    clearWhatsappQuote: document.getElementById("clear-whatsapp-quote"),
    pricingModal: document.getElementById("pricing-modal"),
    closePricing: document.getElementById("close-pricing"),
    pricingSettingsPanel: document.getElementById("pricing-settings-panel"),
    pricingProductsPanel: document.querySelector(".pricing-products-panel"),
    pricingProductsListWrap: document.getElementById("pricing-products-list-wrap"),
    pricingProductIntro: document.getElementById("pricing-product-intro"),
    pricingSettingsForm: document.getElementById("pricing-settings-form"),
    pricingTaxList: document.getElementById("pricing-tax-list"),
    pricingFixedList: document.getElementById("pricing-fixed-list"),
    pricingEstimatedRevenue: document.getElementById("pricing-estimated-revenue"),
    pricingAddTax: document.getElementById("pricing-add-tax"),
    pricingAddFixedCost: document.getElementById("pricing-add-fixed-cost"),
    pricingTotalTaxRate: document.getElementById("pricing-total-tax-rate"),
    pricingTotalFixedCost: document.getElementById("pricing-total-fixed-cost"),
    pricingFixedCostShare: document.getElementById("pricing-fixed-cost-share"),
    pricingSettingsNote: document.getElementById("pricing-settings-note"),
    pricingProductForm: document.getElementById("pricing-product-form"),
    pricingProductName: document.getElementById("pricing-product-name"),
    pricingProductSku: document.getElementById("pricing-product-sku"),
    pricingProductCost: document.getElementById("pricing-product-cost"),
    pricingSalePrice: document.getElementById("pricing-sale-price"),
    pricingTargetProfit: document.getElementById("pricing-target-profit"),
    pricingCardMethod: document.getElementById("pricing-card-method"),
    pricingCardRates: document.getElementById("pricing-card-rates"),
    pricingTotalCost: document.getElementById("pricing-total-cost"),
    pricingTaxAmount: document.getElementById("pricing-tax-amount"),
    pricingRealProfit: document.getElementById("pricing-real-profit"),
    pricingGrossMarkup: document.getElementById("pricing-gross-markup"),
    pricingStatus: document.getElementById("pricing-status"),
    pricingProfitAmountInline: document.getElementById("pricing-profit-amount-inline"),
    pricingProfitMeterFill: document.getElementById("pricing-profit-meter-fill"),
    pricingProfitStatusLabel: document.getElementById("pricing-profit-status-label"),
    pricingBreakdownCost: document.getElementById("pricing-breakdown-cost"),
    pricingBreakdownTax: document.getElementById("pricing-breakdown-tax"),
    pricingBreakdownFixed: document.getElementById("pricing-breakdown-fixed"),
    pricingBreakdownProfit: document.getElementById("pricing-breakdown-profit"),
    pricingBreakdown: document.getElementById("pricing-breakdown"),
    pricingCancelEdit: document.getElementById("pricing-cancel-edit"),
    pricingProductsList: document.getElementById("pricing-products-list"),
    pricingTabsToggle: document.getElementById("pricing-tabs-toggle"),
    pricingTabsMenu: document.getElementById("pricing-tabs-menu"),
    pricingNewTab: document.getElementById("pricing-new-tab"),
    pricingSaveScreen: document.getElementById("pricing-save-screen"),
    pricingTabName: document.getElementById("pricing-tab-name"),
    offerSheetModal: document.getElementById("offer-sheet-modal"),
    closeOfferSheet: document.getElementById("close-offer-sheet"),
    onlineOffersModal: document.getElementById("online-offers-modal"),
    closeOnlineOffers: document.getElementById("close-online-offers"),
    onlineOffersForm: document.getElementById("online-offers-form"),
    onlineOffersFormLabel: document.getElementById("online-offers-form-label"),
    onlineOffersFormTitle: document.getElementById("online-offers-form-title"),
    onlineOfferTitle: document.getElementById("online-offer-title"),
    onlineOfferExpiration: document.getElementById("online-offer-expiration"),
    onlineOfferImages: document.getElementById("online-offer-images"),
    onlineOffersSelectionCount: document.getElementById("online-offers-selection-count"),
    onlineOffersSelectionEmpty: document.getElementById("online-offers-selection-empty"),
    onlineOffersSelection: document.getElementById("online-offers-selection"),
    onlineOffersAddMore: document.getElementById("online-offers-add-more"),
    onlineOffersCancelEdit: document.getElementById("online-offers-cancel-edit"),
    onlineOffersProgress: document.getElementById("online-offers-progress"),
    onlineOffersProgressLabel: document.getElementById("online-offers-progress-label"),
    onlineOffersProgressValue: document.getElementById("online-offers-progress-value"),
    onlineOffersProgressBar: document.getElementById("online-offers-progress-bar"),
    publishOnlineOffer: document.getElementById("publish-online-offer"),
    refreshOnlineOffers: document.getElementById("refresh-online-offers"),
    onlineOffersList: document.getElementById("online-offers-list"),
    onlineOffersServiceStatus: document.getElementById("online-offers-service-status"),
    onlineOffersServiceTitle: document.getElementById("online-offers-service-title"),
    onlineOffersServiceMessage: document.getElementById("online-offers-service-message"),
    supabasePublisherLogin: document.getElementById("supabase-publisher-login"),
    supabasePublisherEmail: document.getElementById("supabase-publisher-email"),
    supabasePublisherPassword: document.getElementById("supabase-publisher-password"),
    supabasePublisherConnect: document.getElementById("supabase-publisher-connect"),
    supabasePublisherDisconnect: document.getElementById("supabase-publisher-disconnect"),
    offerSheetForm: document.getElementById("offer-sheet-form"),
    offerProductName: document.getElementById("offer-product-name"),
    offerOriginalPrice: document.getElementById("offer-original-price"),
    offerDiscountPrice: document.getElementById("offer-discount-price"),
    offerDescription: document.getElementById("offer-description"),
    offerDescriptionColor: document.getElementById("offer-description-color"),
    offerDescriptionFontSize: document.getElementById("offer-description-font-size"),
    offerDescriptionMoveUp: document.getElementById("offer-description-move-up"),
    offerDescriptionMoveDown: document.getElementById("offer-description-move-down"),
    offerDescriptionMoveLeft: document.getElementById("offer-description-move-left"),
    offerDescriptionMoveRight: document.getElementById("offer-description-move-right"),
    offerDescriptionPositionReset: document.getElementById("offer-description-position-reset"),
    offerNameFontSize: document.getElementById("offer-name-font-size"),
    offerNameWidth: document.getElementById("offer-name-width"),
    offerNameWidthValue: document.getElementById("offer-name-width-value"),
    offerNameHeight: document.getElementById("offer-name-height"),
    offerNameHeightValue: document.getElementById("offer-name-height-value"),
    offerNameMoveUp: document.getElementById("offer-name-move-up"),
    offerNameMoveDown: document.getElementById("offer-name-move-down"),
    offerNameMoveLeft: document.getElementById("offer-name-move-left"),
    offerNameMoveRight: document.getElementById("offer-name-move-right"),
    offerNamePositionReset: document.getElementById("offer-name-position-reset"),
    offerSpecialTopText: document.getElementById("offer-special-top-text"),
    offerSpecialBandText: document.getElementById("offer-special-band-text"),
    offerSpecialText: document.getElementById("offer-special-top-text"),
    offerSpecialTextColor: document.getElementById("offer-top-text-color"),
    offerBandTextColor: document.getElementById("offer-band-text-color"),
    offerSpecialBackgroundColor: document.getElementById("offer-special-background-color"),
    offerTopTilt: document.getElementById("offer-top-tilt"),
    offerTopTiltValue: document.getElementById("offer-top-tilt-value"),
    offerTopFontSize: document.getElementById("offer-top-font-size"),
    offerBandTilt: document.getElementById("offer-band-tilt"),
    offerBandTiltValue: document.getElementById("offer-band-tilt-value"),
    offerBandFontSize: document.getElementById("offer-band-font-size"),
    offerBandWidth: document.getElementById("offer-band-width"),
    offerBandWidthValue: document.getElementById("offer-band-width-value"),
    offerBandHeight: document.getElementById("offer-band-height"),
    offerBandHeightValue: document.getElementById("offer-band-height-value"),
    offerTitleBandMoveUp: document.getElementById("offer-title-band-move-up"),
    offerTitleBandMoveDown: document.getElementById("offer-title-band-move-down"),
    offerTitleBandMoveLeft: document.getElementById("offer-title-band-move-left"),
    offerTitleBandMoveRight: document.getElementById("offer-title-band-move-right"),
    offerTitleBandPositionReset: document.getElementById("offer-title-band-position-reset"),
    offerResizeMenu: document.getElementById("offer-resize-menu"),
    offerResizeOptions: document.getElementById("offer-resize-options"),
    offerResizeLabel: document.getElementById("offer-resize-label"),
    offerPreviewFormat: document.getElementById("offer-preview-format"),
    offerProductNameColor: document.getElementById("offer-product-name-color"),
    offerOriginalPriceColor: document.getElementById("offer-original-price-color"),
    offerOriginalFontSize: document.getElementById("offer-original-font-size"),
    offerDiscountPriceColor: document.getElementById("offer-discount-price-color"),
    offerDiscountFontSize: document.getElementById("offer-discount-font-size"),
    offerPriceLabelBackgroundColor: document.getElementById("offer-price-label-background-color"),
    offerPriceLabelFontSize: document.getElementById("offer-price-label-font-size"),
    offerPriceLabelWidth: document.getElementById("offer-price-label-width"),
    offerPriceLabelWidthValue: document.getElementById("offer-price-label-width-value"),
    offerPriceLabelHeight: document.getElementById("offer-price-label-height"),
    offerPriceLabelHeightValue: document.getElementById("offer-price-label-height-value"),
    offerOriginalMoveUp: document.getElementById("offer-original-move-up"),
    offerOriginalMoveDown: document.getElementById("offer-original-move-down"),
    offerOriginalMoveLeft: document.getElementById("offer-original-move-left"),
    offerOriginalMoveRight: document.getElementById("offer-original-move-right"),
    offerOriginalPositionReset: document.getElementById("offer-original-position-reset"),
    offerDiscountMoveUp: document.getElementById("offer-discount-move-up"),
    offerDiscountMoveDown: document.getElementById("offer-discount-move-down"),
    offerDiscountMoveLeft: document.getElementById("offer-discount-move-left"),
    offerDiscountMoveRight: document.getElementById("offer-discount-move-right"),
    offerDiscountPositionReset: document.getElementById("offer-discount-position-reset"),
    offerTopMoveUp: document.getElementById("offer-top-move-up"),
    offerTopMoveDown: document.getElementById("offer-top-move-down"),
    offerTopMoveLeft: document.getElementById("offer-top-move-left"),
    offerTopMoveRight: document.getElementById("offer-top-move-right"),
    offerTopPositionReset: document.getElementById("offer-top-position-reset"),
    offerValidUntil: document.getElementById("offer-valid-until"),
    offerStockToggle: document.getElementById("offer-stock-toggle"),
    openSavedOfferArts: document.getElementById("open-saved-offer-arts"),
    savedOfferArtsModal: document.getElementById("saved-offer-arts-modal"),
    closeSavedOfferArts: document.getElementById("close-saved-offer-arts"),
    savedOfferArtList: document.getElementById("saved-offer-art-list"),
    saveOfferArt: document.getElementById("save-offer-art"),
    saveOfferPdf: document.getElementById("save-offer-pdf"),
    offerArtNameModal: document.getElementById("offer-art-name-modal"),
    closeOfferArtName: document.getElementById("close-offer-art-name"),
    cancelOfferArtName: document.getElementById("cancel-offer-art-name"),
    offerArtNameForm: document.getElementById("offer-art-name-form"),
    offerArtNameTitle: document.getElementById("offer-art-name-title"),
    offerArtName: document.getElementById("offer-art-name"),
    confirmOfferArtName: document.getElementById("confirm-offer-art-name"),
    offerImageInput: document.getElementById("offer-image-input"),
    offerImagePicker: document.getElementById("offer-image-picker"),
    offerImageThumb: document.getElementById("offer-image-thumb"),
    removeOfferImage: document.getElementById("remove-offer-image"),
    offerBackgroundRemoval: document.getElementById("offer-background-removal"),
    offerBackgroundButton: document.getElementById("offer-background-button"),
    offerImageZoomControls: document.getElementById("offer-image-zoom-controls"),
    offerImageTab: document.getElementById("offer-image-tab"),
    offerShadowTab: document.getElementById("offer-shadow-tab"),
    offerImageAdjustments: document.getElementById("offer-image-adjustments"),
    offerShadowAdjustments: document.getElementById("offer-shadow-adjustments"),
    offerImageZoom: document.getElementById("offer-image-zoom"),
    offerImageZoomValue: document.getElementById("offer-image-zoom-value"),
    offerImageZoomOut: document.getElementById("offer-image-zoom-out"),
    offerImageZoomIn: document.getElementById("offer-image-zoom-in"),
    offerImageZoomReset: document.getElementById("offer-image-zoom-reset"),
    offerImageMoveUp: document.getElementById("offer-image-move-up"),
    offerImageMoveDown: document.getElementById("offer-image-move-down"),
    offerImageMoveLeft: document.getElementById("offer-image-move-left"),
    offerImageMoveRight: document.getElementById("offer-image-move-right"),
    offerImagePositionReset: document.getElementById("offer-image-position-reset"),
    offerShadowZoom: document.getElementById("offer-shadow-zoom"),
    offerShadowZoomValue: document.getElementById("offer-shadow-zoom-value"),
    offerShadowZoomOut: document.getElementById("offer-shadow-zoom-out"),
    offerShadowZoomIn: document.getElementById("offer-shadow-zoom-in"),
    offerShadowZoomReset: document.getElementById("offer-shadow-zoom-reset"),
    offerShadowHeight: document.getElementById("offer-shadow-height"),
    offerShadowHeightValue: document.getElementById("offer-shadow-height-value"),
    offerShadowHeightOut: document.getElementById("offer-shadow-height-out"),
    offerShadowHeightIn: document.getElementById("offer-shadow-height-in"),
    offerShadowHeightReset: document.getElementById("offer-shadow-height-reset"),
    offerShadowMoveUp: document.getElementById("offer-shadow-move-up"),
    offerShadowMoveDown: document.getElementById("offer-shadow-move-down"),
    offerShadowMoveLeft: document.getElementById("offer-shadow-move-left"),
    offerShadowMoveRight: document.getElementById("offer-shadow-move-right"),
    offerShadowPositionReset: document.getElementById("offer-shadow-position-reset"),
    clearOfferSheet: document.getElementById("clear-offer-sheet"),
    offerPreviewName: document.getElementById("offer-preview-name"),
    offerPreviewSpecial: document.getElementById("offer-preview-special"),
    offerPreviewSpecialLead: document.getElementById("offer-preview-special-lead"),
    offerPreviewSpecialBand: document.getElementById("offer-preview-special-band"),
    offerPreviewDescription: document.getElementById("offer-preview-description"),
    offerPreviewPrices: document.getElementById("offer-preview-prices"),
    offerPreviewOriginal: document.getElementById("offer-preview-original"),
    offerPreviewOriginalWrap: document.getElementById("offer-preview-original-wrap"),
    offerPreviewDiscount: document.getElementById("offer-preview-discount"),
    offerPreviewDiscountWrap: document.getElementById("offer-preview-discount-wrap"),
    offerPreviewImage: document.getElementById("offer-preview-image"),
    offerPreviewImageWrap: document.getElementById("offer-preview-image-wrap"),
    offerPreviewPlaceholder: document.getElementById("offer-preview-placeholder"),
    offerSheetPreview: document.getElementById("offer-sheet-preview"),
    offerTemplateBackground: document.getElementById("offer-template-background"),
    offerPreviewFooter: document.getElementById("offer-preview-footer"),
    searchSummary: document.getElementById("search-summary"),
    toast: document.getElementById("toast"),
  };

  const dashboardDate = document.getElementById("dashboard-date");
  if (dashboardDate) {
    dashboardDate.textContent = new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  function saveState() {
    return Promise.resolve();
  }

  async function loadCollection(collectionName) {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map((snapshotDoc) => ({
      id: snapshotDoc.id,
      ...snapshotDoc.data(),
    }));
  }

  async function upsertDocument(collectionName, record) {
    await db.collection(collectionName).doc(record.id).set(record);
  }

  async function deleteDocument(collectionName, documentId) {
    await db.collection(collectionName).doc(documentId).delete();
  }

  async function loadSingletonDocument(collectionName, documentId) {
    const snapshot = await db.collection(collectionName).doc(documentId).get();
    if (!snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  }

  async function upsertSingletonDocument(collectionName, documentId, record) {
    await db.collection(collectionName).doc(documentId).set(record);
  }

  function createDefaultPricingSettings() {
    return {
      id: "default",
      estimatedMonthlyRevenue: "",
      taxItems: [],
      fixedCostItems: [],
      cardRates: {},
      updatedAt: "",
    };
  }

  function getSeedUsers() {
    return [
      {
        id: "admin-default",
        name: "Farmacia SuperPreco",
        cpf: "000.000.000-00",
        crf: "ADMIN",
        email: "admin@farmacia.local",
        identifier: "admin@farmacia.local",
        password: "M3ga!Inj#A26$Qv9R",
        role: "admin",
        createdAt: "2026-08-10T00:00:00",
      },
    ];
  }

  async function ensureSeedUsers() {
    const usersToSync = seedUsers.map((seedUser) => {
      const existingUser = state.users.find((user) => (
        user.id === seedUser.id
        || normalize(user.email || user.identifier) === normalize(seedUser.email)
      )) || null;

      if (!existingUser) {
        return {
          documentId: seedUser.id,
          record: { ...seedUser },
          existingId: null,
        };
      }

      return {
        documentId: existingUser.id,
        record: {
          ...existingUser,
          identifier: seedUser.identifier,
          email: existingUser.email || seedUser.email,
          cpf: existingUser.cpf || seedUser.cpf,
          crf: existingUser.crf || seedUser.crf,
          password: seedUser.password,
          role: "admin",
          updatedAt: new Date().toISOString(),
        },
        existingId: existingUser.id,
      };
    });

    if (!usersToSync.length) {
      return;
    }

    const batch = db.batch();
    usersToSync.forEach(({ documentId, record, existingId }) => {
      batch.set(db.collection(FIRESTORE_COLLECTIONS.users).doc(documentId), record);
      if (existingId) {
        state.users = state.users.map((user) => (user.id === existingId ? { ...record } : user));
      } else {
        state.users.unshift({ ...record });
      }
    });
    await batch.commit();
  }

  function loadSessionUser() {
    const saved = localStorage.getItem(STORAGE_KEYS.session);
    if (!saved) return "";

    try {
      const parsed = JSON.parse(saved);
      return parsed?.userId || "";
    } catch {
      return "";
    }
  }

  async function seedFirestoreData() {
    if (
      state.patients.length ||
      state.applications.length ||
      state.bioRecords.length ||
      state.clinicalRecords.length ||
      state.doctors.length ||
      state.users.length
    ) {
      return;
    }

    state.patients = demoData.patients.map((patient) => ({ ...patient }));
    state.applications = demoData.applications.map((application) => ({ ...application }));
    state.doctors = [];
    state.users = getSeedUsers().map((user) => ({ ...user }));
    seedReportDemoRecords();

    const batch = db.batch();
    state.patients.forEach((patient) => {
      batch.set(db.collection(FIRESTORE_COLLECTIONS.patients).doc(patient.id), patient);
    });
    state.applications.forEach((application) => {
      batch.set(db.collection(FIRESTORE_COLLECTIONS.applications).doc(application.id), application);
    });
    state.bioRecords.forEach((record) => {
      batch.set(db.collection(FIRESTORE_COLLECTIONS.bioRecords).doc(record.id), record);
    });
    state.clinicalRecords.forEach((record) => {
      batch.set(db.collection(FIRESTORE_COLLECTIONS.clinicalRecords).doc(record.id), record);
    });
    state.doctors.forEach((doctor) => {
      batch.set(db.collection(FIRESTORE_COLLECTIONS.doctors).doc(doctor.id), doctor);
    });
    state.users.forEach((user) => {
      batch.set(db.collection(FIRESTORE_COLLECTIONS.users).doc(user.id), user);
    });
    await batch.commit();
  }

  async function initializeFirestoreState() {
    const [patients, applications, bioRecords, clinicalRecords, doctors, users, pricingProducts, pricingSettings, pricingTabs, purchaseShortages, purchaseOrders] = await Promise.all([
      loadCollection(FIRESTORE_COLLECTIONS.patients),
      loadCollection(FIRESTORE_COLLECTIONS.applications),
      loadCollection(FIRESTORE_COLLECTIONS.bioRecords),
      loadCollection(FIRESTORE_COLLECTIONS.clinicalRecords),
      loadCollection(FIRESTORE_COLLECTIONS.doctors),
      loadCollection(FIRESTORE_COLLECTIONS.users),
      loadCollection(FIRESTORE_COLLECTIONS.pricingProducts),
      loadSingletonDocument(FIRESTORE_COLLECTIONS.pricingSettings, "default"),
      loadCollection(FIRESTORE_COLLECTIONS.pricingTabs),
      loadCollection(FIRESTORE_COLLECTIONS.purchaseShortages),
      loadCollection(FIRESTORE_COLLECTIONS.purchaseOrders),
    ]);

    state.patients = patients;
    state.applications = applications;
    state.bioRecords = bioRecords;
    state.clinicalRecords = clinicalRecords;
    state.doctors = doctors;
    state.users = users.length ? users : seedUsers.map((user) => ({ ...user }));
    state.pricingProducts = pricingProducts;
    state.pricingSettings = sanitizePricingSettings(pricingSettings);
    state.pricingTabs = pricingTabs.some((tab) => tab.id === "default")
      ? pricingTabs
      : [{ id: "default", name: "Precificação principal" }, ...pricingTabs];
    state.purchaseShortages = purchaseShortages;
    state.purchaseOrders = purchaseOrders;

    await seedFirestoreData();
    await ensureSeedUsers();

    if (!patients.length && state.patients.length) {
      const refreshed = await Promise.all([
        loadCollection(FIRESTORE_COLLECTIONS.patients),
        loadCollection(FIRESTORE_COLLECTIONS.applications),
        loadCollection(FIRESTORE_COLLECTIONS.bioRecords),
        loadCollection(FIRESTORE_COLLECTIONS.clinicalRecords),
        loadCollection(FIRESTORE_COLLECTIONS.doctors),
        loadCollection(FIRESTORE_COLLECTIONS.users),
        loadCollection(FIRESTORE_COLLECTIONS.pricingProducts),
        loadSingletonDocument(FIRESTORE_COLLECTIONS.pricingSettings, "default"),
      ]);
      state.patients = refreshed[0];
      state.applications = refreshed[1];
      state.bioRecords = refreshed[2];
      state.clinicalRecords = refreshed[3];
      state.doctors = refreshed[4];
      state.users = refreshed[5];
      state.pricingProducts = refreshed[6];
      state.pricingSettings = sanitizePricingSettings(refreshed[7]);
    }
  }

  function seedReportDemoRecords() {
    if (!state.patients.length) {
      return;
    }

    const dates = [
      "2026-08-03",
      "2026-08-04",
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
    ];
    const medicines = ["Vitamina C", "Complexo B", "Hidroxocobalamina"];
    const locations = ["Dorsoglúteo direito", "Dorsoglúteo esquerdo", "Braço direito"];

    state.patients.forEach((patient, patientIndex) => {
      dates.forEach((date, dateIndex) => {
        const alreadyExists = state.clinicalRecords.some((record) => (
          record.kind === "injectable" &&
          record.patientId === patient.id &&
          record.date === date
        ));
        if (alreadyExists) return;

        const medicine = medicines[(patientIndex + dateIndex) % medicines.length];
        const time = `${String(9 + (patientIndex % 3)).padStart(2, "0")}:${String(10 + dateIndex).padStart(2, "0")}`;
        const record = {
          id: crypto.randomUUID(),
          patientId: patient.id,
          kind: "injectable",
          date,
          time,
          medicine,
          dosage: "1 ampola",
          type: "Intramuscular (IM)",
          location: locations[patientIndex % locations.length],
          barcode: `DEMO-${patientIndex + 1}${dateIndex + 1}00`,
          batch: `LOTE-DEMO-${date.replaceAll("-", "")}-${patientIndex + 1}`,
          expiration: "2027-08-07",
          nextDate: dateIndex < dates.length - 1 ? dates[dateIndex + 1] : "2026-08-14",
          nextTime: time,
          prescriberName: "Dra. Natalia Almeida",
          council: "CRM",
          registry: "21298",
          uf: "SP",
          observations: "Registro demonstrativo para testes de relatório.",
          professionalName: "Farmácia SuperPreço",
          professionalDoc: "000.000.000-00",
          professionalSignature: "Farmácia SuperPreço",
          patientName: patient.name,
          patientDoc: patient.cpf,
          patientSignature: patient.name,
          createdAt: `${date}T${time}:00`,
        };

        state.clinicalRecords.unshift(record);
        state.applications.unshift({
          id: crypto.randomUUID(),
          patientId: patient.id,
          dateTime: `${date}T${time}:00`,
          note: `${medicine} • Intramuscular (IM) • ${record.location}`,
        });
      });
    });

    state.patients.forEach((patient, patientIndex) => {
      dates.forEach((date, dateIndex) => {
        const time = "10:00";
        if (!state.bioRecords.some((record) => record.patientId === patient.id && record.date === date)) {
          state.bioRecords.unshift({
            id: crypto.randomUUID(),
            patientId: patient.id,
            date,
            time,
            eligibility: "Apto",
            weight: String(62 + patientIndex * 4 + dateIndex),
            height: String(160 + patientIndex * 5),
            age: String(28 + patientIndex),
            sex: patient.sex,
            waist: String(76 + dateIndex),
            neck: "34",
            hip: "98",
            activity: "Sedentário",
            bodyFat: String(24 + patientIndex),
            skeletalMuscle: "38",
            basalMetabolism: "1450",
            visceralFat: "6",
            bodyAge: String(30 + patientIndex),
            observations: "Registro demonstrativo para testes de relatório.",
            createdAt: `${date}T${time}:00`,
          });
        }

        if (!state.clinicalRecords.some((record) => record.kind === "pressure" && record.patientId === patient.id && record.date === date)) {
          state.clinicalRecords.unshift({
            id: crypto.randomUUID(),
            patientId: patient.id,
            kind: "pressure",
            date,
            time,
            systolic: String(118 + patientIndex),
            diastolic: "78",
            heartRate: String(68 + dateIndex),
            observations: "Registro demonstrativo para testes de relatório.",
            createdAt: `${date}T${time}:00`,
          });
        }

        if (!state.clinicalRecords.some((record) => record.kind === "glucose" && record.patientId === patient.id && record.date === date)) {
          state.clinicalRecords.unshift({
            id: crypto.randomUUID(),
            patientId: patient.id,
            kind: "glucose",
            date,
            time,
            value: String(88 + patientIndex + dateIndex),
            fasting: "Não está em jejum",
            condition: "Não possui comorbidade",
            observations: "Registro demonstrativo para testes de relatório.",
            createdAt: `${date}T${time}:00`,
          });
        }
      });
    });

  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function debounce(callback, delay = 100) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  }

  function sanitizePricingSettings(settings) {
    const base = createDefaultPricingSettings();
    const current = settings || {};
    const monthlyRevenueValue = current.estimatedMonthlyRevenue ?? current.estimatedUnitsSold ?? "";
    return {
      ...base,
      ...current,
      estimatedMonthlyRevenue: monthlyRevenueValue === 0 ? "0" : String(monthlyRevenueValue || ""),
      taxItems: Array.isArray(current.taxItems) ? current.taxItems.map((item) => ({
        id: item.id || crypto.randomUUID(),
        name: item.name || "",
        value: item.value === 0 ? "0" : String(item.value || ""),
      })) : [],
      fixedCostItems: Array.isArray(current.fixedCostItems) ? current.fixedCostItems.map((item) => ({
        id: item.id || crypto.randomUUID(),
        name: item.name || "",
        value: item.value === 0 ? "0" : String(item.value || ""),
      })) : [],
      cardRates: Object.fromEntries(Object.entries(current.cardRates || {}).map(([key, value]) => [key, value === 0 ? "0" : String(value || "")])),
    };
  }

  function parseNumberValue(value) {
    if (value === null || value === undefined || value === "") return null;
    const raw = String(value)
      .trim()
      .replace(/[R$\s]/g, "")
      .replace(/[^\d,.\-]/g, "");
    if (!raw) return null;

    let normalized = raw;
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");

    if (lastComma >= 0 && lastDot >= 0) {
      const decimalSeparator = lastComma > lastDot ? "," : ".";
      const thousandSeparator = decimalSeparator === "," ? "." : ",";
      normalized = raw.split(thousandSeparator).join("");
      if (decimalSeparator === ",") {
        normalized = normalized.replace(",", ".");
      }
    } else if (lastComma >= 0) {
      normalized = raw.replace(/\./g, "").replace(",", ".");
    } else if (lastDot >= 0) {
      const parts = raw.split(".");
      const looksLikeThousands = parts.length > 1 && parts.slice(1).every((part) => part.length === 3);
      normalized = looksLikeThousands ? parts.join("") : raw;
    }

    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatCurrency(value) {
    const amount = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }

  function formatPercent(value, digits = 2) {
    if (!Number.isFinite(value)) return "-";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value) + "%";
  }

  function formatDecimalInput(value, digits = 2) {
    if (!Number.isFinite(value)) return "";
    return value.toFixed(digits).replace(".", ",");
  }

  function collectPricingListItems(container) {
    return Array.from(container.querySelectorAll("[data-pricing-row]"))
      .map((row) => ({
        id: row.getAttribute("data-pricing-row") || crypto.randomUUID(),
        name: row.querySelector("[data-pricing-name]")?.value.trim() || "",
        value: row.querySelector("[data-pricing-value]")?.value.trim() || "",
      }))
      .filter((item) => item.name || item.value);
  }

  function getEffectivePricingSettings() {
    if (elements.pricingModal && !elements.pricingModal.classList.contains("hidden")) {
      return readPricingSettingsForm();
    }
    return state.pricingSettings;
  }

  function getActivePricingTab() {
    return state.pricingTabs.find((tab) => tab.id === state.activePricingTabId) || { id: "default", name: "Precificação principal" };
  }

  async function switchPricingTab(tabId) {
    if (tabId === state.activePricingTabId) return;
    const tab = state.pricingTabs.find((item) => item.id === tabId);
    if (!tab) return;
    state.activePricingTabId = tabId;
    state.pricingSettings = sanitizePricingSettings(await loadSingletonDocument(FIRESTORE_COLLECTIONS.pricingSettings, tabId));
    resetPricingProductForm();
    renderPricingTabs();
    renderPricingSettingsForm();
    renderPricingProductsList();
    elements.pricingTabsMenu.classList.add("hidden");
    elements.pricingTabsToggle.setAttribute("aria-expanded", "false");
  }

  async function createPricingTab() {
    if (!isAdminUser()) {
      showToast("Acesso restrito ao administrador.");
      return;
    }
    const number = state.pricingTabs.length + 1;
    const tab = { id: crypto.randomUUID(), name: `Precificação ${number}`, createdAt: new Date().toISOString() };
    try {
      await upsertDocument(FIRESTORE_COLLECTIONS.pricingTabs, tab);
      state.pricingTabs.push(tab);
      state.activePricingTabId = tab.id;
      state.pricingSettings = createDefaultPricingSettings();
      resetPricingProductForm();
      renderPricingTabs();
      renderPricingSettingsForm();
      renderPricingProductsList();
      showToast("Nova tela de precificação criada e zerada.");
    } catch (error) {
      console.error("Erro ao criar tela de precificação:", error);
      showToast(getFirebaseMessage(error));
    }
  }

  function renderPricingTabs() {
    const activeTab = getActivePricingTab();
    elements.pricingTabsToggle.textContent = activeTab.name;
    elements.pricingTabName.value = activeTab.name;
    elements.pricingTabsMenu.innerHTML = state.pricingTabs.map((tab) => `<button type="button" class="pricing-tab-option${tab.id === state.activePricingTabId ? " active" : ""}" data-pricing-tab-id="${tab.id}">${escapeHtml(tab.name)}</button>`).join("");
  }

  function calculatePricingSummary(settings = state.pricingSettings) {
    const totalTaxRate = settings.taxItems.reduce((total, item) => total + Math.max(parseNumberValue(item.value) || 0, 0), 0);
    const totalFixedCost = settings.fixedCostItems.reduce((total, item) => total + Math.max(parseNumberValue(item.value) || 0, 0), 0);
    const estimatedMonthlyRevenue = parseNumberValue(settings.estimatedMonthlyRevenue);
    const hasFixedCosts = totalFixedCost > 0;
    const canAllocateFixedCosts = !hasFixedCosts || ((estimatedMonthlyRevenue || 0) > 0);

    return {
      totalTaxRate,
      totalTaxRateDecimal: totalTaxRate / 100,
      totalFixedCost,
      estimatedMonthlyRevenue,
      hasFixedCosts,
      canAllocateFixedCosts,
    };
  }

  function calculatePricingScenario({ productCost, salePrice, targetProfitPercent, source, cardMethod = "none" }) {
    const summary = calculatePricingSummary(getEffectivePricingSettings());
    const cardRate = cardMethod === "none" ? 0 : Math.max(parseNumberValue(getEffectivePricingSettings().cardRates?.[cardMethod]) || 0, 0) / 100;
    const cost = Math.max(productCost || 0, 0);
    let computedSalePrice = salePrice;
    let fixedCostShare = null;
    let grossMarkupPercent = null;
    let appliedTargetProfitPercent = targetProfitPercent;
    let status = "Informe o preço de venda para calcular o lucro real do produto.";
    let statusTone = "";

    if (productCost === null) {
      return {
        summary,
        baseCost: null,
        fixedCostShare,
        taxAmount: null,
        totalCost: null,
        profitAmount: null,
        realProfitPercent: null,
        grossMarkupPercent,
        computedSalePrice,
        appliedTargetProfitPercent,
        status: "Informe o preço de custo do produto para iniciar a precificação.",
        statusTone,
      };
    }

    if (!summary.canAllocateFixedCosts) {
      status = "Informe o faturamento mensal estimado para ratear os custos fixos antes de calcular o lucro real.";
      statusTone = "warning";
    }

    if (source === "salePrice" && salePrice !== null && salePrice <= 0) {
      status = "Informe um preço de venda maior que zero para calcular o lucro real.";
      statusTone = "warning";
    }

    if (source === "targetProfit" && salePrice === null) {
      status = cost > 0
        ? "Informe um lucro real desejado válido para calcular o preço de venda."
        : "Informe um preço de custo maior que zero para calcular o lucro real desejado.";
      statusTone = "warning";
    }

    if (source === "targetProfit" && targetProfitPercent !== null) {
      const targetProfitFraction = targetProfitPercent / 100;
      const fixedCostFraction = summary.canAllocateFixedCosts && summary.hasFixedCosts && summary.estimatedMonthlyRevenue > 0
        ? summary.totalFixedCost / summary.estimatedMonthlyRevenue
        : 0;
      const denominator = 1 - summary.totalTaxRateDecimal - cardRate - fixedCostFraction - targetProfitFraction;

      if (cost <= 0) {
        computedSalePrice = null;
        status = "Informe um preço de custo maior que zero para calcular o preço de venda pelo lucro real desejado.";
        statusTone = "warning";
      } else if (denominator <= 0) {
        computedSalePrice = null;
        status = "Não é possível calcular o preço de venda: impostos, rateio fixo e lucro real desejado esgotam ou ultrapassam 100% da venda.";
        statusTone = "warning";
      } else {
        computedSalePrice = cost / denominator;
        status = "Preço de venda calculado a partir do lucro real desejado.";
        statusTone = "success";
      }
    }

    if (summary.canAllocateFixedCosts && computedSalePrice !== null && computedSalePrice > 0) {
      fixedCostShare = summary.hasFixedCosts
        ? summary.totalFixedCost * (computedSalePrice / summary.estimatedMonthlyRevenue)
        : 0;
    }

    const baseCost = summary.canAllocateFixedCosts && fixedCostShare !== null
      ? cost + fixedCostShare
      : (summary.hasFixedCosts ? null : cost);

    if ((source === "salePrice" || source === "targetProfit") && computedSalePrice !== null && computedSalePrice > 0 && baseCost !== null) {
      const profitValue = computedSalePrice - (baseCost + (computedSalePrice * (summary.totalTaxRateDecimal + cardRate)));
      appliedTargetProfitPercent = (profitValue / computedSalePrice) * 100;
      status = profitValue >= 0
        ? (source === "targetProfit"
          ? "Preço de venda calculado a partir do lucro real desejado."
          : "Lucro real calculado a partir do preço de venda informado.")
        : (source === "targetProfit"
          ? "O lucro real desejado não é viável com os custos e percentuais informados."
          : "O preço informado não cobre todos os custos e impostos.");
      statusTone = profitValue >= 0 ? "success" : "warning";
    }

    const taxAmount = computedSalePrice !== null && computedSalePrice > 0
      ? computedSalePrice * (summary.totalTaxRateDecimal + cardRate)
      : null;
    const totalCost = baseCost !== null && taxAmount !== null ? baseCost + taxAmount : baseCost;
    const profitAmount = computedSalePrice !== null && totalCost !== null ? computedSalePrice - totalCost : null;
    const realProfitPercent = computedSalePrice !== null && computedSalePrice > 0 && profitAmount !== null
      ? (profitAmount / computedSalePrice) * 100
      : null;
    grossMarkupPercent = computedSalePrice !== null && computedSalePrice > 0 && cost > 0
      ? ((computedSalePrice - cost) / cost) * 100
      : null;

    return {
      summary,
      cost,
      baseCost,
      fixedCostShare,
      taxAmount,
      cardRate,
      totalCost,
      profitAmount,
      realProfitPercent,
      grossMarkupPercent,
      computedSalePrice,
      appliedTargetProfitPercent,
      status,
      statusTone,
    };
  }

  function getPricingProductFormValues() {
    return {
      name: elements.pricingProductName.value.trim(),
      sku: elements.pricingProductSku.value.trim(),
      productCost: parseNumberValue(elements.pricingProductCost.value),
      salePrice: parseNumberValue(elements.pricingSalePrice.value),
      targetProfitPercent: parseNumberValue(elements.pricingTargetProfit.value),
      cardMethod: elements.pricingCardMethod.value,
    };
  }

  function createPricingRowMarkup(item, type) {
    const inputLabel = type === "tax" ? "Percentual (%)" : "Valor (R$)";
    const inputPlaceholder = type === "tax" ? "Ex.: 6,5" : "Ex.: 1.200,00";
    return `
      <div class="pricing-list-row" data-pricing-row="${item.id}">
        <label class="field field-full">
          <span>${type === "tax" ? "Nome do imposto" : "Nome do custo fixo"}</span>
          <input data-pricing-name type="text" value="${escapeHtml(item.name || "")}" placeholder="${type === "tax" ? "Ex.: Simples Nacional" : "Ex.: Aluguel"}" />
        </label>
        <label class="field">
          <span>${inputLabel}</span>
          <input data-pricing-value type="text" inputmode="decimal" value="${escapeHtml(item.value || "")}" placeholder="${inputPlaceholder}" />
        </label>
        <button type="button" class="mini-button danger pricing-remove-row" data-pricing-remove="${type}">
          Remover
        </button>
      </div>
    `;
  }

  function renderPricingSettingsForm() {
    const settings = state.pricingSettings;
    elements.pricingEstimatedRevenue.value = settings.estimatedMonthlyRevenue || "";
    elements.pricingTaxList.innerHTML = settings.taxItems.length
      ? settings.taxItems.map((item) => createPricingRowMarkup(item, "tax")).join("")
      : `<div class="pricing-empty-state">Nenhum imposto cadastrado.</div>`;
    elements.pricingFixedList.innerHTML = settings.fixedCostItems.length
      ? settings.fixedCostItems.map((item) => createPricingRowMarkup(item, "fixed")).join("")
      : `<div class="pricing-empty-state">Nenhum custo fixo cadastrado.</div>`;
    elements.pricingCardRates.querySelectorAll("[data-card-rate]").forEach((input) => {
      input.value = settings.cardRates?.[input.dataset.cardRate] || "";
    });
    Array.from(elements.pricingCardMethod.options).forEach((option) => {
      if (option.value === "none") return;
      const baseLabel = option.value === "debit" ? "Débito" : `Crédito ${option.value.replace("credit", "")}x`;
      const rate = Math.max(parseNumberValue(settings.cardRates?.[option.value]) || 0, 0);
      option.textContent = `${baseLabel} (${formatPercent(rate)})`;
    });

    const summary = calculatePricingSummary(settings);
    elements.pricingTotalTaxRate.textContent = formatPercent(summary.totalTaxRate);
    elements.pricingTotalFixedCost.textContent = formatCurrency(summary.totalFixedCost);
    elements.pricingFixedCostShare.textContent = summary.hasFixedCosts
      ? (summary.canAllocateFixedCosts ? "Proporcional ao preço" : "Defina o faturamento")
      : "R$ 0,00";
    elements.pricingSettingsNote.textContent = summary.canAllocateFixedCosts
      ? "Critério: custo fixo unitário = custos fixos mensais x (preço de venda do produto / faturamento mensal estimado)."
      : "Há custos fixos cadastrados, mas o rateio só pode ser calculado depois que o faturamento mensal estimado for informado.";
  }

  function renderPricingAccess() {
    const admin = isAdminUser();
    elements.pricingSettingsPanel.classList.toggle("hidden", !admin);
    elements.pricingProductsPanel.classList.toggle("compact-view", !admin);
    elements.pricingProductsListWrap.classList.toggle("hidden", !admin);
    elements.pricingBreakdown.classList.toggle("hidden", !admin);
    elements.pricingProductIntro.textContent = admin
      ? "Informe custo e preço de venda ou lucro real desejado. O sistema recalcula o lucro real com impostos e rateio configurados."
      : "Informe o produto e calcule a precificação usando automaticamente os parâmetros administrativos já cadastrados.";
  }

  function refreshPricingDraftSummary() {
    const settings = readPricingSettingsForm();
    const summary = calculatePricingSummary(settings);
    elements.pricingTotalTaxRate.textContent = formatPercent(summary.totalTaxRate);
    elements.pricingTotalFixedCost.textContent = formatCurrency(summary.totalFixedCost);
    elements.pricingFixedCostShare.textContent = summary.hasFixedCosts
      ? (summary.canAllocateFixedCosts ? "Proporcional ao preço" : "Defina o faturamento")
      : "R$ 0,00";
    elements.pricingSettingsNote.textContent = summary.canAllocateFixedCosts
      ? "Critério: custo fixo unitário = custos fixos mensais x (preço de venda do produto / faturamento mensal estimado)."
      : "Há custos fixos cadastrados, mas o rateio só pode ser calculado depois que o faturamento mensal estimado for informado.";
    renderPricingProductResults();
  }

  function appendPricingRow(type) {
    const targetKey = type === "tax" ? "taxItems" : "fixedCostItems";
    const currentSettings = readPricingSettingsForm();
    currentSettings[targetKey].push({
      id: crypto.randomUUID(),
      name: "",
      value: "",
    });
    state.pricingSettings = currentSettings;
    renderPricingSettingsForm();
    renderPricingProductResults();
  }

  function getProfitVisualState(realProfitPercent) {
    if (!Number.isFinite(realProfitPercent)) {
      return {
        tone: "",
        label: "Aguardando cálculo do lucro real.",
        meterColor: "#9aa7b8",
        meterWidth: "0%",
      };
    }

    if (realProfitPercent < 0) {
      return {
        tone: "is-negative",
        label: "Margem negativa.",
        meterColor: "#b23b2a",
        meterWidth: `${Math.min(Math.abs(realProfitPercent), 100)}%`,
      };
    }

    if (realProfitPercent <= 10) {
      return {
        tone: "is-warning",
        label: "Margem apertada.",
        meterColor: "#d6a319",
        meterWidth: `${Math.min(Math.max(realProfitPercent, 0) * 5, 100)}%`,
      };
    }

    return {
      tone: "is-positive",
      label: "Margem saudável.",
      meterColor: "#11807b",
      meterWidth: `${Math.min(realProfitPercent * 2.5, 100)}%`,
    };
  }

  function renderPricingProductResults() {
    const values = getPricingProductFormValues();
    let effectiveSalePrice = values.salePrice;

    if (state.pricingFormSource === "targetProfit") {
      effectiveSalePrice = null;
    }

    const scenario = calculatePricingScenario({
      productCost: values.productCost,
      salePrice: effectiveSalePrice,
      targetProfitPercent: values.targetProfitPercent,
      source: state.pricingFormSource === "targetProfit" ? "targetProfit" : "salePrice",
      cardMethod: values.cardMethod,
    });

    if (state.pricingFormSource === "targetProfit") {
      if (scenario.computedSalePrice !== null && document.activeElement !== elements.pricingSalePrice) {
        elements.pricingSalePrice.value = formatDecimalInput(scenario.computedSalePrice);
      } else if (document.activeElement !== elements.pricingSalePrice) {
        elements.pricingSalePrice.value = "";
      }
    } else if (document.activeElement !== elements.pricingTargetProfit) {
      elements.pricingTargetProfit.value = scenario.appliedTargetProfitPercent !== null
        ? formatDecimalInput(scenario.appliedTargetProfitPercent)
        : "";
    }

    elements.pricingTotalCost.textContent = scenario.baseCost !== null ? formatCurrency(scenario.baseCost) : "Aguardando rateio";
    elements.pricingTaxAmount.textContent = scenario.taxAmount !== null ? formatCurrency(scenario.taxAmount) : "-";
    elements.pricingRealProfit.textContent = scenario.realProfitPercent !== null ? formatPercent(scenario.realProfitPercent) : "-";
    elements.pricingGrossMarkup.textContent = scenario.grossMarkupPercent !== null ? formatPercent(scenario.grossMarkupPercent) : "-";
    elements.pricingFixedCostShare.textContent = scenario.fixedCostShare !== null
      ? formatCurrency(scenario.fixedCostShare)
      : (scenario.summary.hasFixedCosts ? "Defina o faturamento" : "R$ 0,00");
    elements.pricingBreakdownCost.textContent = values.productCost !== null ? formatCurrency(values.productCost) : "R$ 0,00";
    elements.pricingBreakdownTax.textContent = scenario.taxAmount !== null ? formatCurrency(scenario.taxAmount) : "R$ 0,00";
    elements.pricingBreakdownFixed.textContent = scenario.fixedCostShare !== null ? formatCurrency(scenario.fixedCostShare) : "R$ 0,00";
    elements.pricingBreakdownProfit.textContent = scenario.profitAmount !== null ? formatCurrency(scenario.profitAmount) : "R$ 0,00";
    elements.pricingProfitAmountInline.textContent = scenario.profitAmount !== null ? formatCurrency(scenario.profitAmount) : "R$ 0,00";
    elements.pricingStatus.textContent = scenario.status;
    elements.pricingStatus.className = `pricing-status-box${scenario.statusTone ? ` ${scenario.statusTone}` : ""}`;
    const visualState = getProfitVisualState(scenario.realProfitPercent);
    const profitCard = elements.pricingRealProfit.closest(".pricing-result-card");
    profitCard.classList.remove("is-positive", "is-warning", "is-negative");
    if (visualState.tone) {
      profitCard.classList.add(visualState.tone);
    }
    elements.pricingProfitStatusLabel.textContent = visualState.label;
    elements.pricingProfitMeterFill.style.width = visualState.meterWidth;
    elements.pricingProfitMeterFill.style.backgroundColor = visualState.meterColor;

    return scenario;
  }

  function renderPricingProductsList() {
    if (!elements.pricingProductsList) return;

    const products = state.pricingProducts.filter((product) => (product.pricingTabId || "default") === state.activePricingTabId);
    if (!products.length) {
      elements.pricingProductsList.innerHTML = `<div class="pricing-empty-state">Nenhum produto precificado até agora.</div>`;
      return;
    }

    elements.pricingProductsList.innerHTML = products
      .slice()
      .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
      .map((product) => {
        const scenario = calculatePricingScenario({
          productCost: Number(product.productCost) || 0,
          salePrice: Number(product.salePrice) || null,
          source: "salePrice",
          cardMethod: product.cardMethod || "none",
        });
        const realProfitClass = (scenario.realProfitPercent || 0) < 0 ? "pricing-profit-negative" : "pricing-profit-positive";
        return `
          <article class="pricing-product-row">
            <div class="pricing-product-meta">
              <strong>${escapeHtml(product.name)}</strong>
              <span>${escapeHtml(product.sku || "Sem referência")} • custo ${formatCurrency(Number(product.productCost) || 0)}</span>
            </div>
            <div class="pricing-product-metrics">
              <span>Venda ${formatCurrency(Number(product.salePrice) || 0)}</span>
              <span class="${realProfitClass}">Lucro real ${scenario.realProfitPercent !== null ? formatPercent(scenario.realProfitPercent) : "-"}</span>
              <span>Markup bruto ${scenario.grossMarkupPercent !== null ? formatPercent(scenario.grossMarkupPercent) : "-"}</span>
              <span>Custo total ${scenario.totalCost !== null ? formatCurrency(scenario.totalCost) : "-"}</span>
            </div>
            <div class="pricing-product-actions">
              <button type="button" class="mini-button" data-pricing-action="edit" data-pricing-product-id="${product.id}">Editar</button>
              <button type="button" class="mini-button danger" data-pricing-action="remove" data-pricing-product-id="${product.id}">Remover</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function getFirebaseMessage(error) {
    const code = error?.code || "";
    if (code.includes("permission-denied")) {
      return "O Firebase bloqueou o acesso. Ajuste as regras do Firestore para liberar este uso interno.";
    }
    if (code.includes("unavailable")) {
      return "O Firebase nao respondeu agora. Tente novamente em instantes.";
    }
    return "Nao foi possivel salvar no Firebase.";
  }

  function saveSession() {
    if (state.currentUser) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ userId: state.currentUser.id }));
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.session);
  }

  function resolveCurrentUser() {
    state.currentUser = state.users.find((user) => user.id === state.currentUserId) || null;
    if (!state.currentUser) {
      state.currentUserId = "";
      saveSession();
    }
  }

  function findUserByIdentifier(identifier) {
    const query = normalize(identifier);
    return state.users.find((user) =>
      [user.identifier, user.email, user.cpf, user.crf]
        .filter(Boolean)
        .some((value) => normalize(value) === query),
    );
  }

  const KNOWN_SERVICES = [
    "bioimpedância",
    "pressão arterial",
    "glicemia",
    "consulta farmacêutica",
    "injetáveis",
    "curativos",
  ];

  function updateSidebarState() {
    elements.sidebarItems.forEach((item) => {
      const nav = item.getAttribute("data-nav");
      item.classList.toggle("active", nav === state.activeNav);
      const serviceName = item.getAttribute("data-service");
      if (serviceName) {
        const matches = state.search && normalize(serviceName).includes(normalize(state.search));
        item.classList.toggle("matched", matches);
      } else {
        item.classList.remove("matched");
      }
    });
  }

  function setActiveNav(navKey) {
    state.activeNav = navKey;
    updateSidebarState();
  }

  function setSidebarOpen(isOpen) {
    state.sidebarOpen = Boolean(isOpen);
    elements.sidebar.classList.toggle("is-open", state.sidebarOpen);
    elements.sidebarHandle.setAttribute("aria-expanded", state.sidebarOpen ? "true" : "false");
  }

  function updateSearchSummary() {
    if (!elements.searchSummary) return;

    const query = state.search.trim();
    if (!query) {
      elements.searchSummary.textContent = "Todos os clientes e serviços";
      return;
    }

    const patientCount = filterPatients().length;
    const serviceMatches = KNOWN_SERVICES.filter((service) => normalize(service).includes(normalize(query)));
    const serviceText = serviceMatches.length
      ? ` • ${serviceMatches.length} serviço(s) encontrado(s)`
      : "";
    elements.searchSummary.textContent = `${patientCount} cliente(s) encontrado(s)${serviceText}`;
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR").format(date);
  }

  function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  }

  function getCurrentMonthCount() {
    const now = new Date();
    return state.applications.filter((application) => {
      const date = new Date(application.dateTime);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }).length;
  }

  function getLastApplicationForPatient(patientId) {
    const applications = state.applications
      .filter((application) => application.patientId === patientId)
      .sort((left, right) => new Date(right.dateTime) - new Date(left.dateTime));

    return applications[0] || null;
  }

  function filterPatients() {
    const query = normalize(state.search);
    return state.patients.filter((patient) => {
      if (!query) return true;

      return [
        patient.name,
        patient.cpf,
        patient.email,
        patient.phone,
      ].some((value) => normalize(value).includes(query));
    });
  }

  function renderDashboard() {
    elements.monthlyApplications.textContent = getCurrentMonthCount();
    elements.totalPatients.textContent = state.patients.length;
    elements.nextAction.textContent = state.applications.length;
    updateSidebarState();
    updateSearchSummary();
  }

  function renderPatients() {
    if (!elements.patientsTable) return;
    const patients = filterPatients();
    if (!patients.length) {
      elements.patientsTable.innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-state">
              Nenhum paciente encontrado para esta busca.
            </div>
          </td>
        </tr>
      `;
      return;
    }

    elements.patientsTable.innerHTML = patients
      .map((patient) => {
        const lastApplication = getLastApplicationForPatient(patient.id);
        return `
          <tr>
            <td>
              <span class="patient-name">${escapeHtml(patient.name)}</span>
              <div class="patient-meta">
                CPF ${escapeHtml(patient.cpf)}
              </div>
              <div class="patient-submeta">
                ${escapeHtml(patient.sex)} • ${formatDate(patient.birthDate)}
              </div>
            </td>
            <td>
              <div class="contact-stack">
                <span>${escapeHtml(patient.phone)}</span>
                <span>${escapeHtml(patient.email)}</span>
              </div>
            </td>
            <td>
              ${
                lastApplication
                  ? `<span class="pill">${formatDateTime(lastApplication.dateTime)}</span>`
                  : `<span class="patient-meta">Sem aplicação</span>`
              }
            </td>
            <td>
              <div class="row-actions">
                <button class="mini-button" data-action="details" data-patient-id="${patient.id}">
                  Opções do paciente
                </button>
                <button class="mini-button" data-action="history" data-patient-id="${patient.id}">
                  Histórico
                </button>
                <button class="mini-button primary" data-action="service" data-patient-id="${patient.id}">
                  Novo serviço
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    updateSearchSummary();
  }

  function renderActivities() {
    const clinicalActivities = state.clinicalRecords
      .filter((record) => record.kind !== "injectable")
      .map((record) => ({
        patientId: record.patientId,
        dateTime: `${record.date}T${record.time || "00:00"}:00`,
        note: {
          pressure: "Pressão Arterial",
          glucose: "Glicemia",
          consultation: "Consulta Farmacêutica",
          dressings: "Curativos",
        }[record.kind] || "Serviço registrado",
      }));
    const bioActivities = state.bioRecords.map((record) => ({
      patientId: record.patientId,
      dateTime: `${record.date}T${record.time || "00:00"}:00`,
      note: "Bioimpedância",
    }));
    const activities = [...state.applications, ...clinicalActivities, ...bioActivities]
      .filter((activity) => {
        const activityDate = new Date(activity.dateTime);
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - 2);
        return activityDate >= startDate && activityDate <= new Date();
      })
      .sort((left, right) => new Date(right.dateTime) - new Date(left.dateTime));

    if (!activities.length) {
      elements.activityList.innerHTML = `
        <div class="empty-state">Sem atividades registradas.</div>
      `;
      return;
    }

    elements.activityList.innerHTML = activities
      .map((activity) => {
        const patient = state.patients.find((item) => item.id === activity.patientId);
        return `
          <div class="activity-item">
            <span class="activity-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></svg>
            </span>
            <div class="activity-copy">
              <strong>${escapeHtml(patient ? patient.name : "Paciente removido")}</strong>
              <span>${formatDateTime(activity.dateTime)}</span>
              <span>${escapeHtml(activity.note || "Aplicação registrada")}</span>
            </div>
            <span class="activity-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </div>
        `;
      })
      .join("");
  }

  function getReportEntries() {
    const bioEntries = state.bioRecords.map((record) => ({
      record,
      service: "Bioimpedância",
      date: record.date || record.createdAt?.slice(0, 10) || "",
      time: record.time || "",
      patient: state.patients.find((patient) => patient.id === record.patientId),
    }));

    const clinicalEntries = state.clinicalRecords.map((record) => ({
      record,
      service: record.kind === "injectable"
        ? "Injetáveis"
        : record.kind === "pressure"
          ? "Pressão Arterial"
          : "Glicemia",
      date: record.date || record.createdAt?.slice(0, 10) || "",
      time: record.time || "",
      patient: state.patients.find((patient) => patient.id === record.patientId),
    }));

    const applicationEntries = state.applications
      .filter((application) => !state.clinicalRecords.some((record) => (
        record.kind === "injectable" &&
        record.patientId === application.patientId &&
        `${record.date}T${record.time}` === application.dateTime.slice(0, 16)
      )))
      .map((application) => ({
        record: { medicine: application.note || "Injetável", date: application.dateTime.slice(0, 10) },
        service: "Injetáveis",
        date: application.dateTime.slice(0, 10),
        time: application.dateTime.slice(11, 16),
        patient: state.patients.find((patient) => patient.id === application.patientId),
      }));

    return [...bioEntries, ...clinicalEntries, ...applicationEntries]
      .filter((entry) => entry.patient)
      .sort((left, right) => `${right.date}T${right.time}`.localeCompare(`${left.date}T${left.time}`));
  }

  function populateReportPatients(searchTerm = elements.reportPatientSearch.value) {
    const query = normalize(searchTerm);
    elements.reportPatients.innerHTML = state.patients
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
      .filter((patient) => !query || normalize(`${patient.name} ${patient.cpf}`).includes(query))
      .map((patient) => `<label class="report-check-option"><input type="checkbox" value="${escapeHtml(patient.id)}"><span>${escapeHtml(patient.name)} <small>— ${escapeHtml(patient.cpf)}</small></span></label>`)
      .join("");
  }

  function populateReportServices(selectAll = false) {
    elements.reportServices.innerHTML = KNOWN_SERVICES
      .map((service) => `<label class="report-check-option"><input type="checkbox" value="${escapeHtml(service)}"${selectAll ? " checked" : ""}><span>${escapeHtml(service)}</span></label>`)
      .join("");
    updateReportServicesTrigger();
  }

  function updateReportServicesTrigger() {
    const selected = Array.from(elements.reportServices.querySelectorAll("input:checked"));
    elements.reportServicesToggle.firstChild.textContent = selected.length === KNOWN_SERVICES.length
      ? "Todos os serviços "
      : selected.length
        ? `${selected.length} serviço(s) selecionado(s) `
        : "Selecionar serviços ";
  }

  function updateReportFilter() {
    elements.reportPatientFilter.classList.toggle("hidden", elements.reportBy.value !== "patients");
  }

  function reportDetails(entry) {
    const record = entry.record;
    if (entry.service === "Injetáveis") {
      return [
        ["Medicamento", record.medicine],
        ["Posologia", record.dosage],
        ["Lote", record.batch],
        ["Validade", formatPrintDate(record.expiration)],
        ["Primeira dose", formatPrintDate(record.date)],
        ["Próxima dose", record.nextDate ? `${formatPrintDate(record.nextDate)}${record.nextTime ? ` às ${record.nextTime}` : ""}` : "Não informada"],
        ["Tipo / local", `${record.type || "-"} • ${record.location || "-"}`],
      ];
    }

    if (entry.service === "Pressão Arterial") {
      return [
        ["Pressão", `${record.systolic || "-"} / ${record.diastolic || "-"} mmHg`],
        ["Batimentos", record.heartRate ? `${record.heartRate} BPM` : "-"],
      ];
    }

    if (entry.service === "Glicemia") {
      return [
        ["Valor", record.value ? `${record.value} mg/dL` : "-"],
        ["Jejum", record.fasting],
        ["Condição", record.condition],
      ];
    }

    return [
      ["Peso", record.weight ? `${record.weight} kg` : "-"],
      ["Altura", record.height ? `${record.height} cm` : "-"],
      ["Gordura corporal", record.bodyFat ? `${record.bodyFat}%` : "-"],
      ["Músculo esquelético", record.skeletalMuscle ? `${record.skeletalMuscle}%` : "-"],
    ];
  }

  function renderReport(entries, type) {
    const reportTitle = type === "complete"
      ? "Relatório completo"
      : type === "simple"
        ? "Relatório simples"
        : "Relatório de receitas";

    if (!entries.length) {
      elements.reportResult.innerHTML = `<div class="empty-state">Nenhum registro encontrado para os filtros selecionados.</div>`;
      elements.reportResult.classList.remove("hidden");
      return;
    }

    const content = entries.map((entry) => {
      const patient = entry.patient;
      const date = `${formatPrintDate(entry.date)}${entry.time ? ` às ${entry.time}` : ""}`;

      if (type === "simple") {
        const mainValue = entry.service === "Injetáveis" ? entry.record.medicine : entry.service;
        return `<article class="report-record report-simple-record">
          <div><strong>${escapeHtml(patient.name)}</strong><span>${escapeHtml(mainValue || "Atendimento")}</span></div>
          <time>${escapeHtml(date)}</time>
        </article>`;
      }

      if (type === "recipes") {
        return `<article class="report-record">
          <div class="report-record-header"><div><strong>${escapeHtml(patient.name)}</strong><span>${escapeHtml(patient.cpf)}</span></div><time>${escapeHtml(date)}</time></div>
          <p class="report-service">${escapeHtml(entry.record.medicine || "Injetável")} • ${escapeHtml(entry.record.dosage || "-" )}</p>
          <div class="report-detail-grid">${reportDetails(entry).map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`).join("")}</div>
        </article>`;
      }

      return `<article class="report-record">
        <div class="report-record-header"><div><strong>${escapeHtml(patient.name)}</strong><span>${escapeHtml(entry.service)} • ${escapeHtml(patient.cpf)}</span></div><time>${escapeHtml(date)}</time></div>
        <div class="report-detail-grid">${reportDetails(entry).map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`).join("")}</div>
        ${entry.record.observations ? `<p class="report-observations"><span>Observações</span>${escapeHtml(entry.record.observations)}</p>` : ""}
      </article>`;
    }).join("");

    elements.reportResult.innerHTML = `<div class="report-result-header"><div><p class="section-label">Resultado</p><h3>${reportTitle}</h3><span>${entries.length} registro(s) encontrado(s)</span></div><button type="button" class="button button-secondary" id="print-report">Imprimir relatório</button></div><div class="report-records">${content}</div>`;
    elements.reportResult.classList.remove("hidden");
    elements.reportPreviewEmpty.classList.add("hidden");
  }

  function renderRecipePreview(entries) {
    const logoUrl = new URL("./assets/logo.png", window.location.href).href;
    state.reportPreviewEntries = entries;
    elements.reportResult.innerHTML = `<div class="report-result-header"><div><p class="section-label">Resultado</p><h3>Prévia das receitas</h3><span>${entries.length} receita(s) encontrada(s)</span></div><button type="button" class="button button-secondary" id="print-report-recipes">Imprimir receitas</button></div><div class="report-recipe-preview">${entries.map((entry) => buildRecipePage(entry.record, entry.patient, logoUrl)).join("")}</div>`;
    elements.reportResult.classList.remove("hidden");
    elements.reportPreviewEmpty.classList.add("hidden");
  }

  function updateReportPreviewButton() {
    const hasDates = Boolean(elements.reportStartDate.value && elements.reportEndDate.value);
    const hasPatients = elements.reportBy.value !== "patients" || elements.reportPatients.querySelector("input:checked");
    const hasServices = elements.reportServices.querySelector("input:checked");
    elements.reportPreviewButton.disabled = !(hasDates && hasPatients && hasServices);
  }

  function generateReport({ previewOnly = false } = {}) {
    const start = elements.reportStartDate.value;
    const end = elements.reportEndDate.value;
    if (!start || !end) {
      showToast("Informe a data de início e a data de fim.");
      return;
    }
    if (start > end) {
      showToast("A data de início não pode ser maior que a data de fim.");
      return;
    }

    const selectedPatientIds = Array.from(elements.reportPatients.querySelectorAll("input:checked")).map((input) => input.value);
    const selectedServices = Array.from(elements.reportServices.querySelectorAll("input:checked"))
      .map((input) => normalize(input.value));
    if (elements.reportBy.value === "patients" && !selectedPatientIds.length) {
      showToast("Selecione pelo menos um paciente.");
      return;
    }
    if (!selectedServices.length) {
      showToast("Selecione pelo menos um serviço.");
      return;
    }

    let entries = getReportEntries()
      .filter((entry) => entry.date >= start && entry.date <= end)
      .filter((entry) => selectedServices.includes(normalize(entry.service)));
    if (elements.reportBy.value === "patients") {
      entries = entries.filter((entry) => selectedPatientIds.includes(entry.patient.id));
    }
    if (elements.reportType.value === "recipes") {
      entries = entries.filter((entry) => entry.service === "Injetáveis");
    }

    if (previewOnly) {
      if (elements.reportType.value === "recipes") {
        renderRecipePreview(entries);
      } else {
        state.reportPreviewEntries = entries;
        renderReport(entries, elements.reportType.value);
        elements.reportPreviewEmpty.classList.add("hidden");
      }
      return;
    }

    if (elements.reportType.value === "recipes" && entries.length) {
      openRecipeReportPrintWindow(entries);
    }

    renderReport(entries, elements.reportType.value);
  }

  function openRegisterModal() {
    elements.reportForm.reset();
    populateReportPatients();
    populateReportServices();
    elements.reportResult.classList.add("hidden");
    elements.reportPreviewEmpty.classList.remove("hidden");
    state.reportPreviewEntries = [];
    elements.reportPatientFilter.classList.remove("hidden");
    updateReportPreviewButton();
    openModal(elements.registerModal);
  }

  function printGeneratedReport() {
    const printWindow = window.open("", "_blank", "width=1000,height=1200");
    if (!printWindow) {
      showToast("Permita pop-ups para imprimir o relatório.");
      return;
    }

    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Relatório - Livro de registro</title><style>*{box-sizing:border-box}html,body{width:100%;min-width:0;overflow:visible}body{width:100%;max-width:190mm;margin:0 auto;padding:8mm;font-family:Arial,sans-serif;color:#000;background:#fff}h1{font-size:22px;border-bottom:2px solid #000;padding-bottom:10px;color:#000;break-after:avoid}.report-record{max-width:100%;border-bottom:1px solid #ccd7e5;padding:12px 0;break-inside:avoid;page-break-inside:avoid}.report-record-header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 20px}.report-record-header>div{min-width:0}.report-record-header strong{display:block;font-size:16px;color:#000;overflow-wrap:anywhere;word-break:break-word}.report-record-header span,.report-record-header time,.report-detail-grid span{color:#000;font-size:11px}.report-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}.report-detail-grid>div{min-width:0}.report-detail-grid strong{display:block;margin-top:3px;color:#000;overflow-wrap:anywhere;word-break:break-word}.report-simple-record{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px}.report-simple-record span{display:block;color:#000;margin-top:4px}.report-service{font-weight:700;color:#000;overflow-wrap:anywhere}.report-observations{overflow-wrap:anywhere;word-break:break-word}.report-observations span{display:block;color:#000;font-size:11px;margin-bottom:4px}@page{size:A4 portrait;margin:10mm}@media print{html,body{width:auto!important;height:auto!important;overflow:visible!important}body{max-width:none!important;margin:0!important;padding:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><h1>Livro de registro</h1>${elements.reportResult.querySelector(".report-records")?.innerHTML || ""}${getPrintStartupScript()}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
  }

  function getHistoryDateTime(record) {
    if (record.date && record.time) {
      return `${record.date}T${record.time}:00`;
    }

    return record.createdAt || record.dateTime || "";
  }

  function getHistoryGroups(patientId) {
    const services = [
      {
        key: "Bioimpedância",
        records: state.bioRecords.filter((record) => record.patientId === patientId),
        summary: (record) => {
          const parts = [];
          if (record.weight) parts.push(`Peso ${record.weight} kg`);
          if (record.height) parts.push(`Altura ${record.height} cm`);
          if (record.bodyFat) parts.push(`Gordura ${record.bodyFat}%`);
          if (record.skeletalMuscle) parts.push(`Músculo ${record.skeletalMuscle}%`);
          if (record.observations) parts.push(record.observations);
          return parts.join(" • ") || "Atendimento registrado.";
        },
      },
      {
        key: "Pressão Arterial",
        records: state.clinicalRecords.filter(
          (record) => record.patientId === patientId && record.kind === "pressure",
        ),
        summary: (record) => {
          const parts = [];
          if (record.systolic || record.diastolic) {
            parts.push(`${record.systolic || "-"} / ${record.diastolic || "-"} mmHg`);
          }
          if (record.heartRate) parts.push(`${record.heartRate} BPM`);
          if (record.observations) parts.push(record.observations);
          return parts.join(" • ") || "Aferição registrada.";
        },
      },
      {
        key: "Glicemia",
        records: state.clinicalRecords.filter(
          (record) => record.patientId === patientId && record.kind === "glucose",
        ),
        summary: (record) => {
          const parts = [];
          if (record.value) parts.push(`${record.value} mg/dL`);
          if (record.fasting) parts.push(record.fasting);
          if (record.condition) parts.push(record.condition);
          if (record.observations) parts.push(record.observations);
          return parts.join(" • ") || "Medição registrada.";
        },
      },
      {
        key: "Consulta Farmacêutica",
        records: state.clinicalRecords.filter((record) => record.patientId === patientId && record.kind === "consultation"),
        summary: (record) => record.description || record.observations || "Consulta registrada.",
      },
      {
        key: "Injetáveis",
        records: state.clinicalRecords.filter(
          (record) => record.patientId === patientId && record.kind === "injectable",
        ),
        summary: (record) => {
          const parts = [];
          if (record.medicine) parts.push(record.medicine);
          if (record.dosage) parts.push(record.dosage);
          if (record.type) parts.push(record.type);
          if (record.location) parts.push(record.location);
          if (record.prescriberName) parts.push(`Prescritor: ${record.prescriberName}`);
          if (record.observations) parts.push(record.observations);
          return parts.join(" • ") || "Aplicação registrada.";
        },
      },
      {
        key: "Curativos",
        records: state.clinicalRecords.filter((record) => record.patientId === patientId && record.kind === "dressings"),
        summary: (record) => record.description || record.observations || "Curativo registrado.",
      },
    ];

    return services.map((service) => ({
      ...service,
      records: service.records
        .slice()
        .sort((left, right) => new Date(getHistoryDateTime(right)) - new Date(getHistoryDateTime(left))),
    }));
  }

  function openHistoryModal(patientId, { resetFilters = true } = {}) {
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) {
      showToast("Selecione um paciente válido.");
      return;
    }

    state.currentHistoryPatientId = patient.id;
    if (resetFilters) {
      elements.historyStartDate.value = "";
      elements.historyEndDate.value = "";
    }
    elements.historyAvatar.textContent = getInitials(patient.name);
    elements.historyTitle.textContent = `Histórico de ${patient.name}`;
    elements.historySubtitle.textContent = `${patient.cpf} • ${patient.phone}`;

    const startDate = elements.historyStartDate.value;
    const endDate = elements.historyEndDate.value;
    const groups = getHistoryGroups(patient.id).map((group) => ({
      ...group,
      records: group.records.filter((record) => {
        const recordDate = getHistoryDateTime(record).slice(0, 10);
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        return true;
      }),
    }));
    const totalRecords = groups.reduce((total, group) => total + group.records.length, 0);
    elements.historyMeta.innerHTML = `
      <span class="history-pill">${totalRecords} registros</span>
      <span class="history-pill">${groups.filter((group) => group.records.length > 0).length} serviços com dados</span>
    `;

    elements.historySections.innerHTML = groups
      .map((group) => {
        if (!group.records.length) {
          return `
            <section class="history-section">
              <div class="history-section-head">
                <h3>${escapeHtml(group.key)}</h3>
                <span class="history-count">0</span>
              </div>
              <div class="empty-state history-empty">Sem registros neste serviço.</div>
            </section>
          `;
        }

        return `
          <section class="history-section">
            <div class="history-section-head">
              <h3>${escapeHtml(group.key)}</h3>
              <span class="history-count">${group.records.length}</span>
            </div>
            <div class="history-records">
              ${group.records
                .map((record) => {
                  const dateTime = getHistoryDateTime(record);
                  return `
                    <article class="history-record" data-history-record-id="${record.id}" data-history-record-kind="${record.kind || "bio"}">
                      <div class="history-record-top">
                        <strong>${formatDateTime(dateTime)}</strong>
                        <span>${escapeHtml(group.key)}</span>
                      </div>
                      <p>${escapeHtml(group.summary(record))}</p>
                      <div class="history-record-actions">
                        <button type="button" class="mini-button primary" data-history-action="recipe" data-record-id="${record.id}">Baixar / imprimir receita</button>
                        <button type="button" class="mini-button danger" data-history-action="delete" data-record-id="${record.id}">Excluir atendimento</button>
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </div>
          </section>
        `;
      })
      .join("");

    openModal(elements.historyModal);
  }

  async function deleteHistoryRecord(recordId) {
    const clinicalRecord = state.clinicalRecords.find((item) => item.id === recordId);
    if (clinicalRecord) {
      await deleteDocument(FIRESTORE_COLLECTIONS.clinicalRecords, recordId);
      state.clinicalRecords = state.clinicalRecords.filter((item) => item.id !== recordId);

      if (clinicalRecord.kind === "injectable") {
        const applicationDateTime = `${clinicalRecord.date}T${clinicalRecord.time}:00`;
        const linkedApplications = state.applications.filter((application) => (
          application.patientId === clinicalRecord.patientId
          && application.dateTime === applicationDateTime
        ));

        for (const application of linkedApplications) {
          await deleteDocument(FIRESTORE_COLLECTIONS.applications, application.id);
        }

        state.applications = state.applications.filter((application) => !linkedApplications.some((item) => item.id === application.id));
      }

      return true;
    }

    const bioRecord = state.bioRecords.find((item) => item.id === recordId);
    if (bioRecord) {
      await deleteDocument(FIRESTORE_COLLECTIONS.bioRecords, recordId);
      state.bioRecords = state.bioRecords.filter((item) => item.id !== recordId);
      return true;
    }

    return false;
  }

  function renderServicePatients(selectedPatientId = "", query = "") {
    const normalizedQuery = normalize(query);
    const filteredPatients = state.patients.filter((patient) => (
      !normalizedQuery || normalize(`${patient.name} ${patient.cpf}`).includes(normalizedQuery)
    ));

    elements.servicePatient.innerHTML = `
      <option value="">Selecione um paciente</option>
    ` + filteredPatients
      .map((patient) => {
        const selected = selectedPatientId === patient.id ? "selected" : "";
        return `<option value="${patient.id}" ${selected}>${escapeHtml(patient.name)} — ${escapeHtml(patient.cpf)}</option>`;
      })
      .join("");

    renderServicePatientResults(filteredPatients, normalizedQuery, selectedPatientId);
  }

  function renderServicePatientResults(patients, normalizedQuery = "", selectedPatientId = "") {
    if (!elements.servicePatientResults) return;

    if (state.currentServicePatientId) {
      elements.servicePatientResults.innerHTML = "";
      elements.servicePatientResults.classList.add("hidden");
      return;
    }

    if (!normalizedQuery) {
      elements.servicePatientResults.innerHTML = "";
      elements.servicePatientResults.classList.add("hidden");
      return;
    }

    if (!patients.length) {
      elements.servicePatientResults.innerHTML = `<div class="service-patient-results-empty">Nenhum paciente encontrado.</div>`;
      elements.servicePatientResults.classList.remove("hidden");
      return;
    }

    elements.servicePatientResults.innerHTML = patients
      .map((patient) => {
        const selectedClass = patient.id === selectedPatientId ? " data-selected=\"true\"" : "";
        return `<button type="button" class="service-patient-result" data-service-patient-option="${patient.id}"${selectedClass}><strong>${escapeHtml(patient.name)}</strong><span>CPF ${escapeHtml(patient.cpf)}</span></button>`;
      })
      .join("");
    elements.servicePatientResults.classList.remove("hidden");
  }

  function renderServiceLauncher(selectedPatientId = "") {
    const patient = state.patients.find((item) => item.id === selectedPatientId);
    const confirmedPatient = state.patients.find((item) => item.id === state.currentServicePatientId);
    const isPatientSelected = Boolean(selectedPatientId && patient);
    const hasConfirmedPatient = Boolean(confirmedPatient);

    const searchQuery = elements.servicePatientSearch?.value || "";
    renderServicePatients(selectedPatientId, searchQuery);
    elements.servicePatient.value = isPatientSelected ? selectedPatientId : "";
    elements.serviceContinue.disabled = !isPatientSelected;
    if (elements.serviceSearchPanel) {
      elements.serviceSearchPanel.classList.toggle("is-locked", hasConfirmedPatient);
    }
    if (elements.servicePatientSearch) {
      elements.servicePatientSearch.disabled = hasConfirmedPatient;
    }
    elements.serviceClientName.textContent = confirmedPatient ? confirmedPatient.name : "-";
    if (elements.serviceSelectedAvatar) {
      elements.serviceSelectedAvatar.textContent = patient ? getInitials(patient.name) : "-";
    }
    if (elements.serviceSelectedName) {
      elements.serviceSelectedName.textContent = patient ? patient.name : "Selecione um paciente";
    }
    if (elements.serviceSelectedCpf) {
      elements.serviceSelectedCpf.textContent = patient
        ? formatCpf(patient.cpf)
        : "Escolha um paciente para continuar";
    }
    if (elements.serviceConfirmedAvatar) {
      elements.serviceConfirmedAvatar.textContent = confirmedPatient ? getInitials(confirmedPatient.name) : "-";
    }
    if (elements.serviceConfirmedCpf) {
      elements.serviceConfirmedCpf.textContent = confirmedPatient
        ? formatCpf(confirmedPatient.cpf)
        : "Escolha um paciente para continuar";
    }

    elements.servicePatientResults?.classList.toggle("hidden", hasConfirmedPatient || !searchQuery);
  }

  function openServiceLauncher(selectedPatientId = "") {
    state.currentServicePatientId = selectedPatientId || state.currentServicePatientId || "";
    if (elements.servicePatientSearch) {
      elements.servicePatientSearch.value = "";
    }
    elements.servicePatientResults?.classList.add("hidden");
    if (elements.servicePatientResults) {
      elements.servicePatientResults.innerHTML = "";
    }
    renderServiceLauncher(selectedPatientId);
    openModal(elements.serviceModal);
  }

  function renderBioStepper() {
    elements.bioStepNodes.forEach((node) => {
      const step = Number(node.getAttribute("data-step-label"));
      node.classList.toggle("current", step === state.currentBioStep);
      node.classList.toggle("complete", step < state.currentBioStep);
    });

    elements.bioPanels.forEach((panel) => {
      const step = Number(panel.getAttribute("data-bio-step"));
      panel.classList.toggle("active", step === state.currentBioStep);
    });

    elements.bioPrev.disabled = state.currentBioStep <= 1;
    elements.bioNext.classList.toggle("hidden", state.currentBioStep >= 4);
    elements.bioInterpret.classList.toggle("hidden", state.currentBioStep < 4);
    elements.bioSave.classList.toggle("hidden", state.currentBioStep < 4);
    elements.bioSavePrint.classList.toggle("hidden", state.currentBioStep < 4);
    elements.bioResult.classList.toggle("hidden", state.currentBioStep < 4);
  }

  function openClinicalModal(patientId, kind) {
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) {
      showToast("Selecione um paciente válido.");
      return;
    }

    state.currentClinicalPatientId = patient.id;
    state.currentClinicalKind = kind;

    elements.clinicalAvatar.textContent = getInitials(patient.name);
    elements.clinicalForm.reset();
    elements.clinicalDate.value = formatDisplayDate(new Date().toISOString().slice(0, 10));
    elements.clinicalTime.value = new Date().toTimeString().slice(0, 5);

    const clinicalConfig = {
      pressure: {
        label: "Pressão Arterial",
        title: "Nova aferição",
      },
      glucose: {
        label: "Glicemia",
        title: "Nova medição",
      },
      injectable: {
        label: "Injetáveis",
        title: "Novo atendimento",
      },
      consultation: {
        label: "Consulta Farmacêutica",
        title: "Nova consulta",
      },
      dressings: {
        label: "Curativos",
        title: "Novo curativo",
      },
    };

    const config = clinicalConfig[kind] || clinicalConfig.pressure;
    elements.clinicalLabel.textContent = config.label;
    elements.clinicalTitle.textContent = config.title;
    elements.clinicalSubtitle.textContent = `${patient.name} • ${patient.cpf}`;

    if (kind === "glucose") {
      elements.clinicalForm.querySelector("#glucose-fasting").value = "Não está em jejum";
      elements.clinicalForm.querySelector("#glucose-condition").value = "Não possui comorbidade";
    }

    if (kind === "injectable") {
      const user = getCurrentUser();
      elements.clinicalForm.querySelector("#injectable-prescriber-name").value = "";
      elements.clinicalForm.querySelector("#injectable-council").value = "CRM";
      elements.clinicalForm.querySelector("#injectable-registry").value = "";
      elements.clinicalForm.querySelector("#injectable-uf").value = "";
      elements.clinicalForm.querySelector("#injectable-professional-name").value = user?.name || "";
      elements.clinicalForm.querySelector("#injectable-professional-crf").value = user?.crf || "";
      elements.clinicalForm.querySelector("#injectable-patient-name").value = patient.name;
      elements.clinicalForm.querySelector("#injectable-patient-doc").value = patient.cpf;
      if (elements.injectableHasNextDose) {
        elements.injectableHasNextDose.checked = false;
      }
      syncInjectableNextDoseFields();
      clearSignaturePad(elements.professionalSignatureCanvas, "injectable-professional-signature");
      clearSignaturePad(elements.patientSignatureCanvas, "injectable-patient-signature");
    }

    elements.clinicalPanels.forEach((panel) => {
      const panelKind = panel.getAttribute("data-clinical-kind");
      const active = panelKind === kind;
      panel.classList.toggle("active", active);
      panel.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = !active;
      });
    });

    const isInjectable = kind === "injectable";
    elements.clinicalSave.classList.toggle("hidden", isInjectable);
    elements.clinicalSaveBack.classList.toggle("hidden", !isInjectable);
    elements.clinicalSavePrint.classList.remove("hidden");

    openModal(elements.clinicalModal);
  }

  function openBioModal(patientId) {
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) {
      showToast("Selecione um paciente válido.");
      return;
    }

    state.currentBioPatientId = patient.id;
    state.currentBioStep = 2;
    elements.bioAvatar.textContent = getInitials(patient.name);
    elements.bioTitle.textContent = `${patient.name}`;
    elements.bioSubtitle.textContent = `CPF ${patient.cpf} • ${patient.sex}`;
    elements.bioForm.reset();
    elements.bioDate.value = formatDisplayDate(new Date().toISOString().slice(0, 10));
    elements.bioTime.value = new Date().toTimeString().slice(0, 5);
    elements.bioForm.querySelector("#bio-sex").value = patient.sex || "Feminino";
    elements.bioForm.querySelector("#bio-activity").value = "Sedentário";
    state.currentBioStep = 2;
    renderBioStepper();
    elements.bioResultCard.textContent = "Preencha os dados e toque em 'Interpretar resultados'.";
    openModal(elements.bioModal);
  }

  function getBioFieldValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
  }

  function readOptionalNumber(id) {
    const rawValue = getBioFieldValue(id);
    if (rawValue === "") {
      return null;
    }

    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  function formatNumeric(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(1) : "-";
  }

  function calculateBioInterpretation() {
    const weight = readOptionalNumber("bio-weight");
    const heightCm = readOptionalNumber("bio-height");
    const bodyFat = readOptionalNumber("bio-body-fat");
    const muscle = readOptionalNumber("bio-skeletal-muscle");
    const basal = readOptionalNumber("bio-basal");
    const visceral = readOptionalNumber("bio-visceral-fat");
    const bodyAge = readOptionalNumber("bio-body-age");

    const heightM = heightCm > 0 ? heightCm / 100 : 0;
    const bmi = weight > 0 && heightM > 0 ? weight / (heightM * heightM) : null;

    const bmiText = bmi
      ? bmi < 18.5
        ? "abaixo do peso"
        : bmi < 25
          ? "faixa de peso adequado"
          : bmi < 30
            ? "sobrepeso"
            : "obesidade"
      : "sem IMC calculado";

    return [
      `IMC: ${bmi ? bmi.toFixed(1) : "-"} (${bmiText})`,
      `Gordura corporal: ${bodyFat !== null ? formatNumeric(bodyFat) + "%" : "-"}`,
      `Músculo esquelético: ${muscle !== null ? formatNumeric(muscle) + "%" : "-"}`,
      `Metabolismo basal: ${basal !== null ? Math.round(basal) + " Kcal" : "-"}`,
      `Gordura visceral: ${visceral !== null ? Math.round(visceral) : "-"}`,
      `Idade corporal: ${bodyAge !== null ? Math.round(bodyAge) + " anos" : "-"}`,
    ].join(" • ");
  }

  function openModal(modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overlay-open");
  }

  function closeModal(modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    const anyOverlayOpen = Array.from(document.querySelectorAll(".modal-overlay"))
      .some((item) => !item.classList.contains("hidden"));
    document.body.classList.toggle("overlay-open", anyOverlayOpen);
  }

  function renderMedicineSearch() {
    const query = normalize(elements.medicinesSearch.value.trim());
    elements.medicinesResults.classList.toggle("hidden", !query);

    if (!query) {
      elements.medicinesResults.innerHTML = "";
      return;
    }

    if (query.length < 2) {
      elements.medicinesResults.innerHTML = `<div class="medicines-empty-state">Digite pelo menos 2 caracteres para pesquisar.</div>`;
      return;
    }

    const allMatches = MEDICINE_SEARCH_INDEX
      .filter((entry) => entry.searchText.includes(query))
      .sort((left, right) => {
        const leftRank = left.ean === query || left.name === query ? 0 : left.name.startsWith(query) ? 1 : 2;
        const rightRank = right.ean === query || right.name === query ? 0 : right.name.startsWith(query) ? 1 : 2;
        return leftRank - rightRank || left.name.localeCompare(right.name, "pt-BR");
      });

    if (!allMatches.length) {
      elements.medicinesResults.innerHTML = `<div class="medicines-empty-state">Nenhum medicamento salvo foi encontrado para esta busca.</div>`;
      return;
    }

    const matches = allMatches.slice(0, MAX_MEDICINE_RESULTS);
    const resultSummary = allMatches.length > MAX_MEDICINE_RESULTS
      ? `<p class="medicines-search-summary">${allMatches.length} resultados encontrados. Exibindo os primeiros ${MAX_MEDICINE_RESULTS}; continue digitando para refinar.</p>`
      : `<p class="medicines-search-summary">${allMatches.length} resultado(s) encontrado(s).</p>`;

    elements.medicinesResults.innerHTML = resultSummary + matches.map(({ medicine, index }) => `
      <article class="medicine-result-card">
        <header class="medicine-result-header">
          <div class="medicine-result-copy">
            <span class="medicine-availability"><span aria-hidden="true"></span>Bula disponível</span>
            <h3>${escapeHtml(medicine.name)}</h3>
            ${medicine.ean ? `<span class="medicine-result-ean">EAN ${escapeHtml(medicine.ean)}</span>` : ""}
          </div>
          <a class="button button-primary medicine-leaflet-button" href="${medicine.leafletPath || medicine.sourceLeaflet}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h5v5M13 11l6-6M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6" /></svg>
            Abrir bula
          </a>
        </header>
        <div class="medicine-topic-grid">
          ${medicine.sections.map((section, sectionIndex) => `
            <details class="medicine-topic-card" data-medicine-index="${index}" data-section-index="${sectionIndex}">
              <summary class="medicine-topic-trigger">
                <h4>${escapeHtml(section.title)}</h4>
                <span class="medicine-topic-toggle" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" /></svg></span>
              </summary>
              <div class="medicine-topic-content" data-content-loaded="false"></div>
            </details>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function scheduleMedicineSearch() {
    window.clearTimeout(medicineSearchTimer);
    if (!elements.medicinesSearch.value.trim()) {
      renderMedicineSearch();
      return;
    }
    medicineSearchTimer = window.setTimeout(() => {
      window.requestAnimationFrame(renderMedicineSearch);
    }, 140);
  }

  function loadMedicineTopic(details) {
    if (!details?.open) return;
    const content = details.querySelector(".medicine-topic-content");
    if (!content || content.dataset.contentLoaded === "true") return;

    const medicine = MEDICINE_LIBRARY[Number(details.dataset.medicineIndex)];
    const section = medicine?.sections?.[Number(details.dataset.sectionIndex)];
    if (!section) return;

    content.innerHTML = renderMedicineSection(section);
    content.dataset.contentLoaded = "true";
  }

  const DOSAGE_AMOUNT_PATTERN = /(?:\b(?:até|entre|de|no\s+mínimo|no\s+máximo)?\s*(?:½|¼|¾|\d+(?:[.,]\d+)*|um|uma|meio|meia)(?:\s*(?:a|até)\s*(?:½|¼|¾|\d+(?:[.,]\d+)*|um|uma))?\s*(?:mcg|mg|g|mL|ml|UI|U\.I\.|gotas?|comprimidos?|cápsulas?|sachês?|medidas?|colheres?|jatos?|aplicações?|ampolas?|unidades?|copos?\s+dosadores?|camada\s+fina))/i;
  const DOSAGE_FREQUENCY_PATTERN = /(?:\b(?:uma|duas|três|quatro|cinco|seis|\d+)\s+vez(?:es)?\s+(?:ao|por)\s+dia\b|\b(?:até\s+)?\d+\s+vezes?\s+ao\s+dia\b|\ba\s+cada\s*\d+\s*horas?\b|\bde\s*\d+\s*em\s*\d+\s*horas?\b|\bcom\s+intervalo\s+de\s+\d+\s+horas?\b|\b(?:diariamente|semanalmente|em\s+dose\s+única|por\s+dose)\b)/i;
  const DOSAGE_ACTION_PATTERN = /\b(?:tomar|tome|administrar|administre|administrad[oa]|ingerir|ingerid[oa]|usar|aplicar|aplicad[oa]|instilar|dose\s+(?:usual|inicial|recomendada|padrão|máxima)|posologia|dosagem)\b/i;
  const DOSAGE_LIMIT_PATTERN = /\b(?:não\s+ultrapassar|dose\s+máxima|máximo\s+(?:recomendado|diário)|no\s+máximo)\b/i;

  function splitDosageSegments(content) {
    return String(content || "")
      .replace(/\u00a0/g, " ")
      .replace(/([a-záéíóúâêôãõç])(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç])/g, "$1. ")
      .replace(/([a-záéíóúâêôãõç])([A-ZÁÉÍÓÚÂÊÔÃÕÇ])(?=\s+[a-záéíóúâêôãõç])/g, "$1. $2")
      .replace(/([.!?])(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "$1\n")
      .replace(/([a-záéíóúâêôãõç0-9)])(?=(?:Posologia|Dosagem|Modo\s+de\s+usar|Adultos?\b|Adolescentes?\b|Crianças?\b|Dose\s+padrão|Tratamento\b))/g, "$1\n")
      .replace(/\s+-\s+(?=(?:uso\b|adultos?\b|adolescentes?\b|crianças?\b|idosos?\b|pacientes?\b|dose\b|tratamento\b))/gi, "\n")
      .replace(/((?:½|¼|¾|\d+(?:[.,]\d+)*)\s*(?:mcg|mg|g|mL|ml|gotas?|comprimidos?|cápsulas?|sachês?)(?:\s*\([^)]*\))?)\s+(?=(?:adultos?|adolescentes?|crianças?|idosos?|pacientes?)\b[^:\n]{0,90}:)/gi, "$1\n")
      .replace(/(Posologia|Dosagem|Modo de usar)\s*(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "$1\n")
      .split(/\n+|(?<=[.!?;])\s+/)
      .map((segment) => segment.replace(/^[-•]\s*/, "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }

  function simplifyDosageInstruction(segment) {
    let text = String(segment || "").replace(/\s+/g, " ").trim();
    const hasAmount = DOSAGE_AMOUNT_PATTERN.test(text);
    const hasFrequency = DOSAGE_FREQUENCY_PATTERN.test(text);
    const repeatsPreviousDose = /\b(?:repetir|repita)\s+(?:essa|a)\s+dose\b/i.test(text) && hasFrequency;
    const frequencyWithAction = hasFrequency && /\b(?:aplicar|aplicad[oa]|instilar)\b/i.test(text);
    const standaloneAmount = hasAmount && text.length <= 110 && (
      /^(?:posologia\s*:?)?\s*(?:½|¼|¾|\d|um\b|uma\b|meio\b|meia\b)/i.test(text)
      || /^posologia\s*:/i.test(text)
      || /^[^:]{2,80}:\s*(?:½|¼|¾|\d|um\b|uma\b|meio\b|meia\b)/i.test(text)
    );
    const standaloneSchedule = hasFrequency && /^(?:horário|frequência)\s*:/i.test(text);
    if (!hasAmount && !repeatsPreviousDose && !frequencyWithAction && !standaloneSchedule) return "";
    if (!hasFrequency && !DOSAGE_ACTION_PATTERN.test(text) && !DOSAGE_LIMIT_PATTERN.test(text) && !standaloneAmount) return "";
    if (/\b(?:pode\s+ser\s+partido|não\s+deve\s+ser\s+(?:partido|mastigado|aberto)|conservar|armazenar|agitar)\b/i.test(text)
      && !DOSAGE_FREQUENCY_PATTERN.test(text)
      && !DOSAGE_LIMIT_PATTERN.test(text)) return "";

    text = text
      .replace(/^(?:posologia|dosagem|modo\s+de\s+usar)\s*:?[\s-]*/i, "")
      .replace(/^a\s+dose\s+(?:usual|inicial|recomendada|padrão)\s+de\s+[^,.;:]{2,100}?\s+para\s+(.+?)\s+é\s+de\s+/i, (_, context) => `${context.charAt(0).toLocaleUpperCase("pt-BR")}${context.slice(1)}: `)
      .replace(/^a\s+dose\s+(?:usual|inicial|recomendada|padrão)\s+para\s+(.+?)\s+é\s+de\s+/i, (_, context) => `${context.charAt(0).toLocaleUpperCase("pt-BR")}${context.slice(1)}: `)
      .replace(/^a\s+dose\s+mais\s+recomendada\s+corresponde\s+a\s+/i, "")
      .replace(/:\s*a\s+dose\s+mais\s+recomendada\s+corresponde\s+a\s+/i, ": ")
      .replace(/^essa\s+dose\s+pode\s+ser\s+aumentada\s+para\s+/i, "Pode aumentar para: ")
      .replace(/^a\s+dose\s+de\s+.*?pediátric[oa]\s+pode\s+ser\s+calculada\s+à\s+razão\s+de\s+/i, "Dose pediátrica: ")
      .replace(/^(?:dosagem\s+)?máxima\s+diária\s+limitada\s+a\s+/i, "Máximo diário: ")
      .replace(/^nos\s+casos\s+excepcionais\s+indicados\s+pelo\s+médico\s+pode-se\s+alcançar\s+/i, "Sob orientação médica: ")
      .replace(/\b(?:você\s+deve|deve-se)\s+/gi, "")
      .replace(/\b(?:tomar|tome|administrar|administre|ingerir)\s+/gi, "")
      .replace(/\bmeio\s+a\s+um\s+comprimido\b/gi, "½ a 1 comprimido")
      .replace(/,?\s*por\s+via\s+oral\b/gi, "")
      .replace(/,?\s*que\s+deve\s+ser\s+(?:ingerid[oa]|administrad[oa]|tomad[oa])\s+via\s+oral(?:\s+junto\s+a\s+[^,.;]+)?/gi, "")
      .replace(/\buma\s+vez\s+(?:ao|por)\s+dia\b/gi, "1 vez ao dia")
      .replace(/\bduas\s+vezes\s+(?:ao|por)\s+dia\b/gi, "2 vezes ao dia")
      .replace(/\btrês\s+vezes\s+(?:ao|por)\s+dia\b/gi, "3 vezes ao dia")
      .replace(/\bquatro\s+vezes\s+(?:ao|por)\s+dia\b/gi, "4 vezes ao dia")
      .replace(/\bcinco\s+vezes\s+(?:ao|por)\s+dia\b/gi, "5 vezes ao dia")
      .replace(/\bseis\s+vezes\s+(?:ao|por)\s+dia\b/gi, "6 vezes ao dia")
      .replace(/\bde\s+(\d+)\s+em\s+(\d+)\s+horas?\b/gi, "a cada $2 horas")
      .replace(/\bcom\s+intervalo\s+de\s+(\d+)\s+horas?\b/gi, "a cada $1 horas")
      .replace(/\bem\s+intervalos?\s+de\s+aproximadamente\s+quatro\s+horas?\b/gi, "a cada aproximadamente 4 horas")
      .replace(/^(aplicar\s+uma\s+camada\s+fina(?:\s+de\s+[^,.;]+)?),.*$/i, "$1")
      .replace(/\s*[–-]\s*(?=(?:até\s+)?(?:1|2|3|4|5|6|\d+)\s+vez(?:es)?\s+ao\s+dia\b)/i, " — ")
      .replace(/\b(\d+(?:[,.]\d+)?)\s*(mcg|mg|g|mL|ml|gotas?|comprimidos?|cápsulas?|sachês?)\b/g, (_, amount, unit) => `${amount} ${unit.toLocaleLowerCase("pt-BR") === "ml" ? "mL" : unit}`)
      .replace(/\b(\d+(?:[,.]\d+)?)\s*mg\s+de\s+[^,.;]+?\s+por\s+quilograma\s+de\s+peso\s+corpóreo\b/gi, "$1 mg/kg")
      .replace(/\s*(?:,|;)\s*(?=(?:1|2|3|4|5|6|\d+)\s+vez(?:es)?\s+ao\s+dia\b|a\s+cada\s+\d+\s+horas?\b)/i, " — ")
      .replace(/\b((?:½|¼|¾|\d+(?:[,.]\d+)?)(?:\s*(?:a|até)\s*(?:½|¼|¾|\d+(?:[,.]\d+)?))?\s*(?:mcg|mg|g|mL|ml|gotas?|comprimidos?|cápsulas?|sachês?)(?:\s*\([^)]*\))?)\s+(?=(?:até\s+)?\d+\s+vez(?:es)?\s+ao\s+dia\b)/gi, "$1 — ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:])/g, "$1")
      .trim();

    if (text.length > 320) return "";
    return text && !/[.!?]$/.test(text) ? `${text}.` : text;
  }

  function dosageSummaryItems(content) {
    const items = [];
    let pendingContext = "";
    for (const segment of splitDosageSegments(content)) {
      if (/^(?:idade\s*:\s*)?(?:adultos?|adolescentes?|crianças?|idosos?|pacientes?)\b[^:]*:?$/i.test(segment)
        && !DOSAGE_AMOUNT_PATTERN.test(segment)
        && !DOSAGE_FREQUENCY_PATTERN.test(segment)) {
        const context = segment.replace(/^idade\s*:\s*/i, "").replace(/[.:]$/, "").trim().toLocaleLowerCase("pt-BR");
        pendingContext = `${context.charAt(0).toLocaleUpperCase("pt-BR")}${context.slice(1)}`;
        continue;
      }
      let item = simplifyDosageInstruction(segment);
      if (!item) continue;
      if (pendingContext && !/^(?:adultos?|adolescentes?|crianças?|idosos?|pacientes?)\b/i.test(item)) {
        item = `${pendingContext}: ${item.charAt(0).toLocaleLowerCase("pt-BR")}${item.slice(1)}`;
      }
      item = item.replace(/^horário\s*:/i, "Horário:");
      pendingContext = "";
      if (item.length <= 320) items.push(item);
    }
    return [...new Map(items.map((item) => [normalize(item), item])).values()];
  }

  function renderMedicineSection(section) {
    const rawBlocks = section.blocks || [{ type: "text", content: section.content }];
    const blocks = section.title === "Como usar"
      ? rawBlocks.map((block) => {
        if (block.type === "heading" || block.type === "table") return block;
        return { type: "dosage-list", items: dosageSummaryItems(block.content) };
      }).filter((block, index, allBlocks) => {
        if (block.type === "heading") {
          const nextRelevantBlock = allBlocks.slice(index + 1).find((nextBlock) => (
            nextBlock.type === "heading"
            || nextBlock.type === "table"
            || nextBlock.type === "dosage-list" && nextBlock.items.length
          ));
          return nextRelevantBlock?.type !== "heading";
        }
        return block.type === "table" || block.type !== "dosage-list" || block.items.length;
      })
      : rawBlocks;

    const hasDosageContent = blocks.some((block) => (
      block.type === "table"
      || block.type === "dosage-list" && block.items.length
      || (block.type !== "heading" && String(block.content || "").trim())
    ));
    if (section.title === "Como usar" && !hasDosageContent) {
      return `<p class="medicine-topic-unavailable">A posologia específica desta apresentação não foi identificada na bula cadastrada. Use o botão “Abrir bula” para consultar o documento completo.</p>`;
    }

    return blocks.map((block) => {
      if (block.type === "heading") {
        return `<h5 class="medicine-topic-subtitle">${escapeHtml(block.content)}</h5>`;
      }

      if (block.type === "table") {
        return `<div class="medicine-dose-table-wrap"><table class="medicine-dose-table"><thead><tr>${block.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      }

      if (block.type === "dosage-list") {
        return `<ul class="medicine-dosage-summary">${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      }

      return String(block.content || "").split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`).join("");
    }).join("");
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.remove("hidden");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      elements.toast.classList.add("hidden");
    }, 2400);
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function improveCustomerMessage(value) {
    let message = String(value || "")
      .trim()
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\bvc\b/gi, "você")
      .replace(/\bvcs\b/gi, "vocês")
      .replace(/\btb\b/gi, "também")
      .replace(/\bmsg\b/gi, "mensagem")
      .replace(/\bpfv\b/gi, "por favor")
      .replace(/\bobg\b/gi, "obrigado")
      .replace(/\bta\b/gi, "está")
      .replace(/\btá\b/gi, "está")
      .replace(/\bpra\b/gi, "para")
      .replace(/\bpro\b/gi, "para o")
      .replace(/\bremedio\b/gi, "medicamento")
      .replace(/\bremédios\b/gi, "medicamentos")
      .replace(/\s+([,.;!?])/g, "$1")
      .replace(/([,.;!?])(?=[A-Za-zÀ-ÿ])/g, "$1 ");

    if (!message) return "";

    const greetingMatch = message.match(/^(olá|oi|bom dia|boa tarde|boa noite|prezado(?:a)?(?: cliente)?)[,!\s-]*/i);
    let greeting = greetingMatch?.[1] || "Olá";
    message = greetingMatch ? message.slice(greetingMatch[0].length).trim() : message;
    if (!message) message = "Gostaria de falar com você";

    greeting = /^(bom dia|boa tarde|boa noite)$/i.test(greeting)
      ? greeting.charAt(0).toLocaleUpperCase("pt-BR") + greeting.slice(1).toLocaleLowerCase("pt-BR")
      : "Olá";
    message = message.charAt(0).toLocaleUpperCase("pt-BR") + message.slice(1);
    if (!/[.!?…]$/.test(message)) message += ".";

    const normalizedMessage = normalize(message);
    const hasClosing = /\b(se quiser|caso queira|posso ajudar|podemos ajudar|à disposição|aguardo|me avise|nos avise|será um prazer|conte comigo|conte conosco|qualquer dúvida)\b/i.test(message);
    const isUnavailable = /\b(nao (tem|temos|chegou)|acabou|em falta|indisponivel|sem estoque)\b/.test(normalizedMessage);
    const isArrival = !isUnavailable && /\b(chegou|disponivel|disponibilidade|em estoque|separado|pronto para retirar|retirada)\b/.test(normalizedMessage);
    const isPromotion = /\b(promocao|desconto|oferta|imperdivel|preco especial)\b/.test(normalizedMessage);
    const isQuote = /\b(orcamento|valor|preco|custa|ficou em|total)\b/.test(normalizedMessage);
    const isOrder = /\b(encomenda|pedido|reservado|reserva|separei|solicitou)\b/.test(normalizedMessage);
    const isReminder = /\b(lembrete|lembrar|horario|agendado|agendamento|consulta|aplicacao)\b/.test(normalizedMessage);
    const isThanks = /\b(obrigad[oa]|agradeco|agradecemos|preferencia|confianca)\b/.test(normalizedMessage);
    const paragraphs = [`${greeting}! Tudo bem? 😊`];

    if (isUnavailable) {
      paragraphs.push(`Sinto muito, mas preciso avisar que ${message.charAt(0).toLocaleLowerCase("pt-BR") + message.slice(1)} 😔`);
    } else if (isPromotion) {
      paragraphs.push("Tenho uma oportunidade especial para compartilhar com você! ✨");
      paragraphs.push(message);
    } else if (isArrival || isOrder) {
      paragraphs.push("Tenho uma ótima notícia para você! 🎉");
      paragraphs.push(message);
    } else if (isQuote) {
      paragraphs.push("Preparei as informações que você solicitou: 📝");
      paragraphs.push(message);
    } else if (isReminder) {
      paragraphs.push("Passando com carinho para lembrar você: 📅");
      paragraphs.push(message);
    } else if (isThanks) {
      paragraphs.push(`${message} 💙`);
    } else {
      paragraphs.push(message);
      paragraphs.push("Queremos que seu atendimento seja simples, rápido e tranquilo. 💙");
    }

    if (!hasClosing) {
      if (isUnavailable) {
        paragraphs.push("Se quiser, posso verificar uma alternativa disponível ou avisar assim que o produto chegar. Conte comigo! 💙");
      } else if (isArrival || isOrder) {
        paragraphs.push("Se desejar, posso deixar tudo separado para facilitar seu atendimento. É só me avisar! 💊");
      } else if (isPromotion) {
        paragraphs.push("Se tiver interesse, me avise e eu ajudo com os detalhes. Será um prazer atender você! 🛍️");
      } else if (isQuote) {
        paragraphs.push("Se desejar, também posso confirmar a disponibilidade e deixar seu pedido preparado. É só me chamar! 😊");
      } else if (isReminder) {
        paragraphs.push("Se precisar de alguma informação ou ajuste, estou à disposição para ajudar. 😊");
      } else if (!isThanks) {
        paragraphs.push("Se quiser, posso ajudar com mais informações e deixar tudo preparado para você. Será um prazer atender! ✨");
      }
    }

    return paragraphs.join("\n\n");
  }

  function appendChatMessage(kind, message) {
    const isUser = kind === "user";
    const article = document.createElement("article");
    article.className = `chat-message chat-message-${isUser ? "user" : "bot"}`;
    article.innerHTML = isUser
      ? `<div class="chat-message-content"><strong>Você</strong><div class="chat-bubble">${escapeHtml(message).replaceAll("\n", "<br />")}</div></div>`
      : `<span class="chat-avatar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v3M8 3h8M6 8h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z" /><circle cx="9" cy="14" r="1" /><circle cx="15" cy="14" r="1" /></svg></span><div class="chat-message-content"><strong>Mensagem melhorada</strong><div class="chat-bubble">${escapeHtml(message).replaceAll("\n", "<br />")}</div><button class="chat-copy" type="button" data-chat-copy="${encodeURIComponent(message)}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></svg>Copiar mensagem</button></div>`;
    elements.chatMessages.appendChild(article);
    elements.chatMessages.scrollTo({ top: elements.chatMessages.scrollHeight, behavior: "smooth" });
  }

  async function copyChatMessage(message) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = message;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function getInitials(name) {
    return String(name || "P")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function getSupabasePublishingMessage(error) {
    const message = String(error?.message || error || "");
    const status = Number(error?.status || error?.statusCode || 0);
    if (/invalid login credentials/i.test(message)) return "E-mail ou senha da conta publicadora inválidos.";
    if (/email not confirmed/i.test(message)) return "Confirme o e-mail da conta publicadora antes de entrar.";
    if (/could not find the ['"]short_id['"] column of ['"]offers['"] in the schema cache/i.test(message)) {
      return "O Supabase ainda não tem a coluna de link curto. Execute novamente a migração SQL atualizada em SUPABASE_OFFERS_SETUP.md e atualize o cache do schema.";
    }
    if (/row-level security|permission|not authorized|unauthorized/i.test(message) || status === 401 || status === 403) {
      return "Esta conta não possui permissão para executar a operação. Confira a migração e as políticas RLS.";
    }
    if (/bucket not found/i.test(message) || status === 404) {
      return "A tabela ou o bucket de ofertas ainda não foi criado. Execute a migração SQL do projeto.";
    }
    if (/failed to fetch|network/i.test(message)) return "Não foi possível alcançar o Supabase. Verifique a internet e a configuração.";
    return message || "A publicação segura ainda não está disponível.";
  }

  function getSupabasePublisher() {
    return state.supabaseSession?.user || null;
  }

  async function connectSupabasePublisher(email, password) {
    if (!supabaseClient) {
      state.supabaseConnectionError = "Configure as duas chaves públicas do Supabase antes de entrar.";
      renderOnlineOffersAvailability();
      return false;
    }
    try {
      elements.supabasePublisherConnect.disabled = true;
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      state.supabaseSession = data.session;
      state.supabaseConnectionError = "";
      elements.supabasePublisherLogin.reset();
      await checkOnlinePublishingServices();
      await loadPublishedOnlineOffers();
      showToast("Conta publicadora conectada.");
      return true;
    } catch (error) {
      state.supabaseSession = null;
      state.supabaseConnectionError = getSupabasePublishingMessage(error);
      showToast(state.supabaseConnectionError);
      return false;
    } finally {
      renderOnlineOffersAvailability();
    }
  }

  async function disconnectSupabasePublisher({ notify = true } = {}) {
    if (supabaseClient) {
      const { error } = await supabaseClient.auth.signOut({ scope: "local" });
      if (error) console.warn("Não foi possível encerrar a sessão publicadora:", error);
    }
    state.supabaseSession = null;
    state.onlineBackendReady = false;
    state.onlineBackendChecked = false;
    state.publishedOffers = [];
    renderPublishedOnlineOffers();
    renderOnlineOffersAvailability();
    if (notify) showToast("Conta publicadora desconectada.");
  }

  function getCurrentUser() {
    return state.currentUser || null;
  }

  function isAdminUser() {
    return getCurrentUser()?.role === "admin";
  }

  function renderAuthState() {
    const authenticated = Boolean(getCurrentUser());
    elements.authScreen.classList.toggle("hidden", authenticated);
    document.querySelector(".app-shell").classList.toggle("hidden", !authenticated);
    setSidebarOpen(false);

    if (authenticated) {
      const user = getCurrentUser();
      elements.currentUserLabel.textContent = `${user.name} • ${user.role === "admin" ? "Admin" : "Usuário"}`;
      elements.openAccount.classList.remove("hidden");
      elements.openUsers.classList.toggle("hidden", !isAdminUser());
      elements.topbarLogout.classList.remove("hidden");
      elements.sidebarItems
        .filter((item) => item.getAttribute("data-nav") === "users")
        .forEach((item) => item.classList.toggle("hidden", !isAdminUser()));
      elements.logoutButton.classList.remove("hidden");
      setActiveNav("dashboard");
      return;
    }

    elements.currentUserLabel.textContent = "-";
    elements.openAccount.classList.add("hidden");
    elements.openUsers.classList.add("hidden");
    elements.topbarLogout.classList.add("hidden");
    elements.logoutButton.classList.add("hidden");
    elements.sidebarItems
      .filter((item) => item.getAttribute("data-nav") === "users")
      .forEach((item) => item.classList.add("hidden"));
  }

  function renderUsersList() {
    if (!elements.usersList) return;

    elements.usersList.innerHTML = state.users
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
      .map((user) => `
        <article class="user-item">
          <div class="user-item-head">
            <strong>${escapeHtml(user.name)}</strong>
            <span class="user-role">${user.role === "admin" ? "Administrador" : "Usuário comum"}</span>
          </div>
          <p>CPF ${escapeHtml(user.cpf)}</p>
          <p>CRF ${escapeHtml(user.crf)}</p>
          <p>E-mail ${escapeHtml(user.email || user.identifier || "-")}</p>
          <div class="user-item-actions">
            <button type="button" class="mini-button" data-user-action="edit" data-user-id="${user.id}">Editar</button>
            <button type="button" class="mini-button danger" data-user-action="remove" data-user-id="${user.id}">Remover usuário</button>
          </div>
        </article>
      `)
      .join("");
  }

  function countAdminUsers() {
    return state.users.filter((user) => user.role === "admin").length;
  }

  function resetUsersForm() {
    state.editingUserId = "";
    elements.usersForm.reset();
    elements.userRole.value = "pharmacist";
    elements.userPassword.required = true;
    elements.userPassword.placeholder = "Senha de acesso";
    elements.userPasswordHelp.textContent = "Defina uma senha para o acesso do usuário.";
    elements.usersFormSubtitle.textContent = "Cadastre e gerencie os acessos do sistema.";
    elements.usersSubmitLabel.textContent = "Salvar usuário";
    elements.cancelUserEdit.classList.add("hidden");
  }

  function fillUsersForm(user) {
    state.editingUserId = user.id;
    elements.userName.value = user.name || "";
    elements.userCpf.value = user.cpf || "";
    elements.userCrf.value = user.crf || "";
    elements.userEmail.value = user.email || user.identifier || "";
    elements.userPassword.value = "";
    elements.userRole.value = user.role === "admin" ? "admin" : "pharmacist";
    elements.userPassword.required = false;
    elements.userPassword.placeholder = "Deixe em branco para manter a senha atual";
    elements.userPasswordHelp.textContent = "Preencha apenas se quiser redefinir a senha deste usuário.";
    elements.usersFormSubtitle.textContent = `Editando ${user.name}.`;
    elements.usersSubmitLabel.textContent = "Salvar alterações";
    elements.cancelUserEdit.classList.remove("hidden");
  }

  function openAccountModal() {
    const user = getCurrentUser();
    if (!user) {
      showToast("Faça login para acessar sua conta.");
      return;
    }

    elements.accountName.textContent = user.name || "-";
    elements.accountRole.textContent = user.role === "admin" ? "Administrador" : "Usuário comum";
    elements.accountEmail.textContent = user.email || user.identifier || "-";
    elements.accountCpf.textContent = user.cpf || "-";
    elements.accountCrf.textContent = user.crf || "-";
    openModal(elements.accountModal);
  }

  function renderDoctorsList() {
    if (!elements.doctorsList) return;

    elements.doctorsList.innerHTML = state.doctors
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))
      .map((doctor) => `
        <article class="user-item">
          <div class="user-item-head">
            <strong>${escapeHtml(doctor.name)}</strong>
            <span class="user-role">${escapeHtml(doctor.council || "CRM")}</span>
          </div>
          <p>Registro ${escapeHtml(doctor.registry)}</p>
          <p>UF ${escapeHtml(doctor.uf || "-")}</p>
          <div class="user-item-actions">
            <button type="button" class="mini-button danger" data-doctor-action="remove" data-doctor-id="${doctor.id}">Remover médico</button>
          </div>
        </article>
      `)
      .join("");
  }

  function openDoctorsModal() {
    renderDoctorsList();
    openModal(elements.doctorsModal);
  }

  function closeDoctorsModal() {
    closeModal(elements.doctorsModal);
  }

  function getLocalIsoDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60 * 1000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function formatPurchaseDate(value) {
    if (!value) return "-";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR").format(date);
  }

  function formatPurchasePhone(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function setPurchasesTab(tabName) {
    elements.purchasesTabs.forEach((tab) => {
      const isActive = tab.dataset.purchasesTab === tabName;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
    elements.purchasesPanels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.purchasesPanel !== tabName);
    });
  }

  function renderPurchaseShortages() {
    const shortages = state.purchaseShortages
      .slice()
      .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
    elements.shortagesCount.textContent = `${shortages.length} ${shortages.length === 1 ? "item" : "itens"}`;
    if (!shortages.length) {
      elements.shortagesList.innerHTML = `<div class="purchase-empty">Nenhum produto em falta. Adicione o primeiro item acima.</div>`;
      return;
    }

    elements.shortagesList.innerHTML = shortages.map((item) => `
      <article class="purchase-item">
        <div class="purchase-item-main">
          <strong>${escapeHtml(item.product)}</strong>
          <span>Quantidade: ${escapeHtml(item.quantity)}</span>
        </div>
        <span class="purchase-item-detail">Estoque zerado em ${formatPurchaseDate(item.outOfStockDate)}</span>
        <div class="purchase-item-actions">
          <button class="purchase-remove" type="button" data-purchase-action="remove-shortage" data-purchase-id="${item.id}" aria-label="Remover ${escapeHtml(item.product)}" title="Remover item">×</button>
        </div>
      </article>
    `).join("");
  }

  function getPurchaseConditionDetails(condition) {
    return {
      pending: { label: "Falta pagar", className: "condition-pending" },
      half: { label: "Pago 50%", className: "condition-half" },
      paid: { label: "Pago integral", className: "condition-paid" },
    }[condition] || { label: "Falta pagar", className: "condition-pending" };
  }

  function renderPurchaseOrders() {
    const orders = state.purchaseOrders
      .slice()
      .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
    elements.ordersCount.textContent = `${orders.length} ${orders.length === 1 ? "encomenda" : "encomendas"}`;
    if (!orders.length) {
      elements.ordersList.innerHTML = `<div class="purchase-empty">Nenhuma encomenda cadastrada. Adicione a primeira acima.</div>`;
      return;
    }

    elements.ordersList.innerHTML = orders.map((item) => {
      const condition = getPurchaseConditionDetails(item.condition);
      const wasPickedUp = item.situation === "picked-up";
      return `
        <article class="purchase-item">
          <div class="purchase-item-main">
            <strong>${escapeHtml(item.product)}</strong>
            <span>Quantidade: ${escapeHtml(item.quantity)} • Compra em ${formatPurchaseDate(item.purchaseDate)}</span>
          </div>
          <span class="purchase-item-detail"><strong>${escapeHtml(item.customerName)}</strong> • ${escapeHtml(item.phone)}</span>
          <div class="purchase-item-actions">
            <select class="purchase-status-select ${condition.className}" data-purchase-action="condition" data-purchase-id="${item.id}" aria-label="Condição de pagamento">
              <option value="pending"${item.condition === "pending" || !item.condition ? " selected" : ""}>Condição: Falta pagar</option>
              <option value="paid"${item.condition === "paid" ? " selected" : ""}>Condição: Pago integral</option>
              <option value="half"${item.condition === "half" ? " selected" : ""}>Condição: Pago 50%</option>
            </select>
            <select class="purchase-status-select ${wasPickedUp ? "situation-picked-up" : "situation-not-picked-up"}" data-purchase-action="situation" data-purchase-id="${item.id}" aria-label="Situação da encomenda">
              <option value="not-picked-up"${wasPickedUp ? "" : " selected"}>Situação: Não retirado</option>
              <option value="picked-up"${wasPickedUp ? " selected" : ""}>Situação: Retirado</option>
            </select>
            <button class="purchase-remove" type="button" data-purchase-action="remove-order" data-purchase-id="${item.id}" aria-label="Remover encomenda de ${escapeHtml(item.customerName)}" title="Remover encomenda">×</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderPurchases() {
    renderPurchaseShortages();
    renderPurchaseOrders();
  }

  function openPurchasesModal() {
    renderPurchases();
    setPurchasesTab("shortages");
    const today = getLocalIsoDate();
    if (!elements.shortageDate.value) elements.shortageDate.value = today;
    if (!elements.orderDate.value) elements.orderDate.value = today;
    openModal(elements.purchasesModal);
    setTimeout(() => elements.shortageProduct.focus(), 0);
  }

  async function createPurchaseShortage() {
    const record = {
      id: crypto.randomUUID(),
      product: elements.shortageProduct.value.trim(),
      quantity: Number(elements.shortageQuantity.value),
      outOfStockDate: elements.shortageDate.value,
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUser()?.id || "",
    };
    if (!record.product || !Number.isInteger(record.quantity) || record.quantity < 1 || !record.outOfStockDate) {
      showToast("Preencha produto, quantidade e data do estoque.");
      return false;
    }

    try {
      await upsertDocument(FIRESTORE_COLLECTIONS.purchaseShortages, record);
      state.purchaseShortages.unshift(record);
      elements.shortageForm.reset();
      elements.shortageDate.value = getLocalIsoDate();
      renderPurchaseShortages();
      elements.shortageProduct.focus();
      showToast("Produto adicionado à lista de faltas.");
      return true;
    } catch (error) {
      console.error("Erro ao salvar produto em falta:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  async function createPurchaseOrder() {
    const record = {
      id: crypto.randomUUID(),
      customerName: elements.orderName.value.trim(),
      purchaseDate: elements.orderDate.value,
      phone: elements.orderPhone.value.trim(),
      product: elements.orderProduct.value.trim(),
      quantity: Number(elements.orderQuantity.value),
      condition: "pending",
      situation: "not-picked-up",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: getCurrentUser()?.id || "",
    };
    if (!record.customerName || !record.purchaseDate || !record.phone || !record.product || !Number.isInteger(record.quantity) || record.quantity < 1) {
      showToast("Preencha todos os campos da encomenda.");
      return false;
    }

    try {
      await upsertDocument(FIRESTORE_COLLECTIONS.purchaseOrders, record);
      state.purchaseOrders.unshift(record);
      elements.orderForm.reset();
      elements.orderDate.value = getLocalIsoDate();
      renderPurchaseOrders();
      elements.orderName.focus();
      showToast("Encomenda adicionada com sucesso.");
      return true;
    } catch (error) {
      console.error("Erro ao salvar encomenda:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  async function updatePurchaseOrderStatus(orderId, action, value) {
    const order = state.purchaseOrders.find((item) => item.id === orderId);
    if (!order) return;
    const updatedOrder = { ...order, updatedAt: new Date().toISOString() };
    if (action === "condition") {
      updatedOrder.condition = ["pending", "paid", "half"].includes(value) ? value : "pending";
    } else {
      updatedOrder.situation = value === "picked-up" ? "picked-up" : "not-picked-up";
    }

    try {
      await upsertDocument(FIRESTORE_COLLECTIONS.purchaseOrders, updatedOrder);
      state.purchaseOrders = state.purchaseOrders.map((item) => item.id === orderId ? updatedOrder : item);
      renderPurchaseOrders();
      showToast(action === "condition" ? "Condição de pagamento atualizada." : "Situação da encomenda atualizada.");
    } catch (error) {
      console.error("Erro ao atualizar encomenda:", error);
      showToast(getFirebaseMessage(error));
    }
  }

  async function removePurchaseRecord(kind, recordId) {
    const isOrder = kind === "order";
    const collection = isOrder ? FIRESTORE_COLLECTIONS.purchaseOrders : FIRESTORE_COLLECTIONS.purchaseShortages;
    const records = isOrder ? state.purchaseOrders : state.purchaseShortages;
    const record = records.find((item) => item.id === recordId);
    if (!record) return;
    const label = isOrder ? `a encomenda de ${record.customerName}` : `o produto ${record.product}`;
    if (!window.confirm(`Deseja remover ${label}?`)) return;

    try {
      await deleteDocument(collection, recordId);
      if (isOrder) {
        state.purchaseOrders = state.purchaseOrders.filter((item) => item.id !== recordId);
        renderPurchaseOrders();
      } else {
        state.purchaseShortages = state.purchaseShortages.filter((item) => item.id !== recordId);
        renderPurchaseShortages();
      }
      showToast("Item removido com sucesso.");
    } catch (error) {
      console.error("Erro ao remover item de compras:", error);
      showToast(getFirebaseMessage(error));
    }
  }

  function setTrierStatus(status, message) {
    elements.trierStatus.dataset.status = status;
    elements.trierStatus.textContent = message;
  }

  function getTrierProductCost(product) {
    return product?.averageCost ?? product?.costPrice ?? null;
  }

  function renderQuoteSearchResults() {
    const query = normalize(elements.quoteProductSearch.value.trim());
    const digits = elements.quoteProductSearch.value.replace(/\D/g, "");
    if (!query) {
      elements.quoteSearchResults.classList.add("hidden");
      elements.quoteSearchResults.innerHTML = "";
      return;
    }

    if (!state.trierProducts.length) {
      elements.quoteSearchResults.classList.remove("hidden");
      elements.quoteSearchResults.innerHTML = `<div class="quote-search-empty">${escapeHtml(state.trierSyncError || "Conectando ao estoque da Trier. Tente novamente em instantes.")}</div>`;
      return;
    }

    const matches = state.trierProducts
      .map((product, index) => ({ product, index, normalizedName: normalize(product.name) }))
      .filter(({ product, normalizedName }) => (
        normalizedName.includes(query)
        || (digits && (product.barcode.includes(digits) || product.code === digits))
      ))
      .sort((left, right) => {
        const leftExact = left.product.barcode === digits || left.product.code === digits ? 0 : left.normalizedName.startsWith(query) ? 1 : 2;
        const rightExact = right.product.barcode === digits || right.product.code === digits ? 0 : right.normalizedName.startsWith(query) ? 1 : 2;
        return leftExact - rightExact || left.product.name.localeCompare(right.product.name, "pt-BR");
      })
      .slice(0, 12);

    elements.quoteSearchResults.classList.remove("hidden");
    if (!matches.length) {
      elements.quoteSearchResults.innerHTML = `<div class="quote-search-empty">Nenhum produto encontrado no estoque sincronizado.</div>`;
      return;
    }

    elements.quoteSearchResults.innerHTML = matches.map(({ product, index }) => `
      <button class="quote-search-option" type="button" role="option" data-trier-product-index="${index}">
        <span><strong>${escapeHtml(product.name)}</strong><small>${product.barcode ? `EAN ${escapeHtml(product.barcode)} • ` : ""}Cód. ${escapeHtml(product.code)}</small></span>
        <span class="quote-search-option-meta"><strong>${formatCurrency(product.salePrice)}</strong><small>${escapeHtml(String(product.stock))} ${escapeHtml(product.unit)} em estoque</small></span>
      </button>
    `).join("");
  }

  function selectQuoteProduct(product) {
    if (!product) return;
    state.selectedQuoteProduct = product;
    elements.quoteProductSearch.value = product.name;
    elements.quoteProductPrice.value = formatDecimalInput(product.salePrice);
    elements.quoteProductQuantity.value = "1";
    elements.quoteSearchResults.classList.add("hidden");
    elements.quoteAddProduct.disabled = false;
    const cost = getTrierProductCost(product);
    elements.quoteSelectedProduct.innerHTML = `
      <div>
        <span class="quote-selected-label">Produto selecionado</span>
        <strong>${escapeHtml(product.name)}</strong>
        <small>${product.barcode ? `EAN ${escapeHtml(product.barcode)} • ` : ""}Código ${escapeHtml(product.code)}</small>
      </div>
      <div class="quote-selected-metrics">
        <span><small>Estoque</small><strong>${escapeHtml(String(product.stock))} ${escapeHtml(product.unit)}</strong></span>
        <span><small>Venda Trier</small><strong>${formatCurrency(product.salePrice)}</strong></span>
        <span><small>Custo${product.averageCost !== null ? " médio" : ""}</small><strong>${cost === null ? "Não informado" : formatCurrency(cost)}</strong></span>
      </div>
    `;
    elements.quoteSelectedProduct.classList.remove("hidden");
    elements.quoteProductQuantity.focus();
    elements.quoteProductQuantity.select();
  }

  function resetQuoteProductSelection() {
    state.selectedQuoteProduct = null;
    elements.quoteProductSearch.value = "";
    elements.quoteProductQuantity.value = "1";
    elements.quoteProductPrice.value = "";
    elements.quoteAddProduct.disabled = true;
    elements.quoteSelectedProduct.classList.add("hidden");
    elements.quoteSelectedProduct.innerHTML = "";
    elements.quoteSearchResults.classList.add("hidden");
    elements.quoteSearchResults.innerHTML = "";
  }

  function renderWhatsappQuote() {
    const hasItems = state.whatsappQuoteItems.length > 0;
    elements.quoteProductsEmpty.classList.toggle("hidden", hasItems);
    elements.quoteItems.classList.toggle("hidden", !hasItems);
    elements.sendWhatsappQuote.disabled = !hasItems;
    elements.copyWhatsappQuote.disabled = !hasItems;
    elements.clearWhatsappQuote.disabled = !hasItems;
    const itemCount = state.whatsappQuoteItems.reduce((total, item) => total + item.quantity, 0);
    const total = state.whatsappQuoteItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    elements.quoteItemsCount.textContent = String(itemCount);
    elements.quoteTotal.textContent = formatCurrency(total);

    elements.quoteItems.innerHTML = state.whatsappQuoteItems.map((item) => {
      const cost = getTrierProductCost(item.product);
      const exceedsStock = item.quantity > item.product.stock;
      return `
        <article class="quote-item" data-quote-item-id="${item.id}">
          <div class="quote-item-copy">
            <strong>${escapeHtml(item.product.name)}</strong>
            <span>${item.product.barcode ? `EAN ${escapeHtml(item.product.barcode)} • ` : ""}Estoque ${escapeHtml(String(item.product.stock))} ${escapeHtml(item.product.unit)}${cost === null ? "" : ` • Custo ${formatCurrency(cost)}`}</span>
            ${exceedsStock ? `<small class="quote-stock-warning">Quantidade acima do estoque disponível</small>` : ""}
          </div>
          <label class="quote-item-field"><span>Qtd.</span><input type="number" min="1" step="1" value="${item.quantity}" data-quote-item-action="quantity" /></label>
          <label class="quote-item-field quote-item-price"><span>Valor unitário</span><div class="quote-money-input"><span>R$</span><input type="text" inputmode="decimal" value="${formatDecimalInput(item.price)}" data-quote-item-action="price" /></div></label>
          <div class="quote-item-subtotal"><span>Subtotal</span><strong>${formatCurrency(item.quantity * item.price)}</strong></div>
          <button class="quote-item-remove" type="button" data-quote-item-action="remove" aria-label="Remover ${escapeHtml(item.product.name)}">×</button>
        </article>
      `;
    }).join("");
  }

  function addSelectedProductToQuote() {
    const product = state.selectedQuoteProduct;
    const quantity = Number(elements.quoteProductQuantity.value);
    const price = parseNumberValue(elements.quoteProductPrice.value);
    if (!product) {
      showToast("Selecione um produto da lista da Trier.");
      return false;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      showToast("Informe uma quantidade válida.");
      return false;
    }
    if (price === null || price < 0) {
      showToast("Informe um valor final válido.");
      return false;
    }

    const existing = state.whatsappQuoteItems.find((item) => item.product.code === product.code && item.price === price);
    if (existing) {
      existing.quantity += quantity;
    } else {
      state.whatsappQuoteItems.push({ id: crypto.randomUUID(), product, quantity, price });
    }
    renderWhatsappQuote();
    resetQuoteProductSelection();
    elements.quoteProductSearch.focus();
    showToast("Produto adicionado ao orçamento.");
    return true;
  }

  function buildWhatsappQuoteMessage() {
    const customerName = elements.quoteCustomerName.value.trim();
    const total = state.whatsappQuoteItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const lines = [
      "*ORÇAMENTO - FARMÁCIA SUPERPREÇO*",
      customerName ? `Olá, ${customerName}! Segue o seu orçamento:` : "Olá! Segue o seu orçamento:",
      "",
      ...state.whatsappQuoteItems.flatMap((item, index) => [
        `*${index + 1}. ${item.product.name}*`,
        `${item.quantity} x ${formatCurrency(item.price)} = *${formatCurrency(item.quantity * item.price)}*`,
        "",
      ]),
      `*TOTAL: ${formatCurrency(total)}*`,
      "",
      "Valores sujeitos à disponibilidade de estoque.",
    ];
    return lines.join("\n");
  }

  function applyTrierProducts(result) {
    const products = Array.isArray(result?.products) ? result.products : [];
    const productsByCode = new Map(products.map((product) => [product.code, product]));
    state.trierProducts = products;
    state.trierProductsSyncedAt = result?.syncedAt || new Date().toISOString();
    state.trierSyncError = "";
    state.whatsappQuoteItems = state.whatsappQuoteItems.map((item) => ({
      ...item,
      product: productsByCode.get(item.product.code) || item.product,
    }));
    if (state.selectedQuoteProduct) {
      state.selectedQuoteProduct = productsByCode.get(state.selectedQuoteProduct.code) || state.selectedQuoteProduct;
    }
    elements.quoteProductSearch.disabled = false;
    const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })
      .format(new Date(state.trierProductsSyncedAt));
    if (result?.syncError) {
      state.trierSyncError = result.syncError;
      setTrierStatus("error", `${products.length} produtos • sem conexão • usando última atualização das ${time}`);
    } else if (result?.cacheError) {
      state.trierSyncError = result.cacheError;
      setTrierStatus("error", `${products.length} produtos • atualizado às ${time} • não foi salvo neste computador`);
    } else if (result?.refreshing) {
      setTrierStatus("loading", `${products.length} produtos salvos • atualizando estoque desde ${time}...`);
    } else {
      setTrierStatus("success", `${products.length} produtos • atualizado às ${time} • automático a cada 5 min`);
    }
    if (!elements.whatsappQuoteModal.classList.contains("hidden")) renderWhatsappQuote();
  }

  async function loadTrierProducts(forceRefresh = false, silent = false) {
    setTrierStatus("loading", state.trierProducts.length ? "Atualizando estoque automaticamente..." : "Conectando à Trier...");
    try {
      const result = await window.desktopTrier.getProducts(forceRefresh);
      applyTrierProducts(result);
      if (!state.trierProducts.length && !silent) showToast("A Trier não retornou produtos ativos.");
      return true;
    } catch (error) {
      console.error("Erro ao sincronizar produtos da Trier:", error);
      setTrierStatus("error", state.trierProducts.length ? "Sem conexão • usando última atualização" : "Configure a API Trier");
      const message = error?.message || "Não foi possível consultar o estoque da Trier.";
      state.trierSyncError = message;
      renderQuoteSearchResults();
      if (!silent) showToast(message);
      return false;
    }
  }

  async function openWhatsappQuoteModal() {
    openModal(elements.whatsappQuoteModal);
    renderWhatsappQuote();
    try {
      const config = await window.desktopTrier.getConfig();
      elements.trierApiBaseUrl.value = config.baseUrl;
      elements.trierApiToken.placeholder = config.configured
        ? "Token salvo neste computador; preencha apenas para substituí-lo"
        : "Cole o token de integração emitido pela Trier";
      if (!config.configured) {
        elements.trierConfigForm.classList.remove("hidden");
        elements.trierConfigMessage.textContent = "Informe o token da Trier para carregar os produtos.";
      }
    } catch (error) {
      console.error("Não foi possível carregar a configuração da Trier:", error);
      setTrierStatus("error", error?.message || "Falha ao ler a configuração Trier");
    }
    if (!state.trierProducts.length) await loadTrierProducts(false);
    setTimeout(() => elements.quoteProductSearch.focus(), 0);
  }

  async function createDoctorFromForm() {
    const name = elements.doctorName.value.trim();
    const council = "CRM";
    const registry = elements.doctorRegistry.value.trim();
    const uf = elements.doctorUf.value.trim().toUpperCase();

    if (!name || !council || !registry || !uf) {
      showToast("Preencha todos os campos do médico.");
      return false;
    }

    const existingDoctor = state.doctors.find((doctor) => (
      normalize(doctor.council) === normalize(council)
      && normalize(doctor.registry) === normalize(registry)
    ));

    const doctorRecord = {
      id: existingDoctor?.id || crypto.randomUUID(),
      name,
      council,
      registry,
      uf,
      createdAt: existingDoctor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await upsertDocument(FIRESTORE_COLLECTIONS.doctors, doctorRecord);
      state.doctors = existingDoctor
        ? state.doctors.map((doctor) => (doctor.id === existingDoctor.id ? doctorRecord : doctor))
        : [doctorRecord, ...state.doctors];
      renderDoctorsList();
      elements.doctorsForm.reset();
      showToast(existingDoctor ? "Médico atualizado com sucesso." : "Médico cadastrado com sucesso.");
      return true;
    } catch (error) {
      console.error("Erro ao salvar médico:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  function findDoctorByRegistry(council, registry) {
    return state.doctors.find((doctor) => (
      normalize(doctor.council) === normalize(council)
      && normalize(doctor.registry) === normalize(registry)
    )) || null;
  }

  function fillPrescriberFieldsFromDoctor(doctor) {
    if (!doctor) return;
    elements.clinicalForm.querySelector("#injectable-prescriber-name").value = doctor.name || "";
    elements.clinicalForm.querySelector("#injectable-council").value = doctor.council || "CRM";
    elements.clinicalForm.querySelector("#injectable-registry").value = doctor.registry || "";
    elements.clinicalForm.querySelector("#injectable-uf").value = doctor.uf || "";
  }

  function lookupPrescriberByRegistry() {
    const council = getClinicalFormValue("injectable-council");
    const registry = getClinicalFormValue("injectable-registry").trim();

    if (!registry) {
      showToast("Informe o número do registro para buscar o médico.");
      return;
    }

    const doctor = findDoctorByRegistry(council, registry);
    if (doctor) {
      fillPrescriberFieldsFromDoctor(doctor);
      showToast("Médico localizado com sucesso.");
      return;
    }

    openModal(elements.doctorLookupModal);
  }

  async function saveDoctorFromPrescriber(record) {
    if (!record?.prescriberName || !record?.registry) {
      return;
    }

    const existingDoctor = findDoctorByRegistry(record.council || "CRM", record.registry);
    const doctorRecord = {
      id: existingDoctor?.id || crypto.randomUUID(),
      name: record.prescriberName,
      council: record.council || "CRM",
      registry: record.registry,
      uf: record.uf || "",
      createdAt: existingDoctor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await upsertDocument(FIRESTORE_COLLECTIONS.doctors, doctorRecord);
    state.doctors = existingDoctor
      ? state.doctors.map((doctor) => (doctor.id === existingDoctor.id ? doctorRecord : doctor))
      : [doctorRecord, ...state.doctors];
  }

  async function deleteDoctor(doctorId) {
    const doctor = state.doctors.find((item) => item.id === doctorId);
    if (!doctor) {
      showToast("Médico não encontrado.");
      return false;
    }

    const confirmed = window.confirm(`Deseja remover o médico ${doctor.name}?`);
    if (!confirmed) {
      return false;
    }

    try {
      await deleteDocument(FIRESTORE_COLLECTIONS.doctors, doctorId);
      state.doctors = state.doctors.filter((item) => item.id !== doctorId);
      renderDoctorsList();
      showToast("Médico removido com sucesso.");
      return true;
    } catch (error) {
      console.error("Erro ao remover médico:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  async function deleteUser(userId) {
    const user = state.users.find((item) => item.id === userId);
    if (!user) {
      showToast("Usuário não encontrado.");
      return false;
    }

    if (user.id === "admin-default") {
      showToast("O administrador principal não pode ser removido.");
      return false;
    }

    if (user.role === "admin" && countAdminUsers() <= 1) {
      showToast("É preciso manter pelo menos um administrador ativo.");
      return false;
    }

    if (state.currentUserId === userId) {
      showToast("Você não pode remover o usuário que está logado.");
      return false;
    }

    const confirmed = window.confirm(`Deseja remover o usuário ${user.name}?`);
    if (!confirmed) {
      return false;
    }

    try {
      await deleteDocument(FIRESTORE_COLLECTIONS.users, userId);
      state.users = state.users.filter((item) => item.id !== userId);
      renderUsersList();
      showToast("Usuário removido com sucesso.");
      return true;
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  function openUsersModal() {
    if (!isAdminUser()) {
      showToast("Acesso restrito ao administrador.");
      return;
    }

    resetUsersForm();
    renderUsersList();
    openModal(elements.usersModal);
  }

  function closeUsersModal() {
    closeModal(elements.usersModal);
  }

  function resetPricingProductForm() {
    state.editingPricingProductId = "";
    state.pricingFormSource = "";
    elements.pricingProductForm.reset();
    elements.pricingRealProfit.closest(".pricing-result-card").classList.remove("is-positive", "is-warning", "is-negative");
    renderPricingProductResults();
  }

  function getOfferFontSize(input, defaultSize) {
    if (!input.value.trim()) return defaultSize;
    const size = Number(input.value);
    return Number.isFinite(size) ? Math.min(120, Math.max(6, size)) : defaultSize;
  }

  function getOfferFontCssSize(points) {
    // Keeps point-sized text proportional to the printable canvas in preview and print.
    return `${points * 0.174}cqw`;
  }

  function getSavedOfferFontSize(value, defaultSize, isPointSize) {
    const size = Number(value);
    if (!Number.isFinite(size)) return String(defaultSize);
    const points = isPointSize ? size : defaultSize * (size / 100);
    return String(Math.round(Math.min(120, Math.max(6, points))));
  }

  function renderOfferSheetPreview() {
    const canvasFormat = OFFER_CANVAS_FORMATS[state.offerCanvasFormat] || OFFER_CANVAS_FORMATS.story;
    const backgroundFormat = state.offerCanvasFormat === "square" ? "square" : "story";
    const name = elements.offerProductName.value.trim();
    const description = elements.offerDescription.value.trim();
    const specialTopText = elements.offerSpecialTopText.value.trim();
    const specialBandText = elements.offerSpecialBandText.value.trim();
    const topTilt = Number(elements.offerTopTilt.value);
    const topFontSize = getOfferFontSize(elements.offerTopFontSize, 36);
    const bandTilt = Number(elements.offerBandTilt.value);
    const bandFontSize = getOfferFontSize(elements.offerBandFontSize, 42);
    const bandWidth = Number(elements.offerBandWidth.value) || 100;
    const bandHeight = Number(elements.offerBandHeight.value) || 100;
    const priceLabelWidth = Number(elements.offerPriceLabelWidth.value) || 100;
    const priceLabelHeight = Number(elements.offerPriceLabelHeight.value) || 100;
    const priceLabelFontSize = getOfferFontSize(elements.offerPriceLabelFontSize, 18);
    const originalPriceFontSize = getOfferFontSize(elements.offerOriginalFontSize, 18);
    const discountPriceFontSize = getOfferFontSize(elements.offerDiscountFontSize, 34);
    const nameFontSize = getOfferFontSize(elements.offerNameFontSize, 27);
    const nameWidth = Number(elements.offerNameWidth.value) || 100;
    const nameHeight = Number(elements.offerNameHeight.value) || 100;
    const descriptionFontSize = getOfferFontSize(elements.offerDescriptionFontSize, 20);
    const originalPrice = parseNumberValue(elements.offerOriginalPrice.value);
    const discountPrice = parseNumberValue(elements.offerDiscountPrice.value);
    elements.offerPreviewName.textContent = name;
    elements.offerPreviewName.classList.toggle("hidden", !name);
    elements.offerPreviewDescription.textContent = description;
    elements.offerPreviewDescription.classList.toggle("hidden", !description);
    elements.offerPreviewSpecialLead.textContent = specialTopText;
    elements.offerPreviewSpecialLead.classList.toggle("hidden", !specialTopText);
    elements.offerPreviewSpecialBand.textContent = specialBandText;
    elements.offerPreviewSpecialBand.classList.toggle("hidden", !specialBandText);
    elements.offerPreviewSpecial.classList.remove("hidden");
    elements.offerTopTiltValue.value = `${topTilt}°`;
    elements.offerBandTiltValue.value = `${bandTilt}°`;
    elements.offerBandWidthValue.value = `${bandWidth}%`;
    elements.offerBandHeightValue.value = `${bandHeight}%`;
    elements.offerPriceLabelWidthValue.value = `${priceLabelWidth}%`;
    elements.offerPriceLabelHeightValue.value = `${priceLabelHeight}%`;
    elements.offerNameWidthValue.value = `${nameWidth}%`;
    elements.offerNameHeightValue.value = `${nameHeight}%`;
    elements.offerSheetPreview.style.setProperty("--offer-name-font-size", getOfferFontCssSize(nameFontSize));
    elements.offerSheetPreview.style.setProperty("--offer-name-width-scale", String(nameWidth / 100));
    elements.offerSheetPreview.style.setProperty("--offer-name-height-scale", String(nameHeight / 100));
    elements.offerSheetPreview.style.setProperty("--offer-name-x", `${state.offerNamePositionX / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-name-y", `${state.offerNamePositionY / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-description-color", elements.offerDescriptionColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-description-font-size", getOfferFontCssSize(descriptionFontSize));
    elements.offerSheetPreview.style.setProperty("--offer-description-x", `${state.offerDescriptionPositionX / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-description-y", `${state.offerDescriptionPositionY / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-badge-text-color", elements.offerSpecialTextColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-badge-background", elements.offerSpecialBackgroundColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-top-text-color", elements.offerSpecialTextColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-top-tilt", `${topTilt}deg`);
    elements.offerSheetPreview.style.setProperty("--offer-top-font-size", getOfferFontCssSize(topFontSize));
    elements.offerSheetPreview.style.setProperty("--offer-top-x", `${state.offerTopTextPositionX / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-top-y", `${state.offerTopTextPositionY / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-band-text-color", elements.offerBandTextColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-band-tilt", `${bandTilt}deg`);
    elements.offerSheetPreview.style.setProperty("--offer-band-font-size", getOfferFontCssSize(bandFontSize));
    elements.offerSheetPreview.style.setProperty("--offer-original-price-font-size", getOfferFontCssSize(originalPriceFontSize));
    elements.offerSheetPreview.style.setProperty("--offer-discount-price-font-size", getOfferFontCssSize(discountPriceFontSize));
    elements.offerSheetPreview.style.setProperty("--offer-price-label-font-size", getOfferFontCssSize(priceLabelFontSize));
    elements.offerSheetPreview.style.setProperty("--offer-price-label-background", elements.offerPriceLabelBackgroundColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-title-band-width-scale", String(bandWidth / 100));
    elements.offerSheetPreview.style.setProperty("--offer-title-band-height-scale", String(bandHeight / 100));
    elements.offerSheetPreview.style.setProperty("--offer-title-band-width", `${72.2 * (bandWidth / 100)}%`);
    elements.offerSheetPreview.style.setProperty("--offer-title-band-height", `${9.55 * (bandHeight / 100)}%`);
    elements.offerSheetPreview.style.setProperty("--offer-title-band-x", `${state.offerTitleBandPositionX / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-title-band-y", `${state.offerTitleBandPositionY / 10.8}cqw`);
    elements.offerSheetPreview.style.setProperty("--offer-canvas-ratio", `${canvasFormat.width} / ${canvasFormat.height}`);
    elements.offerTemplateBackground.src = OFFER_TEMPLATE_BACKGROUNDS[backgroundFormat];
    elements.offerSheetPreview.classList.toggle("is-story-layout", true);
    elements.offerPreviewFormat.textContent = canvasFormat.ratioLabel;
    elements.offerResizeLabel.textContent = `${canvasFormat.label} · ${canvasFormat.ratioLabel}`;
    elements.offerResizeOptions.querySelectorAll("[data-offer-format]").forEach((button) => {
      const selected = button.dataset.offerFormat === state.offerCanvasFormat;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
    elements.offerSheetPreview.style.setProperty("--offer-product-name-color", elements.offerProductNameColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-original-price-color", elements.offerOriginalPriceColor.value);
    elements.offerSheetPreview.style.setProperty("--offer-discount-price-color", elements.offerDiscountPriceColor.value);
    elements.offerPreviewOriginal.textContent = originalPrice !== null ? formatCurrency(originalPrice) : "";
    elements.offerPreviewOriginalWrap.classList.toggle("hidden", originalPrice === null);
    elements.offerPreviewDiscount.textContent = discountPrice !== null ? formatCurrency(discountPrice) : "";
    elements.offerPreviewDiscountWrap.classList.toggle("hidden", discountPrice === null);
    elements.offerPreviewPrices.classList.toggle("hidden", originalPrice === null && discountPrice === null);
    elements.offerPreviewPrices.classList.toggle("has-original", originalPrice !== null);
    elements.offerPreviewPrices.classList.toggle("has-discount", discountPrice !== null);
    elements.offerPreviewPrices.style.setProperty("--offer-prices-x", `${state.offerPricesPositionX / 10.8}cqw`);
    elements.offerPreviewPrices.style.setProperty("--offer-prices-y", `${state.offerPricesPositionY / 10.8}cqw`);
    elements.offerPreviewPrices.style.setProperty("--offer-original-x", `${state.offerOriginalPricePositionX / 10.8}cqw`);
    elements.offerPreviewPrices.style.setProperty("--offer-original-y", `${state.offerOriginalPricePositionY / 10.8}cqw`);
    elements.offerPreviewPrices.style.setProperty("--offer-discount-x", `${state.offerDiscountPricePositionX / 10.8}cqw`);
    elements.offerPreviewPrices.style.setProperty("--offer-discount-y", `${state.offerDiscountPricePositionY / 10.8}cqw`);
    elements.offerPreviewPrices.style.setProperty("--offer-price-label-width-scale", String(priceLabelWidth / 100));
    elements.offerPreviewPrices.style.setProperty("--offer-price-label-height-scale", String(priceLabelHeight / 100));

    const footerText = getOfferFooterText();
    elements.offerPreviewFooter.textContent = footerText;
    elements.offerPreviewFooter.classList.toggle("hidden", !footerText);
    elements.offerStockToggle.classList.toggle("is-active", state.offerStockMessageEnabled);
    elements.offerStockToggle.textContent = state.offerStockMessageEnabled ? "Ativada" : "Desativada";
    elements.offerStockToggle.setAttribute("aria-pressed", String(state.offerStockMessageEnabled));

    elements.saveOfferArt.textContent = state.activeSavedOfferArtId ? "Atualizar arte" : "Salvar arte";

    const hasImage = Boolean(state.offerImageDataUrl);
    elements.offerPreviewImage.classList.toggle("hidden", !hasImage);
    elements.offerPreviewImageWrap.classList.toggle("hidden", !hasImage);
    elements.offerPreviewPlaceholder.classList.add("hidden");
    elements.offerSheetPreview.classList.toggle("has-image", hasImage);
    elements.offerSheetPreview.classList.toggle("is-background-removed", hasImage && state.offerBackgroundRemoved);
    elements.removeOfferImage.classList.toggle("hidden", !hasImage);
    elements.offerBackgroundRemoval.classList.toggle("hidden", !hasImage);
    elements.offerBackgroundButton.classList.toggle("is-active", state.offerBackgroundRemoved);
    elements.offerBackgroundButton.disabled = state.offerBackgroundProcessing;
    elements.offerBackgroundButton.textContent = state.offerBackgroundProcessing
      ? "Removendo..."
      : state.offerBackgroundRemoved
        ? "Restaurar fundo"
        : "Remover fundo";
    elements.offerImageZoomControls.classList.toggle("hidden", !hasImage);
    elements.offerImageZoom.value = String(state.offerImageZoom);
    elements.offerImageZoomValue.value = `${state.offerImageZoom}%`;
    elements.offerShadowZoom.value = String(state.offerShadowZoom);
    elements.offerShadowZoomValue.value = `${state.offerShadowZoom}%`;
    elements.offerShadowHeight.value = String(state.offerShadowHeight);
    elements.offerShadowHeightValue.value = `${state.offerShadowHeight}%`;
    elements.offerPreviewImageWrap.style.setProperty("--product-x", `${state.offerImagePositionX / 10.8}cqw`);
    elements.offerPreviewImageWrap.style.setProperty("--product-y", `${state.offerImagePositionY / 10.8}cqw`);
    elements.offerPreviewImageWrap.style.setProperty("--product-scale", String(state.offerImageZoom / 100));
    elements.offerPreviewImageWrap.style.setProperty("--shadow-x", `${state.offerShadowPositionX / 10.8}cqw`);
    elements.offerPreviewImageWrap.style.setProperty("--shadow-y", `${state.offerShadowPositionY / 10.8}cqw`);
    elements.offerPreviewImageWrap.style.setProperty("--shadow-scale", String(state.offerShadowZoom / 100));
    elements.offerPreviewImageWrap.style.setProperty("--shadow-height-scale", String(state.offerShadowHeight / 100));
    if (hasImage) {
      elements.offerPreviewImage.src = state.offerImageDataUrl;
      elements.offerImageThumb.innerHTML = `<img src="${state.offerImageDataUrl}" alt="Miniatura do produto" />`;
    } else {
      elements.offerPreviewImage.removeAttribute("src");
      elements.offerImageThumb.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m3 16 5-5 4 4 3-3 6 6M8.5 8.5h.01" /></svg>`;
    }
  }

  function formatOfferValidityDate(value) {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  }

  function getOfferFooterText() {
    const validUntil = formatOfferValidityDate(elements.offerValidUntil.value);
    if (validUntil && state.offerStockMessageEnabled) {
      return `Oferta válida até ${validUntil} ou enquanto durarem os estoques.`;
    }
    if (validUntil) return `Oferta válida até ${validUntil}.`;
    return state.offerStockMessageEnabled ? "Oferta válida enquanto durarem os estoques." : "";
  }

  function openOfferArtDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(OFFER_ART_DB_NAME, 1);
      request.addEventListener("upgradeneeded", () => {
        if (!request.result.objectStoreNames.contains(OFFER_ART_STORE)) {
          request.result.createObjectStore(OFFER_ART_STORE, { keyPath: "id" });
        }
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error || new Error("Não foi possível abrir as artes salvas.")));
    });
  }

  async function readSavedOfferArts() {
    const database = await openOfferArtDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = database.transaction(OFFER_ART_STORE, "readonly");
        const request = transaction.objectStore(OFFER_ART_STORE).getAll();
        request.addEventListener("success", () => resolve(request.result || []));
        request.addEventListener("error", () => reject(request.error));
      });
    } finally {
      database.close();
    }
  }

  async function writeSavedOfferArt(art) {
    const database = await openOfferArtDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(OFFER_ART_STORE, "readwrite");
        transaction.objectStore(OFFER_ART_STORE).put(art);
        transaction.addEventListener("complete", resolve);
        transaction.addEventListener("error", () => reject(transaction.error));
        transaction.addEventListener("abort", () => reject(transaction.error));
      });
    } finally {
      database.close();
    }
  }

  function createOfferArtSnapshot(name, existingArt = null) {
    return {
      id: existingArt?.id || (crypto.randomUUID ? crypto.randomUUID() : `offer-art-${Date.now()}`),
      name,
      createdAt: existingArt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productName: elements.offerProductName.value,
      originalPrice: elements.offerOriginalPrice.value,
      discountPrice: elements.offerDiscountPrice.value,
      description: elements.offerDescription.value,
      specialTopText: elements.offerSpecialTopText.value,
      specialBandText: elements.offerSpecialBandText.value,
      specialText: [elements.offerSpecialTopText.value, elements.offerSpecialBandText.value].filter(Boolean).join(" "),
      specialTextColor: elements.offerSpecialTextColor.value,
      topTextColor: elements.offerSpecialTextColor.value,
      bandTextColor: elements.offerBandTextColor.value,
      specialBackgroundColor: elements.offerSpecialBackgroundColor.value,
      fontSizeUnit: "pt",
      specialTilt: elements.offerBandTilt.value,
      topTilt: elements.offerTopTilt.value,
      bandTilt: elements.offerBandTilt.value,
      topFontSize: String(getOfferFontSize(elements.offerTopFontSize, 36)),
      bandFontSize: String(getOfferFontSize(elements.offerBandFontSize, 42)),
      specialBackgroundWidth: elements.offerBandWidth.value,
      specialBackgroundHeight: elements.offerBandHeight.value,
      specialBackgroundSize: elements.offerBandWidth.value,
      bandWidth: elements.offerBandWidth.value,
      bandHeight: elements.offerBandHeight.value,
      topTextPositionX: state.offerTopTextPositionX,
      topTextPositionY: state.offerTopTextPositionY,
      titleBandPositionX: state.offerTitleBandPositionX,
      titleBandPositionY: state.offerTitleBandPositionY,
      canvasFormat: state.offerCanvasFormat,
      productNameColor: elements.offerProductNameColor.value,
      originalPriceColor: elements.offerOriginalPriceColor.value,
      originalPriceFontSize: String(getOfferFontSize(elements.offerOriginalFontSize, 18)),
      discountPriceColor: elements.offerDiscountPriceColor.value,
      discountPriceFontSize: String(getOfferFontSize(elements.offerDiscountFontSize, 34)),
      priceLabelBackgroundColor: elements.offerPriceLabelBackgroundColor.value,
      priceLabelFontSize: String(getOfferFontSize(elements.offerPriceLabelFontSize, 18)),
      pricesPositionX: state.offerPricesPositionX,
      pricesPositionY: state.offerPricesPositionY,
      originalPricePositionX: state.offerOriginalPricePositionX,
      originalPricePositionY: state.offerOriginalPricePositionY,
      priceLabelWidth: elements.offerPriceLabelWidth.value,
      priceLabelHeight: elements.offerPriceLabelHeight.value,
      discountPricePositionX: state.offerDiscountPricePositionX,
      discountPricePositionY: state.offerDiscountPricePositionY,
      productNameFontSize: String(getOfferFontSize(elements.offerNameFontSize, 27)),
      productNameWidth: elements.offerNameWidth.value,
      productNameHeight: elements.offerNameHeight.value,
      productNamePositionX: state.offerNamePositionX,
      productNamePositionY: state.offerNamePositionY,
      descriptionColor: elements.offerDescriptionColor.value,
      descriptionFontSize: String(getOfferFontSize(elements.offerDescriptionFontSize, 20)),
      descriptionPositionX: state.offerDescriptionPositionX,
      descriptionPositionY: state.offerDescriptionPositionY,
      validUntil: elements.offerValidUntil.value,
      stockMessageEnabled: state.offerStockMessageEnabled,
      imageDataUrl: state.offerImageDataUrl,
      originalImageDataUrl: state.offerOriginalImageDataUrl,
      processedImageDataUrl: state.offerProcessedImageDataUrl,
      imageZoom: state.offerImageZoom,
      imagePositionX: state.offerImagePositionX,
      imagePositionY: state.offerImagePositionY,
      shadowZoom: state.offerShadowZoom,
      shadowHeight: state.offerShadowHeight,
      shadowPositionX: state.offerShadowPositionX,
      shadowPositionY: state.offerShadowPositionY,
      backgroundRemoved: state.offerBackgroundRemoved,
      backgroundRemovalVersion: state.offerBackgroundRemovalVersion,
    };
  }

  function renderSavedOfferArts() {
    elements.savedOfferArtList.innerHTML = "";
    if (!state.savedOfferArts.length) {
      const empty = document.createElement("p");
      empty.className = "saved-offer-art-empty";
      empty.textContent = "Nenhuma arte salva ainda.";
      elements.savedOfferArtList.appendChild(empty);
      return;
    }
    state.savedOfferArts.forEach((art) => {
      const row = document.createElement("div");
      row.className = "saved-offer-art-row";
      row.dataset.artId = art.id;
      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "saved-offer-art-open";
      openButton.dataset.action = "open";
      openButton.textContent = art.name;
      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.className = "saved-offer-art-rename";
      renameButton.dataset.action = "rename";
      renameButton.setAttribute("aria-label", `Alterar nome de ${art.name}`);
      renameButton.textContent = "✎";
      row.append(openButton, renameButton);
      elements.savedOfferArtList.appendChild(row);
    });
  }

  async function refreshSavedOfferArts() {
    try {
      state.savedOfferArts = (await readSavedOfferArts()).sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
      renderSavedOfferArts();
    } catch (error) {
      showToast(error?.message || "Não foi possível carregar as artes salvas.");
    }
  }

  function applySavedOfferArt(art) {
    if (!art) return;
    const legacySpecialParts = String(art.specialText || "Oferta especial").trim().split(/\s+/).filter(Boolean);
    const legacySpecialTop = legacySpecialParts.shift() || "Oferta";
    const legacySpecialBand = legacySpecialParts.join(" ") || "Especial";
    elements.offerSheetForm.reset();
    elements.offerProductName.value = art.productName || "";
    elements.offerOriginalPrice.value = art.originalPrice || "";
    elements.offerDiscountPrice.value = art.discountPrice || "";
    elements.offerDescription.value = art.description || "";
    elements.offerSpecialTopText.value = art.specialTopText ?? legacySpecialTop;
    elements.offerSpecialBandText.value = art.specialBandText ?? legacySpecialBand;
    elements.offerSpecialTextColor.value = art.topTextColor || art.specialTextColor || "#ffffff";
    elements.offerBandTextColor.value = art.bandTextColor || "#a90012";
    elements.offerSpecialBackgroundColor.value = art.specialBackgroundColor || "#ffd42a";
    elements.offerTopTilt.value = art.topTilt ?? art.specialTilt ?? "-7";
    const hasPointSizes = art.fontSizeUnit === "pt";
    elements.offerTopFontSize.value = getSavedOfferFontSize(art.topFontSize, 36, hasPointSizes);
    elements.offerBandTilt.value = art.bandTilt ?? art.specialTilt ?? "-7";
    elements.offerBandFontSize.value = getSavedOfferFontSize(art.bandFontSize || art.specialFontSize, 42, hasPointSizes);
    elements.offerBandWidth.value = art.bandWidth || art.specialBackgroundWidth || art.specialBackgroundSize || "100";
    elements.offerBandHeight.value = art.bandHeight || art.specialBackgroundHeight || "100";
    state.offerTopTextPositionX = Number(art.topTextPositionX) || 0;
    state.offerTopTextPositionY = Number(art.topTextPositionY) || 0;
    state.offerTitleBandPositionX = Number(art.titleBandPositionX) || 0;
    state.offerTitleBandPositionY = Number(art.titleBandPositionY) || 0;
    state.offerCanvasFormat = OFFER_CANVAS_FORMATS[art.canvasFormat] ? art.canvasFormat : "story";
    elements.offerProductNameColor.value = art.productNameColor || "#a31620";
    elements.offerNameFontSize.value = getSavedOfferFontSize(art.productNameFontSize, 27, hasPointSizes);
    elements.offerNameWidth.value = art.productNameWidth || "100";
    elements.offerNameHeight.value = art.productNameHeight || "100";
    state.offerNamePositionX = Number(art.productNamePositionX) || 0;
    state.offerNamePositionY = Number(art.productNamePositionY) || 0;
    elements.offerDescriptionColor.value = art.descriptionColor || "#ffffff";
    elements.offerDescriptionFontSize.value = getSavedOfferFontSize(art.descriptionFontSize, 20, hasPointSizes);
    state.offerDescriptionPositionX = Number(art.descriptionPositionX) || 0;
    state.offerDescriptionPositionY = Number(art.descriptionPositionY) || 0;
    elements.offerOriginalPriceColor.value = art.originalPriceColor || art.pricesColor || "#ffffff";
    elements.offerDiscountPriceColor.value = art.discountPriceColor || art.pricesColor || "#ffd42a";
    elements.offerPriceLabelBackgroundColor.value = art.priceLabelBackgroundColor || "#ffdf35";
    elements.offerPriceLabelFontSize.value = getSavedOfferFontSize(art.priceLabelFontSize, 18, hasPointSizes);
    state.offerPricesPositionX = Number(art.pricesPositionX) || 0;
    state.offerPricesPositionY = Number(art.pricesPositionY) || 0;
    elements.offerOriginalFontSize.value = getSavedOfferFontSize(art.originalPriceFontSize, 18, hasPointSizes);
    state.offerOriginalPricePositionX = Number(art.originalPricePositionX) || 0;
    state.offerOriginalPricePositionY = Number(art.originalPricePositionY) || 0;
    elements.offerDiscountFontSize.value = getSavedOfferFontSize(art.discountPriceFontSize, 34, hasPointSizes);
    elements.offerPriceLabelWidth.value = art.priceLabelWidth || art.discountPriceWidth || "100";
    elements.offerPriceLabelHeight.value = art.priceLabelHeight || art.discountPriceHeight || "100";
    state.offerDiscountPricePositionX = Number(art.discountPricePositionX) || 0;
    state.offerDiscountPricePositionY = Number(art.discountPricePositionY) || 0;
    elements.offerValidUntil.value = art.validUntil || "";
    state.offerStockMessageEnabled = art.stockMessageEnabled !== false;
    const hasCurrentBackgroundRemoval = Boolean(art.backgroundRemoved) && Number(art.backgroundRemovalVersion) === 2;
    state.offerOriginalImageDataUrl = art.originalImageDataUrl || art.imageDataUrl || "";
    state.offerProcessedImageDataUrl = hasCurrentBackgroundRemoval ? art.processedImageDataUrl || art.imageDataUrl || "" : "";
    state.offerImageDataUrl = hasCurrentBackgroundRemoval
      ? state.offerProcessedImageDataUrl
      : state.offerOriginalImageDataUrl;
    state.offerImageZoom = Number(art.imageZoom) || 100;
    state.offerImagePositionX = Number(art.imagePositionX) || 0;
    state.offerImagePositionY = Number(art.imagePositionY) || 0;
    state.offerShadowZoom = Number(art.shadowZoom) || 100;
    state.offerShadowHeight = Number(art.shadowHeight) || 100;
    state.offerShadowPositionX = Number(art.shadowPositionX) || 0;
    state.offerShadowPositionY = Number(art.shadowPositionY) || 0;
    state.offerBackgroundRemoved = hasCurrentBackgroundRemoval;
    state.offerBackgroundProcessing = false;
    state.offerBackgroundRemovalVersion = hasCurrentBackgroundRemoval ? 2 : 0;
    state.activeSavedOfferArtId = art.id;
    elements.offerImageInput.value = "";
    elements.offerDiscountPrice.setCustomValidity("");
    renderOfferSheetPreview();
    closeModal(elements.savedOfferArtsModal);
    showToast(`Arte “${art.name}” aberta.`);
  }

  function openOfferArtNameDialog(mode, artId = "") {
    state.offerArtNameMode = mode;
    state.offerArtRenameId = artId;
    const art = state.savedOfferArts.find((item) => item.id === artId);
    const activeArt = state.savedOfferArts.find((item) => item.id === state.activeSavedOfferArtId);
    elements.offerArtNameTitle.textContent = mode === "rename" ? "Alterar nome" : state.activeSavedOfferArtId ? "Atualizar arte" : "Salvar arte";
    elements.confirmOfferArtName.textContent = mode === "rename" ? "Alterar nome" : "Salvar";
    elements.offerArtName.value = mode === "rename" ? art?.name || "" : activeArt?.name || "";
    openModal(elements.offerArtNameModal);
    setTimeout(() => elements.offerArtName.focus(), 0);
  }

  async function submitOfferArtName() {
    const name = elements.offerArtName.value.trim();
    if (!name) return;
    try {
      if (state.offerArtNameMode === "rename") {
        const art = state.savedOfferArts.find((item) => item.id === state.offerArtRenameId);
        if (!art) throw new Error("Arte não encontrada.");
        await writeSavedOfferArt({ ...art, name, updatedAt: new Date().toISOString() });
        showToast("Nome da arte alterado.");
      } else {
        const existingArt = state.savedOfferArts.find((item) => item.id === state.activeSavedOfferArtId) || null;
        const art = createOfferArtSnapshot(name, existingArt);
        await writeSavedOfferArt(art);
        state.activeSavedOfferArtId = art.id;
        showToast(existingArt ? "Arte atualizada." : "Arte salva no sistema.");
      }
      closeModal(elements.offerArtNameModal);
      await refreshSavedOfferArts();
      renderOfferSheetPreview();
    } catch (error) {
      showToast(error?.message || "Não foi possível salvar a arte.");
    }
  }

  function setOfferImageZoom(value) {
    state.offerImageZoom = Math.min(200, Math.max(50, Number(value) || 100));
    renderOfferSheetPreview();
  }

  function setOfferAdjustmentPanel(panel) {
    const showShadow = panel === "shadow";
    elements.offerImageAdjustments.classList.toggle("hidden", showShadow);
    elements.offerShadowAdjustments.classList.toggle("hidden", !showShadow);
    elements.offerImageTab.classList.toggle("is-active", !showShadow);
    elements.offerShadowTab.classList.toggle("is-active", showShadow);
    elements.offerImageTab.setAttribute("aria-selected", String(!showShadow));
    elements.offerShadowTab.setAttribute("aria-selected", String(showShadow));
  }

  function moveOfferImage(deltaX, deltaY) {
    state.offerImagePositionX = Math.min(80, Math.max(-80, state.offerImagePositionX + deltaX));
    state.offerImagePositionY = Math.min(80, Math.max(-80, state.offerImagePositionY + deltaY));
    renderOfferSheetPreview();
  }

  function resetOfferImagePosition() {
    state.offerImagePositionX = 0;
    state.offerImagePositionY = 0;
    renderOfferSheetPreview();
  }

  function setOfferShadowZoom(value) {
    state.offerShadowZoom = Math.min(220, Math.max(40, Number(value) || 100));
    renderOfferSheetPreview();
  }

  function setOfferShadowHeight(value) {
    state.offerShadowHeight = Math.min(250, Math.max(25, Number(value) || 100));
    renderOfferSheetPreview();
  }

  function moveOfferShadow(deltaX, deltaY) {
    state.offerShadowPositionX = Math.min(100, Math.max(-100, state.offerShadowPositionX + deltaX));
    state.offerShadowPositionY = Math.min(100, Math.max(-100, state.offerShadowPositionY + deltaY));
    renderOfferSheetPreview();
  }

  function resetOfferShadowPosition() {
    state.offerShadowPositionX = 0;
    state.offerShadowPositionY = 0;
    renderOfferSheetPreview();
  }

  function moveOfferTitleBand(deltaX, deltaY) {
    state.offerTitleBandPositionX = Math.min(100, Math.max(-100, state.offerTitleBandPositionX + deltaX));
    state.offerTitleBandPositionY = Math.min(100, Math.max(-100, state.offerTitleBandPositionY + deltaY));
    renderOfferSheetPreview();
  }

  function resetOfferTitleBandPosition() {
    state.offerTitleBandPositionX = 0;
    state.offerTitleBandPositionY = 0;
    renderOfferSheetPreview();
  }

  function moveOfferPrices(deltaX, deltaY) {
    state.offerPricesPositionX = Math.min(100, Math.max(-100, state.offerPricesPositionX + deltaX));
    state.offerPricesPositionY = Math.min(100, Math.max(-100, state.offerPricesPositionY + deltaY));
    renderOfferSheetPreview();
  }

  function resetOfferPricesPosition() {
    state.offerPricesPositionX = 0;
    state.offerPricesPositionY = 0;
    renderOfferSheetPreview();
  }

  function moveOfferElementPosition(xKey, yKey, deltaX, deltaY) {
    state[xKey] = Math.min(100, Math.max(-100, state[xKey] + deltaX));
    state[yKey] = Math.min(100, Math.max(-100, state[yKey] + deltaY));
    renderOfferSheetPreview();
  }

  function resetOfferElementPosition(xKey, yKey) {
    state[xKey] = 0;
    state[yKey] = 0;
    renderOfferSheetPreview();
  }

  function clearOfferImage() {
    state.offerImageDataUrl = "";
    state.offerOriginalImageDataUrl = "";
    state.offerProcessedImageDataUrl = "";
    state.offerImageZoom = 100;
    state.offerImagePositionX = 0;
    state.offerImagePositionY = 0;
    state.offerShadowZoom = 100;
    state.offerShadowHeight = 100;
    state.offerShadowPositionX = 0;
    state.offerShadowPositionY = 0;
    state.offerBackgroundRemoved = false;
    state.offerBackgroundProcessing = false;
    state.offerBackgroundRemovalVersion = 0;
    elements.offerImageInput.value = "";
    renderOfferSheetPreview();
  }

  function loadImageElement(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error("Imagem inválida.")), { once: true });
      image.src = dataUrl;
    });
  }

  async function removeOfferImageBackground(dataUrl) {
    const image = await loadImageElement(dataUrl);
    const maxDimension = 2200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const totalPixels = width * height;
    const visited = new Uint8Array(totalPixels);
    const queue = new Uint32Array(totalPixels);
    const sampleSize = Math.max(2, Math.min(8, Math.round(Math.min(width, height) * 0.012)));
    const cornerOrigins = [
      [0, 0],
      [Math.max(0, width - sampleSize), 0],
      [0, Math.max(0, height - sampleSize)],
      [Math.max(0, width - sampleSize), Math.max(0, height - sampleSize)],
    ];
    const references = cornerOrigins.map(([originX, originY]) => {
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;
      for (let y = originY; y < Math.min(height, originY + sampleSize); y += 1) {
        for (let x = originX; x < Math.min(width, originX + sampleSize); x += 1) {
          const offset = (y * width + x) * 4;
          if (pixels[offset + 3] < 16) continue;
          red += pixels[offset];
          green += pixels[offset + 1];
          blue += pixels[offset + 2];
          count += 1;
        }
      }
      return count ? [red / count, green / count, blue / count] : [255, 255, 255];
    });
    const backgroundReference = [0, 1, 2].map((channel) => {
      const values = references.map((reference) => reference[channel]).sort((left, right) => left - right);
      return (values[1] + values[2]) / 2;
    });
    // Use a conservative border flood-fill: only the background connected to
    // the outside is removed. Tight color and edge limits keep light areas
    // inside packages, labels and capsules intact.
    const solidThreshold = 18;
    const featherSize = 24;
    const outerThreshold = solidThreshold + featherSize;
    const outerThresholdSquared = outerThreshold * outerThreshold;
    const edgeThresholdSquared = 26 * 26;
    const colorDistanceSquared = (pixelIndex) => {
      const offset = pixelIndex * 4;
      if (pixels[offset + 3] < 16) return 0;
      const redDiff = pixels[offset] - backgroundReference[0];
      const greenDiff = pixels[offset + 1] - backgroundReference[1];
      const blueDiff = pixels[offset + 2] - backgroundReference[2];
      return redDiff * redDiff + greenDiff * greenDiff + blueDiff * blueDiff;
    };
    let queueStart = 0;
    let queueEnd = 0;
    const localColorDistanceSquared = (firstIndex, secondIndex) => {
      const firstOffset = firstIndex * 4;
      const secondOffset = secondIndex * 4;
      const redDiff = pixels[firstOffset] - pixels[secondOffset];
      const greenDiff = pixels[firstOffset + 1] - pixels[secondOffset + 1];
      const blueDiff = pixels[firstOffset + 2] - pixels[secondOffset + 2];
      return redDiff * redDiff + greenDiff * greenDiff + blueDiff * blueDiff;
    };
    const enqueue = (pixelIndex, previousIndex = -1) => {
      if (visited[pixelIndex]) return;
      if (colorDistanceSquared(pixelIndex) > outerThresholdSquared) return;
      if (previousIndex >= 0 && localColorDistanceSquared(pixelIndex, previousIndex) > edgeThresholdSquared) return;
      visited[pixelIndex] = 1;
      queue[queueEnd] = pixelIndex;
      queueEnd += 1;
    };
    for (let x = 0; x < width; x += 1) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; y += 1) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }
    while (queueStart < queueEnd) {
      const pixelIndex = queue[queueStart];
      queueStart += 1;
      const offset = pixelIndex * 4;
      const distance = Math.sqrt(colorDistanceSquared(pixelIndex));
      const feather = Math.max(0, Math.min(1, (distance - solidThreshold) / featherSize));
      pixels[offset + 3] = Math.round(pixels[offset + 3] * feather);
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      if (x > 0) enqueue(pixelIndex - 1, pixelIndex);
      if (x + 1 < width) enqueue(pixelIndex + 1, pixelIndex);
      if (y > 0) enqueue(pixelIndex - width, pixelIndex);
      if (y + 1 < height) enqueue(pixelIndex + width, pixelIndex);
    }
    context.putImageData(imageData, 0, 0);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] <= 18) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    if (maxX < minX || maxY < minY) throw new Error("Não foi possível identificar o produto.");
    const productWidth = maxX - minX + 1;
    const productHeight = maxY - minY + 1;
    const margin = Math.max(8, Math.round(Math.max(productWidth, productHeight) * 0.035));
    const cropX = Math.max(0, minX - margin);
    const cropY = Math.max(0, minY - margin);
    const cropWidth = Math.min(width - cropX, productWidth + margin * 2);
    const cropHeight = Math.min(height - cropY, productHeight + margin * 2);
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    croppedCanvas.getContext("2d").drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    return croppedCanvas.toDataURL("image/png");
  }

  async function toggleOfferImageBackground() {
    if (!state.offerOriginalImageDataUrl || state.offerBackgroundProcessing) return;
    if (state.offerBackgroundRemoved) {
      state.offerImageDataUrl = state.offerOriginalImageDataUrl;
      state.offerBackgroundRemoved = false;
      state.offerBackgroundRemovalVersion = 0;
      state.offerImageZoom = 100;
      state.offerImagePositionX = 0;
      state.offerImagePositionY = 0;
      renderOfferSheetPreview();
      return;
    }
    if (state.offerProcessedImageDataUrl && state.offerBackgroundRemovalVersion === 2) {
      state.offerImageDataUrl = state.offerProcessedImageDataUrl;
      state.offerBackgroundRemoved = true;
      state.offerBackgroundRemovalVersion = 2;
      state.offerImageZoom = 100;
      state.offerImagePositionX = 0;
      state.offerImagePositionY = 0;
      renderOfferSheetPreview();
      return;
    }
    state.offerBackgroundProcessing = true;
    renderOfferSheetPreview();
    try {
      state.offerProcessedImageDataUrl = await removeOfferImageBackground(state.offerOriginalImageDataUrl);
      state.offerImageDataUrl = state.offerProcessedImageDataUrl;
      state.offerBackgroundRemoved = true;
      state.offerBackgroundRemovalVersion = 2;
      state.offerImageZoom = 100;
      state.offerImagePositionX = 0;
      state.offerImagePositionY = 0;
    } catch (error) {
      showToast(error?.message || "Não foi possível remover o fundo da imagem.");
    } finally {
      state.offerBackgroundProcessing = false;
      renderOfferSheetPreview();
    }
  }

  function resetOfferSheet() {
    elements.offerSheetForm.reset();
    elements.offerSpecialTopText.value = "Oferta";
    elements.offerSpecialBandText.value = "Especial";
    state.offerTitleBandPositionX = 0;
    state.offerTitleBandPositionY = 0;
    state.offerTopTextPositionX = 0;
    state.offerTopTextPositionY = 0;
    state.offerNamePositionX = 0;
    state.offerNamePositionY = 0;
    state.offerDescriptionPositionX = 0;
    state.offerDescriptionPositionY = 0;
    state.offerPricesPositionX = 0;
    state.offerPricesPositionY = 0;
    state.offerOriginalPricePositionX = 0;
    state.offerOriginalPricePositionY = 0;
    state.offerDiscountPricePositionX = 0;
    state.offerDiscountPricePositionY = 0;
    state.offerCanvasFormat = "story";
    state.offerStockMessageEnabled = true;
    state.activeSavedOfferArtId = "";
    clearOfferImage();
    elements.offerDiscountPrice.setCustomValidity("");
    renderOfferSheetPreview();
  }

  function getPublicOfferLink(offerId) {
    if (offerId && typeof offerId === "object") {
      const offer = offerId;
      const shortId = offer.short_id || offer.shortId;
      if (shortId) {
        return `${PUBLIC_OFFERS_BASE_URL}/${encodeURIComponent(shortId)}`;
      }
      offerId = offer.id || offer.public_id;
    }
    return `${PUBLIC_OFFERS_BASE_URL}/${encodeURIComponent(offerId)}`;
  }

  function createPublicOfferId() {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  function createPublicOfferShortId() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function formatOnlineOfferFileSize(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(".0", "")} MB`;
  }

  function getOnlineOfferDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getOnlineOfferStatus(offer) {
    const expiresAt = getOnlineOfferDate(offer.expires_at || offer.expiresAt);
    if (!offer.active) return { label: "Desativada", className: "is-inactive" };
    if (expiresAt && expiresAt.getTime() <= Date.now()) return { label: "Expirada", className: "is-expired" };
    return { label: "Ativa", className: "" };
  }

  function setOnlineOffersProgress(percent, label) {
    const normalized = Math.max(0, Math.min(100, Math.round(percent)));
    elements.onlineOffersProgress.classList.remove("hidden");
    elements.onlineOffersProgressBar.value = normalized;
    elements.onlineOffersProgressBar.textContent = `${normalized}%`;
    elements.onlineOffersProgressValue.textContent = `${normalized}%`;
    elements.onlineOffersProgressLabel.textContent = label;
  }

  function renderOnlineOffersAvailability() {
    if (!elements.onlineOffersServiceStatus) return;
    const publisher = getSupabasePublisher();
    const authenticated = Boolean(publisher);
    const ready = authenticated && state.onlineBackendReady;
    elements.onlineOffersServiceStatus.classList.toggle("is-ready", ready);
    elements.onlineOffersServiceStatus.classList.toggle("is-blocked", !ready);
    elements.onlineOffersServiceStatus.classList.toggle("is-pending", authenticated && !state.onlineBackendChecked);

    if (!supabaseConfigured) {
      elements.onlineOffersServiceTitle.textContent = "Supabase ainda não configurado";
      elements.onlineOffersServiceMessage.textContent = "Preencha somente SUPABASE_URL e SUPABASE_ANON_KEY em public-offers/supabase-config.js.";
    } else if (ready) {
      elements.onlineOffersServiceTitle.textContent = "Conta publicadora conectada";
      elements.onlineOffersServiceMessage.textContent = `Sessão Supabase ativa para ${publisher.email || "o usuário atual"}. As políticas RLS limitam alterações a este proprietário.`;
    } else if (!authenticated) {
      elements.onlineOffersServiceTitle.textContent = "Conecte uma conta publicadora";
      elements.onlineOffersServiceMessage.textContent = state.supabaseConnectionError || "Use uma conta criada no painel Supabase. O aplicativo não oferece cadastro público.";
    } else if (!state.onlineBackendChecked) {
      elements.onlineOffersServiceTitle.textContent = "Verificando Supabase…";
      elements.onlineOffersServiceMessage.textContent = "Confirmando tabela, bucket e políticas antes de permitir uploads.";
    } else {
      elements.onlineOffersServiceTitle.textContent = "Backend de ofertas indisponível";
      elements.onlineOffersServiceMessage.textContent = state.supabaseConnectionError || "Execute a migração SQL e confira as chaves públicas.";
    }

    elements.supabasePublisherLogin.classList.toggle("hidden", authenticated);
    elements.supabasePublisherDisconnect.classList.toggle("hidden", !authenticated);
    elements.supabasePublisherConnect.disabled = !supabaseConfigured;
    elements.publishOnlineOffer.disabled = !ready || !state.onlineOfferFiles.length || state.onlineOffersPublishing || state.onlineOffersProcessingImages || state.onlineOfferEditLoading;
    elements.publishOnlineOffer.textContent = state.editingOnlineOffer ? "Salvar alterações" : "Publicar e gerar link";
    elements.onlineOfferImages.disabled = state.onlineOffersPublishing || state.onlineOffersProcessingImages || state.onlineOfferEditLoading;
    elements.onlineOffersAddMore.disabled = state.onlineOffersPublishing || state.onlineOffersProcessingImages || state.onlineOfferEditLoading || state.onlineOfferFiles.length >= MAX_ONLINE_OFFER_IMAGES;
    elements.onlineOffersCancelEdit.disabled = state.onlineOffersPublishing || state.onlineOfferEditLoading;
    elements.refreshOnlineOffers.disabled = !authenticated || state.onlineOffersLoading;
  }

  async function checkOnlinePublishingServices() {
    state.onlineBackendChecked = false;
    state.onlineBackendReady = false;
    renderOnlineOffersAvailability();
    const publisher = getSupabasePublisher();
    if (!supabaseClient || !publisher) return false;

    try {
      const { error: tableError } = await supabaseClient
        .from("offers")
        .select("public_id,short_id", { head: true, count: "exact" })
        .limit(1);
      if (tableError) throw tableError;
      const { error: bucketError } = await supabaseClient.storage
        .from(SUPABASE_OFFERS_BUCKET)
        .list(publisher.id, { limit: 1 });
      if (bucketError) throw bucketError;
      state.onlineBackendReady = true;
      state.supabaseConnectionError = "";
    } catch (error) {
      state.onlineBackendReady = false;
      state.supabaseConnectionError = getSupabasePublishingMessage(error);
    } finally {
      state.onlineBackendChecked = true;
      renderOnlineOffersAvailability();
    }
    return state.onlineBackendReady;
  }

  function renderOnlineOfferSelection() {
    const files = state.onlineOfferFiles;
    const isEditing = Boolean(state.editingOnlineOffer);
    elements.onlineOffersFormLabel.textContent = isEditing ? "Editando publicação • link mantido" : "Nova publicação";
    elements.onlineOffersFormTitle.textContent = isEditing ? "Atualize as folhas da oferta" : "Folhas da publicação";
    elements.onlineOffersCancelEdit.classList.toggle("hidden", !isEditing);
    elements.onlineOffersSelectionCount.textContent = files.length
      ? `${files.length} ${files.length === 1 ? "folha" : "folhas"} • 1 link`
      : "0 folhas";
    elements.onlineOffersSelectionEmpty.classList.toggle("hidden", files.length > 0);
    elements.onlineOffersSelection.classList.toggle("hidden", files.length === 0);
    elements.onlineOffersAddMore.classList.toggle("hidden", files.length === 0 || files.length >= MAX_ONLINE_OFFER_IMAGES);
    elements.onlineOffersSelection.innerHTML = files.map((item, index) => `
      <article class="online-offers-thumb" data-online-file-id="${escapeHtml(item.id)}" aria-label="Folha ${index + 1} de ${files.length}">
        <span class="online-offers-thumb-number">Folha ${index + 1}</span>
        <img src="${escapeHtml(item.previewUrl)}" alt="Miniatura da folha ${index + 1}" />
        <div class="online-offers-thumb-meta">
          <strong title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName)}</strong>
          <span>${escapeHtml(item.originalSize !== item.file.size
            ? `${formatOnlineOfferFileSize(item.originalSize)} → ${formatOnlineOfferFileSize(item.file.size)}`
            : formatOnlineOfferFileSize(item.file.size))}</span>
          <label class="online-offers-thumb-position">
            <span>Posição</span>
            <select data-online-file-position aria-label="Posição da folha ${index + 1}">
              ${files.map((_entry, position) => `<option value="${position}" ${position === index ? "selected" : ""}>${position + 1}ª</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="online-offers-thumb-actions">
          <button type="button" data-online-file-action="left" aria-label="Mover folha antes" ${index === 0 ? "disabled" : ""}>← Antes</button>
          <button type="button" data-online-file-action="right" aria-label="Mover folha depois" ${index === files.length - 1 ? "disabled" : ""}>Depois →</button>
          <button class="danger" type="button" data-online-file-action="remove" aria-label="Remover folha">Remover</button>
        </div>
      </article>
    `).join("");
    renderOnlineOffersAvailability();
  }

  function loadImageForOnlineOffer(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.addEventListener("load", () => resolve({ image, objectUrl }), { once: true });
      image.addEventListener("error", () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível processar esta imagem."));
      }, { once: true });
      image.src = objectUrl;
    });
  }

  function canvasToOnlineOfferBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível otimizar esta imagem."));
      }, type, quality);
    });
  }

  async function optimizeOnlineOfferImage(file) {
    if (file.type === "image/gif") {
      if (file.size > MAX_ONLINE_OFFER_GIF_BYTES) {
        throw new Error(`${file.name}: GIFs animados devem ter no máximo 3 MB.`);
      }
      return file;
    }

    const { image, objectUrl } = await loadImageForOnlineOffer(file);
    try {
      let scale = Math.min(1, ONLINE_OFFER_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      let blob = null;
      const qualities = [0.84, 0.76, 0.68, 0.6];
      for (let resizeAttempt = 0; resizeAttempt < 3; resizeAttempt += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d", { alpha: true });
        if (!context) throw new Error("Seu dispositivo não conseguiu preparar a imagem.");
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (const quality of qualities) {
          blob = await canvasToOnlineOfferBlob(canvas, "image/webp", quality);
          if (blob.size <= MAX_ONLINE_OFFER_UPLOAD_BYTES) break;
        }
        if (blob && blob.size <= MAX_ONLINE_OFFER_UPLOAD_BYTES) break;
        scale *= 0.82;
      }
      if (!blob || blob.size > MAX_ONLINE_OFFER_UPLOAD_BYTES) {
        throw new Error(`${file.name}: não foi possível reduzir a imagem para o limite de 4 MB.`);
      }
      const outputName = `${file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "oferta"}.webp`;
      return new File([blob], outputName, { type: "image/webp", lastModified: file.lastModified });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function addOnlineOfferFiles(fileList) {
    const candidates = Array.from(fileList || []);
    let rejectedMessage = "";
    state.onlineOffersProcessingImages = true;
    renderOnlineOffersAvailability();
    try {
      for (let index = 0; index < candidates.length; index += 1) {
        const file = candidates[index];
        if (state.onlineOfferFiles.length >= MAX_ONLINE_OFFER_IMAGES) {
          rejectedMessage = `Selecione no máximo ${MAX_ONLINE_OFFER_IMAGES} imagens.`;
          break;
        }
        if (!ONLINE_OFFER_IMAGE_TYPES.has(file.type)) {
          rejectedMessage = `${file.name}: use JPG, PNG, WEBP ou GIF.`;
          continue;
        }
        if (file.size > MAX_ONLINE_OFFER_SOURCE_BYTES) {
          rejectedMessage = `${file.name}: o arquivo original deve ter no máximo 15 MB.`;
          continue;
        }
        const duplicate = state.onlineOfferFiles.some((item) => (
          item.originalName === file.name && item.originalSize === file.size && item.lastModified === file.lastModified
        ));
        if (duplicate) continue;
        setOnlineOffersProgress((index / Math.max(1, candidates.length)) * 100, `Otimizando imagem ${index + 1} de ${candidates.length}…`);
        try {
          const optimizedFile = await optimizeOnlineOfferImage(file);
          state.onlineOfferFiles.push({
            id: crypto.randomUUID(),
            file: optimizedFile,
            originalName: file.name,
            originalSize: file.size,
            lastModified: file.lastModified,
            previewUrl: URL.createObjectURL(optimizedFile),
          });
        } catch (error) {
          rejectedMessage = getSupabasePublishingMessage(error);
        }
      }
    } finally {
      state.onlineOffersProcessingImages = false;
      elements.onlineOfferImages.value = "";
      renderOnlineOfferSelection();
      window.setTimeout(() => elements.onlineOffersProgress.classList.add("hidden"), 600);
    }
    if (rejectedMessage) showToast(rejectedMessage);
  }

  function moveOnlineOfferFile(itemId, direction) {
    const index = state.onlineOfferFiles.findIndex((item) => item.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.onlineOfferFiles.length) return;
    [state.onlineOfferFiles[index], state.onlineOfferFiles[target]] = [state.onlineOfferFiles[target], state.onlineOfferFiles[index]];
    renderOnlineOfferSelection();
  }

  function moveOnlineOfferFileTo(itemId, targetIndex) {
    const index = state.onlineOfferFiles.findIndex((item) => item.id === itemId);
    const normalizedTarget = Math.max(0, Math.min(state.onlineOfferFiles.length - 1, Number(targetIndex)));
    if (index < 0 || !Number.isInteger(normalizedTarget) || index === normalizedTarget) return;
    const [item] = state.onlineOfferFiles.splice(index, 1);
    state.onlineOfferFiles.splice(normalizedTarget, 0, item);
    renderOnlineOfferSelection();
  }

  function removeOnlineOfferFile(itemId) {
    const item = state.onlineOfferFiles.find((entry) => entry.id === itemId);
    if (item) URL.revokeObjectURL(item.previewUrl);
    state.onlineOfferFiles = state.onlineOfferFiles.filter((entry) => entry.id !== itemId);
    renderOnlineOfferSelection();
  }

  function clearOnlineOfferFiles() {
    state.onlineOfferFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    state.onlineOfferFiles = [];
    renderOnlineOfferSelection();
  }

  function renderPublishedOnlineOffers() {
    if (state.onlineOffersLoading) {
      elements.onlineOffersList.innerHTML = '<div class="online-offers-list-empty">Carregando ofertas publicadas…</div>';
      return;
    }
    if (!getSupabasePublisher()) {
      elements.onlineOffersList.innerHTML = '<div class="online-offers-list-empty">Conecte uma conta publicadora Supabase para acessar suas publicações.</div>';
      return;
    }
    if (!state.publishedOffers.length) {
      elements.onlineOffersList.innerHTML = '<div class="online-offers-list-empty">Nenhuma oferta publicada por este usuário.</div>';
      return;
    }

    elements.onlineOffersList.innerHTML = state.publishedOffers.map((offer) => {
      const status = getOnlineOfferStatus(offer);
      const expiresAt = getOnlineOfferDate(offer.expires_at);
      const createdAt = getOnlineOfferDate(offer.created_at);
      const imageCount = Array.isArray(offer.images) ? offer.images.length : 0;
      const title = offer.title || "Ofertas especiais";
      const link = getPublicOfferLink(offer);
      return `
        <article class="online-offer-card ${status.className ? "is-inactive" : ""}" data-online-offer-id="${escapeHtml(offer.id)}">
          <div class="online-offer-card-head">
            <div>
              <h4>${escapeHtml(title)}</h4>
              <div class="online-offer-card-meta">
                ${imageCount} ${imageCount === 1 ? "imagem" : "imagens"}
                ${createdAt ? ` • criada em ${escapeHtml(new Intl.DateTimeFormat("pt-BR").format(createdAt))}` : ""}
                ${expiresAt ? ` • válida até ${escapeHtml(new Intl.DateTimeFormat("pt-BR").format(expiresAt))}` : ""}
              </div>
            </div>
            <span class="online-offer-status-pill ${status.className}">${escapeHtml(status.label)}</span>
          </div>
          <a class="online-offer-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(link)}">${escapeHtml(link)}</a>
          <div class="online-offer-card-actions">
            <button type="button" data-online-offer-action="edit">Editar oferta</button>
            <button type="button" data-online-offer-action="copy">Copiar link</button>
            <button type="button" data-online-offer-action="whatsapp">Enviar pelo WhatsApp</button>
            ${offer.active ? '<button type="button" data-online-offer-action="deactivate">Desativar</button>' : ""}
            <button class="danger" type="button" data-online-offer-action="delete">Excluir</button>
          </div>
        </article>
      `;
    }).join("");
  }

  async function loadPublishedOnlineOffers() {
    const publisher = getSupabasePublisher();
    if (!supabaseClient || !publisher) {
      state.publishedOffers = [];
      renderPublishedOnlineOffers();
      renderOnlineOffersAvailability();
      return;
    }
    state.onlineOffersLoading = true;
    renderPublishedOnlineOffers();
    renderOnlineOffersAvailability();
    try {
      const { data, error } = await supabaseClient
        .from("offers")
        .select("public_id,short_id,title,images,created_at,expires_at,active,owner_id")
        .eq("owner_id", publisher.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      state.publishedOffers = (data || []).map((offer) => ({
        ...offer,
        id: offer.public_id,
        shortId: offer.short_id,
      }));
      state.supabaseConnectionError = "";
    } catch (error) {
      console.error("Erro ao carregar ofertas online:", error);
      state.publishedOffers = [];
      state.supabaseConnectionError = getSupabasePublishingMessage(error);
    } finally {
      state.onlineOffersLoading = false;
      renderPublishedOnlineOffers();
      renderOnlineOffersAvailability();
    }
  }

  async function editOnlineOffer(offer) {
    if (state.onlineOfferEditLoading || state.onlineOffersPublishing) return;
    if (state.onlineOfferFiles.length && !window.confirm("Descartar a seleção atual e carregar esta oferta para edição?")) return;

    state.onlineOfferEditLoading = true;
    renderOnlineOffersAvailability();
    const previewFiles = [];
    try {
      const images = Array.isArray(offer.images)
        ? offer.images.slice().sort((left, right) => Number(left.order) - Number(right.order))
        : [];
      if (!images.length) throw new Error("Esta oferta não possui imagens para editar.");

      for (const [index, image] of images.entries()) {
        if (!image || typeof image.path !== "string" || !/^[a-f0-9-]{36}\/[a-f0-9]{48}\/[A-Za-z0-9._-]+$/.test(image.path)) {
          throw new Error("Uma das imagens desta oferta possui um caminho inválido.");
        }
        const { data, error } = await supabaseClient.storage.from(SUPABASE_OFFERS_BUCKET).download(image.path);
        if (error) throw error;
        if (!data) throw new Error(`Não foi possível carregar a folha ${index + 1} desta oferta.`);
        const extension = image.path.split(".").pop()?.toLowerCase();
        const mimeType = data.type || ({
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
        })[extension] || "application/octet-stream";
        const file = new File([data], `folha-${index + 1}.${extension || "img"}`, { type: mimeType });
        previewFiles.push({
          id: crypto.randomUUID(),
          file,
          originalName: `Folha ${index + 1}`,
          originalSize: file.size,
          lastModified: 0,
          previewUrl: URL.createObjectURL(file),
          existingPath: image.path,
        });
      }

      clearOnlineOfferFiles();
      state.onlineOfferFiles = previewFiles;
      state.editingOnlineOffer = offer;
      elements.onlineOfferTitle.value = offer.title || "";
      const expiresAt = getOnlineOfferDate(offer.expires_at);
      elements.onlineOfferExpiration.value = expiresAt
        ? `${expiresAt.getFullYear()}-${String(expiresAt.getMonth() + 1).padStart(2, "0")}-${String(expiresAt.getDate()).padStart(2, "0")}`
        : "";
      renderOnlineOfferSelection();
      elements.onlineOffersForm.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      previewFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      console.error("Erro ao carregar oferta para edição:", error);
      showToast(getSupabasePublishingMessage(error));
    } finally {
      state.onlineOfferEditLoading = false;
      renderOnlineOffersAvailability();
    }
  }

  function cancelOnlineOfferEdit() {
    if (state.onlineOffersPublishing || !state.editingOnlineOffer) return;
    state.editingOnlineOffer = null;
    clearOnlineOfferFiles();
    elements.onlineOffersForm.reset();
    renderOnlineOfferSelection();
  }

  async function uploadOnlineOfferImage(publicId, item, index, completedCount) {
    const publisher = getSupabasePublisher();
    if (!supabaseClient || !publisher) throw new Error("A sessão publicadora expirou.");
    const extensionByType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const extension = extensionByType[item.file.type] || "img";
    const randomPart = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
    const path = `${publisher.id}/${publicId}/${String(index + 1).padStart(2, "0")}-${randomPart}.${extension}`;
    setOnlineOffersProgress((completedCount / state.onlineOfferFiles.length) * 92, `Enviando imagem ${index + 1} de ${state.onlineOfferFiles.length}…`);
    const { error } = await supabaseClient.storage.from(SUPABASE_OFFERS_BUCKET).upload(path, item.file, {
      contentType: item.file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    setOnlineOffersProgress(((completedCount + 1) / state.onlineOfferFiles.length) * 92, `Imagem ${index + 1} enviada.`);
    return { path, order: index };
  }

  async function publishOnlineOffer() {
    if (state.onlineOffersPublishing || !state.onlineOfferFiles.length) return false;
    const ready = state.onlineBackendReady || await checkOnlinePublishingServices();
    const publisher = getSupabasePublisher();
    if (!supabaseClient || !publisher || !ready) {
      showToast("A publicação segura ainda não está configurada.");
      return false;
    }

    const title = elements.onlineOfferTitle.value.trim().slice(0, 120);
    const expirationValue = elements.onlineOfferExpiration.value;
    const expiration = expirationValue ? new Date(`${expirationValue}T23:59:59.999`) : null;
    if (expiration && expiration.getTime() <= Date.now()) {
      showToast("Escolha uma data de validade futura.");
      return false;
    }

    const editingOffer = state.editingOnlineOffer;
    const publicId = editingOffer?.id || createPublicOfferId();
    const uploadedImages = [];
    const imagesForOffer = [];
    let offerSaved = false;
    let removedImagesCleanupFailed = false;
    state.onlineOffersPublishing = true;
    elements.onlineOffersProgress.classList.remove("hidden");
    setOnlineOffersProgress(0, "Preparando publicação…");
    renderOnlineOffersAvailability();

    try {
      for (let index = 0; index < state.onlineOfferFiles.length; index += 1) {
        const item = state.onlineOfferFiles[index];
        if (item.existingPath) {
          imagesForOffer.push({ path: item.existingPath, order: index });
        } else {
          const image = await uploadOnlineOfferImage(publicId, item, index, index);
          uploadedImages.push(image);
          imagesForOffer.push(image);
        }
      }
      setOnlineOffersProgress(95, editingOffer ? "Atualizando a oferta sem alterar o link…" : "Salvando link público…");
      if (editingOffer) {
        const { data, error } = await supabaseClient.from("offers")
          .update({
            title,
            images: imagesForOffer,
            expires_at: expiration ? expiration.toISOString() : null,
          })
          .eq("public_id", publicId)
          .eq("owner_id", publisher.id)
          .select("public_id")
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("A oferta não foi atualizada. Confira a conexão e as permissões da conta publicadora.");
        offerSaved = true;

        const retainedPaths = new Set(imagesForOffer.map((image) => image.path));
        const removedPaths = (Array.isArray(editingOffer.images) ? editingOffer.images : [])
          .map((image) => image?.path)
          .filter((path) => typeof path === "string"
            && path.startsWith(`${publisher.id}/${publicId}/`)
            && !retainedPaths.has(path));
        if (removedPaths.length) {
          const { error: cleanupError } = await supabaseClient.storage.from(SUPABASE_OFFERS_BUCKET).remove(removedPaths);
          if (cleanupError) {
            console.error("Oferta atualizada, mas algumas imagens antigas não foram removidas:", cleanupError);
            removedImagesCleanupFailed = true;
          }
        }
      } else {
        const { error } = await supabaseClient.from("offers").insert({
          public_id: publicId,
          short_id: createPublicOfferShortId(),
          title,
          images: imagesForOffer,
          expires_at: expiration ? expiration.toISOString() : null,
          active: true,
          owner_id: publisher.id,
        });
        if (error) throw error;
        offerSaved = true;
      }
      setOnlineOffersProgress(100, editingOffer ? "Oferta atualizada." : "Oferta publicada com sucesso.");
      state.editingOnlineOffer = null;
      clearOnlineOfferFiles();
      elements.onlineOffersForm.reset();
      await loadPublishedOnlineOffers();
      if (editingOffer && removedImagesCleanupFailed) {
        showToast("Oferta atualizada com o mesmo link, mas algumas imagens antigas não foram removidas do armazenamento.");
      } else {
        showToast(editingOffer
          ? "Oferta atualizada. O link continua o mesmo."
          : "Oferta publicada. O link está pronto para compartilhar.");
      }
      return true;
    } catch (error) {
      console.error(editingOffer ? "Erro ao editar oferta online:" : "Erro ao publicar oferta online:", error);
      if (!offerSaved && uploadedImages.length) {
        const { error: cleanupError } = await supabaseClient.storage.from(SUPABASE_OFFERS_BUCKET).remove(uploadedImages.map((image) => image.path));
        if (cleanupError) console.error("Não foi possível remover uploads incompletos:", cleanupError);
      }
      state.supabaseConnectionError = getSupabasePublishingMessage(error);
      showToast(state.supabaseConnectionError);
      return false;
    } finally {
      state.onlineOffersPublishing = false;
      renderOnlineOffersAvailability();
      window.setTimeout(() => elements.onlineOffersProgress.classList.add("hidden"), 1800);
    }
  }

  async function copyPublicOfferLink(offer) {
    await copyChatMessage(getPublicOfferLink(offer));
    showToast("Link da oferta copiado.");
  }

  function sharePublicOfferOnWhatsApp(offer) {
    const link = getPublicOfferLink(offer);
    const title = String(offer.title || "").trim();
    const message = title ? `Confira ${title}: ${link}` : `Confira nossas ofertas: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function deactivateOnlineOffer(offer) {
    try {
      const publisher = getSupabasePublisher();
      const { error } = await supabaseClient.from("offers")
        .update({ active: false })
        .eq("public_id", offer.id)
        .eq("owner_id", publisher?.id || "");
      if (error) throw error;
      await loadPublishedOnlineOffers();
      showToast("Oferta desativada.");
    } catch (error) {
      console.error("Erro ao desativar oferta:", error);
      showToast(getSupabasePublishingMessage(error));
    }
  }

  async function deleteOnlineOffer(offer) {
    const confirmed = window.confirm(`Excluir a oferta “${offer.title || "Ofertas especiais"}” e suas imagens?`);
    if (!confirmed) return;
    const safePaths = (Array.isArray(offer.images) ? offer.images : [])
      .map((image) => image?.path)
      .filter((path) => typeof path === "string" && path.startsWith(`${getSupabasePublisher()?.id}/${offer.id}/`));
    try {
      const publisher = getSupabasePublisher();
      const { error: disableError } = await supabaseClient.from("offers")
        .update({ active: false })
        .eq("public_id", offer.id)
        .eq("owner_id", publisher?.id || "");
      if (disableError) throw disableError;
      if (safePaths.length) {
        const { error: storageError } = await supabaseClient.storage.from(SUPABASE_OFFERS_BUCKET).remove(safePaths);
        if (storageError) throw storageError;
      }
      const { error: deleteError } = await supabaseClient.from("offers")
        .delete()
        .eq("public_id", offer.id)
        .eq("owner_id", publisher?.id || "");
      if (deleteError) throw deleteError;
      await loadPublishedOnlineOffers();
      showToast("Oferta e imagens excluídas.");
    } catch (error) {
      console.error("Erro ao excluir oferta:", error);
      showToast("A oferta foi desativada, mas a exclusão completa precisa ser tentada novamente.");
      await loadPublishedOnlineOffers();
    }
  }

  async function openOnlineOffersModal() {
    setActiveNav("online-offers");
    const today = new Date();
    const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    elements.onlineOfferExpiration.min = minimumDate;
    renderOnlineOfferSelection();
    renderPublishedOnlineOffers();
    renderOnlineOffersAvailability();
    openModal(elements.onlineOffersModal);
    await checkOnlinePublishingServices();
    await loadPublishedOnlineOffers();
  }

  function openOfferSheetModal() {
    setActiveNav("offer-sheet");
    renderOfferSheetPreview();
    openModal(elements.offerSheetModal);
    setTimeout(() => elements.offerProductName.focus(), 0);
  }

  function loadOfferImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.offerOriginalImageDataUrl = String(reader.result || "");
      state.offerImageDataUrl = state.offerOriginalImageDataUrl;
      state.offerProcessedImageDataUrl = "";
      state.offerImageZoom = 100;
      state.offerImagePositionX = 0;
      state.offerImagePositionY = 0;
      state.offerShadowZoom = 100;
      state.offerShadowHeight = 100;
      state.offerShadowPositionX = 0;
      state.offerShadowPositionY = 0;
      state.offerBackgroundRemoved = false;
      state.offerBackgroundProcessing = false;
      state.offerBackgroundRemovalVersion = 0;
      renderOfferSheetPreview();
    });
    reader.addEventListener("error", () => showToast("Não foi possível carregar a imagem."));
    reader.readAsDataURL(file);
  }

  function validateOfferPrices() {
    const originalPrice = parseNumberValue(elements.offerOriginalPrice.value);
    const discountPrice = parseNumberValue(elements.offerDiscountPrice.value);
    let message = "";
    if (originalPrice === null || originalPrice <= 0 || discountPrice === null || discountPrice <= 0) {
      message = "Informe valores maiores que zero.";
    } else if (discountPrice >= originalPrice) {
      message = "O valor com desconto deve ser menor que o valor original.";
    }
    elements.offerDiscountPrice.setCustomValidity(message);
    return !message;
  }

  function openOfferSheetPrintWindowLegacy() {
    const originalPrice = parseNumberValue(elements.offerOriginalPrice.value);
    const discountPrice = parseNumberValue(elements.offerDiscountPrice.value);
    const name = elements.offerProductName.value.trim();
    const description = elements.offerDescription.value.trim();
    const specialText = elements.offerSpecialText.value.trim();
    const specialFontSize = (Number(elements.offerBandFontSize.value) || 100) / 100;
    const specialBackgroundSize = (Number(elements.offerBandWidth.value) || 100) / 100;
    const footerText = getOfferFooterText();
    const offerStyle = [
      `--badge-text-color:${elements.offerSpecialTextColor.value}`,
      `--badge-background:${elements.offerSpecialBackgroundColor.value}`,
      `--badge-font-size:${6.2 * specialFontSize}mm`,
      `--badge-padding-y:${4.5 * specialBackgroundSize}mm`,
      `--badge-padding-x:${9 * specialBackgroundSize}mm`,
      `--badge-size-factor:${specialBackgroundSize}`,
      `--product-name-color:${elements.offerProductNameColor.value}`,
      `--original-price-color:${elements.offerOriginalPriceColor.value}`,
      `--discount-price-color:${elements.offerDiscountPriceColor.value}`,
    ].join(";");
    const imageScale = state.offerImageZoom / 100;
    const imageX = state.offerImagePositionX * 0.18;
    const imageY = state.offerImagePositionY * 0.18;
    const shadowScale = state.offerShadowZoom / 100;
    const shadowHeightScale = state.offerShadowHeight / 100;
    const shadowX = state.offerShadowPositionX * 0.18;
    const shadowY = state.offerShadowPositionY * 0.18;
    const imageMarkup = state.offerImageDataUrl
      ? `<div class="visual${state.offerBackgroundRemoved ? " cutout" : ""}" style="--product-x:${imageX}mm;--product-y:${imageY}mm;--product-scale:${imageScale};--shadow-x:${shadowX}mm;--shadow-y:${shadowY}mm;--shadow-scale:${shadowScale};--shadow-height-scale:${shadowHeightScale}"><img class="product-image" src="${state.offerImageDataUrl}" alt="Imagem do produto" /><div class="product-shadow" aria-hidden="true"></div></div>`
      : "";
    const descriptionMarkup = description
      ? `<p class="description">${escapeHtml(description).replaceAll("\n", "<br />")}</p>`
      : "";
    const contentClass = state.offerImageDataUrl ? "content has-image" : "content";
    const specialParts = specialText.split(/\s+/).filter(Boolean);
    const specialLead = specialParts.shift() || "";
    const specialBand = specialParts.join(" ");
    const badgeMarkup = specialText
      ? `<div class="badge"><span class="badge-lead">${escapeHtml(specialLead)}</span>${specialBand ? `<span class="badge-band">${escapeHtml(specialBand)}</span>` : ""}</div>`
      : "";
    const designMarkup = `<div class="design" aria-hidden="true"><div class="design-central"></div><div class="design-wave left"></div><div class="design-wave right"></div><div class="design-detail left"></div><div class="design-detail left lower"></div><div class="design-detail right"></div><div class="design-detail right lower"></div></div>`;
    const footerMarkup = footerText ? `<footer class="footer">${escapeHtml(footerText)}</footer>` : "";
    const printWindow = window.open("", "_blank", "width=980,height=1280");
    if (!printWindow) {
      showToast("Permita pop-ups para imprimir a folha de oferta.");
      return;
    }

    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Oferta - ${escapeHtml(name)}</title><style>
      *{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#321a1e}body{display:grid;place-items:center;padding:8mm}.offer{position:relative;width:194mm;min-height:281mm;overflow:hidden;border:1.2mm solid #d92531;border-radius:9mm;background:linear-gradient(155deg,#fff 0%,#fff7f7 58%,#fff 100%);display:grid;grid-template-rows:auto 1fr auto}.offer:before{content:"";position:absolute;right:-42mm;top:-55mm;width:126mm;height:126mm;border-radius:50%;background:#ffe4e6;z-index:0}.offer:after{content:"";position:absolute;left:-42mm;bottom:-58mm;width:105mm;height:105mm;border-radius:50%;border:12mm solid #fff0f1;z-index:0}.header{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;min-height:31mm;padding:9mm 14mm 6mm;border-top:4mm solid #d92531;text-align:center}.badge{display:inline-flex;align-items:center;justify-content:center;max-width:160mm;padding:4.5mm 9mm;border-radius:999px;color:#fff;background:linear-gradient(135deg,#ef3d47,#bd1722);box-shadow:0 2mm 6mm rgba(174,23,33,.2);font-size:6.2mm;font-weight:900;letter-spacing:.08em;text-align:center;text-transform:uppercase;overflow-wrap:anywhere}.content{position:relative;z-index:1;display:grid;place-items:center;align-content:center;padding:8mm 18mm 18mm}.content.has-image{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12mm;padding-left:14mm;padding-right:14mm}.visual{position:relative;display:grid;place-items:center;width:100%;min-height:148mm;padding:8mm;overflow:hidden;border:1px solid #f3d6d8;border-radius:7mm;background:#fff;box-shadow:0 5mm 18mm rgba(145,29,38,.1)}.visual.cutout{padding:0;border:0;background:transparent;box-shadow:none}.product-shadow{position:absolute;z-index:1;left:calc(50% + var(--shadow-x));bottom:calc(8mm - var(--shadow-y));width:48%;height:7mm;border-radius:50%;background:radial-gradient(ellipse,rgba(55,16,20,.38) 0%,rgba(72,24,28,.2) 45%,transparent 75%);filter:blur(2mm);transform:translateX(-50%) scaleX(var(--shadow-scale))}.product-image{position:relative;z-index:2;display:block;width:100%;height:132mm;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 3mm 2.5mm rgba(54,20,22,.24));transform:translate(var(--product-x),var(--product-y)) scale(var(--product-scale));transform-origin:center bottom}.copy{width:100%;max-width:132mm;min-width:0;text-align:center}.has-image .copy{max-width:none}.copy h1{margin:0;color:#a31620;font-size:16mm;line-height:1.02;letter-spacing:-.045em;overflow-wrap:anywhere}.description{margin:7mm auto 0;max-width:115mm;color:#5f484c;font-size:5mm;line-height:1.5;overflow-wrap:anywhere}.prices{margin-top:10mm}.from{display:block;color:#78666a;font-size:5.2mm}.from s{font-weight:800}.to{display:inline-block;min-width:76mm;margin-top:4mm;padding:5mm 8mm 6mm;border:1px solid #f1c5c8;border-radius:6mm;background:#fff;box-shadow:0 3mm 10mm rgba(166,24,35,.1)}.to small{display:block;color:#c51f2a;font-size:4.7mm;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.to strong{display:block;margin-top:1.5mm;color:#df2632;font-size:19mm;line-height:1;letter-spacing:-.055em;white-space:nowrap}.footer{position:relative;z-index:1;padding:5mm 14mm;color:#fff;background:linear-gradient(90deg,#8f111b,#d92531);font-size:4.2mm;font-weight:700;text-align:center}@page{size:A4 portrait;margin:0}@media print{html,body{width:210mm;height:297mm}body{padding:8mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}.offer{break-inside:avoid}}
      .product-image{filter:none}.product-shadow{transform:translateX(-50%) scaleX(var(--shadow-scale)) scaleY(var(--shadow-height-scale))}.badge{color:var(--badge-text-color);background:var(--badge-background);font-size:var(--badge-font-size);padding:var(--badge-padding-y) var(--badge-padding-x);text-shadow:0 .5mm 0 rgba(82,8,18,.78),0 1mm 0 rgba(65,5,13,.6),0 1.8mm 2.4mm rgba(49,4,10,.38)}.copy h1{color:var(--product-name-color)}.from{color:var(--original-price-color)}.to small,.to strong{color:var(--discount-price-color)}
      .offer{grid-template-rows:62mm minmax(0,1fr) auto;border:1mm solid #a90014;border-radius:7mm;background:radial-gradient(circle at 50% -8%,rgba(255,78,84,.58),transparent 36%),linear-gradient(152deg,#df0018 0%,#b50016 52%,#850010 100%);box-shadow:inset 0 2mm 0 rgba(255,77,83,.62)}
      .offer:before{right:auto;left:-42mm;top:67mm;width:278mm;height:126mm;border:0;border-top:3mm solid #ffd42a;border-radius:50%;background:linear-gradient(180deg,#fffdf7,#fff7e7);box-shadow:0 -5mm 0 rgba(255,29,43,.72),0 -9mm 0 rgba(122,0,16,.4);transform:rotate(-1.5deg)}
      .offer:after{left:-34mm;bottom:35mm;width:262mm;height:86mm;border:0;border-top:2.5mm solid #ffd42a;border-radius:50%;background:linear-gradient(180deg,#fffdf7,#fff6e2);box-shadow:0 -5mm 0 #d9001c,0 -9mm 0 rgba(108,0,14,.5);transform:rotate(1deg)}
      .header{z-index:3;min-height:0;padding:10mm 16mm 2mm;border-top:0}
      .header:before,.header:after{content:"";position:absolute;top:28mm;width:23mm;height:7mm;background:#ffd42a;clip-path:polygon(0 42%,100% 0,100% 100%)}.header:before{left:8mm}.header:after{right:8mm;transform:scaleX(-1)}
      .badge{position:relative;z-index:1;display:grid;justify-items:center;width:150mm;max-width:78%;padding:0;color:inherit;background:transparent;border-radius:0;box-shadow:none;text-transform:uppercase}
      .badge-lead{max-width:100%;color:var(--badge-text-color);font-family:"Arial Black",Impact,sans-serif;font-size:calc(var(--badge-font-size)*2.55);font-weight:1000;line-height:.84;letter-spacing:-.055em;overflow-wrap:anywhere;text-shadow:0 .8mm 0 rgba(105,0,14,.68),0 2mm 3mm rgba(70,0,9,.4)}
      .badge-band{display:block;width:100%;margin-top:2.5mm;padding:var(--badge-padding-y) var(--badge-padding-x);border-radius:5mm;color:#a90014;background:var(--badge-background);font-family:"Arial Black",Impact,sans-serif;font-size:calc(var(--badge-font-size)*1.45);font-weight:1000;line-height:.92;letter-spacing:-.035em;overflow-wrap:anywhere;box-shadow:inset 0 -1.5mm 2.5mm rgba(192,125,0,.2),0 2mm 3mm rgba(78,0,10,.28);text-shadow:none}
      .content{z-index:2;display:grid;align-content:stretch;padding:0 12mm 9mm}.content.has-image{grid-template-columns:1fr;grid-template-rows:minmax(0,112mm) minmax(0,1fr);gap:0;padding:0 12mm 9mm}
      .visual,.visual.cutout{align-self:stretch;width:100%;min-height:0;padding:0 23mm;overflow:visible;border:0;border-radius:0;background:transparent;box-shadow:none}.product-image{height:108mm;object-position:center bottom;transform-origin:center bottom}.product-shadow{bottom:4mm;width:40%;height:5mm}
      .copy{position:relative;z-index:3;display:flex;flex-direction:column;justify-content:flex-start;width:100%;max-width:none;min-height:0;text-align:center}.copy h1{margin:0;color:var(--product-name-color);font-family:"Arial Black",Impact,sans-serif;font-size:10mm;font-weight:1000;line-height:.95;text-transform:uppercase;text-shadow:0 .5mm 0 rgba(255,255,255,.8)}.description{margin:2mm auto 0;max-width:150mm;color:#76101a;font-size:4.5mm;font-weight:650;line-height:1.25}
      .prices{position:relative;display:grid;grid-template-columns:minmax(0,.55fr) minmax(0,1.45fr);align-items:end;gap:4mm;width:100%;min-height:38mm;margin-top:auto;padding:10mm 6mm 4mm;border:1.2mm solid #ffd42a;border-radius:10mm;background:linear-gradient(135deg,#c9001a,#890011);box-shadow:0 3mm 7mm rgba(75,0,10,.28),inset 0 1mm 3mm rgba(255,75,82,.22)}
      .from{align-self:center;display:block;color:var(--original-price-color);font-size:5.6mm;line-height:1.1;white-space:nowrap}.to{display:block;min-width:0;margin:0;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none}.to small{position:absolute;top:-5mm;left:50%;width:66%;margin:0;padding:2.2mm 4mm;border-radius:999px;color:#a80014;background:#ffd42a;font-size:4.5mm;line-height:1;transform:translateX(-50%)}.to strong{margin:0;color:var(--discount-price-color);font-family:"Arial Black",Impact,sans-serif;font-size:18mm;line-height:.88;letter-spacing:-.07em;text-shadow:0 1.2mm 0 rgba(105,0,13,.45),0 2.5mm 3.5mm rgba(60,0,8,.3)}
      .footer{z-index:4;padding:4mm 12mm;border-top:1mm solid #ffd42a;background:linear-gradient(90deg,#78000e,#c9001a,#78000e)}
      @media print{.offer{width:194mm;min-height:281mm}}
      .offer{display:block;isolation:isolate;border:0;border-radius:5mm;background:#c9000b;box-shadow:none}
      .offer:before,.offer:after{content:"";position:absolute;z-index:0;left:-20%;width:140%;height:45%;border:0;border-radius:50%;background:#e50817;box-shadow:none}.offer:before{top:-28%;transform:rotate(-14deg)}.offer:after{top:auto;bottom:-32%;transform:rotate(-12deg)}
      .design{position:absolute;z-index:1;inset:0;pointer-events:none}.design-central{position:absolute;top:22%;left:-17%;width:134%;height:60%;border:2.3mm solid #ffdf39;border-radius:50%;background:#fff9ed}.design-wave{position:absolute;z-index:1;top:49%;width:65%;height:12%;border-bottom:2.6mm solid #ffdf39;background:#e30717}.design-wave.left{left:-26%;border-radius:0 90% 35% 0;transform:rotate(17deg)}.design-wave.right{right:-26%;border-radius:90% 0 0 35%;transform:rotate(-17deg)}
      .design-detail{position:absolute;z-index:2;top:6%;width:9%;height:3%;border-radius:1.6mm;background:#ffdf39;clip-path:polygon(0 0,100% 85%,0 100%)}.design-detail.left{left:6%;transform:rotate(25deg)}.design-detail.right{right:6%;transform:scaleX(-1) rotate(25deg)}.design-detail.lower{top:11.8%}.design-detail.left.lower{transform:rotate(-12deg)}.design-detail.right.lower{transform:scaleX(-1) rotate(-12deg)}
      .header{position:absolute;z-index:4;inset:0;width:100%;height:100%;min-height:0;padding:0;pointer-events:none}.header:before,.header:after{display:none}.badge{position:static;display:block;width:100%;max-width:none;padding:0;background:transparent;box-shadow:none}.badge-lead{position:absolute;top:3%;left:14%;display:block;width:72%;max-width:72%;padding:0;font-size:calc(var(--badge-font-size)*2.7);line-height:1;text-align:center}.badge-band{position:absolute;top:12.5%;left:14%;display:grid;place-items:center;width:72%;height:9.5%;margin:0;padding:0 4%;border-radius:7mm;font-size:calc(var(--badge-font-size)*1.45);transform:scale(var(--badge-size-factor));transform-origin:center}
      .content,.content.has-image{position:static;display:block;padding:0}.visual,.visual.cutout{position:absolute;z-index:3;top:22%;left:14%;width:72%;height:43%;min-height:0;margin:0;padding:0;overflow:visible}.product-image{width:100%;height:100%}.product-shadow{bottom:5%;width:42%;height:5%}
      .copy{position:static;display:block}.copy h1{position:absolute;z-index:4;top:64%;left:8%;width:84%;margin:0;font-size:10mm;text-align:center}.description{position:absolute;z-index:4;top:70%;left:12%;width:76%;max-width:none;margin:0;text-align:center}
      .prices{position:absolute;z-index:5;left:5%;bottom:5.5%;width:90%;height:15.5%;min-height:0;margin:0;padding:8.5mm 7mm 4mm;border:1mm solid #ffdf39;border-radius:10mm;background:#bf000b}.to small{top:0;width:48%;height:30%;padding:0 4mm;display:grid;place-items:center;background:#ffdf39;transform:translate(-50%,-35%)}.to strong{font-size:18mm}
      .footer{position:absolute;z-index:6;right:0;bottom:0;left:0;padding:2.4mm 10mm;border:0;background:rgba(120,0,9,.72)}
    </style></head><body><article class="offer" style="${offerStyle}">${designMarkup}<header class="header">${badgeMarkup}</header><div class="${contentClass}">${imageMarkup}<div class="copy"><h1>${escapeHtml(name)}</h1>${descriptionMarkup}<div class="prices"><span class="from">De <s>${escapeHtml(formatCurrency(originalPrice))}</s></span><div class="to"><small>Por apenas</small><strong>${escapeHtml(formatCurrency(discountPrice))}</strong></div></div></div></div>${footerMarkup}</article>${getPrintStartupScript()}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
  }

  async function openOfferSheetPrintWindow(action = "print") {
    const originalPrice = parseNumberValue(elements.offerOriginalPrice.value);
    const discountPrice = parseNumberValue(elements.offerDiscountPrice.value);
    const name = elements.offerProductName.value.trim();
    const description = elements.offerDescription.value.trim();
    const specialTopText = elements.offerSpecialTopText.value.trim();
    const specialBandText = elements.offerSpecialBandText.value.trim();
    const topFontSize = getOfferFontSize(elements.offerTopFontSize, 36);
    const bandFontSize = getOfferFontSize(elements.offerBandFontSize, 42);
    const bandWidth = (Number(elements.offerBandWidth.value) || 100) / 100;
    const bandHeight = (Number(elements.offerBandHeight.value) || 100) / 100;
    const priceLabelWidth = (Number(elements.offerPriceLabelWidth.value) || 100) / 100;
    const priceLabelHeight = (Number(elements.offerPriceLabelHeight.value) || 100) / 100;
    const priceLabelFontSize = getOfferFontSize(elements.offerPriceLabelFontSize, 18);
    const nameFontSize = getOfferFontSize(elements.offerNameFontSize, 27);
    const descriptionFontSize = getOfferFontSize(elements.offerDescriptionFontSize, 20);
    const originalPriceFontSize = getOfferFontSize(elements.offerOriginalFontSize, 18);
    const discountPriceFontSize = getOfferFontSize(elements.offerDiscountFontSize, 34);
    const titleBandX = state.offerTitleBandPositionX / 10.8;
    const titleBandY = state.offerTitleBandPositionY / 10.8;
    const topX = state.offerTopTextPositionX / 10.8;
    const topY = state.offerTopTextPositionY / 10.8;
    const originalPriceX = state.offerOriginalPricePositionX / 10.8;
    const originalPriceY = state.offerOriginalPricePositionY / 10.8;
    const discountPriceX = state.offerDiscountPricePositionX / 10.8;
    const discountPriceY = state.offerDiscountPricePositionY / 10.8;
    const topTilt = Number(elements.offerTopTilt.value);
    const bandTilt = Number(elements.offerBandTilt.value);
    const pricesX = state.offerPricesPositionX / 10.8;
    const pricesY = state.offerPricesPositionY / 10.8;
    const canvasFormat = OFFER_CANVAS_FORMATS[state.offerCanvasFormat] || OFFER_CANVAS_FORMATS.story;
    const canvasRatio = canvasFormat.width / canvasFormat.height;
    const backgroundFormat = state.offerCanvasFormat === "square" ? "square" : "story";
    const paperMaxWidthMm = canvasRatio > 1 ? 297 : 210;
    const paperMaxHeightMm = canvasRatio > 1 ? 210 : 297;
    const maxPrintWidthMm = paperMaxWidthMm - 7;
    const maxPrintHeightMm = paperMaxHeightMm - 10;
    const printWidthMm = Math.min(maxPrintWidthMm, maxPrintHeightMm * canvasRatio);
    const printHeightMm = printWidthMm / canvasRatio;
    const footerText = getOfferFooterText();
    const imageX = state.offerImagePositionX / 10.8;
    const imageY = state.offerImagePositionY / 10.8;
    const shadowX = state.offerShadowPositionX / 10.8;
    const shadowY = state.offerShadowPositionY / 10.8;
    const hasOriginal = originalPrice !== null;
    const hasDiscount = discountPrice !== null;
    const posterStyle = [
      `--offer-badge-text-color:${elements.offerSpecialTextColor.value}`,
      `--offer-badge-background:${elements.offerSpecialBackgroundColor.value}`,
      `--offer-top-text-color:${elements.offerSpecialTextColor.value}`,
      `--offer-top-tilt:${topTilt}deg`,
      `--offer-top-font-size:${getOfferFontCssSize(topFontSize)}`,
      `--offer-top-x:${topX}cqw`,
      `--offer-top-y:${topY}cqw`,
      `--offer-band-text-color:${elements.offerBandTextColor.value}`,
      `--offer-band-tilt:${bandTilt}deg`,
      `--offer-band-font-size:${getOfferFontCssSize(bandFontSize)}`,
      `--offer-price-label-background:${elements.offerPriceLabelBackgroundColor.value}`,
      `--offer-prices-x:${pricesX}cqw`,
      `--offer-prices-y:${pricesY}cqw`,
      `--offer-title-band-width-scale:${bandWidth}`,
      `--offer-title-band-height-scale:${bandHeight}`,
      `--offer-title-band-width:${72.2 * bandWidth}%`,
      `--offer-title-band-height:${9.55 * bandHeight}%`,
      `--offer-title-band-x:${titleBandX}cqw`,
      `--offer-title-band-y:${titleBandY}cqw`,
      `--offer-original-x:${originalPriceX}cqw`,
      `--offer-original-y:${originalPriceY}cqw`,
      `--offer-original-price-font-size:${getOfferFontCssSize(originalPriceFontSize)}`,
      `--offer-discount-x:${discountPriceX}cqw`,
      `--offer-discount-y:${discountPriceY}cqw`,
      `--offer-discount-price-font-size:${getOfferFontCssSize(discountPriceFontSize)}`,
      `--offer-price-label-width-scale:${priceLabelWidth}`,
      `--offer-price-label-height-scale:${priceLabelHeight}`,
      `--offer-price-label-font-size:${getOfferFontCssSize(priceLabelFontSize)}`,
      `--offer-canvas-ratio:${canvasFormat.width} / ${canvasFormat.height}`,
      `--offer-product-name-color:${elements.offerProductNameColor.value}`,
      `--offer-name-font-size:${getOfferFontCssSize(nameFontSize)}`,
      `--offer-name-width-scale:${(Number(elements.offerNameWidth.value) || 100) / 100}`,
      `--offer-name-height-scale:${(Number(elements.offerNameHeight.value) || 100) / 100}`,
      `--offer-name-x:${state.offerNamePositionX / 10.8}cqw`,
      `--offer-name-y:${state.offerNamePositionY / 10.8}cqw`,
      `--offer-description-color:${elements.offerDescriptionColor.value}`,
      `--offer-description-font-size:${getOfferFontCssSize(descriptionFontSize)}`,
      `--offer-description-x:${state.offerDescriptionPositionX / 10.8}cqw`,
      `--offer-description-y:${state.offerDescriptionPositionY / 10.8}cqw`,
      `--offer-original-price-color:${elements.offerOriginalPriceColor.value}`,
      `--offer-discount-price-color:${elements.offerDiscountPriceColor.value}`,
    ].join(";");
    const backgroundMarkup = elements.offerTemplateBackground?.outerHTML || "";
    const badgeMarkup = `<div><span class="offer-special-lead${specialTopText ? "" : " hidden"}">${escapeHtml(specialTopText)}</span><span class="offer-special-band${specialBandText ? "" : " hidden"}">${escapeHtml(specialBandText)}</span></div>`;
    const imageMarkup = state.offerImageDataUrl
      ? `<div class="offer-poster-image" style="--product-x:${imageX}cqw;--product-y:${imageY}cqw;--product-scale:${state.offerImageZoom / 100};--shadow-x:${shadowX}cqw;--shadow-y:${shadowY}cqw;--shadow-scale:${state.offerShadowZoom / 100};--shadow-height-scale:${state.offerShadowHeight / 100}"><img src="${state.offerImageDataUrl}" alt="Imagem do produto" /><div class="offer-product-shadow" aria-hidden="true"></div></div>`
      : "";
    const nameMarkup = name ? `<h4>${escapeHtml(name)}</h4>` : "";
    const descriptionMarkup = description
      ? `<p class="offer-preview-description">${escapeHtml(description).replaceAll("\n", "<br />")}</p>`
      : "";
    const originalMarkup = hasOriginal
      ? `<span>De <s>${escapeHtml(formatCurrency(originalPrice))}</s></span>`
      : "";
    const discountMarkup = hasDiscount
      ? `<div><small>Por apenas</small><strong>${escapeHtml(formatCurrency(discountPrice))}</strong></div>`
      : "";
    const priceMarkup = hasOriginal || hasDiscount
      ? `<div class="offer-preview-prices${hasOriginal ? " has-original" : ""}${hasDiscount ? " has-discount" : ""}">${originalMarkup}${discountMarkup}</div>`
      : "";
    const footerMarkup = footerText ? `<footer>${escapeHtml(footerText)}</footer>` : "";
    const templateStylesheetUrl = new URL("offer-template.css?v=22", window.location.href).href;
    const printHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Oferta - ${escapeHtml(name)}</title><link rel="stylesheet" href="${templateStylesheetUrl}"><style>
      *{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#fff}body{display:grid;place-items:center;padding:0}.offer-art-template.offer-poster{width:min(100vw,80vh,1080px);height:auto;max-width:none;margin:0;box-shadow:none}@page{size:${printWidthMm}mm ${printHeightMm}mm;margin:0}@media print{html,body{width:${printWidthMm}mm;height:${printHeightMm}mm;min-height:0;margin:0;padding:0;overflow:hidden}body{display:block;-webkit-print-color-adjust:exact;print-color-adjust:exact}.offer-art-template.offer-poster{width:${printWidthMm}mm;height:${printHeightMm}mm;max-width:none;margin:0;break-inside:avoid}}
    </style></head><body><article class="offer-poster offer-art-template is-story-layout${state.offerImageDataUrl ? " has-image" : ""}${state.offerBackgroundRemoved ? " is-background-removed" : ""}" style="${posterStyle}"><div class="offer-art-canvas">${backgroundMarkup}<header class="offer-poster-header">${badgeMarkup}</header>${imageMarkup}<div class="offer-poster-content">${nameMarkup}${descriptionMarkup}${priceMarkup}</div></div>${footerMarkup}</article>${window.desktopOfferPrinting ? "" : getPrintStartupScript()}</body></html>`;
    if (window.desktopOfferPrinting) {
      try {
        if (action === "pdf") {
          const result = await window.desktopOfferPrinting.savePdf(printHtml, printWidthMm, printHeightMm);
          if (!result.canceled) showToast("PDF salvo sem bordas brancas.");
        } else {
          await window.desktopOfferPrinting.print(printHtml, printWidthMm, printHeightMm);
          showToast("Impressão enviada sem margens.");
        }
      } catch (error) {
        showToast(error?.message || "Não foi possível gerar a folha de oferta.");
      }
      return;
    }
    if (action === "pdf") {
      showToast("O salvamento de PDF sem bordas está disponível no aplicativo instalado.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=980,height=1280");
    if (!printWindow) {
      showToast("Permita pop-ups para imprimir a folha de oferta.");
      return;
    }
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
  }

  function openPricingEditor(productId) {
    const product = state.pricingProducts.find((item) => item.id === productId);
    if (!product) {
      showToast("Produto não encontrado.");
      return;
    }

    state.editingPricingProductId = product.id;
    state.pricingFormSource = "salePrice";
    elements.pricingProductName.value = product.name || "";
    elements.pricingProductSku.value = product.sku || "";
    elements.pricingProductCost.value = product.productCost !== undefined ? formatDecimalInput(Number(product.productCost)) : "";
    elements.pricingSalePrice.value = product.salePrice !== undefined ? formatDecimalInput(Number(product.salePrice)) : "";
    elements.pricingTargetProfit.value = product.targetProfitPercent !== undefined && product.targetProfitPercent !== null
      ? formatDecimalInput(Number(product.targetProfitPercent))
      : "";
    elements.pricingCardMethod.value = product.cardMethod || "none";
    renderPricingProductResults();
  }

  function openPricingModal() {
    setActiveNav("pricing");
    resetPricingProductForm();
    renderPricingAccess();
    renderPricingTabs();
    renderPricingSettingsForm();
    renderPricingProductsList();
    renderPricingProductResults();
    openModal(elements.pricingModal);
    setTimeout(() => {
      if (isAdminUser()) {
        elements.pricingEstimatedRevenue.focus();
        return;
      }
      elements.pricingProductName.focus();
    }, 0);
  }

  function readPricingSettingsForm() {
    return sanitizePricingSettings({
      id: state.activePricingTabId,
      estimatedMonthlyRevenue: elements.pricingEstimatedRevenue.value.trim(),
      taxItems: collectPricingListItems(elements.pricingTaxList),
      fixedCostItems: collectPricingListItems(elements.pricingFixedList),
      cardRates: Object.fromEntries(Array.from(elements.pricingCardRates.querySelectorAll("[data-card-rate]")).map((input) => [input.dataset.cardRate, input.value.trim()])),
      updatedAt: new Date().toISOString(),
    });
  }

  async function savePricingSettings() {
    if (!isAdminUser()) {
      showToast("Acesso restrito ao administrador.");
      return false;
    }

    const settingsRecord = readPricingSettingsForm();
    state.pricingSettings = settingsRecord;
    const activeTab = getActivePricingTab();
    const tabName = elements.pricingTabName.value.trim() || "Precificação sem nome";
    activeTab.name = tabName;

    try {
      await upsertSingletonDocument(FIRESTORE_COLLECTIONS.pricingSettings, state.activePricingTabId, settingsRecord);
      await upsertDocument(FIRESTORE_COLLECTIONS.pricingTabs, activeTab);
      renderPricingTabs();
      renderPricingSettingsForm();
      renderPricingProductResults();
      renderPricingProductsList();
      showToast("Tela de precificação salva.");
      return true;
    } catch (error) {
      console.error("Erro ao salvar parâmetros de precificação:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  async function savePricingProduct() {
    const values = getPricingProductFormValues();
    if (!values.name || values.productCost === null) {
      showToast("Preencha o produto e o preço de custo.");
      return false;
    }

    if (state.pricingFormSource === "targetProfit" && (!values.productCost || values.productCost <= 0)) {
      showToast("Informe um preço de custo maior que zero para calcular o lucro real desejado.");
      return false;
    }

    if (values.salePrice === null && values.targetProfitPercent === null) {
      showToast("Informe o preço de venda ou o lucro real desejado.");
      return false;
    }

    const scenario = renderPricingProductResults();
    const finalSalePrice = state.pricingFormSource === "targetProfit"
      ? scenario.computedSalePrice
      : parseNumberValue(elements.pricingSalePrice.value);

    if (finalSalePrice === null || finalSalePrice <= 0) {
      showToast("Não foi possível definir um preço de venda válido.");
      return false;
    }

    if (scenario.summary.hasFixedCosts && !scenario.summary.canAllocateFixedCosts) {
      showToast("Defina o faturamento mensal estimado para ratear os custos fixos.");
      return false;
    }

    const pricingProduct = {
      id: state.editingPricingProductId || crypto.randomUUID(),
      pricingTabId: state.activePricingTabId,
      name: values.name,
      sku: values.sku,
      productCost: Number(values.productCost.toFixed(2)),
      salePrice: Number(finalSalePrice.toFixed(2)),
      targetProfitPercent: scenario.appliedTargetProfitPercent !== null ? Number(scenario.appliedTargetProfitPercent.toFixed(2)) : null,
      cardMethod: values.cardMethod,
      grossMarkupPercent: scenario.grossMarkupPercent !== null ? Number(scenario.grossMarkupPercent.toFixed(2)) : null,
      createdAt: state.pricingProducts.find((item) => item.id === state.editingPricingProductId)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await upsertDocument(FIRESTORE_COLLECTIONS.pricingProducts, pricingProduct);
      const isEditing = Boolean(state.editingPricingProductId);
      state.pricingProducts = state.editingPricingProductId
        ? state.pricingProducts.map((item) => (item.id === pricingProduct.id ? pricingProduct : item))
        : [pricingProduct, ...state.pricingProducts];
      renderPricingProductsList();
      resetPricingProductForm();
      showToast(isEditing ? "Produto atualizado com sucesso." : "Produto precificado com sucesso.");
      return true;
    } catch (error) {
      console.error("Erro ao salvar produto precificado:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  async function deletePricingProduct(productId) {
    const product = state.pricingProducts.find((item) => item.id === productId);
    if (!product) {
      showToast("Produto não encontrado.");
      return false;
    }

    const confirmed = window.confirm(`Deseja remover o produto ${product.name}?`);
    if (!confirmed) {
      return false;
    }

    try {
      await deleteDocument(FIRESTORE_COLLECTIONS.pricingProducts, productId);
      state.pricingProducts = state.pricingProducts.filter((item) => item.id !== productId);
      if (state.editingPricingProductId === productId) {
        resetPricingProductForm();
      }
      renderPricingProductsList();
      showToast("Produto removido com sucesso.");
      return true;
    } catch (error) {
      console.error("Erro ao remover produto precificado:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  async function login(identifier, password) {
    const normalizedIdentifier = identifier.trim();
    let user = findUserByIdentifier(normalizedIdentifier);

    if (!user) {
      user = getSeedUsers().find((seedUser) =>
        [seedUser.identifier, seedUser.email, seedUser.cpf, seedUser.crf]
          .filter(Boolean)
          .some((value) => normalize(value) === normalize(normalizedIdentifier)),
      ) || null;
    }

    const customLoginValid = Boolean(user && user.password === password);
    if (!user || !customLoginValid) {
      showToast("Usuario ou senha invalidos.");
      return false;
    }

    state.currentUserId = user.id;
    state.currentUser = user;
    saveSession();
    elements.loginForm.reset();
    renderAuthState();
    refresh();
    showToast(`Bem-vindo, ${user.name}.`);
    return true;
  }

  async function logout() {
    await disconnectSupabasePublisher({ notify: false });
    state.currentUserId = "";
    state.currentUser = null;
    saveSession();
    setSidebarOpen(false);
    closeModal(elements.usersModal);
    closeModal(elements.patientModal);
    closeModal(elements.serviceModal);
    closeModal(elements.patientDetailModal);
    closeModal(elements.patientsModal);
    closeModal(elements.historyModal);
    closeModal(elements.registerModal);
    closeModal(elements.doctorsModal);
    closeModal(elements.doctorLookupModal);
    closeModal(elements.accountModal);
    closeModal(elements.pricingModal);
    closeModal(elements.onlineOffersModal);
    closeModal(elements.bioModal);
    closeModal(elements.clinicalModal);
    closeModal(elements.medicinesModal);
    closeModal(elements.chatModal);
    clearOnlineOfferFiles();
    state.publishedOffers = [];
    state.onlineBackendReady = false;
    state.onlineBackendChecked = false;
    renderAuthState();
    elements.loginForm.reset();
    elements.loginIdentifier.focus();
  }

  async function createUserFromForm() {
    if (!isAdminUser()) {
      showToast("Acesso restrito ao administrador.");
      return false;
    }

    const name = elements.userName.value.trim();
    const cpf = elements.userCpf.value.trim();
    const crf = elements.userCrf.value.trim();
    const email = elements.userEmail.value.trim().toLowerCase();
    const password = elements.userPassword.value.trim();
    const role = elements.userRole.value === "admin" ? "admin" : "pharmacist";
    const editingUser = state.users.find((user) => user.id === state.editingUserId) || null;

    if (!name || !cpf || !crf || !email || (!editingUser && !password)) {
      showToast("Preencha todos os campos do usuário.");
      return false;
    }

    const duplicate = state.users.some((user) =>
      user.id !== state.editingUserId &&
      [user.cpf, user.crf, user.email].some((value) =>
        normalize(value) === normalize(cpf) ||
        normalize(value) === normalize(crf) ||
        normalize(value) === normalize(email),
      ),
    );

    if (duplicate) {
      showToast("Ja existe um usuario com esse CPF, CRF ou e-mail.");
      return false;
    }

    if (editingUser?.id === "admin-default" && role !== "admin") {
      showToast("O administrador principal deve permanecer como administrador.");
      return false;
    }

    if (editingUser?.role === "admin" && role !== "admin" && countAdminUsers() <= 1) {
      showToast("É preciso manter pelo menos um administrador ativo.");
      return false;
    }

    try {
      const userRecord = {
        id: editingUser?.id || crypto.randomUUID(),
        name,
        cpf,
        crf,
        email,
        identifier: email,
        password: password || editingUser?.password || "",
        role,
        createdAt: editingUser?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await upsertDocument(FIRESTORE_COLLECTIONS.users, userRecord);
      state.users = editingUser
        ? state.users.map((user) => (user.id === editingUser.id ? userRecord : user))
        : [userRecord, ...state.users];
      if (state.currentUserId === userRecord.id) {
        state.currentUser = userRecord;
        renderAuthState();
      }
      renderUsersList();
      resetUsersForm();
      showToast(editingUser ? "Usuário atualizado com sucesso." : "Usuario criado com sucesso.");
      return true;
    } catch (error) {
      console.error("Erro ao criar usuario:", error);
      showToast(getFirebaseMessage(error));
      return false;
    }
  }

  function openPatientDetail(patientId) {
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) {
      return;
    }

    state.currentBioPatientId = patient.id;
    elements.detailAvatar.textContent = getInitials(patient.name);
    elements.detailTitle.textContent = patient.name;
    elements.detailSubtitle.textContent = `${patient.cpf} • ${patient.phone} • ${patient.email}`;
    elements.detailBirth.textContent = formatDate(patient.birthDate);
    elements.detailSex.textContent = patient.sex;
    elements.detailAddress.textContent = patient.address;

    openModal(elements.patientDetailModal);
  }

  function renderPatientManagement() {
    const query = normalize(elements.patientsSearch.value);
    const patients = state.patients
      .filter((patient) => normalize(`${patient.name} ${patient.cpf}`).includes(query))
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

    if (!patients.length) {
      elements.patientsList.innerHTML = `<div class="empty-state">Nenhum paciente encontrado.</div>`;
      return;
    }

    elements.patientsList.innerHTML = patients.map((patient) => {
      const recordCount = getHistoryGroups(patient.id).reduce((total, group) => total + group.records.length, 0);
      return `<article class="patient-management-row">
        <div class="patient-management-main">
          <strong>${escapeHtml(patient.name)}</strong>
          <span>CPF ${escapeHtml(patient.cpf)} • ${escapeHtml(patient.sex)} • ${formatDate(patient.birthDate)}</span>
          <span>${escapeHtml(patient.phone)} • ${escapeHtml(patient.email)}</span>
        </div>
        <div class="patient-management-actions">
          <span class="patient-record-count">${recordCount} registro(s)</span>
          <button type="button" class="mini-button" data-management-action="edit" data-patient-id="${patient.id}">Editar</button>
          <button type="button" class="mini-button primary" data-management-action="history" data-patient-id="${patient.id}">Ver histórico</button>
        </div>
      </article>`;
    }).join("");
  }

  function openPatientsModal() {
    elements.patientsSearch.value = "";
    renderPatientManagement();
    openModal(elements.patientsModal);
  }

  function openPatientEditor(patientId) {
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) return;

    state.editingPatientId = patient.id;
    elements.patientForm.reset();
    elements.patientForm.querySelector("#patient-name").value = patient.name;
    elements.patientForm.querySelector("#patient-cpf").value = patient.cpf;
    elements.patientForm.querySelector("#patient-birth").value = patient.birthDate;
    elements.patientForm.querySelector("#patient-sex").value = patient.sex;
    elements.patientForm.querySelector("#patient-phone").value = patient.phone;
    elements.patientForm.querySelector("#patient-email").value = patient.email;
    elements.patientForm.querySelector("#patient-address").value = patient.address;
    document.getElementById("modal-title").textContent = "Editar paciente";
    closeModal(elements.patientsModal);
    openModal(elements.patientModal);
  }

  function createDemoData() {
    const patients = [
      {
        id: crypto.randomUUID(),
        name: "Ana Paula Ribeiro",
        cpf: "123.456.789-09",
        birthDate: "1991-04-18",
        sex: "Feminino",
        phone: "(11) 98888-1122",
        email: "ana.paula@example.com",
        address: "Rua das Flores, 120 - Centro",
        createdAt: "2026-08-01T09:20:00",
      },
      {
        id: crypto.randomUUID(),
        name: "Carlos Henrique Souza",
        cpf: "987.654.321-00",
        birthDate: "1985-11-03",
        sex: "Masculino",
        phone: "(11) 97777-3344",
        email: "carlos.souza@example.com",
        address: "Av. Paulista, 500 - Bela Vista",
        createdAt: "2026-08-03T13:15:00",
      },
      {
        id: crypto.randomUUID(),
        name: "Mariana Costa Lima",
        cpf: "321.654.987-10",
        birthDate: "1994-07-22",
        sex: "Feminino",
        phone: "(11) 96666-7788",
        email: "mariana.lima@example.com",
        address: "Rua Augusta, 900 - Consolação",
        createdAt: "2026-07-25T10:00:00",
      },
    ];

    const applications = [
      {
        id: crypto.randomUUID(),
        patientId: patients[0].id,
        dateTime: "2026-08-01T10:00:00",
        note: "Vitamina C",
      },
      {
        id: crypto.randomUUID(),
        patientId: patients[1].id,
        dateTime: "2026-08-04T15:30:00",
        note: "Reposição de complexo B",
      },
      {
        id: crypto.randomUUID(),
        patientId: patients[0].id,
        dateTime: "2026-07-29T09:40:00",
        note: "Aplicação anterior",
      },
    ];

    return { patients, applications };
  }

  function resetPatientForm() {
    elements.patientForm.reset();
    elements.patientForm.querySelector("#patient-sex").value = "Feminino";
  }

  async function persistBioRecord(record) {
    state.bioRecords.unshift(record);
    await upsertDocument(FIRESTORE_COLLECTIONS.bioRecords, record);
  }

  async function persistClinicalRecord(record) {
    state.clinicalRecords.unshift(record);
    await upsertDocument(FIRESTORE_COLLECTIONS.clinicalRecords, record);
  }

  function getClinicalFormValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
  }

  function formatIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(value) {
    const normalized = normalizeDateValue(value);
    if (!normalized) return "";
    const [year, month, day] = normalized.split("-");
    return `${day}/${month}/${year}`;
  }

  function normalizeDateValue(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split("/");
      return `${year}-${month}-${day}`;
    }
    return "";
  }

  function parseInputDate(value) {
    const normalized = normalizeDateValue(value);
    if (!normalized) return null;
    const parsed = new Date(`${normalized}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function setCustomDateInputValue(input, date) {
    input.value = formatDisplayDate(formatIsoDate(date));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function closeCustomDatePicker() {
    elements.customDatePicker.classList.add("hidden");
    elements.customDatePicker.setAttribute("aria-hidden", "true");
    state.activeDateInputId = "";
  }

  function positionCustomDatePicker(input) {
    const rect = input.getBoundingClientRect();
    const picker = elements.customDatePicker;
    const top = rect.bottom + 8;
    const left = Math.min(rect.left, window.innerWidth - picker.offsetWidth - 12);
    picker.style.top = `${Math.max(12, top)}px`;
    picker.style.left = `${Math.max(12, left)}px`;
  }

  function renderCustomDatePicker() {
    const input = document.getElementById(state.activeDateInputId);
    if (!input) return;

    elements.customDateMonth.innerHTML = DATE_ASSIST_MONTHS
      .map((monthLabel, monthIndex) => `<option value="${monthIndex}">${monthLabel}</option>`)
      .join("");

    const years = [];
    for (let year = state.datePickerYear - 12; year <= state.datePickerYear + 12; year += 1) {
      years.push(`<option value="${year}">${year}</option>`);
    }
    elements.customDateYear.innerHTML = years.join("");
    elements.customDateMonth.value = String(state.datePickerMonth);
    elements.customDateYear.value = String(state.datePickerYear);

    const selectedDate = parseInputDate(input.value);
    const today = new Date();
    const firstDay = new Date(state.datePickerYear, state.datePickerMonth, 1);
    const startWeekDay = firstDay.getDay();
    const daysInCurrentMonth = getDaysInMonth(state.datePickerYear, state.datePickerMonth);
    const daysInPreviousMonth = getDaysInMonth(state.datePickerYear, state.datePickerMonth - 1);
    const cells = [];

    for (let index = 0; index < 42; index += 1) {
      let dayNumber = 0;
      let monthOffset = 0;

      if (index < startWeekDay) {
        dayNumber = daysInPreviousMonth - startWeekDay + index + 1;
        monthOffset = -1;
      } else if (index >= startWeekDay + daysInCurrentMonth) {
        dayNumber = index - startWeekDay - daysInCurrentMonth + 1;
        monthOffset = 1;
      } else {
        dayNumber = index - startWeekDay + 1;
      }

      const cellDate = new Date(state.datePickerYear, state.datePickerMonth + monthOffset, dayNumber);
      const isoDate = formatIsoDate(cellDate);
      const isSelected = selectedDate && formatIsoDate(selectedDate) === isoDate;
      const isToday = formatIsoDate(today) === isoDate;
      const mutedClass = monthOffset !== 0 ? " is-muted" : "";
      const selectedClass = isSelected ? " is-selected" : "";
      const todayClass = isToday ? " is-today" : "";
      cells.push(`<button type="button" class="custom-date-day${mutedClass}${selectedClass}${todayClass}" data-date-value="${isoDate}">${dayNumber}</button>`);
    }

    elements.customDateGrid.innerHTML = cells.join("");
  }

  function openCustomDatePicker(input) {
    const baseDate = parseInputDate(input.value) || new Date();
    state.activeDateInputId = input.id;
    state.datePickerMonth = baseDate.getMonth();
    state.datePickerYear = baseDate.getFullYear();
    renderCustomDatePicker();
    elements.customDatePicker.classList.remove("hidden");
    elements.customDatePicker.setAttribute("aria-hidden", "false");
    positionCustomDatePicker(input);
  }

  function initializeCustomDatePicker() {
    elements.customDateInputs.forEach((input) => {
      input.addEventListener("click", () => openCustomDatePicker(input));
      input.addEventListener("focus", () => openCustomDatePicker(input));
    });

    elements.customDatePrev.addEventListener("click", () => {
      const current = new Date(state.datePickerYear, state.datePickerMonth - 1, 1);
      state.datePickerMonth = current.getMonth();
      state.datePickerYear = current.getFullYear();
      renderCustomDatePicker();
    });

    elements.customDateNext.addEventListener("click", () => {
      const current = new Date(state.datePickerYear, state.datePickerMonth + 1, 1);
      state.datePickerMonth = current.getMonth();
      state.datePickerYear = current.getFullYear();
      renderCustomDatePicker();
    });

    elements.customDateMonth.addEventListener("change", () => {
      state.datePickerMonth = Number(elements.customDateMonth.value);
      renderCustomDatePicker();
    });

    elements.customDateYear.addEventListener("change", () => {
      state.datePickerYear = Number(elements.customDateYear.value);
      renderCustomDatePicker();
    });

    elements.customDateGrid.addEventListener("click", (event) => {
      const dayButton = event.target.closest("[data-date-value]");
      if (!dayButton || !state.activeDateInputId) return;
      const input = document.getElementById(state.activeDateInputId);
      const selectedDate = parseInputDate(dayButton.getAttribute("data-date-value"));
      if (!input || !selectedDate) return;
      setCustomDateInputValue(input, selectedDate);
      closeCustomDatePicker();
    });
  }

  function canvasHasDrawing(canvas) {
    if (!canvas) return false;
    const context = canvas.getContext("2d");
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] !== 0) {
        return true;
      }
    }
    return false;
  }

  function readSignatureValue(inputId, canvas) {
    const input = document.getElementById(inputId);
    if (input?.value) {
      return input.value;
    }

    const preview = document.getElementById(`${inputId}-preview`);
    if (preview?.src && preview.src.startsWith("data:image/")) {
      if (input) {
        input.value = preview.src;
      }
      return preview.src;
    }

    if (canvasHasDrawing(canvas)) {
      const signatureData = canvas.toDataURL("image/png");
      if (input) {
        input.value = signatureData;
      }
      return signatureData;
    }

    return "";
  }

  function syncInjectableNextDoseFields() {
    const enabled = Boolean(elements.injectableHasNextDose?.checked);
    [elements.injectableNextDateField, elements.injectableNextTimeField].forEach((field) => {
      field?.classList.toggle("hidden", !enabled);
    });

    const nextDateInput = document.getElementById("injectable-next-date");
    const nextTimeInput = document.getElementById("injectable-next-time");

    if (nextDateInput) {
      nextDateInput.required = enabled;
      if (!enabled) nextDateInput.value = "";
    }

    if (nextTimeInput) {
      nextTimeInput.required = enabled;
      if (!enabled) nextTimeInput.value = "";
    }
  }

  function clearSignaturePad(canvas, inputId) {
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const input = document.getElementById(inputId);
    if (input) input.value = "";
    const preview = document.getElementById(`${inputId}-preview`);
    if (preview) {
      preview.removeAttribute("src");
      preview.classList.add("hidden");
    }
    canvas.dataset.signed = "false";
    canvas.parentElement?.classList.remove("has-signature");
  }

  function setupSignaturePad(canvas, inputId) {
    if (!canvas) return;
    const context = canvas.getContext("2d");
    let drawing = false;
    const point = (event) => {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
        y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
      };
    };

    canvas.addEventListener("pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const position = point(event);
      context.beginPath();
      context.moveTo(position.x, position.y);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const position = point(event);
      context.lineWidth = 3;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#173a70";
      context.lineTo(position.x, position.y);
      context.stroke();
      canvas.dataset.signed = "true";
      canvas.parentElement?.classList.add("has-signature");
      const input = document.getElementById(inputId);
      if (input) {
        input.value = canvas.toDataURL("image/png");
      }
    });
    ["pointerup", "pointercancel"].forEach((eventName) => {
      canvas.addEventListener(eventName, (event) => {
        if (!drawing) return;
        drawing = false;
        const input = document.getElementById(inputId);
        const preview = document.getElementById(`${inputId}-preview`);
        if (input) {
          const signatureData = canvas.toDataURL("image/png");
          input.value = signatureData;
          if (preview) {
            preview.src = signatureData;
            preview.classList.remove("hidden");
          }
          const image = new Image();
          image.addEventListener("load", () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
          }, { once: true });
          image.src = signatureData;
        }
        if (event?.pointerId !== undefined && canvas.hasPointerCapture?.(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
        context.beginPath();
      });
    });
  }

  function buildClinicalRecord() {
    const patient = state.patients.find((item) => item.id === state.currentClinicalPatientId);
    if (!patient) {
      showToast("Paciente não encontrado.");
      return null;
    }

    if (!elements.clinicalForm.checkValidity()) {
      elements.clinicalForm.reportValidity();
      showToast("Preencha os campos obrigatorios do atendimento.");
      return null;
    }

    const kind = state.currentClinicalKind;
    const record = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      kind,
      date: normalizeDateValue(elements.clinicalDate.value),
      time: elements.clinicalTime.value,
      createdAt: new Date().toISOString(),
    };

    if (kind === "pressure") {
      record.systolic = getClinicalFormValue("pressure-systolic");
      record.diastolic = getClinicalFormValue("pressure-diastolic");
      record.heartRate = getClinicalFormValue("pressure-heart-rate");
      record.observations = getClinicalFormValue("pressure-observations");
    }

    if (kind === "glucose") {
      record.value = getClinicalFormValue("glucose-value");
      record.fasting = getClinicalFormValue("glucose-fasting");
      record.condition = getClinicalFormValue("glucose-condition");
      record.observations = getClinicalFormValue("glucose-observations");
    }

    if (kind === "injectable") {
      const professionalSignature = readSignatureValue(
        "injectable-professional-signature",
        elements.professionalSignatureCanvas,
      );
      const patientSignature = readSignatureValue(
        "injectable-patient-signature",
        elements.patientSignatureCanvas,
      );
      if (!professionalSignature) {
        showToast("Faça a assinatura do profissional antes de salvar.");
        return null;
      }
      record.medicine = getClinicalFormValue("injectable-medicine");
      record.dosage = getClinicalFormValue("injectable-dosage");
      record.type = getClinicalFormValue("injectable-type");
      record.location = getClinicalFormValue("injectable-location");
      record.barcode = getClinicalFormValue("injectable-barcode");
      record.batch = getClinicalFormValue("injectable-batch");
      record.expiration = normalizeDateValue(getClinicalFormValue("injectable-expiration"));
      record.hasNextDose = Boolean(elements.injectableHasNextDose?.checked);
      record.nextDate = record.hasNextDose ? normalizeDateValue(getClinicalFormValue("injectable-next-date")) : "";
      record.nextTime = record.hasNextDose ? getClinicalFormValue("injectable-next-time") : "";
      record.prescriberName = getClinicalFormValue("injectable-prescriber-name");
      record.council = getClinicalFormValue("injectable-council");
      record.registry = getClinicalFormValue("injectable-registry");
      record.uf = getClinicalFormValue("injectable-uf");
      record.observations = getClinicalFormValue("injectable-observations");
      record.professionalName = getClinicalFormValue("injectable-professional-name");
      record.professionalCrf = getClinicalFormValue("injectable-professional-crf");
      record.professionalSignature = professionalSignature;
      record.patientName = getClinicalFormValue("injectable-patient-name");
      record.patientDoc = getClinicalFormValue("injectable-patient-doc");
      record.patientSignature = patientSignature;
    }

    if (kind === "consultation" || kind === "dressings") {
      const prefix = kind === "dressings" ? "dressings" : "service";
      record.description = getClinicalFormValue(`${prefix}-description`);
      record.observations = getClinicalFormValue(`${prefix}-observations`);
    }

    return { patient, record };
  }

  async function registerApplicationForInjectable(patient, record) {
    const application = {
      id: crypto.randomUUID(),
      patientId: patient.id,
      dateTime: `${record.date}T${record.time}:00`,
      note: `${record.medicine || "Injetável"} • ${record.type || "Aplicação"} • ${record.location || "Sem local informado"}`,
    };
    state.applications.unshift(application);
    await upsertDocument(FIRESTORE_COLLECTIONS.applications, application);
  }

  function formatPrintDate(value) {
    if (!value) return "-";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
    }).format(date);
  }

  function renderSignature(value, fallback) {
    if (String(value || "").startsWith("data:image/")) {
      return `<img class="signature-image" src="${value}" alt="Assinatura" />`;
    }
    return escapeHtml(value || fallback);
  }

  function getRecipePrintStyles() {
    return `
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      html, body { width: 100%; min-width: 0; min-height: 0; margin: 0; padding: 0; overflow: visible; }
      body { font-family: Arial, sans-serif; color: #000; background: #fff; }
      .recipe-page { width: 100%; max-width: 190mm; margin: 0 auto; padding: 8mm; overflow: visible; page-break-after: always; break-after: page; }
      .recipe-page:last-child { page-break-after: auto; break-after: auto; }
      .header { display: flex; align-items: center; gap: 9px; padding-bottom: 6px; border-bottom: 1px solid #9aa7b8; page-break-inside: avoid; break-inside: avoid; }
      .header img { flex: 0 0 auto; width: 46px; height: 46px; object-fit: contain; border-radius: 0; }
      .header > div { min-width: 0; }
      .header h1 { margin: 0; font-size: 1.06rem; line-height: 1.08; overflow-wrap: anywhere; }
      .header p { margin: 1px 0 0; color: #000; font-size: .68rem; line-height: 1.18; overflow-wrap: anywhere; }
      .print-section { min-width: 0; }
      .section-title { margin: 7px 0 2px; padding-bottom: 2px; border-bottom: 1px solid #000; font-size: .68rem; text-transform: uppercase; letter-spacing: .07em; color: #000; page-break-after: avoid; break-after: avoid; }
      .grid { display: grid; gap: 0 10px; margin-top: 1px; }
      .details-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .signatures-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .card { min-width: 0; border: 0; border-bottom: 1px solid #d2dae5; border-radius: 0; padding: 0; background: transparent; page-break-inside: avoid; break-inside: avoid; }
      .card.full { grid-column: 1 / -1; }
      .print-row { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-width: 0; padding: 3px 0; page-break-inside: avoid; break-inside: avoid; }
      .print-label { color: #000; font-size: .63rem; }
      .print-value { max-width: 100%; text-align: left; font-size: .7rem; line-height: 1.16; color: #000; overflow-wrap: anywhere; word-break: break-word; }
      .doctor-row { display: grid; grid-template-columns: 1.35fr .5fr .85fr .28fr; gap: 6px; border-bottom: 1px solid #e1e9f5; page-break-inside: avoid; break-inside: avoid; }
      .doctor-item { display: flex; flex-direction: column; gap: 1px; min-width: 0; padding: 3px 0; }
      .doctor-item span { color: #000; font-size: .63rem; }
      .doctor-item strong { font-size: .7rem; line-height: 1.16; overflow-wrap: anywhere; word-break: break-word; }
      .signature { min-height: 0; padding-bottom: 3px; page-break-inside: avoid; break-inside: avoid; }
      .signature .signature-line { margin-top: 8px; border-top: 1px solid #000; padding-top: 4px; text-align: center; color: #000; font-size: .64rem; }
      .signature-image { display: block; width: min(100%, 210px); height: 46px; object-fit: contain; margin: 0 auto; }
      .footer-note { margin-top: 5px; color: #000; font-size: .59rem; text-align: center; page-break-inside: avoid; break-inside: avoid; }
      .pharmacy-note { margin-top: 4px; padding-top: 4px; border-top: 1px solid #000; text-align: center; page-break-inside: avoid; break-inside: avoid; }
      .pharmacy-note strong { display: block; font-size: .64rem; line-height: 1.1; }
      .pharmacy-note span { display: block; font-size: .58rem; line-height: 1.16; }
      @page { size: A4 portrait; margin: 10mm; }
      @media print {
        html, body { width: auto !important; height: auto !important; min-height: 0 !important; overflow: visible !important; }
        body { padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .recipe-page { width: auto !important; max-width: none !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
        .recipe-page, .recipe-page * { max-inline-size: 100%; }
      }
      @media screen and (max-width: 700px) {
        .recipe-page { padding: 18px; }
        .details-grid, .signatures-grid { grid-template-columns: 1fr; }
        .doctor-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
    `;
  }

  function getPrintStartupScript() {
    return `<script>
      window.addEventListener('load', () => {
        const imagesReady = Promise.all(Array.from(document.images).map((image) => (
          image.complete ? Promise.resolve() : new Promise((resolve) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', resolve, { once: true });
          })
        )));
        const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        Promise.all([imagesReady, fontsReady]).then(() => setTimeout(() => window.print(), 400));
      });
      window.addEventListener('afterprint', () => window.close());
    </script>`;
  }

  function buildPharmacyFooter() {
    return `<div class="pharmacy-note"><strong>FARMACIA SUPERPRECO</strong><span>CNPJ: 55.253.800/0001-06</span><span>Rua Albano Schmidt, 2183 - Boa Vista</span></div>`;
  }

  function buildRecipePage(record, patient, logoUrl) {
    if (record?.kind !== "injectable") {
      return buildServiceRecipePage(record, patient, logoUrl);
    }
    const line = (label, value) => `<div class="print-row"><span class="print-label">${escapeHtml(label)}</span><strong class="print-value">${escapeHtml(value || "-")}</strong></div>`;
    const doctorLine = (label, value) => `<div class="doctor-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
    return `<section class="recipe-page">
      <header class="header">
        <img src="${logoUrl}" alt="Logo da farmácia" />
        <div>
          <h1>Receita / Registro de Injetável</h1>
          <p>${escapeHtml(patient.name)} • CPF ${escapeHtml(patient.cpf)}</p>
          <p>${escapeHtml(patient.phone)} • ${escapeHtml(patient.email)}</p>
        </div>
      </header>

      <div class="print-section">
      <div class="section-title">Dados do atendimento</div>
      <div class="grid details-grid">
        <div class="card">${line("Data", formatPrintDate(record.date))}</div>
        <div class="card">${line("Horário", record.time || "-")}</div>
        <div class="card">${line("Medicamento", record.medicine)}</div>
        <div class="card">${line("Posologia", record.dosage)}</div>
        <div class="card">${line("Tipo de aplicação", record.type)}</div>
        <div class="card">${line("Local de aplicação", record.location)}</div>
        <div class="card">${line("Código de barras", record.barcode)}</div>
        <div class="card">${line("Lote", record.batch)}</div>
        <div class="card">${line("Validade", formatPrintDate(record.expiration))}</div>
        <div class="card">${line("Próxima dose", record.nextDate ? `${formatPrintDate(record.nextDate)} • ${record.nextTime || "-"}` : "Não informada")}</div>
        <div class="card full">${line("Observações", record.observations)}</div>
      </div>
      </div>

      <div class="print-section">
      <div class="section-title">Dados do prescritor</div>
      <div class="doctor-row">
        ${doctorLine("Nome do médico", record.prescriberName)}
        ${doctorLine("Conselho", record.council || "CRM")}
        ${doctorLine("CRM / registro", record.registry)}
        ${doctorLine("UF", record.uf)}
      </div>
      </div>

      <div class="print-section">
      <div class="section-title">Assinaturas</div>
      <div class="grid signatures-grid">
        <div class="card signature">
          ${line("Profissional", record.professionalName)}
          ${line("CRF", record.professionalCrf || record.professionalDoc)}
          <div class="signature-line">${renderSignature(record.professionalSignature, "Assinatura do profissional")}</div>
        </div>
        <div class="card signature">
          ${line("Paciente", record.patientName || patient.name)}
          ${line("Documento", record.patientDoc || patient.cpf)}
          <div class="signature-line">${renderSignature(record.patientSignature, "Assinatura do paciente")}</div>
        </div>
      </div>
      </div>
      <div class="footer-note">Documento gerado em ${formatDateTime(new Date().toISOString())}</div>
      ${buildPharmacyFooter()}
    </section>`;
  }

  function openRecipeReportPrintWindow(entries) {
    const printWindow = window.open("", "_blank", "width=980,height=1280");
    if (!printWindow) {
      showToast("Permita janelas pop-up para imprimir as receitas.");
      return;
    }

    const logoUrl = new URL("./assets/logo.png", window.location.href).href;
    const pages = entries.map((entry) => buildRecipePage(entry.record, entry.patient, logoUrl)).join("");
    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Receitas - Livro de registro</title><style>${getRecipePrintStyles()}</style></head><body>${pages}${getPrintStartupScript()}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
  }

  function getServiceRecord(record) {
    if (record?.kind) return record;
    return { ...record, kind: "bio" };
  }

  function getServiceLabel(record) {
    return {
      bio: "Bioimpedância",
      pressure: "Pressão Arterial",
      glucose: "Glicemia",
      injectable: "Injetáveis",
      consultation: "Consulta Farmacêutica",
      dressings: "Curativos",
    }[record?.kind] || "Serviço farmacêutico";
  }

  function buildServiceRecipePage(record, patient, logoUrl) {
    const current = getServiceRecord(record);
    const line = (label, value, full = false) => `<div class="card${full ? " full" : ""}">${`<div class="print-row"><span class="print-label">${escapeHtml(label)}</span><strong class="print-value">${escapeHtml(value || "-")}</strong></div>`}</div>`;
    let details = [
      ["Data", formatPrintDate(current.date)],
      ["Horário", current.time || "-"],
    ];

    if (current.kind === "bio") {
      details.push(
        ["Elegibilidade", current.eligibility], ["Observação de elegibilidade", current.eligibilityNote],
        ["Peso (kg)", current.weight], ["Altura (cm)", current.height], ["Idade (anos)", current.age],
        ["Sexo", current.sex], ["Cintura (cm)", current.waist], ["Pescoço (cm)", current.neck],
        ["Quadril (cm)", current.hip], ["Nível de atividade", current.activity],
        ["% de gordura corporal", current.bodyFat], ["% músculo esquelético", current.skeletalMuscle],
        ["Metabolismo basal (Kcal)", current.basalMetabolism], ["Nível de gordura visceral", current.visceralFat],
        ["Idade corporal (anos)", current.bodyAge], ["Observações", current.observations, true],
      );
    } else if (current.kind === "pressure") {
      details.push(["Sistólica (mmHg)", current.systolic], ["Diastólica (mmHg)", current.diastolic], ["Batimentos (BPM)", current.heartRate], ["Observações", current.observations, true]);
    } else if (current.kind === "glucose") {
      details.push(["Valor (mg/dL)", current.value], ["Tempo de jejum", current.fasting], ["Condição", current.condition], ["Observações", current.observations, true]);
    } else if (current.kind === "injectable") {
      details.push(
        ["Medicamento", current.medicine], ["Posologia", current.dosage], ["Tipo de aplicação", current.type],
        ["Local de aplicação", current.location], ["Código de barras", current.barcode], ["Lote", current.batch],
        ["Validade", formatPrintDate(current.expiration)], ["Próxima dose", current.nextDate ? `${formatPrintDate(current.nextDate)} • ${current.nextTime || "-"}` : "Não informada"],
        ["Observações", current.observations, true],
      );
    } else {
      details.push(["Descrição do serviço", current.description, true], ["Observações", current.observations, true]);
    }

    const doctor = current.kind === "injectable" && (current.prescriberName || current.registry || current.council || current.uf)
      ? `<div class="section-title">Dados do prescritor</div><div class="doctor-row"><div class="doctor-item"><span>Nome do médico</span><strong>${escapeHtml(current.prescriberName || "-")}</strong></div><div class="doctor-item"><span>Conselho</span><strong>${escapeHtml(current.council || "CRM")}</strong></div><div class="doctor-item"><span>CRM / registro</span><strong>${escapeHtml(current.registry || "-")}</strong></div><div class="doctor-item"><span>UF</span><strong>${escapeHtml(current.uf || "-")}</strong></div></div>`
      : "";

    return `<section class="recipe-page"><header class="header"><img src="${logoUrl}" alt="Logo da farmácia" /><div><h1>Receita / Registro de ${escapeHtml(getServiceLabel(current))}</h1><p>${escapeHtml(patient.name)} • CPF ${escapeHtml(patient.cpf)}</p><p>${escapeHtml(patient.phone)} • ${escapeHtml(patient.email)}</p></div></header><div class="print-section"><div class="section-title">Dados do atendimento</div><div class="grid details-grid">${details.map(([label, value, full]) => line(label, value, full)).join("")}</div></div>${doctor ? `<div class="print-section">${doctor}</div>` : ""}<div class="print-section"><div class="section-title">Assinaturas</div><div class="grid signatures-grid"><div class="card signature">${line("Profissional", current.professionalName || "Farmácia SuperPreço")}${line("CRF", current.professionalCrf || current.professionalDoc || "-")}<div class="signature-line">${renderSignature(current.professionalSignature, "Assinatura do profissional")}</div></div><div class="card signature">${line("Paciente", current.patientName || patient.name)}${line("Documento", current.patientDoc || patient.cpf)}<div class="signature-line">${renderSignature(current.patientSignature, "Assinatura do paciente")}</div></div></div></div><div class="footer-note">Documento gerado em ${formatDateTime(new Date().toISOString())}</div>${buildPharmacyFooter()}</section>`;
  }

  function preparePrintWindow() {
    const printWindow = window.open("", "_blank", "width=980,height=1280");
    if (!printWindow) {
      showToast("Permita janelas pop-up para imprimir a receita.");
      return null;
    }
    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Preparando impressão...</title></head><body style="font-family: Inter, Arial, sans-serif; padding: 24px; color: #000;">Preparando arquivo para impressão...</body></html>`);
    printWindow.document.close();
    return printWindow;
  }

  function openServicePrintWindow(record, patient, targetWindow = null) {
    const printWindow = targetWindow || window.open("", "_blank", "width=980,height=1280");
    if (!printWindow) {
      showToast("Permita janelas pop-up para imprimir a receita.");
      return;
    }
    const logoUrl = new URL("./assets/logo.png", window.location.href).href;
    const page = buildServiceRecipePage(record, patient, logoUrl);
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Receita - ${escapeHtml(patient.name)}</title><style>${getRecipePrintStyles()}</style></head><body>${page}${getPrintStartupScript()}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
  }

  function openInjectablePrintWindow(record, patient) {
    const printWindow = window.open("", "_blank", "width=980,height=1280");
    if (!printWindow) {
      showToast("Permita janelas pop-up para imprimir a receita.");
      return;
    }

    const logoUrl = new URL("./assets/logo.png", window.location.href).href;
    const line = (label, value) => `
      <div class="print-row">
        <span class="print-label">${escapeHtml(label)}</span>
        <strong class="print-value">${escapeHtml(value || "-")}</strong>
      </div>
    `;
    const doctorLine = (label, value) => `<div class="doctor-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`;

    const html = `<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Receita - ${escapeHtml(patient.name)}</title>
          <style>
            :root {
              color-scheme: light;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 18px;
              font-family: Inter, Arial, sans-serif;
              color: #000;
              background: #fff;
            }
            .page {
              max-width: 760px;
              margin: 0 auto;
              padding: 8px 18px;
            }
            .header {
              display: flex;
              align-items: center;
              gap: 16px;
              padding-bottom: 14px;
              border-bottom: 1px solid #e3eaf5;
            }
            .header img {
              width: 76px;
              height: 76px;
              object-fit: contain;
              border-radius: 0;
            }
            .header h1 {
              margin: 0;
              font-size: 1.7rem;
              line-height: 1.1;
            }
            .header p {
              margin: 8px 0 0;
              color: #000;
              font-size: 0.95rem;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 0;
              margin-top: 8px;
            }
            .card {
              border: 0;
              border-bottom: 1px solid #e1e9f5;
              border-radius: 0;
              padding: 0;
              background: transparent;
            }
            .card.full { grid-column: 1 / -1; }
            .section-title {
              margin: 18px 0 4px;
              padding-bottom: 5px;
              border-bottom: 2px solid #000;
              font-size: 0.95rem;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #000;
            }
            .print-row {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 3px;
              padding: 8px 0;
              border-bottom: 0;
            }
            .print-row:last-child {
              border-bottom: none;
            }
            .print-label {
              color: #000;
              font-size: 0.9rem;
            }
            .print-value {
              text-align: left;
              font-size: 0.94rem;
              line-height: 1.35;
              color: #000;
            }
            .doctor-row {
              display: grid;
              grid-template-columns: 1.5fr .7fr 1fr .45fr;
              gap: 12px;
              border-bottom: 1px solid #e1e9f5;
            }
            .doctor-item {
              display: flex;
              flex-direction: column;
              gap: 3px;
              padding: 8px 0;
            }
            .doctor-item span {
              color: #000;
              font-size: 0.9rem;
            }
            .doctor-item strong {
              font-size: 0.94rem;
            }
            .signature {
              min-height: 0;
              padding-bottom: 12px;
            }
            .signature .signature-line {
              margin-top: 24px;
              border-top: 1px solid #233a5a;
              padding-top: 12px;
              text-align: center;
              color: #000;
              font-size: 0.9rem;
            }
            .signature-image { display: block; width: min(100%, 320px); height: 92px; object-fit: contain; margin: 0 auto; }
            .footer-note {
              margin-top: 14px;
              color: #000;
              font-size: 0.86rem;
              text-align: center;
            }
            @page {
              margin: 12mm;
            }
            @media print {
              body {
                background: #fff;
                padding: 0;
              }
              .page {
                max-width: none;
                padding: 0 8px;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <header class="header">
              <img src="${logoUrl}" alt="Logo da farmácia" />
              <div>
                <h1>Receita / Registro de Injetável</h1>
                <p>${escapeHtml(patient.name)} • CPF ${escapeHtml(patient.cpf)}</p>
                <p>${escapeHtml(patient.phone)} • ${escapeHtml(patient.email)}</p>
              </div>
            </header>

            <div class="section-title">Dados do atendimento</div>
            <div class="grid">
              <div class="card">${line("Data", formatPrintDate(record.date))}</div>
              <div class="card">${line("Horário", record.time || "-")}</div>
              <div class="card">${line("Medicamento", record.medicine)}</div>
              <div class="card">${line("Posologia", record.dosage)}</div>
              <div class="card">${line("Tipo de aplicação", record.type)}</div>
              <div class="card">${line("Local de aplicação", record.location)}</div>
              <div class="card">${line("Código de barras", record.barcode)}</div>
              <div class="card">${line("Lote", record.batch)}</div>
              <div class="card">${line("Validade", formatPrintDate(record.expiration))}</div>
              <div class="card">${line("Próxima dose", record.nextDate ? `${formatPrintDate(record.nextDate)} • ${record.nextTime || "-"}` : "Não informada")}</div>
              <div class="card full">${line("Observações", record.observations)}</div>
            </div>

            <div class="section-title">Dados do prescritor</div>
            <div class="doctor-row">
              ${doctorLine("Nome do médico", record.prescriberName)}
              ${doctorLine("Conselho", record.council || "CRM")}
              ${doctorLine("CRM / registro", record.registry)}
              ${doctorLine("UF", record.uf)}
            </div>

            <div class="section-title">Assinaturas</div>
            <div class="grid">
              <div class="card signature">
                ${line("Profissional", record.professionalName)}
                ${line("CRF", record.professionalCrf || record.professionalDoc)}
                <div class="signature-line">${renderSignature(record.professionalSignature, "Assinatura do profissional")}</div>
              </div>
              <div class="card signature">
                ${line("Paciente", record.patientName)}
                ${line("Documento", record.patientDoc)}
                <div class="signature-line">${escapeHtml(record.patientSignature || "Assinatura do paciente")}</div>
              </div>
            </div>

            <div class="footer-note">
              Documento gerado em ${formatDateTime(new Date().toISOString())}
            </div>
          </div>

          <script>
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
              }, 300);
            });
            window.addEventListener('afterprint', () => window.close());
          </script>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  }

  async function saveClinicalEntry({ printAfterSave = false, printWindow = null } = {}) {
    const payload = buildClinicalRecord();
    if (!payload) {
      printWindow?.close();
      return null;
    }

    try {
      const { patient, record } = payload;
      await persistClinicalRecord(record);
      await saveDoctorFromPrescriber(record);

      if (record.kind === "injectable") {
        await registerApplicationForInjectable(patient, record);
      }

      refresh();
      closeModal(elements.clinicalModal);
      if (printAfterSave) {
        openServicePrintWindow(record, patient, printWindow);
        showToast("Receita pronta para impressão.");
      } else {
        showToast(`${getServiceLabel(record)} salvo.`);
      }

      return payload;
    } catch (error) {
      printWindow?.close();
      console.error("Erro ao salvar atendimento:", error);
      showToast(getFirebaseMessage(error));
      return null;
    }
  }

  function refresh() {
    renderDashboard();
    renderPatients();
    renderActivities();
    if (elements.pricingModal && !elements.pricingModal.classList.contains("hidden")) {
      renderPricingAccess();
      renderPricingSettingsForm();
      renderPricingProductsList();
      renderPricingProductResults();
    }
    if (elements.purchasesModal && !elements.purchasesModal.classList.contains("hidden")) {
      renderPurchases();
    }
  }

  document.getElementById("open-patient").addEventListener("click", () => {
    state.editingPatientId = "";
    resetPatientForm();
    document.getElementById("modal-title").textContent = "Cadastrar Novo Paciente";
    openModal(elements.patientModal);
    setTimeout(() => document.getElementById("patient-name").focus(), 0);
  });

  document.getElementById("close-patient").addEventListener("click", () => {
    closeModal(elements.patientModal);
  });

  document.getElementById("cancel-patient").addEventListener("click", () => {
    closeModal(elements.patientModal);
  });

  elements.closePatients.addEventListener("click", () => closeModal(elements.patientsModal));
  elements.patientsSearch.addEventListener("input", debounce(renderPatientManagement));

  elements.patientsList.addEventListener("click", (event) => {
    const action = event.target.closest("[data-management-action]");
    if (!action) return;
    const patientId = action.getAttribute("data-patient-id");
    if (action.getAttribute("data-management-action") === "edit") {
      openPatientEditor(patientId);
      return;
    }
    openHistoryModal(patientId);
  });

  document.getElementById("open-service").addEventListener("click", () => {
    state.currentServicePatientId = "";
    openServiceLauncher("");
  });

  elements.openMedicines.addEventListener("click", async () => {
    window.clearTimeout(medicineSearchTimer);
    openModal(elements.medicinesModal);
    elements.medicinesSearch.value = "";
    elements.medicinesSearch.disabled = true;
    elements.medicinesResults.classList.remove("hidden");
    elements.medicinesResults.innerHTML = `<div class="medicines-empty-state">Preparando a consulta de medicamentos...</div>`;
    try {
      await ensureMedicineDataLoaded();
      elements.medicinesSearch.disabled = false;
      renderMedicineSearch();
      setTimeout(() => elements.medicinesSearch.focus(), 0);
    } catch (error) {
      console.error("Erro ao carregar a base de medicamentos:", error);
      const unavailableMessage = error?.code === "ENOENT" || /ENOENT/.test(String(error?.message || ""))
        ? "A base de medicamentos não está incluída nesta instalação. As novas versões aguardam uma fonte de dados com licença de redistribuição."
        : "Não foi possível carregar a base de medicamentos. Feche esta janela e tente novamente.";
      elements.medicinesResults.innerHTML = `<div class="medicines-empty-state">${escapeHtml(unavailableMessage)}</div>`;
    }
  });

  elements.openChat.addEventListener("click", () => {
    openModal(elements.chatModal);
    setTimeout(() => elements.chatInput.focus(), 0);
  });

  elements.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const originalMessage = elements.chatInput.value.trim();
    const improvedMessage = improveCustomerMessage(originalMessage);
    if (!improvedMessage) return;

    appendChatMessage("user", originalMessage);
    appendChatMessage("bot", improvedMessage);
    elements.chatInput.value = "";
    elements.chatInput.focus();
  });

  elements.chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      elements.chatForm.requestSubmit();
    }
  });

  elements.chatMessages.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-chat-copy]");
    if (!copyButton) return;
    try {
      await copyChatMessage(decodeURIComponent(copyButton.dataset.chatCopy));
      showToast("Mensagem copiada.");
    } catch (error) {
      console.error("Erro ao copiar mensagem:", error);
      showToast("Não foi possível copiar a mensagem.");
    }
  });

  elements.medicinesSearch.addEventListener("input", scheduleMedicineSearch);
  elements.medicinesSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    window.clearTimeout(medicineSearchTimer);
    renderMedicineSearch();
  });
  elements.medicinesResults.addEventListener("toggle", (event) => {
    if (event.target.matches(".medicine-topic-card")) {
      if (event.target.open) {
        const topicGrid = event.target.closest(".medicine-topic-grid");
        Array.from(topicGrid?.children || []).forEach((topic) => {
          if (topic !== event.target && topic.matches(".medicine-topic-card") && topic.open) {
            topic.open = false;
          }
        });
      }
      loadMedicineTopic(event.target);
    }
  }, true);

  document.getElementById("open-patients").addEventListener("click", () => {
    openPatientsModal();
  });

  elements.openPricing.addEventListener("click", () => {
    openPricingModal();
  });

  elements.openOfferSheet.addEventListener("click", () => {
    openOfferSheetModal();
  });

  elements.openOnlineOffers.addEventListener("click", async () => {
    await openOnlineOffersModal();
  });

  document.getElementById("open-register").addEventListener("click", () => {
    openRegisterModal();
  });

  elements.closeRegister.addEventListener("click", () => closeModal(elements.registerModal));

  elements.reportBy.addEventListener("change", () => {
    updateReportFilter();
    updateReportPreviewButton();
  });

  elements.reportPatientSearch.addEventListener("input", debounce(() => {
    populateReportPatients();
    updateReportPreviewButton();
  }));

  elements.reportPatients.addEventListener("change", updateReportPreviewButton);

  elements.reportSelectAllServices.addEventListener("click", () => {
    Array.from(elements.reportServices.querySelectorAll("input")).forEach((input) => {
      input.checked = true;
    });
    updateReportServicesTrigger();
    updateReportPreviewButton();
  });

  elements.reportServicesToggle.addEventListener("click", () => {
    elements.reportServicesMenu.classList.toggle("hidden");
  });

  elements.reportServices.addEventListener("change", () => {
    updateReportServicesTrigger();
    updateReportPreviewButton();
  });

  [elements.reportStartDate, elements.reportEndDate].forEach((input) => {
    input.addEventListener("input", updateReportPreviewButton);
  });

  elements.reportPreviewButton.addEventListener("click", () => {
    generateReport({ previewOnly: true });
  });

  elements.reportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateReport();
  });

  elements.reportClear.addEventListener("click", () => {
    elements.reportForm.reset();
    elements.reportPatientSearch.value = "";
    populateReportPatients();
    populateReportServices();
    elements.reportResult.classList.add("hidden");
    elements.reportPreviewEmpty.classList.remove("hidden");
    state.reportPreviewEntries = [];
    updateReportFilter();
    updateReportPreviewButton();
  });

  elements.reportResult.addEventListener("click", (event) => {
    if (event.target.closest("#print-report")) printGeneratedReport();
    if (event.target.closest("#print-report-recipes")) openRecipeReportPrintWindow(state.reportPreviewEntries);
  });

  elements.sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const nav = item.getAttribute("data-nav");
      const serviceName = item.getAttribute("data-service");

      if (nav === "dashboard") {
        setActiveNav("dashboard");
        document.querySelector(".hero-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (nav === "patients") {
        setActiveNav("patients");
        document.querySelector(".panel-wide")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (nav === "services" || serviceName) {
        setActiveNav(nav || "services");
        state.currentServicePatientId = "";
        openServiceLauncher("");
        return;
      }

      if (nav === "pricing") {
        openPricingModal();
        return;
      }

      if (nav === "users") {
        openUsersModal();
      }
    });
  });

  elements.logoutButton.addEventListener("click", async () => {
    await logout();
  });

  elements.topbarLogout.addEventListener("click", async () => {
    await logout();
  });

  elements.sidebarHandle.addEventListener("click", () => {
    setSidebarOpen(!state.sidebarOpen);
  });

  const sidebarCategories = Array.from(document.querySelectorAll(".sidebar-category"));
  const sidebarHoverCloseTimers = new WeakMap();

  function cancelSidebarHoverClose(category) {
    const timer = sidebarHoverCloseTimers.get(category);
    if (timer) window.clearTimeout(timer);
    sidebarHoverCloseTimers.delete(category);
  }

  function scheduleSidebarHoverClose(category) {
    cancelSidebarHoverClose(category);
    const timer = window.setTimeout(() => {
      const menu = category.querySelector(".sidebar-category-menu");
      if (!category.matches(":hover") && !menu.matches(":hover") && !category.contains(document.activeElement)) {
        category.open = false;
      }
      sidebarHoverCloseTimers.delete(category);
    }, 250);
    sidebarHoverCloseTimers.set(category, timer);
  }

  function positionSidebarCategoryMenu(category) {
    if (!category.open) return;
    const menu = category.querySelector(".sidebar-category-menu");
    const summary = category.querySelector("summary");
    const categoryRect = category.getBoundingClientRect();
    const summaryRect = summary.getBoundingClientRect();
    const menuWidth = menu.getBoundingClientRect().width;
    const horizontalPadding = 8;
    const maxLeft = Math.max(horizontalPadding, window.innerWidth - menuWidth - horizontalPadding);
    const viewportLeft = Math.max(horizontalPadding, Math.min(summaryRect.left, maxLeft));
    menu.style.left = `${viewportLeft - categoryRect.left}px`;
    menu.style.right = "auto";
    menu.style.transform = "none";
  }

  sidebarCategories.forEach((category) => {
    const menu = category.querySelector(".sidebar-category-menu");
    category.querySelector("summary").addEventListener("click", (event) => {
      if (window.matchMedia("(hover: hover)").matches && category.open) {
        event.preventDefault();
      }
    });
    category.addEventListener("mouseenter", () => {
      cancelSidebarHoverClose(category);
      if (!window.matchMedia("(hover: hover)").matches) return;
      sidebarCategories.forEach((otherCategory) => {
        cancelSidebarHoverClose(otherCategory);
        if (otherCategory !== category) otherCategory.open = false;
      });
      category.open = true;
    });
    category.addEventListener("mouseleave", () => scheduleSidebarHoverClose(category));
    menu.addEventListener("mouseenter", () => cancelSidebarHoverClose(category));
    menu.addEventListener("mouseleave", () => scheduleSidebarHoverClose(category));
    category.addEventListener("toggle", () => {
      if (!category.open) return;
      positionSidebarCategoryMenu(category);
      sidebarCategories.forEach((otherCategory) => {
        if (otherCategory !== category) otherCategory.open = false;
      });
    });
  });

  document.querySelector(".sidebar-nav").addEventListener("click", (event) => {
    if (!event.target.closest(".sidebar-category-menu .sidebar-item")) return;
    const category = event.target.closest(".sidebar-category");
    category.open = false;
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest(".sidebar-nav")) return;
    sidebarCategories.forEach((category) => {
      category.open = false;
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const openCategory = sidebarCategories.find((category) => category.open);
    if (!openCategory) return;
    openCategory.open = false;
    openCategory.querySelector("summary").focus();
  });

  window.addEventListener("resize", () => {
    sidebarCategories.forEach(positionSidebarCategoryMenu);
  });

  elements.openUsers.addEventListener("click", () => {
    openUsersModal();
  });

  elements.openAccount.addEventListener("click", () => {
    openAccountModal();
  });

  elements.openDoctors.addEventListener("click", () => {
    openDoctorsModal();
  });

  elements.openPurchases.addEventListener("click", () => {
    openPurchasesModal();
  });

  elements.openWhatsappQuote.addEventListener("click", async () => {
    await openWhatsappQuoteModal();
  });

  elements.closeWhatsappQuote.addEventListener("click", () => {
    closeModal(elements.whatsappQuoteModal);
  });

  elements.trierConfigToggle.addEventListener("click", async () => {
    const opening = elements.trierConfigForm.classList.contains("hidden");
    elements.trierConfigForm.classList.toggle("hidden", !opening);
    elements.trierConfigMessage.textContent = "";
    if (opening) {
      try {
        const config = await window.desktopTrier.getConfig();
        elements.trierApiBaseUrl.value = config.baseUrl;
        elements.trierApiToken.value = "";
        elements.trierApiToken.placeholder = config.configured
          ? "Token salvo neste computador; preencha apenas para substituí-lo"
          : "Cole o token de integração emitido pela Trier";
        elements.trierApiToken.focus();
      } catch (error) {
        console.error("Não foi possível carregar a configuração da Trier:", error);
        elements.trierConfigMessage.textContent = error?.message || "Não foi possível carregar a configuração Trier.";
      }
    }
  });

  elements.trierConfigCancel.addEventListener("click", () => {
    elements.trierConfigForm.classList.add("hidden");
    elements.trierApiToken.value = "";
    elements.trierConfigMessage.textContent = "";
  });

  elements.trierConfigForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    elements.trierConfigSave.disabled = true;
    elements.trierConfigMessage.textContent = "Salvando a configuração protegida...";
    try {
      await window.desktopTrier.saveConfig({
        baseUrl: elements.trierApiBaseUrl.value.trim(),
        token: elements.trierApiToken.value,
      });
      elements.trierApiToken.value = "";
      elements.trierConfigMessage.textContent = "Configuração salva neste computador. Testando conexão e carregando produtos...";
      const connected = await loadTrierProducts(true, true);
      if (connected) {
        elements.trierConfigMessage.textContent = `Conexão concluída. ${state.trierProducts.length} produtos carregados e salvos neste computador.`;
        elements.trierConfigForm.classList.add("hidden");
      } else {
        elements.trierConfigMessage.textContent = state.trierSyncError
          || "A configuração foi salva, mas a API não respondeu. Confira o endereço, o token e a conexão.";
      }
    } catch (error) {
      console.error("Não foi possível salvar a configuração da Trier:", error);
      elements.trierConfigMessage.textContent = error?.message || "Não foi possível salvar a configuração da Trier.";
    } finally {
      elements.trierConfigSave.disabled = false;
    }
  });

  elements.whatsappQuoteModal.addEventListener("click", (event) => {
    if (event.target === elements.whatsappQuoteModal) closeModal(elements.whatsappQuoteModal);
  });

  if (window.desktopTrier?.onProductsUpdated) {
    window.desktopTrier.onProductsUpdated((result) => applyTrierProducts(result));
    window.desktopTrier.onSyncError?.((error) => {
      setTrierStatus("error", state.trierProducts.length ? "Sem conexão • usando última atualização" : "Confira conexão e token da Trier");
      state.trierSyncError = error?.message || "Não foi possível conectar ao estoque da Trier.";
      renderQuoteSearchResults();
    });
    loadTrierProducts(false, true);
  }

  elements.quoteProductSearch.addEventListener("input", debounce(() => {
    state.selectedQuoteProduct = null;
    elements.quoteAddProduct.disabled = true;
    elements.quoteSelectedProduct.classList.add("hidden");
    elements.quoteProductPrice.value = "";
    renderQuoteSearchResults();
  }, 120));

  elements.quoteProductSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    renderQuoteSearchResults();
    const firstResult = elements.quoteSearchResults.querySelector("[data-trier-product-index]");
    if (firstResult) selectQuoteProduct(state.trierProducts[Number(firstResult.dataset.trierProductIndex)]);
  });

  elements.quoteSearchResults.addEventListener("click", (event) => {
    const option = event.target.closest("[data-trier-product-index]");
    if (!option) return;
    selectQuoteProduct(state.trierProducts[Number(option.dataset.trierProductIndex)]);
  });

  elements.quoteProductForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addSelectedProductToQuote();
  });

  elements.quoteItems.addEventListener("change", (event) => {
    const input = event.target.closest("[data-quote-item-action]");
    if (!input || input.dataset.quoteItemAction === "remove") return;
    const itemId = input.closest("[data-quote-item-id]")?.dataset.quoteItemId;
    const item = state.whatsappQuoteItems.find((entry) => entry.id === itemId);
    if (!item) return;
    if (input.dataset.quoteItemAction === "quantity") {
      const quantity = Number(input.value);
      item.quantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
    } else if (input.dataset.quoteItemAction === "price") {
      const price = parseNumberValue(input.value);
      item.price = price !== null && price >= 0 ? price : item.price;
    }
    renderWhatsappQuote();
  });

  elements.quoteItems.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-quote-item-action='remove']");
    if (!removeButton) return;
    const itemId = removeButton.closest("[data-quote-item-id]")?.dataset.quoteItemId;
    state.whatsappQuoteItems = state.whatsappQuoteItems.filter((item) => item.id !== itemId);
    renderWhatsappQuote();
  });

  elements.clearWhatsappQuote.addEventListener("click", () => {
    if (!state.whatsappQuoteItems.length) return;
    if (!window.confirm("Deseja limpar todos os itens deste orçamento?")) return;
    state.whatsappQuoteItems = [];
    elements.quoteCustomerName.value = "";
    resetQuoteProductSelection();
    renderWhatsappQuote();
  });

  elements.copyWhatsappQuote.addEventListener("click", async () => {
    if (!state.whatsappQuoteItems.length) return;
    try {
      await copyChatMessage(buildWhatsappQuoteMessage());
      showToast("Mensagem do orçamento copiada.");
    } catch (error) {
      console.error("Erro ao copiar orçamento:", error);
      showToast("Não foi possível copiar o orçamento.");
    }
  });

  elements.sendWhatsappQuote.addEventListener("click", () => {
    if (!state.whatsappQuoteItems.length) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsappQuoteMessage())}`, "_blank", "noopener");
  });

  elements.closePurchases.addEventListener("click", () => {
    closeModal(elements.purchasesModal);
  });

  elements.purchasesTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.purchasesTab;
      setPurchasesTab(tabName);
      setTimeout(() => {
        (tabName === "orders" ? elements.orderName : elements.shortageProduct).focus();
      }, 0);
    });
  });

  elements.shortageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createPurchaseShortage();
  });

  elements.orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createPurchaseOrder();
  });

  elements.orderPhone.addEventListener("input", () => {
    elements.orderPhone.value = formatPurchasePhone(elements.orderPhone.value);
  });

  elements.shortagesList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-purchase-action]");
    if (button?.dataset.purchaseAction === "remove-shortage") {
      await removePurchaseRecord("shortage", button.dataset.purchaseId);
    }
  });

  elements.ordersList.addEventListener("change", async (event) => {
    const button = event.target.closest("[data-purchase-action]");
    if (!button) return;
    const { purchaseAction, purchaseId } = button.dataset;
    if (purchaseAction === "condition" || purchaseAction === "situation") {
      await updatePurchaseOrderStatus(purchaseId, purchaseAction, button.value);
    }
  });

  elements.ordersList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-purchase-action='remove-order']");
    if (button) await removePurchaseRecord("order", button.dataset.purchaseId);
  });

  elements.closePricing.addEventListener("click", () => {
    closeModal(elements.pricingModal);
  });

  elements.pricingTabsToggle.addEventListener("click", () => {
    const willOpen = elements.pricingTabsMenu.classList.contains("hidden");
    elements.pricingTabsMenu.classList.toggle("hidden", !willOpen);
    elements.pricingTabsToggle.setAttribute("aria-expanded", String(willOpen));
  });

  elements.pricingTabsMenu.addEventListener("click", async (event) => {
    const tabId = event.target.closest("[data-pricing-tab-id]")?.getAttribute("data-pricing-tab-id");
    if (tabId) await switchPricingTab(tabId);
  });

  elements.pricingNewTab.addEventListener("click", async () => {
    await createPricingTab();
  });

  elements.pricingSaveScreen.addEventListener("click", async () => {
    await savePricingSettings();
  });

  elements.closeServiceModal.addEventListener("click", () => {
    closeModal(elements.serviceModal);
  });

  elements.closeMedicines.addEventListener("click", () => {
    closeModal(elements.medicinesModal);
  });

  elements.closeChat.addEventListener("click", () => {
    closeModal(elements.chatModal);
  });

  elements.closeUsers.addEventListener("click", () => {
    closeUsersModal();
  });

  elements.closeAccount.addEventListener("click", () => {
    closeModal(elements.accountModal);
  });

  elements.closeDoctors.addEventListener("click", () => {
    closeDoctorsModal();
  });

  elements.closeOfferSheet.addEventListener("click", () => {
    closeModal(elements.offerSheetModal);
  });

  elements.closeOnlineOffers.addEventListener("click", () => {
    closeModal(elements.onlineOffersModal);
  });

  elements.supabasePublisherLogin.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.supabasePublisherLogin.reportValidity()) return;
    await connectSupabasePublisher(
      elements.supabasePublisherEmail.value.trim(),
      elements.supabasePublisherPassword.value,
    );
  });

  elements.supabasePublisherDisconnect.addEventListener("click", async () => {
    await disconnectSupabasePublisher();
  });

  elements.onlineOfferImages.addEventListener("change", async () => {
    await addOnlineOfferFiles(elements.onlineOfferImages.files);
  });

  elements.onlineOffersAddMore.addEventListener("click", () => {
    elements.onlineOfferImages.click();
  });

  elements.onlineOffersCancelEdit.addEventListener("click", () => {
    cancelOnlineOfferEdit();
  });

  elements.onlineOffersSelection.addEventListener("click", (event) => {
    const card = event.target.closest("[data-online-file-id]");
    const action = event.target.closest("[data-online-file-action]")?.dataset.onlineFileAction;
    if (!card || !action) return;
    if (action === "left") moveOnlineOfferFile(card.dataset.onlineFileId, -1);
    if (action === "right") moveOnlineOfferFile(card.dataset.onlineFileId, 1);
    if (action === "remove") removeOnlineOfferFile(card.dataset.onlineFileId);
  });

  elements.onlineOffersSelection.addEventListener("change", (event) => {
    const position = event.target.closest("[data-online-file-position]");
    const card = event.target.closest("[data-online-file-id]");
    if (!position || !card) return;
    moveOnlineOfferFileTo(card.dataset.onlineFileId, Number(position.value));
  });

  elements.onlineOffersForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await publishOnlineOffer();
  });

  elements.refreshOnlineOffers.addEventListener("click", async () => {
    await checkOnlinePublishingServices();
    await loadPublishedOnlineOffers();
  });

  elements.onlineOffersList.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-online-offer-id]");
    const action = event.target.closest("[data-online-offer-action]")?.dataset.onlineOfferAction;
    if (!card || !action) return;
    const offer = state.publishedOffers.find((item) => item.id === card.dataset.onlineOfferId);
    if (!offer) return;
    if (action === "edit") await editOnlineOffer(offer);
    if (action === "copy") await copyPublicOfferLink(offer);
    if (action === "whatsapp") sharePublicOfferOnWhatsApp(offer);
    if (action === "deactivate") await deactivateOnlineOffer(offer);
    if (action === "delete") await deleteOnlineOffer(offer);
  });

  elements.openSavedOfferArts.addEventListener("click", async () => {
    openModal(elements.savedOfferArtsModal);
    await refreshSavedOfferArts();
  });

  elements.closeSavedOfferArts.addEventListener("click", () => closeModal(elements.savedOfferArtsModal));
  elements.closeOfferArtName.addEventListener("click", () => closeModal(elements.offerArtNameModal));
  elements.cancelOfferArtName.addEventListener("click", () => closeModal(elements.offerArtNameModal));

  elements.saveOfferArt.addEventListener("click", async () => {
    await refreshSavedOfferArts();
    openOfferArtNameDialog("save");
  });

  elements.offerArtNameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!elements.offerArtNameForm.reportValidity()) return;
    await submitOfferArtName();
  });

  elements.savedOfferArtList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-art-id]");
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!row || !action) return;
    const art = state.savedOfferArts.find((item) => item.id === row.dataset.artId);
    if (action === "rename") {
      openOfferArtNameDialog("rename", row.dataset.artId);
      return;
    }
    if (action === "open") applySavedOfferArt(art);
  });

  elements.offerSheetForm.addEventListener("input", () => {
    elements.offerDiscountPrice.setCustomValidity("");
    renderOfferSheetPreview();
  });

  function positionOfferSettingsPanel(details) {
    if (!details.open) return;
    const panel = details.querySelector(".offer-style-palette-panel");
    if (!panel) return;
    panel.style.top = "";
    panel.style.bottom = "";
    panel.style.left = "";
    panel.style.right = "0px";
    const panelRect = panel.getBoundingClientRect();
    const targetLeft = Math.max(8, Math.min(panelRect.left, window.innerWidth - panelRect.width - 8));
    const targetTop = Math.max(8, Math.min(panelRect.top, window.innerHeight - panelRect.height - 8));
    const detailsRect = details.getBoundingClientRect();
    panel.style.right = "auto";
    panel.style.left = `${details.clientWidth - panelRect.width + targetLeft - panelRect.left}px`;
    panel.style.bottom = "auto";
    panel.style.top = `${targetTop - detailsRect.top}px`;
  }

  const offerFieldSettings = [...elements.offerSheetForm.querySelectorAll(".offer-field-settings")];
  offerFieldSettings.forEach((details) => {
    details.addEventListener("toggle", () => positionOfferSettingsPanel(details));
  });
  document.addEventListener("pointerdown", (event) => {
    offerFieldSettings.forEach((details) => {
      if (details.open && !details.contains(event.target)) details.open = false;
    });
  });
  elements.offerSheetForm.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    offerFieldSettings.forEach((details) => {
      details.open = false;
    });
  });
  window.addEventListener("resize", () => offerFieldSettings.forEach(positionOfferSettingsPanel));

  [elements.offerOriginalPrice, elements.offerDiscountPrice].forEach((input) => {
    input.addEventListener("blur", () => {
      const amount = parseNumberValue(input.value);
      if (amount !== null) input.value = formatDecimalInput(amount);
      renderOfferSheetPreview();
    });
  });

  elements.offerImageInput.addEventListener("change", () => {
    loadOfferImage(elements.offerImageInput.files?.[0]);
  });

  elements.offerImagePicker.addEventListener("dragover", (event) => {
    event.preventDefault();
    elements.offerImagePicker.classList.add("is-dragging");
  });

  elements.offerImagePicker.addEventListener("dragleave", () => {
    elements.offerImagePicker.classList.remove("is-dragging");
  });

  elements.offerImagePicker.addEventListener("drop", (event) => {
    event.preventDefault();
    elements.offerImagePicker.classList.remove("is-dragging");
    loadOfferImage(event.dataTransfer?.files?.[0]);
  });

  elements.removeOfferImage.addEventListener("click", clearOfferImage);

  elements.offerBackgroundButton.addEventListener("click", toggleOfferImageBackground);

  elements.offerImageTab.addEventListener("click", () => setOfferAdjustmentPanel("image"));
  elements.offerShadowTab.addEventListener("click", () => setOfferAdjustmentPanel("shadow"));

  elements.offerImageZoom.addEventListener("input", () => {
    setOfferImageZoom(elements.offerImageZoom.value);
  });

  elements.offerImageZoomOut.addEventListener("click", () => {
    setOfferImageZoom(state.offerImageZoom - 5);
  });

  elements.offerImageZoomIn.addEventListener("click", () => {
    setOfferImageZoom(state.offerImageZoom + 5);
  });

  elements.offerImageZoomReset.addEventListener("click", () => {
    setOfferImageZoom(100);
  });

  elements.offerImageMoveUp.addEventListener("click", () => moveOfferImage(0, -8));
  elements.offerImageMoveDown.addEventListener("click", () => moveOfferImage(0, 8));
  elements.offerImageMoveLeft.addEventListener("click", () => moveOfferImage(-8, 0));
  elements.offerImageMoveRight.addEventListener("click", () => moveOfferImage(8, 0));
  elements.offerImagePositionReset.addEventListener("click", resetOfferImagePosition);

  elements.offerShadowZoom.addEventListener("input", () => {
    setOfferShadowZoom(elements.offerShadowZoom.value);
  });
  elements.offerShadowZoomOut.addEventListener("click", () => setOfferShadowZoom(state.offerShadowZoom - 5));
  elements.offerShadowZoomIn.addEventListener("click", () => setOfferShadowZoom(state.offerShadowZoom + 5));
  elements.offerShadowZoomReset.addEventListener("click", () => setOfferShadowZoom(100));
  elements.offerShadowHeight.addEventListener("input", () => {
    setOfferShadowHeight(elements.offerShadowHeight.value);
  });
  elements.offerShadowHeightOut.addEventListener("click", () => setOfferShadowHeight(state.offerShadowHeight - 5));
  elements.offerShadowHeightIn.addEventListener("click", () => setOfferShadowHeight(state.offerShadowHeight + 5));
  elements.offerShadowHeightReset.addEventListener("click", () => setOfferShadowHeight(100));
  elements.offerShadowMoveUp.addEventListener("click", () => moveOfferShadow(0, -8));
  elements.offerShadowMoveDown.addEventListener("click", () => moveOfferShadow(0, 8));
  elements.offerShadowMoveLeft.addEventListener("click", () => moveOfferShadow(-8, 0));
  elements.offerShadowMoveRight.addEventListener("click", () => moveOfferShadow(8, 0));
  elements.offerShadowPositionReset.addEventListener("click", resetOfferShadowPosition);

  elements.offerTitleBandMoveUp.addEventListener("click", () => moveOfferTitleBand(0, -8));
  elements.offerTitleBandMoveDown.addEventListener("click", () => moveOfferTitleBand(0, 8));
  elements.offerTitleBandMoveLeft.addEventListener("click", () => moveOfferTitleBand(-8, 0));
  elements.offerTitleBandMoveRight.addEventListener("click", () => moveOfferTitleBand(8, 0));
  elements.offerTitleBandPositionReset.addEventListener("click", resetOfferTitleBandPosition);

  elements.offerTopMoveUp.addEventListener("click", () => moveOfferElementPosition("offerTopTextPositionX", "offerTopTextPositionY", 0, -8));
  elements.offerTopMoveDown.addEventListener("click", () => moveOfferElementPosition("offerTopTextPositionX", "offerTopTextPositionY", 0, 8));
  elements.offerTopMoveLeft.addEventListener("click", () => moveOfferElementPosition("offerTopTextPositionX", "offerTopTextPositionY", -8, 0));
  elements.offerTopMoveRight.addEventListener("click", () => moveOfferElementPosition("offerTopTextPositionX", "offerTopTextPositionY", 8, 0));
  elements.offerTopPositionReset.addEventListener("click", () => resetOfferElementPosition("offerTopTextPositionX", "offerTopTextPositionY"));

  elements.offerNameMoveUp.addEventListener("click", () => moveOfferElementPosition("offerNamePositionX", "offerNamePositionY", 0, -8));
  elements.offerNameMoveDown.addEventListener("click", () => moveOfferElementPosition("offerNamePositionX", "offerNamePositionY", 0, 8));
  elements.offerNameMoveLeft.addEventListener("click", () => moveOfferElementPosition("offerNamePositionX", "offerNamePositionY", -8, 0));
  elements.offerNameMoveRight.addEventListener("click", () => moveOfferElementPosition("offerNamePositionX", "offerNamePositionY", 8, 0));
  elements.offerNamePositionReset.addEventListener("click", () => resetOfferElementPosition("offerNamePositionX", "offerNamePositionY"));

  elements.offerDescriptionMoveUp.addEventListener("click", () => moveOfferElementPosition("offerDescriptionPositionX", "offerDescriptionPositionY", 0, -8));
  elements.offerDescriptionMoveDown.addEventListener("click", () => moveOfferElementPosition("offerDescriptionPositionX", "offerDescriptionPositionY", 0, 8));
  elements.offerDescriptionMoveLeft.addEventListener("click", () => moveOfferElementPosition("offerDescriptionPositionX", "offerDescriptionPositionY", -8, 0));
  elements.offerDescriptionMoveRight.addEventListener("click", () => moveOfferElementPosition("offerDescriptionPositionX", "offerDescriptionPositionY", 8, 0));
  elements.offerDescriptionPositionReset.addEventListener("click", () => resetOfferElementPosition("offerDescriptionPositionX", "offerDescriptionPositionY"));

  elements.offerOriginalMoveUp.addEventListener("click", () => moveOfferElementPosition("offerOriginalPricePositionX", "offerOriginalPricePositionY", 0, -8));
  elements.offerOriginalMoveDown.addEventListener("click", () => moveOfferElementPosition("offerOriginalPricePositionX", "offerOriginalPricePositionY", 0, 8));
  elements.offerOriginalMoveLeft.addEventListener("click", () => moveOfferElementPosition("offerOriginalPricePositionX", "offerOriginalPricePositionY", -8, 0));
  elements.offerOriginalMoveRight.addEventListener("click", () => moveOfferElementPosition("offerOriginalPricePositionX", "offerOriginalPricePositionY", 8, 0));
  elements.offerOriginalPositionReset.addEventListener("click", () => resetOfferElementPosition("offerOriginalPricePositionX", "offerOriginalPricePositionY"));
  elements.offerDiscountMoveUp.addEventListener("click", () => moveOfferElementPosition("offerDiscountPricePositionX", "offerDiscountPricePositionY", 0, -8));
  elements.offerDiscountMoveDown.addEventListener("click", () => moveOfferElementPosition("offerDiscountPricePositionX", "offerDiscountPricePositionY", 0, 8));
  elements.offerDiscountMoveLeft.addEventListener("click", () => moveOfferElementPosition("offerDiscountPricePositionX", "offerDiscountPricePositionY", -8, 0));
  elements.offerDiscountMoveRight.addEventListener("click", () => moveOfferElementPosition("offerDiscountPricePositionX", "offerDiscountPricePositionY", 8, 0));
  elements.offerDiscountPositionReset.addEventListener("click", () => resetOfferElementPosition("offerDiscountPricePositionX", "offerDiscountPricePositionY"));

  elements.offerResizeOptions.addEventListener("click", (event) => {
    const option = event.target.closest("[data-offer-format]");
    if (!option || !OFFER_CANVAS_FORMATS[option.dataset.offerFormat]) return;
    state.offerCanvasFormat = option.dataset.offerFormat;
    elements.offerResizeMenu.open = false;
    renderOfferSheetPreview();
  });

  elements.offerStockToggle.addEventListener("click", () => {
    state.offerStockMessageEnabled = !state.offerStockMessageEnabled;
    renderOfferSheetPreview();
  });

  elements.clearOfferSheet.addEventListener("click", () => {
    resetOfferSheet();
    elements.offerProductName.focus();
  });

  elements.offerSheetForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateOfferPrices() || !elements.offerSheetForm.reportValidity()) return;
    openOfferSheetPrintWindow();
  });

  elements.saveOfferPdf.addEventListener("click", () => {
    if (!validateOfferPrices() || !elements.offerSheetForm.reportValidity()) return;
    openOfferSheetPrintWindow("pdf");
  });

  elements.doctorLookupContinue.addEventListener("click", () => {
    closeModal(elements.doctorLookupModal);
  });

  elements.pricingAddTax.addEventListener("click", () => {
    appendPricingRow("tax");
  });

  elements.pricingAddFixedCost.addEventListener("click", () => {
    appendPricingRow("fixed");
  });

  elements.pricingSettingsForm.addEventListener("input", () => {
    refreshPricingDraftSummary();
  });

  elements.pricingSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await savePricingSettings();
  });

  [elements.pricingProductCost, elements.pricingProductName, elements.pricingProductSku].forEach((input) => {
    input.addEventListener("input", () => {
      renderPricingProductResults();
    });
  });

  elements.pricingSalePrice.addEventListener("input", () => {
    state.pricingFormSource = "salePrice";
    renderPricingProductResults();
  });

  elements.pricingTargetProfit.addEventListener("input", () => {
    state.pricingFormSource = "targetProfit";
    renderPricingProductResults();
  });

  elements.pricingCardMethod.addEventListener("change", () => {
    renderPricingProductResults();
  });

  elements.pricingProductForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await savePricingProduct();
  });

  elements.pricingCancelEdit.addEventListener("click", () => {
    resetPricingProductForm();
  });

  [elements.pricingTaxList, elements.pricingFixedList].forEach((container) => {
    container.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-pricing-remove]");
      if (!removeButton) return;

      const row = removeButton.closest("[data-pricing-row]");
      row?.remove();
      state.pricingSettings = readPricingSettingsForm();
      renderPricingSettingsForm();
      renderPricingProductResults();
    });
  });

  [elements.pricingTaxList, elements.pricingFixedList].forEach((container) => {
    container.addEventListener("input", () => {
      refreshPricingDraftSummary();
    });
  });

  elements.pricingProductsList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-pricing-action]");
    if (!actionButton) return;

    const productId = actionButton.getAttribute("data-pricing-product-id");
    const action = actionButton.getAttribute("data-pricing-action");
    if (!productId || !action) return;

    if (action === "edit") {
      openPricingEditor(productId);
      return;
    }

    if (action === "remove") {
      deletePricingProduct(productId);
    }
  });

  elements.searchDoctorByRegistry.addEventListener("click", () => {
    lookupPrescriberByRegistry();
  });

  elements.serviceContinue.addEventListener("click", () => {
    const selectedPatientId = elements.servicePatient.value;
    if (!selectedPatientId) {
      showToast("Selecione um cliente.");
      return;
    }

    state.currentServicePatientId = selectedPatientId;
    if (elements.servicePatientResults) {
      elements.servicePatientResults.innerHTML = "";
      elements.servicePatientResults.classList.add("hidden");
    }
    renderServiceLauncher(selectedPatientId);
    elements.servicePatientResults?.classList.add("hidden");
  });

  elements.serviceChange.addEventListener("click", () => {
    state.currentServicePatientId = "";
    if (elements.servicePatientSearch) {
      elements.servicePatientSearch.value = "";
      elements.servicePatientSearch.focus();
    }
    renderServiceLauncher("");
  });

  elements.servicePatientSearch?.addEventListener("input", debounce(() => {
    const currentSelection = elements.servicePatient.value;
    renderServicePatients(currentSelection, elements.servicePatientSearch.value);

    const optionStillExists = Array.from(elements.servicePatient.options)
      .some((option) => option.value === currentSelection);

    elements.servicePatient.value = optionStillExists ? currentSelection : "";
    elements.serviceContinue.disabled = !elements.servicePatient.value;
  }));

  elements.servicePatientResults?.addEventListener("click", (event) => {
    const option = event.target.closest("[data-service-patient-option]");
    if (!option) return;

    const patientId = option.getAttribute("data-service-patient-option");
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) return;

    elements.servicePatient.value = patientId;
    elements.servicePatientSearch.value = patient.name;
    elements.serviceContinue.disabled = false;
    elements.servicePatientResults.classList.add("hidden");
    renderServiceLauncher(patientId);
  });

  elements.servicePatient.addEventListener("change", () => {
    elements.serviceContinue.disabled = !elements.servicePatient.value;
    renderServiceLauncher(elements.servicePatient.value);
  });

  elements.doctorsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createDoctorFromForm();
  });

  elements.doctorsList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-doctor-action='remove']");
    if (!button) return;

    const doctorId = button.getAttribute("data-doctor-id");
    if (!doctorId) return;

    deleteDoctor(doctorId);
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await login(elements.loginIdentifier.value, elements.loginPassword.value);
  });

  elements.usersForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await createUserFromForm();
  });

  elements.cancelUserEdit.addEventListener("click", () => {
    resetUsersForm();
  });

  elements.closeDetail.addEventListener("click", () => {
    closeModal(elements.patientDetailModal);
  });

  elements.closeHistory.addEventListener("click", () => {
    closeModal(elements.historyModal);
  });

  [elements.historyStartDate, elements.historyEndDate].forEach((field) => {
    field.addEventListener("change", () => {
      if (state.currentHistoryPatientId) {
        openHistoryModal(state.currentHistoryPatientId, { resetFilters: false });
      }
    });
  });

  elements.historyFull.addEventListener("click", () => {
    elements.historyStartDate.value = "";
    elements.historyEndDate.value = "";
    if (state.currentHistoryPatientId) {
      openHistoryModal(state.currentHistoryPatientId, { resetFilters: false });
    }
  });

  elements.closeBio.addEventListener("click", () => {
    closeModal(elements.bioModal);
  });

  elements.closeClinical.addEventListener("click", () => {
    closeModal(elements.clinicalModal);
  });

  elements.clinicalCancel.addEventListener("click", () => {
    closeModal(elements.clinicalModal);
  });

  [elements.patientModal, elements.patientsModal, elements.serviceModal, elements.historyModal, elements.usersModal, elements.registerModal, elements.doctorsModal, elements.doctorLookupModal, elements.purchasesModal, elements.pricingModal, elements.onlineOffersModal, elements.offerSheetModal, elements.savedOfferArtsModal, elements.offerArtNameModal, elements.medicinesModal, elements.chatModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  elements.patientDetailModal.addEventListener("click", (event) => {
    if (event.target === elements.patientDetailModal) {
      closeModal(elements.patientDetailModal);
    }
  });

  elements.historyModal.addEventListener("click", (event) => {
    const recipeButton = event.target.closest("[data-history-action='recipe']");
    if (recipeButton) {
      const recordId = recipeButton.getAttribute("data-record-id");
      const record = state.clinicalRecords.find((item) => item.id === recordId) || state.bioRecords.find((item) => item.id === recordId);
      const patient = state.patients.find((item) => item.id === state.currentHistoryPatientId);
      if (record && patient) openServicePrintWindow(record, patient);
      return;
    }
    const deleteButton = event.target.closest("[data-history-action='delete']");
    if (deleteButton) {
      const recordId = deleteButton.getAttribute("data-record-id");
      const record = state.clinicalRecords.find((item) => item.id === recordId) || state.bioRecords.find((item) => item.id === recordId);
      if (!record) {
        showToast("Atendimento não encontrado.");
        return;
      }

      const serviceLabel = getServiceLabel(record);
      const confirmed = window.confirm(`Deseja excluir o atendimento de ${serviceLabel} em ${formatDateTime(getHistoryDateTime(record))}?`);
      if (!confirmed) {
        return;
      }

      deleteHistoryRecord(recordId)
        .then((deleted) => {
          if (!deleted) {
            showToast("Atendimento não encontrado.");
            return;
          }
          openHistoryModal(state.currentHistoryPatientId, { resetFilters: false });
          renderDashboard();
          renderPatientsList();
          renderPatientManagement();
          showToast("Atendimento excluido com sucesso.");
        })
        .catch((error) => {
          console.error("Erro ao excluir atendimento:", error);
          showToast(getFirebaseMessage(error));
        });
      return;
    }
    if (event.target === elements.historyModal) {
      closeModal(elements.historyModal);
    }
  });

  elements.patientsModal.addEventListener("click", (event) => {
    if (event.target === elements.patientsModal) closeModal(elements.patientsModal);
  });

  elements.usersModal.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-user-action='edit']");
    const removeButton = event.target.closest("[data-user-action='remove']");
    if (editButton) {
      const userId = editButton.getAttribute("data-user-id");
      const user = state.users.find((item) => item.id === userId);
      if (user) fillUsersForm(user);
      return;
    }
    if (removeButton) {
      const userId = removeButton.getAttribute("data-user-id");
      deleteUser(userId);
      return;
    }

    if (event.target === elements.usersModal) {
      closeUsersModal();
    }
  });

  elements.registerModal.addEventListener("click", (event) => {
    if (event.target === elements.registerModal) {
      closeModal(elements.registerModal);
    }
  });

  elements.accountModal.addEventListener("click", (event) => {
    if (event.target === elements.accountModal) {
      closeModal(elements.accountModal);
    }
  });

  elements.bioModal.addEventListener("click", (event) => {
    if (event.target === elements.bioModal) {
      closeModal(elements.bioModal);
    }
  });

  elements.clinicalModal.addEventListener("click", (event) => {
    if (event.target === elements.clinicalModal) {
      closeModal(elements.clinicalModal);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCustomDatePicker();
      setSidebarOpen(false);
      closeModal(elements.patientModal);
      closeModal(elements.serviceModal);
      closeModal(elements.usersModal);
      closeModal(elements.accountModal);
      closeModal(elements.doctorsModal);
      closeModal(elements.doctorLookupModal);
      closeModal(elements.whatsappQuoteModal);
      closeModal(elements.pricingModal);
      closeModal(elements.onlineOffersModal);
      closeModal(elements.offerSheetModal);
      closeModal(elements.savedOfferArtsModal);
      closeModal(elements.offerArtNameModal);
      closeModal(elements.patientsModal);
      closeModal(elements.patientDetailModal);
      closeModal(elements.historyModal);
      closeModal(elements.registerModal);
      closeModal(elements.bioModal);
      closeModal(elements.clinicalModal);
      closeModal(elements.medicinesModal);
      closeModal(elements.chatModal);
    }
  });

  window.addEventListener("resize", () => {
    if (!state.activeDateInputId) return;
    const activeInput = document.getElementById(state.activeDateInputId);
    if (activeInput) {
      positionCustomDatePicker(activeInput);
    }
  });

  window.addEventListener("scroll", () => {
    if (!state.activeDateInputId) return;
    const activeInput = document.getElementById(state.activeDateInputId);
    if (activeInput) {
      positionCustomDatePicker(activeInput);
    }
  }, true);

  elements.searchInput?.addEventListener("input", debounce((event) => {
    state.search = event.target.value;
    renderPatients();
    updateSidebarState();
  }));

  elements.patientForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(elements.patientForm);
    const patientData = {
      name: formData.get("name").trim(),
      cpf: formData.get("cpf").trim(),
      birthDate: formData.get("birthDate"),
      sex: formData.get("sex"),
      phone: formData.get("phone").trim(),
      email: formData.get("email").trim(),
      address: formData.get("address").trim(),
    };

    try {
      if (state.editingPatientId) {
        const patient = state.patients.find((item) => item.id === state.editingPatientId);
        if (patient) {
          Object.assign(patient, patientData);
          await upsertDocument(FIRESTORE_COLLECTIONS.patients, patient);
        }
        showToast("Paciente atualizado com sucesso.");
      } else {
        const patient = {
          id: crypto.randomUUID(),
          ...patientData,
          createdAt: new Date().toISOString(),
        };
        state.patients.unshift(patient);
        await upsertDocument(FIRESTORE_COLLECTIONS.patients, patient);
        showToast("Paciente cadastrado com sucesso.");
      }
      state.editingPatientId = "";
      refresh();
      closeModal(elements.patientModal);
      if (!elements.patientsModal.classList.contains("hidden")) renderPatientManagement();
    } catch (error) {
      console.error("Erro ao salvar paciente:", error);
      showToast(getFirebaseMessage(error));
    }
  });

  elements.patientsTable.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='service']");
    const detailsButton = event.target.closest("[data-action='details']");
    const historyButton = event.target.closest("[data-action='history']");

    if (detailsButton) {
      openPatientDetail(detailsButton.getAttribute("data-patient-id"));
      return;
    }

    if (historyButton) {
      openHistoryModal(historyButton.getAttribute("data-patient-id"));
      return;
    }

    if (!button) return;

    openServiceLauncher(button.getAttribute("data-patient-id"));
  });

  elements.patientDetailModal.addEventListener("click", (event) => {
    const serviceButton = event.target.closest("[data-service]");
    if (!serviceButton) return;

    const service = serviceButton.getAttribute("data-service");
    if (service === "Bioimpedância") {
      closeModal(elements.patientDetailModal);
      openBioModal(state.currentBioPatientId || state.patients[0]?.id);
      return;
    }

    if (service === "Pressão Arterial") {
      closeModal(elements.patientDetailModal);
      openClinicalModal(state.currentBioPatientId || state.patients[0]?.id, "pressure");
      return;
    }

    if (service === "Glicemia") {
      closeModal(elements.patientDetailModal);
      openClinicalModal(state.currentBioPatientId || state.patients[0]?.id, "glucose");
      return;
    }

    if (service === "Injetáveis") {
      closeModal(elements.patientDetailModal);
      openClinicalModal(state.currentBioPatientId || state.patients[0]?.id, "injectable");
      return;
    }

    if (service === "Consulta Farmacêutica") {
      closeModal(elements.patientDetailModal);
      openClinicalModal(state.currentBioPatientId || state.patients[0]?.id, "consultation");
      return;
    }

    if (service === "Curativos") {
      closeModal(elements.patientDetailModal);
      openClinicalModal(state.currentBioPatientId || state.patients[0]?.id, "dressings");
      return;
    }

    showToast(`Abrindo ${service}.`);
  });

  setupSignaturePad(elements.professionalSignatureCanvas, "injectable-professional-signature");
  setupSignaturePad(elements.patientSignatureCanvas, "injectable-patient-signature");
  initializeCustomDatePicker();
  elements.injectableHasNextDose?.addEventListener("change", syncInjectableNextDoseFields);
  syncInjectableNextDoseFields();

  document.addEventListener("click", (event) => {
    const clearButton = event.target.closest("[data-clear-signature]");
    if (clearButton) {
      const inputId = clearButton.getAttribute("data-clear-signature");
      const canvas = document.getElementById(`${inputId}-canvas`);
      clearSignaturePad(canvas, inputId);
      return;
    }

    if (
      state.activeDateInputId
      && !event.target.closest(".custom-date-picker")
      && !event.target.closest(".custom-date-input")
    ) {
      closeCustomDatePicker();
    }
  });

  elements.bioPrev.addEventListener("click", () => {
    state.currentBioStep = Math.max(1, state.currentBioStep - 1);
    renderBioStepper();
  });

  elements.bioNext.addEventListener("click", () => {
    state.currentBioStep = Math.min(4, state.currentBioStep + 1);
    renderBioStepper();
  });

  elements.bioInterpret.addEventListener("click", () => {
    elements.bioResultCard.textContent = calculateBioInterpretation();
    elements.bioResult.classList.remove("hidden");
    state.currentBioStep = 4;
    renderBioStepper();
  });

  async function saveBioEntry({ printAfterSave = false, printWindow = null } = {}) {
    const patientId = state.currentBioPatientId;
    const patient = state.patients.find((item) => item.id === patientId);
    if (!patient) {
      printWindow?.close();
      showToast("Paciente não encontrado.");
      return null;
    }

    if (!elements.bioForm.checkValidity()) {
      printWindow?.close();
      elements.bioForm.reportValidity();
      showToast("Preencha os campos obrigatorios do atendimento.");
      return null;
    }

    const record = {
      id: crypto.randomUUID(),
      patientId,
      date: normalizeDateValue(elements.bioDate.value),
      time: elements.bioTime.value,
      eligibility: elements.bioForm.querySelector("input[name='eligibility']:checked")?.value || "Apto",
      eligibilityNote: getBioFieldValue("bio-eligibility-note"),
      weight: getBioFieldValue("bio-weight"),
      height: getBioFieldValue("bio-height"),
      age: getBioFieldValue("bio-age"),
      sex: getBioFieldValue("bio-sex"),
      waist: getBioFieldValue("bio-waist"),
      neck: getBioFieldValue("bio-neck"),
      hip: getBioFieldValue("bio-hip"),
      activity: getBioFieldValue("bio-activity"),
      bodyFat: getBioFieldValue("bio-body-fat"),
      skeletalMuscle: getBioFieldValue("bio-skeletal-muscle"),
      basalMetabolism: getBioFieldValue("bio-basal"),
      visceralFat: getBioFieldValue("bio-visceral-fat"),
      bodyAge: getBioFieldValue("bio-body-age"),
      observations: getBioFieldValue("bio-observations"),
      createdAt: new Date().toISOString(),
    };

    try {
      await persistBioRecord(record);
      refresh();
      closeModal(elements.bioModal);
      if (printAfterSave) {
        openServicePrintWindow(record, patient, printWindow);
        showToast("Receita pronta para impressão.");
      } else {
        showToast("Bioimpedância salva.");
      }
      return record;
    } catch (error) {
      printWindow?.close();
      console.error("Erro ao salvar bioimpedancia:", error);
      showToast(getFirebaseMessage(error));
      return null;
    }
  }

  elements.bioForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveBioEntry();
  });

  elements.bioSavePrint.addEventListener("click", async () => {
    const printWindow = preparePrintWindow();
    await saveBioEntry({ printAfterSave: true, printWindow });
  });

    elements.serviceModal.addEventListener("click", (event) => {
    const serviceButton = event.target.closest("[data-service]");
    if (!serviceButton) return;

    const service = serviceButton.getAttribute("data-service");
    const patientId = state.currentServicePatientId || elements.servicePatient.value;

    if (!patientId) {
      showToast("Selecione um cliente antes de abrir o serviço.");
      return;
    }

    closeModal(elements.serviceModal);

    if (service === "Bioimpedância") {
      openBioModal(patientId);
      return;
    }

    if (service === "Pressão Arterial") {
      openClinicalModal(patientId, "pressure");
      return;
    }

    if (service === "Glicemia") {
      openClinicalModal(patientId, "glucose");
      return;
    }

    if (service === "Injetáveis") {
      openClinicalModal(patientId, "injectable");
      return;
    }

    if (service === "Consulta Farmacêutica") {
      openClinicalModal(patientId, "consultation");
      return;
    }

    if (service === "Curativos") {
      openClinicalModal(patientId, "dressings");
      return;
    }

    showToast(`Abrindo ${service}.`);
  });

  elements.clinicalSaveBack.addEventListener("click", async () => {
    await saveClinicalEntry();
  });

  elements.clinicalSavePrint.addEventListener("click", async () => {
    const printWindow = preparePrintWindow();
    await saveClinicalEntry({ printAfterSave: true, printWindow });
  });

  elements.clinicalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveClinicalEntry();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".report-service-picker")) {
      elements.reportServicesMenu.classList.add("hidden");
    }
    if (!state.sidebarOpen) return;
    const clickedInsideSidebar = event.target.closest(".sidebar");
    if (!clickedInsideSidebar) {
      setSidebarOpen(false);
    }
  });

  if (supabaseClient) {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) state.supabaseConnectionError = getSupabasePublishingMessage(error);
    state.supabaseSession = data?.session || null;
    supabaseClient.auth.onAuthStateChange((_event, session) => {
      state.supabaseSession = session || null;
      state.onlineBackendReady = false;
      state.onlineBackendChecked = false;
      if (session) state.supabaseConnectionError = "";
      renderOnlineOffersAvailability();
      window.setTimeout(async () => {
        if (!elements.onlineOffersModal.classList.contains("hidden")) {
          await checkOnlinePublishingServices();
          await loadPublishedOnlineOffers();
        }
      }, 0);
    });
  }

  renderAuthState();

  try {
    await initializeFirestoreState();
    resolveCurrentUser();
    renderAuthState();
  } catch (error) {
    console.error("Erro ao carregar dados do Firebase:", error);
    showToast(getFirebaseMessage(error));
  }

  if (getCurrentUser()) {
    refresh();
  } else {
    elements.loginIdentifier.focus();
  }

})();
