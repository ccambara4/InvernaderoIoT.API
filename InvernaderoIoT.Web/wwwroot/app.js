/* =========================================================
   CONFIGURACIÓN
========================================================= */

const API_BASE_URL = "http://192.168.1.159:5000/api";

const API_URL = `${API_BASE_URL}/Lecturas`;

const AUTH_URL = `${API_BASE_URL}/Auth/login`;

const CONTROL_URL = `${API_BASE_URL}/Control`;



/* =========================================================
   VARIABLES
========================================================= */

let todasLasLecturas = [];

let lecturasFiltradas = [];

let pagina = 1;

let registrosPorPagina = 10;

let intervaloEstado = null;



/* =========================================================
   ELEMENTOS
========================================================= */

const pantallaLogin =
    document.getElementById("pantallaLogin");

const pantallaDashboard =
    document.getElementById("pantallaDashboard");

const formLogin =
    document.getElementById("formLogin");

const usuarioLogin =
    document.getElementById("usuarioLogin");

const passwordLogin =
    document.getElementById("passwordLogin");

const mensajeLogin =
    document.getElementById("mensajeLogin");

const btnLogin =
    document.getElementById("btnLogin");



/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    verificarSesion();

    configurarEventos();

});



/* =========================================================
   VERIFICAR SESIÓN
========================================================= */

function verificarSesion() {

    const token =
        localStorage.getItem("token");

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

    pantallaLogin.style.display = "flex";

    pantallaDashboard.style.display = "none";

    detenerActualizacionEstado();

}



/* =========================================================
   MOSTRAR DASHBOARD
========================================================= */

function mostrarDashboard() {

    pantallaLogin.style.display = "none";

    pantallaDashboard.style.display = "block";


    const nombre =
        localStorage.getItem("usuario");

    const rol =
        localStorage.getItem("rol");


    document.getElementById(
        "nombreUsuario"
    ).textContent = nombre || "--";


    document.getElementById(
        "rolUsuario"
    ).textContent = rol || "--";

    aplicarPermisosRol();

    cargarLecturas();

    obtenerEstadoControl();


    detenerActualizacionEstado();


    intervaloEstado =
        setInterval(
            obtenerEstadoControl,
            3000
        );

    function aplicarPermisosRol() {

        const rol =
            localStorage.getItem("rol");

        const esAdministrador =
            rol === "Administrador";

        const panelControl =
            document.getElementById("panelControl");

        if (!panelControl) {
            return;
        }

        if (esAdministrador) {

            panelControl.style.display = "block";

        } else {

            panelControl.style.display = "none";

        }
    }
}



/* =========================================================
   DETENER ACTUALIZACIÓN
========================================================= */

function detenerActualizacionEstado() {

    if (intervaloEstado) {

        clearInterval(intervaloEstado);

        intervaloEstado = null;

    }

}



/* =========================================================
   LOGIN
========================================================= */

async function iniciarSesion(event) {

    event.preventDefault();


    const usuario =
        usuarioLogin.value.trim();

    const password =
        passwordLogin.value;


    if (!usuario || !password) {

        mostrarMensajeLogin(
            "Ingrese usuario y contraseña."
        );

        return;

    }


    btnLogin.disabled = true;

    btnLogin.textContent = "Ingresando...";

    mostrarMensajeLogin("");



    try {

        const respuesta =
            await fetch(AUTH_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    usuario: usuario,

                    password: password

                })

            });


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

        passwordLogin.value = "";

        mostrarMensajeLogin("");


        /* =========================================
           MOSTRAR DASHBOARD
        ========================================= */

        mostrarDashboard();


    }
    catch (error) {

        console.error(error);


        mostrarMensajeLogin(
            error.message ||
            "No se pudo iniciar sesión."
        );

    }
    finally {

        btnLogin.disabled = false;

        btnLogin.textContent =
            "Iniciar sesión";

    }

}



/* =========================================================
   MENSAJE LOGIN
========================================================= */

function mostrarMensajeLogin(mensaje) {

    mensajeLogin.textContent = mensaje;

}



/* =========================================================
   CERRAR SESIÓN
========================================================= */

function cerrarSesion() {

    localStorage.removeItem("token");

    localStorage.removeItem("usuario");

    localStorage.removeItem("rol");


    todasLasLecturas = [];

    lecturasFiltradas = [];

    pagina = 1;


    detenerActualizacionEstado();


    mostrarLogin();


    usuarioLogin.value = "";

    passwordLogin.value = "";


    mensajeLogin.textContent = "";

}



/* =========================================================
   HEADERS CON JWT
========================================================= */

function obtenerHeaders() {

    const token =
        localStorage.getItem("token");


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

function manejarRespuesta401(respuesta) {

    if (respuesta.status === 401) {

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
            await fetch(API_URL, {

                method: "GET",

                headers:
                    obtenerHeaders()

            });


        if (manejarRespuesta401(respuesta)) {
            return;
        }


        if (!respuesta.ok) {

            if (respuesta.status === 403) {

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
            [...todasLasLecturas];


        pagina = 1;


        estado.textContent =
            "● Sistema conectado";


        actualizarTarjetas(
            todasLasLecturas
        );


        aplicarFiltros();


    }
    catch (error) {

        console.error(error);


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

function actualizarTarjetas(lecturas) {

    if (
        !lecturas ||
        lecturas.length === 0
    ) {

        document.getElementById(
            "temperatura"
        ).textContent = "-- °C";


        document.getElementById(
            "humedadAmbiental"
        ).textContent = "-- %";


        document.getElementById(
            "humedadSuelo"
        ).textContent = "--";


        document.getElementById(
            "ultimaActualizacion"
        ).textContent = "--";


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


    if (ultima.fechaHora) {

        document.getElementById(
            "ultimaActualizacion"
        ).textContent =
            formatearFecha(
                ultima.fechaHora
            );

    }

}



/* =========================================================
   FILTROS
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
                    contenido.includes(texto);



                /* ==============================
                   FECHA
                ============================== */

                let coincideFecha = true;


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
                        fechaISO === fecha;

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


    tabla.innerHTML = "";


    if (
        lecturasFiltradas.length === 0
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
        (pagina - 1) *
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
   CONTADOR
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
   PAGINACIÓN
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

    if (pagina > 1) {

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


    if (pagina < totalPaginas) {

        pagina++;

        mostrarLecturas();

    }

}



/* =========================================================
   FORMATO DE FECHA
========================================================= */

function formatearFecha(fecha) {

    const fechaObjeto =
        new Date(fecha);


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
            dateStyle: "short",
            timeStyle: "medium"
        }
    );

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

function actualizarEstadoControl(estado) {

    if (!estado) {
        return;
    }

    const automatico =
        estado.modoAutomatico ??
        estado.ModoAutomatico ??
        true;

    // La API devuelve "encendido" / "apagado"
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


    // ==============================
    // MODO
    // ==============================

    document.getElementById(
        "estadoModo"
    ).textContent =
        automatico
            ? "🤖 Automático"
            : "👤 Manual";


    // ==============================
    // VENTILADOR
    // ==============================

    document.getElementById(
        "estadoVentilador"
    ).textContent =
        ventilador
            ? "🟢 Encendido"
            : "🔴 Apagado";


    // ==============================
    // BOMBA
    // ==============================

    document.getElementById(
        "estadoBomba"
    ).textContent =
        bomba
            ? "🟢 Encendida"
            : "🔴 Apagada";


    // ==============================
    // CONTROLES
    // ==============================

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


    // ==============================
    // PERMISOS POR ROL
    // ==============================

    const rol =
        localStorage.getItem("rol");

    const esAdministrador =
        rol === "Administrador";


    // Solo Administrador puede
    // utilizar los controles.
    const permitirControl =
        esAdministrador && !automatico;


    btnVentiladorOn.disabled =
        !permitirControl;

    btnVentiladorOff.disabled =
        !permitirControl;

    btnBombaOn.disabled =
        !permitirControl;

    btnBombaOff.disabled =
        !permitirControl;


    // Los botones de cambio de modo
    // también son exclusivos del administrador.
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
       ACTUALIZAR
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
       FILTRO TEXTO
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
       FILTRO FECHA
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
       CANTIDAD REGISTROS
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
       PAGINACIÓN
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
       VENTILADOR ON
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
       VENTILADOR OFF
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
       BOMBA ON
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
       BOMBA OFF
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

}