import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../app/AppContext';
import { subjectLabel } from '../app/formatters';
import type { CorrectionStatus, SubjectKey } from '../app/types';
import { PageIntro } from '../components/PageIntro';
import { SectionCard } from '../components/SectionCard';
import { BottomSheet } from '../components/BottomSheet';

interface FormState {
  topicId: string;
  questionUrl: string;
  correctionUrl: string;
  hasAnkiCard: boolean;
  status: CorrectionStatus;
  note: string;
}

const initialForm: FormState = {
  topicId: '',
  questionUrl: '',
  correctionUrl: '',
  hasAnkiCard: false,
  status: 'pendente',
  note: '',
};

export const CorrectionsPage = () => {
  const { leafTopics, topics, state, addCorrectionLink, updateCorrectionLink, removeCorrectionLink } =
    useAppContext();

  const [form, setForm] = useState<FormState>(initialForm);
  const [subjectFilter, setSubjectFilter] = useState<'all' | SubjectKey>('all');
  const [isSheetOpen, setSheetOpen] = useState(false);

  const topicById = useMemo(
    () =>
      topics.reduce<Record<string, (typeof topics)[number]>>((accumulator, topic) => {
        accumulator[topic.id] = topic;
        return accumulator;
      }, {}),
    [topics],
  );

  const filteredLinks = state.correctionLinks.filter((link) => {
    if (subjectFilter === 'all') {
      return true;
    }

    const topic = topicById[link.topicId];
    return topic?.subject === subjectFilter;
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!form.topicId || !form.questionUrl || !form.correctionUrl) {
      return;
    }

    addCorrectionLink(form);
    setForm(initialForm);
    setSheetOpen(false);
  };

  return (
    <section className="page">
      <PageIntro
        kicker="Inbox operacional"
        title="Links de Correção"
        description="Cadastro manual por tópico com marcação de card Anki existente e tratamento rápido por status."
        actions={
          <button className="button" onClick={() => setSheetOpen(true)}>
            <Plus size={18} /> Novo Link
          </button>
        }
      />

      <BottomSheet isOpen={isSheetOpen} onClose={() => setSheetOpen(false)} title="Novo link de correção">
      <form className="form-grid" onSubmit={onSubmit}>
        <label className="field-label">
          Tópico
          <select
            className="input"
            value={form.topicId}
            onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value }))}
            required
          >
            <option value="">Selecione...</option>
            {leafTopics.map((topic) => (
              <option value={topic.id} key={topic.id}>
                {subjectLabel(topic.subject)} - {topic.title}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          URL da questão
          <input
            className="input"
            type="url"
            value={form.questionUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, questionUrl: event.target.value }))
            }
            placeholder="https://..."
            required
          />
        </label>

        <label className="field-label">
          URL da correção
          <input
            className="input"
            type="url"
            value={form.correctionUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, correctionUrl: event.target.value }))
            }
            placeholder="https://..."
            required
          />
        </label>

        <label className="field-label">
          Status
          <select
            className="input"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value as CorrectionStatus }))
            }
          >
            <option value="pendente">Pendente</option>
            <option value="corrigida">Corrigida</option>
            <option value="revisar_card">Revisar card</option>
          </select>
        </label>

        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={form.hasAnkiCard}
            onChange={(event) =>
              setForm((current) => ({ ...current, hasAnkiCard: event.target.checked }))
            }
          />
          Já existe card Anki
        </label>

        <label className="field-label full">
          Observação
          <textarea
            className="textarea"
            rows={2}
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          />
        </label>

        <button className="button" type="submit">
          Adicionar link
        </button>
      </form>
      </BottomSheet>

      <SectionCard className="controls-row" kicker="Filtro" title="Lista de correções">
        <select
          className="input"
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value as 'all' | SubjectKey)}
        >
          <option value="all">Todas as matérias</option>
          <option value="portugues">Português</option>
          <option value="rlm">RLM</option>
          <option value="legislacao">Legislação</option>
          <option value="especificos">Específicos</option>
        </select>
      </SectionCard>

      <SectionCard className="table-wrap" kicker="Fila" title="Correções cadastradas">
        <div className="hidden md:block">
          <table className="table">
            <thead>
              <tr>
                <th>Tópico</th>
                <th>Questão</th>
                <th>Correção</th>
                <th>Status</th>
                <th>Card</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link) => {
                const topic = topicById[link.topicId];

                return (
                  <tr key={link.id}>
                    <td>{topic ? topic.title : 'Tópico removido'}</td>
                    <td>
                      <a href={link.questionUrl} target="_blank" rel="noreferrer">
                        abrir
                      </a>
                    </td>
                    <td>
                      <a href={link.correctionUrl} target="_blank" rel="noreferrer">
                        abrir
                      </a>
                    </td>
                    <td>
                      <select
                        className="input"
                        value={link.status}
                        onChange={(event) =>
                          updateCorrectionLink(link.id, {
                            status: event.target.value as CorrectionStatus,
                          })
                        }
                      >
                        <option value="pendente">Pendente</option>
                        <option value="corrigida">Corrigida</option>
                        <option value="revisar_card">Revisar card</option>
                      </select>
                    </td>
                    <td>
                      <label className="checkbox-line">
                        <input
                          type="checkbox"
                          checked={link.hasAnkiCard}
                          onChange={(event) =>
                            updateCorrectionLink(link.id, {
                              hasAnkiCard: event.target.checked,
                            })
                          }
                        />
                        Sim
                      </label>
                    </td>
                    <td>
                      <button className="button button-danger" onClick={() => removeCorrectionLink(link.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={6}>Nenhum link cadastrado com esse filtro.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="block md:hidden">
          {filteredLinks.map((link) => {
            const topic = topicById[link.topicId];
            return (
              <div className="mobile-list-card" key={link.id}>
                <div className="mobile-list-card-header">
                  {topic ? topic.title : 'Tópico removido'}
                </div>
                <div className="mobile-list-card-body">
                  <div className="mobile-list-card-stat">
                    <span>Links</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={link.questionUrl} target="_blank" rel="noreferrer">Questão</a>
                      <a href={link.correctionUrl} target="_blank" rel="noreferrer">Correção</a>
                    </div>
                  </div>
                  <div className="mobile-list-card-stat" style={{ alignItems: 'center' }}>
                    <span>Status</span>
                    <select
                      className="input"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', minHeight: 'auto' }}
                      value={link.status}
                      onChange={(event) =>
                        updateCorrectionLink(link.id, {
                          status: event.target.value as CorrectionStatus,
                        })
                      }
                    >
                      <option value="pendente">Pendente</option>
                      <option value="corrigida">Corrigida</option>
                      <option value="revisar_card">Revisar card</option>
                    </select>
                  </div>
                  <div className="mobile-list-card-stat">
                    <span>Card Anki</span>
                    <label className="checkbox-line" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={link.hasAnkiCard}
                        onChange={(event) =>
                          updateCorrectionLink(link.id, {
                            hasAnkiCard: event.target.checked,
                          })
                        }
                      />
                    </label>
                  </div>
                  <button 
                    className="button button-danger" 
                    onClick={() => removeCorrectionLink(link.id)}
                    style={{ marginTop: '8px' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
          {filteredLinks.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum link cadastrado.</p>
          ) : null}
        </div>
      </SectionCard>
    </section>
  );
};


