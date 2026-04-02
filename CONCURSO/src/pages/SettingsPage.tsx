import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { parseSnapshotFile, supportsFileSystemAccess } from '../app/backup';
import { END_DATE, START_DATE } from '../app/constants';
import { formatIsoDatePtBr } from '../app/formatters';
import { exportFullPlanAsMarkdown, exportFullPlanAsPdf } from '../app/planExport';
import { useAppContext } from '../app/AppContext';
import { PageIntro } from '../components/PageIntro';
import { SectionCard } from '../components/SectionCard';
import { useTheme } from '../app/ThemeContext';

export const SettingsPage = () => {
  const {
    state,
    dayPlans,
    setPlanStartDate,
    runManualBackup,
    connectBackupFile,
    importSnapshot,
    exportSnapshot,
    cloudSync,
    connectGoogleCloud,
    syncToCloudNow,
  } = useAppContext();
  const { colors, setColors } = useTheme();
  const [message, setMessage] = useState<string>('');

  const handleColorChange = (key: keyof typeof colors, value: string) => {
    setColors({ ...colors, [key]: value });
  };

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

  const handlePlanStartDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const nextStartDate = event.target.value;
    if (!nextStartDate || nextStartDate === state.planSettings.startDate) {
      return;
    }

    setPlanStartDate(nextStartDate);
    setMessage(`Início do plano atualizado para ${formatIsoDatePtBr(nextStartDate)}.`);
  };

  const handleGoogleConnect = async (): Promise<void> => {
    try {
      await connectGoogleCloud();
      setMessage('Conta Google conectada. O plano sera salvo automaticamente na nuvem.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao conectar conta Google.');
    }
  };

  const handleCloudSyncNow = async (): Promise<void> => {
    try {
      await syncToCloudNow();
      setMessage('Sincronizacao com a nuvem concluida.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao sincronizar com a nuvem.');
    }
  };

  return (
    <section className="page">
      <PageIntro
        kicker="Manutenção do sistema"
        title="Configurações e Backup"
        description="Persistência local, sincronização na nuvem, exportação e recuperação do plano em um centro de manutenção mais legível."
      />

      <div className="grid-2">
        <SectionCard as="article" kicker="Aparência" title="Studio Pro Tema">
          <div className="theme-color-picker-row">
            <label className="field-label" htmlFor="color-primary">Cor Primária (Neon Base)</label>
            <input
              id="color-primary"
              type="color"
              className="color-input"
              value={colors.primary}
              onChange={(e) => handleColorChange('primary', e.target.value)}
              title="Cor Primária"
            />
          </div>
          <div className="theme-color-picker-row">
            <label className="field-label" htmlFor="color-secondary">Cor Secundária (Foco Ativo)</label>
            <input
              id="color-secondary"
              type="color"
              className="color-input"
              value={colors.secondary}
              onChange={(e) => handleColorChange('secondary', e.target.value)}
              title="Cor Secundária"
            />
          </div>
          <div className="theme-color-picker-row">
            <label className="field-label" htmlFor="color-tertiary">Cor Terciária (Revisão)</label>
            <input
              id="color-tertiary"
              type="color"
              className="color-input"
              value={colors.tertiary}
              onChange={(e) => handleColorChange('tertiary', e.target.value)}
              title="Cor Terciária"
            />
          </div>
        </SectionCard>

        <SectionCard as="article" kicker="Cronograma" title="Início do plano de estudos">
          <label className="field-label">
            Data de início do plano
            <input
              className="input"
              type="date"
              min={START_DATE}
              max={END_DATE}
              value={state.planSettings.startDate}
              onChange={handlePlanStartDateChange}
            />
          </label>
          <p>Janela oficial do edital: de {formatIsoDatePtBr(state.planSettings.startDate)} até {formatIsoDatePtBr(END_DATE)}.</p>
          <p>
            O cronograma diário é recalculado a partir dessa data e mantém a prova em {formatIsoDatePtBr(END_DATE)}.
          </p>
          <p>Alterações já feitas: {state.planSettings.startDateChangeCount}</p>
        </SectionCard>

        <SectionCard as="article" kicker="Nuvem" title="Gmail e sincronização">
          <p>
            Status: <span className={`sync-badge sync-${cloudSync.status}`}>{cloudSync.status}</span>
          </p>
          <p>Conta conectada: {cloudSync.email ?? 'nenhuma conta Google conectada'}</p>
          <p>Ultima sincronizacao: {cloudSync.lastSyncedAt ?? 'ainda nao enviada'}</p>
          <p>Ultima mudanca remota: {cloudSync.lastRemoteChangeAt ?? 'sem registro remoto'}</p>
          <p>Erro atual: {cloudSync.error ?? 'sem erro'}</p>

          <div className="button-row">
            <button className="button" onClick={handleGoogleConnect}>
              Conectar com Google
            </button>
            <button
              className="button button-secondary"
              onClick={handleCloudSyncNow}
              disabled={cloudSync.status === 'local-only' || cloudSync.status === 'checking'}
            >
              Sincronizar agora
            </button>
          </div>
        </SectionCard>

        <SectionCard as="article" kicker="Snapshot" title="Persistência">
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
        </SectionCard>

        <SectionCard as="article" kicker="Proteção" title="Backup automático">
          <p>Intervalo: {state.meta.backup.autoBackupIntervalMinutes} minutos</p>
          <p>Último backup: {state.meta.backup.lastBackupAt ?? 'ainda não executado'}</p>
          <p>Modo: {state.meta.backup.lastBackupMode ?? 'sem modo'}</p>
          <p>Último erro: {state.meta.backup.lastBackupError ?? 'sem erro'}</p>
          <p>
            Fallback local: {state.meta.backup.lastFallbackSnapshotAt ?? 'nenhum'}
          </p>
          <p>
            Mudancas do plano tambem sao enviadas automaticamente para sua conta Google quando ela
            estiver conectada.
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
        </SectionCard>

        <SectionCard as="article" kicker="Saída" title="Exportar plano completo">
          <p>Gere um arquivo com o cronograma completo do período atual.</p>

          <div className="button-row">
            <button className="button" onClick={handleExportPlanMarkdown}>
              Baixar plano em .md
            </button>
            <button className="button" onClick={handleExportPlanPdf}>
              Baixar plano em PDF
            </button>
          </div>
        </SectionCard>
      </div>

      {message ? <SectionCard className="message-box">{message}</SectionCard> : null}
    </section>
  );
};

