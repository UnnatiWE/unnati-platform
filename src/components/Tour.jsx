import { Joyride } from 'react-joyride';

export default function Tour({run,setRun}){
 const steps=[
  {target:".language-selector",content:"Choose English, हिंदी or मराठी. Your preference is saved.",disableBeacon:true},
  {target:".district-selector",content:"Select your Maharashtra district for relevant recommendations."},
  {target:".main-nav",content:"Explore Schemes, Skills, SHG Finder and Help & Support."},
  {target:".primary-cta",content:"Start your journey by exploring opportunities."}
 ];
 return <Joyride steps={steps} run={run} continuous showProgress showSkipButton
   callback={(d)=>{if([STATUS.FINISHED,STATUS.SKIPPED].includes(d.status)){setRun(false);localStorage.setItem("unnatiTourDone","true")}}}
   styles={{options:{primaryColor:"#B84F73",zIndex:10000}}}/>;
}