(function (root) {
  'use strict';
  const number = root.CETAKIN_CONFIG?.whatsappNumber || '6285822801431';
  const messages = {
    custom: 'Halo Kak, saya ingin berdiskusi tentang jasa cetak 3D custom di Cetakin.\n\nKebutuhan/produk: \nUkuran perkiraan: \nJumlah: \nFile desain/referensi: \nTarget waktu selesai: \n\nMohon arahan mengenai bahan, proses, dan estimasi biayanya. Terima kasih.',
    idea: 'Halo Kak, saya ingin berkonsultasi tentang ide produk yang ingin saya cetak di Cetakin.\n\nIde/kebutuhan saya: \n\nMohon bantuannya untuk membahas bentuk dan proses yang sesuai. Terima kasih.',
    general: 'Halo Kak, saya ingin mendapatkan informasi tentang produk dan layanan Cetakin. Mohon bantuannya. Terima kasih.',
  };
  function url(message) { return `https://wa.me/${number}?text=${encodeURIComponent(message)}`; }
  root.CetakinContact = { url, messages };
  document.querySelectorAll('[data-wa-context]').forEach((link) => {
    link.href = url(messages[link.dataset.waContext] || messages.general);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });
})(window);
