// Create a new file at pages/_app.js

import '../styles/global.css'; // Import global styles

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
