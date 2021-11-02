import { GetStaticPaths, GetStaticProps } from 'next';

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

  // const contentPost = post.data.content.map(content =>{
  //   console.log(content)
  // })

  // console.log(post.data.content)

  const minutes = '4m';

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
              <FiClock size={20} /> {minutes}
            </span>
          </div>
          <div className={styles.content}>
            {post.data.content.map(content => (
              <section key={content.heading}>
                <h2>{content.heading}</h2>

                {content.body.map(textBody => (
                  <div
                    dangerouslySetInnerHTML={{ __html: textBody.text }}
                    className={styles.body}
                  />
                ))}
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
      pageSize: 1,
    }
  );

  const response = await prismic.getByUID('post', posts.results[0].uid, {});

  return {
    paths: [{ params: { slug: response.uid } }],
    fallback: 'blocking',
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
      content: [
        {
          heading: response.data.content.map(content => {
            return [content.heading];
          }),
          body: [
            {
              text: response.data.content.map(content => {
                return RichText.asHtml(content.body);
              }),
            },
          ],
        },
      ],
      // body: {
      //   text: response.data.content[0].body,
      // },
      // content: {
      //   heading:
      // }
      // [
      //   {
      //     heading: response.data.content.heading,
      //     body: [
      //       {
      //         text: RichText.asHtml(response.data.content.body),
      //       },
      //     ],
      //   },
      // ],
    },
  };
  return {
    props: { post },
  };
};
