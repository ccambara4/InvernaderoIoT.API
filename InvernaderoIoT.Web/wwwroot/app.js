/* =========================================================
   CONFIGURACIÓN
========================================================= */

const API_BASE_URL =
    "http://192.168.1.159:5000/api";

const API_URL =
    `${API_BASE_URL}/Lecturas`;

const AUTH_URL =
    `${API_BASE_URL}/Auth/login`;

const CONTROL_URL =
    `${API_BASE_URL}/Control`;

const RIEGOS_URL =
    `${API_BASE_URL}/EventosRiego`;

const API_USUARIOS_URL =
    `${API_BASE_URL}/Usuarios`;


/* =========================================================
   VARIABLES
========================================================= */

let todasLasLecturas = [];

let lecturasFiltradas = [];

let pagina = 1;

let registrosPorPagina = 10;

let intervaloEstado = null;


/* =========================================================
   VARIABLES - HISTORIAL DE RIEGOS
========================================================= */

let todosLosRiegos = [];

let riegosFiltrados = [];

let paginaRiegos = 1;

let registrosRiegosPorPagina = 10;


/* =========================================================
   ELEMENTOS
========================================================= */

const pantallaLogin =
    document.getElementById(
        "pantallaLogin"
    );

const pantallaDashboard =
    document.getElementById(
        "pantallaDashboard"
    );

const formLogin =
    document.getElementById(
        "formLogin"
    );

const usuarioLogin =
    document.getElementById(
        "usuarioLogin"
    );

const passwordLogin =
    document.getElementById(
        "passwordLogin"
    );

const mensajeLogin =
    document.getElementById(
        "mensajeLogin"
    );

const btnLogin =
    document.getElementById(
        "btnLogin"
    );


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        verificarSesion();

        configurarEventos();
        configurarEstadisticas();

    }
);


/* =========================================================
   VERIFICAR SESIÓN
========================================================= */

function verificarSesion() {

    const token =
        localStorage.getItem(
            "token"
        );

    if (token) {

        mostrarDashboard();

    }
    else {

        mostrarLogin();

    }

}


/* =========================================================
   MOSTRAR LOGIN
========================================================= */

function mostrarLogin() {

    pantallaLogin.style.display =
        "flex";

    pantallaDashboard.style.display =
        "none";

    detenerActualizacionEstado();

}


/* =========================================================
   MOSTRAR DASHBOARD
========================================================= */

function mostrarDashboard() {

    pantallaLogin.style.display =
        "none";

    pantallaDashboard.style.display =
        "block";


    const nombre =
        localStorage.getItem(
            "usuario"
        );

    const rol =
        localStorage.getItem(
            "rol"
        );


    document.getElementById(
        "nombreUsuario"
    ).textContent =
        nombre || "--";


    document.getElementById(
        "rolUsuario"
    ).textContent =
        rol || "--";


    aplicarPermisosRol();

    configurarGestionUsuarios();

    cargarLecturas();

    cargarRiegos();

    cargarEstadisticasDiarias();
    cargarEstadisticasMensuales();

    obtenerEstadoControl();


    detenerActualizacionEstado();


    intervaloEstado =
        setInterval(
            obtenerEstadoControl,
            3000
        );

}


/* =========================================================
   PERMISOS POR ROL
========================================================= */

function aplicarPermisosRol() {

    const rol =
        localStorage.getItem(
            "rol"
        );

    const esAdministrador =
        rol === "Administrador";

    // La configuración Wi-Fi se muestra únicamente al administrador.
    const seccionWifi = document.getElementById("seccionWifi");
    if (seccionWifi) {
        seccionWifi.style.display = esAdministrador ? "block" : "none";
    }

    const panelControl =
        document.getElementById(
            "panelControl"
        );


    if (!panelControl) {

        return;

    }


    if (esAdministrador) {

        panelControl.style.display =
            "block";

    }
    else {

        panelControl.style.display =
            "none";

    }

}


/* =========================================================
   DETENER ACTUALIZACIÓN
========================================================= */

function detenerActualizacionEstado() {

    if (intervaloEstado) {

        clearInterval(
            intervaloEstado
        );

        intervaloEstado = null;

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function iniciarSesion(
    event
) {

    event.preventDefault();


    const usuario =
        usuarioLogin.value.trim();

    const password =
        passwordLogin.value;


    if (
        !usuario ||
        !password
    ) {

        mostrarMensajeLogin(
            "Ingrese usuario y contraseña."
        );

        return;

    }


    btnLogin.disabled =
        true;

    btnLogin.textContent =
        "Ingresando...";

    mostrarMensajeLogin(
        ""
    );


    try {

        const respuesta =
            await fetch(
                AUTH_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            usuario:
                                usuario,

                            password:
                                password

                        })

                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje ||
                "Usuario o contraseña incorrectos."
            );

        }


        /* =========================================
           GUARDAR SESIÓN
        ========================================= */

        localStorage.setItem(
            "token",
            datos.token
        );


        localStorage.setItem(
            "usuario",
            datos.usuario
        );


        localStorage.setItem(
            "rol",
            datos.rol
        );


        /* =========================================
           LIMPIAR FORMULARIO
        ========================================= */

        passwordLogin.value =
            "";

        mostrarMensajeLogin(
            ""
        );


        /* =========================================
           MOSTRAR DASHBOARD
        ========================================= */

        mostrarDashboard();


    }
    catch (error) {

        console.error(
            error
        );


        mostrarMensajeLogin(
            error.message ||
            "No se pudo iniciar sesión."
        );

    }
    finally {

        btnLogin.disabled =
            false;

        btnLogin.textContent =
            "Iniciar sesión";

    }

}


/* =========================================================
   MENSAJE LOGIN
========================================================= */

function mostrarMensajeLogin(
    mensaje
) {

    mensajeLogin.textContent =
        mensaje;

}


/* =========================================================
   CERRAR SESIÓN
========================================================= */

function cerrarSesion() {

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "usuario"
    );

    localStorage.removeItem(
        "rol"
    );


    todasLasLecturas = [];

    lecturasFiltradas = [];

    pagina = 1;


    todosLosRiegos = [];

    riegosFiltrados = [];

    paginaRiegos = 1;


    detenerActualizacionEstado();


    mostrarLogin();


    usuarioLogin.value =
        "";

    passwordLogin.value =
        "";


    mensajeLogin.textContent =
        "";

}


/* =========================================================
   HEADERS CON JWT
========================================================= */

function obtenerHeaders() {

    const token =
        localStorage.getItem(
            "token"
        );


    return {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${token}`

    };

}


/* =========================================================
   MANEJAR SESIÓN EXPIRADA
========================================================= */

function manejarRespuesta401(
    respuesta
) {

    if (
        respuesta.status === 401
    ) {

        cerrarSesion();

        mostrarMensajeLogin(
            "La sesión ha expirado. Inicie sesión nuevamente."
        );

        return true;

    }


    return false;

}


/* =========================================================
   CARGAR LECTURAS
========================================================= */

async function cargarLecturas() {

    const tabla =
        document.getElementById(
            "tablaLecturas"
        );

    const estado =
        document.getElementById(
            "estadoConexion"
        );


    try {

        estado.textContent =
            "● Conectando...";


        const respuesta =
            await fetch(
                API_URL,
                {

                    method: "GET",

                    headers:
                        obtenerHeaders()

                }
            );


        if (
            manejarRespuesta401(
                respuesta
            )
        ) {

            return;

        }


        if (!respuesta.ok) {

            if (
                respuesta.status === 403
            ) {

                throw new Error(
                    "No tiene permisos para consultar las lecturas."
                );

            }


            throw new Error(
                "Error al consultar la API."
            );

        }


        const lecturas =
            await respuesta.json();


        todasLasLecturas =
            lecturas || [];


        lecturasFiltradas =
            [
                ...todasLasLecturas
            ];


        pagina = 1;


        estado.textContent =
            "● Sistema conectado";


        actualizarTarjetas(
            todasLasLecturas
        );


        aplicarFiltros();


    }
    catch (error) {

        console.error(
            error
        );


        estado.textContent =
            "● Error de conexión";


        tabla.innerHTML = `

            <tr>

                <td colspan="5">

                    No se pudieron obtener
                    las lecturas.

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   ACTUALIZAR TARJETAS
========================================================= */

function actualizarTarjetas(
    lecturas
) {

    if (
        !lecturas ||
        lecturas.length === 0
    ) {

        document.getElementById(
            "temperatura"
        ).textContent =
            "-- °C";


        document.getElementById(
            "humedadAmbiental"
        ).textContent =
            "-- %";


        document.getElementById(
            "humedadSuelo"
        ).textContent =
            "--";


        document.getElementById(
            "ultimaActualizacion"
        ).textContent =
            "--";


        return;

    }


    const ultima =
        lecturas[0];


    document.getElementById(
        "temperatura"
    ).textContent =
        `${ultima.temperatura ?? "--"} °C`;


    document.getElementById(
        "humedadAmbiental"
    ).textContent =
        `${ultima.humedadAmbiental ?? "--"} %`;


    document.getElementById(
        "humedadSuelo"
    ).textContent =
        `${ultima.humedadSuelo ?? "--"}`;


    if (
        ultima.fechaHora
    ) {

        document.getElementById(
            "ultimaActualizacion"
        ).textContent =
            formatearFecha(
                ultima.fechaHora
            );

    }

}


/* =========================================================
   FILTROS DE LECTURAS
========================================================= */

function aplicarFiltros() {

    const texto =
        document.getElementById(
            "buscar"
        ).value
            .toLowerCase()
            .trim();


    const fecha =
        document.getElementById(
            "fechaBusqueda"
        ).value;


    lecturasFiltradas =
        todasLasLecturas.filter(
            lectura => {


                /* ==============================
                   BÚSQUEDA
                ============================== */

                const contenido = `

                    ${lectura.idLectura ?? ""}

                    ${lectura.temperatura ?? ""}

                    ${lectura.humedadAmbiental ?? ""}

                    ${lectura.humedadSuelo ?? ""}

                    ${lectura.fechaHora ?? ""}

                `.toLowerCase();


                const coincideTexto =
                    !texto ||
                    contenido.includes(
                        texto
                    );


                /* ==============================
                   FECHA
                ============================== */

                let coincideFecha =
                    true;


                if (
                    fecha &&
                    lectura.fechaHora
                ) {

                    const fechaLectura =
                        new Date(
                            lectura.fechaHora
                        );


                    const fechaISO =
                        fechaLectura
                            .toISOString()
                            .split("T")[0];


                    coincideFecha =
                        fechaISO ===
                        fecha;

                }


                return (
                    coincideTexto &&
                    coincideFecha
                );

            }
        );


    pagina = 1;


    mostrarLecturas();

}


/* =========================================================
   MOSTRAR LECTURAS
========================================================= */

function mostrarLecturas() {

    const tabla =
        document.getElementById(
            "tablaLecturas"
        );


    tabla.innerHTML =
        "";


    if (
        lecturasFiltradas.length ===
        0
    ) {

        tabla.innerHTML = `

            <tr>

                <td colspan="5">

                    No existen lecturas
                    que coincidan con los filtros.

                </td>

            </tr>

        `;


        actualizarContador();

        actualizarPaginacion();

        return;

    }


    const inicio =
        (
            pagina - 1
        ) *
        registrosPorPagina;


    const fin =
        inicio +
        registrosPorPagina;


    const registros =
        lecturasFiltradas.slice(
            inicio,
            fin
        );


    registros.forEach(
        lectura => {

            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `

                <td>
                    ${lectura.idLectura ?? "--"}
                </td>

                <td>
                    ${lectura.fechaHora
                    ? formatearFecha(
                        lectura.fechaHora
                    )
                    : "--"
                }
                </td>

                <td>
                    ${lectura.temperatura ??
                "--"
                } °C
                </td>

                <td>
                    ${lectura.humedadAmbiental ??
                "--"
                } %
                </td>

                <td>
                    ${lectura.humedadSuelo ??
                "--"
                }
                </td>

            `;


            tabla.appendChild(
                fila
            );

        }
    );


    actualizarContador();

    actualizarPaginacion();

}


/* =========================================================
   CONTADOR DE LECTURAS
========================================================= */

function actualizarContador() {

    const contador =
        document.getElementById(
            "contadorRegistros"
        );


    const total =
        lecturasFiltradas.length;


    contador.textContent =
        `${total} registro${total === 1 ? "" : "s"}`;

}


/* =========================================================
   PAGINACIÓN DE LECTURAS
========================================================= */

function actualizarPaginacion() {

    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                lecturasFiltradas.length /
                registrosPorPagina
            )
        );


    const paginaActual =
        document.getElementById(
            "paginaActual"
        );


    paginaActual.textContent =
        `Página ${pagina} de ${totalPaginas}`;


    document.getElementById(
        "btnAnterior"
    ).disabled =
        pagina <= 1;


    document.getElementById(
        "btnSiguiente"
    ).disabled =
        pagina >= totalPaginas;

}


/* =========================================================
   PÁGINA ANTERIOR
========================================================= */

function paginaAnterior() {

    if (
        pagina > 1
    ) {

        pagina--;

        mostrarLecturas();

    }

}


/* =========================================================
   PÁGINA SIGUIENTE
========================================================= */

function paginaSiguiente() {

    const totalPaginas =
        Math.ceil(
            lecturasFiltradas.length /
            registrosPorPagina
        );


    if (
        pagina <
        totalPaginas
    ) {

        pagina++;

        mostrarLecturas();

    }

}


/* =========================================================
   FORMATO DE FECHA
========================================================= */

function formatearFecha(
    fecha
) {

    const fechaObjeto =
        new Date(
            fecha
        );


    if (
        isNaN(
            fechaObjeto.getTime()
        )
    ) {

        return "--";

    }


    return fechaObjeto.toLocaleString(
        "es-GT",
        {

            dateStyle:
                "short",

            timeStyle:
                "medium"

        }
    );

}


/* =========================================================
   HISTORIAL DE RIEGOS
========================================================= */

async function cargarRiegos() {

    const tabla =
        document.getElementById(
            "tablaRiegos"
        );


    if (!tabla) {

        return;

    }


    try {

        const respuesta =
            await fetch(
                RIEGOS_URL,
                {

                    method: "GET",

                    headers:
                        obtenerHeaders()

                }
            );


        if (
            manejarRespuesta401(
                respuesta
            )
        ) {

            return;

        }


        if (!respuesta.ok) {

            if (
                respuesta.status === 403
            ) {

                throw new Error(
                    "No tiene permisos para consultar el historial de riegos."
                );

            }


            throw new Error(
                "No se pudo obtener el historial de riegos."
            );

        }


        const riegos =
            await respuesta.json();


        todosLosRiegos =
            riegos || [];


        riegosFiltrados =
            [
                ...todosLosRiegos
            ];


        paginaRiegos = 1;


        aplicarFiltrosRiegos();

    }
    catch (error) {

        console.error(
            "Error historial de riegos:",
            error
        );


        tabla.innerHTML = `

            <tr>

                <td colspan="5">

                    No se pudo obtener
                    el historial de riegos.

                </td>

            </tr>

        `;


        actualizarContadorRiegos();

    }

}


/* =========================================================
   FILTROS DE RIEGOS
========================================================= */

function aplicarFiltrosRiegos() {

    const textoElemento =
        document.getElementById(
            "buscarRiegos"
        );


    const fechaElemento =
        document.getElementById(
            "fechaRiego"
        );


    const texto =
        textoElemento
            ? textoElemento.value
                .toLowerCase()
                .trim()
            : "";


    const fecha =
        fechaElemento
            ? fechaElemento.value
            : "";


    riegosFiltrados =
        todosLosRiegos.filter(
            riego => {

                const tipo =
                    riego.activadoAutomaticamente
                        ? "automatico"
                        : "manual";


                const contenido = `

                    ${riego.idRiego ?? ""}

                    ${tipo}

                    ${riego.fechaHoraInicio ?? ""}

                    ${riego.fechaHoraFin ?? ""}

                    ${riego.duracionSegundos ?? ""}

                `.toLowerCase();


                const coincideTexto =
                    !texto ||
                    contenido.includes(
                        texto
                    );


                let coincideFecha =
                    true;


                if (fecha) {

                    const fechas = [];


                    if (
                        riego.fechaHoraInicio
                    ) {

                        fechas.push(
                            new Date(
                                riego.fechaHoraInicio
                            )
                        );

                    }


                    if (
                        riego.fechaHoraFin
                    ) {

                        fechas.push(
                            new Date(
                                riego.fechaHoraFin
                            )
                        );

                    }


                    coincideFecha =
                        fechas.some(
                            fechaRiegoObjeto => {

                                if (
                                    isNaN(
                                        fechaRiegoObjeto.getTime()
                                    )
                                ) {

                                    return false;

                                }


                                const fechaISO =
                                    fechaRiegoObjeto
                                        .toISOString()
                                        .split("T")[0];


                                return (
                                    fechaISO ===
                                    fecha
                                );

                            }
                        );

                }


                return (
                    coincideTexto &&
                    coincideFecha
                );

            }
        );


    paginaRiegos = 1;


    mostrarRiegos();

}


/* =========================================================
   MOSTRAR RIEGOS
========================================================= */

function mostrarRiegos() {

    const tabla =
        document.getElementById(
            "tablaRiegos"
        );


    if (!tabla) {

        return;

    }


    tabla.innerHTML =
        "";


    if (
        riegosFiltrados.length ===
        0
    ) {

        tabla.innerHTML = `

            <tr>

                <td colspan="5">

                    No existen riegos
                    que coincidan con los filtros.

                </td>

            </tr>

        `;


        actualizarContadorRiegos();

        actualizarPaginacionRiegos();

        return;

    }


    const inicio =
        (
            paginaRiegos - 1
        ) *
        registrosRiegosPorPagina;


    const fin =
        inicio +
        registrosRiegosPorPagina;


    const registros =
        riegosFiltrados.slice(
            inicio,
            fin
        );


    registros.forEach(
        riego => {

            const fechaInicio =
                riego.fechaHoraInicio
                    ? formatearFecha(
                        riego.fechaHoraInicio
                    )
                    : "--";


            const fechaFin =
                riego.fechaHoraFin
                    ? formatearFecha(
                        riego.fechaHoraFin
                    )
                    : "En curso";


            const duracion =
                riego.duracionSegundos != null
                    ? `${riego.duracionSegundos} segundo${riego.duracionSegundos === 1 ? "" : "s"}`
                    : "En curso";


            const tipo =
                riego.activadoAutomaticamente
                    ? "🤖 Automático"
                    : "👤 Manual";


            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `

                <td>
                    ${riego.idRiego ?? "--"}
                </td>

                <td>
                    ${fechaInicio}
                </td>

                <td>
                    ${fechaFin}
                </td>

                <td>
                    ${duracion}
                </td>

                <td>
                    ${tipo}
                </td>

            `;


            tabla.appendChild(
                fila
            );

        }
    );


    actualizarContadorRiegos();

    actualizarPaginacionRiegos();

}


/* =========================================================
   CONTADOR DE RIEGOS
========================================================= */

function actualizarContadorRiegos() {

    const contador =
        document.getElementById(
            "contadorRiegos"
        );


    if (!contador) {

        return;

    }


    const total =
        riegosFiltrados.length;


    contador.textContent =
        `${total} registro${total === 1 ? "" : "s"}`;

}


/* =========================================================
   PAGINACIÓN DE RIEGOS
========================================================= */

function actualizarPaginacionRiegos() {

    const paginaElemento =
        document.getElementById(
            "paginaRiegos"
        );


    const btnAnterior =
        document.getElementById(
            "btnAnteriorRiegos"
        );


    const btnSiguiente =
        document.getElementById(
            "btnSiguienteRiegos"
        );


    if (
        !paginaElemento ||
        !btnAnterior ||
        !btnSiguiente
    ) {

        return;

    }


    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                riegosFiltrados.length /
                registrosRiegosPorPagina
            )
        );


    if (
        paginaRiegos >
        totalPaginas
    ) {

        paginaRiegos =
            totalPaginas;

    }


    paginaElemento.textContent =
        `Página ${paginaRiegos} de ${totalPaginas}`;


    btnAnterior.disabled =
        paginaRiegos <= 1;


    btnSiguiente.disabled =
        paginaRiegos >= totalPaginas;

}


/* =========================================================
   PÁGINA ANTERIOR - RIEGOS
========================================================= */

function paginaAnteriorRiegos() {

    if (
        paginaRiegos > 1
    ) {

        paginaRiegos--;

        mostrarRiegos();

    }

}


/* =========================================================
   PÁGINA SIGUIENTE - RIEGOS
========================================================= */

function paginaSiguienteRiegos() {

    const totalPaginas =
        Math.ceil(
            riegosFiltrados.length /
            registrosRiegosPorPagina
        );


    if (
        paginaRiegos <
        totalPaginas
    ) {

        paginaRiegos++;

        mostrarRiegos();

    }

}


/* =========================================================
   OBTENER ESTADO DEL CONTROL
========================================================= */

async function obtenerEstadoControl() {

    try {

        const respuesta =
            await fetch(
                `${CONTROL_URL}/estado`,
                {

                    method: "GET",

                    headers:
                        obtenerHeaders()

                }
            );


        if (
            manejarRespuesta401(
                respuesta
            )
        ) {

            return;

        }


        if (!respuesta.ok) {

            throw new Error(
                "No se pudo obtener el estado del sistema."
            );

        }


        const estado =
            await respuesta.json();


        actualizarEstadoControl(
            estado
        );


    }
    catch (error) {

        console.error(
            "Error estado:",
            error
        );

    }

}


/* =========================================================
   ACTUALIZAR ESTADO DEL CONTROL
========================================================= */

function actualizarEstadoControl(
    estado
) {

    if (!estado) {

        return;

    }


    const automatico =
        estado.modoAutomatico ??
        estado.ModoAutomatico ??
        true;


    const ventiladorRaw =
        estado.ventilador ??
        estado.Ventilador ??
        estado.ventiladorEncendido ??
        estado.VentiladorEncendido ??
        false;


    const bombaRaw =
        estado.bomba ??
        estado.Bomba ??
        estado.bombaEncendida ??
        estado.BombaEncendida ??
        false;


    const ventilador =
        ventiladorRaw === true ||
        ventiladorRaw === "encendido";


    const bomba =
        bombaRaw === true ||
        bombaRaw === "encendido";


    /* ==============================
       MODO
    ============================== */

    document.getElementById(
        "estadoModo"
    ).textContent =
        automatico
            ? "🤖 Automático"
            : "👤 Manual";


    /* ==============================
       VENTILADOR
    ============================== */

    document.getElementById(
        "estadoVentilador"
    ).textContent =
        ventilador
            ? "🟢 Encendido"
            : "🔴 Apagado";


    /* ==============================
       BOMBA
    ============================== */

    document.getElementById(
        "estadoBomba"
    ).textContent =
        bomba
            ? "🟢 Encendida"
            : "🔴 Apagada";


    /* ==============================
       BOTONES
    ============================== */

    const btnVentiladorOn =
        document.getElementById(
            "btnVentiladorOn"
        );


    const btnVentiladorOff =
        document.getElementById(
            "btnVentiladorOff"
        );


    const btnBombaOn =
        document.getElementById(
            "btnBombaOn"
        );


    const btnBombaOff =
        document.getElementById(
            "btnBombaOff"
        );


    const btnAutomatico =
        document.getElementById(
            "btnAutomatico"
        );


    const btnManual =
        document.getElementById(
            "btnManual"
        );


    /* ==============================
       PERMISOS
    ============================== */

    const rol =
        localStorage.getItem(
            "rol"
        );


    const esAdministrador =
        rol === "Administrador";


    const permitirControl =
        esAdministrador &&
        !automatico;


    btnVentiladorOn.disabled =
        !permitirControl;


    btnVentiladorOff.disabled =
        !permitirControl;


    btnBombaOn.disabled =
        !permitirControl;


    btnBombaOff.disabled =
        !permitirControl;


    btnAutomatico.disabled =
        !esAdministrador;


    btnManual.disabled =
        !esAdministrador;

}


/* =========================================================
   ENVIAR COMANDO
========================================================= */

async function enviarComando(
    endpoint
) {

    try {

        const respuesta =
            await fetch(
                `${CONTROL_URL}${endpoint}`,
                {

                    method: "POST",

                    headers:
                        obtenerHeaders()

                }
            );


        if (
            manejarRespuesta401(
                respuesta
            )
        ) {

            return;

        }


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje ||
                "No se pudo ejecutar el comando."
            );

        }


        await obtenerEstadoControl();

    }
    catch (error) {

        console.error(
            "Error comando:",
            error
        );


        alert(
            error.message ||
            "No se pudo ejecutar el comando."
        );

    }

}


/* =========================================================
   CONFIGURAR EVENTOS
========================================================= */

function configurarEventos() {


    /* ==============================
       LOGIN
    ============================== */

    formLogin.addEventListener(
        "submit",
        iniciarSesion
    );


    /* ==============================
       CERRAR SESIÓN
    ============================== */

    document
        .getElementById(
            "btnCerrarSesion"
        )
        .addEventListener(
            "click",
            cerrarSesion
        );


    /* ==============================
       ACTUALIZAR LECTURAS
    ============================== */

    document
        .getElementById(
            "btnActualizar"
        )
        .addEventListener(
            "click",
            cargarLecturas
        );


    /* ==============================
       ACTUALIZAR RIEGOS
    ============================== */

    document
        .getElementById(
            "btnActualizarRiegos"
        )
        .addEventListener(
            "click",
            cargarRiegos
        );


    /* ==============================
       FILTRO TEXTO - LECTURAS
    ============================== */

    document
        .getElementById(
            "buscar"
        )
        .addEventListener(
            "input",
            aplicarFiltros
        );


    /* ==============================
       FILTRO FECHA - LECTURAS
    ============================== */

    document
        .getElementById(
            "fechaBusqueda"
        )
        .addEventListener(
            "change",
            aplicarFiltros
        );


    /* ==============================
       CANTIDAD DE REGISTROS
       - LECTURAS
    ============================== */

    document
        .getElementById(
            "limiteFilas"
        )
        .addEventListener(
            "change",
            function () {

                registrosPorPagina =
                    parseInt(
                        this.value
                    );


                pagina = 1;


                mostrarLecturas();

            }
        );


    /* ==============================
       PAGINACIÓN - LECTURAS
    ============================== */

    document
        .getElementById(
            "btnAnterior"
        )
        .addEventListener(
            "click",
            paginaAnterior
        );


    document
        .getElementById(
            "btnSiguiente"
        )
        .addEventListener(
            "click",
            paginaSiguiente
        );


    /* ==============================
       FILTRO TEXTO - RIEGOS
    ============================== */

    document
        .getElementById(
            "buscarRiegos"
        )
        .addEventListener(
            "input",
            aplicarFiltrosRiegos
        );


    /* ==============================
       FILTRO FECHA - RIEGOS
    ============================== */

    document
        .getElementById(
            "fechaRiego"
        )
        .addEventListener(
            "change",
            aplicarFiltrosRiegos
        );


    /* ==============================
       CANTIDAD DE REGISTROS
       - RIEGOS
    ============================== */

    document
        .getElementById(
            "limiteRiegos"
        )
        .addEventListener(
            "change",
            function () {

                registrosRiegosPorPagina =
                    parseInt(
                        this.value
                    );


                paginaRiegos = 1;


                mostrarRiegos();

            }
        );


    /* ==============================
       PAGINACIÓN - RIEGOS
    ============================== */

    document
        .getElementById(
            "btnAnteriorRiegos"
        )
        .addEventListener(
            "click",
            paginaAnteriorRiegos
        );


    document
        .getElementById(
            "btnSiguienteRiegos"
        )
        .addEventListener(
            "click",
            paginaSiguienteRiegos
        );


    /* ==============================
       MODO AUTOMÁTICO
    ============================== */

    document
        .getElementById(
            "btnAutomatico"
        )
        .addEventListener(
            "click",
            function () {

                enviarComando(
                    "/modo/automatico"
                );

            }
        );


    /* ==============================
       MODO MANUAL
    ============================== */

    document
        .getElementById(
            "btnManual"
        )
        .addEventListener(
            "click",
            function () {

                enviarComando(
                    "/modo/manual"
                );

            }
        );


    /* ==============================
       VENTILADOR ENCENDER
    ============================== */

    document
        .getElementById(
            "btnVentiladorOn"
        )
        .addEventListener(
            "click",
            function () {

                enviarComando(
                    "/ventilador/encender"
                );

            }
        );


    /* ==============================
       VENTILADOR APAGAR
    ============================== */

    document
        .getElementById(
            "btnVentiladorOff"
        )
        .addEventListener(
            "click",
            function () {

                enviarComando(
                    "/ventilador/apagar"
                );

            }
        );


    /* ==============================
       BOMBA ENCENDER
    ============================== */

    document
        .getElementById(
            "btnBombaOn"
        )
        .addEventListener(
            "click",
            function () {

                enviarComando(
                    "/bomba/encender"
                );

            }
        );


    /* ==============================
       BOMBA APAGAR
    ============================== */

    document
        .getElementById(
            "btnBombaOff"
        )
        .addEventListener(
            "click",
            function () {

                enviarComando(
                    "/bomba/apagar"
                );

            }
        );


    // El botón queda enlazado y explica el requisito pendiente si la API/firmware
    // aún no expone una ruta para activar el punto de acceso del ESP32.
    const btnWifi = document.getElementById("btnConfigurarWifi");

    if (btnWifi && btnWifi.dataset.configurado !== "true") {
        btnWifi.addEventListener("click", async function () {
            const mensaje = document.getElementById("mensajeWifi");

            btnWifi.disabled = true;

            if (mensaje) {
                mensaje.textContent = "Enviando solicitud al ESP32...";
            }

            try {
                const respuesta = await fetch(
                    `${CONTROL_URL}/wifi/configurar`,
                    {
                        method: "POST",
                        headers: obtenerHeaders()
                    }
                );

                if (manejarRespuesta401(respuesta)) {
                    return;
                }

                const texto = await respuesta.text();
                let datos = {};

                try {
                    datos = texto ? JSON.parse(texto) : {};
                } catch {
                    datos = { mensaje: texto };
                }

                if (!respuesta.ok) {
                    throw new Error(
                        datos.mensaje ||
                        datos.message ||
                        `Error HTTP ${respuesta.status}`
                    );
                }

                if (mensaje) {
                    mensaje.textContent =
                        datos.mensaje ||
                        datos.message ||
                        "Solicitud enviada. Comprueba que el ESP32 active la red WIFI-ESP32.";
                }

            } catch (error) {
                console.error("Error al configurar Wi-Fi:", error);

                if (mensaje) {
                    mensaje.textContent =
                        "No se pudo solicitar la configuración Wi-Fi: " +
                        error.message;
                }
            } finally {
                btnWifi.disabled = false;
            }
        });

        btnWifi.dataset.configurado = "true";
    }

}

/* =========================================================
   GESTIÓN DE USUARIOS - INVERNADERO IoT JULKY
========================================================= */


async function cargarUsuarios() {
    const tabla = document.getElementById("tablaUsuarios");
    const mensaje = document.getElementById("mensajeUsuarios");

    if (!tabla) return;

    // Comprobación de interfaz; la API también debe autorizar.
    if (localStorage.getItem("rol") !== "Administrador") {
        return;
    }

    tabla.replaceChildren();

    const filaCarga = document.createElement("tr");
    const celdaCarga = document.createElement("td");
    celdaCarga.colSpan = 5;
    celdaCarga.textContent = "Cargando usuarios...";
    filaCarga.appendChild(celdaCarga);
    tabla.appendChild(filaCarga);

    try {
        const respuesta = await fetch(API_USUARIOS_URL, {
            method: "GET",
            headers: obtenerHeaders()
        });

        if (manejarRespuesta401(respuesta)) return;

        if (!respuesta.ok) {
            throw new Error(
                respuesta.status === 403
                    ? "No tienes permisos para consultar usuarios."
                    : `Error al consultar usuarios: HTTP ${respuesta.status}.`
            );
        }

        const usuarios = await respuesta.json();

        tabla.replaceChildren();

        if (!Array.isArray(usuarios) || usuarios.length === 0) {
            const fila = document.createElement("tr");
            const celda = document.createElement("td");
            celda.colSpan = 6;
            celda.textContent = "No hay usuarios registrados.";
            fila.appendChild(celda);
            tabla.appendChild(fila);
            return;
        }

        usuarios.forEach(usuario => {
            const fila = document.createElement("tr");

            // Admite distintos nombres de propiedades JSON.
            const id = usuario.idUsuario ?? usuario.IdUsuario ?? "--";
            const nombre = usuario.nombre ?? usuario.Nombre ?? "--";
            // La API UsuariosController devuelve la propiedad "usuario".
            // Se mantienen alternativas por compatibilidad con otras respuestas.
            const nombreUsuario =
                usuario.usuario ?? usuario.Usuario ??
                usuario.usuarioNombre ?? usuario.UsuarioNombre ?? "--";
            const rol =
                usuario.rol ?? usuario.nombreRol ??
                usuario.NombreRol ?? usuario.rolNombre ?? "--";
            const activo = usuario.activo ?? usuario.Activo;

            [
                id,
                nombre,
                nombreUsuario,
                rol,
                activo === undefined ? "--" : (activo ? "Activo" : "Inactivo")
            ].forEach(valor => {
                const celda = document.createElement("td");
                celda.textContent = String(valor);
                fila.appendChild(celda);
            });
            // Columna de acciones
            const celdaAcciones = document.createElement("td");

            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.textContent = "🗑️ Eliminar";
            botonEliminar.className = "btn-eliminar";

            botonEliminar.addEventListener("click", () => {
                eliminarUsuario(id, nombreUsuario);
            });

            celdaAcciones.appendChild(botonEliminar);
            fila.appendChild(celdaAcciones);
            tabla.appendChild(fila);
        });

        if (mensaje) mensaje.textContent = "";

    } catch (error) {
        console.error("Error al cargar usuarios:", error);

        tabla.replaceChildren();

        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.textContent = error.message;
        fila.appendChild(celda);
        tabla.appendChild(fila);
    }
}

async function crearUsuario(event) {
    event.preventDefault();

    const mensaje = document.getElementById("mensajeUsuarios");
    const boton = document.getElementById("btnCrearUsuario");

    if (localStorage.getItem("rol") !== "Administrador") {
        mensaje.textContent = "No tienes permisos para crear usuarios.";
        return;
    }

    const nombre = document.getElementById("nuevoNombre").value.trim();
    const usuarioNombre =
        document.getElementById("nuevoUsuario").value.trim();
    const password = document.getElementById("nuevaPassword").value;
    const idRol = Number(document.getElementById("nuevoRol").value);

    if (!nombre || !usuarioNombre || !password) {
        mensaje.textContent = "Completa todos los campos.";
        return;
    }

    if (password.length < 8) {
        mensaje.textContent =
            "La contraseña debe tener al menos 8 caracteres.";
        return;
    }

    // Estos IDs deben coincidir con la tabla Roles de SQL Server.
    if (![1, 2].includes(idRol)) {
        mensaje.textContent = "El rol seleccionado no es válido.";
        return;
    }

    boton.disabled = true;
    mensaje.textContent = "Creando usuario...";

    try {
        const respuesta = await fetch(API_USUARIOS_URL, {
            method: "POST",
            headers: obtenerHeaders(),
            body: JSON.stringify({
                nombre: nombre,
                usuario: usuarioNombre,
                password: password,
                idRol: idRol
            })
        });

        if (manejarRespuesta401(respuesta)) return;

        if (!respuesta.ok) {
            const detalle = await respuesta.text();

            throw new Error(
                respuesta.status === 403
                    ? "La API rechazó la operación. Se requiere rol Administrador."
                    : detalle || `No se pudo crear el usuario (HTTP ${respuesta.status}).`
            );
        }

        mensaje.textContent = "Usuario creado correctamente.";

        document.getElementById("formCrearUsuario").reset();

        await cargarUsuarios();

    } catch (error) {
        console.error("Error al crear usuario:", error);
        mensaje.textContent = error.message;
    } finally {
        boton.disabled = false;
    }
}

function configurarGestionUsuarios() {
    const panel = document.getElementById("seccionUsuarios");
    const rol = localStorage.getItem("rol");

    if (!panel) return;

    const esAdministrador = rol === "Administrador";
    panel.style.display = esAdministrador ? "block" : "none";

    if (!esAdministrador) return;

    const formulario = document.getElementById("formCrearUsuario");
    const botonActualizar =
        document.getElementById("btnActualizarUsuarios");

    // Evita registrar los eventos más de una vez.
    if (formulario && formulario.dataset.configurado !== "true") {
        formulario.addEventListener("submit", crearUsuario);
        formulario.dataset.configurado = "true";
    }

    if (botonActualizar &&
        botonActualizar.dataset.configurado !== "true") {
        botonActualizar.addEventListener("click", cargarUsuarios);
        botonActualizar.dataset.configurado = "true";
    }

    cargarUsuarios();
}

async function eliminarUsuario(id, nombreUsuario) {
    if (localStorage.getItem("rol") !== "Administrador") {
        alert("No tienes permisos para eliminar usuarios.");
        return;
    }

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        alert("El identificador del usuario no es válido.");
        return;
    }

    const confirmar = confirm(
        `¿Estás seguro de que deseas eliminar al usuario "${nombreUsuario}"? Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
        const respuesta = await fetch(
            `${API_USUARIOS_URL}/${Number(id)}`,
            {
                method: "DELETE",
                headers: obtenerHeaders()
            }
        );

        if (manejarRespuesta401(respuesta)) return;

        const texto = await respuesta.text();
        let datos = {};

        try {
            datos = texto ? JSON.parse(texto) : {};
        } catch {
            datos = {};
        }

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                `No se pudo eliminar el usuario (HTTP ${respuesta.status}).`
            );
        }

        alert(datos.mensaje || "Usuario eliminado correctamente.");
        await cargarUsuarios();

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert(error.message || "Error al eliminar el usuario.");
    }
}

/* =========================================================
   ESTADÍSTICAS AMBIENTALES
========================================================= */

const MESES_ESTADISTICAS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function configurarEstadisticas() {
    const selectorMes = document.getElementById("mesEstadisticas");
    const selectorAnio = document.getElementById("anioEstadisticas");
    if (!selectorMes || !selectorAnio) return;

    MESES_ESTADISTICAS.forEach((nombre, indice) => {
        const opcion = document.createElement("option");
        opcion.value = String(indice + 1);
        opcion.textContent = nombre;
        selectorMes.appendChild(opcion);
    });

    const anioActual = new Date().getFullYear();
    for (let anio = anioActual; anio >= anioActual - 5; anio--) {
        const opcion = document.createElement("option");
        opcion.value = String(anio);
        opcion.textContent = String(anio);
        selectorAnio.appendChild(opcion);
    }
    selectorMes.value = String(new Date().getMonth() + 1);
    selectorAnio.value = String(anioActual);

    document.getElementById("btnActualizarEstadisticas")?.addEventListener("click", () => {
        cargarEstadisticasDiarias();
        cargarEstadisticasMensuales();
    });
    document.getElementById("btnConsultarMes")?.addEventListener("click", cargarEstadisticasMensuales);
}

function formatoNumeroEstadistica(valor, decimales = 1) {
    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) return "--";
    return Number(valor).toLocaleString("es-GT", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

async function solicitarEstadistica(url) {
    const respuesta = await fetch(url, { method: "GET", headers: obtenerHeaders() });
    if (manejarRespuesta401(respuesta)) throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        throw new Error(`La API respondió ${respuesta.status}${detalle ? `: ${detalle}` : ""}`);
    }
    return await respuesta.json();
}

async function cargarEstadisticasDiarias() {
    const mensaje = document.getElementById("mensajeEstadisticasDiarias");
    if (!mensaje || !localStorage.getItem("token")) return;
    mensaje.textContent = "Consultando lecturas...";
    try {
        const datos = await solicitarEstadistica(`${API_URL}/estadisticas/diarias`);
        const hoy = datos.hoy || {};
        const ayer = datos.ayer || {};
        document.getElementById("promedioTempHoy").textContent = `${formatoNumeroEstadistica(hoy.temperaturaPromedio)} °C`;
        document.getElementById("promedioTempAyer").textContent = `${formatoNumeroEstadistica(ayer.temperaturaPromedio)} °C`;
        document.getElementById("cantidadLecturasHoy").textContent = `${hoy.cantidadLecturas || 0} lecturas`;
        document.getElementById("cantidadLecturasAyer").textContent = `${ayer.cantidadLecturas || 0} lecturas`;
        const diferencia = datos.diferenciaTemperatura;
        const destino = document.getElementById("diferenciaTemperatura");
        if (diferencia === null || diferencia === undefined || hoy.temperaturaPromedio == null || ayer.temperaturaPromedio == null) {
            destino.textContent = "Sin datos";
        } else {
            destino.textContent = `${Number(diferencia) > 0 ? "+" : ""}${formatoNumeroEstadistica(diferencia)} °C`;
        }
        mensaje.textContent = hoy.cantidadLecturas ? `Fecha de hoy: ${datos.fechaHoy}.` : "Todavía no hay lecturas registradas para hoy.";
    } catch (error) {
        mensaje.textContent = `No se pudieron cargar las estadísticas diarias: ${error.message}`;
    }
}

async function cargarEstadisticasMensuales() {
    const mensaje = document.getElementById("mensajeEstadisticasMes");
    const selectorMes = document.getElementById("mesEstadisticas");
    const selectorAnio = document.getElementById("anioEstadisticas");
    if (!mensaje || !selectorMes || !selectorAnio || !localStorage.getItem("token")) return;
    mensaje.textContent = "Consultando estadísticas del mes...";
    const mes = Number(selectorMes.value);
    const anio = Number(selectorAnio.value);
    try {
        const datos = await solicitarEstadistica(`${API_URL}/estadisticas/mensuales?anio=${anio}&mes=${mes}`);
        document.getElementById("tituloResumenMensual").textContent = `Resumen de ${MESES_ESTADISTICAS[mes - 1]} de ${anio}`;
        document.getElementById("promedioTempMes").textContent = `${formatoNumeroEstadistica(datos.temperaturaPromedio)} °C`;
        document.getElementById("rangoTempMes").textContent = `Mín. ${formatoNumeroEstadistica(datos.temperaturaMinima)} °C / Máx. ${formatoNumeroEstadistica(datos.temperaturaMaxima)} °C`;
        document.getElementById("promedioHumedadMes").textContent = `${formatoNumeroEstadistica(datos.humedadAmbientalPromedio)} %`;
        document.getElementById("promedioSueloMes").textContent = formatoNumeroEstadistica(datos.humedadSueloPromedio);
        document.getElementById("cantidadLecturasMes").textContent = `${datos.cantidadLecturas || 0} lecturas registradas`;
        dibujarGraficaTemperatura(datos.porDia || []);
        mensaje.textContent = datos.cantidadLecturas ? `Se analizaron ${datos.cantidadLecturas} lecturas del mes seleccionado.` : "No hay lecturas registradas para el mes seleccionado.";
    } catch (error) {
        mensaje.textContent = `No se pudieron cargar las estadísticas mensuales: ${error.message}`;
        document.getElementById("graficaTemperaturaMes").innerHTML = "";
    }
}

function dibujarGraficaTemperatura(registros) {
    const contenedor = document.getElementById("graficaTemperaturaMes");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    const datos = registros.filter(x => x.temperaturaPromedio !== null && x.temperaturaPromedio !== undefined);
    if (!datos.length) {
        contenedor.textContent = "No hay datos suficientes para mostrar la gráfica.";
        return;
    }
    const maximo = Math.max(...datos.map(x => Number(x.temperaturaPromedio)));
    const minimo = Math.min(...datos.map(x => Number(x.temperaturaPromedio)));
    const rango = Math.max(maximo - minimo, 1);
    datos.forEach(registro => {
        const columna = document.createElement("div");
        columna.className = "barra-temperatura-item";
        const valor = Number(registro.temperaturaPromedio);
        const barra = document.createElement("div");
        barra.className = "barra-temperatura";
        barra.style.height = `${Math.max(12, 30 + ((valor - minimo) / rango) * 65)}%`;
        barra.title = `${registro.fecha}: ${formatoNumeroEstadistica(valor)} °C`;
        const etiquetaValor = document.createElement("span");
        etiquetaValor.className = "barra-valor";
        etiquetaValor.textContent = formatoNumeroEstadistica(valor);
        const etiquetaDia = document.createElement("span");
        etiquetaDia.className = "barra-dia";
        etiquetaDia.textContent = String(registro.dia);
        columna.append(etiquetaValor, barra, etiquetaDia);
        contenedor.appendChild(columna);
    });
}
