import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LinkModal from '../../../components/links/LinkModal';
import { Site } from '../../../types';

const sites: Site[] = [{ id: 's1', name: 'Google', categoryId: 'personal', order: 0, createdAt: 0, updatedAt: 0 }];

const renderModal = (overrides: Partial<React.ComponentProps<typeof LinkModal>> = {}) => {
    const onSave = vi.fn();
    render(
        <LinkModal
            link={null}
            prompts={[]}
            promptCategories={[]}
            siteCategories={[]}
            sites={sites}
            folders={[]}
            onClose={vi.fn()}
            onSave={onSave}
            {...overrides}
        />
    );
    return { onSave };
};

describe('LinkModal', () => {
    it('blocks saving a javascript: URL', () => {
        renderModal();
        fireEvent.change(screen.getByLabelText('Título do Site'), { target: { value: 'XSS' } });
        fireEvent.change(screen.getByLabelText('URL (Endereço)'), { target: { value: 'javascript:alert(1)' } });
        expect(screen.getByRole('alert')).toHaveTextContent('URL inválida');
        expect(screen.getByRole('button', { name: /Salvar/ })).toBeDisabled();
    });

    it('allows saving a bare domain', () => {
        const { onSave } = renderModal();
        fireEvent.change(screen.getByLabelText('Título do Site'), { target: { value: 'Drive' } });
        fireEvent.change(screen.getByLabelText('URL (Endereço)'), { target: { value: 'drive.google.com' } });
        const save = screen.getByRole('button', { name: /Salvar/ });
        expect(save).toBeEnabled();
        fireEvent.click(save);
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Drive', siteId: 's1' }));
    });

    it('cannot save when there is no site to hold the link', () => {
        renderModal({ sites: [] });
        fireEvent.change(screen.getByLabelText('Título do Site'), { target: { value: 'Drive' } });
        fireEvent.change(screen.getByLabelText('URL (Endereço)'), { target: { value: 'drive.google.com' } });
        expect(screen.getByText('Crie um site antes de adicionar links.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Salvar/ })).toBeDisabled();
    });
});
