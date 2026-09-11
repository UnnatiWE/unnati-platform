import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { districts } from "../data/districts";

export default function Auth({mode,setMode,onClose}){
 const signup=mode==="signup";
 const [form,setForm]=useState({name:"",email:"",password:"",district:"",ageGroup:"18–25",occupation:"Student"});
 const [msg,setMsg]=useState("");
 const update=(e)=>setForm({...form,[e.target.name]:e.target.value});
 async function submit(e){
  e.preventDefault(); setMsg("");
  try{
   if(signup){
    const result=await createUserWithEmailAndPassword(auth,form.email,form.password);
    await setDoc(doc(db,"users",result.user.uid),{
      name:form.name,email:form.email,state:"Maharashtra",district:form.district,
      ageGroup:form.ageGroup,occupation:form.occupation,preferredLanguage:localStorage.getItem("unnatiLanguage")||"en",createdAt:serverTimestamp()
    });
   }else await signInWithEmailAndPassword(auth,form.email,form.password);
   onClose();
  }catch(err){setMsg(err.message.replace("Firebase: ",""))}
 }
 return <div className="modal-backdrop"><div className="auth-card">
   <button className="close" onClick={onClose}>×</button><img src="/unnati-logo.png" className="auth-logo"/>
   <h2>{signup?"Create your account":"Welcome back"}</h2>
   <form onSubmit={submit}>
   {signup&&<input name="name" placeholder="Full Name" value={form.name} onChange={update} required/>}
   <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} required/>
   <input name="password" type="password" minLength="6" placeholder="Password" value={form.password} onChange={update} required/>
   {signup&&<><input value="Maharashtra" disabled/><select name="district" value={form.district} onChange={update} required><option value="">Select District</option>{districts.map(d=><option key={d}>{d}</option>)}</select>
   <select name="ageGroup" value={form.ageGroup} onChange={update}>{["Under 18","18–25","26–40","41–60","60+"].map(x=><option key={x}>{x}</option>)}</select>
   <select name="occupation" value={form.occupation} onChange={update}>{["Homemaker","Farmer","Entrepreneur","Student","Artisan","Worker","Other"].map(x=><option key={x}>{x}</option>)}</select></>}
   <button className="btn primary" type="submit">{signup?"Create Account":"Login"}</button></form>
   {msg&&<p className="error">{msg}</p>}
   <p>{signup?"Already have an account?":"New to Unnati?"} <button className="text-btn" onClick={()=>setMode(signup?"login":"signup")}>{signup?"Login":"Create Account"}</button></p>
   <small>Phone/OTP can be added after enabling Firebase Phone Authentication and reCAPTCHA.</small>
 </div></div>
}