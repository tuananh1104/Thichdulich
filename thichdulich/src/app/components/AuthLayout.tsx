import { Outlet } from 'react-router';
import { Toaster } from './ui/sonner';

/** Layout tối giản cho /login và /register — không Header/Footer */
export function AuthLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
