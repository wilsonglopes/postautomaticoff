const SPECIAL_CHARS: Record<string, string> = {
  á: 'a', à: 'a', ã: 'a', â: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', õ: 'o', ô: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
  Á: 'a', À: 'a', Ã: 'a', Â: 'a', Ä: 'a',
  É: 'e', È: 'e', Ê: 'e', Ë: 'e',
  Í: 'i', Ì: 'i', Î: 'i', Ï: 'i',
  Ó: 'o', Ò: 'o', Õ: 'o', Ô: 'o', Ö: 'o',
  Ú: 'u', Ù: 'u', Û: 'u', Ü: 'u',
  Ç: 'c', Ñ: 'n',
}

export function slugify(text: string): string {
  return text
    .split('')
    .map(char => SPECIAL_CHARS[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function slugifyFromKeyword(keyword: string): string {
  return slugify(keyword)
}
