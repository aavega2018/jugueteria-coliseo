/* =========================================================
   JUGUETERÍA COLISEO - DATOS EDITABLES
   ---------------------------------------------------------
   Puedes editar este archivo directamente o usar admin.html.
   ========================================================= */

const SITE_DATA = {
  negocio: {
    nombre: "Juguetería Coliseo",
    lema: "La felicidad también se juega",
    direccion: "Escribe aquí la dirección del negocio",
    telefono1: "+53 5 1234 5678",
    telefono2: "+53 5 8765 4321",
    whatsapp: "53512345678",
    horario: "Lunes a Sábado: 8:00 a.m. – 6:00 p.m.",
    facebook: "",
    instagram: "",
    mapa: "https://www.google.com/maps"
  },

  categorias: [
    "Peluches",
    "Autos y Vehículos",
    "Juegos de Construcción",
    "Juegos de Mesa",
    "Rompecabezas",
    "Muñecas",
    "Juguetes Educativos"
  ],

  productos: [
    {
      id: "oso-peluche",
      nombre: "Oso de Peluche",
      precio: 1250,
      imagen: "img/oso.svg",
      categoria: "Peluches",
      descripcion: "Suave y perfecto para regalar.",
      activo: true
    },
    {
      id: "carro-deportivo",
      nombre: "Carro Deportivo",
      precio: 850,
      imagen: "img/carro.svg",
      categoria: "Autos y Vehículos",
      descripcion: "Diversión para pequeños pilotos.",
      activo: true
    },
    {
      id: "set-construccion",
      nombre: "Set de Construcción",
      precio: 1480,
      imagen: "img/construccion.svg",
      categoria: "Juegos de Construcción",
      descripcion: "Construye, imagina y aprende.",
      activo: true
    },
    {
      id: "muneca-moda",
      nombre: "Muñeca de Moda",
      precio: 1060,
      imagen: "img/muneca.svg",
      categoria: "Muñecas",
      descripcion: "Un regalo especial para jugar.",
      activo: true
    }
  ]
};
