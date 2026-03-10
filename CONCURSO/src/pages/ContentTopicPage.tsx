import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppContext } from '../app/AppContext';
import { TOPIC_GRADE_OPTIONS, TOPIC_STALE_BUCKETS_DAYS } from '../app/constants';
import { buildGradesSummary, buildStaleSummary } from '../app/contentSubmatters';
import { topicGradeLabel } from '../app/formatters';
import type { TopicGrade } from '../app/types';

interface NewSubmatterForm {
  title: string;
  grade: TopicGrade;
  lastReviewedAt: string;
  errorNote: string;
  actionNote: string;
}

const initialForm: NewSubmatterForm = {
  title: '',
  grade: 'C',
  lastReviewedAt: '',
  errorNote: '',
  actionNote: '',
};

export const ContentTopicPage = () => {
  const { topicId = '' } = useParams();
  const {
    topics,
    state,
    addTopicSubmatter,
    updateTopicSubmatter,
    removeTopicSubmatter,
    markTopicSubmatterReviewedToday,
  } = useAppContext();
  const [form, setForm] = useState<NewSubmatterForm>(initialForm);

  const topic = topics.find((item) => item.id === topicId && item.isLeaf);
  const submatters = useMemo(
    () => state.topicSubmattersByTopic[topicId] ?? [],
    [state.topicSubmattersByTopic, topicId],
  );

  const topicSummary = useMemo(
    () => buildGradesSummary({ [topicId]: submatters }),
    [submatters, topicId],
  );
  const staleSummary = useMemo(
    () => buildStaleSummary({ [topicId]: submatters }),
    [submatters, topicId],
  );

  const handleCreate = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const title = form.title.trim();
    if (!topic || !title) {
      return;
    }

    addTopicSubmatter(topic.id, {
      title,
      grade: form.grade,
      lastReviewedAt: form.lastReviewedAt || null,
      errorNote: form.errorNote.trim(),
      actionNote: form.actionNote.trim(),
    });

    setForm(initialForm);
  };

  if (!topic) {
    return (
      <section className="page">
        <header className="page-header">
          <h2>Tópico não encontrado</h2>
          <p>Esse tópico não existe no conteúdo atual.</p>
        </header>
        <Link className="button" to="/conteudo">
          Voltar para Conteúdo
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header">
        <h2>{topic.title}</h2>
        <p>Página de submatérias com nota A-E, revisão, erro e ação.</p>
      </header>

      <div className="button-row">
        <Link className="button" to="/conteudo">
          Voltar para Conteúdo
        </Link>
      </div>

      <div className="panel content-summary-grid">
        <article className="content-summary-card">
          <p className="content-summary-label">Total</p>
          <p className="content-summary-value">{topicSummary.total}</p>
        </article>
        <article className="content-summary-card">
          <p className="content-summary-label">Notas</p>
          <p className="content-summary-value">
            A {topicSummary.byGrade.A} | B {topicSummary.byGrade.B} | C {topicSummary.byGrade.C} | D{' '}
            {topicSummary.byGrade.D} | E {topicSummary.byGrade.E}
          </p>
        </article>
        <article className="content-summary-card">
          <p className="content-summary-label">Sem revisar</p>
          <p className="content-summary-value">
            {TOPIC_STALE_BUCKETS_DAYS.map((days) => `>${days}d: ${staleSummary.byDays[days]}`).join(' | ')}
          </p>
        </article>
      </div>

      <form className="panel form-grid" onSubmit={handleCreate}>
        <h3>Nova submatéria</h3>
        <label className="field-label full">
          Submatéria
          <input
            className="input"
            data-testid="submatter-create-title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
        </label>
        <label className="field-label">
          Nota
          <select
            className="input"
            value={form.grade}
            onChange={(event) => setForm((current) => ({ ...current, grade: event.target.value as TopicGrade }))}
          >
            {TOPIC_GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                {topicGradeLabel(grade)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Última revisão
          <input
            className="input"
            type="date"
            value={form.lastReviewedAt}
            onChange={(event) => setForm((current) => ({ ...current, lastReviewedAt: event.target.value }))}
          />
        </label>
        <label className="field-label full">
          Erro
          <textarea
            className="textarea"
            rows={2}
            placeholder="Erro: confundi X com Y"
            value={form.errorNote}
            onChange={(event) => setForm((current) => ({ ...current, errorNote: event.target.value }))}
          />
        </label>
        <label className="field-label full">
          Ação
          <textarea
            className="textarea"
            rows={2}
            placeholder="Ação: refazer 20 questões e criar 3 cards"
            value={form.actionNote}
            onChange={(event) => setForm((current) => ({ ...current, actionNote: event.target.value }))}
          />
        </label>
        <button className="button" type="submit" data-testid="submatter-create-submit">
          Adicionar submatéria
        </button>
      </form>

      <div className="panel table-wrap">
        <h3>Tabela de submatérias</h3>
        <table className="table submatter-table">
          <thead>
            <tr>
              <th>Submatéria</th>
              <th>Nota</th>
              <th>Última revisão</th>
              <th>Erro</th>
              <th>Ação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody data-testid="submatter-table-body">
            {submatters.map((submatter) => (
              <tr key={submatter.id}>
                <td>
                  <input
                    className="input"
                    value={submatter.title}
                    onChange={(event) =>
                      updateTopicSubmatter(topic.id, submatter.id, {
                        title: event.target.value,
                      })
                    }
                  />
                </td>
                <td>
                  <select
                    className="input"
                    value={submatter.grade}
                    onChange={(event) =>
                      updateTopicSubmatter(topic.id, submatter.id, {
                        grade: event.target.value as TopicGrade,
                      })
                    }
                  >
                    {TOPIC_GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {topicGradeLabel(grade)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="submatter-review-cell">
                    <input
                      className="input"
                      type="date"
                      value={submatter.lastReviewedAt ?? ''}
                      onChange={(event) =>
                        updateTopicSubmatter(topic.id, submatter.id, {
                          lastReviewedAt: event.target.value || null,
                        })
                      }
                    />
                    <button
                      className="button"
                      type="button"
                      onClick={() => markTopicSubmatterReviewedToday(topic.id, submatter.id)}
                    >
                      Hoje
                    </button>
                  </div>
                </td>
                <td>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={submatter.errorNote}
                    onChange={(event) =>
                      updateTopicSubmatter(topic.id, submatter.id, {
                        errorNote: event.target.value,
                      })
                    }
                  />
                </td>
                <td>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={submatter.actionNote}
                    onChange={(event) =>
                      updateTopicSubmatter(topic.id, submatter.id, {
                        actionNote: event.target.value,
                      })
                    }
                  />
                </td>
                <td>
                  <button
                    className="button button-danger"
                    type="button"
                    onClick={() => removeTopicSubmatter(topic.id, submatter.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {submatters.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhuma submatéria cadastrada.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};
