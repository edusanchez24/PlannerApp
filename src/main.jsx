import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Header } from './components/Header';
import { RegisterForm } from './components/RegisterForm';

function App() {
  return (
    <>
      <Header />
      <main>
        <RegisterForm />
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
