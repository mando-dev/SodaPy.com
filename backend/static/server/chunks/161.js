exports.id=161,exports.ids=[161],exports.modules={679:e=>{e.exports={emailFormContainer:"EmailForm_emailFormContainer___DPaO",form:"EmailForm_form___CgiO",inputText:"EmailForm_inputText__1n6FS",inputEmail:"EmailForm_inputEmail__IiSOe",textarea:"EmailForm_textarea__GFtWe",submitButton:"EmailForm_submitButton__htUDh",successMessage:"EmailForm_successMessage__IzDTK",errorMessage:"EmailForm_errorMessage__EtdvC",contactTitle:"EmailForm_contactTitle__CiAvZ"}},161:(e,a,s)=>{"use strict";s.r(a),s.d(a,{default:()=>o});var t=s(997),l=s(689),i=s(655),r=s.n(i),m=s(679),n=s.n(m);let o=()=>{let e=(0,l.useRef)(),[a,s]=(0,l.useState)(!1),[i,m]=(0,l.useState)(""),o=async e=>{console.log("Validating email:",e);let a=await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(e)}&api_key=${encodeURIComponent("ecb0e9e83be78e80034089b9dace920d46875349")}`),s=await a.json();return console.log("Hunter.io API Response:",s),s.data&&"valid"===s.data.status},c=async a=>{a.preventDefault();let t=e.current.user_email.value;if(!await o(t)){m("Please enter a valid email address.");return}m(""),r().sendForm("service_q2e38ki","template_wh8k2pe",e.current,"T2qspXNNkuHAm7BzB").then(a=>{console.log("SUCCESS!",a.text),s(!0),e.current.reset()},e=>{console.log("FAILED...",e.text)})};return(0,t.jsxs)("div",{className:n().emailFormContainer,children:[t.jsx("h1",{className:n().contactTitle,children:"Contact Me: Mando"})," ",a&&t.jsx("p",{className:n().successMessage,children:"Email sent successfully!"}),i&&t.jsx("p",{className:n().errorMessage,children:i}),(0,t.jsxs)("form",{ref:e,onSubmit:c,className:n().form,children:[t.jsx("label",{htmlFor:"email",className:n().label,children:"Email:"}),t.jsx("input",{type:"email",name:"user_email",id:"email",className:n().inputText,required:!0}),t.jsx("label",{htmlFor:"message",className:n().label,children:"Message:"}),t.jsx("textarea",{name:"message",id:"message",className:n().textarea,required:!0}),t.jsx("input",{type:"submit",value:"Send",className:n().submitButton})]})]})}}};