import React, { useRef, useState } from 'react';
import emailjs from 'emailjs-com';
import styles from '../styles/EmailForm.module.css';

const EmailForm: React.FC = () => {
  const form = useRef<HTMLFormElement>(null);
  const [emailSent, setEmailSent] = useState(false);

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs.sendForm('service_q2e38ki', 'template_wh8k2pe', form.current!, 'T2qspXNkuHAm7BzB')
      .then((result) => {
        console.log(result.text);
        setEmailSent(true);
      }, (error) => {
        console.log(error.text);
      });
  };

  return (
    <div className={styles.emailFormContainer}>
      {emailSent ? (
        <h2>Thank you for your message! We&apos;ll get back to you soon.</h2>
      ) : (
        <form ref={form} onSubmit={sendEmail} className={styles.emailForm}>
          <label className={styles.label}>Your Name</label>
          <input type="text" name="user_name" className={styles.inputField} required />
          <label className={styles.label}>Your Email</label>
          <input type="email" name="user_email" className={styles.inputField} required />
          <label className={styles.label}>Message</label>
          <textarea name="message" className={styles.inputField} required />
          <input type="submit" value="Send" className={styles.submitButton} />
        </form>
      )}
    </div>
  );
};

export default EmailForm;
