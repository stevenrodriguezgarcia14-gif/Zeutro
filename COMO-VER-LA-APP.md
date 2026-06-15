# Cómo ver y correr Zentro (guía para empezar)

## ¿Por qué no es como un HTML con Live Server?

Un archivo `.html` lo abre el navegador directamente. **Zentro no es un solo archivo**: es una
aplicación que necesita un **servidor** corriendo en tu computadora que arma las páginas en vivo
(igual que Live Server, pero más potente). Por eso, para verla:

1. **Enciendes el servidor** (una vez, mientras trabajas).
2. **Abres el navegador** en una dirección local.

## La forma más fácil (doble clic)

1. En la carpeta `zentro`, haz **doble clic en `INICIAR-ZENTRO.bat`**.
2. Se abre una ventana negra. Espera a ver la palabra **`Ready`**.
3. Abre tu navegador (Chrome, Edge…) en:  **http://localhost:3000**
4. Para **detener** la app: cierra esa ventana negra.

> La primera vez puede tardar unos segundos. Mientras la ventana negra esté abierta, la app vive.

## Si usas Visual Studio Code (el de Live Server)

1. Abre la carpeta `zentro\app` en VS Code (Archivo → Abrir carpeta).
2. Menú **Terminal → Nueva terminal**.
3. Escribe:  `npm run dev`  y pulsa Enter.
4. Abre el navegador en **http://localhost:3000**.
5. Para detener: en la terminal pulsa `Ctrl + C`.

## ¿Qué es "localhost:3000"?

- `localhost` = tu propia computadora.
- `3000` = la "puerta" (puerto) donde Zentro está escuchando.
- Solo tú puedes verlo desde tu PC. Cuando lo publiquemos (GitHub + Vercel), tendrá una
  dirección de internet real para todo el mundo.

## Primeros pasos dentro de la app

1. **Crear cuenta** (correo + contraseña).
2. **Crear tu negocio** (nombre, país, moneda).
3. Entra al **Dashboard** y da de alta **Clientes** y **Productos**.
