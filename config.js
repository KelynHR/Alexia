// Edita estos valores antes de activar la captación comercial.
window.LAGO_CONFIG = {
  // Número con código de país, sin +, espacios ni símbolos.
  // El sitio actual publica el teléfono 442 263 3376, pero no confirma WhatsApp.
  // Coloca aquí el WhatsApp comercial autorizado; no se envía nada automáticamente.
  whatsappNumber: '+524422633376',
  whatsappMessage: 'Hola, me interesa conocer las residencias Lago Sur. ¿Podrían compartirme información y disponibilidad?',
  // El servidor incluido recibe los registros en esta ruta.
  // Para otro CRM, sustituye el endpoint y adapta el formato de la respuesta.
  formEndpoint: '/api/leads'
};

// Experiencia comercial. No publiques descuentos sin condiciones aprobadas.
window.LAGO_CONFIG.christmas = {
  enabled: true,
  from: '2026-11-01',
  until: '2026-12-31',
  showEveryVisit: false // false: una vez por sesión; true: cada carga durante la campaña.
};
// Pega la URL de inserción (embed) de Matterport/Kuula u otro proveedor autorizado.
// Si solo tienes una grabación, coloca una ruta .mp4 en videoUrl.
// Sin material real se muestra la galería interior, sin presentarla como un 360°.
window.LAGO_CONFIG.tour = {
  embedUrl: '',
  videoUrl: '',
  poster: 'assets/interior3.jpg'
};
