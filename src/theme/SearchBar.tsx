import React, { useState, useEffect, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useHistory } from '@docusaurus/router';
import { Index } from "@upstash/vector";
import styles from './SearchBar.module.css';

interface SearchResult {
  id: string;
  data: string;
  metadata: {
    fileName: string;
    filePath: string;
    fileType: string;
    timestamp: number;
  };
}

export default function SearchBar(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const history = useHistory();
  const {siteConfig} = useDocusaurusContext();

  // Initialize Upstash Vector client
  const index = new Index({
    url: `${siteConfig.customFields.UPSTASH_VECTOR_REST_URL}`,
    token: `${siteConfig.customFields.UPSTASH_VECTOR_REST_TOKEN}`,
  });

  // Handle search input changes with debounce
  const handleSearchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setError(null);
    
    if (query.trim()) {
      setIsLoading(true);
      setIsSearchOpen(true);
      try {
        const results = await index.query({
          data: query,
          topK: 5,
          includeData: true,
          includeMetadata: true,
        }, {
          namespace: "docusaurus-search" // Replace with your namespace
        });
        
        // Map the query results to match SearchResult type
        const mappedResults: SearchResult[] = results.map(result => ({
          id: String(result.id),
          data: result.data,
          metadata: {
            fileName: result.metadata.fileName as string,
            filePath: result.metadata.filePath as string,
            fileType: result.metadata.fileType as string,
            timestamp: result.metadata.timestamp as number,
          },
        }));
        
        setSearchResults(mappedResults);
      } catch (error) {
        console.error('Search error:', error);
        setError('An error occurred while searching. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Extract the docs path from the full file path by removing the repo prefix
    const docsPath = result.metadata.filePath.replace(/^temp_repo/, '');
    
    // Remove the file extension for cleaner URLs
    const cleanPath = docsPath.replace(/\.mdx?$/, '');
    history.push(cleanPath);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className={styles.searchContainer}>
      <form className={styles.searchForm} onSubmit={e => e.preventDefault()}>
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={handleSearchInput}
          className={styles.searchInput}
          aria-label="Search documentation"
        />
      </form>

      {isSearchOpen && (
        <div ref={searchResultsRef} className={styles.searchResults}>
          {isLoading && (
            <div className={styles.loadingSpinner}>
              Searching...
            </div>
          )}

          {error && (
            <div className={styles.noResults}>
              {error}
            </div>
          )}

          {!isLoading && !error && searchResults.length === 0 && searchQuery && (
            <div className={styles.noResults}>
              No results found for "{searchQuery}"
            </div>
          )}

          {!isLoading && !error && searchResults.map((result) => (
            <div
              key={result.id}
              className={styles.searchResultItem}
              onClick={() => handleResultClick(result)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleResultClick(result);
                }
              }}
            >
              <div className={styles.resultTitle}>
                {result.metadata.fileName}
              </div>
              <div className={styles.resultPath}>
                {result.metadata.filePath}
              </div>
              <div className={styles.resultPreview}>
                {result.data}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
