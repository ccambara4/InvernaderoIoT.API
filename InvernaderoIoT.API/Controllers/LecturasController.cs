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
        // OBTENER UNA LECTURA POR ID
        // ==========================================

        [HttpGet("{id}")]
        public async Task<ActionResult<LecturaAmbiental>> GetLectura(int id)
        {
            var lectura =
                await _context.LecturasAmbientales
                    .FindAsync(id);


            if (lectura == null)
            {
                return NotFound();
            }


            return lectura;
        }


        // ==========================================
        // CREAR UNA LECTURA
        // ==========================================

        [HttpPost]
        public async Task<ActionResult<LecturaAmbiental>> CrearLectura(
            LecturaAmbiental lectura)
        {
            lectura.FechaHora =
                System.DateTime.Now;


            _context.LecturasAmbientales.Add(
                lectura
            );


            await _context.SaveChangesAsync();


            return CreatedAtAction(
                nameof(GetLectura),
                new
                {
                    id = lectura.IdLectura
                },
                lectura
            );
        }
    }
}