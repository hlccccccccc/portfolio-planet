import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RootLayout from './components/layout/RootLayout'
import Home from './pages/Home'
import MubaApp from './pages/work/MubaApp'
import MubaWebsite from './pages/work/MubaWebsite'
import BrevoOnboarding from './pages/work/BrevoOnboarding'
import BrevoBenchmark from './pages/work/BrevoBenchmark'
import Paper from './pages/work/Paper'
import Portfolio from './pages/work/Portfolio'
import About from './pages/About'
import Career from './pages/Career'
import Playground from './pages/Playground'
import Contact from './pages/Contact'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="work/muba-app" element={<MubaApp />} />
          <Route path="work/muba-website" element={<MubaWebsite />} />
          <Route path="work/brevo-onboarding" element={<BrevoOnboarding />} />
          <Route path="work/brevo-benchmark" element={<BrevoBenchmark />} />
          <Route path="work/paper" element={<Paper />} />
          <Route path="work/portfolio" element={<Portfolio />} />
          <Route path="about" element={<About />} />
          <Route path="career" element={<Career />} />
          <Route path="playground" element={<Playground />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
