import Link from 'next/link';
import styles from './button.module.scss';

export function ButtonExitPreview() {
  return (
    <div className={styles.button}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </div>
  )
}
