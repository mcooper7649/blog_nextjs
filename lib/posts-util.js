import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';

import { normalizeBelt } from './belts';

const postsDirectory = path.join(process.cwd(), 'posts');

export function getPostsFiles() {
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.md'));
}

function computeReadingTime(content) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getPostData(postIdentifier) {
  const postSlug = postIdentifier.replace(/\.md$/, ''); // removes the file extension
  const filePath = path.join(postsDirectory, `${postSlug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const postData = {
    slug: postSlug,
    ...data,
    title: String(data.title || postSlug).trim(),
    date: String(data.date || ''),
    excerpt: data.excerpt || '',
    image: data.image || null,
    isFeatured: Boolean(data.isFeatured),
    belt: normalizeBelt(data.belt),
    content,
    readingTime: computeReadingTime(content),
  };

  return postData;
}

export function getAllPosts() {
  const postFiles = getPostsFiles();

  const allPosts = postFiles.map((postFile) => {
    return getPostData(postFile);
  });

  const sortedPosts = allPosts.sort((postA, postB) => (postA.date > postB.date ? -1 : 1));

  return sortedPosts;
}

export function getFeaturedPosts() {
  const allPosts = getAllPosts();

  const featuredPosts = allPosts.filter((post) => post.isFeatured);

  return featuredPosts;
}

// Strips the markdown body so list pages don't ship every post's full content.
export function toSummary(post) {
  const { content, ...summary } = post;
  return summary;
}

// Newer/older neighbours of a post, for the prev/next links under an article.
export function getAdjacentPosts(slug) {
  const allPosts = getAllPosts();
  const index = allPosts.findIndex((post) => post.slug === slug);
  const newer = index > 0 ? allPosts[index - 1] : null;
  const older = index >= 0 && index < allPosts.length - 1 ? allPosts[index + 1] : null;
  const link = (post) => (post ? { slug: post.slug, title: post.title } : null);
  return { newer: link(newer), older: link(older) };
}

export function postImagePath(post) {
  return post.image ? `/images/posts/${post.slug}/${post.image}` : null;
}
