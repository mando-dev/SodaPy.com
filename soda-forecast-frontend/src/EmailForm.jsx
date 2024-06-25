import React, { useState, useRef } from 'react';
import emailjs from 'emailjs-com';
import './EmailForm.css';
import profilePic from './assets/2.jpg'; // Ensure the path is correct

const EmailForm = () => {
  const form = useRef();
  const [emailSent, setEmailSent] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm('service_q2e38ki', 'template_wh8k2pe', form.current, 'T2qspXNNkuHAm7BzB')
      .then((result) => {
        console.log('SUCCESS!', result.text);
        setEmailSent(true);
        form.current.reset(); // Clear the input fields
      }, (error) => {
        console.log('FAILED...', error.text);
      });
  };

  return (
    
    <div className="email-form-container">
    <h1>Contact Me: Mando</h1>
      <img src={profilePic} alt="Your face" className="profile-pic" />
      <form ref={form} onSubmit={sendEmail}>
        <label>Email:</label>
        <input type="email" name="user_email" />
        <label>Message:</label>
        <textarea name="message" />
        <input type="submit" value="Send" />
        {emailSent && <p className="success-message">Email sent successfully!</p>}
      </form>
    </div>
  );
};

export default EmailForm;


