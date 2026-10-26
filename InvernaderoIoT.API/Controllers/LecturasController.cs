using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InvernaderoIoT.API.Data;
using InvernaderoIoT.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace InvernaderoIoT.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LecturasController : ControllerBase
    {
        private readonly InvernaderoDbContext _context;

        public LecturasController(InvernaderoDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // OBTENER TODAS LAS LECTURAS
        // ==========================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LecturaAmbiental>>> GetLecturas()
        {
            return await _context.LecturasAmbientales
                .OrderByDescending(x => x.FechaHora)
                .ToListAsync();
        }

        // ==========================================
        // ESTADISTICAS DE HOY FRENTE A AYER
        // ==========================================
        [HttpGet("estadisticas/diarias")]
        public async Task<IActionResult> ObtenerEstadisticasDiarias()
        {
            var hoy = DateTime.Today;
            var ayer = hoy.AddDays(-1);

            var lecturas = await _context.LecturasAmbientales
                .Where(x => x.FechaHora >= ayer &&
                            x.FechaHora < hoy.AddDays(1))
                .ToListAsync();

            var datosAyer = Resumir(
                lecturas.Where(x =>
                    x.FechaHora >= ayer && x.FechaHora < hoy));

            var datosHoy = Resumir(
                lecturas.Where(x =>
                    x.FechaHora >= hoy &&
                    x.FechaHora < hoy.AddDays(1)));

            decimal? diferencia =
                datosHoy.TemperaturaPromedio.HasValue &&
                datosAyer.TemperaturaPromedio.HasValue
                    ? datosHoy.TemperaturaPromedio.Value -
                      datosAyer.TemperaturaPromedio.Value
                    : (decimal?)null;

            return Ok(new
            {
                fechaHoy = hoy.ToString("yyyy-MM-dd"),
                hoy = datosHoy,
                ayer = datosAyer,
                diferenciaTemperatura = diferencia
            });
        }

        // ==========================================
        // ESTADISTICAS MENSUALES
        // ==========================================
        [HttpGet("estadisticas/mensuales")]
        public async Task<IActionResult> ObtenerEstadisticasMensuales(
            [FromQuery] int anio,
            [FromQuery] int mes)
        {
            if (anio < 2000 || anio > 2100 ||
                mes < 1 || mes > 12)
            {
                return BadRequest(new
                {
                    mensaje = "El año o el mes seleccionado no es válido."
                });
            }

            var inicio = new DateTime(anio, mes, 1);
            var fin = inicio.AddMonths(1);

            var lecturas = await _context.LecturasAmbientales
                .Where(x => x.FechaHora >= inicio &&
                            x.FechaHora < fin)
                .OrderBy(x => x.FechaHora)
                .ToListAsync();

            var resumen = Resumir(lecturas);

            var porDia = lecturas
                .GroupBy(x => x.FechaHora.Date)
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    fecha = g.Key.ToString("yyyy-MM-dd"),
                    dia = g.Key.Day,
                    cantidadLecturas = g.Count(),
                    temperaturaPromedio =
                        Promedio(g.Select(x => x.Temperatura)),
                    humedadAmbientalPromedio =
                        Promedio(g.Select(x => x.HumedadAmbiental)),
                    humedadSueloPromedio =
                        PromedioEntero(g.Select(x => x.HumedadSuelo))
                })
                .ToList();

            var temperaturas = lecturas
                .Where(x => x.Temperatura.HasValue)
                .Select(x => x.Temperatura.Value)
                .ToList();

            return Ok(new
            {
                anio,
                mes,
                cantidadLecturas = resumen.CantidadLecturas,
                temperaturaPromedio = resumen.TemperaturaPromedio,
                temperaturaMinima = temperaturas.Count > 0
                    ? (decimal?)temperaturas.Min()
                    : null,
                temperaturaMaxima = temperaturas.Count > 0
                    ? (decimal?)temperaturas.Max()
                    : null,
                humedadAmbientalPromedio =
                    resumen.HumedadAmbientalPromedio,
                humedadSueloPromedio =
                    resumen.HumedadSueloPromedio,
                porDia
            });
        }

        // ==========================================
        // OBTENER UNA LECTURA POR ID
        // ==========================================
        [HttpGet("{id}")]
        public async Task<ActionResult<LecturaAmbiental>> GetLectura(int id)
        {
            var lectura = await _context.LecturasAmbientales
                .FindAsync(id);

            if (lectura == null)
            {
                return NotFound();
            }

            return lectura;
        }

        // ==========================================
        // RECIBIR LECTURAS DEL ESP32
        // ==========================================
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<LecturaAmbiental>> CrearLectura(
            [FromBody] LecturaAmbiental lectura)
        {
            if (lectura == null)
            {
                return BadRequest(new
                {
                    mensaje = "No se recibieron datos de la lectura."
                });
            }

            lectura.FechaHora = DateTime.Now;

            _context.LecturasAmbientales.Add(lectura);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetLectura),
                new { id = lectura.IdLectura },
                lectura
            );
        }

        // ==========================================
        // RESUMIR LECTURAS
        // ==========================================
        private static ResumenLecturas Resumir(
            IEnumerable<LecturaAmbiental> origen)
        {
            var datos = origen.ToList();

            return new ResumenLecturas
            {
                CantidadLecturas = datos.Count,
                TemperaturaPromedio =
                    Promedio(datos.Select(x => x.Temperatura)),
                HumedadAmbientalPromedio =
                    Promedio(datos.Select(x => x.HumedadAmbiental)),
                HumedadSueloPromedio =
                    PromedioEntero(datos.Select(x => x.HumedadSuelo))
            };
        }

        private static decimal? Promedio(
            IEnumerable<decimal?> valores)
        {
            var datos = valores
                .Where(x => x.HasValue)
                .Select(x => x.Value)
                .ToList();

            return datos.Count == 0
                ? (decimal?)null
                : Math.Round(datos.Average(), 2);
        }

        private static decimal? PromedioEntero(
            IEnumerable<int?> valores)
        {
            var datos = valores
                .Where(x => x.HasValue)
                .Select(x => (decimal)x.Value)
                .ToList();

            return datos.Count == 0
                ? (decimal?)null
                : Math.Round(datos.Average(), 2);
        }

        // ==========================================
        // CLASE PARA RESUMENES
        // ==========================================
        private class ResumenLecturas
        {
            public int CantidadLecturas { get; set; }

            public decimal? TemperaturaPromedio { get; set; }

            public decimal? HumedadAmbientalPromedio { get; set; }

            public decimal? HumedadSueloPromedio { get; set; }
        }
    }
}