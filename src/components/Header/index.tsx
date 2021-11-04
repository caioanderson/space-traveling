import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <Link href="/">
      <header className={styles.container}>
        <img src="/images/Logo.png" alt="logo" />
      </header>
    </Link>
  );
}
