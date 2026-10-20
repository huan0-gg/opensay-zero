import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '../../test/utils';
import { useProgress } from '../../state/store';

describe('assessment', () => {
  beforeEach(() => {
    useProgress.getState().reset();
  });

  it('lets a beginner skip without being blocked', () => {
    renderApp('/assessment');
    fireEvent.click(screen.getByRole('button', { name: /跳过/ }));
    expect(screen.getByRole('heading', { name: '今天，先开口' })).toBeInTheDocument();
  });

  it('records a skipped assessment so the entry card can stop nagging', () => {
    renderApp('/assessment');
    fireEvent.click(screen.getByRole('button', { name: /跳过/ }));
    expect(useProgress.getState().progress.assessment?.skipped).toBe(true);
  });

  it('counts heard and spoken answers across all six questions', () => {
    renderApp('/assessment');
    fireEvent.click(screen.getByRole('button', { name: '多少钱？' }));
    fireEvent.click(screen.getByRole('button', { name: '带走。' }));
    fireEvent.click(screen.getByRole('button', { name: '刷卡还是现金？' }));
    fireEvent.click(screen.getByRole('button', { name: '我说了，继续' }));
    fireEvent.click(screen.getByRole('button', { name: '我说了，继续' }));
    fireEvent.change(screen.getByLabelText('你的回答'), { target: { value: "I'm Li" } });
    fireEvent.click(screen.getByRole('button', { name: '继续' }));

    expect(screen.getByRole('heading', { name: /你听懂了 3 句/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /开口说了 3 句/ })).toBeInTheDocument();
    expect(useProgress.getState().progress.assessment).toMatchObject({
      heard: 3,
      spoke: 3,
      skipped: false,
    });
  });
});
