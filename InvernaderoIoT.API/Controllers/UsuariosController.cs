using System.Linq;
using BCrypt.Net;
using InvernaderoIoT.API.Data;
using InvernaderoIoT.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvernaderoIoT.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador")]
    public class UsuariosController : ControllerBase
    {
        private readonly InvernaderoDbContext _context;

        public UsuariosController(InvernaderoDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public IActionResult CrearUsuario(
            [FromBody] CrearUsuarioRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre) ||
                string.IsNullOrWhiteSpace(request.Usuario) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    mensaje = "Todos los campos son obligatorios."
                });
            }

            bool usuarioExiste =
                _context.Usuarios.Any(
                    u => u.UsuarioNombre == request.Usuario
                );

            if (usuarioExiste)
            {
                return BadRequest(new
                {
                    mensaje = "El nombre de usuario ya existe."
                });
            }

            var rol = _context.Roles
                .FirstOrDefault(r => r.IdRol == request.IdRol);

            if (rol == null)
            {
                return BadRequest(new
                {
                    mensaje = "El rol indicado no existe."
                });
            }

            string passwordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password
                );

            var usuario = new Usuario
            {
                Nombre = request.Nombre,
                UsuarioNombre = request.Usuario,
                PasswordHash = passwordHash,
                IdRol = request.IdRol,
                Activo = true
            };

            _context.Usuarios.Add(usuario);
            _context.SaveChanges();

            return Ok(new
            {
                mensaje = "Usuario creado correctamente.",
                idUsuario = usuario.IdUsuario,
                nombre = usuario.Nombre,
                usuario = usuario.UsuarioNombre,
                rol = rol.NombreRol
            });
        }

        [HttpGet]
        public IActionResult ObtenerUsuarios()
        {
            var usuarios = _context.Usuarios
                .Select(u => new
                {
                    u.IdUsuario,
                    u.Nombre,
                    Usuario = u.UsuarioNombre,
                    u.IdRol,
                    Rol = u.Rol.NombreRol,
                    u.Activo
                })
                .ToList();

            return Ok(usuarios);
        }
    }

    public class CrearUsuarioRequest
    {
        public string Nombre { get; set; }

        public string Usuario { get; set; }

        public string Password { get; set; }

        public int IdRol { get; set; }
    }
}
