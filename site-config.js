// Isi csvUrl dengan URL Google Sheets yang dipublikasikan sebagai CSV.
// Kosong = katalog contoh. Lihat KATALOG.md untuk format dan cara menghubungkan.
window.CETAKIN_CONFIG = Object.freeze({
  whatsappNumber: '6285822801431',
  catalog: {
    apiUrl: './api/catalog?format=csv',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSl6FvbfWefPyzRB6stLU51PSkVi6MoTJseAYPlsjyxGLLrLXKbBjWLMX6LK54DF4a5Psw4exWwsfeG/pub?output=csv',
    demoUrl: './data/products-demo.csv',
    refreshMs: 60000,
    timeoutMs: 12000,
  },
});
