import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Properties from './pages/Properties'
import Agenda from './pages/Agenda'
import Contracts from './pages/Contracts'

const pageContent = {
  dashboard: {
    title: 'Tableau De Bord',
    eyebrow: 'Pilotage immobilier',
    description: 'Une page d accueil plus compacte pour basculer rapidement entre les modules et reperer les points du jour sans perdre le ton premium.',
    stats: [
      { label: 'Vue', value: 'Accueil' },
      { label: 'Focus', value: 'Rapide' },
      { label: 'Signal', value: 'Priorites' }
    ]
  },
  clients: {
    title: 'Portefeuille Clients',
    eyebrow: 'Administration immobiliere',
    description: 'Centralise les profils, la relation commerciale et les informations administratives dans une interface sobre et premium.',
    stats: [
      { label: 'Module', value: 'Clients' },
      { label: 'Usage', value: 'Relation' },
      { label: 'Style', value: 'Premium' }
    ]
  },
  properties: {
    title: 'Catalogue Des Biens',
    eyebrow: 'Inventaire agence',
    description: 'Pilote les actifs avec une lecture editoriale des adresses, des surfaces et des valeurs, dans une mise en page haut de gamme.',
    stats: [
      { label: 'Module', value: 'Biens' },
      { label: 'Usage', value: 'Inventaire' },
      { label: 'Style', value: 'Signature' }
    ]
  },
  agenda: {
    title: 'Agenda Des Rendez-Vous',
    eyebrow: 'Coordination interne',
    description: 'Cadence les visites, signatures et points de suivi avec une interface claire, calme et nettement plus executive.',
    stats: [
      { label: 'Module', value: 'Agenda' },
      { label: 'Usage', value: 'Planning' },
      { label: 'Style', value: 'Editorial' }
    ]
  },
  contracts: {
    title: 'Gestion Des Contrats',
    eyebrow: 'Conformite documentaire',
    description: 'Structure la contractualisation avec une presentation plus serieuse, plus lisible et plus premium pour les operations sensibles.',
    stats: [
      { label: 'Module', value: 'Contrats' },
      { label: 'Usage', value: 'Conformite' },
      { label: 'Style', value: 'Luxe' }
    ]
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [pageTarget, setPageTarget] = useState({})
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 820)
  const currentMeta = pageContent[currentPage]
  const mobileHeroTitle = isMobile && currentPage === 'dashboard' ? 'Visio Immo 360' : currentMeta.title
  const mobileHeroDescription = isMobile && currentPage === 'dashboard'
    ? 'Systeme'
    : currentMeta.description

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 820px)')
    const updateViewport = (event) => setIsMobile(event.matches)

    setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', updateViewport)

    return () => mediaQuery.removeEventListener('change', updateViewport)
  }, [])

  const navigateTo = (page, target = {}) => {
    setCurrentPage(page)
    setPageTarget(target)
  }

  const clearTarget = () => {
    setPageTarget({})
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={navigateTo} isMobile={isMobile} />
      case 'clients':
        return <Clients focusClientId={pageTarget.clientId} onFocusHandled={clearTarget} isMobile={isMobile} />
      case 'properties':
        return <Properties focusPropertyId={pageTarget.propertyId} onFocusHandled={clearTarget} isMobile={isMobile} />
      case 'agenda':
        return <Agenda navigateTo={navigateTo} isMobile={isMobile} />
      case 'contracts':
        return <Contracts navigateTo={navigateTo} isMobile={isMobile} />
      default:
        return <Clients focusClientId={pageTarget.clientId} onFocusHandled={clearTarget} isMobile={isMobile} />
    }
  }

  return (
    <div className={`app-shell ${isMobile ? 'is-mobile' : 'is-desktop'}`}>
      <Header currentPage={currentPage} setCurrentPage={navigateTo} isMobile={isMobile} />

      <main className="app-main">
        <section className={`hero-panel ${isMobile ? 'is-mobile' : ''}`}>
          <div className="hero-copy">
            {!isMobile && <p className="hero-eyebrow">{currentMeta.eyebrow}</p>}
            <h1 className="hero-title">{mobileHeroTitle}</h1>
            <p className="hero-description">{mobileHeroDescription}</p>
          </div>
        </section>

        <div className="container page-body">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}

export default App
