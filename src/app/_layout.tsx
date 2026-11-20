import { NavegadorRaiz } from '../components/NavegadorRaiz';
import { BibliotecaProvider } from '../context/BibliotecaContext';
import { configurarManejadorNotificaciones } from '../lib/notificaciones';

configurarManejadorNotificaciones();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function LayoutRaiz() {
  return (
    <BibliotecaProvider>
      <NavegadorRaiz />
    </BibliotecaProvider>
  );
}
