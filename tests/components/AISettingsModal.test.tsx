import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AISettingsModal } from '../../src/components/ai/AISettingsModal';
import { localAI } from '../../src/ai/localAIClient';

describe('AISettingsModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <AISettingsModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal controls and updates fields when open', () => {
    const onClose = vi.fn();
    const onConfigSaved = vi.fn();

    render(
      <AISettingsModal
        isOpen={true}
        onClose={onClose}
        onConfigSaved={onConfigSaved}
      />
    );

    expect(screen.getByText('Local AI Engine Settings')).toBeDefined();
    expect(screen.getByText('Enable Local LLM Acceleration')).toBeDefined();
    expect(screen.getByText(/Offline & Privacy Guarantee/i)).toBeDefined();

    // Click a preset button (e.g. qwen2.5)
    const presetBtn = screen.getByRole('button', { name: 'qwen2.5' });
    fireEvent.click(presetBtn);

    // Click save
    const saveBtn = screen.getByRole('button', { name: 'Save Settings' });
    fireEvent.click(saveBtn);

    expect(onConfigSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(localAI.getConfig().model).toBe('qwen2.5');
  });
});
