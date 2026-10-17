using System.Linq;
using BCrypt.Net;
using InvernaderoIoT.API.Data;
using InvernaderoIoT.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

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

        [HttpDelete("{id:int}")]
        public IActionResult EliminarUsuario(int id)
        {
            var usuario = _context.Usuarios
                .FirstOrDefault(u => u.IdUsuario == id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "El usuario no existe."
                });
            }

            // Evitar que el administrador elimine su propia cuenta.
            if (string.Equals(
                User.Identity?.Name,
                usuario.UsuarioNombre,
                StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    mensaje = "No puedes eliminar tu propia cuenta."
                });
            }

            _context.Usuarios.Remove(usuario);
            _context.SaveChanges();

            return Ok(new
            {
                mensaje = "Usuario eliminado correctamente."
            });
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
