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
import "./dark-mode.css";


const nav = [
  "home",
  "schemes",
  "skills",
  "shg",
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

  // Dark mode preference
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("unnatiTheme") === "dark"
  );


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
  // DARK MODE
  // ==========================================

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("unnatiTheme", darkMode ? "dark" : "light");
  }, [darkMode]);


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


            setSaved(
              savedSnapshot.docs.map(
                (item) =>
                  item.data().resourceId
              )
            );


            // Start tour only for first visit
            if (
              !localStorage.getItem(
                "unnatiTourCompleted"
              ) &&
              !localStorage.getItem(
                "unnatiTourDone"
              )
            ) {

              setTour(true);

            }

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

  async function saveResource(resource) {

    if (!user) {
      return;
    }


    const id =
      `${user.uid}_${resource.id}`;


    if (
      saved.includes(
        resource.id
      )
    ) {

      await deleteDoc(
        doc(
          db,
          "savedResources",
          id
        )
      );


      setSaved(
        saved.filter(
          (item) =>
            item !== resource.id
        )
      );

    } else {

      await setDoc(
        doc(
          db,
          "savedResources",
          id
        ),
        {
          userId: user.uid,
          resourceId: resource.id,
          resource,
          createdAt:
            serverTimestamp()
        }
      );


      setSaved([
        ...saved,
        resource.id
      ]);

    }

  }


  // ==========================================
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
              {t[item]}
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


          {/* DARK MODE */}

          <button
            type="button"
            className="theme-toggle"
            data-tour="theme-toggle"
            onClick={() => setDarkMode((current) => !current)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>


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
          />

        )}


        {/* SHGs */}

        {page === "shg" && (

          <FirebaseSHG
            lang={lang}
            t={t}
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

          <section className="page">

            <h1>
              {t.aboutTitle}
            </h1>

            <p>
              {t.aboutText}
            </p>

          </section>

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
          user.email}

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
              go("schemes")
            }
          >
            {t.exploreResources}
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