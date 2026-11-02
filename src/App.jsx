import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "./firebase";
import { translations } from "./i18n";
import { districts } from "./data/districts";

import Auth from "./components/Auth";
import Tour from "./components/Tour";

import GovernmentSchemes from "./GovernmentSchemes";
import SchemeDetails from "./SchemeDetails";
import FirebaseSkills from "./FirebaseSkills";
import FirebaseSHG from "./FirebaseSHG";
import FirebaseHelplines from "./FirebaseHelplines";

import "./styles.css";



const nav = [
  "home",
  "schemes",
  "skills",
  "shg",
  "saved",
  "help",
  "about"
];


export default function App() {

  const [lang, setLang] = useState(
    localStorage.getItem("unnatiLanguage") || "en"
  );

  const [page, setPage] = useState("home");
  const [selectedScheme, setSelectedScheme] = useState(null);

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfile] = useState(null);

  const [authMode, setAuthMode] = useState("login");

  const [district, setDistrict] = useState("");

  const [tour, setTour] = useState(false);

  const [saved, setSaved] = useState([]);

  const [savedItems, setSavedItems] = useState([]);


  const t =
    translations[lang] ||
    translations.en;


  // ==========================================
  // SAVE LANGUAGE
  // ==========================================

  useEffect(() => {

    localStorage.setItem(
      "unnatiLanguage",
      lang
    );

  }, [lang]);


  // ==========================================
  // FIREBASE AUTHENTICATION
  // ==========================================

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          setUser(currentUser);

          setAuthLoading(false);


          // --------------------------------
          // LOGGED OUT
          // --------------------------------

          if (!currentUser) {

            setProfile(null);

            setSaved([]);
            setSavedItems([]);

            setPage("home");

            setSelectedScheme(null);

            setTour(false);

            setAuthMode("login");

            return;
          }


          // --------------------------------
          // LOGGED IN
          // --------------------------------

          try {

            const profileSnapshot =
              await getDoc(
                doc(
                  db,
                  "users",
                  currentUser.uid
                )
              );


            setProfile(
              profileSnapshot.data() || null
            );


            const savedQuery =
              query(
                collection(
                  db,
                  "savedResources"
                ),
                where(
                  "userId",
                  "==",
                  currentUser.uid
                )
              );


            const savedSnapshot =
              await getDocs(
                savedQuery
              );


            const loadedSavedItems = savedSnapshot.docs.map((item) => ({
              firestoreId: item.id,
              ...item.data()
            }));
            setSavedItems(loadedSavedItems);
            setSaved(loadedSavedItems.map((item) => item.dataKey || item.resourceId));


            // Start tour only for first visit
            // Automatically start the tour after login
            setPage("home");
            setTour(true);

          } catch (error) {

            console.error(
              "Error loading user profile:",
              error
            );

          }

        }
      );


    return unsubscribe;

  }, []);


  // ==========================================
  // SAVE / UNSAVE RESOURCE
  // ==========================================

  async function saveResource(resource, type) {
    if (!user || !resource?.id) return;
    const dataKey = `${type}_${resource.id}`;
    const firestoreId = `${user.uid}_${dataKey}`;
    const existing = savedItems.find((item) =>
      (item.dataKey || item.resourceId) === dataKey
    );
    if (existing) {
      await deleteDoc(doc(db, "savedResources", existing.firestoreId || firestoreId));
      setSavedItems((items) => items.filter((item) =>
        (item.dataKey || item.resourceId) !== dataKey
      ));
      setSaved((items) => items.filter((item) => item !== dataKey));
      return;
    }
    const savedRecord = {
      userId: user.uid,
      resourceId: dataKey,
      dataKey,
      type,
      resource: { ...resource, type },
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, "savedResources", firestoreId), savedRecord);
    setSavedItems((items) => [...items, { ...savedRecord, firestoreId }]);
    setSaved((items) => [...items, dataKey]);
  }


  // NAVIGATION
  // ==========================================

  function go(nextPage) {

    // Never allow navigation without login
    if (!user) {
      return;
    }


    setPage(nextPage);


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  // ==========================================
  // AUTH CHECKING
  // ==========================================

  if (authLoading) {

    return (

      <div className="modal-backdrop">

        <div className="auth-card">

          <img
            src="/unnati-logo.png"
            className="auth-logo"
            alt="UNNATI"
          />

          <h2>
            UNNATI
          </h2>

          <p>
            Checking login...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!user) {

    return (

      <Auth
        mode={authMode}
        setMode={setAuthMode}
        onClose={() =>
          setAuthMode("login")
        }
        required={true}
      />

    );

  }


  // ==========================================
  // LOGGED IN WEBSITE
  // ==========================================

  return (

    <div>

      {/* WEBSITE TOUR */}

      <Tour
        run={tour}
        setRun={setTour}
        lang={lang}
        t={t}
        currentPage={page}
        onNavigate={go}
      />


      {/* ======================================
          HEADER
      ======================================= */}

      <header>

        <button
          className="brand"
          onClick={() =>
            go("home")
          }
        >

          <img
            src="/unnati-logo.png"
            alt="UNNATI logo"
          />

        </button>


        {/* NAVIGATION */}

        <nav className="main-nav">

          {nav.map((item) => (

            <button
              key={item}
              data-tour={`nav-${item}`}
              onClick={() =>
                go(item)
              }
              className={
                page === item
                  ? "active"
                  : ""
              }
            >
              {item === "saved" ? (lang === "hi" ? "सहेजे गए संसाधन" : lang === "mr" ? "जतन केलेली संसाधने" : "Saved Resources") : t[item]}
            </button>

          ))}

        </nav>


        {/* RIGHT SIDE */}

        <div className="header-right">

          {/* LANGUAGE */}

          <select
            className="language-selector"
            data-tour="language-selector"
            value={lang}
            onChange={(e) =>
              setLang(e.target.value)
            }
            aria-label={t.language}
          >

            <option value="en">
              English
            </option>

            <option value="hi">
              हिंदी
            </option>

            <option value="mr">
              मराठी
            </option>

          </select>


          {/* PERMANENT GUIDE BUTTON */}

          <button
            type="button"
            className="guide-toggle-btn"
            data-tour="guide-btn"
            onClick={() => {
              setTour(true);
            }}
            aria-label={t.tourGuideBtn || "Guide"}
            title={t.tourGuideBtn || "Guide"}
          >
            ❓ {t.tourGuideBtn || "Guide"}
          </button>


          {/* DASHBOARD */}

          <button
            className="btn ghost"
            data-tour="header-dashboard"
            onClick={() =>
              go("dashboard")
            }
          >
            {t.dashboard}
          </button>


          {/* LOGOUT */}

          <button
            className="btn primary"
            onClick={() =>
              signOut(auth)
            }
          >
            {t.logout}
          </button>

        </div>

      </header>


      {/* ======================================
          MAIN
      ======================================= */}

      <main>

        {/* HOME */}

        {page === "home" && (

          <Home
            t={t}
            district={district}
            setDistrict={setDistrict}
            go={go}
          />

        )}


        {/* ====================================
            GOVERNMENT SCHEMES
        ===================================== */}

        {page === "schemes" && (

          <GovernmentSchemes
            lang={lang}
            t={t}
            saved={saved}
            onSave={(scheme) => saveResource(scheme, "scheme")}
            onViewDetails={(scheme) => {

              setSelectedScheme(
                scheme
              );

              setPage(
                "scheme-details"
              );

              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });

            }}
          />

        )}
        {/* ====================================
            SCHEME DETAILS
        ===================================== */}

        {page === "scheme-details" &&
          selectedScheme && (

            <SchemeDetails
              scheme={selectedScheme}
              lang={lang}
              t={t}
              onBack={() => {

                setSelectedScheme(
                  null
                );

                setPage(
                  "schemes"
                );

                window.scrollTo({
                  top: 0,
                  behavior: "smooth"
                });

              }}
            />

          )}


        {/* SKILLS */}

        {page === "skills" && (

          <FirebaseSkills
            lang={lang}
            t={t}
            saved={saved}
            onSave={(skill) => saveResource(skill, "skill")}
          />

        )}


        {/* SHGs */}

        {page === "shg" && (

          <FirebaseSHG
            lang={lang}
            t={t}
            saved={saved}
            onSave={(shg) => saveResource(shg, "shg")}
          />

        )}


        {/* SAVED RESOURCES */}
        {page === "saved" && (
          <SavedResources
            items={savedItems}
            onUnsave={(item) => saveResource(item.resource, item.type || item.resource?.type || "resource")}
            lang={lang}
            go={go}
            onViewDetails={(scheme) => {
              setSelectedScheme(scheme);
              setPage("scheme-details");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {/* HELPLINES */}

        {page === "help" && (

          <FirebaseHelplines
            lang={lang}
            t={t}
          />

        )}


        {/* ABOUT */}

        {page === "about" && (
          <About lang={lang} t={t} />
        )}


        {/* DASHBOARD */}

        {page === "dashboard" && (

          <Dashboard
            user={user}
            profile={profile}
            saved={saved}
            logout={() =>
              signOut(auth)
            }
            go={go}
            t={t}
            lang={lang}
          />

        )}

      </main>


      {/* ======================================
          FOOTER
      ======================================= */}

      <footer>

        <img
          src="/unnati-logo.png"
          alt="UNNATI"
        />

        <p>
          {t.footerText}
        </p>

      </footer>

    </div>

  );

}


// Skill images use the same image filenames as the Skill Development tab.
const SAVED_SKILL_IMAGE_MAP = [
  ["accounting", "01_accounting.png"], ["bag making", "02_bag-making.png"],
  ["baking", "03_baking.png"], ["business planning", "04_business-planning.png"],
  ["business registration", "05_business-registration.png"], ["candle making", "06_candle-making.png"],
  ["childcare", "07_childcare.png"], ["communication skills", "08_communication-skills.png"],
  ["cooking", "09_cooking.png"], ["dairy farming", "10_dairy-farming.png"],
  ["elderly care", "11_elderly-care.png"], ["english skills", "12_english-skills.png"],
  ["embroidery", "13_embroidery.png"], ["entrepreneurship", "14_entrepreneurship-self-employment.png"],
  ["financial literacy", "15_financial-literacy.png"], ["finding customers", "16_finding-customers.png"],
  ["food processing", "17_food-processing.png"], ["hair styling", "18_hair-styling.png"],
  ["interview skills", "19_interview-skills.png"], ["jewellery making", "20_jewellery-making.png"],
  ["makeup", "21_makeup.png"], ["market research", "22_market-research.png"],
  ["nail art", "23_nail-art.png"], ["organic farming", "24_organic-farming.png"],
  ["painting", "25_painting.png"], ["pottery", "26_pottery.png"],
  ["poultry farming", "27_poultry-farming.png"], ["pricing costing", "28_pricing-costing.png"],
  ["product packaging", "29_product-packaging.png"], ["public speaking", "30_public-speaking.png"],
  ["self employment opportunities", "31_self-employment-opportunities.png"], ["skin care", "32_skin-care.png"],
  ["soap making", "33_soap-making.png"], ["tailoring", "tailoring.png"],
  ["handicraft", "Handicraft.png"], ["floral decoration", "Floral-Decoration.png"],
  ["gift making", "Gift-Making.png"], ["startup basics", "Startup-Basics.png"],
  ["starting a home business", "34_starting-a-home-business.png"], ["teaching tutoring", "35_teaching-tutoring.png"]
];
function savedSkillImage(resource) {
  const name = String(resource?.skill_name_en || resource?.skill_name || resource?.name_en || resource?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = SAVED_SKILL_IMAGE_MAP.find(([keyword]) => name.includes(keyword.toLowerCase().replace(/[^a-z0-9]/g, "")));
  return match ? `/images/skills/${match[1]}` : null;
}

// ==================================================
// SAVED RESOURCES
// ==================================================
function SavedResources({ items, onUnsave, lang, go, onViewDetails }) {
  const [filter, setFilter] = useState("all");
  const labels = lang === "hi"
    ? { title: "सहेजे गए संसाधन", empty: "आपने अभी तक कोई संसाधन नहीं सहेजा है।", all: "सभी", scheme: "योजनाएँ", skill: "कौशल", shg: "स्वयं सहायता समूह", remove: "हटाएँ" }
    : lang === "mr"
    ? { title: "जतन केलेली संसाधने", empty: "तुम्ही अद्याप कोणतेही संसाधन जतन केलेले नाही.", all: "सर्व", scheme: "योजना", skill: "कौशल्ये", shg: "बचत गट", remove: "काढून टाका" }
    : { title: "Saved Resources", empty: "You haven't saved any resources yet.", all: "All", scheme: "Schemes", skill: "Skills", shg: "SHGs", remove: "Remove" };
  const filtered = items.filter((item) => filter === "all" || (item.type || item.resource?.type) === filter);
  const asText = (value) => {
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (value && typeof value === "object") return String(value[lang] || value.en || value.hi || value.mr || Object.values(value)[0] || "");
    return "";
  };
  const titleOf = (item) => {
    const r = item.resource || {};
    return asText(r.name_en || r.name || r.institutional_hub_en || r.institutional_hub || r.skill_name_en || r.skill_name || r.title) || "Saved resource";
  };
  const descriptionOf = (item) => {
    const r = item.resource || {};
    return asText(r.purpose_en || r.purpose || r.description_en || r.description || r.key_services_en || r.key_services);
  };
  return (
    <section className="page saved-resources-page">
      <h1>{labels.title}</h1>
      <div className="saved-resource-filters" aria-label="Filter saved resources">
        {[["all", labels.all], ["scheme", labels.scheme], ["skill", labels.skill], ["shg", labels.shg]].map(([value, label]) => (
          <button key={value} type="button" className={`btn ${filter === value ? "primary" : "ghost"}`} onClick={() => setFilter(value)}>{label}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="resource-card saved-empty">
          <p>{items.length ? "No saved items in this category." : labels.empty}</p>
          <div className="card-actions">
            <button className="btn secondary" onClick={() => go("schemes")}>{labels.scheme}</button>
            <button className="btn secondary" onClick={() => go("skills")}>{labels.skill}</button>
            <button className="btn secondary" onClick={() => go("shg")}>{labels.shg}</button>
          </div>
        </div>
      ) : (
        <div className="saved-resource-grid">
          {filtered.map((item) => (
            <article className="resource-card saved-resource-card" key={item.firestoreId || item.resourceId}>
              <span className="saved-type-label">{labels[item.type || item.resource?.type] || labels.all}</span>
              {(item.type || item.resource?.type) === "skill" && savedSkillImage(item.resource) && (
                <img
                  className="firebase-skill-image"
                  src={savedSkillImage(item.resource)}
                  alt={titleOf(item)}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
              <h2>{titleOf(item)}</h2>
              {descriptionOf(item) && <p>{descriptionOf(item)}</p>}
              {(item.resource?.district || item.resource?.taluka) && <p>{[item.resource.taluka, item.resource.district].filter(Boolean).join(", ")}</p>}
              <div className="card-actions">
                {/* Show the same useful actions available on the original resource tab. */}
                {(item.type || item.resource?.type) === "scheme" && (
                  <>
                    <button
                      type="button"
                      className="details-btn"
                      onClick={() => onViewDetails?.(item.resource)}
                    >
                      {lang === "hi" ? "विवरण देखें" : lang === "mr" ? "तपशील पहा" : "View Details"}
                    </button>
                    {item.resource?.official_link && (
                      <a
                        className="official-btn"
                        href={item.resource.official_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {lang === "hi" ? "आधिकारिक वेबसाइट ↗" : lang === "mr" ? "अधिकृत वेबसाइट ↗" : "Official Website ↗"}
                      </a>
                    )}
                  </>
                )}

                {(item.type || item.resource?.type) === "skill" && item.resource?.learning_link && (
                  <a
                    className="firebase-btn"
                    href={item.resource.learning_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {lang === "hi" ? "सीखना शुरू करें ↗" : lang === "mr" ? "शिकायला सुरुवात करा ↗" : "Start Learning ↗"}
                  </a>
                )}

                {(item.type || item.resource?.type) === "shg" && item.resource?.phone && (
                  <a
                    className="firebase-btn"
                    href={`tel:${String(item.resource.phone).replace(/[^0-9+]/g, "")}`}
                  >
                    {lang === "hi" ? "संपर्क करें" : lang === "mr" ? "संपर्क करा" : "Call Contact"}
                  </a>
                )}

                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => onUnsave(item)}
                >
                  {labels.remove}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


// ==================================================
// ABOUT UNNATI
// ==================================================
function About({ lang, t }) {
  const copy = lang === "hi"
    ? {
        introTitle: "डिजिटल अवसरों के माध्यम से महिलाओं को सशक्त बनाना",
        intro: "UNNATI एक डिजिटल प्लेटफ़ॉर्म है जो महिलाओं को सरकारी कल्याणकारी योजनाओं, कौशल विकास के अवसरों, स्वयं सहायता समूहों (SHGs) और आवश्यक सहायता सेवाओं से जोड़ता है। इसका उद्देश्य विशेष रूप से ग्रामीण और वंचित समुदायों की महिलाओं के लिए उपयोगी जानकारी को सुलभ, सरल और सुविधाजनक बनाना है।",
        missionTitle: "हमारा मिशन",
        mission: "हमारा मिशन महिलाओं को एक ही डिजिटल प्लेटफ़ॉर्म पर प्रासंगिक संसाधनों और अवसरों तक पहुँच देकर आर्थिक रूप से स्वतंत्र, कुशल, जागरूक और आत्मविश्वासी बनने में सहायता करना है।",
        offersTitle: "UNNATI क्या प्रदान करता है",
        offers: [
          ["🏛️", "सरकारी योजनाएँ", "योजनाओं, पात्रता, लाभों और आधिकारिक आवेदन संसाधनों की जानकारी।"],
          ["📚", "कौशल विकास", "व्यावहारिक, रचनात्मक और उद्यमशीलता कौशल विकसित करने के अवसर।"],
          ["🤝", "स्वयं सहायता समूह", "सामूहिक विकास, सहयोग और आय अर्जित करने वाली गतिविधियों के लिए SHG की जानकारी।"],
          ["🆘", "हेल्पलाइन और सहायता", "महत्वपूर्ण हेल्पलाइन नंबरों और सहायता संसाधनों तक पहुँच।"],
          ["🔖", "सहेजे गए संसाधन", "पंजीकृत उपयोगकर्ता उपयोगी योजनाओं, कौशल और SHG जानकारी को बाद में देखने के लिए सहेज सकते हैं।"],
          ["🌐", "समावेशी पहुँच", "अंग्रेज़ी, हिंदी और मराठी में जानकारी समझना आसान बनाने वाला अनुभव।"]
        ],
        visionTitle: "हमारा दृष्टिकोण",
        vision: "हम ऐसे समाज की कल्पना करते हैं जहाँ हर महिला के पास अपने और अपने परिवार के लिए बेहतर भविष्य बनाने हेतु आवश्यक जानकारी, कौशल, संसाधन और अवसर हों।",
        impactTitle: "हमारा प्रभाव",
        impact: "UNNATI का उद्देश्य महिलाओं और उपलब्ध अवसरों के बीच सूचना की कमी को कम करना है। महत्वपूर्ण संसाधनों को एक जगह उपलब्ध कराकर यह डिजिटल समावेशन, कौशल विकास, उद्यमिता और महिलाओं के आर्थिक सशक्तिकरण को प्रोत्साहित करता है।",
        tagline: "UNNATI — महिलाओं को सशक्त बनाना, अवसरों को सक्षम करना, भविष्य का निर्माण करना।"
      }
    : lang === "mr"
    ? {
        introTitle: "डिजिटल संधींद्वारे महिलांचे सक्षमीकरण",
        intro: "UNNATI हे महिलांना सरकारी कल्याणकारी योजना, कौशल्य विकासाच्या संधी, स्वयं-सहायता गट (SHGs) आणि आवश्यक सहाय्य सेवांशी जोडणारे डिजिटल व्यासपीठ आहे. विशेषतः ग्रामीण आणि वंचित समुदायांतील महिलांसाठी उपयुक्त माहिती अधिक सुलभ, समजण्यास सोपी आणि सोयीस्कर बनवणे हा या व्यासपीठाचा उद्देश आहे.",
        missionTitle: "आमचे ध्येय",
        mission: "एकाच डिजिटल व्यासपीठाद्वारे संबंधित संसाधने आणि संधी उपलब्ध करून महिलांना आर्थिकदृष्ट्या स्वावलंबी, कुशल, जागरूक आणि आत्मविश्वासपूर्ण बनण्यास मदत करणे हे आमचे ध्येय आहे.",
        offersTitle: "UNNATI काय उपलब्ध करून देते",
        offers: [
          ["🏛️", "सरकारी योजना", "योजना, पात्रता, लाभ आणि अधिकृत अर्ज संसाधनांची माहिती."],
          ["📚", "कौशल्य विकास", "व्यावहारिक, सर्जनशील आणि उद्योजकीय कौशल्ये विकसित करण्याच्या संधी."],
          ["🤝", "स्वयं-सहायता गट", "सामूहिक प्रगती, सहकार्य आणि उत्पन्ननिर्मितीसाठी SHG ची माहिती."],
          ["🆘", "हेल्पलाइन आणि सहाय्य", "महत्त्वाचे हेल्पलाइन क्रमांक आणि सहाय्य संसाधनांपर्यंत पोहोच."],
          ["🔖", "जतन केलेली संसाधने", "नोंदणीकृत वापरकर्ते उपयुक्त योजना, कौशल्ये आणि SHG माहिती नंतर पाहण्यासाठी जतन करू शकतात."],
          ["🌐", "समावेशक प्रवेश", "इंग्रजी, हिंदी आणि मराठीमध्ये माहिती समजणे सोपे करणारा अनुभव."]
        ],
        visionTitle: "आमची दृष्टी",
        vision: "प्रत्येक महिलेकडे स्वतःसाठी आणि आपल्या कुटुंबासाठी चांगले भविष्य घडवण्यासाठी आवश्यक माहिती, कौशल्ये, संसाधने आणि संधी असलेला समाज घडवण्याची आमची कल्पना आहे.",
        impactTitle: "आमचा प्रभाव",
        impact: "महिला आणि उपलब्ध संधी यांच्यातील माहितीची दरी कमी करण्याचा UNNATI चा प्रयत्न आहे. महत्त्वाची संसाधने एकाच ठिकाणी उपलब्ध करून डिजिटल समावेशन, कौशल्य विकास, उद्योजकता आणि महिलांचे आर्थिक सक्षमीकरण प्रोत्साहित केले जाते.",
        tagline: "UNNATI — महिलांचे सक्षमीकरण, संधींना चालना, भविष्याची निर्मिती."
      }
    : {
        introTitle: "Empowering Women Through Digital Opportunities",
        intro: "UNNATI is a digital platform designed to empower women by connecting them with government welfare schemes, skill development opportunities, Self-Help Groups (SHGs), and essential support services. It aims to make useful information more accessible, understandable, and convenient, especially for women from rural and underserved communities.",
        missionTitle: "Our Mission",
        mission: "Our mission is to support women in becoming financially independent, skilled, informed, and confident by providing access to relevant resources and opportunities through a single digital platform.",
        offersTitle: "What UNNATI Offers",
        offers: [
          ["🏛️", "Government Schemes", "Information about schemes, eligibility criteria, benefits, and official application resources."],
          ["📚", "Skill Development", "Learning opportunities that help women develop practical, creative, and entrepreneurial skills."],
          ["🤝", "Self-Help Groups", "Information about SHGs that support collective growth, collaboration, and income-generating activities."],
          ["🆘", "Helplines and Support", "Access to important helpline numbers and support resources."],
          ["🔖", "Saved Resources", "Registered users can save useful schemes, skills, and SHG information for future reference."],
          ["🌐", "Inclusive Access", "A multilingual experience designed to make information easier to understand in English, Hindi, and Marathi."]
        ],
        visionTitle: "Our Vision",
        vision: "We envision a society where every woman has the information, skills, resources, and opportunities needed to make informed decisions and build a better future for herself and her family.",
        impactTitle: "Our Impact",
        impact: "UNNATI aims to bridge the information gap between women and available opportunities. By bringing important resources together in one place, the platform seeks to encourage digital inclusion, skill development, entrepreneurship, and women's economic empowerment.",
        tagline: "UNNATI — Empowering Women, Enabling Opportunities, Building Futures."
      };

  return (
    <section className="page about-page">
      <div className="about-intro">
        <span className="eyebrow">UNNATI • WOMEN EMPOWERMENT</span>
        <h1>{t.aboutTitle || "About UNNATI"}</h1>
        <h2>{copy.introTitle}</h2>
        <p>{copy.intro}</p>
      </div>

      <div className="dashboard-grid about-mission-vision">
        <article className="resource-card">
          <h2>🎯 {copy.missionTitle}</h2>
          <p>{copy.mission}</p>
        </article>
        <article className="resource-card">
          <h2>🌱 {copy.visionTitle}</h2>
          <p>{copy.vision}</p>
        </article>
      </div>

      <section className="about-offers">
        <h2>{copy.offersTitle}</h2>
        <div className="features about-feature-grid">
          {copy.offers.map(([icon, title, description]) => (
            <article className="feature-card" key={title}>
              <div className="icon">{icon}</div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <article className="resource-card about-impact">
        <h2>💗 {copy.impactTitle}</h2>
        <p>{copy.impact}</p>
      </article>

      <p className="about-tagline">{copy.tagline}</p>
    </section>
  );
}


// ==================================================
// HOME
// ==================================================

function Home({
  t,
  district,
  setDistrict,
  go
}) {

  const features = [

    [
      "🏛️",
      t.schemes,
      t.featureSchemes,
      "schemes"
    ],

    [
      "📚",
      t.skills,
      t.featureSkills,
      "skills"
    ],

    [
      "🤝",
      t.shg,
      t.featureShg,
      "shg"
    ],

    [
      "🆘",
      t.help,
      t.featureHelp,
      "help"
    ]

  ];


  return (

    <>

      {/* HERO */}

      <section className="hero" data-tour="hero-welcome">

        <div>

          <span className="eyebrow">
            {t.eyebrow}
          </span>

          <h1>
            UNNATI
          </h1>

          <h2>
            {t.tagline}
          </h2>

          <p>
            {t.hero}
          </p>


          <div className="actions">
            <button
               className="btn primary primary-cta"
               onClick={() => {
                  document.getElementById("home-features")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                   });
               }}
             >
              Explore UNNATI
            </button>
          </div>

        </div>


        <div className="hero-art">

          
          <div className="map-placeholder unnati-home-logo">
            <img
              src="/unnati-home-logo.png"
              alt="UNNATI - Women Empowerment"
            />
          </div>
        </div>

      </section>


      {/* DISTRICT */}

      <section className="district-section">

        <h2>
          {t.districtHeading}
        </h2>

        <p>
          {t.districtText}
        </p>


        <select
          className="district-selector"
          value={district}
          onChange={(e) =>
            setDistrict(
              e.target.value
            )
          }
        >

          <option value="">
            {t.district}
          </option>

          {districts.map(
            (d) => (

              <option
                key={d}
                value={d}
              >
                {d}
              </option>

            )
          )}

        </select>


        {district && (

          <p className="selected">

            {t.selected}:{" "}
            {district}

          </p>

        )}

      </section>


      {/* FEATURES */}

      <section id="home-features" className="features">

        {features.map(
          ([
            icon,
            heading,
            description,
            destination
          ]) => (

            <article
              key={destination}
              className="feature-card"
              onClick={() =>
                go(destination)
              }
            >

              <div className="icon">
                {icon}
              </div>

              <h3>
                {heading}
              </h3>

              <p>
                {description}
              </p>

              <button
                className="text-btn"
              >
                {t.exploreButton}
              </button>

            </article>

          )
        )}

      </section>


      {/* JOURNEY */}

      <section className="journey">

        <span>
          {t.core}
        </span>

      </section>

    </>

  );

}


// ==================================================
// LANGUAGE HELPER
// ==================================================

function langText(
  t,
  en,
  hi,
  mr
) {

  if (
    t === translations.en
  ) {
    return en;
  }

  if (
    t === translations.hi
  ) {
    return hi;
  }

  return mr;

}


// ==================================================
// DASHBOARD
// ==================================================

function Dashboard({
  user,
  profile,
  saved,
  logout,
  go,
  t
}) {

  return (

    <section className="page dashboard">

      <h1>

        {t.dashboard},{" "}

        {profile?.name ||
          user.phoneNumber || "User"}

        {" "}🌸

      </h1>


      <div className="dashboard-grid">

        {/* PROFILE */}

        <article className="resource-card">

          <h2>
            {t.myProfile}
          </h2>


          <p>

            <b>
              {t.state}:
            </b>{" "}

            Maharashtra

          </p>


          <p>

            <b>
              {t.districtLabel}:
            </b>{" "}

            {profile?.district ||
              t.notSet}

          </p>


          <p>

            <b>
              {t.occupation}:
            </b>{" "}

            {profile?.occupation ||
              t.notSet}

          </p>


          <p>

            <b>
              {t.preferredLanguage}:
            </b>{" "}

            {profile?.preferredLanguage ||
              t.notSet}

          </p>

        </article>


        {/* SAVED */}

        <article className="resource-card" data-tour="saved-card">

          <h2>
            {t.savedResources}
          </h2>


          <p>

            {saved.length}{" "}
            {t.savedCount}

          </p>


          <button
            className="btn secondary"
            onClick={() =>
              go("saved")
            }
          >
            {langText(t, "View saved resources", "सहेजे गए संसाधन देखें", "जतन केलेली संसाधने पहा")}
          </button>

        </article>

      </div>

      {/* CONTEXTUAL TIP */}
      <div className="contextual-tip-banner" role="status">
        <p>{t.tipSaved}</p>
      </div>


      <button
        className="btn primary"
        onClick={logout}
      >
        {t.logout}
      </button>

    </section>

  );

}