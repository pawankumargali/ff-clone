import * as nanoid from "nanoid";
import { v4 as uuidv4 } from 'uuid';

const NANOID_ALLOWED_CHARS = 'A1B2C3D4E5F6G7H8I9J0KLMNOPQRSTUVWXYZ';

export function generateUniqueCode(
    length: number = 12,
    allowedCharacters: string = NANOID_ALLOWED_CHARS
  ) {
    const nanoId = nanoid.customAlphabet(allowedCharacters, length);
    const uniqueId = nanoId();
    return uniqueId;
}

export function generateRandomUUID() {
  return uuidv4();
}

export function slugify(str: string): string {
    if(!str) return '';
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
    const p = new RegExp(a.split('').join('|'), 'g');
  
    return str.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
}
