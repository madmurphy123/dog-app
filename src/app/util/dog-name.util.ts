/* Dog-name substitution. Engine content carries a `{dog}` token; here we swap it
   for the active dog's name (falling back to a neutral label when unset). */

const FALLBACK_NAME = 'your dog';
const TOKEN = '{dog}';

export function displayName(name: string): string {
  return name.trim() || FALLBACK_NAME;
}

export function withDogName(text: string, name: string): string {
  return text.split(TOKEN).join(displayName(name));
}
