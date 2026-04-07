import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { WalletProvider } from '../context/WalletContext';
import StudentDashboard from '../pages/StudentDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';
import Marketplace from '../pages/Marketplace';

// Mock API
vi.mock('../services/api', () => ({
  getBalance: vi.fn().mockResolvedValue({ data: { balance: '250' } }),
  redeem: vi.fn().mockResolvedValue({ data: { success: true } }),
  rewardStudent: vi.fn().mockResolvedValue({ data: { success: true } }),
  bulkReward: vi.fn().mockResolvedValue({ data: { success: true } }),
}));

// Mock wallet context
vi.mock('../context/WalletContext', () => ({
  WalletProvider: ({ children }) => children,
  useWallet: () => ({ publicKey: 'GABC123', role: 'student', connect: vi.fn(), disconnect: vi.fn() }),
}));

const wrap = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('StudentDashboard', () => {
  it('renders balance section', async () => {
    wrap(<StudentDashboard />);
    expect(screen.getByText('EDU Balance')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('250')).toBeTruthy());
  });

  it('renders achievements', () => {
    wrap(<StudentDashboard />);
    expect(screen.getByText('Intro Course')).toBeTruthy();
  });

  it('renders redeem form', () => {
    wrap(<StudentDashboard />);
    expect(screen.getByText('Redeem Tokens')).toBeTruthy();
    expect(screen.getByRole('button', { name: /redeem/i })).toBeTruthy();
  });
});

describe('TeacherDashboard', () => {
  it('renders assign reward form', () => {
    wrap(<TeacherDashboard />);
    expect(screen.getByText('Assign Reward')).toBeTruthy();
    expect(screen.getByPlaceholderText('Student Address')).toBeTruthy();
  });

  it('renders bulk distribution section', () => {
    wrap(<TeacherDashboard />);
    expect(screen.getByText('Bulk Distribution')).toBeTruthy();
  });
});

describe('Marketplace', () => {
  it('renders all marketplace items', () => {
    wrap(<Marketplace />);
    expect(screen.getByText('Scholarship Grant')).toBeTruthy();
    expect(screen.getByText('Course Bundle')).toBeTruthy();
    expect(screen.getByText('Cash via Anchor')).toBeTruthy();
  });

  it('shows EDU costs', () => {
    wrap(<Marketplace />);
    expect(screen.getByText('500 EDU')).toBeTruthy();
  });
});
