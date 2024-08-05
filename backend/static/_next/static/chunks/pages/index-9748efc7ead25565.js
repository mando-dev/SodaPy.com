(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{5557:function(e,t,s){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return s(8783)}])},8783:function(e,t,s){"use strict";s.r(t),s.d(t,{__N_SSG:function(){return g},default:function(){return b}});var a=s(5893),r=s(8149),i=s.n(r),n=s(7294);let o={_origin:"https://api.emailjs.com"},l=(e,t,s)=>{if(!e)throw"The user ID is required. Visit https://dashboard.emailjs.com/admin/integration";if(!t)throw"The service ID is required. Visit https://dashboard.emailjs.com/admin";if(!s)throw"The template ID is required. Visit https://dashboard.emailjs.com/admin/templates";return!0};class c{constructor(e){this.status=e.status,this.text=e.responseText}}let m=(e,t,s={})=>new Promise((a,r)=>{let i=new XMLHttpRequest;i.addEventListener("load",({target:e})=>{let t=new c(e);200===t.status||"OK"===t.text?a(t):r(t)}),i.addEventListener("error",({target:e})=>{r(new c(e))}),i.open("POST",o._origin+e,!0),Object.keys(s).forEach(e=>{i.setRequestHeader(e,s[e])}),i.send(t)}),u=e=>{let t;if(!(t="string"==typeof e?document.querySelector(e):e)||"FORM"!==t.nodeName)throw"The 3rd parameter is expected to be the HTML form element or the style selector of form";return t};var d=(e,t,s,a)=>{let r=a||o._userID,i=u(s);l(r,e,t);let n=new FormData(i);return n.append("lib_version","3.2.0"),n.append("service_id",e),n.append("template_id",t),n.append("user_id",r),m("/api/v1.0/email/send-form",n)},h=s(2206),_=s.n(h),p=()=>{let e=(0,n.useRef)(),[t,s]=(0,n.useState)(!1),[r,i]=(0,n.useState)(""),o=async e=>{console.log("Validating email:",e);let t=await fetch("https://api.hunter.io/v2/email-verifier?email=".concat(encodeURIComponent(e),"&api_key=").concat(encodeURIComponent("ecb0e9e83be78e80034089b9dace920d46875349"))),s=await t.json();return console.log("Hunter.io API Response:",s),s.data&&"valid"===s.data.status},l=async t=>{t.preventDefault();let a=e.current.user_email.value;if(!await o(a)){i("Please enter a valid email address.");return}i(""),d("service_q2e38ki","template_wh8k2pe",e.current,"T2qspXNNkuHAm7BzB").then(t=>{console.log("SUCCESS!",t.text),s(!0),e.current.reset()},e=>{console.log("FAILED...",e.text)})};return(0,a.jsxs)("div",{className:_().emailFormContainer,children:[(0,a.jsx)("h1",{children:"Contact Me: Mando"}),t&&(0,a.jsx)("p",{className:_().successMessage,children:"Email sent successfully!"}),r&&(0,a.jsx)("p",{className:_().errorMessage,children:r}),(0,a.jsxs)("form",{ref:e,onSubmit:l,className:_().form,children:[(0,a.jsx)("label",{htmlFor:"email",className:_().label,children:"Email:"}),(0,a.jsx)("input",{type:"email",name:"user_email",id:"email",className:_().inputText,required:!0}),(0,a.jsx)("label",{htmlFor:"message",className:_().label,children:"Message:"}),(0,a.jsx)("textarea",{name:"message",id:"message",className:_().textarea,required:!0}),(0,a.jsx)("input",{type:"submit",value:"Send",className:_().submitButton})]})]})};let f="Texas",w=async function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;try{console.log("Fetching prediction for ".concat(f));let e=await fetch("".concat("http://localhost:8080","/prediction?state=").concat(encodeURIComponent(f)),{timeout:1e4});if(!e.ok)throw Error("HTTP error! status: ".concat(e.status));let t=await e.json();console.log("Result for ".concat(f,":"),t);let s=t[f];if("refresh your browser"===s)return{state:f,prediction:"refresh your browser"};return{state:f,prediction:"".concat(s,"%")}}catch(t){if(console.error("Error fetching data for ".concat(f,":"),t),e<10)return await new Promise(e=>setTimeout(e,2e3)),await w(e+1);return{state:f,prediction:"refresh your browser"}}};async function x(){let{state:e,prediction:t}=await w();return{[e]:t}}var g=!0,b=e=>{let{initialData:t}=e,[s,r]=(0,n.useState)(t),o=async()=>{r(await x())};return(0,n.useEffect)(()=>{o()},[]),(0,a.jsxs)("div",{className:i().stateListContainer,children:[(0,a.jsx)("h3",{children:"This app is to help prevent Kidney Failure. I donated my kidney to my father and I don't want other people to go through the same surgery. By identifying where soda consumption is highest, we can kill the problem at its root. High Fructose Corn Syrup (found much in soda) is the number one contributor to Kidney Failure."}),(0,a.jsx)("h1",{className:i().title,children:"Soda Consumption Predictions"}),(0,a.jsx)("h2",{className:i().title2,children:"in Real Time (every 24 hours)"}),(0,a.jsxs)("div",{className:i().stateListItem,children:[f,": ","refresh your browser"===s[f]?(0,a.jsx)("button",{onClick:o,children:"Refresh Data"}):s[f]||"Loading..."]}),(0,a.jsx)("footer",{className:i().footer,children:"Powered by Gemini API"}),(0,a.jsx)(p,{})]})}},2206:function(e){e.exports={emailFormContainer:"EmailForm_emailFormContainer___DPaO",form:"EmailForm_form___CgiO",inputText:"EmailForm_inputText__1n6FS",inputEmail:"EmailForm_inputEmail__IiSOe",textarea:"EmailForm_textarea__GFtWe",submitButton:"EmailForm_submitButton__htUDh",successMessage:"EmailForm_successMessage__IzDTK",errorMessage:"EmailForm_errorMessage__EtdvC"}},8149:function(e){e.exports={stateListContainer:"StateList_stateListContainer__RxOkl",stateListColumns:"StateList_stateListColumns__WZfZd",stateListColumn:"StateList_stateListColumn__WaPat",stateListItem:"StateList_stateListItem__h2DIv",footer:"StateList_footer__NmHe1",title:"StateList_title__BWW2r",title2:"StateList_title2__5IbZf"}}},function(e){e.O(0,[888,774,179],function(){return e(e.s=5557)}),_N_E=e.O()}]);