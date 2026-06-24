import * as crypto from 'crypto';

async function generarHash(texto: string): Promise<string> {
    return crypto.createHash('sha256').update(texto, 'utf8').digest('hex');
}

export { generarHash };
