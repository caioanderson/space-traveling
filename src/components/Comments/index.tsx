import { useEffect, useRef, useState } from 'react';
import styles from './comment.module.scss';

export function Comments() {
  const [pending, setPending] = useState(true);
  const references = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptElement = document.createElement('script');
    scriptElement.setAttribute('src', 'https://utteranc.es/client.js');
    scriptElement.setAttribute('crossorigin', 'annonymous');
    scriptElement.async = true;
    scriptElement.setAttribute('repo', 'caioanderson/space-traveling');
    scriptElement.setAttribute('issue-term', 'url');
    scriptElement.setAttribute('theme', 'github-dark');
    scriptElement.onload = () => setPending(false);

    references.current.appendChild(scriptElement);
  }, []);

  return (
    <div className={styles.comments} id="comments">
      <div ref={references}>{pending && <p>Loading comments ...</p>}</div>
    </div>
  );
}
