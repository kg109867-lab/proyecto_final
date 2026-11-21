import { useState } from 'react'

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: '¡Hola! Soy la guía fungi de Mundo Fungi. Puedo compartir información general sobre micología, nuestros kits comestibles y las fuentes de la sección Aprende. ¿Qué te gustaría saber?',
}

function getReply(question) {
  const normalized = question.toLocaleLowerCase('es')

  if (/suicid|hacerme daño|lastim|no quiero vivir|peligro inmediato/.test(normalized)) {
    return 'Siento que estés pasando por esto. Si estás en peligro inmediato, llama a los servicios de emergencia de tu localidad o ve a urgencias. Si puedes, contacta ahora a alguien de confianza y a un profesional de salud mental. No tienes que afrontar esto a solas.'
  }

  if (/psiloc|microdos|tripa|alucin|ansied|depres|emocion|tratamiento|salud mental/.test(normalized)) {
    return 'La psilocibina sigue en investigación clínica y puede tener riesgos; esta guía no recomienda consumirla ni usarla para tratar síntomas. Para una situación personal, consulta con un profesional de salud. Puedes revisar las fuentes del NCCIH y NIDA en la sección Aprende.'
  }
  if (/kit|cultiv|ostra|shiitake|seta comestible/.test(normalized)) {
    return 'En el catálogo encontrarás kits de hongos comestibles y talleres introductorios. Cada producto explica su propósito educativo; revisa la información del producto y escríbenos si tienes dudas sobre disponibilidad.'
  }
  if (/taller|aprend|micolog|hongo|fungi/.test(normalized)) {
    return 'La micología es el estudio de los hongos y su diversidad. En Mundo Fungi ofrecemos experiencias introductorias centradas en especies comestibles, ecosistemas y aprendizaje responsable. Mira el catálogo o contáctanos para conocer más.'
  }
  if (/legal|ley|permit|pa[ií]s/.test(normalized)) {
    return 'Las normas sobre psilocibina cambian según el país y la región. Esta página no ofrece asesoría legal; verifica la normativa oficial de tu localidad y consulta fuentes gubernamentales.'
  }
  return 'Puedo orientarte sobre nuestros kits comestibles, talleres, micología general o los recursos educativos sobre psilocibina. Para una recomendación médica o legal, consulta a un profesional cualificado.'
}

function ChatAssistant() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [question, setQuestion] = useState('')

  function askQuestion(event) {
    event.preventDefault()
    const text = question.trim()
    if (!text) return

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'user', text },
      { role: 'assistant', text: getReply(text) },
    ])
    setQuestion('')
  }

  return (
    <div className="chat-card">
      <div className="chat-card__header">
        <span className="chat-card__avatar" aria-hidden="true">✳</span>
        <span><strong>Guía Fungi</strong><small>Asistente educativo · respuesta automática</small></span>
        <span className="chat-card__status">En línea</span>
      </div>
      <div className="chat-card__messages" role="log" aria-live="polite" aria-label="Conversación con Guía Fungi">
        {messages.map((message, index) => (
          <p className={`chat-message chat-message--${message.role}`} key={`${message.role}-${index}`}>
            {message.text}
          </p>
        ))}
      </div>
      <form className="chat-card__form" onSubmit={askQuestion}>
        <label className="visually-hidden" htmlFor="chat-question">Escribe una pregunta</label>
        <input
          id="chat-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Escribe tu pregunta..."
          maxLength={300}
        />
        <button className="chat-card__send" type="submit" aria-label="Enviar pregunta" disabled={!question.trim()}>
          <span aria-hidden="true">↑</span>
        </button>
      </form>
      <p className="chat-card__disclaimer">Respuestas predefinidas para orientación general; no es un modelo generativo, asesoría médica ni legal.</p>
    </div>
  )
}

export default ChatAssistant
