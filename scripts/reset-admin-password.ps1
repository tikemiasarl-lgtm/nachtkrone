$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$first = Read-Host 'Nouveau mot de passe administrateur' -AsSecureString
$second = Read-Host 'Confirme le nouveau mot de passe' -AsSecureString
$firstPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($first)
$secondPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($second)
try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstPtr)
    $confirmation = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secondPtr)
    if ($password -cne $confirmation) { throw 'Les deux mots de passe sont differents.' }
    if ($password.Length -lt 12) { throw 'Utilise au moins 12 caracteres.' }
    if ([Text.Encoding]::UTF8.GetByteCount($password) -gt 72) { throw 'Le mot de passe doit faire au maximum 72 octets UTF-8 pour bcrypt.' }
    $env:NACHTKRONE_RESET_PASSWORD = $password
    @"
const fs = require('node:fs');
const bcrypt = require('bcryptjs');
const password = process.env.NACHTKRONE_RESET_PASSWORD;
if (!password) throw new Error('Password missing');
const before = fs.readFileSync('.env', 'utf8');
if ((before.match(/^\s*ADMIN_PASSWORD_HASH_BASE64\s*=/gm) || []).length !== 1) throw new Error('Expected one ADMIN_PASSWORD_HASH_BASE64');
const hash = bcrypt.hashSync(password, 12);
if (!bcrypt.compareSync(password, hash)) throw new Error('Password verification failed');
const encoded = Buffer.from(hash, 'utf8').toString('base64');
const after = before.replace(/^(\s*ADMIN_PASSWORD_HASH_BASE64\s*=).*$/gm, (_, prefix) => prefix + encoded);
fs.writeFileSync('.env', after, 'utf8');
require('@next/env').loadEnvConfig(process.cwd(), true);
if (!bcrypt.compareSync(password, Buffer.from(process.env.ADMIN_PASSWORD_HASH_BASE64 || '', 'base64').toString('utf8'))) throw new Error('Next environment verification failed');
console.log('Mot de passe mis a jour et verifie avec Next.js. Redemarre npm run dev.');
"@ | node
    if ($LASTEXITCODE -ne 0) { throw 'La mise a jour a echoue.' }
} finally {
    Remove-Item Env:NACHTKRONE_RESET_PASSWORD -ErrorAction SilentlyContinue
    $password = $null
    $confirmation = $null
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstPtr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secondPtr)
    $first.Dispose()
    $second.Dispose()
}
