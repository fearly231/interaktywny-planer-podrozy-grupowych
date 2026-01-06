'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Snowfall from '../dashboard/Snowfall';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedSection,
  AnimatedHeading,
  AnimatedText,
} from '../components/AnimatedComponents';

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const router = useRouter();

  const closeModals = () => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  };

  const handleLoginSuccess = () => {
    closeModals();
    router.push('/dashboard');
  };

  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Snowfall />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div
            className="text-2xl font-bold text-blue-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            🌍 Travel Planner
          </motion.div>
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AnimatedButton
              onClick={() => setShowLoginModal(true)}
              variant="primary"
            >
              Zaloguj się
            </AnimatedButton>
            <AnimatedButton
              onClick={() => setShowRegisterModal(true)}
              variant="outline"
            >
              Rejestracja
            </AnimatedButton>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10">
        <AnimatedHeading className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Planuj podróże <span className="text-blue-600">razem ze znajomymi</span>
        </AnimatedHeading>
        <AnimatedText
          delay={0.2}
          className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
        >
          Aplikacja która zmienia planowanie podróży grupowych. Wspólnie wybierajcie atrakcje, 
          organizujcie harmonogram i powiedzcie sobie co trzeba spakować.
        </AnimatedText>
        <motion.div
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AnimatedButton
            onClick={() => setShowLoginModal(true)}
            className="px-8 py-3 text-lg shadow-lg"
            variant="primary"
          >
            Zaloguj się →
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setShowRegisterModal(true)}
            variant="outline"
            className="px-8 py-3 text-lg shadow-lg"
          >
            Darmowa rejestracja
          </AnimatedButton>
        </motion.div>
      </section>

      {/* Features Section */}
      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center text-gray-900 mb-16"
        >
          Główne funkcjonalności
        </motion.h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <AnimatedCard delay={0}>
            <motion.div className="text-5xl mb-4">📍</motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Zarządzaj atrakcjami</h3>
            <p className="text-gray-600">
              Dodawaj propozycje atrakcji, głosuj na swoje ulubione i buduj wspólny plan zwiedzania.
              Każdy może zaproponować coś interesującego!
            </p>
          </AnimatedCard>

          {/* Feature 2 */}
          <AnimatedCard delay={0.1}>
            <motion.div className="text-5xl mb-4">📅</motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Harmonogram podróży</h3>
            <p className="text-gray-600">
              Twórz szczegółowy plan dnia po dniu. Przydzielaj atrakcje do konkretnych dni
              i nigdy nie zapomnij o niczym ważnym!
            </p>
          </AnimatedCard>

          {/* Feature 3 */}
          <AnimatedCard delay={0.2}>
            <motion.div className="text-5xl mb-4">🎒</motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Lista pakowania</h3>
            <p className="text-gray-600">
              Wspólnie twórzcie listę rzeczy do spakowania. Zaznaczaj co zostało spakowane
              i bądź pewien, że nic Ci się nie zapomni!
            </p>
          </AnimatedCard>

          {/* Feature 4 */}
          <AnimatedCard delay={0.3}>
            <motion.div className="text-5xl mb-4">👥</motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Zapraszaj znajomych</h3>
            <p className="text-gray-600">
              Dodawaj członków do swojej grupy podróży. Wszyscy mogą współtworzyć plan
              i mieć pełny dostęp do wszystkich informacji.
            </p>
          </AnimatedCard>

          {/* Feature 5 */}
          <AnimatedCard delay={0.4}>
            <motion.div className="text-5xl mb-4">⭐</motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">System głosowania</h3>
            <p className="text-gray-600">
              Demokratycznie wybierajcie najlepsze atrakcje. System głosowania zapewnia,
              że wszyscy mają głos w planowaniu.
            </p>
          </AnimatedCard>

          {/* Feature 6 */}
          <AnimatedCard delay={0.5}>
            <motion.div className="text-5xl mb-4">🔄</motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Synchronizacja w czasie rzeczywistym</h3>
            <p className="text-gray-600">
              Wszystkie zmiany są na bieżąco dostępne dla całej grupy. Brak problemów
              z komunikacją - wszystko w jednym miejscu!
            </p>
          </AnimatedCard>
        </div>
      </AnimatedSection>

      {/* Benefits Section */}
      <AnimatedSection className="bg-blue-600 text-white py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Korzyści dla Ciebie
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: 'Oszczędzaj czas',
                desc: 'Zamiast wysyłać wiadomości tam i z powrotem, wszystko masz w jednym miejscu.',
              },
              {
                title: 'Unikaj konfliktów',
                desc: 'Transparentne głosowanie i demokratyczne decyzje oznaczają, że wszyscy są zadowoleni.',
              },
              {
                title: 'Lepszy plan',
                desc: 'Więcej głów, więcej pomysłów! Twoja podróż będzie bardziej interesująca dzięki pomysłom całej grupy.',
              },
              {
                title: 'Nic się nie zapomni',
                desc: 'Lista pakowania i harmonogram zapewniają, że będziesz dobrze przygotowany.',
              },
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                className="flex gap-4"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="text-3xl flex-shrink-0"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                >
                  ✓
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-blue-100">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-gray-900 mb-6"
        >
          Gotów na przygodę?
        </motion.h2>
        <AnimatedText
          delay={0.2}
          className="text-xl text-gray-600 mb-8"
        >
          Zaplanuj swoją następną podróż razem ze znajomymi już dziś!
        </AnimatedText>
        <motion.div
          className="flex gap-4 justify-center flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <AnimatedButton
            onClick={() => setShowLoginModal(true)}
            variant="primary"
            className="px-8 py-3 text-lg shadow-lg"
          >
            Zaloguj się
          </AnimatedButton>
          <AnimatedButton
            onClick={() => setShowRegisterModal(true)}
            variant="outline"
            className="px-8 py-3 text-lg shadow-lg"
          >
            Zarejestruj się
          </AnimatedButton>
        </motion.div>
      </AnimatedSection>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={closeModals}
        onLoginSuccess={handleLoginSuccess}
      />
      <RegisterModal 
        isOpen={showRegisterModal}
        onClose={closeModals}
        onRegisterSuccess={handleRegisterSuccess}
      />
    </div>
  );
}
