const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Extrai o document.xml do docx (que é um ZIP)
const AdmZip = (() => {
    try { return require('adm-zip'); } catch(e) { return null; }
})();

if (!AdmZip) {
    // Fallback: usar o módulo nativo de zlib + manual unzip via PowerShell
    const result = execSync(
        `powershell -Command "Expand-Archive -Path 'LifeRPG_Debug_Radar.docx' -DestinationPath 'docx_extracted' -Force"`,
        { cwd: __dirname }
    );
    const xml = fs.readFileSync(path.join(__dirname, 'docx_extracted', 'word', 'document.xml'), 'utf8');
    const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(text);
} else {
    const zip = new AdmZip('LifeRPG_Debug_Radar.docx');
    const xml = zip.readAsText('word/document.xml');
    const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(text);
}
