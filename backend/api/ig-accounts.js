/**
 * ig-accounts.js — curated Bangalore family/kids event accounts to follow.
 *
 * Edit this list to add/remove accounts. The sync cron will pick up changes
 * on its next run (every Sunday night).
 *
 * postsToFetch: how many of their recent posts to scan for events (default 3)
 */

export const IG_ACCOUNTS = [
  // High-frequency event posters — fetch more posts
  { username: "rangashankara",          label: "Ranga Shankara",              postsToFetch: 8 },
  { username: "jagrititheatre",         label: "Jagriti Theatre",             postsToFetch: 8 },
  { username: "attagalatta",            label: "Atta Galatta Books",          postsToFetch: 8 },
  { username: "chowdiahmemorialhall",   label: "Chowdiah Memorial Hall",      postsToFetch: 6 },
  { username: "mapbangalore",           label: "MAP Museum",                   postsToFetch: 6 },
  // Medium frequency
  { username: "bangalorewalks",         label: "Bangalore Walks",             postsToFetch: 5 },
  { username: "attakkalari",            label: "Attakkalari Centre",          postsToFetch: 5 },
  { username: "spicmacay_blr",          label: "SPIC MACAY Bangalore",        postsToFetch: 5 },
  { username: "insider.in",             label: "Insider.in Bangalore",        postsToFetch: 8 },
  { username: "bookmyshowin",           label: "BookMyShow India",            postsToFetch: 5 },
  // Craftymeets — Bangalore workshop & experience platform
  { username: "craftymeets",            label: "CraftyMeets",                 postsToFetch: 8 },
  // Lower frequency
  { username: "ncbs_bangalore",         label: "NCBS Bangalore",              postsToFetch: 4 },
  { username: "farmersmarketbangalore", label: "Farmers Market Bangalore",    postsToFetch: 3 },
  { username: "cliffhangerblr",         label: "Cliffhanger Climbing",        postsToFetch: 3 },
  { username: "inventure_academy",      label: "Inventure Academy",           postsToFetch: 3 },
];
