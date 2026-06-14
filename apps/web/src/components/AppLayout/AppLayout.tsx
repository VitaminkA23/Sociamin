import { Outlet } from "react-router-dom";
import { Header } from "../Header/Header";
import { Footer } from "../Footer/Footer";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}