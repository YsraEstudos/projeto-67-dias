import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { parseSnapshotFile, supportsFileSystemAccess } from '../app/backup';
import { exportFullPlanAsMarkdown, exportFullPlanAsPdf } from '../app/planExport';
import { useAppContext } from '../app/AppContext';

export const SettingsPage = () => {
  const { state, dayPlans, runManualBackup, connectBackupFile, importSnapshot, exportSnapshot } =
    useAppContext();
  const [message, setMessage] = useState<string>('');

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const snapshot = await parseSnapshotFile(file);
      importSnapshot(snapshot);
      setMessage('Snapshot importado com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao importar snapshot.');
    }
  };

  const handleConnectBackup = async (): Promise<void> => {
    try {
      await connectBackupFile();
      setMessage('Arquivo de backup conectado no Edge.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível conectar arquivo.');
    }
  };

  const handleManualBackup = async (): Promise<void> => {
    try {
      await runManualBackup();
      setMessage('Backup manual executado com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao executar backup manual.');
    }
  };

  const handleExportPlanMarkdown = (): void => {
    try {
      exportFullPlanAsMarkdown(dayPlans);
      setMessage('Plano completo exportado em .md com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao exportar plano em .md.');
    }
  };

  const handleExportPlanPdf = (): void => {
    try {
      exportFullPlanAsPdf(dayPlans);
      setMessage('Plano em PDF iniciado. Use "Salvar como PDF" na janela de impressão.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao gerar PDF do plano.');
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>Configurações e Backup</h2>
        <p>
          Persistência local com export/import JSON e rotina automática de backup a cada 10 minutos quando
          houver mudanças.
        </p>
      </header>

      <div className="grid-2">
        <article className="panel">
          <h3>Persistência</h3>
          <p>Schema version: {state.schemaVersion}</p>
          <p>Change token: {state.meta.changeToken}</p>
          <p>Última alteração: {state.meta.lastChangedAt ?? 'nenhuma'}</p>
          <button className="button" onClick={() => exportSnapshot()}>
            Exportar snapshot JSON
          </button>
          <label className="field-label">
            Importar snapshot JSON
            <input className="input" type="file" accept="application/json" onChange={onImportFile} />
          </label>
        </article>

        <article className="panel">
          <h3>Backup automático</h3>
          <p>Intervalo: {state.meta.backup.autoBackupIntervalMinutes} minutos</p>
          <p>Último backup: {state.meta.backup.lastBackupAt ?? 'ainda não executado'}</p>
          <p>Modo: {state.meta.backup.lastBackupMode ?? 'sem modo'}</p>
          <p>Último erro: {state.meta.backup.lastBackupError ?? 'sem erro'}</p>
          <p>
            Fallback local: {state.meta.backup.lastFallbackSnapshotAt ?? 'nenhum'}
          </p>

          <div className="button-row">
            <button className="button" onClick={handleManualBackup}>
              Rodar backup manual
            </button>
            <button
              className="button"
              onClick={handleConnectBackup}
              disabled={!supportsFileSystemAccess()}
            >
              Conectar arquivo de backup (Edge)
            </button>
          </div>
        </article>

        <article className="panel">
          <h3>Exportar plano completo</h3>
          <p>Gere um arquivo com o cronograma completo do período atual.</p>

          <div className="button-row">
            <button className="button" onClick={handleExportPlanMarkdown}>
              Baixar plano em .md
            </button>
            <button className="button" onClick={handleExportPlanPdf}>
              Baixar plano em PDF
            </button>
          </div>
        </article>
      </div>

      {message ? <div className="panel message-box">{message}</div> : null}
    </section>
  );
};

