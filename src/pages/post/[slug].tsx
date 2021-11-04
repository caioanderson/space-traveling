import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Head from 'next/head';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      alt: string;
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
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function countHeading() {
    const heading = post.data.content.reduce((acc, element) => {
      const arrayWords = element.heading.split(' ');
      const countItemsHeading = arrayWords.length;
      return (acc += countItemsHeading);
    }, 0);
    return heading;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function countBody() {
    const body = post.data.content.map(content => {
      const array = content.body;
      return array;
    });
    const textBody = RichText.asText(body);
    const separetedWords = textBody.split(' ');
    const count = separetedWords.length;
    return count;
  }

  const time = `${Math.round((countHeading() + countBody()) / 200 + 1)}m`;

  if (router.isFallback)
    return <div className={styles.loading}>Loading...</div>;
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.banner.alt} />
      </div>

      <div className={commonStyles.container}>
        <div className={styles.header}>
          <h1>{post.data.title}</h1>
          <div className={styles.infoPost}>
            <span>
              <FiCalendar size={20} /> {post.first_publication_date}
            </span>
            <span>
              <FiUser size={20} /> {post.data.author}
            </span>
            <span>
              <FiClock size={20} /> {time}
            </span>
          </div>
          <div className={styles.content}>
            {post.data.content.map((content, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <section key={index}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{ __html: content.body.text }}
                  className={styles.body}
                />
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.title',
        'post.subtitle',
        'post.author',
        'post.banner',
        'post.content',
      ],
    }
  );

  return {
    paths: [{ params: { slug: `${posts.results[0].uid}` } }],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    slug,
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        alt: response.data.banner.alt,
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: {
            text: RichText.asHtml(content.body),
          },
        };
      }),
    },
  };
  return {
    props: { post },
    revalidate: 1,
  };
};
