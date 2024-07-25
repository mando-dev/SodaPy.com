import React, { useState, useRef } from 'react';
import emailjs from 'emailjs-com';
import Image from 'next/image';
import profilePic from '../public/profile-pic.jpg'; // Ensure the path is correct

const EmailForm = () => {
  const form = useRef();
  const [emailSent, setEmailSent] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm('service_q2e38ki', 'template_wh8k2pe', form.current, 'T2qspXNkuHAm7BzB')
      .then((result) => {
        console.log('SUCCESS!', result.text);
        setEmailSent(true);
        form.current.reset(); // Clear the input fields
      }, (error) => {
        console.log('FAILED...', error.text);
      });
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h1>Contact Me: Mando</h1>
      <Image src={profilePic} alt="Your face" className="w-64 h-64 rounded-full mb-5 object-cover" />
      <form ref={form} onSubmit={sendEmail} className="flex flex-col items-center">
        <label className="mb-2">Email:</label>
        <input type="email" name="user_email" className="w-72 p-2 mb-3 border border-gray-300 rounded" required />
        <label className="mb-2">Message:</label>
        <textarea name="message" className="w-72 p-2 mb-3 border border-gray-300 rounded" required />
        <input type="submit" value="Send" className="bg-green-500 text-white p-3 rounded cursor-pointer mt-3 hover:bg-green-600" />
        {emailSent && <p className="text-green-500 text-3xl mt-3">Email sent successfully!</p>}
      </form>
    </div>
  );
};

export default EmailForm;
