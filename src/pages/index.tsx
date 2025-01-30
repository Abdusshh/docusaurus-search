import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import { ProductProvider, useProduct } from '@site/src/components/ProductContext';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const { hoveredProduct } = useProduct();
  
  const titleClassName = clsx(styles.heroTitle, {
    [styles.heroTitleRedis]: hoveredProduct === 'redis',
    [styles.heroTitleVector]: hoveredProduct === 'vector',
    [styles.heroTitleQStash]: hoveredProduct === 'qstash',
  });

  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={titleClassName}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className={styles.button}
            to="/docs/vector/features/hybridindexes">
            Click to learn more about Hybrid Indexes in Upstash Vector!
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <ProductProvider>
      <Layout
        title={`${siteConfig.title}`}
        description="Serverless Data Platform">
        <HomepageHeader />
        <main>
          <HomepageFeatures />
        </main>
      </Layout>
    </ProductProvider>
  );
}
