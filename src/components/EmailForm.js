import React, { useState, useRef } from 'react';
import emailjs from 'emailjs-com';
import Image from 'next/image';
import profilePic from '../public/profile-pic.jpg'; // Ensure the path is correct
import styles from "../styles/EmailForm.module.css";

const EmailForm = () => {
  const form = useRef();
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidEmail = async (email) => {
    const apiKey = process.env.NEXT_PUBLIC_HUNTER_API_KEY;
    console.log("Validating email:", email);
    const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(apiKey)}`);
    const data = await response.json();
    console.log("Hunter.io API Response:", data);
    return data.data && data.data.status === 'valid';
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    const email = form.current.user_email.value;

    const valid = await isValidEmail(email);
    if (!valid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage('');

    emailjs.sendForm(process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID, process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, form.current, process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY)
      .then((result) => {
        console.log('SUCCESS!', result.text);
        setEmailSent(true);
        form.current.reset(); // Clear the input fields
      }, (error) => {
        console.log('FAILED...', error.text);
      });
  };

  return (
    <div className={styles.emailFormContainer}>
      <h1>Contact Me: Mando</h1>
      <Image src={profilePic} alt="Your face" className={styles.profilePic} />
      {emailSent && <p className={styles.successMessage}>Email sent successfully!</p>}
      {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
      <form ref={form} onSubmit={sendEmail} className={styles.form}>
        <label htmlFor="email" className={styles.label}>Email:</label>
        <input type="email" name="user_email" id="email" className={styles.inputText} required />
        <label htmlFor="message" className={styles.label}>Message:</label>
        <textarea name="message" id="message" className={styles.textarea} required />
        <input type="submit" value="Send" className={styles.submitButton} />
      </form>
    </div>
  );
};

export default EmailForm;
