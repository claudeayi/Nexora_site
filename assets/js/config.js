<script>
/* --- Config Nexora_site --- */
const NEXORA_DEFAULT_API = 'http://localhost:4000';

export function getAPI() {
  return localStorage.getItem('NEXORA_API') || NEXORA_DEFAULT_API;
}
export function setAPI(v) {
  if (!v || !/^https?:\/\//.test(v)) return;
  localStorage.setItem('NEXORA_API', v);
  const el = document.querySelector('#apiUrl');
  if (el) el.value = v;
}
export function initApiInput() {
  const el = document.querySelector('#apiUrl');
  if (!el) return;
  el.value = getAPI();
  el.addEventListener('change', () => setAPI(el.value.trim()));
}
</script>
