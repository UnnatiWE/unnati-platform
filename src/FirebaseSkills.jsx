import React,{useEffect,useMemo,useState}from"react";import{collection,getDocs}from"firebase/firestore";import{db}from"./firebase";import{localized}from"./i18n";import"./FirebaseResources.css";
const SKILL_IMAGE_MAP = [
  ["accounting", "01_accounting.png"],
  ["bag making", "02_bag-making.png"],
  ["baking", "03_baking.png"],
  ["business planning", "04_business-planning.png"],
  ["business registration", "05_business-registration.png"],
  ["candle making", "06_candle-making.png"],
  ["childcare", "07_childcare.png"],
  ["communication skills", "08_communication-skills.png"],
  ["cooking", "09_cooking.png"],
  ["dairy farming", "10_dairy-farming.png"],
  ["elderly care", "11_elderly-care.png"],
  ["english skills", "12_english-skills.png"],
  ["embroidery", "13_embroidery.png"],
  ["entrepreneurship", "14_entrepreneurship-self-employment.png"],
  ["financial literacy", "15_financial-literacy.png"],
  ["finding customers", "16_finding-customers.png"],
  ["food processing", "17_food-processing.png"],
  ["hair styling", "18_hair-styling.png"],
  ["interview skills", "19_interview-skills.png"],
  ["jewellery making", "20_jewellery-making.png"],
  ["makeup", "21_makeup.png"],
  ["market research", "22_market-research.png"],
  ["nail art", "23_nail-art.png"],
  ["organic farming", "24_organic-farming.png"],
  ["painting", "25_painting.png"],
  ["pottery", "26_pottery.png"],
  ["poultry farming", "27_poultry-farming.png"],
  ["pricing costing", "28_pricing-costing.png"],
  ["product packaging", "29_product-packaging.png"],
  ["public speaking", "30_public-speaking.png"],
  ["self employment opportunities", "31_self-employment-opportunities.png"],
  ["skin care", "32_skin-care.png"],
  ["soap making", "33_soap-making.png"],
  ["tailoring", "tailoring.png"],
 ["handicraft", "Handicraft.png"],
 ["floral decoration", "Floral-Decoration.png"],
 ["gift making", "Gift-Making.png"],
 ["startup basics", "Startup-Basics.png"],
  ["starting a home business", "34_starting-a-home-business.png"],
  ["teaching tutoring", "35_teaching-tutoring.png"],
];

function normalizeSkillName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getSkillImage(skill) {
  const name = normalizeSkillName(
    localized(skill, "skill_name", "en")
  );

  const match = SKILL_IMAGE_MAP.find(([keyword]) =>
    name.includes(normalizeSkillName(keyword))
  );

  return match ? `/images/skills/${match[1]}` : null;
}
export default function FirebaseSkills({lang="en",t,saved=[],onSave}){const[skills,setSkills]=useState([]),[search,setSearch]=useState(""),[category,setCategory]=useState("All"),[loading,setLoading]=useState(true),[error,setError]=useState("");useEffect(()=>{getDocs(collection(db,"skills")).then(s=>setSkills(s.docs.map(d=>({id:d.id,...d.data()})))).catch(e=>setError(`${e.code||"error"}: ${e.message||t.unableSkills}`)).finally(()=>setLoading(false))},[t.unableSkills]);const categories=useMemo(()=>["All",...Array.from(new Set(skills.map(s=>localized(s,"category",lang)).filter(Boolean))).sort()],[skills,lang]);const filtered=useMemo(()=>{const q=search.toLowerCase().trim();return skills.filter(s=>{const name=localized(s,"skill_name",lang),cat=localized(s,"category",lang),desc=localized(s,"description",lang);return(!q||[name,cat,desc].some(v=>String(v||"").toLowerCase().includes(q)))&&(category==="All"||cat===category)})},[skills,search,category,lang]);return <section className="firebase-page"><div className="firebase-hero"><span>UNNATI • {t.skills}</span><h1>{t.skills}</h1><p>{t.skillsHero}</p></div><div className="contextual-tip-banner" role="status"><p>{t.tipSkills}</p></div><div className="firebase-filters"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.searchSkills}/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><button onClick={()=>{setSearch("");setCategory("All")}}>{t.clear}</button></div><p className="firebase-count">{t.showing} <b>{filtered.length}</b> {t.skillsWord}</p>{loading&&<div className="firebase-state">{t.loading}...</div>}{error&&!loading&&<div className="firebase-error">{t.unableSkills}<br/>{error}</div>}{!loading&&!error&&!filtered.length&&<div className="firebase-state">{t.noSkills}</div>}{!loading&&!error&&filtered.length>0&&<div className="firebase-grid">
  {filtered.map((s) => {
    const image = getSkillImage(s);

    return (
      <article className="firebase-card" key={s.id}>
        {image && (
          <img
            className="firebase-skill-image"
            src={image}
            alt={localized(s, "skill_name", lang)}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        <span className="firebase-badge">
          {localized(s, "category", lang)}
        </span>

        <h2>{localized(s, "skill_name", lang)}</h2>

        <p>{localized(s, "description", lang)}</p>

        <button
          type="button"
          className="save-resource-btn"
          aria-pressed={saved.includes(`skill_${s.id}`)}
          onClick={() => onSave?.(s)}
        >
          {saved.includes(`skill_${s.id}`)
            ? (lang === "hi" ? "🔖 सहेजा गया" : lang === "mr" ? "🔖 जतन केले" : "🔖 Saved")
            : (lang === "hi" ? "🔖 कौशल सहेजें" : lang === "mr" ? "🔖 कौशल्य जतन करा" : "🔖 Save Skill")}
        </button>

        {s.learning_link && (
          <a
            className="firebase-btn"
            href={s.learning_link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.startLearning}
          </a>
        )}
      </article>
    );
  })}
</div>
}</section>}
