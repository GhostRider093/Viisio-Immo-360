import React, { useEffect, useState } from 'react'

const Header = ({ currentPage, setCurrentPage, isMobile }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navItems = [
    { key: 'dashboard', label: 'Accueil' },
    { key: 'clients', label: 'Clients' },
    { key: 'properties', label: 'Biens' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'contracts', label: 'Contrats' }
  ]

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [currentPage, isMobile])

  if (isMobile) {
    return (
      <>
        <header className="header mobile-header">
          <div className="container mobile-header-inner">
            <span className="brand-badge brand-badge-wide mobile-brand-badge">Application Immobiliere</span>
            <button
              type="button"
              className={`mobile-menu-trigger ${isMobileMenuOpen ? 'is-open' : ''}`}
              onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            >
              Menu
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <>
            <button
              type="button"
              className="mobile-menu-backdrop"
              aria-label="Fermer le menu"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <nav className="mobile-popup-nav">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`mobile-popup-link ${currentPage === item.key ? 'is-active' : ''}`}
                  onClick={() => setCurrentPage(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </>
        )}
      </>
    )
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand-block">
          <div className="brand-title-wrap">
            <span className="brand-badge brand-badge-wide">Application Immobiliere</span>
          </div>
        </div>

        <nav className="nav">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`nav-link ${currentPage === item.key ? 'is-active' : ''}`}
                  onClick={() => setCurrentPage(item.key)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header
