// Normalize external authority mapping into the shape used by the app.
let AUTHORITY_MAPPING = {};
function isNativeCapacitor() {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
}

function getCapacitorPlugin(name) {
    return window.Capacitor?.Plugins?.[name] || null;
}

function normalizeAuthorityMapping(data, fallback = {}) {
    if (!Array.isArray(data)) return data && typeof data === 'object' ? data : fallback;

    const mapped = { ...fallback };
    data.forEach(item => {
        if (!item || !item.key) return;
        const keywordBuckets = item.keywords_by_lang || {};
        const keywords = Object.values(keywordBuckets).flat().filter(Boolean);
        mapped[item.key] = {
            keywords,
            department: item.department || 'Public Information Officer',
            level: item.level || 'Mandal',
            questions: (item.questions_by_lang && item.questions_by_lang.en && item.questions_by_lang.en.length)
                ? item.questions_by_lang.en
                : (item.questions || fallback.default?.questions || [])
        };
    });
    return mapped;
}

async function loadLocalJson(path) {
    const candidates = [
        path,
        `./${path}`,
        new URL(path, window.location.href).href
    ];
    let lastError = null;

    for (const candidate of candidates) {
        try {
            const res = await fetch(candidate);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        } catch (err) {
            lastError = err;
        }
    }

    throw lastError || new Error(`Could not fetch ${path}`);
}

async function loadExternalAuthorityMapping() {
    try {
        const data = await loadLocalJson('authority_mapping.json');
        AUTHORITY_MAPPING = normalizeAuthorityMapping(data, AUTHORITY_MAPPING);
    } catch (err) {
        console.warn('Could not load authority mapping, using fallback', err);
    }
}

// ================================================================
//  RTI Sahayak — Full Application (Safe Global Lexical Scope Integration)
// ================================================================

// ---------- LANGUAGES ----------
const LANGS = [
    { code: 'en-IN', name: 'English' },
    { code: 'hi-IN', name: 'Hindi (हिंदी)' },
    { code: 'te-IN', name: 'Telugu (తెలుగు)' }
];

const LEVEL_KEYS = ['Village', 'Mandal', 'District', 'State', 'Central'];

const I18N = {
    en: {
        brandSub: 'Speak it. File it. Know your right to know.',
        stepDescribe: 'Describe',
        stepVerify: 'Verify',
        stepDraft: 'Draft & Finish',
        rtiInfoTitle: 'What can you get through RTI?',
        rtiInfoLead: 'The Right to Information Act, 2005 lets every citizen request records and information held by public authorities. Below are examples of what you can ask for.',
        rtiInfoNote: '<strong>Note:</strong> Some personal information and matters of national security may be exempt under Section 8 of the RTI Act. You can still request the non-exempt portions of any record.',
        rtiInfoBack: '← Back to home',
        step1Title: 'Speak your problem.<br>Generate an RTI instantly.',
        step1Subtitle: 'Create a Right to Information application in your own language — by voice, in a few minutes.',
        rtiIntroText: 'The <strong>Right to Information (RTI)</strong> Act, 2005 empowers every Indian citizen to seek records, documents, and answers from government departments — from road works, pensions, and hospital services to budgets, tenders, and policy decisions.',
        readMoreRti: 'Read more about RTI →',
        micTap: 'Tap the mic and describe your issue',
        micListening: 'Listening… tap again to stop',
        micNoSupport: 'Voice input not supported in this browser — please type below',
        micBlocked: 'Microphone blocked. Chrome restricts voice input on file:// pages. Please serve this page from localhost.',
        micDenied: 'Microphone permission denied. Please allow microphone access in your browser settings.',
        micUnavailable: 'Speech recognition service is not available (common in Brave browser or if offline) — please type below.',
        micError: 'Could not access microphone — try typing below',
        micFail: 'Microphone error — please type below instead',
        fallbackLabel: 'Prefer typing? You can write it instead',
        fallbackPlaceholder: 'e.g. The road sanctioned in my village two years ago is still not built…',
        clearBtn: 'Clear',
        proceedBtn: 'Analyse my issue →',
        templatesTitle: 'Or start from a ready-made template',
        templatesSubtitle: 'Start with a pre-filled template, review the details, and generate your draft',
        labelName: 'Your name <span style="font-weight:500;color:var(--muted);">(optional)</span>',
        labelAddress: 'Your address <span style="font-weight:500;color:var(--muted);">(optional)</span>',
        placeholderName: 'Leave blank if you prefer to fill by hand later',
        placeholderAddress: 'Leave blank if you prefer to fill by hand later',
        hintAddress: 'If left empty, name and address lines on the final draft will remain blank.',
        labelSummary: 'Issue summary <span style="font-weight:500;color:var(--muted);">(AI-generated — edit if needed)</span>',
        labelDepartment: 'Detected department <span style="font-weight:500;color:var(--muted);">(AI-mapped)</span>',
        labelLevel: 'Government level',
        labelTarget: 'RTI Filing Target',
        hintTarget: 'Automatically mapped to SPIO (State) or CPIO (Central) based on the department jurisdiction.',
        labelConfidence: 'Match confidence',
        labelQuestions: 'Information to request (one per line) <span style="font-weight:500;color:var(--muted);">(AI-generated — edit freely)</span>',
        hintQuestions: 'Edit, add, or remove lines — these become the numbered RTI questions.',
        backBtn: '← Back',
        genDraftBtn: 'Generate RTI draft →',
        step2Loading: 'Reading your complaint and identifying the right department…',
        step3Loading: 'Drafting your RTI application…',
        qlLabel: 'RTI strength',
        docWatermark: 'RTI Act, 2005 — Draft',
        readAloud: '🔊 Read aloud',
        readAloudStop: '⏸ Stop',
        copyBtn: '📋 Copy',
        copied: '✅ Copied',
        printBtn: '🖨️ Print',
        pdfBtn: '⬇️ PDF',
        pdfPreparing: '⏳ Preparing…',
        docBtn: '⬇️ DOCX',
        shareBtn: '📤 Share',
        shareCopied: '📋 Copied to share',
        backTo2Btn: '← Edit details',
        restartBtn: 'Generate another RTI',
        disclaimer: 'Prototype demo for academic / civic-tech purposes. Drafts are AI-generated — please review before filing, and fill in your name, address and signature by hand. Not affiliated with any government department.',
        levels: { Village: 'Village', Mandal: 'Mandal', District: 'District', State: 'State', Central: 'Central' },
        spio: 'State Public Information Officer (SPIO)',
        cpio: 'Central Public Information Officer (CPIO)',
        errNoComplaint: 'Please speak or type your issue first.',
        errStep2Fields: 'Please make sure the summary and at least one question are filled in.',
        errAnalyse: 'Could not analyse the complaint right now. You can fill the fields in manually below and continue.',
        errDraft: 'Could not generate the draft right now. Please try again in a moment.',
        errPdf: 'Could not create the PDF in this browser. Try Print → Save as PDF instead.',
        offlineNote: 'ℹ️ Served in Offline Mode: Pre-filled with verified standard template.',
        retryBtn: 'Retry',
        sugFillSig: 'Add your signature and date before filing',
        sugRefNum: 'Add any reference numbers in the summary if available',
        sugFillAll: 'Please fill in applicant name, address and signature before filing',
        rejectHypothetical: 'RTI can only request information that already exists in government records. Future budgets, predictions, or opinions are not held as records yet. You may instead ask for approved budget documents, sanction orders, tender files, or work-progress reports for a specific project and location.',
        rejectPersonalInfo: 'RTI cannot be used to obtain another person\'s salary, bank account, phone number, or other personal details without overriding public interest (RTI Act Section 8(1)(j)). You may request non-personal official records such as appointment orders or public expenditure statements.',
        rejectPrivateDispute: 'This appears to be a personal dispute or private enterprise matter. RTI applications can only be filed to request records held by public government bodies.',
        intentModalTitle: 'Not an RTI Issue',
        intentModalGreeting: 'Welcome',
        intentModalService: 'Convert to RTI?',
        reframeRtiBtn: 'Convert to RTI records request →',
        closeIntentModalBtn: 'I understand, edit my complaint'
    },
    hi: {
        brandSub: 'बोलें। दाखिल करें। जानने का अधिकार जानें।',
        stepDescribe: 'वर्णन',
        stepVerify: 'सत्यापन',
        stepDraft: 'मसूदा व समापन',
        rtiInfoTitle: 'RTI से आप क्या प्राप्त कर सकते हैं?',
        rtiInfoLead: 'सूचना का अधिकार अधिनियम, 2005 हर नागरिक को सार्वजनिक प्राधिकरणों के पास रखी रिकॉर्ड और जानकारी मांगने का अधिकार देता है। नीचे उदाहरण दिए गए हैं।',
        rtiInfoNote: '<strong>नोट:</strong> कुछ व्यक्तिगत जानकारी और राष्ट्रीय सुरक्षा के मामले RTI अधिनियम की धारा 8 के तहत मुक्त हो सकते हैं। आप किसी भी रिकॉर्ड के गैर-मुक्त हिस्से का अनुरोध कर सकते हैं।',
        rtiInfoBack: '← होम पर वापस',
        step1Title: 'अपनी समस्या बोलें।<br>तुरंत RTI बनाएं।',
        step1Subtitle: 'अपनी भाषा में सूचना का अधिकार आवेदन बनाएं — आवाज़ से, कुछ मिनटों में।',
        rtiIntroText: '<strong>सूचना का अधिकार (RTI)</strong> अधिनियम, 2005 हर भारतीय नागरिक को सरकारी विभागों से रिकॉर्ड, दस्तावेज़ और जवाब मांगने का अधिकार देता है — सड़क कार्य, पेंशन, अस्पताल सेवाएं, बजट, निविदा और नीति निर्णय।',
        readMoreRti: 'RTI के बारे में और पढ़ें →',
        micTap: 'माइक टैप करें और अपनी समस्या बताएं',
        micListening: 'सुन रहा है… रोकने के लिए फिर टैप करें',
        micNoSupport: 'इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं — नीचे टाइप करें',
        micBlocked: 'माइक्रोफ़ोन ब्लॉक है। file:// पेज पर Chrome आवाज़ इनपुट प्रतिबंधित करता है। localhost से खोलें।',
        micDenied: 'माइक्रोफ़ोन अनुमति अस्वीकृत। ब्राउज़र सेटिंग्स में अनुमति दें।',
        micUnavailable: 'स्पीच रिकग्निशन उपलब्ध नहीं (Brave या ऑफ़लाइन में सामान्य) — नीचे टाइप करें।',
        micError: 'माइक्रोफ़ोन एक्सेस नहीं हो सका — नीचे टाइप करें',
        micFail: 'माइक्रोफ़ोन त्रुटि — नीचे टाइप करें',
        fallbackLabel: 'टाइप करना चाहते हैं? यहाँ लिख सकते हैं',
        fallbackPlaceholder: 'उदा. मेरे गाँव में दो साल पहले स्वीकृत सड़क अभी तक नहीं बनी…',
        clearBtn: 'साफ़ करें',
        proceedBtn: 'मेरी समस्या विश्लेषण करें →',
        templatesTitle: 'या तैयार टेम्पलेट से शुरू करें',
        templatesSubtitle: 'पूर्व-भरी टेम्पलेट से शुरू करें, विवरण देखें और मसूदा बनाएं',
        labelName: 'आपका नाम <span style="font-weight:500;color:var(--muted);">(वैकल्पिक)</span>',
        labelAddress: 'आपका पता <span style="font-weight:500;color:var(--muted);">(वैकल्पिक)</span>',
        placeholderName: 'हाथ से भरना चाहें तो खाली छोड़ें',
        placeholderAddress: 'हाथ से भरना चाहें तो खाली छोड़ें',
        hintAddress: 'खाली छोड़ने पर अंतिम मसूदे में नाम और पता रिक्त रहेंगे।',
        labelSummary: 'समस्या का सारांश <span style="font-weight:500;color:var(--muted);">(AI-जनित — आवश्यकतानुसार संपादित करें)</span>',
        labelDepartment: 'पहचाना गया विभाग <span style="font-weight:500;color:var(--muted);">(AI-मैप्ड)</span>',
        labelLevel: 'सरकारी स्तर',
        labelTarget: 'RTI दाखिल लक्ष्य',
        hintTarget: 'विभाग के अधिकार क्षेत्र के आधार पर स्वचालित SPIO (राज्य) या CPIO (केंद्र) मैपिंग।',
        labelConfidence: 'मिलान विश्वास',
        labelQuestions: 'मांगी जाने वाली जानकारी (प्रति पंक्ति एक) <span style="font-weight:500;color:var(--muted);">(AI-जनित — स्वतंत्र रूप से संपादित करें)</span>',
        hintQuestions: 'पंक्तियाँ संपादित करें — ये RTI प्रश्नों बनेंगी।',
        backBtn: '← वापस',
        genDraftBtn: 'RTI मसूदा बनाएं →',
        step2Loading: 'आपकी शिकायत पढ़ रहे हैं और सही विभाग पहचान रहे हैं…',
        step3Loading: 'आपका RTI आवेदन लिख रहे हैं…',
        qlLabel: 'RTI की मज़बूती',
        docWatermark: 'RTI अधिनियम, 2005 — मसूदा',
        readAloud: '🔊 ज़ोर से पढ़ें',
        readAloudStop: '⏸ रोकें',
        copyBtn: '📋 कॉपी',
        copied: '✅ कॉपी हो गया',
        printBtn: '🖨️ प्रिंट',
        pdfBtn: '⬇️ PDF',
        pdfPreparing: '⏳ तैयार हो रहा…',
        docBtn: '⬇️ DOCX',
        shareBtn: '📤 साझा करें',
        shareCopied: '📋 साझा करने के लिए कॉपी',
        backTo2Btn: '← विवरण संपादित करें',
        restartBtn: 'एक और RTI बनाएं',
        disclaimer: 'शैक्षणिक / नागरिक-तकनीक प्रोटोटाइप। मसूदे AI-जनित हैं — दाखिल करने से पहले जाँचें और नाम, पता व हस्ताक्षर हाथ से भरें। किसी सरकारी विभाग से संबद्ध नहीं।',
        levels: { Village: 'गाँव', Mandal: 'मंडल', District: 'ज़िला', State: 'राज्य', Central: 'केंद्र' },
        spio: 'राज्य लोक सूचना अधिकारी (SPIO)',
        cpio: 'केंद्रीय लोक सूचना अधिकारी (CPIO)',
        errNoComplaint: 'पहले अपनी समस्या बोलें या टाइप करें।',
        errStep2Fields: 'सारांश और कम से कम एक प्रश्न भरें।',
        errAnalyse: 'अभी शिकायत विश्लेषण नहीं हो सका। नीचे फ़ील्ड मैन्युअल भरें और जारी रखें।',
        errDraft: 'अभी मसूदा नहीं बन सका। कृपया पुनः प्रयास करें।',
        errPdf: 'इस ब्राउज़र में PDF नहीं बन सका। प्रिंट → PDF के रूप में सहेजें।',
        offlineNote: 'ℹ️ ऑफ़लाइन मोड: सत्यापित टेम्पलेट से पूर्व-भरा।',
        retryBtn: 'पुनः प्रयास',
        sugFillSig: 'दाखिल करने से पहले हस्ताक्षर और तिथि भरें',
        sugRefNum: 'उपलब्ध हो तो सारांश में संदर्भ संख्या जोड़ें',
        sugFillAll: 'दाखिल करने से पहले नाम, पता और हस्ताक्षर भरें',
        rejectHypothetical: 'RTI केवल सरकारी रिकॉर्ड में मौजूद जानकारी मांग सकता है। भविष्य के बजट, पूर्वानुमान या राय अभी रिकॉर्ड के रूप में उपलब्ध नहीं होते। आप किसी विशिष्ट परियोजना/स्थान के लिए स्वीकृत बजट दस्तावेज़, स्वीकृति आदेश, निविदा फाइलें या कार्य-प्रगति रिपोर्ट मांग सकते हैं।',
        rejectPersonalInfo: 'RTI का उपयोग किसी अन्य व्यक्ति का वेतन, बैंक खाता, फोन नंबर या व्यक्तिगत विवरण प्राप्त करने के लिए नहीं किया जा सकता (RTI अधिनियम धारा 8(1)(j))। आप गैर-व्यक्तिगत आधिकारिक रिकॉर्ड जैसे नियुक्ति आदेश या सार्वजनिक व्यय विवरण मांग सकते हैं।',
        rejectPrivateDispute: 'यह एक व्यक्तिगत विवाद या निजी उद्यम का मामला प्रतीत होता है। RTI आवेदन केवल सार्वजनिक सरकारी निकायों के पास रखे रिकॉर्ड के लिए दाखिल किए जा सकते हैं।',
        intentModalTitle: 'RTI अनुरोध नहीं',
        intentModalGreeting: 'स्वागत है',
        intentModalService: 'RTI में बदलें?',
        reframeRtiBtn: 'RTI रिकॉर्ड अनुरोध में बदलें →',
        closeIntentModalBtn: 'समझ गया, शिकायत संपादित करें'
    },
    te: {
        brandSub: 'మాట్లాడండి. దాఖలు చేయండి. తెలుసుకునే హక్కు తెలుసుకోండి.',
        stepDescribe: 'వివరించండి',
        stepVerify: 'ధృవీకరించండి',
        stepDraft: 'మసూదా & పూర్తి',
        rtiInfoTitle: 'RTI ద్వారా మీరు ఏమి పొందగలరు?',
        rtiInfoLead: 'సమాచార హక్కు చట్టం, 2005 ప్రతి పౌరుడిని ప్రభుత్వ సంస్థలు నిల్వ చేసిన రికార్డులు మరియు సమాచారం కోరే అధికారం ఇస్తుంది. కింద ఉదాహరణలు.',
        rtiInfoNote: '<strong>గమనిక:</strong> కొంత వ్యక్తిగత సమాచారం మరియు జాతీయ భద్రతా విషయాలు RTI చట్టం సెక్షన్ 8 కింద మినహాయింపు కావచ్చు. మిగిలిన భాగాన్ని కోరవచ్చు.',
        rtiInfoBack: '← హోమ్‌కు తిరిగి',
        step1Title: 'మీ సమస్య చెప్పండి.<br>తక్షణమే RTI సృష్టించండి.',
        step1Subtitle: 'మీ భాషలో సమాచార హక్కు అప్లికేషన్ సృష్టించండి — వాయిస్ ద్వారా, కొన్ని నిమిషాల్లో.',
        rtiIntroText: '<strong>సమాచార హక్కు (RTI)</strong> చట్టం, 2005 ప్రతి భారతీయ పౌరుడికి ప్రభుత్వ శాఖల నుండి రికార్డులు, పత్రాలు మరియు సమాధానాలు కోరే అధికారం ఇస్తుంది — రోడ్డు పనులు, పెన్షన్లు, ఆసుపత్రి sేవలు, బడ్జెట్లు, టెండర్లు మరియు విధాన నిర్ణయాలు.',
        readMoreRti: 'RTI గురించి మరింత చదవండి →',
        micTap: 'మైక్ నొక్కి మీ సమస్య వివరించండి',
        micListening: 'వింటోంది… నిలిపేందుకు మళ్ళీ నొక్కండి',
        micNoSupport: 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ అందుబాటులో లేదు — కింద టైప్ చేయండి',
        micBlocked: 'మైక్రోఫోన్ బ్లాక్. file:// పేజీలో Chrome వాయిస్ ఇన్‌పుట్ నిషేధిస్తుంది. localhost నుండి తెరవండి.',
        micDenied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్‌లలో అనుమతి ఇవ్వండి.',
        micUnavailable: 'స్పీచ్ రికగ్నిషన్ అందుబాటులో లేదు (Brave లేదా ఆఫ్‌లైన్ లో సాధారణం) — కింద టైప్ చేయండి.',
        micError: 'మైక్రోఫోన్ యాక్సెస్ కాలేదు — కింద టైప్ చేయండి',
        micFail: 'మైక్రోఫోన్ లోపం — కింద టైప్ చేయండి',
        fallbackLabel: 'టైప్ చేయాలనుకుంటున్నారా? ఇక్కడ రాయండి',
        fallbackPlaceholder: 'ఉదా. మా గ్రామంలో రెండు సంవత్సరాల క్రితం మంజూరు చేసిన రోడ్డు ఇంకా పూర్తి కాలేదు…',
        clearBtn: 'క్లియర్',
        proceedBtn: 'నా సమస్య విశ్లేషించండి →',
        templatesTitle: 'లేదా సిద్ధమైన టెంప్లేట్ నుండి ప్రారంభించండి',
        templatesSubtitle: 'పూర్తి టెంప్లేట్‌తో ప్రారంభించి, వివరాలు సమీక్షించి మసూదా సృష్టించండి',
        labelName: 'మీ పేరు <span style="font-weight:500;color:var(--muted);">(ఐచ్ఛికం)</span>',
        labelAddress: 'మీ చిరునామా <span style="font-weight:500;color:var(--muted);">(ఐచ్ఛికం)</span>',
        placeholderName: 'చేతితో భరించాలనుకుంటే ఖాళీ వదిలేయండి',
        placeholderAddress: 'చేతితో భరించాలనుకుంటే ఖాళీ వదిలేయండి',
        hintAddress: 'ఖాళీ వదిలేస్తే చివరి మసూదాలో పేరు మరియు చిరునామా ఖాళీగా ఉంటాయి.',
        labelSummary: 'సమస్య సారాంశం <span style="font-weight:500;color:var(--muted);">(AI-జనితం — అవసరమైతే సవరించండి)</span>',
        labelDepartment: 'గుర్తించిన శాఖ <span style="font-weight:500;color:var(--muted);">(AI-మ్యాప్ చేయబడింది)</span>',
        labelLevel: 'ప్రభుత్వ స్థాయి',
        labelTarget: 'RTI దాఖలు లక్ష్యం',
        hintTarget: 'శాఖ అధికార పరిధి ఆధారంగా SPIO (రాష్ట్ర) లేదా CPIO (కేంద్ర) స్వయంచాలక మ్యాపింగ్.',
        labelConfidence: 'మ్యాచ్ నిర్ధారణ',
        labelQuestions: 'అభ్యర్థించిన సమాచారం (ఒక పంక్తిలో ఒకటి) <span style="font-weight:500;color:var(--muted);">(AI-జనితం — స్వేచ్ఛగా సవరించండి)</span>',
        hintQuestions: 'పంక్తులను సవరించండి — ఇవి RTI ప్రశ్నలు అవుతాయి.',
        backBtn: '← వెనుక',
        genDraftBtn: 'RTI మసూదా సృష్టించండి →',
        step2Loading: 'మీ ఫిర్యాదు చదివి సరైన శాఖ గుర్తిస్తోంది…',
        step3Loading: 'మీ RTI అప్లికేషన్ రాస్తోంది…',
        qlLabel: 'RTI బలం',
        docWatermark: 'RTI చట్టం, 2005 — మసూదా',
        readAloud: '🔊 బిగ్గరగా చదవండి',
        readAloudStop: '⏸ నిలిపేయండి',
        copyBtn: '📋 కాపీ',
        copied: '✅ కాపీ చేయబడింది',
        printBtn: '🖨️ ప్రింట్',
        pdfBtn: '⬇️ PDF',
        pdfPreparing: '⏳ సిద్ధం చేస్తోంది…',
        docBtn: '⬇️ DOCX',
        shareBtn: '📤 షేర్',
        shareCopied: '📋 షేర్ చేయడానికి కాపీ',
        backTo2Btn: '← వివరాలు సవరించండి',
        restartBtn: 'మరొక RTI సృష్టించండి',
        disclaimer: 'విద్యా / పౌర-టెక్ ప్రోటోటైప్. మసూదాలు AI-జనితం — దాఖలు చేయడానికి ముందు సమీక్షించండి, పేరు, చిరునామా మరియు సంతకం చేతితో భరించండి. ఏ ప్రభుత్వ శాఖకు చెందినది కాదు.',
        levels: { Village: 'గ్రామం', Mandal: 'మండలం', District: 'జిల్లా', State: 'రాష్ట్రం', Central: 'కేంద్రం' },
        spio: 'రాష్ట్ర పబ్లిక్ ఇన్ఫర్మేషన్ ఆఫీసర్ (SPIO)',
        cpio: 'కేంద్ర పబ్లిక్ ఇన్ఫర్మేషన్ ఆఫీసర్ (CPIO)',
        errNoComplaint: 'ముందుగా మీ సమస్య మాట్లాడండి లేదా టైప్ చేయండి.',
        errStep2Fields: 'సారాంశం మరియు కనీసం ఒక ప్రశ్న భరించండి.',
        errAnalyse: 'ఇప్పుడు ఫిర్యాదు విశ్లేషణ కాలేదు. కింద ఫీల్డ్‌లు మాన్యువల్ భరించి కొనసాగండి.',
        errDraft: 'ఇప్పుడు మసూదా సృష్టించలేకపోయాం. మళ్ళీ ప్రయత్నించండి.',
        errPdf: 'ఈ బ్రౌజర్‌లో PDF సృష్టించలేకపోయాం. ప్రింట్ → PDF గా సేవ్ చేయండి.',
        offlineNote: 'ℹ️ ఆఫ్‌లైన్ మోడ్: ధృవీకరించిన టెంప్లేట్ నుండి పూర్తి చేయబడింది.',
        retryBtn: 'మళ్ళీ ప్రయత్నించండి',
        sugFillSig: 'ఆవశ్యక సమాచారం దాఖలు చేయడానికి ముందు సంతకం మరియు తేదీ భరించండి',
        sugRefNum: 'అందుబాటులో ఉంటే సారాంశంలో సూచన సంఖ్యలు జోడించండి',
        sugFillAll: 'దాఖలు చేయడానికి ముందు పేరు, చిరునామా మరియు సంతకం భరించండి',
        rejectHypothetical: 'RTI ప్రభుత్వ రికార్డులలో ఇప్పటికే ఉన్న సమాచారాన్ని మాత్రమే అడగగలదు. భవిష్యత్ బడ్జెట్లు, అంచనాలు లేదా అభిప్రాయాలు ఇంకా రికార్డులుగా ఉండవు. మీరు నిర్దిష్ట ప్రాజెక్ట్/స్థలం కోసం ఆమోదించిన బడ్జెట్ పత్రాలు, sanction orders, టెండర్ ఫైళ్లు లేదా పని-పురోగతి నివేదికలను అడగవచ్చు.',
        rejectPersonalInfo: 'RTI మరొకరి జీతం, బ్యాంక్ ఖాతా, ఫోన్ నంబర్ లేదా వ్యక్తిగత వివరాలను పొందడానికి ఉపయోగించలేము (RTI చట్టం సెక్షన్ 8(1)(j)). మీరు appointment orders లేదా public expenditure statements వంటి non-personal official records అడగవచ్చు.',
        rejectPrivateDispute: 'ఇది వ్యక్తిగత వివాదం లేదా ప్రైవేట్ enterprise విషయం అనిపిస్తుంది. RTI applications ప్రభుత్వ సంస్థల వద్ద ఉన్న records కోసం మాత్రమే దాఖలు చేయవచ్చు.',
        intentModalTitle: 'RTI అభ్యర్థన కాదు',
        intentModalGreeting: 'స్వాగతం',
        intentModalService: 'RTI గా మార్చాలా?',
        reframeRtiBtn: 'RTI records request గా మార్చండి →',
        closeIntentModalBtn: 'అర్థమైంది, complaint edit చేయండి'
    }
};

// ---------- HELPERS ----------
function langKey() {
    const k = (state.lang && state.lang.code) ? state.lang.code.split('-')[0] : 'en';
    return I18N[k] ? k : 'en';
}

function t(key) {
    const L = I18N[langKey()];
    return (L && L[key]) || I18N.en[key] || key;
}

function getTargetOfficer(level) {
    return level === 'Central' ? t('cpio') : t('spio');
}

function normalizeLevel(level) {
    const raw = String(level || '').trim().toLowerCase();
    return LEVEL_KEYS.find(k => k.toLowerCase() === raw) || 'Mandal';
}

function showError(containerId, msg) {
    const cleanMsg = String(msg || '').replace(/^⚠️\s*/u, '').trim();
    document.getElementById(containerId).innerHTML = `<div class="error-box">⚠️ ${cleanMsg}</div>`;
}

function clearError(containerId) {
    document.getElementById(containerId).innerHTML = '';
}

function flashLabel(id, text) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = old; }, 1600);
}

// ---------- STATE ----------
let savedLangCode;
try { savedLangCode = localStorage.getItem('rti_lang'); } catch (_) { savedLangCode = null; }
const resolvedLang = LANGS.find(l => l.code === savedLangCode) || LANGS.find(l => l.code === 'en-IN') || LANGS[0];

let state = {
    lang: resolvedLang,
    currentStep: 1,
    recognizing: false,
    finalTranscript: '',
    timerSeconds: 0,
    timerHandle: null,
    recognition: null,
    recognitionMode: '',
    nativeSpeechHandles: [],
    analysis: null,
    draft: null,
    speaking: false,
    onRtiInfoPage: false,
    // Track the original complaint across clarification loops
    originalComplaint: '',
    pendingReframeComplaint: ''
};

// ---------- GEMINI CONFIG ----------
function getGeminiConfig() {
    let key = '';
    let model = 'gemini-2.5-flash';
    try {
        const cfg = JSON.parse(localStorage.getItem('rti_gemini_cfg') || '{}');
        key = cfg.apiKey || '';
        model = cfg.model || 'gemini-2.5-flash';
    } catch (_) {}
    return { apiKey: key, model };
}

function saveGeminiConfig(key, model) {
    try {
        localStorage.setItem('rti_gemini_cfg', JSON.stringify({ apiKey: key, model }));
    } catch (_) {}
}

function clearGeminiConfig() {
    try { localStorage.removeItem('rti_gemini_cfg'); } catch (_) {}
    const input = document.getElementById('apiKeyInput');
    if (input) input.value = '';
}

function friendlyGeminiError(status, rawText) {
    let message = '';
    try {
        const parsed = JSON.parse(rawText || '{}');
        message = parsed.error?.message || '';
    } catch (_) {
        message = rawText || '';
    }

    const combined = `${status} ${message}`.toLowerCase();
    if (status === 400 && (combined.includes('api key not valid') || combined.includes('invalid_argument'))) {
        clearGeminiConfig();
        return 'The saved Gemini API key is not valid. I cleared it from this browser; add a valid key using the settings button to enable AI drafting.';
    }
    if (status === 403) {
        return 'The Gemini API key does not have permission for this request. Check that the key is active and Gemini API access is enabled.';
    }
    if (status === 429) {
        return 'Gemini is rate-limited right now. Please try again later or continue with the offline fallback draft.';
    }
    return `Gemini API returned ${status}. Please check your API key/settings or continue with the offline fallback.`;
}

// ---------- RETRY WRAPPER WITH EXPONENTIAL BACKOFF ----------
async function fetchWithRetry(url, options) {
    const delays = [1000, 2000, 4000, 8000, 16000];
    let lastResponse = null;
    for (let i = 0; i <= delays.length; i++) {
        try {
            const resp = await fetch(url, options);
            lastResponse = resp;
            if (resp.status === 429) {
                if (i < delays.length) {
                    await new Promise(resolve => setTimeout(resolve, delays[i]));
                    continue;
                }
            }
            return resp;
        } catch (err) {
            if (i < delays.length) {
                await new Promise(resolve => setTimeout(resolve, delays[i]));
                continue;
            }
            throw err;
        }
    }
    return lastResponse;
}

// ---------- RTI INTENT DETECTION & SAFETY GUARD ----------
async function detectRtiIntent(text, options = {}) {
    const threshold = options.highConfidenceThreshold ?? 0.85;
    const heuristic = window.RTIIntentGuard.detectRtiIntentHeuristic(text);

    if (heuristic && heuristic.confidence >= threshold) {
        return heuristic;
    }

    const cfg = getGeminiConfig();
    if (!options.skipLlm && cfg.apiKey) {
        try {
            const prompt = window.RTIIntentGuard.buildIntentGuardPrompt(text);
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
            const resp = await fetchWithRetry(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.0 }
                })
            });
            if (resp.ok) {
                const data = await resp.json();
                const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const parsed = window.RTIIntentGuard.parseIntentGuardJson(raw);
                if (!parsed.response && !parsed.should_generate_rti) {
                    parsed.response = window.RTIIntentGuard.offlineResponse(parsed.intent, text);
                }
                return parsed;
            }
        } catch (err) {
            console.warn('Intent guard LLM failed:', err);
        }
    }

    if (heuristic) return heuristic;

    return {
        intent: 'RTI_REQUEST',
        confidence: 0.55,
        should_generate_rti: true,
        response: ''
    };
}

function showIntentGuardModal(result, complaintForReframe) {
    document.getElementById('step2Loading').style.display = 'none';
    goToStep(1);

    const iconEl = document.getElementById('nonRtiIcon');
    const titleEl = document.getElementById('nonRtiTitle');
    const reframeBtn = document.getElementById('reframeRtiBtn');
    const explanation = result.response ||
        window.RTIIntentGuard.offlineResponse(result.intent, complaintForReframe || '');

    if (result.intent === 'GREETING' || result.intent === 'MIC_TEST' || result.intent === 'CASUAL_CHAT') {
        iconEl.textContent = '👋';
        titleEl.textContent = t('intentModalGreeting');
        reframeBtn.style.display = 'none';
    } else if (result.intent === 'GOVERNMENT_SERVICE_REQUEST') {
        iconEl.textContent = '📋';
        titleEl.textContent = t('intentModalService');
        reframeBtn.style.display = 'block';
        state.pendingReframeComplaint = complaintForReframe || state.originalComplaint;
    } else {
        iconEl.textContent = '⚠️';
        titleEl.textContent = t('intentModalTitle');
        reframeBtn.style.display = 'none';
    }

    document.getElementById('nonRtiExplanation').textContent = explanation;
    document.getElementById('closeNonRtiModalBtn').textContent = t('closeIntentModalBtn');
    document.getElementById('reframeRtiBtn').textContent = t('reframeRtiBtn');
    document.getElementById('nonRtiModal').style.display = 'flex';
}

async function validateBeforeDraft(summary, questions) {
    const combined = `RTI draft summary: ${summary}\nQuestions:\n${questions.join('\n')}`;
    const intent = await detectRtiIntent(combined, { highConfidenceThreshold: 0.8 });
    if (!intent.should_generate_rti) {
        return {
            eligible: false,
            intent: intent.intent,
            reason: intent.response || window.RTIIntentGuard.offlineResponse(intent.intent, combined)
        };
    }
    return { eligible: true };
}

// ---------- AUTHORITY MAPPING (safely assigned, no duplicate const declarations) ----------
AUTHORITY_MAPPING = {
    ration: {
        keywords: ['ration', 'ration card', 'pds', 'food grain', 'fair price shop', 'raashan', 'राशन', 'రాషన్', 'రేషన్'],
        department: 'Food & Civil Supplies Department',
        level: 'Mandal',
        questions: [
            'What is the status of my ration card application?',
            'What is the timeline for processing new cards?',
            'How many applications are pending at the supply office?',
            'What is the procedure for expediting the application?'
        ]
    },
    road: {
        keywords: ['road', 'pothole', 'highway', 'street', 'paving', 'construction', 'marga', 'सड़क', 'రోడ్డు', 'కోపు', 'சாலை'],
        department: 'Public Works Department / Municipality',
        level: 'Mandal',
        questions: [
            'What is the current status of the sanctioned road construction work?',
            'What is the total amount released and utilised so far?',
            'What is the expected date of completion?',
            'What action has been taken against the contractor for the delay?'
        ]
    },
    pension: {
        keywords: ['pension', 'old age pension', 'widow pension', 'disability pension', 'pension scheme', 'पेंशन', 'பென்ชั่น', 'పెన్షన్'],
        department: 'Social Welfare Department / Pension Department',
        level: 'Mandal',
        questions: [
            'What is the current status of my pension application?',
            'What is the date of receipt and the expected processing time?',
            'How many applications are pending at each stage?',
            'What action is being taken to clear the backlog?'
        ]
    },
    electricity: {
        keywords: ['electricity', 'power cut', 'electricity bill', 'meter', 'discom', 'transco', 'bijli', 'बिजली', 'కరెంట్', 'மின்'],
        department: 'State Electricity Department / Discom',
        level: 'Mandal',
        questions: [
            'What is the status of my electricity connection application?',
            'What is the timeline for providing a new connection?',
            'What reasons have been recorded for the delay?',
            'What action is being taken to resolve the complaint?'
        ]
    },
    water: {
        keywords: ['water supply', 'drinking water', 'water bill', 'water pipeline', 'paani', 'पानी', 'నీరు', 'తణ్ణీర్'],
        department: 'Water Board / Municipality / Local Body',
        level: 'Mandal',
        questions: [
            'What is the schedule for water supply in our area?',
            'What are the reasons for irregular water supply?',
            'What action has been taken to restore regular supply?',
            'What is the status of the water supply infrastructure?'
        ]
    },
    default: {
        department: 'Public Information Officer / General Administration',
        level: 'Mandal',
        questions: [
            'What is the current status of the issue?',
            'What action has been taken so far?',
            'What is the timeline for resolution?',
            'What documents are available on this matter?'
        ]
    }
};

function detectAuthorityFromText(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const key in AUTHORITY_MAPPING) {
        if (key === 'default') continue;
        const item = AUTHORITY_MAPPING[key];
        const keywords = Array.isArray(item.keywords) ? item.keywords : [];
        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase())) {
                return item;
            }
        }
    }
    return null;
}
loadExternalAuthorityMapping();

// ---------- TEMPLATES ----------
const TEMPLATES = [{
    title: 'Road Construction Status',
    desc: 'Sanctioned road work delayed or incomplete',
    department: 'Panchayat Raj / Municipal Administration Department',
    level: 'Mandal',
    summary: 'The road construction work sanctioned for our area has not been completed as per schedule.',
    questions: [
        'What is the current status of the sanctioned road construction work?',
        'What is the total amount released and utilised so far?',
        'What is the expected date of completion?',
        'What action has been taken against the contractor for the delay?'
    ]
}, {
    title: 'Pension Application Status',
    desc: 'Old-age / widow / disability pension delay',
    department: 'Social Welfare Department',
    level: 'Mandal',
    summary: 'My pension application has been pending for an unreasonably long time without any update.',
    questions: [
        'What is the current status of my pension application?',
        'What is the date of receipt and the expected processing time?',
        'How many applications are pending at each stage?',
        'What action is being taken to clear the backlog?'
    ]
}, {
    title: 'Scholarship Status',
    desc: 'Scholarship application or disbursal delay',
    department: 'Social Welfare / Education Department',
    level: 'District',
    summary: 'My scholarship application has not been processed and the amount has not been disbursed.',
    questions: [
        'What is the current status of my scholarship application?',
        'What is the timeline for processing and disbursal?',
        'How many students are yet to receive their scholarship?',
        'What reasons have been recorded for the delay?'
    ]
}, {
    title: 'Ration Card Application Status',
    desc: 'New ration card or correction pending',
    department: 'Civil Supplies Department',
    level: 'Mandal',
    summary: 'My application for a new ration card / correction in ration card has not been processed.',
    questions: [
        'What is the status of my ration card application?',
        'What is the timeline for processing new cards?',
        'How many applications are pending at the supply office?',
        'What is the procedure for expediting the application?'
    ]
}, {
    title: 'PMAY Housing Status',
    desc: 'Pradhan Mantri Awas Yojana application/funds',
    department: 'Housing Department',
    level: 'District',
    summary: 'My application under the PMAY housing scheme is pending and installments have not been released.',
    questions: [
        'What is the status of my PMAY application?',
        'What is the total amount sanctioned and released so far?',
        'What is the timeline for completion of the housing unit?',
        'What action has been taken to resolve the delay?'
    ]
}, {
    title: 'Water Supply Issues',
    desc: 'Irregular or no water supply in area',
    department: 'Public Health Engineering / Municipal Department',
    level: 'Village',
    summary: 'There has been irregular or no piped water supply in our area for an extended period.',
    questions: [
        'What is the schedule for water supply in our area?',
        'What are the reasons for irregular water supply?',
        'What action has been taken to restore regular supply?',
        'What is the status of the water supply infrastructure?'
    ]
}, {
    title: 'Electricity Connection Status',
    desc: 'New connection or supply complaint',
    department: 'Electricity Department / DISCOM',
    level: 'Mandal',
    summary: 'My application for a new electricity connection / a supply complaint has not been resolved.',
    questions: [
        'What is the status of my electricity connection application?',
        'What is the timeline for providing a new connection?',
        'What reasons have been recorded for the delay?',
        'What action is being taken to resolve the complaint?'
    ]
}, {
    title: 'Government Hospital Facilities',
    desc: 'Staff, medicine or equipment shortage',
    department: 'Health Department',
    level: 'District',
    summary: 'The government hospital in our area lacks adequate staff, medicines, or equipment.',
    questions: [
        'What is the sanctioned and actual staff strength at the hospital?',
        'What is the status of medicine and equipment supply?',
        'What action has been taken to address the shortages?',
        'What is the budget allocation and utilisation for the hospital?'
    ]
}, {
    title: 'Municipality Complaints',
    desc: 'Drainage, street lights, garbage collection',
    department: 'Municipal Administration Department',
    level: 'Village',
    summary: 'A civic complaint (drainage / street lighting / garbage collection) raised with the municipality remains unresolved.',
    questions: [
        'What is the status of the complaint filed with the municipality?',
        'What action has been taken on the complaint so far?',
        'What is the timeline for resolving the issue?',
        'What is the budget allocation for civic works in our area?'
    ]
}, {
    title: 'Revenue Department Records',
    desc: 'Land records, mutation, certificates',
    department: 'Revenue Department',
    level: 'Mandal',
    summary: 'My application relating to land records / mutation / a revenue certificate has not been processed.',
    questions: [
        'What is the status of my application for land records / mutation?',
        'What is the timeline for processing such applications?',
        'How many applications are pending at the office?',
        'What is the procedure to expedite the application?'
    ]
}, {
    title: 'Land Survey Status',
    desc: 'Resurvey, boundary demarcation pending',
    department: 'Revenue / Survey & Settlement Department',
    level: 'Mandal',
    summary: 'The land survey / boundary demarcation requested for my plot has not been carried out.',
    questions: [
        'What is the status of the land survey request for my plot?',
        'What is the timeline for conducting the survey?',
        'What are the reasons for the delay in conducting the survey?',
        'What action is being taken to conduct the survey?'
    ]
}, {
    title: 'MGNREGA Work Details',
    desc: 'Work allotment, wage payment delay',
    department: 'Rural Development / Panchayat Raj Department',
    level: 'Mandal',
    summary: 'Work allotment / wage payments under MGNREGA for my job card have been delayed.',
    questions: [
        'What is the status of the work allotment under my MGNREGA job card?',
        'What is the timeline for wage payments?',
        'How many workers are yet to receive their wages?',
        'What action is being taken to ensure timely wage payments?'
    ]
}];

// ---------- RTI INFO ----------
const RTI_INFO_L10N = {
    en: [
        { icon: '📋', title: 'Official records & documents', desc: 'Files, correspondence, reports, inspection notes, and certified copies of any record held by a public authority.' },
        { icon: '💰', title: 'Budgets & expenditure', desc: 'Allocated funds, released amounts, utilisation certificates, audit reports, and details of how public money was spent.' },
        { icon: '🛣️', title: 'Projects & infrastructure', desc: 'Sanction letters, tender documents, contractor details, completion status, and physical progress of roads, buildings, and schemes.' },
        { icon: '🏥', title: 'Public services', desc: 'Hospital bed availability, medicine stocks, staff vacancies, pension status, ration card lists, and welfare scheme beneficiaries.' },
        { icon: '📜', title: 'Policies & decisions', desc: 'Meeting minutes, policy notes, reasons behind administrative decisions, and copies of orders or circulars.' },
        { icon: '🏛️', title: 'Land & property', desc: 'Land records, encumbrance details, acquisition notices, building permissions, and property ownership held by government.' },
        { icon: '👥', title: 'Appointments & recruitment', desc: 'Vacancy lists, selection criteria, merit lists, and non-personal details about appointments and promotions.' },
        { icon: '🌿', title: 'Environment & clearances', desc: 'Environmental impact assessments, pollution data, mining permits, and forest or coastal clearance documents.' },
        { icon: '⚖️', title: 'Complaints & investigations', desc: 'Status of complaints filed, inquiry reports, disciplinary proceedings, and action taken on corruption allegations.' },
        { icon: '📊', title: 'Statistical & survey data', desc: 'Census-related data, survey results, performance indicators, and any data collected by government agencies.' }
    ],
    hi: [
        { icon: '📋', title: 'सरकारी रिकॉर्ड और दस्तावेज़', desc: 'फ़ाइलें, पत्राचार, रिपोर्ट, निरीक्षण नोट्स और सार्वजनिक प्राधिकरण के किसी भी रिकॉर्ड की प्रमाणित प्रतियाँ।' },
        { icon: '💰', title: 'बजट और व्यय', desc: 'आवंटित धन, जारी राशि, उपयोग प्रमाणपत्र, लेखा परीक्षा रिपोर्ट और सार्वजनिक धन के उपयोग का विवरण।' },
        { icon: '🛣️', title: 'प्रोजेक्ट और बुनियादी ढाँचा', desc: 'मंजूरी पत्र, निविदा दस्तावेज़, ठेकेदार विवरण, पूर्णता स्थिति और सड़क, भवन व योजनाओं की भौतिक प्रगति।' },
        { icon: '🏥', title: 'सार्वजनिक सेवाएँ', desc: 'अस्पताल बिस्तर उपलब्धता, दवा स्टॉक, कर्मचारी रिक्तियाँ, पेंशन स्थिति, राशन कार्ड सूची और कल्याण योजना लाभार्थी।' },
        { icon: '📜', title: 'नीतियाँ और निर्णय', desc: 'बैठक के मिनट, नीति नोट्स, प्रशासनिक निर्णयों के कारण और आदेश या परिपत्र की प्रतियाँ।' },
        { icon: '🏛️', title: 'भूमि और संपत्ति', desc: 'भूमि रिकॉर्ड, बाधा विवरण, अधिग्रहण नोटिस, भवन अनुमति और सरकार के पास संपत्ति का विवरण।' },
        { icon: '👥', title: 'नियुक्ति और भर्ती', desc: 'रिक्ति सूची, चयन मानदंड, मेरिट सूची और नियुक्ति व पदोन्नति के गैर-व्यक्तिगत विवरण।' },
        { icon: '🌿', title: 'पर्यावरण और अनुमति', desc: 'पर्यावरण प्रभाव आकलन, प्रदूषण डेटा, खनन परमिट और वन या तटीय साफ़ परमिट दस्तावेज़।' },
        { icon: '⚖️', title: 'शिकायत और जाँच', desc: 'दर्ज शिकायतों की स्थिति, जाँच रिपोर्ट, अनुशासनिक कार्यवाही और भ्रष्टाचार आरोपों पर की गई कार्रवाई।' },
        { icon: '📊', title: 'सांख्यिकीय और सर्वेक्षण डेटा', desc: 'जनगणना डेटा, सर्वेक्षण परिणाम, प्रदर्शन संकेतक और सरकारी एजेंसियों का संग्रहित डेटा।' }
    ],
    te: [
        { icon: '📋', title: 'ప్రభుత్వ రికార్డులు & పత్రాలు', desc: 'ఫైల్‌లు, కరస్పాండెన్స్, రిపోర్టులు, తనిఖీ నోట్స్ మరియు ప్రభుత్వ సంస్థ నిల్వ రికార్డుల ప్రమాణిత కాపీలు.' },
        { icon: '💰', title: 'బడ్జెట్లు & వినియోగం', desc: 'కేటాయించిన నిధులు, విడుదల చేసిన మొత్తాలు, వినియోగ ధృవపత్రాలు, ఆడిట్ రిపోర్టులు మరియు ప్రభుత్వ డబ్బు ఎలా వినియోగించబడిందో వివరాలు.' },
        { icon: '🛣️', title: 'ప్రాజెక్టులు & ఇన్ఫ్రాస్ట్రక్టర్', desc: 'మంజూరు లేఖలు, టెండర్ పత్రాలు, కాంట్రాక్టర్ వివరాలు, పూర్తి స్థితి మరియు రోడ్డులు, భవనాలు, పథకాల భౌతిక పురోగతి.' },
        { icon: '🏥', title: 'ప్రజా సేవలు', desc: 'ఆసుపత్రి బెడ్ లభ్యత, మందుల స్టాక్, సిబ్బంది ఖాళీలు, పెన్షన్ స్థితి, రేషన్ కార్డ్ జాబితాలు మరియు సంక్షేమ పథక లబ్ధిదారుడు.' },
        { icon: '📜', title: 'విధానాలు & నిర్ణయాలు', desc: 'సమావేశ నిమిషాలు, విధాన నోట్స్, ప్రశాసన నిర్ణయాల కారణాలు మరియు आदेशాలు లేదా సర్క్యులర్ కాపీలు.' },
        { icon: '🏛️', title: 'భూమి & ఆస్తులు', desc: 'భూమి రికార్డులు, ఎన్‌కంబరెన్స్ వివరాలు, స్వాధీన నోటీసులు, భవన అనుమతులు మరియు ప్రభుత్వం నిల్వ ఆస్తి వివరాలు.' },
        { icon: '👥', title: 'నియామకాలు & నియోజన', desc: 'ఖాళీ జాబితాలు, ఎంపిక నిబంధనలు, మెరిట్ జాబితాలు మరియు నియామకాలు, పదోన్నతుల వ్యక్తిగతేతర వివరాలు.' },
        { icon: '🌿', title: 'పర్యావరణ & అనుమతులు', desc: 'పర్యావరణ ప్రభావ అంచనాలు, కాలుష్య డేటా, మైనింగ్ పర్మిట్లు మరియు అటవీ లేదా కోస్టల్ క్లియరెన్స్ పత్రాలు.' },
        { icon: '⚖️', title: 'ఫిర్యాదులు & విచారణలు', desc: 'నమోదు చేసిన ఫిర్యాదుల స్థితి, విచారణ రిపోర్టులు, శాసన కార్యవాహిక మరియు అవినీతి ఆరోపణలపై చర్య.' },
        { icon: '📊', title: 'సాంకేతిక & సర్వే డేటా', desc: 'జనగణన డేటా, సర్వే ఫలితాలు, పనితీరు సూచికలు మరియు ప్రభుత్వ సంస్థలు సేకరించిన డేటా.' }
    ]
};

const TEMPLATE_L10N = {
    en: TEMPLATES.map(t => ({ title: t.title, desc: t.desc })),
    hi: [
        { title: 'सड़क निर्माण स्थिति', desc: 'मंजूर सड़क कार्य विलंबित या अधूरा' },
        { title: 'पेंशन आवेदन स्थिति', desc: 'वृद्धावस्था / विधवा / विकलांगता पेंशन विलंब' },
        { title: 'छात्रवृत्ति स्थिति', desc: 'छात्रवृत्ति आवेदन या वितरण विलंब' },
        { title: 'राशन कार्ड आवेदन स्थिति', desc: 'नया राशन कार्ड या सुधार लंबित' },
        { title: 'PMAY आवास स्थिति', desc: 'प्रधानमंत्री आवास योजना आवेदन/धन' },
        { title: 'जल आपूर्ति समस्याएँ', desc: 'क्षेत्र में अनियमित या जल आपूर्ति नहीं' },
        { title: 'बिजली कनेक्शन स्थिति', desc: 'नया कनेक्शन या आपूर्ति शिकायत' },
        { title: 'सरकारी अस्पताल सुविधाएँ', desc: 'कर्मचारी, दवा या उपकरण की कमी' },
        { title: 'नगरपालिका शिकायतें', desc: 'नाली, स्ट्रीट लाइट, कचरा संग्रह' },
        { title: 'राजस्व विभाग रिकॉर्ड', desc: 'भूमि रिकॉर्ड, म्यूटेशन, प्रमाणपत्र' },
        { title: 'भूमि सर्वेक्षण स्थिति', desc: 'पुनः सर्वेक्षण, सीमा चिह्नांकन लंबित' },
        { title: 'MGNREGA कार्य विवरण', desc: 'कार्य आवंटन, वेतन भुगतान विलंब' }
    ],
    te: [
        { title: 'రోడ్డు నిర్మాణ స్థితి', desc: 'మంజూరు రోడ్డు పని ఆలస్యం లేదా అసంపూర్ణం' },
        { title: 'పెన్షన్ అప్లికేషన్ స్థితి', desc: 'వృద్ధాపు / విధవ / వికలాంగ పెన్షన్ ఆలస్యం' },
        { title: 'స్కాలర్‌షిప్ స్థితి', desc: 'స్కాలర్‌షిప్ అప్లికేషన్ లేదా వితరణ ఆలస్యం' },
        { title: 'రేషన్ కార్డ్ అప్లికేషన్ స్థితి', desc: 'న్యూ రేషన్ కార్డ్ లేదా సవరణ లంబితం' },
        { title: 'PMAY గృహ స్థితి', desc: 'ప్రధానమంత్రి ఆవాస్ యోజనా అప్లికేషన్/నిధులు' },
        { title: 'నీటి సరఫరా సమస్యలు', desc: 'ప్రాంతంలో అనియమిత లేదా నీటి సరఫరా లేదు' },
        { title: 'విద్యుత్ కనెక్షన్ స్థితి', desc: 'న్యూ కనెక్షన్ లేదా సరఫరా ఫిర్యాదు' },
        { title: 'ప్రభుత్వ ఆసుపత్రి సౌకర్యాలు', desc: 'సిబ్బంది, మందులు లేదా పరికరాల కొరత' },
        { title: 'మునిసిపాలిటీ ఫిర్యాదులు', desc: 'డ్రైనేజీ, స్ట్రీట్ లైట్లు, గార్బేజ్ సేకరణ' },
        { title: 'రెవెన్యూ శాఖ రికార్డులు', desc: 'భూమి రికార్డులు, మ్యూటేషన్, సర్టిఫికెట్లు' },
        { title: 'భూమి సర్వే స్థితి', desc: 'రీసర్వే, సరిహద్దు గుర్తింపు లంబితం' },
        { title: 'MGNREGA పని వివరాలు', desc: 'పని కేటాయింపు, వేతన చెల్లింపు ఆలస్యం' }
    ]
};

// ---------- FALLBACK TEXTS FOR DRAFT ----------
const FALLBACK_TEXTS = {
    en: {
        to: 'To: ',
        dept: 'Department: ',
        subject: 'Subject: Request for information under the Right to Information Act, 2005',
        requested: 'Requested information:',
        bodyRequest: 'I request you to provide the above information under the RTI Act, 2005. If any portion is exempt, please cite the relevant section and provide the remaining non-exempt information.',
        nameLabel: 'Applicant Name:',
        addressLabel: 'Address:',
        mobile: 'Mobile: ____________________',
        email: 'Email: ____________________',
        signature: 'Signature: ____________________',
        date: 'Date: ____________________'
    },
    hi: {
        to: 'प्रति:',
        dept: 'विभाग: ',
        subject: 'विषय: सूचना के अधिकार अधिनियम, 2005 के अंतर्गत सूचना का अनुरोध',
        requested: 'अनुरोधित जानकारी:',
        bodyRequest: 'कृपया उपर्युक्त जानकारी RTI अधिनियम, 2005 के तहत प्रदान करें। यदि कोई भाग अपवादित है, तो संबंधित धारा का उल्लेख करें और शेष गैर-अपवादित जानकारी प्रदान करें।',
        nameLabel: 'आवेदक का नाम:',
        addressLabel: 'पता:',
        mobile: 'मोबाइल: ____________________',
        email: 'ईमेल: ____________________',
        signature: 'हस्ताक्षर: ____________________',
        date: 'तिथि: ____________________'
    },
    te: {
        to: 'కు:',
        dept: 'విభాగం: ',
        subject: 'విషయం: సమాచార హక్కు చట్టం, 2005 ప్రకారం సమాచారాన్ని కోరుతూ',
        requested: 'అనురోధించబడిన సమాచారం:',
        bodyRequest: 'దయచేసి పై సమాచారాన్ని RTI చట్టం, 2005 ప్రకారం అందించండి. ఏ భాగం మినహాయింపుగా ఉంటే సంబంధిత సెక్షన్‌ని పేర్కొని మిగులు అనుమతి లేని సమాచారాన్ని అందించండి.',
        nameLabel: 'అప్లికెంట్ పేరు:',
        addressLabel: 'చిరునామా:',
        mobile: 'మొబైల్: ____________________',
        email: 'ఇమెయిల్: ____________________',
        signature: 'సంతకం: ____________________',
        date: 'తేదీ: ____________________'
    }
};

// ================================================================
//  UI SETUP
// ================================================================

const langSelect = document.getElementById('langSelect');
LANGS.forEach((l, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = l.name;
    langSelect.appendChild(opt);
});
const selectedIndex = LANGS.findIndex(l => l.code === state.lang.code);
if (selectedIndex >= 0) langSelect.selectedIndex = selectedIndex;

langSelect.addEventListener('change', e => {
    state.lang = LANGS[+e.target.value];
    try { localStorage.setItem('rti_lang', state.lang.code); } catch (_) {}
    if (state.recognition) state.recognition.lang = state.lang.code;
    applyLanguage();
});

// ---------- Apply language ----------
function applyLanguage() {
    const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
    const setHtml = (id, key) => { const el = document.getElementById(id); if (el) el.innerHTML = t(key); };

    setText('brandSub', 'brandSub');
    setHtml('rtiInfoTitle', 'rtiInfoTitle');
    setText('rtiInfoLead', 'rtiInfoLead');
    setHtml('rtiInfoNote', 'rtiInfoNote');
    setText('rtiInfoBackBtn', 'rtiInfoBack');
    setHtml('step1Title', 'step1Title');
    setText('step1Subtitle', 'step1Subtitle');
    setHtml('rtiIntroText', 'rtiIntroText');
    setText('readMoreRtiBtn', 'readMoreRti');
    if (!state.recognizing) setText('micStatus', 'micTap');
    setText('fallbackLabel', 'fallbackLabel');
    document.getElementById('fallbackInput').placeholder = t('fallbackPlaceholder');
    setText('tryAgainBtn', 'clearBtn');
    setText('proceedBtn', 'proceedBtn');
    setText('templatesTitle', 'templatesTitle');
    setText('templatesSubtitle', 'templatesSubtitle');
    setHtml('labelName', 'labelName');
    setHtml('labelAddress', 'labelAddress');
    document.getElementById('f_name').placeholder = t('placeholderName');
    document.getElementById('f_address').placeholder = t('placeholderAddress');
    setText('hintAddress', 'hintAddress');
    setHtml('labelSummary', 'labelSummary');
    setHtml('labelDepartment', 'labelDepartment');
    setText('labelLevel', 'labelLevel');
    setText('labelTarget', 'labelTarget');
    setText('hintTarget', 'hintTarget');
    setText('labelConfidence', 'labelConfidence');
    setHtml('labelQuestions', 'labelQuestions');
    setText('hintQuestions', 'hintQuestions');
    setText('backTo1Btn', 'backBtn');
    setText('genDraftBtn', 'genDraftBtn');
    setText('step2LoadingText', 'step2Loading');
    setText('step3LoadingText', 'step3Loading');
    setText('docWatermark', 'docWatermark');
    setText('readAloudBtn', 'readAloud');
    setText('copyBtn', 'copyBtn');
    setText('printBtn', 'printBtn');
    setText('pdfBtn', 'pdfBtn');
    setText('docBtn', 'docBtn');
    setText('shareBtn', 'shareBtn');
    setText('backTo2Btn', 'backTo2Btn');
    setText('restartBtn', 'restartBtn');
    setText('disclaimer', 'disclaimer');

    const levelSel = document.getElementById('f_level');
    const curLevel = levelSel.value || 'Mandal';
    levelSel.innerHTML = '';
    LEVEL_KEYS.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = t('levels')[k];
        levelSel.appendChild(opt);
    });
    if (LEVEL_KEYS.includes(curLevel)) levelSel.value = curLevel;

    const targetInput = document.getElementById('f_target');
    if (targetInput.value) targetInput.value = getTargetOfficer(levelSel.value);

    renderSteptrail();
    renderTemplateGrid();
    renderRtiInfoGrid();
}

// ---------- Render helpers ----------
function renderSteptrail() {
    const el = document.getElementById('steptrail');
    el.innerHTML = '';
    const labels = [t('stepDescribe'), t('stepVerify'), t('stepDraft')];
    labels.forEach((label, i) => {
        const n = i + 1;
        const div = document.createElement('div');
        div.className = 'step-node' + (n === state.currentStep ? ' active' : '') + (n < state.currentStep ? ' done' : '');
        div.innerHTML = `<div class="step-dot">${n < state.currentStep ? '✓' : n}</div><div class="step-label">${label}</div>`;
        el.appendChild(div);
    });
}

// ================================================================
//  AI DYNAMIC SUMMARY GRAMMAR REFINEMENT & POLISH
// ================================================================
document.getElementById('refineGrammarBtn').addEventListener('click', async () => {
    const summaryBox = document.getElementById('f_summary');
    const rawText = summaryBox.value.trim();
    const statusLabel = document.getElementById('refineGrammarStatus');
    
    if (!rawText) {
        statusLabel.textContent = '⚠️ Summary is empty.';
        statusLabel.style.color = '#8A2E1B';
        return;
    }

    const cfg = getGeminiConfig();
    if (!cfg.apiKey) {
        statusLabel.textContent = '⚠️ Please configure Gemini API key first.';
        statusLabel.style.color = '#8A2E1B';
        return;
    }

    statusLabel.textContent = '⏳ Polishing Grammar...';
    statusLabel.style.color = 'var(--muted)';
    document.getElementById('refineGrammarBtn').disabled = true;

    try {
        const langPlain = langKey() === 'en' ? 'English' : (langKey() === 'hi' ? 'Hindi' : 'Telugu');
        const prompt = `
            You are a highly efficient formal administrative editor. 
            Review the following rough spoken issue or statement: "${rawText}"
            
            Rephrase and write exactly ONE grammatically perfect, professional sentence in "${langPlain}" expressing this complaint objectively. 
            Remove colloquial conversational expressions, typos, double spacing, and repeated thoughts.
            Return ONLY the corrected sentence. No commentary, no quote marks, no greeting.
        `;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
        const resp = await fetchWithRetry(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1 }
            })
        });

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(friendlyGeminiError(resp.status, errText));
        }

        const data = await resp.json();
        let cleanText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        
        if (cleanText) {
            summaryBox.value = cleanText.replace(/^"|"$/g, '').trim();
            statusLabel.textContent = '✨ Grammar Polished Successfully!';
            statusLabel.style.color = 'var(--green)';
        } else {
            statusLabel.textContent = '⚠️ Empty response received.';
            statusLabel.style.color = '#8A2E1B';
        }
    } catch (err) {
        console.warn(err);
        statusLabel.textContent = '❌ Rate limited or connection issue.';
        statusLabel.style.color = '#8A2E1B';
    } finally {
        document.getElementById('refineGrammarBtn').disabled = false;
    }
});

function renderTemplateGrid() {
    const grid = document.getElementById('templateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const l10n = TEMPLATE_L10N[langKey()] || TEMPLATE_L10N.en;
    TEMPLATES.forEach((tmpl, i) => {
        const card = document.createElement('button');
        card.className = 'template-card';
        const loc = l10n[i] || { title: tmpl.title, desc: tmpl.desc };
        card.innerHTML = `<div class="t-title">${loc.title}</div><div class="t-desc">${loc.desc}</div>`;
        card.addEventListener('click', () => startFromTemplate(tmpl));
        grid.appendChild(card);
    });
}

function renderRtiInfoGrid() {
    const grid = document.getElementById('rtiInfoGrid');
    grid.innerHTML = '';
    const items = RTI_INFO_L10N[langKey()] || RTI_INFO_L10N.en;
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'rti-info-item';
        div.innerHTML = `<div class="icon">${item.icon}</div><div><h3>${item.title}</h3><p>${item.desc}</p></div>`;
        grid.appendChild(div);
    });
}

// ---------- Navigation ----------
function goToStep(n) {
    state.currentStep = n;
    state.onRtiInfoPage = false;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');
    document.getElementById('steptrail').style.display = '';
    renderSteptrail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openRtiInfo() {
    state.onRtiInfoPage = true;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('rtiInfoPage').classList.add('active');
    document.getElementById('steptrail').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeRtiInfo() {
    state.onRtiInfoPage = false;
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
    document.getElementById('steptrail').style.display = '';
    renderSteptrail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- API config UI ----------
const apiConfigBtn = document.getElementById('apiConfigBtn');
const apiConfigPanel = document.getElementById('apiConfigPanel');
const apiKeyInput = document.getElementById('apiKeyInput');
const modelSelect = document.getElementById('modelSelect');
const saveApiConfigBtn = document.getElementById('saveApiConfigBtn');
const clearApiConfigBtn = document.getElementById('clearApiConfigBtn');
const testApiBtn = document.getElementById('testApiBtn');
const apiConfigMsg = document.getElementById('apiConfigMsg');

try {
    const cfg = JSON.parse(localStorage.getItem('rti_gemini_cfg') || '{}');
    if (cfg.apiKey) apiKeyInput.value = cfg.apiKey;
    if (cfg.model) modelSelect.value = cfg.model;
} catch (_) {}

apiConfigBtn.addEventListener('click', () => {
    apiConfigPanel.style.display = apiConfigPanel.style.display === 'none' ? 'block' : 'none';
});

saveApiConfigBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    const model = modelSelect.value;
    if (!key) {
        apiConfigMsg.textContent = 'Please enter a valid Gemini API key.';
        apiConfigMsg.style.color = '#8A2E1B';
        return;
    }
    saveGeminiConfig(key, model);
    apiConfigMsg.textContent = '✅ Gemini configuration saved locally.';
    apiConfigMsg.style.color = 'var(--muted)';
});

clearApiConfigBtn.addEventListener('click', () => {
    apiKeyInput.value = '';
    modelSelect.value = 'gemini-2.5-flash';
    try { localStorage.removeItem('rti_gemini_cfg'); } catch (_) {}
    apiConfigMsg.textContent = 'Cleared configuration.';
    apiConfigMsg.style.color = 'var(--muted)';
});

testApiBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim() || getGeminiConfig().apiKey;
    if (!key) {
        apiConfigMsg.textContent = '⚠️ No API key set.';
        apiConfigMsg.style.color = '#8A2E1B';
        return;
    }
    const model = modelSelect.value || getGeminiConfig().model || 'gemini-2.5-flash';
    apiConfigMsg.textContent = '⏳ Testing API key...';
    apiConfigMsg.style.color = 'var(--muted)';
    try {
        const resp = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Say "Hello" in one word.' }] }]
                })
            }
        );
        if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            apiConfigMsg.textContent = `✅ Key works! Response: "${text.trim()}"`;
            apiConfigMsg.style.color = 'var(--green)';
        } else {
            const err = await resp.text();
            apiConfigMsg.textContent = `❌ ${friendlyGeminiError(resp.status, err)}`;
            apiConfigMsg.style.color = '#8A2E1B';
        }
    } catch (e) {
        apiConfigMsg.textContent = `❌ Network error: ${e.message}`;
        apiConfigMsg.style.color = '#8A2E1B';
    }
});

// ---------- Protocol warnings ----------
async function checkBrowserWarnings() {
    const protocolWarning = document.getElementById('protocolWarning');
    let warnings = [];
    let usingBrave = false;
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        usingBrave = await navigator.brave.isBrave();
    }
    if (usingBrave) {
        warnings.push(
            `<strong>⚠️ Brave Browser Voice Limitation:</strong> Brave disables the underlying Google Web Speech API for privacy reasons. Real-time voice transcription is not supported in Brave. Please use <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, or <strong>Safari</strong> for voice input, or type your complaint below.`
        );
    } else if (window.location.protocol === 'file:') {
        warnings.push(
            `<strong>⚠️ Voice Input Limitation:</strong> Modern browsers restrict microphone access on local HTML files (<code>file://</code>). To use voice input:<ol style="margin: 6px 0 0; padding-left: 20px;"><li>Open your terminal in the folder containing this file.</li><li>Start a local server by running: <code>npx serve</code> or <code>python3 -m http.server 8000</code></li><li>Open <a href="http://localhost:3000" target="_blank" style="color: #9E6B00; font-weight: bold; text-decoration: underline;">http://localhost:3000</a> (or port 8000).</li></ol>`
        );
    }
    if (warnings.length > 0) {
        protocolWarning.innerHTML = warnings.map(w => `<div class="protocol-warning">${w}</div>`).join('');
        protocolWarning.style.display = 'block';
    } else {
        protocolWarning.style.display = 'none';
    }
}
checkBrowserWarnings();

// ================================================================
//  STEP 1 — VOICE + TEXT + TEMPLATES
// ================================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = document.getElementById('micBtn');
const micRing = document.getElementById('micRing');
const micStatus = document.getElementById('micStatus');
const micTimer = document.getElementById('micTimer');
const liveTranscript = document.getElementById('liveTranscript');
const fallbackInput = document.getElementById('fallbackInput');
const NativeSpeechRecognition = getCapacitorPlugin('SpeechRecognition');
const hasNativeSpeechRecognition = isNativeCapacitor() && !!NativeSpeechRecognition;

if (!SpeechRecognition && !hasNativeSpeechRecognition) {
    micStatus.textContent = t('micNoSupport');
    micBtn.disabled = true;
    micBtn.style.opacity = 0.45;
}

function startTimer() {
    state.timerSeconds = 0;
    micTimer.textContent = '0:00';
    state.timerHandle = setInterval(() => {
        state.timerSeconds++;
        const m = Math.floor(state.timerSeconds / 60),
            s = state.timerSeconds % 60;
        micTimer.textContent = m + ':' + String(s).padStart(2, '0');
    }, 1000);
}

function stopTimer() { clearInterval(state.timerHandle); }

function updateTranscriptFromNativeSpeech(text) {
    const transcript = (text || '').trim();
    liveTranscript.textContent = (state.finalTranscript + transcript).trim();
    fallbackInput.value = liveTranscript.textContent;
}

function finishNativeSpeechRecognition() {
    state.recognizing = false;
    state.recognitionMode = '';
    micRing.classList.remove('recording');
    micStatus.textContent = t('micTap');
    stopTimer();
    state.finalTranscript = liveTranscript.textContent.trim() + ' ';
}

async function cleanupNativeSpeechRecognition() {
    state.nativeSpeechHandles = [];
    if (NativeSpeechRecognition?.removeAllListeners) {
        await NativeSpeechRecognition.removeAllListeners().catch(() => {});
    }
}

async function stopNativeSpeechRecognition() {
    try {
        await NativeSpeechRecognition.stop();
    } catch (_) {}
    await cleanupNativeSpeechRecognition();
    finishNativeSpeechRecognition();
}

async function startNativeSpeechRecognition() {
    try {
        const availability = await NativeSpeechRecognition.available();
        if (!availability.available) {
            console.warn('Native SpeechRecognition not available:', availability);
            micStatus.textContent = t('micUnavailable');
            return;
        }

        const currentPermission = await NativeSpeechRecognition.checkPermissions();
        if (currentPermission.speechRecognition !== 'granted') {
            const requestedPermission = await NativeSpeechRecognition.requestPermissions();
            if (requestedPermission.speechRecognition !== 'granted') {
                console.warn('Native SpeechRecognition permission not granted:', {
                    currentPermission,
                    requestedPermission
                });
                micStatus.textContent = t('micDenied');
                return;
            }
        }


        await cleanupNativeSpeechRecognition();
        state.finalTranscript = liveTranscript.textContent ? liveTranscript.textContent.trim() + ' ' : '';
        state.recognizing = true;
        state.recognitionMode = 'native';
        micRing.classList.add('recording');
        micStatus.textContent = t('micListening');
        startTimer();

        const partialHandle = await NativeSpeechRecognition.addListener('partialResults', data => {
            updateTranscriptFromNativeSpeech((data.matches || [])[0] || '');
        });
        const listeningHandle = await NativeSpeechRecognition.addListener('listeningState', async data => {
            if (data.status === 'stopped' && state.recognitionMode === 'native') {
                await cleanupNativeSpeechRecognition();
                finishNativeSpeechRecognition();
            }
        });
        state.nativeSpeechHandles = [partialHandle, listeningHandle];

        const result = await NativeSpeechRecognition.start({
            language: state.lang.code,
            maxResults: 5,
            prompt: t('micListening'),
            partialResults: true,
            popup: false
        });
        if (result.matches && result.matches.length) {
            updateTranscriptFromNativeSpeech(result.matches[0]);
        }
    } catch (err) {
        await cleanupNativeSpeechRecognition();
        finishNativeSpeechRecognition();
        micStatus.textContent = t('micFail');
        console.warn('Native speech recognition failed:', err);
    }
}

micBtn.addEventListener('click', async () => {
    if (hasNativeSpeechRecognition) {
        if (state.recognizing && state.recognitionMode === 'native') {
            await stopNativeSpeechRecognition();
            return;
        }
        if (!state.recognizing) {
            await startNativeSpeechRecognition();
        }
        return;
    }

    if (!SpeechRecognition) return;
    if (state.recognizing) {
        state.recognition && state.recognition.stop();
        return;
    }
    const rec = new SpeechRecognition();
    rec.lang = state.lang.code;
    rec.continuous = true;
    rec.interimResults = true;
    state.recognition = rec;
    state.finalTranscript = liveTranscript.textContent ? liveTranscript.textContent.trim() + ' ' : '';

    rec.onstart = () => {
        state.recognizing = true;
        micRing.classList.add('recording');
        micStatus.textContent = t('micListening');
        startTimer();
    };
    rec.onresult = (e) => {
        let currentFinal = '';
        let interim = '';
        for (let i = 0; i < e.results.length; i++) {
            const transcriptPiece = e.results[i][0].transcript;
            if (e.results[i].isFinal) { currentFinal += transcriptPiece + ' '; } else { interim += transcriptPiece; }
        }
        liveTranscript.textContent = (state.finalTranscript + currentFinal + interim).trim();
        fallbackInput.value = (state.finalTranscript + currentFinal + interim).trim();
    };
    rec.onerror = (e) => {
        if (e.error === 'not-allowed') {
            micStatus.textContent = window.location.protocol === 'file:' ? t('micBlocked') : t('micDenied');
        } else if (e.error === 'service-not-allowed' || e.error === 'network') {
            micStatus.textContent = t('micUnavailable');
        } else {
            micStatus.textContent = t('micError');
        }
    };
    rec.onend = () => {
        state.recognizing = false;
        micRing.classList.remove('recording');
        micStatus.textContent = t('micTap');
        stopTimer();
        state.finalTranscript = liveTranscript.textContent.trim() + ' ';
    };
    try { rec.start(); } catch (_) { micStatus.textContent = t('micFail'); }
});

document.getElementById('tryAgainBtn').addEventListener('click', () => {
    state.finalTranscript = '';
    liveTranscript.textContent = '';
    fallbackInput.value = '';
    document.getElementById('step1Error').innerHTML = '';
});

// ---------- Template picker ----------
function startFromTemplate(tmpl) {
    document.getElementById('f_summary').value = tmpl.summary || '';
    document.getElementById('f_department').value = tmpl.department || '';
    const level = normalizeLevel(tmpl.level);
    document.getElementById('f_level').value = level;
    document.getElementById('f_target').value = getTargetOfficer(level);
    const qs = tmpl.questions || [];
    document.getElementById('f_questions').value = qs.map((q, i) => (i + 1) + '. ' + q).join('\n');
    document.getElementById('confFill').style.width = '85%';
    document.getElementById('confPct').textContent = '85%';
    document.getElementById('clarificationBox').style.display = 'none';
    goToStep(2);
    document.getElementById('step2Body').style.display = 'block';
    document.getElementById('step2Loading').style.display = 'none';
    clearError('step2Error');
    clearError('step1Error');
}

document.getElementById('readMoreRtiBtn').addEventListener('click', openRtiInfo);
document.getElementById('rtiInfoBackBtn').addEventListener('click', closeRtiInfo);
document.getElementById('backTo1Btn').addEventListener('click', () => goToStep(1));
document.getElementById('backTo2Btn').addEventListener('click', () => goToStep(2));

// ================================================================
//  STEP 1 → STEP 2 — AI Analysis & Dynamic Heuristic Mappings
// ================================================================

document.getElementById('proceedBtn').addEventListener('click', async () => {
    const complaint = (fallbackInput.value.trim() || state.finalTranscript.trim() || liveTranscript.textContent.trim());
    clearError('step1Error');

    if (!complaint) {
        showError('step1Error', t('errNoComplaint'));
        return;
    }

    const proceedBtn = document.getElementById('proceedBtn');
    proceedBtn.disabled = true;
    proceedBtn.textContent = t('step3Loading') || 'Analysing…';

    let intent;
    try {
        intent = await detectRtiIntent(complaint);
    } finally {
        proceedBtn.disabled = false;
        document.getElementById('proceedBtn').textContent = t('proceedBtn');
    }

    if (!intent.should_generate_rti) {
        showIntentGuardModal(intent, complaint);
        return;
    }

    state.originalComplaint = complaint;
    await runIssueAnalysis(complaint);
});

// ---------- Abstracted core analysis engine ----------
async function runIssueAnalysis(complaintText) {
    goToStep(2);
    document.getElementById('step2Body').style.display = 'none';
    document.getElementById('step2Loading').style.display = 'flex';
    document.getElementById('clarificationBox').style.display = 'none';
    clearError('step2Error');

    // Reset fields
    document.getElementById('f_questions').value = '';
    document.getElementById('f_summary').value = '';
    document.getElementById('f_department').value = '';

    const inputIntent = await detectRtiIntent(complaintText, { highConfidenceThreshold: 0.82 });
    if (!inputIntent.should_generate_rti) {
        showIntentGuardModal(inputIntent, complaintText);
        return;
    }

    try {
        const cfg = getGeminiConfig();
        if (cfg.apiKey) {
            try {
                const langPlain = langKey() === 'en' ? 'English' : (langKey() === 'hi' ? 'Hindi' : 'Telugu');
                const prompt = `
                    You are an expert, empathetic civic counselor assisting citizens with Right to Information (RTI) filings under the RTI Act, 2005.
                    Analyze the citizen's complaint below and construct a structured JSON response.

                    EMPATHETIC THINKING & STRICT COGNITIVE LOGIC RULES:
                    1. PRIVATE DISPUTES (e.g. Test Case 9: factory wage delay by a private employer): Set is_rti to false. Write a compassionate, professional explanation in ${langPlain} for "non_rti_reason" stating that RTI only applies to public authorities/government bodies. Direct them to approach the local Labor Court or State Labor Commissioner's grievance cell.
                    2. REFUSE DIRECT ACTION DEMANDS / COMPLAINTS (e.g. Test Case 10: "I want the road in front of my house repaired"): Do not make questions demanding action. Automatically reframe this in "summary" as seeking public project records (e.g. "Seeking records regarding sanction status, budget allocations, contractor work orders, and execution parameters for the road construction project at [Location]"). Ensure the questions seek raw files, dates, and ledgers (e.g. "Provide a certified copy of the sanctioned project report, work order, and contractor name...").
                    3. MIXED ISSUES (e.g. Test Case 8: Pension + Ration card combined): Detect that these target separate departments. Set "confidence" below 85% (e.g. 70) and ask in "clarification_question": "You have mentioned two distinct issues (Ration Card and Pension) which are processed by different departments. Legally, they should be filed as separate RTIs. Which of these two would you like us to focus on for this application draft?"
                    4. EMOTIONAL / VERY VAGUE INPUTS (e.g. Test Case 6: "Sarkar ne pareshan kar diya hai"): Set "confidence" to 40. In "clarification_question", politely ask: "I understand you are facing difficulties with public services. To draft a legally compliant RTI, could you specify which department or service (such as Ration card, Pension, Road construction, or government ID cards) this grievance is about?"
                    5. SHORT FRAGMENT COGNITION (e.g. Test Case 7: "Pension nahi mila"): Set "confidence" to 50. In "clarification_question", ask: "Could you please specify which pension scheme this relates to (e.g., Old Age, Widow, Disability), whether it is State or Central, and if you have an application/reference number?"
                    6. SCHOOL ADMISSION REFUSAL (e.g. Test Case 5): Recognize that direct admission is a grievance, but we can search records. Reframe to: "Requesting certified copies of school admission registers, vacant seat logs, and written reasons recorded on file for admission refusal at [School Name] for the current year."
                    7. EXTRACTING NUMBERS (Aadhaar, Ration, Pension ID, Caste Certificate Ref Numbers):
                       - If any ID number or application reference is provided, inject it directly into the "summary" (e.g. "seeking progress status of Caste Application No. [Ref Number]").
                       - Reference that exact ID/Ref number inside the questions to target your request precisely (e.g. "Provide the date-wise processing logs and files for Application No. [Ref Number]").
                       - If the issue is Pension, Aadhaar, Ration, or Caste, and they haven't provided a number/card ID, set "confidence" below 85% and ask for it in "clarification_question".
                    8. HYPOTHETICAL / FUTURE / NON-RECORD QUERIES (e.g. "What will be the budget for next year's road construction?", "Will the road be repaired next month?", "Predict when pension will increase"): Set is_rti to false. Set rejection_category to "hypothetical". In non_rti_reason, explain in ${langPlain} that RTI can only request information already held in government records — not future budgets, predictions, or opinions. Suggest asking for approved budget documents, sanction orders, tender files, or work-progress reports for a specific project/location instead.
                    9. THIRD-PARTY PERSONAL / SENSITIVE INFORMATION (e.g. "Give me salary and bank account of officer X", "What is the home address or Aadhaar of the SPIO?"): Set is_rti to false. Set rejection_category to "personal_info". Explain in ${langPlain} that RTI cannot be used to obtain another person's salary, bank account, or personal details unless there is overriding public interest (Section 8(1)(j) of RTI Act, 2005).
                    10. VALID RECORD-SEEKING (contrast with rule 8): "What is the sanctioned budget for road work in Village X?" is VALID (seeks existing sanction records). "What will next year's budget be?" is INVALID (hypothetical).

                    Respond ONLY with a valid JSON object matching this schema perfectly with absolutely no external markdown fencing:
                    {
                      "is_rti": true,
                      "rejection_category": "",
                      "non_rti_reason": "If is_rti is false, write a 2-3 sentence compassionate explanation in ${langPlain} explaining why and what they should do instead. Otherwise leave empty.",
                      "summary": "Formal summary in ${langPlain}. Reframe complaints/grievances/demands into objective data-seeking statements of facts. Include reference numbers if provided.",
                      "department": "Official department name handling this issue.",
                      "level": "Village/Mandal/District/State/Central",
                      "questions": ["Question 1", "Question 2", "Question 3", "Question 4"],
                      "confidence": 85,
                      "needs_clarification": false,
                      "clarification_question": "If details (location, State vs Central jurisdiction, scheme name, or reference/card numbers) are missing, write a polite clarifying question in ${langPlain} here."
                    }

                    Complaint: "${complaintText}"
                `;

                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
                const resp = await fetchWithRetry(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.1 }
                    })
                });

                if (!resp.ok) {
                    const errText = await resp.text();
                    throw new Error(friendlyGeminiError(resp.status, errText));
                }

                const data = await resp.json();
                let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                
                // Extract JSON clean-up block
                raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
                const start = raw.indexOf('{');
                const end = raw.lastIndexOf('}');
                if (start === -1 || end === -1) throw new Error('No JSON found in response');
                raw = raw.substring(start, end + 1);
                const parsed = JSON.parse(raw);

                // --- Non-RTI check (analysis layer) ---
                if (parsed.is_rti === false || parsed.confidence === 0) {
                    const analysisIntent = {
                        intent: parsed.rejection_category === 'personal_info' ? 'PERSONAL_INFORMATION'
                            : parsed.rejection_category === 'hypothetical' ? 'HYPOTHETICAL'
                            : parsed.rejection_category === 'private_dispute' ? 'NON_GOVERNMENT'
                            : 'AMBIGUOUS',
                        confidence: 0.9,
                        should_generate_rti: false,
                        response: parsed.non_rti_reason || window.RTIIntentGuard.offlineResponse('AMBIGUOUS', complaintText)
                    };
                    showIntentGuardModal(analysisIntent, complaintText);
                    return;
                }

                const generatedText = (parsed.summary || '') + ' ' + (Array.isArray(parsed.questions) ? parsed.questions.join(' ') : '');
                const postGenIntent = await detectRtiIntent(generatedText, { highConfidenceThreshold: 0.82 });
                if (!postGenIntent.should_generate_rti) {
                    showIntentGuardModal(postGenIntent, complaintText);
                    return;
                }

                // --- Dynamic Clarification (Confidence < 85%) ---
                let confidence = Math.min(100, Math.max(10, parseInt(parsed.confidence) || 75));
                if (confidence < 85 || parsed.needs_clarification === true || (parsed.clarification_question && parsed.clarification_question.trim() !== '')) {
                    // Enforce low confidence display
                    if (confidence >= 85) confidence = 75; 
                    
                    document.getElementById('clarificationQuestionText').textContent = parsed.clarification_question || "Please provide more specific details about your issue (e.g. location, government department, card number) so we can construct a robust application.";
                    document.getElementById('clarificationBox').style.display = 'block';
                    document.getElementById('clarificationAnswer').value = '';
                } else {
                    document.getElementById('clarificationBox').style.display = 'none';
                }

                // Populate details
                document.getElementById('f_summary').value = parsed.summary || complaintText;
                document.getElementById('f_department').value = parsed.department || 'Public Information Officer';
                const lvl = normalizeLevel(parsed.level);
                document.getElementById('f_level').value = lvl;
                document.getElementById('f_target').value = getTargetOfficer(lvl);
                const qs = Array.isArray(parsed.questions) ? parsed.questions : AUTHORITY_MAPPING.default.questions;
                document.getElementById('f_questions').value = qs.map((q, i) => (i + 1) + '. ' + q).join('\n');
                
                document.getElementById('confFill').style.width = confidence + '%';
                document.getElementById('confPct').textContent = confidence + '%';
                
                document.getElementById('step2Loading').style.display = 'none';
                document.getElementById('step2Body').style.display = 'block';
                return;
            } catch (err) {
                console.warn('AI analysis pipeline failed:', err);
                showError('step2Error', `⚠️ AI analysis error: ${err.message}. Loaded offline fallback templates.`);
            }
        } else {
            showError('step2Error', '⚠️ No Gemini API key set. Loaded offline fallback templates.');
        }

        // ---------- Fallback: Offline Keyword mapping with smart checks ----------
        let matched = detectAuthorityFromText(complaintText);
        let fallbackDept = matched ? matched.department : 'Public Works Department / Municipality';
        let fallbackLevel = normalizeLevel(matched ? matched.level : 'Mandal');
        let fallbackQuestions = matched && matched.questions ? matched.questions : AUTHORITY_MAPPING.default.questions;
        let summary = complaintText;
        let calculatedConfidence = 70;
        let clarificationPromptText = '';

        const offlineIntent = await detectRtiIntent(complaintText, { skipLlm: true, highConfidenceThreshold: 0.82 });
        if (!offlineIntent.should_generate_rti) {
            showIntentGuardModal(offlineIntent, complaintText);
            return;
        }

        // Simple offline gap check for road construction and pension
        const lowerComp = complaintText.toLowerCase();
        if (lowerComp.includes('road') && !lowerComp.includes('village') && !lowerComp.includes('at') && !lowerComp.includes('near')) {
            calculatedConfidence = 65;
            clarificationPromptText = "Which specific road or village location does this road construction problem concern?";
        } else if (lowerComp.includes('pension') && !lowerComp.includes('state') && !lowerComp.includes('central') && !lowerComp.includes('old age') && !lowerComp.includes('widow')) {
            calculatedConfidence = 65;
            clarificationPromptText = "Is this a Central Government pension scheme (like EPFO) or a State Government pension welfare scheme?";
        }

        if (clarificationPromptText) {
            document.getElementById('clarificationQuestionText').textContent = clarificationPromptText;
            document.getElementById('clarificationBox').style.display = 'block';
        }

        const sentences = complaintText.split(/[.!?]+/).filter(s => s.trim().length > 10);
        if (sentences.length > 0) {
            summary = sentences.slice(0, 2).join('. ') + '.';
        }
        document.getElementById('f_summary').value = summary;
        document.getElementById('f_department').value = fallbackDept;
        document.getElementById('f_level').value = fallbackLevel;
        document.getElementById('f_target').value = getTargetOfficer(fallbackLevel);
        document.getElementById('f_questions').value = fallbackQuestions.map((q, i) => (i + 1) + '. ' + q).join('\n');
        
        document.getElementById('confFill').style.width = calculatedConfidence + '%';
        document.getElementById('confPct').textContent = calculatedConfidence + '%';

    } catch (err) {
        console.error('Core Analysis error:', err);
        showError('step2Error', `⚠️ Unexpected error: ${err.message}. Using fallback.`);
    } finally {
        document.getElementById('step2Loading').style.display = 'none';
        document.getElementById('step2Body').style.display = 'block';
    }
}

// ---------- Clarification Answer Submission ----------
document.getElementById('submitClarificationBtn').addEventListener('click', async () => {
    const answer = document.getElementById('clarificationAnswer').value.trim();
    if (!answer) return;

    // Merge answers to build an expanded query profile
    const expandedComplaintText = `Original Problem: ${state.originalComplaint}. Additional clarified details: ${answer}`;
    state.originalComplaint = expandedComplaintText; // save iteration
    
    await runIssueAnalysis(expandedComplaintText);
});

// Close Intent Guard Modal
document.getElementById('closeNonRtiModalBtn').addEventListener('click', () => {
    document.getElementById('nonRtiModal').style.display = 'none';
    document.getElementById('reframeRtiBtn').style.display = 'none';
    state.pendingReframeComplaint = '';
});

document.getElementById('reframeRtiBtn').addEventListener('click', async () => {
    const complaint = state.pendingReframeComplaint || state.originalComplaint;
    document.getElementById('nonRtiModal').style.display = 'none';
    document.getElementById('reframeRtiBtn').style.display = 'none';
    if (!complaint) return;
    state.originalComplaint = complaint;
    state.pendingReframeComplaint = '';
    await runIssueAnalysis(complaint);
});

// ================================================================
//  STEP 2 → STEP 3 — Generate Draft & Format Clean-up
// ================================================================

document.getElementById('genDraftBtn').addEventListener('click', async () => {
    const summary = document.getElementById('f_summary').value.trim();
    const department = document.getElementById('f_department').value.trim() || 'Public Information Officer';
    const level = normalizeLevel(document.getElementById('f_level').value);
    const targetOfficer = document.getElementById('f_target').value || getTargetOfficer(level);
    const applicantName = document.getElementById('f_name').value.trim();
    const applicantAddress = document.getElementById('f_address').value.trim();
    const questionsRaw = document.getElementById('f_questions').value.trim();

    clearError('step2Error');

    if (!summary) {
        showError('step2Error', t('errStep2Fields'));
        return;
    }
    if (!questionsRaw) {
        showError('step2Error', 'Please provide at least one question.');
        return;
    }

    const questions = questionsRaw.split('\n').map(q => q.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    if (!questions.length) {
        showError('step2Error', 'Please provide at least one question.');
        return;
    }

    const draftValidation = await validateBeforeDraft(summary, questions);
    if (!draftValidation.eligible) {
        showIntentGuardModal({
            intent: draftValidation.intent || 'AMBIGUOUS',
            confidence: 0.9,
            should_generate_rti: false,
            response: draftValidation.reason
        }, state.originalComplaint);
        return;
    }

    goToStep(3);
    document.getElementById('step3Loading').style.display = 'flex';
    document.getElementById('step3Body').style.display = 'none';
    clearError('step3Error');

    const cfg = getGeminiConfig();
    let usedAi = false;
    let errorMsg = '';

    try {
        if (cfg.apiKey) {
            const langPlain = langKey() === 'en' ? 'English' : (langKey() === 'hi' ? 'Hindi' : 'Telugu');
            const prompt = `
                You are a legal assistant drafting a formal RTI application. Respond ONLY with a JSON object (no markdown, no formatting blocks) in this schema:
                {
                  "draftText": "Complete application text with proper line breaks.",
                  "qualityScore": 88,
                  "suggestions": ["Suggestion 1", "Suggestion 2"]
                }
                Use these details:
                To: ${targetOfficer}
                Department: ${department} (${level})
                Summary: ${summary}
                Questions: ${questions.map((q,i) => (i+1)+'. '+q).join(' ')}
                Write completely in ${langPlain}, using a highly formal, authoritative tone. Ensure the issue summary in the draft matches the provided corrected summary, without structural run-ons or colloquial speech.
            `;

            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`;
            const resp = await fetchWithRetry(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3 }
                })
            });

            if (!resp.ok) {
                const errText = await resp.text();
                throw new Error(friendlyGeminiError(resp.status, errText));
            }

            const data = await resp.json();
            let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Extract JSON clean-up
            raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
            const start = raw.indexOf('{');
            const end = raw.lastIndexOf('}');
            if (start === -1 || end === -1) throw new Error('No JSON found in response');
            raw = raw.substring(start, end + 1);
            const parsed = JSON.parse(raw);

            let draftText = parsed.draftText || '';
            
            // Strip optional inputs if empty
            if (!applicantName) {
                draftText = stripFieldPlaceholder(draftText, [
                    /Applicant Name:\s*[_\-\s]+/gi,
                    /आवेदक का नाम:\s*[_\-\s]+/g,
                    /అప్లికెంట్ పేరు:\s*[_\-\s]+/g
                ]);
            }
            if (!applicantAddress) {
                draftText = stripFieldPlaceholder(draftText, [
                    /Address:\s*[_\-\s]+/gi,
                    /पता:\s*[_\-\s]+/g,
                    /చిరునామా:\s*[_\-\s]+/g
                ]);
            }

            state.draft = {
                draftText: draftText,
                qualityScore: Math.min(100, Math.max(50, parseInt(parsed.qualityScore) || 80)),
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [t('sugFillSig'), t('sugRefNum')]
            };
            usedAi = true;
            renderDraft(state.draft, department, level);
            return;
        } else {
            errorMsg = 'No Gemini API key configured.';
        }
    } catch (err) {
        console.warn('Draft generation with AI failed:', err);
        errorMsg = err.message || 'Unknown error';
    }

    // Safe robust fallback mapping
    const fallbackDraft = buildFallbackDraft(summary, questions, department, level, targetOfficer);
    state.draft = {
        draftText: fallbackDraft,
        qualityScore: 70,
        suggestions: [t('sugFillSig'), t('sugRefNum')]
    };
    renderDraft(state.draft, department, level);
    if (!usedAi) {
        const reason = String(errorMsg || 'Unknown error').replace(/[.。]+$/u, '');
        showError('step3Error', `AI Draft Generation: ${reason}. A legally compliant fallback document has been built for you to download, edit, or print below.`);
    }
});

// ---------- Fallback draft builder ----------
function buildFallbackDraft(summary, questions, department, level, targetOfficer) {
    const code = langKey();
    const dict = FALLBACK_TEXTS[code] || FALLBACK_TEXTS.en;
    const lines = [];
    lines.push(dict.to.trimEnd() + ' ' + targetOfficer);
    lines.push(dict.dept.trimEnd() + ' ' + department + ' (' + level + ')');
    lines.push(dict.subject);
    lines.push('');
    lines.push(summary);
    lines.push('');
    lines.push(dict.requested);
    questions.forEach((q, i) => lines.push((i + 1) + '. ' + q));
    lines.push('');
    lines.push(dict.bodyRequest);
    lines.push('');
    lines.push(dict.nameLabel);
    lines.push(dict.addressLabel);
    lines.push(dict.mobile);
    lines.push(dict.email);
    lines.push(dict.signature);
    lines.push(dict.date);
    return lines.join('\n');
}

function stripFieldPlaceholder(draftText, patterns) {
    if (!draftText) return draftText;
    let text = draftText;
    patterns.forEach(re => {
        text = text.replace(re, (m) => {
            const parts = m.split(':');
            return parts.length > 1 ? parts[0] + ':' : m;
        });
    });
    return text;
}

// ---------- Render draft ----------
function renderDraft(json, department, level) {
    document.getElementById('step3Loading').style.display = 'none';
    document.getElementById('step3Body').style.display = 'block';
    document.getElementById('draftText').textContent = json.draftText || '';
    document.getElementById('docMeta').textContent = department + ' · ' + level;
}

function getBase64FromDataUrl(dataUrl) {
    return String(dataUrl || '').split(',')[1] || '';
}

async function writeNativeDocument(path, data, options = {}) {
    const Filesystem = getCapacitorPlugin('Filesystem');
    if (!isNativeCapacitor()) {
        console.warn('writeNativeDocument called but not native');
        return false;
    }
    if (!Filesystem) {
        console.warn('Filesystem plugin missing');
        return false;
    }

    try {
        await Filesystem.writeFile({
            path,
            data,
            directory: 'DOCUMENTS',
            ...options
        });
        return true;
    } catch (err) {
        console.error('Native Filesystem.writeFile failed:', err);
        return false;
    }
}

// ================================================================
//  STEP 3 — ACTIONS
// ================================================================

document.getElementById('restartBtn').addEventListener('click', () => {
    state.finalTranscript = '';
    liveTranscript.textContent = '';
    fallbackInput.value = '';
    document.getElementById('f_summary').value = '';
    document.getElementById('f_name').value = '';
    document.getElementById('f_address').value = '';
    document.getElementById('f_department').value = '';
    document.getElementById('f_target').value = '';
    document.getElementById('f_questions').value = '';
    document.getElementById('confFill').style.width = '0%';
    document.getElementById('confPct').textContent = '0%';
    goToStep(1);
});

document.getElementById('copyBtn').addEventListener('click', async () => {
    const text = document.getElementById('draftText').textContent;
    try {
        await navigator.clipboard.writeText(text);
        flashLabel('copyBtn', t('copied'));
    } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        flashLabel('copyBtn', t('copied'));
    }
});

document.getElementById('printBtn').addEventListener('click', () => window.print());

document.getElementById('shareBtn').addEventListener('click', async () => {
    const text = document.getElementById('draftText').textContent;
    const NativeShare = getCapacitorPlugin('Share');
    if (isNativeCapacitor() && NativeShare) {
        try {
            await NativeShare.share({
                title: 'RTI Application',
                text,
                dialogTitle: 'Share RTI Application'
            });
            return;
        } catch (_) {}
    }

    if (navigator.share) {
        try { await navigator.share({ title: 'RTI Application', text }); } catch (_) {}
    } else {
        await navigator.clipboard.writeText(text).catch(() => {});
        flashLabel('shareBtn', t('shareCopied'));
    }
});

document.getElementById('pdfBtn').addEventListener('click', async () => {
    const el = document.getElementById('draftDocument');
    flashLabel('pdfBtn', t('pdfPreparing'));
    try {
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 24;
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
        while (heightLeft > 0) {
            position = margin - (imgHeight - heightLeft);
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - margin * 2);
        }

        const dataUri = pdf.output('datauristring');
        const base64 = getBase64FromDataUrl(dataUri);

        if (isNativeCapacitor()) {
            const ok = await writeNativeDocument('RTI_Application.pdf', base64);
            if (!ok) {
                console.warn('Native PDF save failed; falling back to Print');
                // Fallback: print dialog
                window.print();
                showError('step3Error', 'PDF save failed in Android. Use Print → Save as PDF.');
                return;
            }
            flashLabel('pdfBtn', '✅ Saved');
            return;
        }

        pdf.save('RTI_Application.pdf');
    } catch (err) {
        console.error('PDF generation failed:', err);
        showError('step3Error', t('errPdf'));
    }
});

document.getElementById('docBtn').addEventListener('click', async () => {
    const content = document.getElementById('draftDocument').innerHTML;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>RTI Application</title></head><body>${content}</body></html>`;

    if (isNativeCapacitor()) {
        const ok = await writeNativeDocument('RTI_Application.doc', '\ufeff' + html, { encoding: 'utf8' });
        if (!ok) {
            console.warn('Native DOC save failed; falling back to download');
            showError('step3Error', 'DOCX save failed in Android. Using download fallback.');
        } else {
            flashLabel('docBtn', '✅ Saved');
            return;
        }
    }

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RTI_Application.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

document.getElementById('readAloudBtn').addEventListener('click', () => {
    const btn = document.getElementById('readAloudBtn');
    if (state.speaking) {
        speechSynthesis.cancel();
        state.speaking = false;
        btn.textContent = t('readAloud');
        return;
    }
    const text = document.getElementById('draftText').textContent;
    if (!text || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = state.lang.code;
    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.lang === state.lang.code) || voices.find(v => v.lang.startsWith(state.lang.code.split('-')[0]));
    if (match) utter.voice = match;
    utter.onend = () => { 
        state.speaking = false;
        btn.textContent = t('readAloud'); 
    };
    state.speaking = true;
    btn.textContent = t('readAloudStop');
    speechSynthesis.speak(utter);
});

// ================================================================
//  INIT
// ================================================================

async function initializeNativeShell() {
    if (!isNativeCapacitor()) return;

    const StatusBar = getCapacitorPlugin('StatusBar');
    const SplashScreen = getCapacitorPlugin('SplashScreen');

    if (StatusBar) {
        await StatusBar.setStyle({ style: 'LIGHT' }).catch(() => {});
        await StatusBar.setBackgroundColor({ color: '#0B3D62' }).catch(() => {});
    }

    if (SplashScreen) {
        await SplashScreen.hide().catch(() => {});
    }
}

renderSteptrail();
renderTemplateGrid();
renderRtiInfoGrid();
applyLanguage();
initializeNativeShell();

// Pre-populate level -> target mapping
document.getElementById('f_level').addEventListener('change', function() {
    document.getElementById('f_target').value = getTargetOfficer(this.value);
});

console.log('✅ RTI Sahayak loaded. Speak, type, or pick a template.');
console.log('📌 Set your Gemini API key via the ⚙️ gear icon for AI enhancements.');
console.log('🔍 Use the "Test Key" button to verify your API key works.');
