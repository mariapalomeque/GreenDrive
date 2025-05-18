document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const form = e.target;
  const data = new FormData(form);

  document.getElementById("msg").innerText = "Enviando...";

  try {
    const res = await fetch("http://13.50.166.206:8000/contacto", {

      method: "POST",
      body: data
    });
    const json = await res.json();

    if (json.ok) {
      document.getElementById("msg").innerText = "¡Mensaje enviado correctamente!";
      form.reset();
    } else {
      document.getElementById("msg").innerText = "Hubo un error al enviar el mensaje.";
    }
  } catch (err) {
    document.getElementById("msg").innerText = "Hubo un error al enviar el mensaje.";
  }
});


 document.querySelectorAll('.support-tab').forEach((tab, index) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.support-tab').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');

        const sections = ['.faq-container', '.contact-container', '.help-center'];
        sections.forEach((section, i) => {
          document.querySelector(section).style.display = (i === index) ? 'grid' : 'none';
        });
      });
    });

    document.querySelectorAll('.faq-question').forEach(item => {
      item.addEventListener('click', () => {
        item.parentNode.classList.toggle('active');
      });
    });

    document.querySelector('.mobile-menu-toggle').addEventListener('click', () => {
      document.querySelector('.nav-container').classList.add('active');
    });

    document.querySelector('.close-menu').addEventListener('click', () => {
      document.querySelector('.nav-container').classList.remove('active');
    });