import { Route, Routes } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { FlowLayout } from './FlowLayout';
import { DashLayout } from './components/DashLayout';
import { Toast } from './components/Toast';
import { Landing } from './pages/Landing';
import { Create } from './pages/Create';
import { Waiting } from './pages/Waiting';
import { Classify } from './pages/Classify';
import { DesignSystem } from './pages/DesignSystem';
import { Questions } from './pages/Questions';
import { Review } from './pages/Review';
import { Refine } from './pages/Refine';
import { Preview } from './pages/Preview';
import { Published } from './pages/Published';
import { Projects } from './pages/Projects';
import { TrashPage } from './pages/TrashPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashStub } from './pages/DashStub';
import { Templates } from './pages/Templates';
import { TemplatePreview } from './pages/TemplatePreview';
import { Customize } from './pages/Customize';
import { Stub } from './pages/Stub';

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/templates/preview" element={<TemplatePreview />} />
        <Route path="/templates/customize" element={<Customize />} />
        <Route element={<FlowLayout />}>
          <Route path="/create" element={<Create />} />
          <Route path="/waiting" element={<Waiting />} />
          <Route path="/classify" element={<Classify />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/review" element={<Review />} />
          <Route path="/refine" element={<Refine />} />
          <Route path="/published" element={<Published />} />
        </Route>
        <Route element={<DashLayout />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/brand" element={<DashStub />} />
          <Route path="/usage" element={<SettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/help" element={<DashStub />} />
        </Route>
        <Route path="/showcase" element={<Stub />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      <Toast />
    </AppProvider>
  );
}
