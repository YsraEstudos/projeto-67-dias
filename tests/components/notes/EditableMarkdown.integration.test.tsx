import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditableMarkdown } from '../../../components/notes/EditableMarkdown';

vi.mock('../../../components/notes/FloatingToolbar', () => ({
    FloatingToolbar: () => <div data-testid="floating-toolbar" />
}));

describe('EditableMarkdown paste integration', () => {
    it('renders every pasted markdown checklist line and persists checklist markers', async () => {
        const onChange = vi.fn();
        const markdown = [
            '* [ ] Melhorar a experiência de uso do sistema, principalmente no **Pomodoro**, no **módulo de trabalho** e na **Estante de Aulas**.',
            '',
            '* [ ] No **Pomodoro**, adicionar uma função para o usuário definir o que pretende fazer nas próximas horas.',
            '',
            '* [ ] Integrar melhor o **Pomodoro com o módulo de trabalho**, permitindo visualizar tarefas.',
            '',
            '* [ ] Criar um botão no topo do Pomodoro para abrir essa área integrada.',
            '',
            '* [ ] Deixar a interface mais bonita, leve e com animações suaves.',
            '',
            '* [ ] No **módulo de trabalho**, criar metas mais visuais e organizadas.',
            '',
            '* [ ] Na tela das **aulas**, melhorar a ergonomia dos controles superiores.',
            '',
            '* [ ] Evitar que esses botões fiquem escondidos quando o usuário rolar a página.',
            '',
            '* [ ] Na **Estante de Aulas**, deixar as pastas mais visíveis.',
            '',
            '* [ ] Permitir acessar outras aulas da mesma pasta e navegar entre módulos com mais facilidade.',
        ].join('\n');

        const { container } = render(<EditableMarkdown content="" onChange={onChange} />);
        const editor = container.querySelector('[contenteditable="true"]') as HTMLElement;

        fireEvent.paste(editor, {
            clipboardData: {
                getData: (type: string) => type === 'text/plain' ? markdown : '',
            },
        });

        await waitFor(() => {
            expect(editor.querySelectorAll('input[type="checkbox"]')).toHaveLength(10);
        });

        const savedMarkdown = onChange.mock.calls.at(-1)?.[0] as string;
        expect(savedMarkdown.match(/- \[ \]/g)).toHaveLength(10);
        expect(savedMarkdown).not.toContain('* [ ]');
        expect(savedMarkdown).toContain('**Pomodoro com o módulo de trabalho**');
    });
});
