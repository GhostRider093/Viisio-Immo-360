import React, { useState } from 'react'
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
  const currentMeta = pageContent[currentPage]

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
        return <Dashboard setCurrentPage={navigateTo} />
      case 'clients':
        return <Clients focusClientId={pageTarget.clientId} onFocusHandled={clearTarget} />
      case 'properties':
        return <Properties focusPropertyId={pageTarget.propertyId} onFocusHandled={clearTarget} />
      case 'agenda':
        return <Agenda navigateTo={navigateTo} />
      case 'contracts':
        return <Contracts />
      default:
        return <Clients focusClientId={pageTarget.clientId} onFocusHandled={clearTarget} />
    }
  }

  return (
    <div className="app-shell">
      <Header currentPage={currentPage} setCurrentPage={navigateTo} />

      <main className="app-main">
        <section className="hero-panel">
          <div className="hero-copy">
            <p className="hero-eyebrow">{currentMeta.eyebrow}</p>
            <h1 className="hero-title">{currentMeta.title}</h1>
            <p className="hero-description">{currentMeta.description}</p>
          </div>

          <div className="hero-aside">
            <div className="hero-aside-card">
              <p className="hero-aside-kicker">Suite Administrative</p>
              <p className="hero-aside-text">
                Une interface inspiree d&apos;une direction artistique editoriale: papier ivoire, accents or, contrastes nets et hierarchie plus mature.
              </p>
            </div>

            <div className="hero-stats">
              {currentMeta.stats.map((stat) => (
                <div key={stat.label} className="hero-stat">
                  <span className="hero-stat-value">{stat.value}</span>
                  <span className="hero-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
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
