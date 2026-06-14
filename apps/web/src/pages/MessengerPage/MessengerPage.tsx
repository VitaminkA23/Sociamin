import { Messenger } from "../../components/Messenger/Messenger";
import styles from "./MessengerPage.module.css";

export function MessengerPage() {
  return (
    <div className={styles.wrapper}>
      <Messenger />
    </div>
  );
}
