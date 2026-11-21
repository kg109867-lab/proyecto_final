import { useState } from 'react'
import { apiUrl } from '../api.js'

function AdminPanel({ products, onClose, onAddProduct, onRemoveProduct, persistenceError }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [productError, setProductError] = useState('')
  const [messages, setMessages] = useState([])

  async function logIn(event) {
    event.preventDefault()
    setLoginError('')
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok || !data.token) throw new Error(data.error || 'No se pudo iniciar sesión.')

      const messagesResponse = await fetch(apiUrl('/api/admin/messages'), {
        headers: { Authorization: `Bearer ${data.token}` },
      })
      const savedMessages = await messagesResponse.json()
      if (!messagesResponse.ok) {
        await fetch(apiUrl('/api/auth/logout'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.token}` },
        })
        throw new Error(savedMessages.error || 'No se pudieron cargar las consultas.')
      }

      setMessages(savedMessages)
      setAccessToken(data.token)
      setIsAuthenticated(true)
    } catch (error) {
      setLoginError(error.message || 'No se pudo conectar con el servidor.')
    }
  }

  async function addProduct(event) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = formData.get('product-name').trim()
    const category = formData.get('product-category')
    const price = Number(formData.get('product-price'))
    const description = formData.get('product-description').trim()

    if (!name || !description || !Number.isFinite(price) || price <= 0) {
      setProductError('Completa todos los campos y usa un precio mayor que cero.')
      return
    }

    try {
      await onAddProduct({ name, category, price, description }, accessToken)
      setProductError('')
      form.reset()
    } catch (error) {
      setProductError(error.message || 'No se pudo guardar el producto.')
    }
  }

  async function removeProduct(id) {
    try {
      await onRemoveProduct(id, accessToken)
    } catch (error) {
      setProductError(error.message || 'No se pudo eliminar el producto.')
    }
  }

  async function logOut() {
    try {
      const response = await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error('No se pudo cerrar la sesión.')
      setIsAuthenticated(false)
      setAccessToken('')
      setUsername('')
      setPassword('')
    } catch (error) {
      setLoginError(error.message)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="dialog admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-title">
        <button className="dialog__close" onClick={onClose} aria-label="Cerrar administración">×</button>
        {!isAuthenticated ? (
          <div className="admin-login">
            <span className="eyebrow">Acceso del equipo</span>
            <h2 id="admin-title">Administración</h2>
            <p>Inicia sesión para gestionar el catálogo y revisar las consultas recibidas.</p>
            <form className="admin-form" onSubmit={logIn}>
              <label htmlFor="admin-user">Usuario</label>
              <input id="admin-user" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
              <label htmlFor="admin-password">Contraseña</label>
              <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
              {loginError && <p className="form-message form-message--error" role="alert">{loginError}</p>}
              <button className="button button--primary button--full" type="submit">Entrar al panel <span aria-hidden="true">↗</span></button>
            </form>
            {import.meta.env.DEV && (
              <p className="admin-demo-hint">Solo en desarrollo: usuario <code>admin</code> / contraseña <code>mundo2026</code>.</p>
            )}
          </div>
        ) : (
          <div className="admin-dashboard">
            <span className="eyebrow">Panel privado</span>
            <h2 id="admin-title">¡Hola, equipo fungi!</h2>
            <p className="admin-dashboard__lead">Los cambios del catálogo se guardan en el servidor.</p>
            <button className="remove-button admin-logout" onClick={logOut}>Cerrar sesión</button>
            {persistenceError && <p className="inline-alert" role="alert">{persistenceError}</p>}
            <form className="admin-form admin-form--product" onSubmit={addProduct}>
              <h3>Agregar una experiencia</h3>
              <label htmlFor="product-name">Nombre</label>
              <input id="product-name" name="product-name" required maxLength={80} />
              <label htmlFor="product-category">Categoría</label>
              <select id="product-category" name="product-category">
                <option>Cultivo</option>
                <option>Talleres</option>
              </select>
              <label htmlFor="product-price">Precio (USD)</label>
              <input id="product-price" name="product-price" type="number" min="0.01" step="0.01" required />
              <label htmlFor="product-description">Descripción</label>
              <textarea id="product-description" name="product-description" rows="2" required maxLength={180} />
              {productError && <p className="form-message form-message--error" role="alert">{productError}</p>}
              <button className="button button--primary" type="submit">Agregar al catálogo <span aria-hidden="true">+</span></button>
            </form>
            <div className="admin-products">
              <h3>Productos actuales <span>{products.length}</span></h3>
              <ul>
                {products.map((product) => (
                  <li key={product.id}>
                    <span><strong>{product.name}</strong><small>{product.category}</small></span>
                    <button className="remove-button" onClick={() => removeProduct(product.id)} aria-label={`Eliminar ${product.name}`}>Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="admin-products admin-messages">
              <h3>Consultas recibidas <span>{messages.length}</span></h3>
              {messages.length ? (
                <ul>
                  {messages.map((message) => (
                    <li className="admin-message" key={message.id}>
                      <span>
                        <strong>{message.name} · {message.email}</strong>
                        <small>{new Date(message.createdAt).toLocaleString('es-CO')}</small>
                        <p>{message.message}</p>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-dashboard__lead">Aún no hay consultas.</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default AdminPanel
