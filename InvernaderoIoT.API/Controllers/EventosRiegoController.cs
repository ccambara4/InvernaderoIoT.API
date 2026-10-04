using System;
using System.Linq;
using InvernaderoIoT.API.Data;
using InvernaderoIoT.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvernaderoIoT.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventosRiegoController : ControllerBase
    {
        private readonly InvernaderoDbContext _context;

        public EventosRiegoController(InvernaderoDbContext context)
        {
            _context = context;
        }


        // ==========================================
        // OBTENER EVENTOS DE RIEGO
        // ==========================================

        [HttpGet]
        [Authorize]
        public IActionResult ObtenerEventos()
        {
            var eventos = _context.EventosRiego
                .OrderByDescending(e => e.FechaHoraInicio)
                .ToList();

            return Ok(eventos);
        }


        // ==========================================
        // OBTENER UN EVENTO
        // ==========================================

        [HttpGet("{id}")]
        [Authorize]
        public IActionResult ObtenerEvento(int id)
        {
            var evento = _context.EventosRiego
                .FirstOrDefault(e => e.IdRiego == id);

            if (evento == null)
            {
                return NotFound(new
                {
                    mensaje = "El evento de riego no existe."
                });
            }

            return Ok(evento);
        }


        // ==========================================
        // INICIAR EVENTO DE RIEGO
        // ==========================================

        [HttpPost("iniciar")]
        [Authorize(Roles = "Administrador")]
        public IActionResult IniciarRiego(
            [FromBody] IniciarRiegoRequest request)
        {
            var evento = new EventoRiego
            {
                FechaHoraInicio = DateTime.Now,
                FechaHoraFin = null,
                DuracionSegundos = null,
                ActivadoAutomaticamente =
                    request.ActivadoAutomaticamente
            };

            _context.EventosRiego.Add(evento);

            _context.SaveChanges();

            return Ok(new
            {
                mensaje = "Evento de riego iniciado.",
                idRiego = evento.IdRiego,
                fechaHoraInicio = evento.FechaHoraInicio,
                activadoAutomaticamente =
                    evento.ActivadoAutomaticamente
            });
        }


        // ==========================================
        // FINALIZAR EVENTO DE RIEGO
        // ==========================================

        [HttpPost("finalizar/{id}")]
        [Authorize(Roles = "Administrador")]
        public IActionResult FinalizarRiego(int id)
        {
            var evento = _context.EventosRiego
                .FirstOrDefault(e => e.IdRiego == id);

            if (evento == null)
            {
                return NotFound(new
                {
                    mensaje = "El evento de riego no existe."
                });
            }

            if (evento.FechaHoraFin.HasValue)
            {
                return BadRequest(new
                {
                    mensaje = "El evento de riego ya fue finalizado."
                });
            }

            evento.FechaHoraFin = DateTime.Now;

            evento.DuracionSegundos =
                (int)(
                    evento.FechaHoraFin.Value -
                    evento.FechaHoraInicio
                ).TotalSeconds;

            _context.SaveChanges();

            return Ok(new
            {
                mensaje = "Evento de riego finalizado.",
                idRiego = evento.IdRiego,
                fechaHoraInicio = evento.FechaHoraInicio,
                fechaHoraFin = evento.FechaHoraFin,
                duracionSegundos =
                    evento.DuracionSegundos
            });
        }

        // ==========================================
        // INICIAR RIEGO DESDE EL DISPOSITIVO
        // ==========================================

        [HttpPost("dispositivo/iniciar")]
        [AllowAnonymous]
        public IActionResult IniciarRiegoDispositivo()
        {
            var evento = new EventoRiego
            {
                FechaHoraInicio = DateTime.Now,
                FechaHoraFin = null,
                DuracionSegundos = null,
                ActivadoAutomaticamente = true
            };

            _context.EventosRiego.Add(evento);

            _context.SaveChanges();

            return Ok(new
            {
                mensaje = "Riego automático iniciado.",
                idRiego = evento.IdRiego,
                fechaHoraInicio = evento.FechaHoraInicio
            });
        }


        // ==========================================
        // FINALIZAR RIEGO DESDE EL DISPOSITIVO
        // ==========================================

        [HttpPost("dispositivo/finalizar/{id}")]
        [AllowAnonymous]
        public IActionResult FinalizarRiegoDispositivo(int id)
        {
            var evento = _context.EventosRiego
                .FirstOrDefault(e => e.IdRiego == id);

            if (evento == null)
            {
                return NotFound(new
                {
                    mensaje = "El evento de riego no existe."
                });
            }

            if (evento.FechaHoraFin.HasValue)
            {
                return BadRequest(new
                {
                    mensaje = "El evento de riego ya fue finalizado."
                });
            }

            evento.FechaHoraFin = DateTime.Now;

            evento.DuracionSegundos =
                (int)(
                    evento.FechaHoraFin.Value -
                    evento.FechaHoraInicio
                ).TotalSeconds;

            _context.SaveChanges();

            return Ok(new
            {
                mensaje = "Riego automático finalizado.",
                idRiego = evento.IdRiego,
                fechaHoraInicio = evento.FechaHoraInicio,
                fechaHoraFin = evento.FechaHoraFin,
                duracionSegundos = evento.DuracionSegundos
            });
        }
    }


    // ==========================================
    // SOLICITUD PARA INICIAR RIEGO
    // ==========================================

    public class IniciarRiegoRequest
    {
        public bool ActivadoAutomaticamente { get; set; }
    }

    
}
