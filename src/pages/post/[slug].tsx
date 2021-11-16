import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Link from 'next/link';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { ButtonExitPreview } from '../../components/ButtonExitPreview';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost: Post | null;
  preview: boolean;
  prevPost: Post | null;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function Post({ post, nextPost, preview, prevPost }: PostProps) {
  const router = useRouter();

  const time = post.data.content.reduce((acc, element) => {
    const textBody = RichText.asText(element.body);
    const body = textBody.split(' ');
    const countItemsBody = body.length;
    const result = Math.ceil(countItemsBody / 200);

    return acc + result;
  }, 0);

  if (router.isFallback)
    return <div className={styles.loading}>Carregando...</div>;
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>

      <div className={commonStyles.container}>
        <div className={styles.header}>
          <h1>{post.data.title}</h1>
          <div className={styles.infoPost}>
            <span>
              <FiCalendar size={20} />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser size={20} /> {post.data.author}
            </span>
            <span>
              <FiClock size={20} /> {time} min
            </span>
          </div>
          <div className={styles.infoEdit}>
            <span>
              *editado em{' '}
              {format(
                parseISO(post.last_publication_date),
                "d MMM yyyy', ás 'HH:mm ",
                { locale: ptBR }
              )}
            </span>
          </div>
          <div className={styles.content}>
            {post.data.content.map((content, index) => (
              <section key={index}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                  className={styles.body}
                />
              </section>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        <footer className={commonStyles.footer}>
          <div className={styles.footer}>
            <div className={styles.headerFooter}>
              <div className={styles.postPrevious}>
                {prevPost && (
                  <>
                    <span>{prevPost.data.title}</span>
                    <Link href={`/post/${prevPost.uid}`}>
                      <a>Post anterior</a>
                    </Link>
                  </>
                )}
              </div>
              <div className={styles.postPrevious}>
                {nextPost && (
                  <>
                    <span>{nextPost.data.title}</span>
                    <Link href={`/post/${nextPost.uid}`}>
                      <a>Próximo post</a>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <Comments />

            {!preview && <ButtonExitPreview />}
          </div>
        </footer>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.uid'],
      pageSize: 10,
    }
  );

  const slugsArray = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: slugsArray,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response) {
    return {
      notFound: true,
    };
  }

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
      fetch: ['post.title'],
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      fetch: ['post.title'],
    })
  ).results[0];

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
    },
    revalidate: 60 * 60 * 24, // 24 Horas
  };
};
