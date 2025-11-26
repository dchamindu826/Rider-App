// src/sanity/sanityClient.js
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  // --- (!!!) OYA-GE DETAILS METHANA DAANNA (!!!) ---
  projectId: 'p0umau0m',
  dataset: 'production',
  useCdn: false, // App eken nisa false
  apiVersion: '2023-05-03',
  token: 'skkqogowsBDjKpQP5Vj8K7dGa2PQt9zo8IH2ZAuFVBYPQN1KA61TA0a6DFzeK1rYHjRMYaqVKcYIGixBKOhji8haEteOrwBDgBltybyirZAEyFOuzda5G8Dq7JllntpEakLKER7PYxqdnt1gWmbpwY6Sfcih5pUivas87w7tuCfpz2hynsZe', // Data liyanna ona token eka
  // --- ------------------------------------------ ---
});

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  return builder.image(source);
}