$caminho = "C:\Users\mateu\.gemini\antigravity\scratch\liferpg\ligacao_Claude_Antigravity.md"
$ultimaModificacao = $null

if (Test-Path $caminho) {
    $ultimaModificacao = (Get-Item $caminho).LastWriteTime
}

Write-Host "[Watcher] Monitorando: $caminho"
Write-Host "[Watcher] Iniciado em: $(Get-Date -Format 'HH:mm:ss')"

while ($true) {
    Start-Sleep -Seconds 2

    $existe = Test-Path $caminho
    if (-not $existe) { continue }

    $modificacao = (Get-Item $caminho).LastWriteTime

    if ($ultimaModificacao -eq $null -or $modificacao -gt $ultimaModificacao) {
        $ultimaModificacao = $modificacao
        Write-Host "[Watcher] Mudanca detectada em: $(Get-Date -Format 'HH:mm:ss') - chamando Claude..."

        $prompt = "Leia o arquivo '$caminho'. Veja se ha uma secao '## Feedback Claude' com o texto '[Aguardando feedback do Claude...]'. Se houver, substitua esse placeholder pelo seu feedback tecnico detalhado em portugues sobre o conteudo do arquivo. Se o feedback ja estiver preenchido (nao for placeholder), nao faca nada."

        # Pass null to stdin to prevent timeout warning
        $null | & claude -p $prompt --dangerously-skip-permissions 2>&1

        Write-Host "[Watcher] Claude concluiu em: $(Get-Date -Format 'HH:mm:ss')"
    }
}
