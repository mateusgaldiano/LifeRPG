const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'ligacao_Claude_Antigravity.md');

console.log(`[Watcher] Iniciado. Monitorando arquivo: ${targetPath}`);

let lastSeenContent = '';
if (fs.existsSync(targetPath)) {
  lastSeenContent = fs.readFileSync(targetPath, 'utf8');
}

const interval = setInterval(() => {
  if (fs.existsSync(targetPath)) {
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      
      // Se o arquivo contiver o cabeçalho de feedback e ele for novo/modificado
      if (content.includes('## Feedback Claude') && content !== lastSeenContent) {
        console.log('[Watcher] Feedback do Claude detectado! Encerrando watcher para acordar o Antigravity.');
        clearInterval(interval);
        process.exit(0);
      }
    } catch (err) {
      // Ignorar erros temporários de leitura (ex: arquivo bloqueado para escrita)
    }
  }
}, 1000);
