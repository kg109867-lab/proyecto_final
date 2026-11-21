import { useEffect, useMemo, useState } from 'react'
import AdminPanel from './components/AdminPanel.jsx'
import ChatAssistant from './components/ChatAssistant.jsx'
import INITIAL_PRODUCTS from './data/products.js'
import './App.css'

const NAV_ITEMS = [
  { path: '/', label: 'Inicio' },
  { path: '/catalogo', label: 'Catálogo' },
  { path: '/especies', label: 'Especies' },
  { path: '/aprende', label: 'Aprende' },
  { path: '/talleres', label: 'Talleres' },
  { path: '/nosotros', label: 'Nosotros' },
  { path: '/contacto', label: 'Contacto' },
]

const CATALOG_COLLECTIONS = ['Todo', 'Clásicos', 'Especiales']
const formatPrice = (price) => new Intl.NumberFormat('es-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
}).format(price)

function AppLink({ to, onNavigate, children, ...props }) {
  return (
    <a
      href={to}
      {...props}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        onNavigate(to)
      }}
    >
      {children}
    </a>
  )
}

function MushroomMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path d="M7 21.5C7 12.9 13.2 7 21 7s14 5.9 14 14.5H7Z" fill="currentColor" />
      <path d="M17 21.5h8v11a4 4 0 0 1-8 0v-11Z" fill="currentColor" opacity=".65" />
      <path d="M4.5 21.5h33M12 16l2 1m5-5v2m8 0-1.5 2m4.5 2 2-1" stroke="var(--cream)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ProductCard({ product, onAdd }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className={`product-card product-card--${product.tone || 'sage'}`}>
      <div className="product-card__image">
        <span className="product-card__label">{product.label || product.category}</span>
        {product.image && (
          <img
            src={product.image}
            alt={product.imageAlt || product.name}
            loading="lazy"
            onError={(event) => event.currentTarget.classList.add('is-unavailable')}
          />
        )}
        {!product.image && <span className="product-card__fallback" aria-hidden="true">{product.icon || '🍄'}</span>}
      </div>
      <div className="product-card__body">
        <span className="eyebrow">{product.scientificName || product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        {product.packSize && <span className="product-card__size">{product.packSize}</span>}
        <div className="product-card__actions">
          <button
            className="product-card__details"
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? 'Ocultar detalles' : 'Conocer más'}
          </button>
          <strong>{formatPrice(product.price)}</strong>
        </div>
        {isExpanded && (
          <div className="product-card__details-panel">
            {product.details && <p>{product.details}</p>}
            {product.flavor && <p><strong>Sabor:</strong> {product.flavor}</p>}
            {product.uses && <p><strong>En la cocina:</strong> {product.uses}</p>}
          </div>
        )}
        <div className="product-card__bottom">
          <small>Precio por paquete</small>
          <button className="button button--small button--outline" type="button" onClick={() => onAdd(product)}>
            Agregar a la cesta <span aria-hidden="true">+</span>
          </button>
        </div>
        {product.photoSource && (
          <p className="product-card__credit">
            Foto: <a href={product.photoSource} target="_blank" rel="noreferrer">{product.photoCredit}</a>
            {' · '}
            <a href={product.photoLicenseUrl} target="_blank" rel="noreferrer">{product.photoLicense}</a>
          </p>
        )}
      </div>
    </article>
  )
}

function SectionHeading({ eyebrow, title, description, light = false, level = 1 }) {
  const Heading = level === 1 ? 'h1' : 'h2'
  return (
    <div className={`section-heading${light ? ' section-heading--light' : ''}`}>
      <div>
        <span className={`eyebrow${light ? ' eyebrow--light' : ''}`}>{eyebrow}</span>
        <Heading>{title}</Heading>
      </div>
      {description && <p>{description}</p>}
    </div>
  )
}

function HomePage({ products, onAdd, onNavigate }) {
  return (
    <>
      <section className="hero section-wrap">
        <div className="hero__copy">
          <span className="eyebrow eyebrow--leaf"><span>✳</span> Un mundo que crece bajo nuestros pies</span>
          <h1>Conecta con la naturaleza, <em>cultiva lo extraordinario.</em></h1>
          <p>Un espacio para descubrir los hongos comestibles, aprender de la micología y disfrutar cada paso del camino.</p>
          <div className="hero__actions">
            <AppLink className="button button--primary" to="/catalogo" onNavigate={onNavigate}>Explorar el catálogo <span aria-hidden="true">↗</span></AppLink>
            <AppLink className="text-link" to="/aprende" onNavigate={onNavigate}>Conoce el mundo fungi <span aria-hidden="true">→</span></AppLink>
          </div>
          <div className="hero__note">
            <span className="hero__avatars" aria-hidden="true"><span>🍄</span><span>🌱</span><span>✳</span></span>
            <span>Curiosidad natural.<br /><strong>Aprendizaje con cuidado.</strong></span>
          </div>
        </div>
        <div className="hero-art">
          {products[1]?.image && <img src={products[1].image} alt={products[1].imageAlt || 'Setas ostra frescas'} fetchPriority="high" />}
          <span className="hero-art__label">Cultiva curiosidad</span>
          <span className="hero-art__caption">Pequeños mundos, grandes aprendizajes.</span>
        </div>
        <span className="hero__side-note">MICRO · MUNDO · MARAVILLA</span>
      </section>

      <section className="promise-strip" aria-label="Nuestra propuesta">
        <div><span className="promise-strip__icon">01</span><span><strong>Aprende haciendo</strong><small>Experiencias para principiantes</small></span></div>
        <div><span className="promise-strip__icon">02</span><span><strong>Hongos comestibles</strong><small>Una mirada cercana y responsable</small></span></div>
        <div><span className="promise-strip__icon">03</span><span><strong>Crece en comunidad</strong><small>Curiosidad que se comparte</small></span></div>
      </section>

      <section className="section-wrap section-pad">
        <SectionHeading
          level={2}
          eyebrow="Una primera exploración"
          title={<>Un poquito de <em>mundo fungi</em> para ti.</>}
          description="Conoce algunas de nuestras variedades comestibles favoritas."
        />
        <div className="product-grid">
          {products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}
        </div>
        <AppLink className="button button--outline home-catalog-link" to="/catalogo" onNavigate={onNavigate}>Ver las diez especies <span aria-hidden="true">↗</span></AppLink>
      </section>
      <section className="home-guide">
        <div className="section-wrap home-guide__inner">
          <span className="eyebrow eyebrow--light">Información antes que promesas</span>
          <h2>La curiosidad también necesita <em>cuidado.</em></h2>
          <p>Consulta nuestra guía educativa con fuentes fiables, límites claros y orientación para buscar ayuda profesional.</p>
          <AppLink className="button button--light" to="/aprende" onNavigate={onNavigate}>Leer la guía responsable <span aria-hidden="true">↗</span></AppLink>
        </div>
      </section>
    </>
  )
}

function CatalogPage({ products, onAdd }) {
  const [collection, setCollection] = useState('Todo')
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('featured')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState([])

  const visibleProducts = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase('es')
    const filtered = products.filter((product) => {
      const matchesCollection = collection === 'Todo' || product.collection === collection
      const matchesSearch = !searchTerm || [
        product.name,
        product.scientificName,
        product.description,
        product.flavor,
      ].some((value) => value?.toLocaleLowerCase('es').includes(searchTerm))
      const matchesFavorite = !favoritesOnly || favorites.includes(product.id)
      return matchesCollection && matchesSearch && matchesFavorite
    })

    if (sortOrder === 'price-asc') return filtered.sort((a, b) => a.price - b.price)
    if (sortOrder === 'price-desc') return filtered.sort((a, b) => b.price - a.price)
    return filtered
  }, [collection, favorites, favoritesOnly, products, query, sortOrder])

  return (
    <section className="section-wrap section-pad page-section">
      <SectionHeading
        eyebrow="Hongos comestibles · precios en dólares"
        title={<>Encuentra tu próxima <em>variedad favorita.</em></>}
        description="Explora diez especies comestibles, conoce sus características y agrega tus favoritas a la cesta."
      />
      <div className="catalog__toolbar catalog__toolbar--expanded">
        <div className="filter-list" role="group" aria-label="Filtrar por colección">
          {CATALOG_COLLECTIONS.map((item) => (
            <button className={`filter-chip${collection === item ? ' is-active' : ''}`} key={item} type="button" onClick={() => setCollection(item)} aria-pressed={collection === item}>{item}</button>
          ))}
          <button className={`filter-chip${favoritesOnly ? ' is-active' : ''}`} type="button" onClick={() => setFavoritesOnly((active) => !active)} aria-pressed={favoritesOnly}>♡ Favoritos</button>
        </div>
        <span className="catalog__count">{visibleProducts.length} {visibleProducts.length === 1 ? 'hongo' : 'hongos'}</span>
      </div>
      <div className="catalog__controls">
        <label className="catalog__search">
          <span>Buscar por nombre, especie o sabor</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. shiitake" />
        </label>
        <label className="catalog__sort">
          <span>Ordenar</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="featured">Destacados</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
          </select>
        </label>
      </div>
      {visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <div className="product-card-wrapper" key={product.id}>
              <button
                className={`favorite-button${favorites.includes(product.id) ? ' is-favorite' : ''}`}
                type="button"
                aria-label={`${favorites.includes(product.id) ? 'Quitar de' : 'Añadir a'} favoritos: ${product.name}`}
                aria-pressed={favorites.includes(product.id)}
                onClick={() => setFavorites((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id])}
              >
                {favorites.includes(product.id) ? '♥' : '♡'}
              </button>
              <ProductCard product={product} onAdd={onAdd} />
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">No encontramos hongos con esos filtros. Prueba otra búsqueda o colección.</p>
      )}
      <p className="catalog__footnote">Los precios están expresados en USD por paquete y son ilustrativos. Confirma disponibilidad, presentación y entrega antes de comprar. Los productos no contienen psilocibina.</p>
    </section>
  )
}

function SpeciesPage({ products }) {
  return (
    <section className="section-wrap section-pad page-section">
      <SectionHeading
        eyebrow="Guía de variedades"
        title={<>Diez especies para <em>conocer y saborear.</em></>}
        description="Una guía introductoria de los hongos comestibles del catálogo. La identificación de setas silvestres requiere conocimiento especializado."
      />
      <div className="species-grid">
        {products.filter((product) => product.category === 'Cultivo').map((product) => (
          <article className="species-card" key={product.id}>
            {product.image && <img src={product.image} alt={product.imageAlt || product.name} loading="lazy" />}
            <div>
              <span className="eyebrow">{product.scientificName}</span>
              <h2>{product.name}</h2>
              <p>{product.details || product.description}</p>
              {product.flavor && <p><strong>Perfil:</strong> {product.flavor}</p>}
              {product.photoSource && <p className="species-card__credit">Foto: <a href={product.photoSource} target="_blank" rel="noreferrer">{product.photoCredit}</a> · <a href={product.photoLicenseUrl} target="_blank" rel="noreferrer">{product.photoLicense}</a></p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function LearnPage() {
  return (
    <>
      <section className="learn-section page-learn">
        <div className="section-wrap section-pad">
          <SectionHeading
            light
            eyebrow="Información antes que promesas"
            title={<>La curiosidad también necesita <em>cuidado.</em></>}
            description="Información general sobre psilocibina, límites de la evidencia y fuentes para seguir aprendiendo."
          />
          <div className="learn-grid">
            <article className="learn-card learn-card--main">
              <span className="learn-card__number">01 / CONTEXTO</span>
              <div className="learn-card__icon" aria-hidden="true">✳</div>
              <h2>¿Qué sabemos sobre la psilocibina?</h2>
              <p>La psilocibina se estudia en investigaciones clínicas para comprender posibles usos terapéuticos. Esos estudios se realizan en condiciones controladas; sus resultados no convierten el consumo por cuenta propia en un tratamiento seguro ni aprobado.</p>
              <a href="https://www.nccih.nih.gov/health/psilocybin-for-mental-health-and-addiction-what-you-need-to-know" target="_blank" rel="noreferrer">Leer la guía del NCCIH <span aria-hidden="true">↗</span></a>
            </article>
            <article className="learn-card">
              <span className="learn-card__number">02 / SEGURIDAD</span>
              <div className="learn-card__icon learn-card__icon--warm" aria-hidden="true">!</div>
              <h2>Riesgos y límites</h2>
              <p>Los efectos pueden ser impredecibles. Se han reportado ansiedad, confusión, náuseas, cambios en la presión arterial y otros efectos adversos. La situación legal varía según el lugar.</p>
              <a href="https://nida.nih.gov/research-topics/psychedelic-dissociative-drugs" target="_blank" rel="noreferrer">Consultar información de NIDA <span aria-hidden="true">↗</span></a>
            </article>
            <article className="learn-card learn-card--note">
              <span className="learn-card__number">03 / ACOMPAÑAMIENTO</span>
              <div className="learn-card__icon learn-card__icon--leaf" aria-hidden="true">♡</div>
              <h2>Tu bienestar importa</h2>
              <p>Si atraviesas dificultades emocionales, habla con un profesional de salud mental. No inicies, suspendas ni cambies tratamientos por información de esta página.</p>
              <p className="learn-card__urgent">Si hay peligro inmediato, busca los servicios de emergencia de tu localidad.</p>
            </article>
          </div>
          <p className="learn-disclaimer">Mundo Fungi no vende ni recomienda psilocibina. Este contenido es educativo, no es diagnóstico ni consejo médico; consulta fuentes oficiales y un profesional cualificado.</p>
        </div>
      </section>
      <section className="assistant-section section-wrap section-pad" aria-labelledby="assistant-title">
        <div className="assistant-section__intro">
          <span className="eyebrow">Una guía para empezar</span>
          <h2 id="assistant-title">¿Tienes una pregunta <em>fungi?</em></h2>
          <p>Explora respuestas introductorias sobre micología, nuestros hongos comestibles y el contenido educativo.</p>
        </div>
        <ChatAssistant />
      </section>
    </>
  )
}

function WorkshopsPage({ onNavigate }) {
  return (
    <section className="section-wrap section-pad page-section">
      <SectionHeading
        eyebrow="Aprender haciendo"
        title={<>Un espacio para cultivar <em>curiosidad.</em></>}
        description="Experiencias introductorias para conocer el reino fungi y aprender prácticas responsables."
      />
      <div className="workshop-grid">
        <article className="workshop-card"><span className="workshop-card__icon">✳</span><span className="eyebrow">Nivel inicial · 90 min</span><h2>Introducción al reino fungi</h2><p>Conceptos básicos de micología, diversidad de hongos y su relación con los ecosistemas.</p><AppLink className="text-link" to="/contacto" onNavigate={onNavigate}>Consultar próximas fechas <span aria-hidden="true">↗</span></AppLink></article>
        <article className="workshop-card"><span className="workshop-card__icon">🌱</span><span className="eyebrow">Actividad guiada · 2 h</span><h2>Conoce el cultivo de setas</h2><p>Un acercamiento educativo al ciclo de cultivo de especies comestibles y a sus cuidados cotidianos.</p><AppLink className="text-link" to="/contacto" onNavigate={onNavigate}>Consultar disponibilidad <span aria-hidden="true">↗</span></AppLink></article>
        <article className="workshop-card workshop-card--note"><span className="workshop-card__icon">♡</span><span className="eyebrow">Aprendizaje responsable</span><h2>Ciencia, salud y evidencia</h2><p>Aprende a distinguir investigación clínica, información general y consejos no verificados.</p><AppLink className="text-link" to="/aprende" onNavigate={onNavigate}>Visitar la guía educativa <span aria-hidden="true">↗</span></AppLink></article>
      </div>
      <p className="catalog__footnote">Los talleres se encuentran en planificación; escribe al equipo para consultar fechas, precios y modalidad. No se ofrecen sesiones de consumo ni tratamientos.</p>
    </section>
  )
}

function AboutPage({ onNavigate }) {
  return (
    <section className="about-section page-about">
      <div className="section-wrap about-section__inner">
        <div className="about-art" aria-hidden="true"><span className="about-art__ring" /><span className="about-art__symbol">m.</span><span className="about-art__leaf about-art__leaf--a">❧</span><span className="about-art__leaf about-art__leaf--b">❧</span></div>
        <div className="about-copy">
          <span className="eyebrow">Nuestra esencia</span>
          <h1>Más que hongos.<br /><em>Un cambio de perspectiva.</em></h1>
          <p>Mundo Fungi nace para acercar la belleza y diversidad del reino fungi a la vida cotidiana. Compartimos experiencias alrededor de especies comestibles, aprendizaje y cuidado por los ecosistemas.</p>
          <p>Creemos en la curiosidad informada, en fuentes confiables y en hablar con claridad sobre los límites de la evidencia científica.</p>
          <AppLink className="text-link" to="/contacto" onNavigate={onNavigate}>Conversemos <span aria-hidden="true">↗</span></AppLink>
        </div>
      </div>
    </section>
  )
}

function ContactPage({ onSubmit, contactMessage, setContactMessage, contactError, contactStatus }) {
  return (
    <section className="contact-section section-wrap section-pad page-section">
      <div className="contact-copy">
        <span className="eyebrow">Estamos para conversar</span>
        <h1>¿Te ayudamos a encontrar tu <em>próximo comienzo?</em></h1>
        <p>Cuéntanos qué te gustaría aprender. El mensaje queda en el panel del equipo y se envía a kg109867@gmail.com.</p>
        <div className="contact-aside"><span className="contact-aside__icon">✳</span><span>Un espacio amable para tus preguntas.<br /><strong>Sin prisa, con curiosidad.</strong></span></div>
      </div>
      <form className="contact-form" onSubmit={onSubmit}>
        <label htmlFor="contact-name">Tu nombre</label>
        <input id="contact-name" name="name" autoComplete="name" placeholder="¿Cómo te llamas?" required maxLength={100} />
        <label htmlFor="contact-email">Tu correo</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" placeholder="hola@ejemplo.com" required maxLength={160} />
        <label htmlFor="contact-message">¿Qué tienes en mente?</label>
        <textarea id="contact-message" name="message" rows="4" placeholder="Escribe tu mensaje..." required maxLength={1000} value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} />
        <button className="button button--primary" type="submit">Enviar mensaje <span aria-hidden="true">↗</span></button>
        <p className="form-hint">Tus datos se usan para responder a esta consulta y se almacenan en el servidor de este proyecto.</p>
        {contactError && <p className="form-message form-message--error" role="alert">{contactError}</p>}
        {contactStatus && <p className="form-message" role="status">{contactStatus}</p>}
      </form>
    </section>
  )
}

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [cart, setCart] = useState([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isAdminOpen, setIsAdminOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [persistenceError, setPersistenceError] = useState('')
  const [contactStatus, setContactStatus] = useState('')
  const [contactError, setContactError] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const route = NAV_ITEMS.some((item) => item.path === pathname) ? pathname : '/'

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let isCurrent = true
    fetch('/api/products')
      .then(async (response) => {
        if (!response.ok) throw new Error('El catálogo no respondió correctamente.')
        const data = await response.json()
        if (!Array.isArray(data)) throw new TypeError('La respuesta del catálogo no es válida.')
        if (isCurrent) {
          setProducts(data)
          setPersistenceError('')
        }
      })
      .catch((error) => {
        console.error('No se pudo cargar el catálogo desde el servidor.', error)
        if (isCurrent) setPersistenceError('No se pudo conectar con el servidor. Se muestra el catálogo de ejemplo.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [])

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const formattedCartTotal = formatPrice(cartTotal)

  function navigate(to) {
    if (window.location.pathname !== to) window.history.pushState({}, '', to)
    setPathname(to)
    setIsMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function addProduct(product) {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el producto.')
      setProducts((currentProducts) => [...currentProducts, data])
      setPersistenceError('')
    } catch (error) {
      console.error('No se pudo guardar el producto.', error)
      setPersistenceError(error.message)
      throw error
    }
  }

  async function removeProduct(id) {
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el producto.')
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== id))
      setPersistenceError('')
    } catch (error) {
      console.error('No se pudo eliminar el producto.', error)
      setPersistenceError(error.message)
      throw error
    }
  }

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id)
      if (existing) return currentCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      return [...currentCart, { ...product, quantity: 1 }]
    })
  }

  async function submitContact(event) {
    event.preventDefault()
    setContactError('')
    setContactStatus('')
    const formData = new FormData(event.currentTarget)
    const form = event.currentTarget
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.get('name'), email: formData.get('email'), message: formData.get('message') }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar tu mensaje.')
      setContactStatus(data.message)
      setContactMessage('')
      form.reset()
    } catch (error) {
      console.error('No se pudo enviar el formulario de contacto.', error)
      setContactError(error.message || 'No se pudo conectar con el servidor. Intenta de nuevo.')
    }
  }

  let page
  if (route === '/catalogo') page = <CatalogPage products={products} onAdd={addToCart} />
  else if (route === '/especies') page = <SpeciesPage products={products} />
  else if (route === '/aprende') page = <LearnPage />
  else if (route === '/talleres') page = <WorkshopsPage onNavigate={navigate} />
  else if (route === '/nosotros') page = <AboutPage onNavigate={navigate} />
  else if (route === '/contacto') page = <ContactPage onSubmit={submitContact} contactMessage={contactMessage} setContactMessage={setContactMessage} contactError={contactError} contactStatus={contactStatus} />
  else page = <HomePage products={products} onAdd={addToCart} onNavigate={navigate} />

  return (
    <div className="site-shell">
      <div className="announcement">
        <span className="announcement__dot" />
        Hongos comestibles, cultura y curiosidad.
        <AppLink to="/aprende" onNavigate={navigate}>Conoce nuestra guía responsable <span aria-hidden="true">↗</span></AppLink>
      </div>
      <header className="site-header">
        <AppLink className="brand" to="/" onNavigate={navigate} aria-label="Mundo Fungi, inicio">
          <span className="brand__mark"><MushroomMark /></span>
          <span className="brand__name">mundo<span>fungi</span></span>
        </AppLink>
        <button className="menu-toggle" type="button" aria-expanded={isMenuOpen} aria-controls="main-nav" onClick={() => setIsMenuOpen((open) => !open)}>
          <span className="visually-hidden">{isMenuOpen ? 'Cerrar' : 'Abrir'} navegación</span><span aria-hidden="true">{isMenuOpen ? '×' : '☰'}</span>
        </button>
        <nav className={`main-nav${isMenuOpen ? ' is-open' : ''}`} id="main-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <AppLink key={item.path} to={item.path} onNavigate={navigate} aria-current={route === item.path ? 'page' : undefined}>{item.label}</AppLink>
          ))}
        </nav>
        <button className="cart-button" type="button" onClick={() => setIsCartOpen(true)} aria-label={`Abrir cesta, ${cartCount} productos`}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1.4" fill="currentColor" /><circle cx="18" cy="20" r="1.4" fill="currentColor" /></svg>
          <span>Mi cesta</span><span className="cart-button__count">{cartCount}</span>
        </button>
      </header>
      <main>
        {isLoading && <p className="loading-banner" role="status">Cargando catálogo…</p>}
        {persistenceError && <p className="inline-alert section-wrap" role="alert">{persistenceError}</p>}
        {page}
      </main>
      <footer className="site-footer">
        <div className="site-footer__main section-wrap">
          <AppLink className="brand brand--footer" to="/" onNavigate={navigate}><span className="brand__mark"><MushroomMark /></span><span className="brand__name">mundo<span>fungi</span></span></AppLink>
          <p>Un mundo por descubrir, una seta a la vez.</p>
          <nav aria-label="Navegación del pie de página">
            <AppLink to="/catalogo" onNavigate={navigate}>Catálogo</AppLink>
            <AppLink to="/aprende" onNavigate={navigate}>Guía responsable</AppLink>
            <AppLink to="/contacto" onNavigate={navigate}>Contacto</AppLink>
            <button className="footer-admin" type="button" onClick={() => setIsAdminOpen(true)}>Administración</button>
          </nav>
        </div>
        <div className="site-footer__bottom section-wrap">
          <span>© 2026 Mundo Fungi. Cultivado con curiosidad.</span>
          <span>Contenido educativo. No sustituye la orientación de profesionales de salud.</span>
        </div>
      </footer>

      {isCartOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsCartOpen(false) }}>
          <section className="dialog cart-dialog" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <button className="dialog__close" type="button" onClick={() => setIsCartOpen(false)} aria-label="Cerrar cesta">×</button>
            <span className="eyebrow">Tu selección</span>
            <h2 id="cart-title">Mi cesta <span className="dialog__count">{cartCount}</span></h2>
            {cart.length ? (
              <>
                <ul className="cart-list">
                  {cart.map((item) => (
                    <li key={item.id}>
                      <span className="cart-list__icon">{item.icon || '🍄'}</span>
                      <span className="cart-list__name"><strong>{item.name}</strong><small>Cantidad: {item.quantity}</small></span>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="cart-total"><span>Total estimado</span><strong>{formattedCartTotal}</strong></div>
                <button className="button button--primary button--full" type="button" onClick={() => {
                  setContactMessage(`Hola, quisiera consultar disponibilidad para:\n${cart.map((item) => `${item.name} x ${item.quantity}`).join('\n')}\n\nTotal estimado: ${formattedCartTotal}`)
                  setIsCartOpen(false)
                  navigate('/contacto')
                }}>Solicitar pedido <span aria-hidden="true">↗</span></button>
              </>
            ) : (
              <div className="cart-empty"><span aria-hidden="true">🍄</span><p>Tu cesta aún está creciendo.</p><button className="button button--outline" type="button" onClick={() => { setIsCartOpen(false); navigate('/catalogo') }}>Descubrir el catálogo</button></div>
            )}
            <p className="dialog__note">La cesta es una demostración local. El pedido se prepara por correo y requiere confirmar disponibilidad y entrega.</p>
          </section>
        </div>
      )}
      {isAdminOpen && (
        <AdminPanel products={products} onClose={() => setIsAdminOpen(false)} onAddProduct={addProduct} onRemoveProduct={removeProduct} persistenceError={persistenceError} />
      )}
    </div>
  )
}

export default App
