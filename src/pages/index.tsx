import styles from '../styles/StateList.module.css';
import EmailForm from '../components/EmailForm';
import { getSodaData } from '../utils/sodaData';

type StateData = {
  [key: string]: string;
};

interface Props {
  data: StateData;
}

const StateList = ({ data }: Props) => {
  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  return (
    <div className={styles.stateListContainer}>
      <h3>This app is to help prevent Kidney Failure. I donated my kidney to my father and I don&apos;t want other people to go through the same surgery. By identifying where soda consumption is highest, we can kill the problem at its root. High Fructose Corn Syrup (found much in soda) is the number one contributor to Kidney Failure.</h3>
      <h1 className={styles.title}>Soda Consumption Predictions</h1>
      <h2 className={styles.title2}>in Real Time (every hour)</h2>
      <div className={styles.stateListColumns}>
        {states.map((state) => (
          <div key={state} className={styles.stateListItem}>
            {state}: {data[state] || 'Loading...'}
          </div>
        ))}
      </div>
      <footer className={styles.footer}>Powered by Gemini</footer>
      <EmailForm />
    </div>
  );
};

export const getStaticProps = async () => {
  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  try {
    const data = await getSodaData(states);
    return { props: { data }, revalidate: 86400 }; // Regenerate the page every 24 hours
  } catch (error) {
    console.error('Error fetching soda data:', error);
    return { props: { data: {} }, revalidate: 86400 };
  }
};

export default StateList;
