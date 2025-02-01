import React, { useState, useEffect, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useHistory } from '@docusaurus/router';
import { Index } from "@upstash/vector";
import { useColorMode } from '@docusaurus/theme-common';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './SearchBar.module.css';

interface SearchResult {
  id: string;
  data: string;
  metadata: {
    fileName: string;
    filePath: string;
    fileType: string;
    timestamp: number;
    title?: string;
  };
}

const LoadingDots = ({ text = "Thinking" }: { text?: string }) => (
  <span className={styles.loadingDots}>
    {text}
    <span className={styles.dots}>
      <span>.</span><span>.</span><span>.</span>
    </span>
  </span>
);

const SearchBarContent = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const history = useHistory();
  const {siteConfig} = useDocusaurusContext();
  const { colorMode } = useColorMode();

  const DEFAULT_INDEX_NAMESPACE = "docusaurus-search-upstash";
  const INDEX_NAMESPACE = (siteConfig.customFields?.UPSTASH_VECTOR_INDEX_NAMESPACE as string) || DEFAULT_INDEX_NAMESPACE;

  // Initialize Upstash Vector client
  const index = new Index({
    url: (siteConfig.customFields?.UPSTASH_VECTOR_REST_URL as string),
    token: (siteConfig.customFields?.UPSTASH_VECTOR_REST_TOKEN as string),
  });

  if (!siteConfig.customFields?.UPSTASH_VECTOR_REST_URL || !siteConfig.customFields?.UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error('UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN are required');
  }

  // Clear AI response when search query changes
  useEffect(() => {
    setAiResponse(null);
  }, [searchQuery]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press Escape or Command+K to close the search modal
      if ((e.key === 'Escape' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && isModalOpen) {
        e.preventDefault();
        setIsModalOpen(false);
        setSearchQuery('');
      }
      // Press Command/K to open the search modal
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !isModalOpen) {
        e.preventDefault();
        setIsModalOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Handle search input changes with debounce
  const handleSearchInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setError(null);
    
    if (query.trim()) {
      setIsLoading(true);
      try {
        const results = await index.query({
          data: query,
          topK: 15,
          includeData: true,
          includeMetadata: true,
        }, {
          namespace: INDEX_NAMESPACE
        });
        
        // Map the query results to match SearchResult type and filter duplicates by filename
        const seenFilenames = new Set<string>();
        const mappedResults: SearchResult[] = results
          .map(result => ({
            id: String(result.id),
            data: result.data,
            metadata: {
              fileName: result.metadata.fileName as string,
              filePath: result.metadata.filePath as string,
              fileType: result.metadata.fileType as string,
              timestamp: result.metadata.timestamp as number,
              title: result.metadata.title as string,
            },
          }))
          .filter(result => {
            if (seenFilenames.has(result.metadata.fileName)) {
              return false;
            }
            seenFilenames.add(result.metadata.fileName);
            return true;
          });
        
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
    }
  };

  const handleAiQuestion = async (question: string) => {
    setIsAiLoading(true);
    setAiResponse(null);
    setError(null);

    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          context: searchResults.map(result => ({
            content: result.data,
            metadata: result.metadata
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setAiResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI response');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    const docsPath = '/' + result.metadata.filePath;
    const cleanPath = docsPath.replace(/\.mdx?$/, '');
    history.push(cleanPath);
    setIsModalOpen(false);
    setSearchQuery('');
  };

  const handleClearClick = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className={styles.searchContainer}>
      <button 
        className={styles.searchButton} 
        onClick={() => setIsModalOpen(true)}
        aria-label="Search"
      >
        <svg
          className={styles.searchIcon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className={styles.searchButtonText}>Search</span>
        <span className={styles.searchShortcut}>⌘K</span>
      </button>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div 
            ref={modalRef}
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <form className={styles.searchForm} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.inputWrapper}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={handleSearchInput}
                    className={styles.searchInput}
                    autoFocus
                  />
                  <div className={styles.inputActions}>
                    {searchQuery && (
                      <button
                        type="button"
                        className={styles.clearButton}
                        onClick={handleClearClick}
                        aria-label="Clear search"
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          className={styles.clearIcon}
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                    <div className={styles.divider}></div>
                    <button 
                      className={styles.closeButton}
                      onClick={() => setIsModalOpen(false)}
                      aria-label="Close search"
                    >
                      <span className={styles.escKey}>ESC</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div ref={searchResultsRef} className={styles.searchResults}>
              {isLoading ? (
                <div className={styles.loadingText}>
                  <LoadingDots text="Loading" />
                </div>
              ) : error ? (
                <div className={styles.error}>{error}</div>
              ) : searchResults.length > 0 ? (
                <>
                  <div 
                    className={styles.aiSection}
                    onClick={() => !isAiLoading && handleAiQuestion(searchQuery)}
                  >
                    <div className={styles.aiQueryWrapper}>
                      <div className={styles.aiQueryInfo}>
                        <span className={styles.aiLabel}>AI</span>
                        <div className={styles.aiQueryTextWrapper}>
                          <span className={styles.aiQueryText}>
                            Tell me about <span className={styles.aiQueryHighlight}>{searchQuery}</span>
                          </span>
                        </div>
                      </div>
                      <span className={styles.aiStatus}>
                        {isAiLoading ? <LoadingDots /> : 'Ask →'}
                      </span>
                    </div>
                    {aiResponse && (
                      <div className={styles.aiResponse}>
                        {aiResponse}
                      </div>
                    )}
                  </div>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className={styles.searchResultItem}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className={styles.resultTitle}>
                        {result.metadata.title || result.metadata.fileName.replace(/\.mdx?$/, '')}
                      </div>
                      <div className={styles.resultPath}>
                        {result.metadata.filePath.replace(/\.mdx?$/, '')}
                      </div>
                      <div className={styles.resultPreview}>
                        {(result.data.split('---\n')[2] || result.data).split(/\n/).find(line => /^[a-zA-Z]/.test(line)) || result.data.split('---\n')[2] || result.data}
                      </div>
                    </div>
                  ))}
                </>
              ) : searchQuery ? (
                <div className={styles.noResults}>No results found</div>
              ) : (
                <div className={styles.searchResultsPlaceholder}>
                  Start typing to search...
                </div>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <div className={styles.poweredBy}>
                <span>Powered by</span>
                <img 
                  src={colorMode === 'dark' ? "/img/logo-dark.svg" : "/img/logo.svg"}
                  alt="Upstash Logo" 
                  className={styles.searchLogo}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function SearchBar(): JSX.Element {
  return (
    <BrowserOnly>
      {() => <SearchBarContent />}
    </BrowserOnly>
  );
}
