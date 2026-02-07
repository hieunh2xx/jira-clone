
import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import { Toaster } from "sonner";
import { useAutoReload } from "./hooks/useAutoReload";
import { ErrorBoundary } from "./components/ErrorBoundary";
function AppContent() {
  useAutoReload(30000);
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster 
        position="top-center" 
        richColors 
        expand={true}
        visibleToasts={5}
        toastOptions={{
          style: {
            zIndex: 9999,
          },
        }}
      />
    </ErrorBoundary>
  );
}
export default function App() {
  return <AppContent />;
}