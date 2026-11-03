# ¿Más alcohol, más muertes en la vía?

Presentación web del proyecto final de **Visualización y Data Storytelling** (Universidad EIA): consumo de alcohol y mortalidad por siniestros viales en 183 países, 2000–2023, con datos de la OMS (Global Health Observatory: indicador RS_198 y sistema GISAH).

La presentación sigue el marco *Why / What / How* de Munzner y cierra con conclusiones. Se recorre con scroll o con las flechas del teclado, sobre escenarios 3D con personajes animados.

## Estructura

```
index.html   contenido de las diapositivas
styles.css   estilos y tipografías
main.js      scroll, navegación y revelados (GSAP)
world.js     escenarios 3D y animaciones (Three.js)
models/      escenarios y personajes en GLB
bi/          gráficas y capturas del tablero de Power BI
fonts/       tipografías
vercel.json  caché y URLs limpias para Vercel
```

Es un sitio estático: no hay paso de compilación. Las librerías (Three.js, GSAP, Draco) se cargan desde CDN.

## Ejecutar en local

Los modelos 3D no cargan abriendo `index.html` directamente; hay que servir la carpeta:

```bash
python -m http.server 8766
```

y abrir `http://localhost:8766`. Con `?debug` en la dirección se activa una cámara libre.

## Despliegue en Vercel

1. Importar el repositorio en Vercel.
2. *Framework Preset*: **Other**. Sin *Build Command* ni *Install Command*.
3. *Output Directory*: la raíz del repositorio (vacío / `.`).

## Créditos y licencias

- Datos: Organización Mundial de la Salud, Global Health Observatory.
- Personajes y escenarios: tomados de *The Simpsons: Hit & Run* (Radical Entertainment). Propiedad de sus titulares; uso académico.
- Tipografías: [Akbar](http://www.wobblymusic.com/groening/akbar.html) (Jon Bernhardt) y Simpsonfont (Sharkshock, versión demo; ver `fonts/Simpsonfont-readme.txt`).
