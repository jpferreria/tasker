import { describe, it, expect } from 'vitest';
import { LocalAIEngine, isLoopbackEndpoint } from '../../src/ai/localAIClient';
import { format, addDays } from 'date-fns';

describe('LocalAIEngine NLP Parser', () => {
  const engine = new LocalAIEngine();

  it('should parse doctor appointment with date, time, and duration', async () => {
    const res = await engine.parseQuickCapture("Doctor's appointment tomorrow at 10:30am for 45 mins");
    expect(res.type).toBe('APPOINTMENT');
    expect(res.scope).toBe('PERSONAL');
    expect(res.scheduledTime).toBe('10:30');
    expect(res.durationMinutes).toBe(45);
    expect(res.scheduledDate).toBe(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  });

  it('should parse tending garden as a chore with proper time', async () => {
    const res = await engine.parseQuickCapture('Tend the garden at 5pm for 45m');
    expect(res.type).toBe('CHORE');
    expect(res.scope).toBe('PERSONAL');
    expect(res.scheduledTime).toBe('17:00');
    expect(res.durationMinutes).toBe(45);
  });

  it('should parse reading a book as a daily habit', async () => {
    const res = await engine.parseQuickCapture('Read a book for 20 mins daily');
    expect(res.type).toBe('HABIT');
    expect(res.recurringRule).toBe('DAILY');
    expect(res.durationMinutes).toBe(20);
  });

  it('should parse urgent work bug with IMMEDIATE priority', async () => {
    const res = await engine.parseQuickCapture('Immediate: Fix critical checkout bug for client');
    expect(res.priority).toBe('IMMEDIATE');
    expect(res.scope).toBe('WORK');
    expect(res.type).toBe('TASK');
  });

  it('should parse communication tasks', async () => {
    const res = await engine.parseQuickCapture('Reply to Sarah regarding contract on Slack');
    expect(res.type).toBe('COMMUNICATION');
    expect(res.scope).toBe('WORK');
  });

  it('should parse focus time block', async () => {
    const res = await engine.parseQuickCapture('Deep work focus session for 90 mins at 2pm');
    expect(res.type).toBe('FOCUS_BLOCK');
    expect(res.durationMinutes).toBe(90);
    expect(res.scheduledTime).toBe('14:00');
  });

  it('should correctly identify loopback endpoints', () => {
    expect(isLoopbackEndpoint('http://localhost:11434/v1')).toBe(true);
    expect(isLoopbackEndpoint('http://127.0.0.1:11434/v1')).toBe(true);
    expect(isLoopbackEndpoint('http://[::1]:11434/v1')).toBe(true);
    expect(isLoopbackEndpoint('http://api.openai.com/v1')).toBe(false);
    expect(isLoopbackEndpoint('https://example.com')).toBe(false);
    expect(isLoopbackEndpoint('not-a-url')).toBe(false);
  });

  it('should manage configuration updates properly', () => {
    const customEngine = new LocalAIEngine({ enabled: false });
    expect(customEngine.getConfig().enabled).toBe(false);

    customEngine.updateConfig({ enabled: true, model: 'mistral' });
    expect(customEngine.getConfig().enabled).toBe(true);
    expect(customEngine.getConfig().model).toBe('mistral');
  });
});
