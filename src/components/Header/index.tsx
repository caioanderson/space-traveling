import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.container}>
      <img src="/images/Logo.png" alt="Space traveling" />
    </header>
  );
}
