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
  
  const headerClassName = clsx('hero', styles.heroBanner, {
    [styles.heroBannerRedis]: hoveredProduct === 'redis',
    [styles.heroBannerVector]: hoveredProduct === 'vector',
    [styles.heroBannerQStash]: hoveredProduct === 'qstash',
  });

  return (
    <header className={headerClassName}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/vector/features/hybridindexes">
            Using Upstash Vector Hybrid Indexes
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
