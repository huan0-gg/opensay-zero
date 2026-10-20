import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { todayKey } from '../domain/progress';
import type { SessionRecord } from '../domain/types';
import { useProgress } from '../state/store';
import { renderApp } from '../test/utils';

function record(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: `s-${Math.random()}`,
    date: todayKey(),
    sceneId: 'coffee',
    day: 1,
    kind: 'scene',
    planIndex: 0,
    scheduled: false,
    turns: 6,
    independentTurns: 4,
    minutes: 8,
    hints: 0,
    corrections: 0,
    completed: true,
    ...overrides,
  };
}

describe('home', () => {
  beforeEach(() => {
    useProgress.getState().reset();
  });

  it('offers the scheduled task on a fresh day', () => {
    renderApp('/home');
    expect(screen.getByRole('link', { name: /开始今天的 10 分钟/ })).toBeInTheDocument();
    expect(screen.getByText(/第 1 \/ 20 次/)).toBeInTheDocument();
  });

  it('does not let an off-plan practice hide the scheduled task', () => {
    useProgress.getState().completeSession(record({ scheduled: false }));
    renderApp('/home');
    expect(screen.getByRole('link', { name: /开始今天的 10 分钟/ })).toBeInTheDocument();
    expect(screen.queryByText('今天已完成')).not.toBeInTheDocument();
  });

  it('shows the completed state after the scheduled session', () => {
    useProgress.getState().completeSession(record({ scheduled: true }));
    renderApp('/home');
    expect(screen.getByText('今天已完成')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /再练一次今天的场景/ })).toBeInTheDocument();
  });

  it('shows a terminal state after all twenty sessions', () => {
    useProgress.setState({
      progress: { ...useProgress.getState().progress, planIndex: 20 },
    });
    renderApp('/home');
    expect(screen.getByText('4 周走完了')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /回场景里再练一次/ })).toBeInTheDocument();
  });

  it('explains when local progress had to be recovered', () => {
    useProgress.setState({ recovered: true });
    renderApp('/home');
    expect(screen.getByText(/进度文件读不出来/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    expect(useProgress.getState().recovered).toBe(false);
  });
});

describe('library pages', () => {
  beforeEach(() => {
    useProgress.getState().reset();
  });

  it('lists five scenes and locks the ones not reached yet', () => {
    renderApp('/scenes');
    expect(screen.getAllByTestId('scene-card')).toHaveLength(5);
    expect(screen.getAllByTestId('scene-card').filter((card) => card.dataset.locked === 'true')).toHaveLength(4);
  });

  it('filters the chunk book to the twenty must-say chunks', () => {
    renderApp('/chunks');
    expect(screen.getAllByTestId('chunk-row')).toHaveLength(60);
    fireEvent.click(screen.getByRole('button', { name: '必说' }));
    expect(screen.getAllByTestId('chunk-row')).toHaveLength(20);
  });

  it('shows an empty 能说清单 before the first badge', () => {
    renderApp('/profile');
    expect(screen.getByText(/还没有通关的场景/)).toBeInTheDocument();
  });
});
