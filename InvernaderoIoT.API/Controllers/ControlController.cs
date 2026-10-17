using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using InvernaderoIoT.API.Data;
using InvernaderoIoT.API.Models;

namespace InvernaderoIoT.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ControlController : ControllerBase
    {
        private readonly InvernaderoDbContext _context;

        public ControlController(InvernaderoDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // CONFIGURACIÓN
        // ==========================================

        private const int TIEMPO_MANUAL_SEGUNDOS = 300;


        // ==========================================
        // ESTADO DEL SISTEMA
        // ==========================================

        private static bool modoAutomatico = true;

        private static bool ventiladorEncendido = false;

        private static bool bombaEncendida = false;

        private static DateTime? inicioModoManual = null;

        private static int? idEventoRiegoActual = null;

        private static bool solicitarConfiguracionWifi = false;

        // ==========================================
        // VERIFICAR TIEMPO DEL MODO MANUAL
        // ==========================================

        private static void VerificarTiempoManual()
        {
            if (!modoAutomatico &&
                inicioModoManual.HasValue)
            {
                TimeSpan tiempoTranscurrido =
                    DateTime.Now -
                    inicioModoManual.Value;

                if (tiempoTranscurrido.TotalSeconds >=
                    TIEMPO_MANUAL_SEGUNDOS)
                {
                    modoAutomatico = true;

                    inicioModoManual = null;

                    ventiladorEncendido = false;

                    bombaEncendida = false;
                }
            }
        }


        // ==========================================
        // OBTENER ESTADO
        // ==========================================

        [HttpGet("estado")]
        [AllowAnonymous]
        public IActionResult ObtenerEstado()
        {
            VerificarTiempoManual();

            int segundosRestantes = 0;

            if (!modoAutomatico &&
                inicioModoManual.HasValue)
            {
                TimeSpan transcurrido =
                    DateTime.Now -
                    inicioModoManual.Value;

                segundosRestantes =
                    Math.Max(
                        0,
                        TIEMPO_MANUAL_SEGUNDOS -
                        (int)transcurrido.TotalSeconds
                    );
            }

            return Ok(new
            {
                modoAutomatico = modoAutomatico,

                ventilador =
                    ventiladorEncendido
                    ? "encendido"
                    : "apagado",

                bomba =
                    bombaEncendida
                    ? "encendido"
                    : "apagado",

                segundosRestantes =
                    segundosRestantes,

                solicitarConfiguracionWifi = solicitarConfiguracionWifi
            });
        }


        // ==========================================
        // ACTIVAR MODO AUTOMÁTICO
        // SOLO ADMINISTRADOR
        // ==========================================

        [HttpPost("modo/automatico")]
        [Authorize(Roles = "Administrador")]
        public IActionResult ActivarAutomatico()
        {
            modoAutomatico = true;

            inicioModoManual = null;

            ventiladorEncendido = false;

            bombaEncendida = false;

            return Ok(new
            {
                modoAutomatico = true,

                mensaje =
                    "Modo automático activado"
            });
        }


        // ==========================================
        // ACTIVAR MODO MANUAL
        // SOLO ADMINISTRADOR
        // ==========================================

        [HttpPost("modo/manual")]
        [Authorize(Roles = "Administrador")]
        public IActionResult ActivarManual()
        {
            modoAutomatico = false;

            inicioModoManual =
                DateTime.Now;

            ventiladorEncendido = false;

            bombaEncendida = false;

            return Ok(new
            {
                modoAutomatico = false,

                segundosRestantes =
                    TIEMPO_MANUAL_SEGUNDOS,

                mensaje =
                    "Modo manual activado por 5 minutos"
            });
        }


        // ==========================================
        // VENTILADOR - ENCENDER
        // SOLO ADMINISTRADOR
        // ==========================================

        [HttpPost("ventilador/encender")]
        [Authorize(Roles = "Administrador")]
        public IActionResult EncenderVentilador()
        {
            VerificarTiempoManual();

            if (modoAutomatico)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El sistema está en modo automático."
                });
            }

            ventiladorEncendido = true;

            return Ok(new
            {
                dispositivo = "ventilador",

                estado = "encendido",

                mensaje =
                    "Ventilador encendido"
            });
        }


        // ==========================================
        // VENTILADOR - APAGAR
        // SOLO ADMINISTRADOR
        // ==========================================

        [HttpPost("ventilador/apagar")]
        [Authorize(Roles = "Administrador")]
        public IActionResult ApagarVentilador()
        {
            VerificarTiempoManual();

            if (modoAutomatico)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El sistema está en modo automático."
                });
            }

            ventiladorEncendido = false;

            return Ok(new
            {
                dispositivo = "ventilador",

                estado = "apagado",

                mensaje =
                    "Ventilador apagado"
            });
        }


        // ==========================================
        // BOMBA - ENCENDER
        // SOLO ADMINISTRADOR
        // ==========================================

        [HttpPost("bomba/encender")]
        [Authorize(Roles = "Administrador")]
        public IActionResult EncenderBomba()
        {
            VerificarTiempoManual();

            if (modoAutomatico)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El sistema está en modo automático."
                });
            }

            if (!bombaEncendida)
            {
                bombaEncendida = true;

                CrearEventoRiego();
            }

            return Ok(new
            {
                dispositivo = "bomba",

                estado = "encendido",

                mensaje =
                    "Bomba encendida"
            });
        }


        // ==========================================
        // BOMBA - APAGAR
        // SOLO ADMINISTRADOR
        // ==========================================

        [HttpPost("bomba/apagar")]
        [Authorize(Roles = "Administrador")]
        public IActionResult ApagarBomba()
        {
            VerificarTiempoManual();

            if (modoAutomatico)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El sistema está en modo automático."
                });
            }

            if (bombaEncendida)
            {
                FinalizarEventoRiego();

                bombaEncendida = false;
            }

            return Ok(new
            {
                dispositivo = "bomba",

                estado = "apagado",

                mensaje =
                    "Bomba apagada"
            });
        }

        //==========================================
       // CREAR EVENTO DE RIEGO
       // ==========================================

private void CrearEventoRiego()
        {
            if (idEventoRiegoActual.HasValue)
            {
                return;
            }

            var evento = new EventoRiego
            {
                FechaHoraInicio = DateTime.Now,
                FechaHoraFin = null,
                DuracionSegundos = null,
                ActivadoAutomaticamente = false
            };

            _context.EventosRiego.Add(evento);

            _context.SaveChanges();

            idEventoRiegoActual = evento.IdRiego;
        }


        // ==========================================
        // FINALIZAR EVENTO DE RIEGO
        // ==========================================

        private void FinalizarEventoRiego()
        {
            if (!idEventoRiegoActual.HasValue)
            {
                return;
            }

            var evento = _context.EventosRiego
                .FirstOrDefault(
                    e => e.IdRiego == idEventoRiegoActual.Value
                );

            if (evento != null &&
                !evento.FechaHoraFin.HasValue)
            {
                evento.FechaHoraFin = DateTime.Now;

                evento.DuracionSegundos =
                    (int)(
                        evento.FechaHoraFin.Value -
                        evento.FechaHoraInicio
                    ).TotalSeconds;

                _context.SaveChanges();
            }

            idEventoRiegoActual = null;
        }

        // Solicitar modo de configuración Wi-Fi.
        // Solo administradores pueden solicitarlo.
        [HttpPost("wifi/configurar")]
        [Authorize(Roles = "Administrador")]
        public IActionResult SolicitarConfiguracionWifi()
        {
            solicitarConfiguracionWifi = true;

            return Ok(new
            {
                mensaje = "Solicitud de configuración Wi-Fi enviada."
            });
        }


        // El ESP32 llama a este endpoint cuando termina
        // el proceso de configuración Wi-Fi.
        [HttpPost("wifi/configuracion/completada")]
        [AllowAnonymous]
        public IActionResult ConfiguracionWifiCompletada()
        {
            solicitarConfiguracionWifi = false;

            return Ok(new
            {
                mensaje = "Configuración Wi-Fi finalizada."
            });
        }
    }
}