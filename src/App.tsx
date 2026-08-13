import { Route, Routes } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { FlowLayout } from './FlowLayout';
import { Toast } from './components/Toast';
import { Landing } from './pages/Landing';
import { Create } from './pages/Create';
import { Waiting } from './pages/Waiting';
import { Questions } from './pages/Questions';
import { Review } from './pages/Review';
import { Refine } from './pages/Refine';
import { Published } from './pages/Published';
import { Stub } from './pages/Stub';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<FlowLayout />}>
          <Route path="/create" element={<Create />} />
          <Route path="/waiting" element={<Waiting />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/review" element={<Review />} />
          <Route path="/refine" element={<Refine />} />
          <Route path="/published" element={<Published />} />
        </Route>
        <Route path="/projects" element={<Stub />} />
        <Route path="/templates" element={<Stub />} />
        <Route path="/showcase" element={<Stub />} />
        <Route path="/settings" element={<Stub />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <Toast />
    </AppProvider>
  );
}
