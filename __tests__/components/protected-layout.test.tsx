import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedLayout } from '@/components/dashboard/ProtectedLayout';

// Mock the useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/navigation redirect to throw like the real implementation
const mockRedirect = vi.fn().mockImplementation(() => {
  throw new Error('NEXT_REDIRECT');
});
vi.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('ProtectedLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when isLoading is true', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      isLoading: true,
    });

    render(
      <ProtectedLayout>
        <div>Protected Content</div>
      </ProtectedLayout>
    );

    // Should show skeleton, not the content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when no profile', () => {
    mockUseAuth.mockReturnValue({
      profile: null,
      isLoading: false,
    });

    expect(() => {
      render(
        <ProtectedLayout>
          <div>Protected Content</div>
        </ProtectedLayout>
      );
    }).toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('renders children when profile exists and role is allowed', () => {
    mockUseAuth.mockReturnValue({
      profile: { role: 'patient' },
      isLoading: false,
    });

    render(
      <ProtectedLayout allowedRoles={['patient']}>
        <div>Protected Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when role is not allowed', () => {
    mockUseAuth.mockReturnValue({
      profile: { role: 'patient' },
      isLoading: false,
    });

    expect(() => {
      render(
        <ProtectedLayout allowedRoles={['admin']}>
          <div>Protected Content</div>
        </ProtectedLayout>
      );
    }).toThrow('NEXT_REDIRECT');

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('allows doctor role when specified', () => {
    mockUseAuth.mockReturnValue({
      profile: { role: 'doctor' },
      isLoading: false,
    });

    render(
      <ProtectedLayout allowedRoles={['doctor']}>
        <div>Doctor Dashboard</div>
      </ProtectedLayout>
    );

    expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
  });

  it('allows admin role when specified', () => {
    mockUseAuth.mockReturnValue({
      profile: { role: 'admin' },
      isLoading: false,
    });

    render(
      <ProtectedLayout allowedRoles={['admin']}>
        <div>Admin Dashboard</div>
      </ProtectedLayout>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('uses default allowed roles when not specified', () => {
    mockUseAuth.mockReturnValue({
      profile: { role: 'patient' },
      isLoading: false,
    });

    render(
      <ProtectedLayout>
        <div>Default Access</div>
      </ProtectedLayout>
    );

    expect(screen.getByText('Default Access')).toBeInTheDocument();
  });

  it('allows multiple roles', () => {
    mockUseAuth.mockReturnValue({
      profile: { role: 'doctor' },
      isLoading: false,
    });

    render(
      <ProtectedLayout allowedRoles={['patient', 'doctor', 'admin']}>
        <div>Multi-role Content</div>
      </ProtectedLayout>
    );

    expect(screen.getByText('Multi-role Content')).toBeInTheDocument();
  });
});
