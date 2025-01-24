import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import { useProduct } from '../ProductContext';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
  docsLink: string;
  productId: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Redis',
    Svg: require('@site/static/img/redis-logo.svg').default,
    description: (
      <>
        Serverless Redis® with global replication, durable storage, and automatic scaling.
        Perfect for real-time applications, caching, and session management.
      </>
    ),
    docsLink: '/docs/redis/overall/getstarted',
    productId: 'redis',
  },
  {
    title: 'Vector',
    Svg: require('@site/static/img/vector-logo.svg').default,
    description: (
      <>
        Serverless vector database designed for AI applications. Store and search
        embeddings with high performance and cost efficiency.
      </>
    ),
    docsLink: '/docs/vector/overall/getstarted',
    productId: 'vector',
  },
  {
    title: 'QStash',
    Svg: require('@site/static/img/qstash-logo.svg').default,
    description: (
      <>
        HTTP-based messaging and scheduling solution for the serverless era.
        Perfect for background jobs, webhooks, and scheduling tasks.
      </>
    ),
    docsLink: '/docs/qstash/overall/getstarted',
    productId: 'qstash',
  },
];

function Feature({title, Svg, description, docsLink, productId}: FeatureItem) {
  const { setHoveredProduct } = useProduct();
  
  return (
    <div className={clsx('col col--4')}>
      <div 
        className={styles.featureCard}
        onMouseEnter={() => setHoveredProduct(productId)}
        onMouseLeave={() => setHoveredProduct(null)}
      >
        <div className={styles.cardContent}>
          <div className="text--center">
            <Svg className={styles.featureSvg} role="img" />
          </div>
          <div className="text--center padding-horiz--md">
            <Heading as="h3" className={styles.featureTitle} data-product={productId}>
              {title}
            </Heading>
            <p className={styles.featureDescription}>{description}</p>
          </div>
        </div>
        <div className={styles.buttonContainer}>
          <a
            className={styles.learnMoreButton}
            href={docsLink}>
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
