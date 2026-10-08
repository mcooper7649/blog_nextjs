import { useMemo, useState } from 'react';

import PostsGrid from './posts-grid';
import BeltChip from '../ui/belt-chip';
import { BELT_ORDER } from '../../lib/belts';
import classes from './all-posts.module.css';

function AllPosts(props) {
  const { posts } = props;
  const [query, setQuery] = useState('');
  const [belt, setBelt] = useState('all');

  const beltsInUse = BELT_ORDER.filter((b) => posts.some((post) => post.belt === b));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (belt !== 'all' && post.belt !== belt) return false;
      if (!q) return true;
      return `${post.title} ${post.excerpt}`.toLowerCase().includes(q);
    });
  }, [posts, query, belt]);

  return (
    <section className={`page ${classes.posts}`}>
      <header className={classes.head}>
        <p className="eyebrow">The archive</p>
        <h1>All posts</h1>
        <p className={classes.lede}>
          {posts.length} field notes on homelab, self-hosting and full-stack craft, from
          white-belt basics to brown-belt deep dives.
        </p>
      </header>

      <div className={classes.controls}>
        <label className={classes.search}>
          <span className="visually-hidden">Search posts</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search posts"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={classes.filters} role="group" aria-label="Filter by belt">
          <button
            type="button"
            aria-pressed={belt === 'all'}
            onClick={() => setBelt('all')}
          >
            All levels
          </button>
          {beltsInUse.map((b) => (
            <button key={b} type="button" aria-pressed={belt === b} onClick={() => setBelt(b)}>
              <BeltChip belt={b} />
            </button>
          ))}
        </div>
      </div>

      <p className={classes.count} aria-live="polite">
        {filtered.length === posts.length
          ? `Showing all ${posts.length} posts`
          : `${filtered.length} of ${posts.length} posts`}
      </p>

      {filtered.length > 0 ? (
        <PostsGrid posts={filtered} />
      ) : (
        <div className={classes.empty}>
          <p>Nothing on the mat for that search.</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setQuery('');
              setBelt('all');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

export default AllPosts;
