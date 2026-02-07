import { ReactNode } from 'react';
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:block lg:w-4/5 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/illustration.jpg')" }}
      />
      <div className="w-full lg:w-1/5 flex items-center justify-center bg-white p-6 lg:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}