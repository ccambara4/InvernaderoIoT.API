using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using InvernaderoIoT.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace InvernaderoIoT.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly InvernaderoDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(
            InvernaderoDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var usuario = _context.Usuarios
                .Where(u =>
                    u.UsuarioNombre == request.Usuario &&
                    u.Activo)
                .Select(u => new
                {
                    u.IdUsuario,
                    u.Nombre,
                    u.UsuarioNombre,
                    u.PasswordHash,
                    u.IdRol,
                    NombreRol = u.Rol.NombreRol
                })
                .FirstOrDefault();

            if (usuario == null)
            {
                return Unauthorized(new
                {
                    mensaje = "Usuario o contraseña incorrectos."
                });
            }

            bool contraseñaCorrecta =
                BCrypt.Net.BCrypt.Verify(
                    request.Password,
                    usuario.PasswordHash
                );

            if (!contraseñaCorrecta)
            {
                return Unauthorized(new
                {
                    mensaje = "Usuario o contraseña incorrectos."
                });
            }

            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    usuario.IdUsuario.ToString()
                ),

                new Claim(
                    ClaimTypes.Name,
                    usuario.Nombre
                ),

                new Claim(
                    ClaimTypes.Role,
                    usuario.NombreRol
                )
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"]
                )
            );

            var credentials =
                new SigningCredentials(
                    key,
                    SecurityAlgorithms.HmacSha256
                );

            var expiration =
                DateTime.UtcNow.AddMinutes(
                    Convert.ToDouble(
                        _configuration["Jwt:ExpirationMinutes"]
                    )
                );

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: expiration,
                signingCredentials: credentials
            );

            return Ok(new
            {
                mensaje = "Inicio de sesión correcto.",

                token = new JwtSecurityTokenHandler()
                    .WriteToken(token),

                usuario = usuario.Nombre,

                rol = usuario.NombreRol,

                expiracion = expiration
            });
        }

       
    }

    public class LoginRequest
    {
        public string Usuario { get; set; }

        public string Password { get; set; }
    }

   

    
}
