import {useEffect,useMemo,useState} from "react";
import {onAuthStateChanged,signOut} from "firebase/auth";
import {collection,doc,getDoc,getDocs,query,setDoc,where,deleteDoc,serverTimestamp} from "firebase/firestore";
import {auth,db} from "./firebase";
import {translations} from "./i18n";
import {districts} from "./data/districts";
import {schemes,skills,shgs,helpResources} from "./data/resources";
import Auth from "./components/Auth";
import Tour from "./components/Tour";
import GovernmentSchemes from "./GovernmentSchemes";
import FirebaseSkills from "./FirebaseSkills";
import FirebaseSHG from "./FirebaseSHG";
import FirebaseHelplines from "./FirebaseHelplines";
import "./styles.css";

const nav=["home","schemes","skills","shg","help","about"];
export default function App(){
 const [lang,setLang]=useState(localStorage.getItem("unnatiLanguage")||"en");
 const [page,setPage]=useState("home"),[user,setUser]=useState(null),[profile,setProfile]=useState(null);
 const [authMode,setAuthMode]=useState(null),[district,setDistrict]=useState("");
 const [tour,setTour]=useState(!localStorage.getItem("unnatiTourDone"));
 const [saved,setSaved]=useState([]),[search,setSearch]=useState("");
 const t=translations[lang];
 useEffect(()=>{localStorage.setItem("unnatiLanguage",lang)},[lang]);
 useEffect(()=>onAuthStateChanged(auth,async u=>{setUser(u);if(u){const snap=await getDoc(doc(db,"users",u.uid));setProfile(snap.data()||null);const q=query(collection(db,"savedResources"),where("userId","==",u.uid));const ss=await getDocs(q);setSaved(ss.docs.map(x=>x.data().resourceId));}}),[]);
 async function saveResource(resource){if(!user){alert("Please log in to permanently save resources.");return}const id=`${user.uid}_${resource.id}`;if(saved.includes(resource.id)){await deleteDoc(doc(db,"savedResources",id));setSaved(saved.filter(x=>x!==resource.id));}else{await setDoc(doc(db,"savedResources",id),{userId:user.uid,resourceId:resource.id,resource,createdAt:serverTimestamp()});setSaved([...saved,resource.id]);}}
 const filtered=(items)=>items.filter(x=>JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));
 const go=(p)=>{setPage(p);setSearch("");window.scrollTo({top:0,behavior:"smooth"})};
 return <div>
  <Tour run={tour} setRun={setTour}/>
  <header><button className="brand" onClick={()=>go("home")}><img src="/unnati-logo.png" alt="UNNATI logo"/></button>
   <nav className="main-nav">{nav.map(n=><button key={n} onClick={()=>go(n)} className={page===n?"active":""}>{t[n]}</button>)}</nav>
   <div className="header-right"><select className="language-selector" value={lang} onChange={e=>setLang(e.target.value)} aria-label="Language"><option value="en">English</option><option value="hi">हिंदी</option><option value="mr">मराठी</option></select>{user?<button className="btn ghost" onClick={()=>go("dashboard")}>{t.dashboard}</button>:<><button className="text-btn" onClick={()=>setAuthMode("login")}>{t.login}</button><button className="btn primary" onClick={()=>setAuthMode("signup")}>{t.signup}</button></>}</div>
  </header>
  <main>
   {page==="home"&&<Home t={t} district={district} setDistrict={setDistrict} go={go}/>}
   {page==="schemes"&&<GovernmentSchemes/>}
   {page==="skills"&&<FirebaseSkills/>}
   {page==="shg"&&<FirebaseSHG/>}
   {page==="help"&&<FirebaseHelplines/>}
   {page==="about"&&<section className="page"><h1>About UNNATI</h1><p>UNNATI is a Maharashtra-focused women empowerment and opportunity platform designed around Discover → Learn → Connect → Grow.</p></section>}
   {page==="dashboard"&&<Dashboard user={user} profile={profile} saved={saved} logout={()=>signOut(auth)} go={go} t={t}/>} 
  </main>
  <footer><img src="/unnati-logo.png" alt="UNNATI"/><p>Empowering Women Across Maharashtra</p><button className="text-btn" onClick={()=>{setTour(true);localStorage.removeItem("unnatiTourDone")}}>Take Website Tour</button></footer>
  {authMode&&<Auth mode={authMode} setMode={setAuthMode} onClose={()=>setAuthMode(null)}/>} 
 </div>
}
function Home({t,district,setDistrict,go}){return <><section className="hero"><div><span className="eyebrow">Maharashtra • Women • Opportunity • Community</span><h1>UNNATI</h1><h2>Empowering Women, Flourishing Together.</h2><p>{t.hero}</p><div className="actions"><button className="btn primary primary-cta" onClick={()=>go("schemes")}>{t.explore}</button><button className="btn secondary" onClick={()=>go("help")}>{t.support}</button></div></div><div className="hero-art"><div className="map-placeholder">Maharashtra<br/><span>36 Districts</span></div></div></section><section className="district-section"><h2>Empowering Women Across Maharashtra</h2><p>UNNATI connects women from all 36 districts with useful information and opportunities.</p><select className="district-selector" value={district} onChange={e=>setDistrict(e.target.value)}><option value="">{t.district}</option>{districts.map(d=><option key={d}>{d}</option>)}</select>{district&&<p className="selected">Selected: {district}</p>}</section><section className="features">{[["🏛️","Government Schemes","Find government schemes and benefits relevant to women in Maharashtra.","schemes"],["📚","Skill Development","Discover useful learning and skill-development resources.","skills"],["🤝","SHG Finder","Find Self Help Groups and community opportunities by district.","shg"],["🆘","Help & Support","Access verified women-focused support and official information.","help"]].map(([i,h,p,to])=><article key={h} className="feature-card" onClick={()=>go(to)}><div className="icon">{i}</div><h3>{h}</h3><p>{p}</p><button className="text-btn">Explore →</button></article>)}</section><section className="journey"><span>{t.core}</span></section></>}
function Dashboard({user,profile,saved,logout,go,t}){if(!user)return <section className="page"><h1>Please log in</h1><p>Create an account to access your personalized My Unnati dashboard.</p></section>;return <section className="page dashboard"><h1>Welcome to Unnati, {profile?.name||user.email} 🌸</h1><div className="dashboard-grid"><article className="resource-card"><h2>My Profile</h2><p><b>State:</b> Maharashtra</p><p><b>District:</b> {profile?.district||"Not set"}</p><p><b>Occupation:</b> {profile?.occupation||"Not set"}</p><p><b>Preferred Language:</b> {profile?.preferredLanguage||"en"}</p></article><article className="resource-card"><h2>Saved Resources</h2><p>{saved.length} saved resource(s)</p><button className="btn secondary" onClick={()=>go("schemes")}>Explore Resources</button></article></div><button className="btn primary" onClick={logout}>{t.logout}</button></section>}
