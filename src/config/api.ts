/**
 * Configuración centralizada de la API
 * Detecta automáticamente el entorno y configura la URL base correctamente
 */

export const getApiBaseUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Desarrollo local con Vite
  if (hostname === 'localhost' && port === '5173') {
    return 'http://localhost/api';
  }

  // Producción en tacticalopschile.cl
  if (hostname.includes('tacticalopschile.cl')) {
    return `https://tacticalopschile.cl/api`;
  }

  // Fallback: construir URL dinámicamente
  if (port && port !== '80' && port !== '443') {
    return `${protocol}//${hostname}:${port}/api`;
  }

  return `${protocol}//${hostname}/api`;
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper para hacer peticiones a la API con manejo de errores
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
    ...options,
  };

  console.log(`🚀 API Request: ${options.method || 'GET'} ${url}`);
  if (options.body) {
    console.log(`📤 Request body:`, options.body);
  }

  try {
    const response = await fetch(url, defaultOptions);
    const data = await handleApiResponse(response, endpoint);
    console.log(`✅ API Response for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Maneja respuestas de la API y detecta errores
 */
const handleApiResponse = async (response: Response, endpoint: string) => {
  console.log(`Response status for ${endpoint}:`, response.status, response.statusText);

  const responseText = await response.text();
  console.log(`Raw response for ${endpoint}:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));

  if (!responseText.trim()) {
    throw new Error(`El servidor devolvió una respuesta vacía para ${endpoint}`);
  }

  if (responseText.trim().startsWith('<') || responseText.includes('<br />') || responseText.includes('<b>')) {
    console.error(`PHP Error detected in ${endpoint}:`, responseText);
    throw new Error(`Error del servidor PHP en ${endpoint}. Revisa los logs del servidor para más detalles.`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError: any) {
    console.error(`JSON Parse Error for ${endpoint}:`, parseError);
    console.error(`Response text:`, responseText);
    throw new Error(`Respuesta inválida del servidor para ${endpoint}: ${parseError.message}`);
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `Error HTTP: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
};
